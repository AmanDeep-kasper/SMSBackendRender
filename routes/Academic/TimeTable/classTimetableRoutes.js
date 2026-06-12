import express from "express";
import {
  createClassSchedule,
  getClassSchedule,
  updateClassSchedule,
  getAllClassSchedules,
} from "../../../controllers/Academic/TimeTable/classTimetableController.js";

const router = express.Router();

// Create or update class schedule
router.post("/class-schedule", createClassSchedule);

// Get class schedule
router.get("/class-schedule", getClassSchedule);

// update in schedule
router.put("/class-schedule/:id", updateClassSchedule);

// Get all schedules for teacher timetable
router.get("/all-class-schedules", getAllClassSchedules);

export default router;
