import express from "express";

import {
  createHomeworkSubmission,
  getAllHomeworkSubmissions,
  getSingleHomeworkSubmission,
  updateHomeworkSubmission,
  deleteHomeworkSubmission,
} from "../controllers/homeworkSubmissionController.js";

import upload from "../middleware/Multer/multer.js";
import { authMiddleware } from "../middleware/auth.js";



const router = express.Router();


// CREATE
router.post("/create",authMiddleware,upload.single("file"),createHomeworkSubmission);


// GET ALL
router.get("/", getAllHomeworkSubmissions);

// GET SINGLE
router.get("/:id", getSingleHomeworkSubmission);

// UPDATE
router.put("/:id",authMiddleware,upload.single("file"),updateHomeworkSubmission);

// DELETE
router.delete("/:id", deleteHomeworkSubmission);

export default router;