// const express = require("express");
// const router = express.Router();
// const upload = require("../middleware/Multer/multer.js");
// const { validate, createStudentSchema, updateStudentSchema } = require("../validators/studentValidator");
// const {
//   createUser,
//   getAllStudents,
//   getStudentById,
//   updateStudent,
//   updateStudentSection,
//   deleteStudent,
//   updatePassword,
//   updateStudentStatus,
//   uploadStudentDocument,      
//   getStudentDocuments,     
//   deleteStudentDocument
// } = require("../controllers/studentscontroller.js");
// const { authMiddleware } = require("../middleware/auth.js");
// ❌ OLD
// const express = require("express");

import express from "express"; // ✅

const router = express.Router();

// ❌ OLD
// const upload = require("../middleware/Multer/multer.js");

import upload from "../middleware/Multer/multer.js"; // ✅

// ❌ OLD
// const { validate, createStudentSchema, updateStudentSchema } = require("../validators/studentValidator");

import {
  validate,
  createStudentSchema,
  updateStudentSchema,
} from "../validators/studentValidator.js"; // ✅

// ❌ OLD
// const { ... } = require("../controllers/studentscontroller.js");

import {
  createUser,
  getAllStudents,
  getStudentById,
  updateStudent,
  updateStudentSection,
  deleteStudent,
  updatePassword,
  updateStudentStatus,
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
} from "../controllers/studentscontroller.js"; // ✅

// ❌ OLD
// const { authMiddleware } = require("../middleware/auth.js");

import { authMiddleware } from "../middleware/auth.js"; // ✅

// Protected routes
router.post("/add", upload.single("profileImage"), validate(createStudentSchema), createUser);
router.get("/students", getAllStudents);
router.get("/student/:id", getStudentById);
router.put("/student/:id", upload.single("profileImage"), validate(updateStudentSchema), updateStudent);
router.patch("/student/:id/section", authMiddleware, updateStudentSection);
router.delete("/student/:id", authMiddleware, deleteStudent);
router.put("/update-password/:id", authMiddleware, updatePassword);
router.patch("/student/:id/status", authMiddleware, updateStudentStatus);
router.post(
  "/student/:studentId/documents",
  // authMiddleware,
  upload.single("document"),  // Using same multer middleware
  uploadStudentDocument
);
router.get(
  "/student/:studentId/documents",
  // authMiddleware,
  getStudentDocuments
);

router.delete(
  "/student/:studentId/documents/:documentId/:category",
  // authMiddleware,
  deleteStudentDocument
);

// module.exports = router;


// ❌ OLD
// module.exports = router;

export default router; // ✅