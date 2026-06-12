import express from "express";

import {
  createQuestion,
  getAllQuestions,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/CreateQuestionController.js";

const router = express.Router();

// CREATE
router.post("/create", createQuestion);

// GET ALL
router.get("/all", getAllQuestions);

// GET SINGLE
router.get("/:id", getSingleQuestion);

// UPDATE
router.put("/update/:id", updateQuestion);

// DELETE
router.delete("/delete/:id", deleteQuestion);

export default router;
