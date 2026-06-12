import express from "express";

import {
  createHomework,
  getAllHomework,
  getSingleHomework,
  updateHomework,
  deleteHomework,
} from "../controllers/HomeWorkController.js";

import upload from "../middleware/Multer/multer.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// CREATE
// router.post("/create", upload.fields([
//     { name: "document", maxCount: 1 },
//   ]), createHomework);
router.post("/create",authMiddleware, upload.single("attachment"), createHomework);

// GET ALL
router.get("/", getAllHomework);

// GET ONE
router.get("/:id", getSingleHomework);

// UPDATE
router.put("/update/:id", upload.single("attachment"), updateHomework);

// DELETE
router.delete("/delete/:id", deleteHomework);

export default router;