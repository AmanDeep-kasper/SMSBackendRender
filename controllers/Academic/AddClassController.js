import Class from "../../models/Academic/AddClassModel.js";


// ➕ Create Class
export const createClass = async (req, res) => {
  try {
    const { className, section, stream, room, teacher } = req.body;
     const existingClass = await Class.findOne({
  className,
  section
});

if (existingClass) {
  return res.status(409).json({
    message: "Class with same section already exists"
  });
}

    const newClass = new Class({
      className,
      section,
      stream,
      room,
      teacher,
    });

    const savedClass = await newClass.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: savedClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating class",
      error: error.message,
    });
  }
};


// 📥 Get All Classes (with populated room + teacher)
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("room")
      .populate("teacher");

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message,
    });
  }
};


// 📥 Get Single Class
export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("room")
      .populate("teacher");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching class",
      error: error.message,
    });
  }
};


// ✏️ Update Class
export const updateClass = async (req, res) => {
  try {
    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Class updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating class",
      error: error.message,
    });
  }
};


// ❌ Delete Class
export const deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Class deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting class",
      error: error.message,
    });
  }
};