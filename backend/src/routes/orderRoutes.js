const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validations/orderValidation');

// Authenticated Customer endpoints
router.post(
  '/',
  verifyToken,
  authorize('customer', 'admin'),
  validate(createOrderSchema),
  orderController.createOrder
);

router.get(
  '/my-orders',
  verifyToken,
  authorize('customer', 'admin'),
  orderController.getMyOrders
);

// Admin order listing
router.get(
  '/',
  verifyToken,
  authorize('admin'),
  orderController.getAllOrders
);

// Single order view (Customer can view their own; Admin can view any)
router.get(
  '/:id',
  verifyToken,
  orderController.getOrderById
);

// Customer or Admin cancel order
router.post(
  '/:id/cancel',
  verifyToken,
  orderController.cancelOrder
);

// Admin update order status
router.patch(
  '/:id/status',
  verifyToken,
  authorize('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
