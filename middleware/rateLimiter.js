// middleware/rateLimiter.js
// const rateLimit = require("express-rate-limit");
// const MongoStore = require("rate-limit-mongo");
import rateLimit from "express-rate-limit";
import MongoStore from "rate-limit-mongo";

// Helper function for IPv6-safe key generation
const ipKeyGenerator = (req) => {
  // Get IP from various headers (for proxy support)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.socket.remoteAddress || 
             req.ip;
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  return ip;
};

// Login rate limiter
// const loginLimiter = rateLimit({
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    collectionName: "rateLimits",
    expireTimeMs: 5 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    const username = req.body?.username || "unknown";
    const ip = ipKeyGenerator(req);
    return `LOGIN_${username}_${ip}`;
  },
  skipSuccessfulRequests: true,
});

// OTP send rate limiter
// const otpSendLimiter = rateLimit({
export const otpSendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    success: false,
    message: "Too many OTP requests. Please wait a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    collectionName: "rateLimits",
    expireTimeMs: 1 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    // ✅ Fix: Safely access req.body.email
    const email = req.body?.email || "unknown";
    const ip = ipKeyGenerator(req);
    return `OTP_SEND_${email}_${ip}`;
  },
});

// OTP verify rate limiter
// const otpVerifyLimiter = rateLimit({
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 verification attempts
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    collectionName: "rateLimits",
    expireTimeMs: 10 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    // ✅ Fix: Safely access req.body.userId
    const userId = req.body?.userId || "unknown";
    const ip = ipKeyGenerator(req);
    return `OTP_VERIFY_${userId}_${ip}`;
  },
});

// Password reset rate limiter
// const passwordResetLimiter = rateLimit({
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    collectionName: "rateLimits",
    expireTimeMs: 60 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return `PASSWORD_RESET_${ip}`;
  },
});

// module.exports = {
//   loginLimiter,
//   otpSendLimiter,
//   otpVerifyLimiter,
//   passwordResetLimiter,
// };
// export {
//   loginLimiter,
//   otpSendLimiter,
//   otpVerifyLimiter,
//   passwordResetLimiter,
// };