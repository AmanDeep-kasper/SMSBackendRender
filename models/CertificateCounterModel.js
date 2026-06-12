import mongoose from "mongoose";

const certificateCounterSchema = new mongoose.Schema(
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
    },
    year: { type: Number, required: true },
    sequence: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

certificateCounterSchema.index(
  { certificateType: 1, year: 1 },
  { unique: true },
);

export default mongoose.model("CertificateCounter", certificateCounterSchema);
