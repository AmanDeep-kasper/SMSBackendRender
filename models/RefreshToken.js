// const mongoose = require("mongoose");
import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true }, // Hashed refresh token
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  sessionId: { type: String, required: true },
  deviceId: { type: String },
  deviceInfo: { type: String },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Auto-cleanup expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
// ❌ OLD
// module.exports = mongoose.model("RefreshToken", refreshTokenSchema);

// ✅ NEW (ES Module)
export default mongoose.model("RefreshToken", refreshTokenSchema);