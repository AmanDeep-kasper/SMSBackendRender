import OnlineClassModel from "../models/OnlineClassModel.js";
import User from "../models/studentsmodel.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

// ---------- helper ----------
const buildTimestamp = (date, time) => {
  if (!date || !time) return null;

  const base = new Date(date);

  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();

  const [h, m] = time.split(":").map(Number);

  return new Date(year, month, day, h, m, 0, 0).getTime();
};

// ---------- Create Class ----------
export const createOnlineClass = async (req, res) => {
  try {
    const {
      classTitle,
      description,
      className,
      section,
      subject,
      startDate,
      tillDate,
      startTime,
      endTime,
      meetingLink,
    } = req.body;

    const user = await User.findById(req.user?._id);

    const teacher =
      user?.studentInfo?.personalInfo?.fullName ||
      user?.username ||
      "Unknown";

    const defaultTillDate = dayjs(startDate)
      .add(1, "day")
      .format("YYYY-MM-DD");

    let defaultEndTime = null;

    if (startTime) {
      defaultEndTime = dayjs(
        `${startDate} ${startTime}`,
        "YYYY-MM-DD HH:mm"
      )
        .add(2, "hour")
        .format("HH:mm");
    }

    const newClass = await OnlineClassModel.create({
      classTitle,
      description,
      className,
      section,
      subject,
      teacher,
      startDate,
      tillDate: tillDate || defaultTillDate,
      startTime,
      endTime: endTime || defaultEndTime,
      meetingLink,
      status: "Scheduled",
    });

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Get All Classes ----------
export const getAllOnlineClasses = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      className,
      section,
      subject,
      status,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const query = {};

    if (className) query.className = className;
    if (section) query.section = section;
    if (subject) query.subject = subject;

    if (search) {
      query.$or = [
        { classTitle: { $regex: search, $options: "i" } },
        { teacher: { $regex: search, $options: "i" } },
      ];
    }

    const classes = await OnlineClassModel.find({ ...query, active: true })
      .sort({ startDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit);

    const now = Date.now();

    let updatedClasses = classes.map((c) => {
      const start = buildTimestamp(c.startDate, c.startTime);
      const end = buildTimestamp(c.startDate || c.startDate, c.endTime);

      let computedStatus = "Scheduled";

      if (!start) {
        computedStatus = "Scheduled";
      } else if (now < start) {
        computedStatus = "Scheduled";
      } else if (end && now > end) {
        computedStatus = "Past";
      } else {
        computedStatus = "Live";
      }

      // ✅ FIXED LOGS
      // console.log("CLASS RAW:", {
      //   startDate: c.startDate,
      //   startTime: c.startTime,
      //   tillDate: c.tillDate,
      //   endTime: c.endTime,
      // });

      // console.log("START:", start);
      // console.log("END:", end);
      // console.log("NOW:", now);
      
      const starting = dayjs(`2000-01-01 ${c.startTime}`);
      const ending = dayjs(`2000-01-01 ${c.endTime}`);

      const durationMinutes = ending.diff(starting, "minute");

      return {
        ...c.toObject(),
        status: computedStatus, 
        startDate: dayjs(c.startDate).format("DD MMM YYYY"),
        tillDate: dayjs(c.tillDate).format("DD MMM YYYY"),
        startTime: dayjs(`2000-01-01 ${c.startTime}`).format("hh:mm A"),
        endTime: dayjs(`2000-01-01 ${c.endTime}`).format("hh:mm A"),
        duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60
          }m`,
      };
    });

    if (status) {
      updatedClasses = updatedClasses.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    const total = await OnlineClassModel.countDocuments(query);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: updatedClasses.length,
      data: updatedClasses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Get Single Class ----------
export const getOnlineClassById = async (req, res) => {
  try {
    const classData = await OnlineClassModel.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const now = Date.now();

    const start = buildTimestamp(classData.startDate, classData.startTime);
    const end = buildTimestamp(
      classData.startDate,
      classData.endTime
    );

    let status = "Scheduled";

    if (!start) {
      status = "Scheduled";
    } else if (now < start) {
      status = "Scheduled";
    } else if (end && now > end) {
      status = "Past";
    } else {
      status = "Live";
    }

    res.status(200).json({
      success: true,
      data: {
        ...classData.toObject(),
        status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Update Class ----------
export const updateOnlineClass = async (req, res) => {
  try {
    const updatedClass = await OnlineClassModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Delete Class ----------
export const deleteOnlineClass = async (req, res) => {
  try {
    // const deletedClass = await OnlineClassModel.findByIdAndDelete(
    //   req.params.id
    // );
    const deletedClass = await OnlineClassModel.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};