import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, default: "" },
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
    resource_type: { type: String, default: "auto" },
  },
  { _id: false }
);

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: { type: String, required: true, trim: true },

    className: { type: String, required: true, trim: true }, // FIXED
    section: { type: String, required: true, trim: true },
    teacher: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["Active", "Pending", "Completed","Overdue"],
      default: "Active",
    },

    publishDate: { type: Date, default: Date.now, },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Due date must be in the future",
      },
    },

    submitted: { type: Number, default: 0 },
    total: { type: Number, default: 40 },
    checked: { type: Number, default: 0 },

    // submittedCount: {type:String, default:"0/40"},
    // pendingCount: {type:String, default:"0/40"},
    // checkedCount: {type:String, default:"0/40"},

    progress: { type: Number, default: 0, min: 0, max: 100 },

    attachment: { type: attachmentSchema, default: null },
    active:{type:Boolean,default:true}
  },
  { timestamps: true }
);

const HomeworkModel = mongoose.model("Homework", homeworkSchema);

export default HomeworkModel;