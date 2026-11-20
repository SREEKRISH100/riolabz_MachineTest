const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validations/categoryValidation');

// Public endpoints
router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);

// Admin-only endpoints
router.post(
  '/',
  verifyToken,
  authorize('admin'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  verifyToken,
  authorize('admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  verifyToken,
  authorize('admin'),
  categoryController.deleteCategory
);

module.exports = router;
