import DigitalSignature from "../models/DigitalSignatureModel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import streamifier from "streamifier";

// Helper: upload buffer to Cloudinary via stream
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "signatures",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// GET /api/digital-signature
export const getSignature = async (req, res) => {
  try {
    const signature = await DigitalSignature.findOne();

    return res.status(200).json({
      success: true,
      data: signature || null,
    });
  } catch (error) {
    console.error("Get Signature Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /api/digital-signature
export const uploadSignature = async (req, res) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Check for existing signature to handle replacement
    const existingSignature = await DigitalSignature.findOne();

    if (existingSignature) {
      // Delete old image from Cloudinary (log error but proceed)
      try {
        await cloudinary.uploader.destroy(existingSignature.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary destroy error (proceeding with upload):",
          cloudinaryError
        );
      }
    }

    // Upload new image buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer);

    // Upsert the DB record (singleton pattern)
    const signature = await DigitalSignature.findOneAndUpdate(
      {},
      {
        imageUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        uploadedBy: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        imageUrl: signature.imageUrl,
        cloudinaryPublicId: signature.cloudinaryPublicId,
      },
      message: "Signature saved successfully",
    });
  } catch (error) {
    console.error("Upload Signature Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload signature. Please try again.",
    });
  }
};

// DELETE /api/digital-signature
export const deleteSignature = async (req, res) => {
  try {
    const existingSignature = await DigitalSignature.findOne();

    if (!existingSignature) {
      return res.status(404).json({
        success: false,
        message: "No signature found to delete",
      });
    }

    // Delete from Cloudinary (log error but proceed)
    try {
      await cloudinary.uploader.destroy(existingSignature.cloudinaryPublicId);
    } catch (cloudinaryError) {
      console.error(
        "Cloudinary destroy error (proceeding with DB deletion):",
        cloudinaryError
      );
    }

    // Remove DB record
    await DigitalSignature.deleteOne({ _id: existingSignature._id });

    return res.status(200).json({
      success: true,
      message: "Signature deleted successfully",
    });
  } catch (error) {
    console.error("Delete Signature Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
