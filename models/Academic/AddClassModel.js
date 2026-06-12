import mongoose from "mongoose";

const AddClassModel = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    section: {
      type: String,
      required: true,
      enum: ["A", "B", "C"],
    },

    stream: {
      type: String,
      enum: ["General", "Science", "Maths"],
      default: "General",
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Class", AddClassModel);