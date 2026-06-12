import Notice from "../models/NoticeModel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import streamifier from 'streamifier';
import User from "../models/studentsmodel.js";

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "notices",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
};

const noticePopulateOptions = {
  path: "createdBy",
  select: "account.username account.role studentInfo.personalInfo.fullName userType",
  populate: {
    path: "account.role",
    select: "roleName",
  },
};

const getCreatorName = (createdBy) =>
  createdBy?.studentInfo?.personalInfo?.fullName ||
  createdBy?.account?.username ||
  "Admin User";

const getCreatorRole = (createdBy) =>
  createdBy?.account?.role?.roleName || createdBy?.userType || "Admin";

const formatNotice = (notice) => ({
  _id: notice._id,
  title: notice.title,
  description: notice.description,
  publishDate: notice.publishDate,
  publishTime: notice.publishTime,
  messageFor: notice.messageFor,
  attachments: notice.attachments,
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt,
  createdBy: notice.createdBy?._id,
  creatorName: getCreatorName(notice.createdBy),
  creatorRole: getCreatorRole(notice.createdBy),
});

export const createNotice = async (req, res) => {
  let uploadedFiles = [];
  try {
    let { title, description, publishDate, publishTime, messageFor } = req.body;

    const files = req.files || [];

    let imageCount = 0;
    let pdfCount = 0;

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) imageCount++;
      if (file.mimetype === "application/pdf") pdfCount++;
    }

    if (imageCount > 1) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 1 image only.",
      });
    }

    if (pdfCount > 1) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 1 PDF file only.",
      });
    }

    for (const file of files) {
      const isImage = file.mimetype.startsWith("image/");
      const isPdf = file.mimetype === "application/pdf";

      if (isImage || isPdf) {
        const uploaded = await uploadToCloudinary(file);
        uploadedFiles.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          fileName: file.originalname,
          fileSize: formatFileSize(file.size),
          fileType: isImage ? "image" : "pdf",
        });
      }
    }

    if (title) {
      title = title.trim().charAt(0).toUpperCase() + title.trim().slice(1);
    }

    const newNotice = new Notice({
      title,
      description,
      publishDate,
      publishTime,
      messageFor,
      attachments: uploadedFiles,
      createdBy: req.user._id,
    });

    await newNotice.save();

    const populatedNotice = await Notice.findById(newNotice._id).populate(noticePopulateOptions);

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: formatNotice(populatedNotice),
    });
  } catch (error) {
    for (const file of uploadedFiles) {
      if (file.public_id) {
        try {
          await cloudinary.uploader.destroy(file.public_id);
        } catch (err) {
          console.error("Cloudinary cleanup failed:", err.message);
        }
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ isDeleted: false })
      .populate(noticePopulateOptions)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notices.map(formatNotice),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false }).populate(
      noticePopulateOptions,
    );

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    res.status(200).json({
      success: true,
      data: formatNotice(notice),
    });
  } catch (error) {
    console.error("Error fetching notice by ID:", error);
    res.status(500).json({ success: false, message: "Server error fetching notice" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false });

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    notice.isDeleted = true;
    notice.deletedAt = new Date();
    await notice.save();

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notice Error:", error);
    res.status(500).json({ success: false, message: "Server error deleting notice" });
  }
};

export const updateNotice = async (req, res) => {
  let uploadedFiles = [];
  try {
    const { title, description, publishDate, publishTime, messageFor } = req.body;

    const files = req.files || [];

    let imageCount = 0;
    let pdfCount = 0;

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) imageCount++;
      if (file.mimetype === "application/pdf") pdfCount++;
    }

    if (imageCount > 1) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 1 image only.",
      });
    }

    if (pdfCount > 1) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 1 PDF file only.",
      });
    }

    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false });

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    for (const file of files) {
      const isImage = file.mimetype.startsWith("image/");
      const isPdf = file.mimetype === "application/pdf";

      if (isImage || isPdf) {
        const uploaded = await uploadToCloudinary(file);
        uploadedFiles.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          fileName: file.originalname,
          fileSize: formatFileSize(file.size),
          fileType: isImage ? "image" : "pdf",
        });
      }
    }

    if (uploadedFiles.length > 0) {
      // If a new file is uploaded, remove all old attachments 
      // since the frontend only supports a single attachment per notice.
      for (const oldFile of notice.attachments) {
        if (oldFile.public_id) {
          try {
            await cloudinary.uploader.destroy(oldFile.public_id);
          } catch (err) {
            console.error("Failed to delete old file:", err.message);
          }
        }
      }

      notice.attachments = uploadedFiles;
    }

    if (title !== undefined) {
      notice.title = title.trim().charAt(0).toUpperCase() + title.trim().slice(1);
    }
    if (description !== undefined) notice.description = description;
    if (publishDate !== undefined) notice.publishDate = publishDate;
    if (publishTime !== undefined) notice.publishTime = publishTime;
    if (messageFor !== undefined) notice.messageFor = messageFor;

    await notice.save();

    const updatedNotice = await Notice.findById(notice._id).populate(noticePopulateOptions);

    res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      data: formatNotice(updatedNotice),
    });
  } catch (error) {
    for (const file of uploadedFiles) {
      if (file.public_id) {
        try {
          await cloudinary.uploader.destroy(file.public_id);
        } catch (err) {
          console.error("Cleanup failed:", err.message);
        }
      }
    }
    console.error("Update Notice Error:", error);
    res.status(500).json({ success: false, message: "Server error updating notice" });
  }
};