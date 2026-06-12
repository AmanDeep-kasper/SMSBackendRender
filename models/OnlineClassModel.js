import mongoose from "mongoose";

const OnlineClassSchema = new mongoose.Schema(
  {
    classTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    className: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    teacher: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    tillDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    meetingLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Live", "Past"],
      default: "Scheduled",
    },
    active:{
      type:Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
);

const OnlineClassModel = mongoose.model(
  "OnlineClass",
  OnlineClassSchema
);

export default OnlineClassModel;