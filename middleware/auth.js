// const jwt = require("jsonwebtoken");
// const User = require("../models/studentsmodel");

// const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

// exports.authMiddleware = async (req, res, next) => {
//   try {
//     // Get token from cookies (matching IMS pattern)
//     const token = req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({ message: "No token, authorization denied" });
//     }

//     const decoded = jwt.verify(token, ACCESS_SECRET);

//     const user = await User.findById(decoded.id)
//       .select("_id account.email account.username account.role userType")
//       .populate("account.role");
    
//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired" });
//     }
//     console.error("Auth error:", error);
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

import jwt from "jsonwebtoken";
import User from "../models/studentsmodel.js"; // ✅ add .js

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id account.email account.username account.role userType")
      .populate("account.role");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    console.error("Auth error:", error);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};