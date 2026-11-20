const ApiError = require('../utils/ApiError');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message.replace(/['"]/g, ''));
      return next(ApiError.badRequest(errorMessages[0], errorMessages));
    }

    // Replace request payload with validated & stripped data
    req[property] = value;
    next();
  };
};

module.exports = validate;
