import mongoose from "mongoose";

const classTimetableSchema = new mongoose.Schema(
  {
    className: { type: String, required: true },
    section: { type: String, required: true },

    day: { type: String, required: true },
    period: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    subject: { type: String, required: true },
    teacher: { type: String, required: true },
    room: { type: String, required: true },

    otherDay: { type: String, default: "" },

    mergeClass: { type: Boolean, default: false },
    mergeClassId: { type: String, default: "" },
    mergeClassName: { type: String, default: "" },
    mergeSection: { type: String, default: "" },
  },
  { timestamps: true },
);

classTimetableSchema.index(
  { className: 1, section: 1, day: 1, period: 1 },
  { unique: true },
);

export default mongoose.model("ClassTimetable", classTimetableSchema);
