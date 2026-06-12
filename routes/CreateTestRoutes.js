import express from "express";

import {
  createTest,
  getAllTests,
  getSingleTest,
  updateTest,
  deleteTest,
} from "../controllers/createTestController.js";

const router = express.Router();


// ================= CREATE TEST =================
router.post("/create", createTest);


// ================= GET ALL TESTS =================
router.get("/", getAllTests);


// ================= GET SINGLE TEST =================
router.get("/:id", getSingleTest);


// ================= UPDATE TEST =================
router.put("/:id", updateTest);


// ================= DELETE TEST =================
router.delete("/:id", deleteTest);


export default router;