import express from "express";
import {
  createStaff,
  getStaffs,
  getStaffById,
  deleteStaff,
  updateStaff,
  updateLoginPermission,
  sendPasswordChangeLink,
} from "../../controllers/Staffs/AddStaff.js";
import upload from "../../middleware/Multer/multer.js";

const router = express.Router();

router.post(
  "/create-staff",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 20 },
  ]),
  createStaff,
);

router.get("/all-staff", getStaffs);
router.get("/:id", getStaffById);
router.delete("/delete-staff/:id", deleteStaff);
router.put(
  "/:id",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  updateStaff,
);

router.patch("/update-login-permission/:id", updateLoginPermission);

router.post("/send-password-link/:id", sendPasswordChangeLink);

export default router;
