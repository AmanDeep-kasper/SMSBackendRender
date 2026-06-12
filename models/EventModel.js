import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    fileName: { type: String, default: "" },
  },
  { _id: false }
);

const EVENT_TYPES = [
  "holiday",
  "academic",
  "sports",
  "exam",
  "meeting",
  "celebration",
  "event",
];

const eventSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    type: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: EVENT_TYPES,
        message: "{VALUE} is not a valid event type",
      },
      default: "academic",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
      default: "",
    },
    organizer: {
      type: String,
      trim: true,
      maxlength: [100, "Organizer cannot exceed 100 characters"],
      default: "Administration",
    },
    startTime: {
      type: String,
      trim: true,
      default: "09:00",
    },
    endTime: {
      type: String,
      trim: true,
      default: "14:00",
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    image: {
      type: imageSchema,
      default: null,
    },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ clientId: 1 }, { unique: true, sparse: true });
eventSchema.index({ title: "text" });

const EventModel = mongoose.model("Event", eventSchema);

export { EVENT_TYPES };
export default EventModel;
