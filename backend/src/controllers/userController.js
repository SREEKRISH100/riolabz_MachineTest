const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(res, users, 'Users fetched successfully', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
});

// GET /api/users/:id (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, 'User details fetched successfully');
});

// PATCH /api/users/:id/status (Admin only - activate/deactivate)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw ApiError.badRequest('isActive must be a boolean (true or false)');
  }

  // Prevent admin from deactivating their own account
  if (req.user._id.toString() === req.params.id && !isActive) {
    throw ApiError.badRequest('Admins cannot deactivate their own account');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const actionText = isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(res, { user }, `User has been successfully ${actionText}`);
});

// PATCH /api/users/:id/role (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Prevent admin from revoking their own admin status
  if (req.user._id.toString() === req.params.id && role !== 'admin') {
    throw ApiError.badRequest('You cannot demote your own admin account');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, `User role updated to ${role}`);
});

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
};
