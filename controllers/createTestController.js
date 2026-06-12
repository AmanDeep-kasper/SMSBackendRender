import Test from "../models/OnlineTestModel.js";

// ================= CREATE TEST =================
export const createTest = async (req, res) => {
  try {
    const {
      testName,
      className,
      section,
      subject,
      testDate,
      startTime,
      endTime,
      duration,
      examRules,
      questions,
      status,
    } = req.body;

    // Validation
    if (
      !testName ||
      !className ||
      !section ||
      !subject ||
      !testDate ||
      !startTime ||
      !endTime ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Calculate Total Questions
    const totalQuestions = questions?.length || 0;

    // Calculate Total Marks
    const totalMarks =
      questions?.reduce((acc, item) => acc + Number(item.marks || 0), 0) || 0;

    // Create Test
    const newTest = await Test.create({
      testName,
      className,
      section,
      subject,
      testDate,
      startTime,
      endTime,
      duration,
      examRules,
      questions,
      totalQuestions,
      totalMarks,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: newTest,
    });
  } catch (error) {
    console.log("Create Test Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= GET ALL TESTS =================
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.log("Get All Tests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= GET SINGLE TEST =================
export const getSingleTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.log("Get Single Test Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= UPDATE TEST =================
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;

    const { questions } = req.body;

    // Recalculate totals if questions updated
    let updatedData = { ...req.body };

    if (questions) {
      updatedData.totalQuestions = questions.length;

      updatedData.totalMarks = questions.reduce(
        (acc, item) => acc + Number(item.marks || 0),
        0,
      );
    }

    const updatedTest = await Test.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.log("Update Test Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= DELETE TEST =================
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTest = await Test.findByIdAndDelete(id);

    if (!deletedTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.log("Delete Test Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
