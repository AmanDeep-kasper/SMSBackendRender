import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";

import User from "../models/studentsmodel.js";
import RefreshToken from "../models/RefreshToken.js";
import sendEmail from "../utils/sendEmail.js";
import Role from "../models/rolemodel.js";

// Get secrets from environment with fallbacks
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_JWT_EXPIRES_IN || "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.error("❌ ERROR: JWT secrets are not defined in .env file!");
  process.exit(1);
}

console.log(
  `🔐 Auth configured: Access token expiry: ${ACCESS_TOKEN_EXPIRY}, Refresh token expiry: ${REFRESH_TOKEN_EXPIRY}`,
);

const isProduction = process.env.NODE_ENV === "production";

// ✅ FIXED: Create cookieOptions function
const getCookieOptions = (rememberMe = false) => {
  return {
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  };
};

// Generate tokens using environment expiry times
const generateTokens = (user, sessionId) => {
  const payload = {
    id: user._id,
    email: user.account.email,
    username: user.account.username,
    userType: user.userType,
    sessionId,
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ id: user._id, sessionId }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

// Hash refresh token for storage
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Calculate maxAge from expiry string
const getMaxAgeFromExpiry = (expiryString) => {
  const value = parseInt(expiryString);
  const unit = expiryString.replace(/[0-9]/g, "");

  switch (unit) {
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

// Helper function to create default roles
const SYSTEM_ROLES = ["Super Admin", "Admin", "Student", "Teacher"];

const createDefaultRoles = async () => {
  for (const roleName of SYSTEM_ROLES) {
    const existingRole = await Role.findOne({ roleName, isSystemRole: true });

    if (!existingRole) {
      await Role.create({
        roleName,
        status: "Active",
        isSystemRole: true,
        modulePermissions: getSystemRolePermissions(roleName),
      });
      console.log(`Created role: ${roleName}`);
    }
  }
};


const getSystemRolePermissions = (roleName) => {
  if (roleName === "Super Admin") {
    return {
      Dashboard: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Schools: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Admins: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Settings: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
    };
  }

  if (roleName === "Admin") {
    return {
      Dashboard: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Students: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Teachers: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Staff: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Roles: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: false,
        import: false,
        all: true,
      },
    };
  }

  if (roleName === "Teacher") {
    return {
      Dashboard: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Students: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Attendance: {
        create: true,
        read: true,
        update: true,
        delete: false,
        export: true,
        import: false,
        all: false,
      },
      Exams: {
        create: false,
        read: true,
        update: true,
        delete: false,
        export: true,
        import: false,
        all: false,
      },
    };
  }

  if (roleName === "Student") {
    return {
      Dashboard: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Profile: {
        create: false,
        read: true,
        update: true,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Attendance: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Exams: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Results: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Fees: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
    };
  }

  return {};
};
// Register first admin (Super Admin)
export const registerFirstAdmin = async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ userType: "Admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create default roles first
    await createDefaultRoles();

    // Get Super Admin role
    const superAdminRole = await Role.findOne({ roleName: "Super Admin" });

    if (!superAdminRole) {
      return res.status(500).json({ message: "Super Admin role not found" });
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newAdmin = new User({
      userType: "Admin",
      account: {
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        password: hashedPassword,
        plainPassword: req.body.password,
        role: superAdminRole._id,
        status: "Active",
      },
      personalInfo: {
        fullName: req.body.fullName,
        gender: req.body.gender,
      },
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      data: {
        email: newAdmin.account.email,
        role: "Super Admin",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
// exports.loginUser = async (req, res, next) => {
export const loginUser = async (req, res) => {
  const {
    username,
    password,
    deviceId,
    deviceInfo,
    rememberMe = false,
  } = req.body;

  try {
    // Find user
    const user = await User.findOne({
      $or: [
        { "account.username": username },
        { "account.email": username.toLowerCase() },
        { "studentInfo.studentId": username },
        { "studentInfo.admissionNumber": username },
      ],
    }).populate("account.role");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account status
    const userStatus = user.account.status || "Active";
    if (userStatus === "Inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact admin.",
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.account.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.account.lastLogin = new Date();

    if (!user.account.status) {
      user.account.status = "Active";
    }

    await user.save();

    // Check if device is trusted
    const isTrustedDevice = user.account.trustedDevices?.some(
      (d) => d.deviceId === deviceId,
    );

    // Prepare role and student data
    const roleData = user.account.role
      ? {
          roleName: user.account.role.roleName,
          modulePermissions: user.account.role.modulePermissions,
        }
      : null;

    const studentData =
      user.userType === "Student"
        ? {
            studentId: user.studentInfo?.studentId,
            admissionNumber: user.studentInfo?.admissionNumber,
            fullName: user.studentInfo?.personalInfo?.fullName,
            currentClass: user.studentInfo?.academicInfo?.currentClass,
            section: user.studentInfo?.academicInfo?.section,
            rollNumber: user.studentInfo?.rollNumber,
          }
        : null;

    // If 2FA disabled OR device trusted, login directly
    if (!user.account.twoFactorEnabled || isTrustedDevice) {
      const sessionId = crypto.randomUUID();
      const { accessToken, refreshToken } = generateTokens(user, sessionId);

      // Store refresh token
      const hashedRefreshToken = hashToken(refreshToken);
      await RefreshToken.create({
        token: hashedRefreshToken,
        user: user._id,
        sessionId,
        deviceId,
        deviceInfo: deviceInfo || "Unknown",
        expiresAt: new Date(
          Date.now() + getMaxAgeFromExpiry(REFRESH_TOKEN_EXPIRY),
        ),
      });

      // ✅ FIXED: Get cookie options with rememberMe
      const cookieOptions = getCookieOptions(rememberMe);
      const accessMaxAge = getMaxAgeFromExpiry(ACCESS_TOKEN_EXPIRY);

      res.cookie("token", accessToken, {
        ...cookieOptions,
        maxAge: accessMaxAge,
      });
      res.cookie("refreshToken", refreshToken, cookieOptions);
      // res.cookie("userId", user._id.toString(), { ...cookieOptions, httpOnly: false });

      // res.cookie("userData", JSON.stringify({
      //   id: user._id,
      //   userType: user.userType,
      //   username: user.account.username,
      //   email: user.account.email,
      //   phone: user.account.phone,
      //   profileImage: user.account.profileImage,
      //   status: user.account.status || "Active",
      //   role: roleData,
      //   ...studentData,
      // }), { ...cookieOptions, httpOnly: false });

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          userType: user.userType,
          username: user.account.username,
          email: user.account.email,
          phone: user.account.phone,
          profileImage: user.account.profileImage,
          status: user.account.status || "Active",
          role: roleData,
          ...studentData,
        },
      });
    }

    // Send OTP for 2FA
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000;

    user.account.otp = String(otp);
    user.account.otpExpires = expiry;
    await user.save();

    await sendEmail(
      user.account.email,
      "Your Login OTP",
      `Your OTP code is: ${otp}`,
    );

    res.cookie("otpPending", "true", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    res.cookie("otpEmail", user.account.email, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "OTP sent to your email",
      twoFactor: true,
      email: user.account.email,
      userId: user._id.toString(),
      otp: !isProduction ? otp : undefined,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// REFRESH TOKEN
// exports.refreshToken = async (req, res, next) => {
export const refreshToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    console.log(
      "Refresh token cookie:",
      oldRefreshToken ? "Present" : "Missing",
    );

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET);
      console.log("Decoded refresh token:", decoded);
    } catch (error) {
      console.error("Refresh token verification failed:", error.message);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const hashedToken = hashToken(oldRefreshToken);
    const storedToken = await RefreshToken.findOne({
      token: hashedToken,
      user: decoded.id,
      sessionId: decoded.sessionId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return res.status(401).json({ message: "Session expired" });
    }

    await RefreshToken.updateOne({ _id: storedToken._id }, { revoked: true });

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newSessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = generateTokens(user, newSessionId);

    const hashedNewToken = hashToken(refreshToken);
    await RefreshToken.create({
      token: hashedNewToken,
      user: user._id,
      sessionId: newSessionId,
      deviceId: storedToken.deviceId,
      deviceInfo: storedToken.deviceInfo,
      expiresAt: new Date(
        Date.now() + getMaxAgeFromExpiry(REFRESH_TOKEN_EXPIRY),
      ),
    });

    // ✅ FIXED: Get cookie options (rememberMe false for refresh)
    const cookieOptions = getCookieOptions(false);

    res.cookie("token", accessToken, {
      ...cookieOptions,
      maxAge: getMaxAgeFromExpiry(ACCESS_TOKEN_EXPIRY),
    });
    res.cookie("refreshToken", refreshToken, cookieOptions);

    console.log("New tokens generated and cookies set");

    return res.status(200).json({
      message: "Token refreshed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// VERIFY OTP
// exports.verifyotp = async (req, res, next) => {
export const verifyotp = async (req, res, next) => {
  try {
    const { email, otp, deviceId, deviceInfo, rememberMe = false } = req.body;

    const user = await User.findOne({
      "account.email": email.toLowerCase(),
    }).populate("account.role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOtpValid = String(otp).trim() === String(user.account.otp).trim();
    const isNotExpired = Date.now() <= user.account.otpExpires;

    if (!isOtpValid || !isNotExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.account.otp = null;
    user.account.otpExpires = null;

    if (
      deviceId &&
      !user.account.trustedDevices?.some((d) => d.deviceId === deviceId)
    ) {
      if (!user.account.trustedDevices) {
        user.account.trustedDevices = [];
      }
      user.account.trustedDevices.push({
        deviceId,
        deviceInfo: deviceInfo || "Unknown",
        addedAt: new Date(),
      });
    }

    await user.save();

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = generateTokens(user, sessionId);

    const hashedRefreshToken = hashToken(refreshToken);
    await RefreshToken.create({
      token: hashedRefreshToken,
      user: user._id,
      sessionId,
      deviceId,
      deviceInfo: deviceInfo || "Unknown",
      expiresAt: new Date(
        Date.now() + getMaxAgeFromExpiry(REFRESH_TOKEN_EXPIRY),
      ),
    });

    // ✅ FIXED: Get cookie options with rememberMe
    const cookieOptions = getCookieOptions(rememberMe);

    res.cookie("token", accessToken, {
      ...cookieOptions,
      maxAge: getMaxAgeFromExpiry(ACCESS_TOKEN_EXPIRY),
    });
    res.cookie("refreshToken", refreshToken, cookieOptions);
    // res.cookie("userId", user._id.toString(), { ...cookieOptions, httpOnly: false });

    const roleData = user.account.role
      ? {
          roleName: user.account.role.roleName,
          modulePermissions: user.account.role.modulePermissions,
        }
      : null;

    const studentData =
      user.userType === "Student"
        ? {
            studentId: user.studentInfo?.studentId,
            admissionNumber: user.studentInfo?.admissionNumber,
            fullName: user.studentInfo?.personalInfo?.fullName,
            currentClass: user.studentInfo?.academicInfo?.currentClass,
            section: user.studentInfo?.academicInfo?.section,
            rollNumber: user.studentInfo?.rollNumber,
          }
        : null;

    // res.cookie("userData", JSON.stringify({
    //   id: user._id,
    //   userType: user.userType,
    //   username: user.account.username,
    //   email: user.account.email,
    //   phone: user.account.phone,
    //   profileImage: user.account.profileImage,
    //   status: user.account.status,
    //   role: roleData,
    //   ...studentData,
    // }), { ...cookieOptions, httpOnly: false });

    res.clearCookie("otpPending", { path: "/" });
    res.clearCookie("otpEmail", { path: "/" });

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      message: "Server error during OTP verification",
      error: error.message,
    });
  }
};

// LOGOUT
// exports.logoutUser = async (req, res, next) => {
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        await RefreshToken.updateMany(
          { sessionId: decoded.sessionId },
          { revoked: true },
        );
      } catch (error) {
        // Ignore invalid token
      }
    }

    // ✅ FIXED: Get cookie options for clearing
    const cookieOptions = getCookieOptions(false);

    res.clearCookie("token", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.clearCookie("userId", cookieOptions);
    res.clearCookie("userData", cookieOptions);
    res.clearCookie("otpPending", { path: "/" });
    res.clearCookie("otpEmail", { path: "/" });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET LOGGED-IN USER
// exports.getMe = async (req, res, next) => {
export const getMe = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id)
      .populate("account.role")
      .select(
        "-account.password -account.plainPassword -account.refreshTokens",
      );

    if (!user) {
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      res.clearCookie("userId");
      return res.status(401).json({ logout: true });
    }

    const roleData = user.account.role
      ? {
          roleName: user.account.role.roleName,
          modulePermissions: user.account.role.modulePermissions,
        }
      : null;

    const studentData =
      user.userType === "Student"
        ? {
            studentId: user.studentInfo?.studentId,
            admissionNumber: user.studentInfo?.admissionNumber,
            fullName: user.studentInfo?.personalInfo?.fullName,
            currentClass: user.studentInfo?.academicInfo?.currentClass,
            section: user.studentInfo?.academicInfo?.section,
            rollNumber: user.studentInfo?.rollNumber,
          }
        : null;

    return res.status(200).json({
      user,
      // not this i want full user thats why i commented it
      // : {
      //   id: user._id,
      //   userType: user.userType,
      //   username: user.account.username,
      //   email: user.account.email,
      //   phone: user.account.phone,
      //   profileImage: user.account.profileImage,
      //   status: user.account.status,
      //   role: roleData,
      //   ...studentData,
      // },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// RESEND OTP
// exports.resendOtp = async (req, res, next) => {
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ "account.email": email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000;

    user.account.otp = String(otp);
    user.account.otpExpires = expiry;
    await user.save();

    await sendEmail(email, "Your Login OTP", `Your OTP code is: ${otp}`);

    console.log(`OTP resent to ${email}: ${otp}`);

    res.status(200).json({
      message: "OTP resent successfully",
      otp: !isProduction ? otp : undefined,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// TOGGLE TWO FACTOR AUTHENTICATION
// exports.toggleTwoFactor = async (req, res, next) => {
export const toggleTwoFactor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.account.twoFactorEnabled = !user.account.twoFactorEnabled;
    await user.save();

    return res.status(200).json({
      message: `Two-factor authentication ${user.account.twoFactorEnabled ? "enabled" : "disabled"} successfully`,
      twoFactorEnabled: user.account.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOG DEVICE
// exports.logDevice = async (req, res, next) => {
export const logDevice = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    let ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .split(",")[0]
      .trim();
    const userAgent = req.headers["user-agent"];

    let device = "Unknown";
    try {
      const browserName = userAgent.split("/")[0];
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1].split(";")[0].trim() : "Unknown";
      device = `${browserName} ${os.split(" ")[0]}`;
    } catch (error) {
      // console.error("Error parsing user-agent", error.message);
    }

    let location = "Unknown";
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
      location = "Localhost / Dev";
    } else {
      try {
        const axios = require("axios");
        const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${data.city}, ${data.region}, ${data.country_name}`;
      } catch (error) {
        // console.log("IP location failed:", error.message);
      }
    }

    console.log("Device logged:", { userId, ip, location, device });

    res.status(200).json({ message: "Device logged" });
  } catch (error) {
    console.error("Log Device Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
