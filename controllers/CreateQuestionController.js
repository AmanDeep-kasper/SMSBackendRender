import QuestionData from "../models/CreateQuestionModel.js";

// ================= CREATE QUESTION =================

export const createQuestion = async (req, res) => {
  try {
    const {
      classValue,
      section,
      subject,
      chapter,
      topic,
      questions,
      status,
    } = req.body;

    // Validation
    if (!classValue || !section || !subject) {
      return res.status(400).json({
        success: false,
        message: "Class, Section and Subject are required",
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    const newQuestion = await QuestionData.create({
      classValue,
      section,
      subject,
      chapter,
      topic,
      questions,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.log("CREATE QUESTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= GET ALL QUESTIONS =================

export const getAllQuestions = async (req, res) => {
  try {
    const questions = await QuestionData.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.log("GET QUESTIONS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= GET SINGLE QUESTION =================

export const getSingleQuestion = async (req, res) => {
  try {
    const question = await QuestionData.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.log("GET SINGLE QUESTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= UPDATE QUESTION =================

export const updateQuestion = async (req, res) => {
  try {
    const updatedQuestion = await QuestionData.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (error) {
    console.log("UPDATE QUESTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ================= DELETE QUESTION =================

export const deleteQuestion = async (req, res) => {
  try {
    const deletedQuestion = await QuestionData.findByIdAndDelete(
      req.params.id
    );

    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.log("DELETE QUESTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};