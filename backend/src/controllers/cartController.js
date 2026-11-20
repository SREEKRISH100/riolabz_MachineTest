const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper to get or create cart
const getOrCreateCart = async (req) => {
  let cart = null;
  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
  } else if (req.guestId) {
    cart = await Cart.findOne({ guestId: req.guestId });
    if (!cart) {
      cart = await Cart.create({ guestId: req.guestId, items: [] });
    }
  }
  return cart;
};

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req);
  if (!cart) {
    return ApiResponse.success(res, { items: [], totalAmount: 0 }, 'Cart is empty');
  }

  const populatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name sku price salePrice stock images status',
  });

  // Calculate live total and remove products that may have been deleted
  let totalAmount = 0;
  const validItems = [];

  for (const item of populatedCart.items) {
    if (item.product && item.product.status === 'active') {
      const activePrice =
        item.product.salePrice !== null && item.product.salePrice !== undefined && item.product.salePrice < item.product.price
          ? item.product.salePrice
          : item.product.price;

      totalAmount += activePrice * item.quantity;
      validItems.push({
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        price: activePrice,
        subtotal: activePrice * item.quantity,
      });
    }
  }

  return ApiResponse.success(
    res,
    {
      items: validItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      itemCount: validItems.reduce((acc, curr) => acc + curr.quantity, 0),
      guestToken: req.generatedGuestToken || null,
    },
    'Cart retrieved successfully'
  );
});

// POST /api/cart/items
const addToCart = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'admin') {
    throw ApiError.forbidden('Administrators cannot add items to cart. Shopping is restricted to customer accounts.');
  }

  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') {
    throw ApiError.notFound('Product not found or unavailable');
  }

  const cart = await getOrCreateCart(req);
  const existingItemIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId.toString()
  );

  const currentQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
  const newQty = currentQty + parseInt(quantity, 10);

  if (newQty > product.stock) {
    throw ApiError.badRequest(
      `Cannot add more items than available in stock. Maximum available: ${product.stock}`
    );
  }

  const activePrice =
    product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.price
      ? product.salePrice
      : product.price;

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity = newQty;
    cart.items[existingItemIndex].price = activePrice;
  } else {
    cart.items.push({
      product: product._id,
      quantity: newQty,
      price: activePrice,
    });
  }

  await cart.save();

  return getCart(req, res);
});

// PUT /api/cart/items/:productId
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const qty = parseInt(quantity, 10);
  if (qty <= 0) {
    throw ApiError.badRequest('Quantity must be greater than 0');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (qty > product.stock) {
    throw ApiError.badRequest(
      `Cannot set quantity to ${qty}. Maximum available stock: ${product.stock}`
    );
  }

  const cart = await getOrCreateCart(req);
  const itemIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw ApiError.notFound('Item not in cart');
  }

  cart.items[itemIndex].quantity = qty;
  await cart.save();

  return getCart(req, res);
});

// DELETE /api/cart/items/:productId
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId.toString());
  await cart.save();

  return getCart(req, res);
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req);
  cart.items = [];
  await cart.save();

  return ApiResponse.success(res, { items: [], totalAmount: 0 }, 'Cart cleared');
});

// Helper to merge guest cart into user cart
const mergeGuestCartHelper = async (userId, guestId) => {
  if (!userId || !guestId) return null;

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return null;
  }

  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    userCart = await Cart.create({ userId, items: [] });
  }

  for (const gItem of guestCart.items) {
    const existingIndex = userCart.items.findIndex(
      (uItem) => uItem.product.toString() === gItem.product.toString()
    );

    if (existingIndex > -1) {
      userCart.items[existingIndex].quantity += gItem.quantity;
    } else {
      userCart.items.push({
        product: gItem.product,
        quantity: gItem.quantity,
        price: gItem.price,
      });
    }
  }

  await userCart.save();
  await Cart.findByIdAndDelete(guestCart._id);

  return userCart;
};

// POST /api/cart/merge (Merges guest cart items into authenticated user cart upon login/registration)
const mergeCart = asyncHandler(async (req, res) => {
  let guestId = req.body.guestId;

  if (!guestId) {
    const guestToken =
      req.body.guestToken ||
      req.headers['x-guest-token'] ||
      (req.cookies && req.cookies.guest_token);

    if (guestToken) {
      try {
        const secret =
          process.env.JWT_SECRET || 'super_secret_jwt_key_testround_2026_midlevel_dev';
        const decoded = jwt.verify(guestToken, secret);
        guestId = decoded.guestId;
      } catch (e) {}
    }
  }

  if (!guestId || !req.user) {
    return ApiResponse.success(res, null, 'No merge performed');
  }

  const userCart = await mergeGuestCartHelper(req.user._id, guestId);
  return ApiResponse.success(res, userCart, 'Cart merged successfully');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  mergeGuestCartHelper,
};
