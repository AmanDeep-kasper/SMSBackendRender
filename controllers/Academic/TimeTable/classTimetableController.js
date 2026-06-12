import ClassTimetable from "../../../models/Academic/TimeTable/ClassTimetable.js";

export const createClassSchedule = async (req, res) => {
  try {
    const schedule = await ClassTimetable.findOneAndUpdate(
      {
        className: req.body.className,
        section: req.body.section,
        day: req.body.day,
        period: req.body.period,
      },
      req.body,
      { new: true, upsert: true, runValidators: true },
    );

    res.status(201).json({
      success: true,
      message: "Schedule saved successfully",
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClassSchedule = async (req, res) => {
  try {
    const { className, section } = req.query;

    const schedules = await ClassTimetable.find({
      className,
      section,
    });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSchedule = await ClassTimetable.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      },
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.log("Update Schedule Error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update schedule",
    });
  }
};

export const getAllClassSchedules = async (req, res) => {
  try {
    const schedules = await ClassTimetable.find();

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
