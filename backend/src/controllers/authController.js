const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { mergeGuestCartHelper } = require('./cartController');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'super_secret_jwt_key_testround_2026_midlevel_dev',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper to extract guestId from headers, cookies, or body
const extractGuestId = (req) => {
  if (req.body && req.body.guestId) return req.body.guestId;
  const guestToken =
    (req.body && req.body.guestToken) ||
    req.headers['x-guest-token'] ||
    (req.cookies && req.cookies.guest_token);

  if (guestToken) {
    try {
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_testround_2026_midlevel_dev';
      const decoded = jwt.verify(guestToken, secret);
      return decoded.guestId;
    } catch (e) {}
  }
  return null;
};

// POST /api/auth/register (Public customer registration)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  // Strictly enforce customer role for public registration to prevent privilege escalation
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'customer',
    phone: phone || '',
  });

  const token = generateToken(user);

  // Automatically merge guest cart if guest session was active
  const guestId = extractGuestId(req);
  let cartMerged = false;
  if (guestId) {
    try {
      await mergeGuestCartHelper(user._id, guestId);
      cartMerged = true;
    } catch (cartErr) {
      console.warn('Auto cart merge on register notice:', cartErr.message);
    }
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (cartMerged) {
    res.clearCookie('guest_token');
  }

  return ApiResponse.created(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    },
    token,
    cartMerged,
  }, 'User registered successfully');
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const token = generateToken(user);

  // Automatically merge guest cart if guest session was active
  const guestId = extractGuestId(req);
  let cartMerged = false;
  if (guestId) {
    try {
      await mergeGuestCartHelper(user._id, guestId);
      cartMerged = true;
    } catch (cartErr) {
      console.warn('Auto cart merge on login notice:', cartErr.message);
    }
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (cartMerged) {
    res.clearCookie('guest_token');
  }

  return ApiResponse.success(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      addresses: user.addresses,
    },
    token,
    cartMerged,
  }, 'Login successful');
});

// GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, 'Profile fetched successfully');
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (addresses !== undefined) user.addresses = addresses;

  await user.save();

  return ApiResponse.success(res, { user }, 'Profile updated successfully');
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password does not match');
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, null, 'Password changed successfully');
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return ApiResponse.success(res, null, 'Logout successful');
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
