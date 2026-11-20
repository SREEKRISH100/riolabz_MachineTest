const Joi = require('joi');

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive status boolean is required',
  }),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('customer', 'admin').required().messages({
    'any.required': 'Role is required (customer or admin)',
  }),
});

const queryUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow('', null).optional(),
  role: Joi.string().valid('customer', 'admin', '').optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  updateStatusSchema,
  updateRoleSchema,
  queryUsersSchema,
};
