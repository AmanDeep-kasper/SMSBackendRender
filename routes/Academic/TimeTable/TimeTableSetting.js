import express from "express";
import {
  saveTimetableSettings,
  getTimetableSettings,
  updateTimetableSettings,
  deletePeriod,
  deleteBreakPeriod,
} from "../../../controllers/Academic/TimeTable/TimeTableSetting.js";

const router = express.Router();

// post data in timetable
router.post("/create-TimeTableSettings", saveTimetableSettings);
// get data in timetable
router.get("/get-TimeTableSettings", getTimetableSettings);
// update data in timebale 
router.put("/update-TimeTableSettings", updateTimetableSettings);
// delete data in period timetable
router.delete("/delete-period/:index", deletePeriod);
// delete data in breakperiod timetable
router.delete("/delete-break/:index", deleteBreakPeriod);

export default router;
