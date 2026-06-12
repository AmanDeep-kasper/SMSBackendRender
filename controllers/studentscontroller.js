// const User = require("../models/studentsmodel");
// const bcrypt = require("bcryptjs");
// const cloudinary = require("../utils/cloudinary/cloudinary");
import User from "../models/studentsmodel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
// import mongoose from "mongoose";

// Helper function to generate username
const generateUsername = (fullName, email) => {
  // Remove special characters and spaces
  const baseName = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8);
  
  // Add random numbers to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 10000);
  const username = `${baseName}${randomNum}`;
  
  return username;
};

// Helper function to generate secure password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// const generateStudentId = async () => {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
  
//   // Prefix: STU + YYYY + MM
//   const prefix = `STU-${year}${month}`;
  
//   // Count existing students with this prefix
//   const count = await User.countDocuments({
//     "studentInfo.studentId": { $regex: `^${prefix}` }
//   });
  
//   // Generate 4-digit sequence (0001, 0002, etc.)
//   const sequence = String(count + 1).padStart(4, "0");
//   return `${prefix}${sequence}`;
// };

// Helper: Generate unique Admission Number in sequence
const generateStudentId = async () => {
  // Find all existing student IDs that match the pattern STUD-XXXX
  const students = await User.find(
    { "studentInfo.studentId": { $regex: /^STUD-\d{4}$/ } },
    { "studentInfo.studentId": 1 }
  ).lean();

  let maxSeq = 0;
  for (const student of students) {
    const match = student.studentInfo.studentId.match(/^STUD-(\d{4})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  const sequence = String(nextSeq).padStart(4, "0");
  return `STUD-${sequence}`;
};

// const generateAdmissionNumber = async () => {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
  
//   // Prefix: ADM + YYYY + MM
//   const prefix = `ADM${year}${month}`;
  
//   // Count existing admissions with this prefix
//   const count = await User.countDocuments({
//     "studentInfo.admissionNumber": { $regex: `^${prefix}` }
//   });
  
//   // Generate 4-digit sequence (0001, 0002, etc.)
//   const sequence = String(count + 1).padStart(4, "0");
//   return `${prefix}${sequence}`;
// };

const generateAdmissionNumber = async () => {
  const admissions = await User.find(
    { "studentInfo.admissionNumber": { $regex: /^ADM-\d{4}$/ } },
    { "studentInfo.admissionNumber": 1 }
  ).lean();

  let maxSeq = 0;
  for (const student of admissions) {
    const match = student.studentInfo.admissionNumber.match(/^ADM-(\d{4})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  const sequence = String(nextSeq).padStart(4, "0");
  return `ADM-${sequence}`;
};

// const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
const IV_LENGTH = 16;

const decrypt = (text) => {
  if (!text) return null;
  const textParts = text.split(':');
  if (textParts.length !== 2) return text;
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = Buffer.from(textParts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// exports.createUser = async (req, res, next) => {
  export const createUser = async (req, res, next) => {
  try {
    const {
      userType = "Student",
      account: accountData,
      studentInfo: studentInfoData,
      metadata,
    } = req.body;

    // Parse if coming as JSON strings
    const parsedAccount = typeof accountData === 'string' ? JSON.parse(accountData) : accountData;
    const parsedStudentInfo = typeof studentInfoData === 'string' ? JSON.parse(studentInfoData) : studentInfoData;

    // Validate required fields
    if (!parsedAccount?.email || !parsedAccount?.phone) {
      return res.status(400).json({ 
        message: "Email and phone are required" 
      });
    }

    const cleanPhone = parsedAccount.phone.replace(/\D/g, '');
    const studentFullName = parsedStudentInfo?.personalInfo?.fullName;

    // Generate AUTO student ID and admission number (remove from frontend)
    const autoStudentId = await generateStudentId();
    const autoAdmissionNumber = await generateAdmissionNumber();

    // Generate username from student name
    let generatedUsername = generateUsername(studentFullName, parsedAccount.email);
    
    // Ensure username is unique
    let username = generatedUsername;
    let usernameExists = await User.findOne({ "account.username": username });
    let counter = 1;
    while (usernameExists) {
      username = `${generatedUsername.substring(0, 8)}${counter}`;
      usernameExists = await User.findOne({ "account.username": username });
      counter++;
    }

    // Generate random password
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Check if email already exists
    const existingUser = await User.findOne({ "account.email": parsedAccount.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ "account.phone": cleanPhone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Handle profile image upload
    let profileImage = null;
    if (req.file) {
      // const base64 = Buffer.from(req.file.buffer).toString("base64");
      // const dataURI = `data:${req.file.mimeType};base64,${b64}`;
      const b64 = Buffer.from(req.file.buffer).toString("base64");
const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const uploadedImage = await cloudinary.uploader.upload(dataURI, {
        folder: "profile_images",
      });
      profileImage = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    }

    // Create user document with AUTO-GENERATED IDs
    const newUser = new User({
      userType,
      account: {
        username: username,
        email: parsedAccount.email.toLowerCase(),
        phone: cleanPhone,
        password: hashedPassword,
        plainPassword: generatedPassword,
        passwordChangedAt: new Date(),
        profileImage,
        role: parsedAccount.role,
        twoFactorEnabled: false,
        status: "Active",
      },
      studentInfo: userType === "Student" ? {
        // AUTO-GENERATED - DO NOT accept from frontend
        studentId: autoStudentId,
        admissionNumber: autoAdmissionNumber,
        rollNumber: parsedStudentInfo?.rollNumber,
        admissionDate: parsedStudentInfo?.admissionDate || new Date(),
        accountInfo: {
          status: parsedStudentInfo?.accountInfo?.status || "Active",
        },
        personalInfo: {
          fullName: parsedStudentInfo?.personalInfo?.fullName,
          firstName: parsedStudentInfo?.personalInfo?.firstName,
          lastName: parsedStudentInfo?.personalInfo?.lastName,
          dateOfBirth: parsedStudentInfo?.personalInfo?.dateOfBirth,
          gender: parsedStudentInfo?.personalInfo?.gender,
          nationality: parsedStudentInfo?.personalInfo?.nationality,
          religion: parsedStudentInfo?.personalInfo?.religion,
          category: parsedStudentInfo?.personalInfo?.category,
          bloodGroup: parsedStudentInfo?.personalInfo?.bloodGroup,
          placeOfBirth: parsedStudentInfo?.personalInfo?.placeOfBirth,
          motherTongue: parsedStudentInfo?.personalInfo?.motherTongue,
          languagesKnown: parsedStudentInfo?.personalInfo?.languagesKnown || [],
          aadhaarNumber: parsedStudentInfo?.personalInfo?.aadhaarNumber,
          samagraId: parsedStudentInfo?.personalInfo?.samagraId,
          identificationMarks: parsedStudentInfo?.personalInfo?.identificationMarks,
        },
        academicInfo: {
          academicYear:parsedStudentInfo?.academicInfo?.academicYear,
          currentClass: parsedStudentInfo?.academicInfo?.currentClass,
          section: parsedStudentInfo?.academicInfo?.section,
          previousSchool: parsedStudentInfo?.academicInfo?.previousSchool,
          subjects: parsedStudentInfo?.academicInfo?.subjects || [],
          stream: parsedStudentInfo?.academicInfo?.stream,
          optionalSubjects: parsedStudentInfo?.academicInfo?.optionalSubjects || [],
        },
        contactInfo: {
          primaryMobile: parsedStudentInfo?.contactInfo?.primaryMobile || cleanPhone,
          secondaryMobile: parsedStudentInfo?.contactInfo?.secondaryMobile,
          email: parsedStudentInfo?.contactInfo?.email || parsedAccount.email,
          alternateEmail: parsedStudentInfo?.contactInfo?.alternateEmail,
          currentAddress: parsedStudentInfo?.contactInfo?.currentAddress,
          permanentAddress: parsedStudentInfo?.contactInfo?.permanentAddress,
        },
        parentInfo: {
          father: parsedStudentInfo?.parentInfo?.father,
          mother: parsedStudentInfo?.parentInfo?.mother,
          localGuardian: parsedStudentInfo?.parentInfo?.localGuardian,
          siblings: parsedStudentInfo?.parentInfo?.siblings || [],
          emergencyContact: parsedStudentInfo?.parentInfo?.emergencyContact,
        },
        medicalInfo: parsedStudentInfo?.medicalInfo,
        transportInfo: parsedStudentInfo?.transportInfo,
        feeInfo: parsedStudentInfo?.feeInfo,
        documents: parsedStudentInfo?.documents,
        additionalInfo: parsedStudentInfo?.additionalInfo,
      } : {},
      
      metadata: {
        createdBy: req.user?._id,
        registrationIP: req.ip,
        ...metadata,
      },
    });

    await newUser.save();

    res.status(201).json({
      message: "Student created successfully",
      credentials: {
        username: username,
        password: generatedPassword,
        email: newUser.account.email,
        studentId: autoStudentId,
        admissionNumber: autoAdmissionNumber,
      },
      user: {
        _id: newUser._id,
        userType: newUser.userType,
        email: newUser.account.email,
        username: newUser.account.username,
        studentId: newUser.studentInfo?.studentId,
        admissionNumber: newUser.studentInfo?.admissionNumber,
        fullName: newUser.userType === "Student" 
          ? newUser.studentInfo.personalInfo?.fullName 
          : newUser.account.name,
        role: newUser.account.role,
      }
    });
  } catch (error) {
    next(error);
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// GET ALL STUDENTS
// exports.getAllStudents = async (req, res, next) => {
  export const getAllStudents = async (req, res, next) => {
  try {
    const students = await User.find({ userType: "Student" })
      .populate("account.role")
      .select(
  "userType account.username account.email account.phone account.profileImage account.status account.lastLogin " +
  "studentInfo.studentId studentInfo.admissionNumber studentInfo.rollNumber " +
  "studentInfo.personalInfo.fullName studentInfo.personalInfo.gender " +
  "studentInfo.academicInfo.currentClass studentInfo.academicInfo.section " +
  "studentInfo.contactInfo.primaryMobile studentInfo.contactInfo.email " +
  "studentInfo.parentInfo.father.fullName studentInfo.parentInfo.mother.fullName " +
  "studentInfo.documents"
)
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    next(error);
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET STUDENT BY ID
// GET STUDENT BY ID OR STUDENT ID
// exports.getStudentById = async (req, res, next) => {
  export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let student;
    
    // Check if the id is a valid MongoDB ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (isValidObjectId) {
      // Search by MongoDB _id
      student = await User.findOne({ 
        _id: id, 
        userType: "Student" 
      }).populate("account.role");
    } else {
      // Search by studentId (STU format)
      student = await User.findOne({ 
        "studentInfo.studentId": id, 
        userType: "Student" 
      }).populate("account.role");
    }
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Remove sensitive data
    const studentData = student.toObject();
     // ✅ Decrypt Aadhaar number for display
    if (studentData.studentInfo?.personalInfo?.aadhaarNumber) {
      try {
        studentData.studentInfo.personalInfo.aadhaarNumber = decrypt(studentData.studentInfo.personalInfo.aadhaarNumber);
         } catch (err) {
        console.error("Error decrypting Aadhaar:", err);
      }
    }
    delete studentData.account?.password;
    // delete studentData.account?.plainPassword;
    delete studentData.account?.refreshTokens;
    
    res.status(200).json(studentData);
  } catch (error) {
    next(error);
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE STUDENT
// exports.updateStudent = async (req, res, next) => {
  export const updateStudent = async (req, res, next) => {
  try {
    const student = await User.findOne({ 
      _id: req.params.id, 
      userType: "Student" 
    });
    
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { account, studentInfo } = req.body;

    // Update account info if provided
    if (account) {
      if (account.email && account.email !== student.account.email) {
        const existingEmail = await User.findOne({ 
          "account.email": account.email.toLowerCase(),
          _id: { $ne: student._id }
        });
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }
        student.account.email = account.email.toLowerCase();
      }
      
      if (account.phone) {
        const cleanPhone = account.phone.replace(/\D/g, '');
        if (cleanPhone !== student.account.phone) {
          const existingPhone = await User.findOne({ 
            "account.phone": cleanPhone,
            _id: { $ne: student._id }
          });
          if (existingPhone) {
            return res.status(400).json({ message: "Phone number already in use" });
          }
          student.account.phone = cleanPhone;
        }
      }
      
      if (account.username && account.username !== student.account.username) {
        const existingUsername = await User.findOne({ 
          "account.username": account.username,
          _id: { $ne: student._id }
        });
        if (existingUsername) {
          return res.status(400).json({ message: "Username already in use" });
        }
        student.account.username = account.username;
      }
      
      if (account.role) student.account.role = account.role;
      if (typeof account.status !== "undefined") student.account.status = account.status;
    }

    // Update student info if provided (deep merge)
    if (studentInfo) {
      Object.keys(studentInfo).forEach(section => {
        if (student.studentInfo[section]) {
          student.studentInfo[section] = {
            ...student.studentInfo[section].toObject(),
            ...studentInfo[section]
          };
        } else {
          student.studentInfo[section] = studentInfo[section];
        }
      });
    }

    // Handle profile image update
if (req.file) {
  if (student.account.profileImage?.public_id) {
    await cloudinary.uploader.destroy(student.account.profileImage.public_id);
  }
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "profile_images",
  });
  student.account.profileImage = {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

    await student.save();

    res.status(200).json({
      message: "Student updated successfully",
      student: {
        _id: student._id,
        studentId: student.studentInfo.studentId,
        admissionNumber: student.studentInfo.admissionNumber,
        fullName: student.studentInfo.personalInfo?.fullName,
        email: student.account.email,
      }
    });
  } catch (error) {
    next(error);
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE STUDENT BY SECTION (for partial updates)
// exports.updateStudentSection = async (req, res, next) => {
  export const updateStudentSection = async (req, res, next) => {
  try {
    const { section, data } = req.body;
    const student = await User.findOne({ 
      _id: req.params.id, 
      userType: "Student" 
    });
    
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    // Update specific section
    if (student.studentInfo[section]) {
      student.studentInfo[section] = {
        ...student.studentInfo[section].toObject(),
        ...data
      };
    } else {
      student.studentInfo[section] = data;
    }
    
    await student.save();
    
    res.status(200).json({
      message: `${section} updated successfully`,
      student: student.studentInfo[section]
    });
  } catch (error) {
    next(error);
    console.error("Error updating student section:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE STUDENT
// exports.deleteStudent = async (req, res, next) => {
  export const deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findOne({ 
      _id: req.params.id, 
      userType: "Student" 
    });
    
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Soft delete - mark as deleted
    student.metadata.isDeleted = true;
    student.metadata.deletedAt = new Date();
    student.account.status = "Inactive";
    
    await student.save();

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE PASSWORD
// exports.updatePassword = async (req, res, next) => {
   export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
   
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }
    

    user.account.password = await bcrypt.hash(newPassword, 10);
    user.account.plainPassword = newPassword;
    user.account.passwordChangedAt = new Date();
    user.account.refreshTokens = [];
    
    await user.save();
    
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add to userscontroller.js
// exports.updateStudentStatus = async (req, res, next) => {
  export const updateStudentStatus = async (req, res, next) => {

  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const student = await User.findOne({ 
      _id: id, 
      userType: "Student" 
    });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Initialize accountInfo if it doesn't exist
    if (!student.studentInfo.accountInfo) {
      student.studentInfo.accountInfo = {};
    }
    
    // Just update status
    student.studentInfo.accountInfo.status = status;
    await student.save();
    
    res.status(200).json({
      message: `Status updated to ${status}`,
      status: student.studentInfo.accountInfo.status
    });
  } catch (error) {
    next(error);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.uploadStudentDocument = async (req, res, next) => {
export const uploadStudentDocument = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { documentType, category } = req.body; // category: 'student', 'parent', 'other'
    
    const student = await User.findOne({ 
      "studentInfo.studentId": studentId,
      userType: "Student" 
    });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    let uploadedDocument = null;
    if (req.file) {
      // Convert buffer to base64 for Cloudinary upload
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      // Upload to Cloudinary - similar to profile image upload
      const uploadedImage = await cloudinary.uploader.upload(dataURI, {
        folder: `student_documents/${studentId}/${category}`,
      });
      
      uploadedDocument = {
        documentType: documentType,
        documentName: req.file.originalname,
        fileUrl: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        uploadDate: new Date(),
        verified: false
      };
    }
    
    // Add to appropriate category based on the category parameter
    if (category === 'student') {
      if (!student.studentInfo.documents) student.studentInfo.documents = {};
      if (!student.studentInfo.documents.studentDocuments) student.studentInfo.documents.studentDocuments = [];
      student.studentInfo.documents.studentDocuments.push(uploadedDocument);
    } else if (category === 'parent') {
      if (!student.studentInfo.documents) student.studentInfo.documents = {};
      if (!student.studentInfo.documents.parentDocuments) student.studentInfo.documents.parentDocuments = [];
      student.studentInfo.documents.parentDocuments.push(uploadedDocument);
    } else {
      if (!student.studentInfo.documents) student.studentInfo.documents = {};
      if (!student.studentInfo.documents.otherDocuments) student.studentInfo.documents.otherDocuments = [];
      student.studentInfo.documents.otherDocuments.push(uploadedDocument);
    }
    
    await student.save();
    
    res.status(200).json({
      message: "Document uploaded successfully",
      document: uploadedDocument
    });
  } catch (error) {
    next(error);
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// exports.getStudentDocuments = async (req, res, next) => {
export const getStudentDocuments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({ 
      "studentInfo.studentId": studentId,
      userType: "Student" 
    });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.status(200).json({
      studentDocuments: student.studentInfo.documents?.studentDocuments || [],
      parentDocuments: student.studentInfo.documents?.parentDocuments || [],
      otherDocuments: student.studentInfo.documents?.otherDocuments || []
    });
  } catch (error) {
    next(error);
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a document
// exports.deleteStudentDocument = async (req, res, next) => {
export const deleteStudentDocument = async (req, res, next) => {
  try {
    const { studentId, documentId, category } = req.params;
    const student = await User.findOne({ 
      "studentInfo.studentId": studentId,
      userType: "Student" 
    });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    let documentArray;
    if (category === 'student') {
      documentArray = student.studentInfo.documents.studentDocuments;
    } else if (category === 'parent') {
      documentArray = student.studentInfo.documents.parentDocuments;
    } else {
      documentArray = student.studentInfo.documents.otherDocuments;
    }
    
    const document = documentArray.id(documentId);
    if (document && document.publicId) {
      // Delete from Cloudinary - similar to profile image deletion
      await cloudinary.uploader.destroy(document.publicId);
    }
    
    documentArray.pull({ _id: documentId });
    await student.save();
    
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};