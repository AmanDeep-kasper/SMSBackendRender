import mongoose from "mongoose";

const AddRoomModel = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    roomType: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: String,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    area: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      // default: "Active",
    },

    furniture: {
      desks: { type: Number, default: 0 },
      chairs: { type: Number, default: 0 },
      teacherTable: { type: Number, default: 0 },
    },

    facilities: {
      type: [String],
      enum: [
        "Projector",
        "Whiteboard",
        "Smart Board",
        "WiFi",
        "Air Conditioning",
        "Computers",
        "Lab Equipment",
        "Sound System",
        "Ventilation",
      ],
      default: [],
    },

    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Room", AddRoomModel);