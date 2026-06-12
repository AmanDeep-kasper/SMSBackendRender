import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import signatureUpload from "../middleware/Multer/signatureUpload.js";
import {
  getSignature,
  uploadSignature,
  deleteSignature,
} from "../controllers/digitalSignatureController.js";

const router = express.Router();

router.get("/", authMiddleware, getSignature);
router.post("/", authMiddleware, signatureUpload.single("signature"), uploadSignature);
router.delete("/", authMiddleware, deleteSignature);

export default router;
