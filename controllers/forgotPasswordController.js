// controllers/forgotPasswordController.js
// const User = require("../models/studentsmodel");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");
// const sendEmail = require("../utils/sendEmail");
import User from "../models/studentsmodel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const OTP_EXPIRY_SECONDS = 180; // 3 minutes
const RESET_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_RETRIES = 5;
const OTP_BLOCK_DURATION_MS = 60 * 1000; // 1 minute

// Temporary storage for OTPs (use database in production)
const otpStore = new Map();

// Helper functions
const sendError = (res, code, message) => res.status(code).json({ success: false, message });
const sendSuccess = (res, code, data) => res.status(code).json({ success: true, ...data });

// 1️⃣ VERIFY EMAIL
// const emailVerify = async (req, res) => {
  export const emailVerify = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required");

    // ✅ Fix: Use account.email in your User model
    const user = await User.findOne({ "account.email": email.toLowerCase() });
    if (!user) return sendError(res, 404, "Email not found");

    return sendSuccess(res, 200, { 
      message: "Email verified", 
      userId: user._id 
    });
  } catch (err) {
    console.error("emailVerify error:", err);
    return sendError(res, 500, "Server error");
  }
};

// 2️⃣ SEND OTP
// const sendOtp = async (req, res) => {
  export const sendOtp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return sendError(res, 400, "User ID required");

    const user = await User.findById(id);
    if (!user) return sendError(res, 404, "User not found");

    // Check existing OTP record
    let record = otpStore.get(id);
    
    if (record?.blockedUntil && record.blockedUntil > Date.now()) {
      const sec = Math.ceil((record.blockedUntil - Date.now()) / 1000);
      return sendError(res, 429, `Try again after ${sec}s`);
    }

    if (record?.expiresAt && record.expiresAt > Date.now()) {
      const sec = Math.ceil((record.expiresAt - Date.now()) / 1000);
      return sendError(res, 429, `Wait for ${sec}s before requesting new OTP`);
    }

    // Generate OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP
    otpStore.set(id, {
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
      retryCount: 0,
      blockedUntil: null,
      resetSessionHash: null,
      resetSessionExpires: null,
    });

    // ✅ Fix: Use account.email
    await sendEmail(
      user.account.email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for ${OTP_EXPIRY_SECONDS / 60} minutes.`
    );

    console.log(`OTP sent to ${user.account.email}: ${otp}`);

    return sendSuccess(res, 200, { 
      message: "OTP sent successfully",
      expiresIn: OTP_EXPIRY_SECONDS 
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    return sendError(res, 500, "Failed to send OTP");
  }
};

// 3️⃣ VERIFY OTP
// const verifyOtp = async (req, res) => {
  export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) return sendError(res, 400, "Invalid request");

    const record = otpStore.get(userId);
    
    if (!record || record.expiresAt < Date.now()) {
      return sendError(res, 410, "OTP expired");
    }

    // Verify OTP
    const validOtp = await bcrypt.compare(otp, record.otp);
    if (!validOtp) {
      record.retryCount++;
      if (record.retryCount >= MAX_OTP_RETRIES) {
        record.blockedUntil = Date.now() + OTP_BLOCK_DURATION_MS;
      }
      otpStore.set(userId, record);
      return sendError(res, 400, "Invalid OTP");
    }

    // Create reset session
    const resetSession = crypto.randomBytes(64).toString("hex");
    record.resetSessionHash = await bcrypt.hash(resetSession, 10);
    record.resetSessionExpires = Date.now() + RESET_SESSION_TTL_MS;
    record.otp = null;
    otpStore.set(userId, record);

    // Set cookie
    res.cookie("reset_session", resetSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: RESET_SESSION_TTL_MS,
    });

    return sendSuccess(res, 200, { message: "OTP verified successfully" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return sendError(res, 500, "OTP verification failed");
  }
};

// 4️⃣ CHECK RESET SESSION
// const checkResetSession = async (req, res) => {
  export const checkResetSession = async (req, res) => {
  try {
    const token = req.cookies.reset_session;
    if (!token) return sendError(res, 401, "No reset session found");

    let validSession = false;
    for (const [userId, record] of otpStore.entries()) {
      if (record.resetSessionExpires && record.resetSessionExpires > Date.now()) {
        const valid = await bcrypt.compare(token, record.resetSessionHash);
        if (valid) {
          validSession = true;
          break;
        }
      }
    }

    if (!validSession) return sendError(res, 401, "Reset session expired");

    return sendSuccess(res, 200, { message: "Session valid" });
  } catch (err) {
    console.error("checkResetSession error:", err);
    return sendError(res, 500, "Session validation failed");
  }
};

// 5️⃣ RESET PASSWORD
// const resetPassword = async (req, res) => {
  export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const token = req.cookies.reset_session;

    if (!token) return sendError(res, 401, "Reset session missing");
    if (!newPassword || newPassword !== confirmPassword) {
      return sendError(res, 400, "Passwords do not match");
    }
    if (newPassword.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }

    // Find user with valid reset session
    let userId = null;
    let record = null;
    for (const [id, rec] of otpStore.entries()) {
      if (rec.resetSessionExpires && rec.resetSessionExpires > Date.now()) {
        const valid = await bcrypt.compare(token, rec.resetSessionHash);
        if (valid) {
          userId = id;
          record = rec;
          break;
        }
      }
    }

    if (!userId || !record) {
      return sendError(res, 401, "Reset session expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // ✅ Fix: Update password in account object
    await User.findByIdAndUpdate(userId, { 
      "account.password": hashedPassword,
      "account.plainPassword": newPassword,
      "account.passwordChangedAt": new Date()
    });

    // Clear reset session
    record.resetSessionHash = null;
    record.resetSessionExpires = null;
    otpStore.set(userId, record);

    // Clear cookie
    res.clearCookie("reset_session");

    return sendSuccess(res, 200, { message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return sendError(res, 500, "Password reset failed");
  }
};

// module.exports = {
//   emailVerify,
//   sendOtp,
//   verifyOtp,
//   checkResetSession,
//   resetPassword,
// };