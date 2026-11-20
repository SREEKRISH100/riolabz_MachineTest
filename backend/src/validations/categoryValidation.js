const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Category name is required',
  }),
  description: Joi.string().trim().allow('', null).optional(),
  parentId: Joi.string().pattern(objectIdPattern).allow(null, '').optional().messages({
    'string.pattern.base': 'parentId must be a valid MongoDB ObjectId',
  }),
  image: Joi.string().trim().allow('', null).optional(),
  isActive: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().allow('', null).optional(),
  parentId: Joi.string().pattern(objectIdPattern).allow(null, '').optional().messages({
    'string.pattern.base': 'parentId must be a valid MongoDB ObjectId',
  }),
  image: Joi.string().trim().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
