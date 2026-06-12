// // routes/forgotPasswordRoute.js
// const express = require("express");
// const router = express.Router();
// const { validate } = require("../validators/studentValidator");
// const { emailVerifySchema, verifyOtpSchema, resetPasswordSchema } = require("../validators/forgotValidator");
// const {
//   emailVerify,
//   sendOtp,
//   verifyOtp,
//   resetPassword,
//   checkResetSession,
// } = require("../controllers/forgotPasswordController");

// const { 
//   otpSendLimiter, 
//   otpVerifyLimiter, 
//   passwordResetLimiter  // Make sure this is exported from rateLimiter
// } = require("../middleware/rateLimiter");
// ❌ OLD
// const express = require("express");

import express from "express"; // ✅ ES Module

const router = express.Router();

// ❌ OLD
// const { validate } = require("../validators/studentValidator");

import { validate } from "../validators/studentValidator.js"; // ✅

// ❌ OLD
// const { emailVerifySchema, verifyOtpSchema, resetPasswordSchema } = require("../validators/forgotValidator");

import {
  emailVerifySchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validators/forgotValidator.js"; // ✅

// ❌ OLD
// const { emailVerify, sendOtp, verifyOtp, resetPassword, checkResetSession } = require("../controllers/forgotPasswordController");

import {
  emailVerify,
  sendOtp,
  verifyOtp,
  resetPassword,
  checkResetSession,
} from "../controllers/forgotPasswordController.js"; // ✅

// ❌ OLD
// const { otpSendLimiter, otpVerifyLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");

import {
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiter.js"; // ✅


router.post("/verify_email", validate(emailVerifySchema), emailVerify);
router.post("/send_otp/:id", otpSendLimiter, sendOtp);
router.post("/verify_otp", otpVerifyLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/reset_password", passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.get("/check-session", checkResetSession);

// module.exports = router;
// ❌ OLD
// module.exports = router;

export default router; // ✅ ES Module export