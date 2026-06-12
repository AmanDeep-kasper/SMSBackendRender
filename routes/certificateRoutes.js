import express from "express";
import {
  createCertificate,
  deleteCertificate,
  getAllCertificates,
  getCertificateById,
  getCertificateByStudent,
  getCertificateMeta,
  getCertificateStudentById,
  getCertificateStudents,
  updateCertificate,
} from "../controllers/certificateController.js";
import {
  createCertificateSchema,
  listCertificatesQuerySchema,
  mongoIdSchema,
  studentCertificateQuerySchema,
  studentIdParamSchema,
  studentQuerySchema,
  updateCertificateSchema,
  validate,
} from "../validators/certificateValidator.js";

const router = express.Router();

router.get("/meta", getCertificateMeta);
router.get("/students", validate(studentQuerySchema, "query"), getCertificateStudents);
router.get(
  "/students/:studentId",
  validate(studentIdParamSchema, "params"),
  getCertificateStudentById,
);
router.get(
  "/student/:studentId",
  validate(studentIdParamSchema, "params"),
  validate(studentCertificateQuerySchema, "query"),
  getCertificateByStudent,
);
router.get("/", validate(listCertificatesQuerySchema, "query"), getAllCertificates);
router.post("/", validate(createCertificateSchema), createCertificate);
router.get("/:id", validate(mongoIdSchema, "params"), getCertificateById);
router.put(
  "/:id",
  validate(mongoIdSchema, "params"),
  validate(updateCertificateSchema),
  updateCertificate,
);
router.delete("/:id", validate(mongoIdSchema, "params"), deleteCertificate);

export default router;
