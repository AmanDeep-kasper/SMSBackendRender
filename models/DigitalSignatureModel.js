import mongoose from "mongoose";

const digitalSignatureSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("DigitalSignature", digitalSignatureSchema);
