const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('customer').default('customer'),
  phone: Joi.string().trim().allow('', null).optional(),
  guestId: Joi.string().trim().allow('', null).optional(),
  guestToken: Joi.string().trim().allow('', null).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
  guestId: Joi.string().trim().allow('', null).optional(),
  guestToken: Joi.string().trim().allow('', null).optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().allow('', null).optional(),
  addresses: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      fullName: Joi.string().trim().allow('', null).optional(),
      phone: Joi.string().trim().allow('', null).optional(),
      street: Joi.string().trim().required(),
      addressLine2: Joi.string().trim().allow('', null).optional(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      zipCode: Joi.string().trim().required(),
      country: Joi.string().trim().default('India'),
      isDefault: Joi.boolean().default(false),
    })
  ).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};
