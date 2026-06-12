import Subject from "../../models/Academic/AddSubjectModel.js";

export const createSubject = async (req, res) => {
  try {
    const {
      subjectName,
      subjectCode,
      category,
      assignedTeachers,
      applicableClasses,
    } = req.body;

    if (
      !subjectName ||
      !subjectCode ||
      !category ||
      !assignedTeachers ||
      !Array.isArray(applicableClasses) ||
      applicableClasses.length === 0
    ) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    const existingSubject = await Subject.findOne({
      subjectCode,
    });

    if (existingSubject) {
      return res.status(409).json({
        message: "Subject code already exists",
      });
    }

    const newSubject = await Subject.create({
      subjectName,
      subjectCode,
      category,
      assignedTeachers,
      applicableClasses,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: newSubject,
    });
  } catch (error) {
    console.log("Create subject error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create subject",
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = req.query.limit === "All" ? 0 : Number(req.query.limit) || 10;
    const { category, search } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.subjectName = {
        $regex: search,
        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const total = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .populate({
        path: "assignedTeachers",
        select: "staffId personalInfo.staffName",
      })
      .populate({
        path: "applicableClasses",
        select: "className section",
      })
      .skip(limit ? skip : 0)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: subjects,
      pagination: {
        total,
        page,
        limit: limit || total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id)
      .populate({
        path: "assignedTeachers",
        select:
          "staffId profilePhoto personalInfo.staffName employmentInfo.department",
      })
      .populate("applicableClasses", "_id className section");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subjectName,
      subjectCode,
      category,
      assignedTeachers,
      applicableClasses,
    } = req.body;

    if (
      !subjectName ||
      !subjectCode ||
      !category ||
      !assignedTeachers ||
      !Array.isArray(applicableClasses) ||
      applicableClasses.length === 0
    ) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    const existingSubject = await Subject.findByIdAndUpdate(
      id,
      {
        subjectName,
        subjectCode,
        category,
        assignedTeachers,
        applicableClasses,
      },
      { new: true }, // ✅ return updated data
    );

    if (!existingSubject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: existingSubject,
    });
  } catch (error) {
    console.log("Update subject error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update subject",
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      data: subject,
    });
  } catch (error) {
    console.log("Delete subject error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete subject",
    });
  }
};
