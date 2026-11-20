const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().pattern(objectIdPattern).required().messages({
          'string.pattern.base': 'productId must be a valid ObjectId',
          'any.required': 'productId is required',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Items are required',
    }),
  shippingAddress: Joi.object({
    fullName: Joi.string().trim().required().messages({
      'any.required': 'Full name is required',
    }),
    phone: Joi.string().trim().required().messages({
      'any.required': 'Phone number is required',
    }),
    street: Joi.string().trim().required().messages({
      'any.required': 'Street address is required',
    }),
    addressLine2: Joi.string().trim().allow('', null).optional(),
    city: Joi.string().trim().required().messages({
      'any.required': 'City is required',
    }),
    state: Joi.string().trim().required().messages({
      'any.required': 'State is required',
    }),
    zipCode: Joi.string().trim().required().messages({
      'any.required': 'ZIP/Postal code is required',
    }),
    country: Joi.string().trim().default('India'),
  }).required(),
  paymentMethod: Joi.string().valid('COD', 'Online', 'Card', 'Mock_Payment').default('COD'),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
    .required()
    .messages({
      'any.required': 'Order status is required',
    }),
  note: Joi.string().trim().allow('', null).optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
