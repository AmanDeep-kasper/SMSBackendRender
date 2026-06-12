import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new Error("Only PNG, JPEG, and WEBP images are allowed (max 5MB)"),
    false
  );
};

const eventUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default eventUpload;
