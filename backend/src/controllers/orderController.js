const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper to generate readable unique order numbers
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

// Valid state transitions
const validTransitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

// POST /api/orders (Authenticated Customer)
const createOrder = asyncHandler(async (req, res) => {
  // Restrict ordering to customer accounts only
  if (req.user && req.user.role === 'admin') {
    throw ApiError.forbidden('Administrators cannot place orders. Product purchasing is restricted to customer accounts.');
  }

  const { items, shippingAddress, paymentMethod = 'COD' } = req.body;
  const customerId = req.user._id;

  if (!items || items.length === 0) {
    throw ApiError.badRequest('Order must contain at least one item');
  }

  // 1. Fetch products & validate stock and active status
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let itemsSubtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw ApiError.badRequest(`Product with ID '${item.productId}' not found`);
    }

    if (product.status !== 'active') {
      throw ApiError.badRequest(`Product '${product.name}' is currently unavailable`);
    }

    if (product.stock < item.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}`
      );
    }

    // Backend calculation: always determine unit price from database
    const unitPrice =
      product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.price
        ? product.salePrice
        : product.price;

    const subtotal = unitPrice * item.quantity;
    itemsSubtotal += subtotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price: unitPrice,
      quantity: item.quantity,
      subtotal,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
    });
  }

  // 2. Perform atomic stock reduction for all items
  const decrementedProducts = [];
  try {
    for (const item of orderItems) {
      // Atomic condition: only decrement if current stock is still >= requested quantity
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Stock concurrency conflict: insufficient stock for '${item.name}'`);
      }

      decrementedProducts.push({ productId: item.product, quantity: item.quantity });
    }
  } catch (stockError) {
    // Rollback already decremented products in case of any concurrent depletion
    for (const dec of decrementedProducts) {
      await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.quantity } });
    }
    throw ApiError.badRequest(stockError.message || 'Failed to reserve product stock');
  }

  // 3. Compute tax and total amounts
  const taxRate = 0.05; // 5% GST/Tax
  const tax = Math.round(itemsSubtotal * taxRate * 100) / 100;
  const shippingFee = itemsSubtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
  const totalAmount = Math.round((itemsSubtotal + tax + shippingFee) * 100) / 100;

  // 4. Create Order
  const isPaid = paymentMethod !== 'COD';
  const initialStatus = 'Confirmed';
  const paymentStatus = isPaid ? 'Paid' : 'Pending';

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    items: orderItems,
    itemsSubtotal,
    tax,
    shippingFee,
    totalAmount,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    status: initialStatus,
    statusHistory: [
      {
        status: 'Pending',
        timestamp: new Date(Date.now() - 500),
        updatedBy: customerId,
        note: 'Order placed by customer',
      },
      {
        status: 'Confirmed',
        timestamp: new Date(),
        updatedBy: customerId,
        note: isPaid
          ? 'Payment processed successfully. Order confirmed!'
          : 'Order placed with Cash on Delivery and confirmed.',
      },
    ],
  });

  return ApiResponse.created(res, order, 'Order placed successfully');
});

// GET /api/orders/my-orders (Customer only)
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [total, orders] = await Promise.all([
    Order.countDocuments({ customer: req.user._id }),
    Order.find({ customer: req.user._id })
      .populate('items.product', 'name images sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(res, orders, 'Orders fetched successfully', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
});

// GET /api/orders/:id (Customer own order or Admin)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'name images sku price salePrice')
    .populate('statusHistory.updatedBy', 'name role');

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Ensure customer can only view their own order
  if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not authorized to view this order');
  }

  return ApiResponse.success(res, order, 'Order details fetched successfully');
});

// GET /api/orders (Admin only - List all orders)
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(res, orders, 'All orders fetched successfully', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
});

// PATCH /api/orders/:id/status (Admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const orderId = req.params.id;

  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Validate state transition
  const allowedNextStatuses = validTransitions[order.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    throw ApiError.badRequest(
      `Invalid order status transition from '${order.status}' to '${status}'. Allowed: ${
        allowedNextStatuses.join(', ') || 'None (terminal status)'
      }`
    );
  }

  // If status is changed to 'Cancelled', automatically restore stock!
  if (status === 'Cancelled' && order.status !== 'Cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  order.status = status;
  if (status === 'Delivered') {
    order.paymentStatus = 'Paid';
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy: req.user._id,
    note: note || `Status updated to ${status} by admin`,
  });

  await order.save();

  const populated = await Order.findById(order._id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'name images');

  return ApiResponse.success(res, populated, `Order status successfully updated to '${status}'`);
});

// POST /api/orders/:id/cancel (Customer can cancel their own order; Admin can cancel any)
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason = 'Cancelled by customer' } = req.body;
  const orderId = req.params.id;

  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Check authorization: Customer can only cancel their own order; Admin can cancel any
  if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not authorized to cancel this order');
  }

  // Check cancellation eligibility
  if (order.status === 'Shipped') {
    throw ApiError.badRequest(
      'This order has already been shipped and handed over to the courier delivery partner. Customers cannot cancel an order once shipped. You may initiate a return or exchange after delivery.'
    );
  }

  const nonCancellableStatuses = ['Delivered', 'Cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    throw ApiError.badRequest(
      `Cannot cancel order with status '${order.status}'. Orders that are ${order.status.toLowerCase()} cannot be cancelled.`
    );
  }

  // 1. Atomically restore reserved stock for each item in the order
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  // 2. Update order status and refund payment if paid
  order.status = 'Cancelled';
  order.cancellationReason = reason;

  if (order.paymentStatus === 'Paid') {
    order.paymentStatus = 'Refunded';
  }

  const actor = req.user.role === 'admin' ? 'Administrator' : 'Customer';
  order.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    updatedBy: req.user._id,
    note: `Order cancelled by ${actor}. Reason: ${reason}. Reserved stock refunded to inventory.${
      order.paymentStatus === 'Refunded' ? ' Refund initiated.' : ''
    }`,
  });

  await order.save();

  const populated = await Order.findById(order._id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'name images');

  return ApiResponse.success(res, populated, 'Order cancelled successfully and stock refunded');
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
