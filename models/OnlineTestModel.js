import mongoose from "mongoose";

// ================= EXAM RULE SCHEMA =================
const examRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    enabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

// ================= SELECTED QUESTION SCHEMA =================
const selectedQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },

    marks: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

// ================= ONLINE TEST SCHEMA =================
const onlineTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
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

    testDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    examRules: [examRuleSchema],

    questions: [selectedQuestionSchema],

    totalQuestions: {
      type: Number,
      default: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

// ================= MODEL =================
const OnlineTest = mongoose.model("OnlineTest", onlineTestSchema);

export default OnlineTest;
