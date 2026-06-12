import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    questionType: {
      type: String,
      enum: ["Multiple Choice", "True/False"],
      required: true,
    },

    marks: {
      type: Number,
      required: true,
    },

    options: [
      {
        type: String,
      },
    ],

    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
);

const createTestSchema = new mongoose.Schema(
  {
    classValue: {
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

    chapter: {
      type: String,
      default: "",
    },

    topic: {
      type: String,
      default: "",
    },

    questions: [questionSchema],

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("questionData", createTestSchema);