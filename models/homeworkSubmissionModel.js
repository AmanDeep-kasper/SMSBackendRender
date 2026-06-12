import mongoose from "mongoose";

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      unique: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    files: {
      type: String,
      default: "0 file",
    },

    status: {
      type: String,
      enum: ["Submitted", "Pending", "Checked"],
      default: "Submitted",
    },

    remark: {
      type: String,
      default: "-",
    },

    submissionFile: {
      name: {
        type: String,
      },

      size: {
        type: String,
      },

      url: {
        type: String,
      },

      type: {
        type: String,
      },

      public_id: {
        type: String,
      },

      resource_type: {
        type: String,
      },
    },
    active:{type:Boolean,default:true}
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "HomeworkSubmission",
  homeworkSubmissionSchema
);