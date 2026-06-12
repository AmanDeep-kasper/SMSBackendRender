// validators/forgotValidator.js
// const Joi = require('joi');
import Joi from "joi";

// const emailVerifySchema = Joi.object({
export const emailVerifySchema = Joi.object({
  email: Joi.string().email().required()
});

// const verifyOtpSchema = Joi.object({
export const verifyOtpSchema = Joi.object({
  userId: Joi.string().required(),
  otp: Joi.string().length(4).required()
});

// const resetPasswordSchema = Joi.object({
export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

// module.exports = {
//   emailVerifySchema,
//   verifyOtpSchema,
//   resetPasswordSchema
// };