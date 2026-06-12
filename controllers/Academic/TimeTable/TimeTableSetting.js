import TimetableSettings from "../../../models/Academic/TimeTable/TimeTable.js";

// save timetable setting
export const saveTimetableSettings = async (req, res) => {
  try {
    const { periods, breakPeriods } = req.body;

    // Basic Validation
    if (!periods || !breakPeriods) {
      return res.status(400).json({
        success: "false",
        message: "Periods and break periods are required",
      });
    }

    // Find Existing Settings
    let setting = await TimetableSettings.findOne();

    // If Exists → Update
    if (setting) {
      setting.periods = periods;
      setting.breakPeriods = breakPeriods;
      await setting.save();
    }

    // Else Create New
    else {
      setting = await TimetableSettings.create({
        periods,
        breakPeriods,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Timetable settings saved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Save timetable settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get timetabel setting

export const getTimetableSettings = async (req, res) => {
  try {
    const setting = await TimetableSettings.findOne();

    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.log("Get timetable error", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// update timetable

export const updateTimetableSettings = async (req, res) => {
  try {
    const { periods, breakPeriods } = req.body;
    const updatedSettings = await TimetableSettings.findOneAndUpdate(
      {},
      {
        periods,
        breakPeriods,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.log("Update timetable error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete period timetable

export const deletePeriod = async (req, res) => {
  try {
    const index = Number(req.params.index);

    const settings = await TimetableSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    if (isNaN(index) || index < 0 || index >= settings.periods.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid index",
      });
    }

    settings.periods.splice(index, 1);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Period deleted successfully",
      data: settings,
    });
  } catch (error) {
    console.log("Delete period error", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete breakperiod timetable

export const deleteBreakPeriod = async (req, res) => {
  try {
    const index = Number(req.params.index);

    const settings = await TimetableSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    if (isNaN(index) || index < 0 || index >= settings.breakPeriods.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid index",
      });
    }

    settings.breakPeriods.splice(index, 1);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Break deleted successfully",
      data: settings,
    });
  } catch (error) {
    console.log("Delete break error", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
