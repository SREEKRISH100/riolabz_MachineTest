const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
} = require('../validations/productValidation');

// Optional auth middleware for getProducts to detect if caller is admin
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.cookies?.token;

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_testround_2026_midlevel_dev'
      );
      req.user = decoded;
    } catch (e) {
      // Ignore invalid token on optional auth
    }
  }
  next();
};

// Public endpoints
router.get('/', optionalAuth, validate(queryProductsSchema, 'query'), productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin-only endpoints
router.post(
  '/',
  verifyToken,
  authorize('admin'),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  verifyToken,
  authorize('admin'),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  verifyToken,
  authorize('admin'),
  productController.deleteProduct
);

module.exports = router;
