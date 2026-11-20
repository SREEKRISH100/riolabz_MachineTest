const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  updateStatusSchema,
  updateRoleSchema,
  queryUsersSchema,
} = require('../validations/userValidation');

// All user management routes require admin role
router.use(verifyToken, authorize('admin'));

router.get('/', validate(queryUsersSchema, 'query'), userController.getUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateUserStatus);
router.patch('/:id/role', validate(updateRoleSchema), userController.updateUserRole);

module.exports = router;
