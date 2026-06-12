import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimes = ["image/png", "image/jpeg", "image/jpg"];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only PNG and JPEG files are allowed"), false);
};

const signatureUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

export default signatureUpload;
