// validators/authValidator.js
// const Joi = require('joi');
import Joi from "joi";

// Validation middleware wrapper
// const validate = (schema) => {
  export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    req.body = value;
    next();
  };
};

// const loginSchema = Joi.object({
export const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).messages({
    'string.empty': 'Username/Email/Student ID is required',
    'string.min': 'Username must be at least 3 characters'
  }),
  password: Joi.string().required().min(6).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  deviceId: Joi.string().optional(),
  deviceInfo: Joi.string().optional(),
  rememberMe: Joi.boolean().default(false)
});

// const otpVerifySchema = Joi.object({
export const otpVerifySchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  deviceId: Joi.string().optional(),
  deviceInfo: Joi.string().optional(),
  rememberMe: Joi.boolean().default(false)
});

// const resendOtpSchema = Joi.object({
  export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required()
});

// const changePasswordSchema = Joi.object({
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

// module.exports = {
//   loginSchema,
//   otpVerifySchema,
//   resendOtpSchema,
//   changePasswordSchema,
//   validate  // ✅ Make sure validate is exported
// };