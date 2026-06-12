import mongoose from "mongoose";

const studentSnapshotSchema = new mongoose.Schema(
  {
    studentName: { type: String, trim: true },
    admissionNumber: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    dateOfBirth: { type: String, trim: true },
    nationality: { type: String, trim: true },
    casteCategory: { type: String, trim: true },
    gender: { type: String, trim: true },
  },
  { _id: false },
);

const certificateSchema = new mongoose.Schema(
  {
    certificateType: {
      type: String,
      required: true,
      enum: [
        "transfer",
        "bonafide",
        "dob",
        "character",
        "participation",
        "appreciation",
        "achievement",
      ],
      index: true,
    },
    certificateNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    studentId: { type: String, required: true, trim: true, index: true },
    studentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      default: null,
    },
    academicYear: { type: String, required: true, trim: true, index: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "issued"],
      default: "issued",
    },
    studentSnapshot: { type: studentSnapshotSchema, default: {} },

    templateId: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    content: { type: String, trim: true },

    lastStudiesClass: { type: String, trim: true },
    enrollmentClass: { type: String, trim: true },
    issuedDate: { type: String, trim: true },
    transferReason: { type: String, trim: true },
    dateOfLeaving: { type: String, trim: true },
    conduct: { type: String, trim: true },
    transferToSchool: { type: String, trim: true },
    tcFormData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      default: null,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

certificateSchema.index({ certificateType: 1, studentId: 1, isDeleted: 1 });
certificateSchema.index({ certificateType: 1, academicYear: 1, className: 1, section: 1 });

export default mongoose.model("Certificate", certificateSchema);
