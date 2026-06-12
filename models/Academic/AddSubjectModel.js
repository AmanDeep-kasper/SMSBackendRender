import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Core", "Elective", "Optional", "None"],
      default: "None",
    },

    assignedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],

    applicableClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    subjectColor: {
      type: String,
      default: "#277DA1",
    },

    totalStudents: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
