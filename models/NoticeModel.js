import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ["image", "pdf"],
    },
  },
  { _id: false },
);

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    publishDate: {
      type: String,
      required: true,
    },
    publishTime: {
      type: String,
      required: true,
    },
    messageFor: [
      {
        type: String,
        required: true,
        enum: ["All", "Student", "Super Admin", "Teacher"],
      },
    ],
    attachments: [attachmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;