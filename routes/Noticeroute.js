import express from "express";
import { createNotice, getAllNotices, getNoticeById, deleteNotice, updateNotice } from "../controllers/NoticeController.js";
import { 
  createNoticeSchema, 
  updateNoticeSchema, 
  mongoIdSchema, 
  validate 
} from "../validators/noticeValidator.js";

import { authMiddleware } from "../middleware/auth.js";
import upload from "../middleware/Multer/multer.js";

const router = express.Router();
router.use(authMiddleware);

router.post(
  "/create_notice",
  upload.array("attachments", 2),
  validate(createNoticeSchema, "body"),
  createNotice
);

router.get("/get_all_notices", getAllNotices);

router.get("/get_notice/:id", validate(mongoIdSchema, "params"), getNoticeById);

router.put(
  "/update_notice/:id",
  upload.array("attachments", 2),
  [validate(mongoIdSchema, "params"), validate(updateNoticeSchema, "body")],
  updateNotice
);

router.delete("/delete_notice/:id", validate(mongoIdSchema, "params"), deleteNotice);

export default router;