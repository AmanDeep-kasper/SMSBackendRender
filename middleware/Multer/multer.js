// middleware/Multer/multer.js
// const multer = require("multer");
// const path = require("path");
import multer from "multer";
import path from "path";


// Change from diskStorage to memoryStorage
const storage = multer.memoryStorage();

// File filter to accept images, csv, xlsx and pdf
const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".csv", ".xlsx", ".pdf"];
  const allowedMimes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/pdf",
  ];
  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image, CSV, Excel, or PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// module.exports = upload;
export default upload;