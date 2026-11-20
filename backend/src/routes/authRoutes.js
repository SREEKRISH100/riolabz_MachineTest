const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { authLimiter } = require('../middlewares/rateLimiterMiddleware');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validations/authValidation');

// Authentication endpoints protected by strict login rate limiter (brute-force defense)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected profile routes
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
