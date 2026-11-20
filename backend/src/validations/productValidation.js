const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': 'Product name is required',
  }),
  sku: Joi.string().trim().uppercase().required().messages({
    'any.required': 'Product SKU is required',
  }),
  description: Joi.string().trim().required().messages({
    'any.required': 'Product description is required',
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'Product regular price is required',
  }),
  salePrice: Joi.number().min(0).allow(null).optional(),
  stock: Joi.number().integer().min(0).required().messages({
    'any.required': 'Product stock quantity is required',
  }),
  category: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
    'any.required': 'Category ID is required',
  }),
  status: Joi.string().valid('active', 'inactive').default('active'),
  images: Joi.array().items(Joi.string().trim()).optional().default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  sku: Joi.string().trim().uppercase().optional(),
  description: Joi.string().trim().optional(),
  price: Joi.number().min(0).optional(),
  salePrice: Joi.number().min(0).allow(null).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
  }),
  status: Joi.string().valid('active', 'inactive').optional(),
  images: Joi.array().items(Joi.string().trim()).optional(),
});

const queryProductsSchema = Joi.object({
  search: Joi.string().trim().allow('', null).optional(),
  category: Joi.string().trim().allow('', null).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sort: Joi.string()
    .valid(
      'newest',
      'oldest',
      'price_asc',
      'price_desc',
      'name_asc',
      'name_desc'
    )
    .default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  status: Joi.string().valid('active', 'inactive', 'all').optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
};
