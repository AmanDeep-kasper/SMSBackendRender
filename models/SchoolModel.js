import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    schoolCode: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    phone: String,

    address: String,

    logo: String,

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("School", schoolSchema);
