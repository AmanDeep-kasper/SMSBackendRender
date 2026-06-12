import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },

  public_id: {
    type: String
  },

  fileName: {
    type: String,
    required: true,
  },

  fileSize: {
    type: String,
    default: 0,
  },
});

const StudyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["Document","Image" , "Video", "Notes", "Assignment","Link"],
      default: "Document",
    },
    availableFor:{
      type: String,
      trim: true,
      enum: ["All", "Students", "Teachers"],
      default:"All",
    },

    class: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: String,
      required: true,
    },

    uploadDate: {
      type: String,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
    active:{type:Boolean,default:true},

    // MULTIPLE FILES
    files: [FileSchema],
  },
  {
    timestamps: true,
  }
);

const StudyMaterial = mongoose.model(
  "StudyMaterial",
  StudyMaterialSchema
);

export default StudyMaterial;