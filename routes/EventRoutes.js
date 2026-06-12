import express from "express";
import multer from "multer";
import {
  createEvent,
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/EventController.js";
import { authMiddleware } from "../middleware/auth.js";
import eventUpload from "../middleware/Multer/eventUpload.js";
import { sendError } from "../utils/events/eventHelpers.js";

// import { authorize } from "../middleware/authorize.js";
// import { hasModulePermission } from "../middleware/authorize.js";

const router = express.Router();

// Multer error handler — invalid file type or size
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 400, "Image must be 5MB or smaller", err.message);
    }
    return sendError(res, 400, "File upload failed", err.message);
  }

  if (err) {
    return sendError(res, 400, err.message || "Invalid file upload", err.message);
  }

  next();
};

const uploadImage = (req, res, next) => {
  eventUpload.single("image")(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
};

// GET /api/events/upcoming — must be before /:id
router.get("/upcoming", getUpcomingEvents);

// GET /api/events
router.get("/", getAllEvents);

// GET /api/events/:id
router.get("/:id", getEventById);

// POST /api/events
router.post(
  "/",
  authMiddleware,
  // authorize(["Admin", "Super Admin"]),
  uploadImage,
  createEvent
);

// PATCH /api/events/:id
router.patch(
  "/:id",
  authMiddleware,
  // authorize(["Admin", "Super Admin"]),
  uploadImage,
  updateEvent
);

// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  // authorize(["Admin", "Super Admin"]),
  deleteEvent
);

export default router;
