import express from "express";
import {
  createSubject,
  deleteSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
} from "../../controllers/Academic/AddSubjectController.js";

const router = express.Router();

// post subject
router.post("/create-subject", createSubject);
// get all subjects
router.get("/AllSubjects", getAllSubjects);
// get subject by id
router.get("/:id", getSubjectById);
// update subject
router.put("/update-subject/:id", updateSubject);
// delete subject
router.delete("/delete-subject/:id", deleteSubject);

export default router;
