import mongoose from "mongoose";
const Schema = mongoose.Schema;

const periodSchema = new Schema(
  {
    period: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const breakPeriodSchema = new mongoose.Schema(
  {
    afterPeriod: {
      type: String,
      default: "",
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const timeTableSchema = new Schema(
  {
    periods: {
      type: [periodSchema],
      default: [],
    },
    breakPeriods: {
      type: [breakPeriodSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const TimetableSettings = mongoose.model("TimetableSettings", timeTableSchema);
export default TimetableSettings;
