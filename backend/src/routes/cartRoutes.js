const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { guestAuth } = require('../middlewares/guestAuth');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(guestAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:productId', cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

// Merge guest cart on login
router.post('/merge', verifyToken, cartController.mergeCart);

module.exports = router;
