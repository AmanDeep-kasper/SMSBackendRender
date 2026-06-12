// const express = require("express");
// const router = express.Router();
// const RefreshToken = require("../models/RefreshToken")
// const { validate } = require("../validators/studentValidator");
// const {loginSchema, otpVerifySchema, resendOtpSchema } = require("../validators/authValidator");

// const {
//   loginUser,
//   logoutUser,
//   logDevice,
//   getMe,
//   verifyotp,
//   resendOtp,
//   toggleTwoFactor,
//   refreshToken,  //for refresh token
// } = require("../controllers/authController");

// const { authMiddleware } = require("../middleware/auth");
// const {loginLimiter, otpSendLimiter, otpVerifyLimiter} = require("../middleware/rateLimiter");
// ❌ OLD (CommonJS)
// const express = require("express");

import express from "express"; // ✅ ES Module

const router = express.Router();

// ❌ OLD
// const RefreshToken = require("../models/RefreshToken")

import RefreshToken from "../models/RefreshToken.js"; // ✅ add .js

// ❌ OLD
// const { validate } = require("../validators/studentValidator");

import { validate } from "../validators/studentValidator.js"; // ✅

// ❌ OLD
// const { loginSchema, otpVerifySchema, resendOtpSchema } = require("../validators/authValidator");

import {
  loginSchema,
  otpVerifySchema,
  resendOtpSchema,
} from "../validators/authValidator.js"; // ✅

// ❌ OLD
// const { loginUser, logoutUser, ... } = require("../controllers/authController");

import {
  loginUser,
  logoutUser,
  logDevice,
  getMe,
  verifyotp,
  resendOtp,
  toggleTwoFactor,
  refreshToken,
} from "../controllers/authController.js"; // ✅

// ❌ OLD
// const { authMiddleware } = require("../middleware/auth");

import { authMiddleware } from "../middleware/auth.js"; // ✅

// ❌ OLD
// const { loginLimiter, otpSendLimiter, otpVerifyLimiter } = require("../middleware/rateLimiter");

import {
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} from "../middleware/rateLimiter.js"; // ✅

// Login routes
router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/verify_otp", otpVerifyLimiter, validate(otpVerifySchema), verifyotp);
router.post("/resend_otp", otpSendLimiter, validate(resendOtpSchema),  resendOtp);

// refresh token
router.post("/refresh-token", refreshToken);

// Logout
router.post("/logout", logoutUser);

// Device tracking
router.post("/log-device", authMiddleware, logDevice);

// Get logged-in user
router.get("/me", authMiddleware, getMe);

// Two Factor Authentication
router.put("/toggle-2fa/:id", authMiddleware, toggleTwoFactor);

// module.exports = router;
// ❌ OLD
// module.exports = router;

export default router; // ✅ ES Module export