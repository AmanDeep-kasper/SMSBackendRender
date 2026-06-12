// const mongoose = require("mongoose");
import mongoose from "mongoose";
// const crypto = require('crypto');
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
const IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Student Information Schema
const studentInfoSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, sparse: true },
  admissionNumber: { type: String, unique: true, sparse: true },
  rollNumber: { type: String },
  admissionDate: { type: Date, default: Date.now },
  
  // Basic Details
  personalInfo: {
    fullName: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    dateOfBirth: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    nationality: { type: String },
    religion: { type: String },
    category: { type: String, enum: ["General", "OBC", "SC", "ST", "Other"] },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    placeOfBirth: { type: String },
    motherTongue: { type: String },
    languagesKnown: [{ type: String }],
    aadhaarNumber: { type: String, unique: true, sparse: true,
      set: function(value) {
        if(value)  return encrypt(value);
        return value;
      },
      get: function(value) {
        return value; // Don't decrypt for display by default
      }
     },
    samagraId: { type: String },
    identificationMarks: { type: String },
  },
  
  // Academic Information
  academicInfo: {
    academicYear:{type:String},
    currentClass: { type: String },
    section: { type: String },
    previousSchool: {
      name: { type: String },
      board: { type: String },
      schoolCode: { type: String },
      yearOfPassing: { type: String },
      percentage: { type: Number },
      grade: { type: String },
      transferCertificateNo: { type: String },
      transferReason: { type: String },
    },
    subjects: [{
      name: { type: String },
      maxMarks: { type: Number },
      obtainedMarks: { type: Number },
      percentage: { type: Number },
    }],
    stream: { type: String, enum: ["Science", "Commerce", "Arts", "Vocational"] },
    optionalSubjects: [{ type: String }],
  },
  
  // Contact Information
  contactInfo: {
    primaryMobile: { type: String, required: true },
    secondaryMobile: { type: String },
    email: { type: String, required: true, lowercase: true },
    alternateEmail: { type: String, lowercase: true },
    currentAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
      pincode: { type: String },
      landmark: { type: String },
    },
    permanentAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
      pincode: { type: String },
      landmark: { type: String },
      sameAsCurrent: { type: Boolean, default: false },
    },
  },
  
  // Parent/Guardian Information
  parentInfo: {
    father: {
      fullName: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      occupation: { type: String },
      qualification: { type: String },
      designation: { type: String },
      organizationName: { type: String },
      organizationAddress: { type: String },
      annualIncome: { type: Number },
      mobileNumber: { type: String },
      email: { type: String, lowercase: true },
      profileImage: {
        url: { type: String },
        public_id: { type: String },
      },
      aadhaarNumber: { type: String },
      panNumber: { 
    type: String, 
    sparse: true,
    set: function(value) {
      if (value) return encrypt(value);
      return value;
    }
  },
    },
    mother: {
      fullName: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      occupation: { type: String },
      qualification: { type: String },
      designation: { type: String },
      organizationName: { type: String },
      organizationAddress: { type: String },
      annualIncome: { type: Number },
      mobileNumber: { type: String },
      email: { type: String, lowercase: true },
      profileImage: {
        url: { type: String },
        public_id: { type: String },
      },
      aadhaarNumber: { type: String },
      panNumber: { type: String },
    },
    localGuardian: {
      fullName: { type: String },
      relation: { type: String },
      mobileNumber: { type: String },
      email: { type: String, lowercase: true },
      address: {
        addressLine1: { type: String },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        pincode: { type: String },
      },
      profileImage: {
        url: { type: String },
        public_id: { type: String },
      },
    },
    siblings: [{
      fullName: { type: String },
      admissionNumber: { type: String },
      class: { type: String },
      section: { type: String },
      gender: { type: String },
      relation: { type: String },
      dateOfBirth: { type: Date },
    }],
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      mobileNumber: { type: String },
      alternateNumber: { type: String },
    },
  },
  
  // Medical Information
  medicalInfo: {
    allergies: [{ type: String }],
    chronicIllness: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
    physicalDisability: { type: Boolean, default: false },
    disabilityDetails: { type: String },
    medication: [{ 
      name: { type: String },
      dosage: { type: String },
      timing: { type: String },
    }],
    doctor: {
      name: { type: String },
      contactNumber: { type: String },
      clinicAddress: { type: String },
    },
    medicalNotes: { type: String },
    insuranceDetails: {
      provider: { type: String },
      policyNumber: { type: String },
      validUntil: { type: Date },
    },
    vaccinationStatus: {
      isVaccinated: { type: Boolean, default: false },
      vaccinationDetails: [{ type: String }],
      lastVaccinationDate: { type: Date },
    },
  },
  
  // Transport Information
  transportInfo: {
    opted: { type: Boolean, default: false },
    route: { type: String },
    busStop: { type: String },
    busNumber: { type: String },
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverContact: { type: String },
    pickupPoint: { type: String },
    dropPoint: { type: String },
    transportFee: { type: Number },
    conductorName: { type: String },
  },
  
  // Fee Information
  feeInfo: {
    feeCategory: { type: String },
    concessionType: { type: String },
    concessionAmount: { type: Number },
    concessionPercentage: { type: Number },
    totalFee: { type: Number },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    feeStructure: [{
      head: { type: String },
      amount: { type: Number },
      frequency: { type: String, enum: ["Monthly", "Quarterly", "Yearly"] },
    }],
    paymentHistory: [{
      date: { type: Date, default: Date.now },
      amount: { type: Number },
      mode: { type: String, enum: ["Cash", "Cheque", "Online", "DD"] },
      transactionId: { type: String },
      receiptNumber: { type: String },
      remarks: { type: String },
    }],
    scholarshipDetails: {
      isScholarshipApplicable: { type: Boolean, default: false },
      scholarshipType: { type: String },
      scholarshipAmount: { type: Number },
      scholarshipProvider: { type: String },
      scholarshipValidUntil: { type: Date },
    },
  },
  
  // Documents Information
  documents: {
    studentDocuments: [{
      documentType: { type: String },
      documentName: { type: String },
      fileUrl: { type: String },
      publicId: { type: String },
      uploadDate: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      verifiedDate: { type: Date },
    }],
    parentDocuments: [{
      documentType: { type: String },
      documentName: { type: String },
      fileUrl: { type: String },
      publicId: { type: String },
      uploadDate: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
    }],
    academicDocuments: [{
      documentType: { type: String },
      documentName: { type: String },
      fileUrl: { type: String },
      publicId: { type: String },
      uploadDate: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
    }],
  },
  
  // Additional Information
  additionalInfo: {
    previousSchoolDetails: {
      name: { type: String },
      address: { type: String },
      contactPerson: { type: String },
      contactNumber: { type: String },
    },
    extraCurricularActivities: [{
      activity: { type: String },
      level: { type: String, enum: ["School", "District", "State", "National", "International"] },
      achievement: { type: String },
      year: { type: String },
    }],
    achievements: [{
      title: { type: String },
      description: { type: String },
      date: { type: Date },
    }],
    remarks: { type: String },
    specialInstructions: { type: String },
  },
  
  // Account Status
  accountInfo: {
    status: {
    type: String,
    enum: ["Active", "Inactive", "Alumni"],
    default: "Active",
  },
  },
});



// User Account Schema (for authentication)
const userAccountSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  plainPassword: { type: String }, // for temporary use
  
  // Role and Permissions
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  permissions: [{ type: String }],


  // wishlist studymaterial
  wishlist: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "StudyMaterial"
}],
  
  // Authentication
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date, default: Date.now },
  twoFactorEnabled: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },

  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended", "Graduated", "Transferred"],
    default: "Active", // ✅ Add default value
  },
  
  // Security
  trustedDevices: [{
    deviceId: { type: String },
    deviceInfo: { type: String },
    addedAt: { type: Date, default: Date.now },
  }],
  refreshTokens: [{
    token: { type: String },
    deviceInfo: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  
  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: String },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
  resetRequestCount: { type: Number, default: 0 },
  resetRequestWindowStart: { type: Date },
  resetRequestBlockedUntil: { type: Date },
  
  // Profile Image
  profileImage: {
    url: { type: String },
    public_id: { type: String },
  },
}, { timestamps: true });

// Main User Schema combining both
const usersSchema = new mongoose.Schema({
  // Reference to account
  account: userAccountSchema,
  
  // Student Information
  studentInfo: studentInfoSchema,
  
  // Common fields for both students and staff
  userType: {
    type: String,
    enum: ["Student", "Teacher", "Staff", "Admin", "Parent"],
    required: true,
  },
  
  // Additional metadata
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    registrationIP: { type: String },
    lastModifiedIP: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
}, {
  timestamps: true,
});

// Indexes for better performance
// usersSchema.index({ "account.email": 1 });
usersSchema.index({ "account.username": 1 });
usersSchema.index({ "account.phone": 1 });
usersSchema.index({ "studentInfo.studentId": 1 });
usersSchema.index({ "studentInfo.admissionNumber": 1 });
usersSchema.index({ "studentInfo.personalInfo.aadhaarNumber": 1 });
usersSchema.index({ userType: 1 });
usersSchema.index({ "account.status": 1 });

// Virtual for full name
usersSchema.virtual("fullName").get(function() {
  if (this.userType === "Student" && this.studentInfo.personalInfo) {
    return this.studentInfo.personalInfo.fullName;
  }
  return this.account.name;
});

// Virtual for age calculation
usersSchema.virtual("age").get(function() {
  if (this.userType === "Student" && this.studentInfo.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.studentInfo.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

usersSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.account?.password;
    delete ret.account?.plainPassword;
    delete ret.account?.refreshTokens;
    delete ret.account?.resetPasswordToken;
    delete ret.account?.resetPasswordOTP;
    return ret;
  },
});

// Methods
usersSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if(this.account.passwordChangedAt) {
    const changedTimestamp = parseInt(this.account.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

usersSchema.methods.removeToken = async function (token) {
  this.account.refreshTokens = this.account.refreshTokens.filter(t => t.token !== token);
  await this.save();
};

// module.exports = mongoose.model("Students", usersSchema);
// ❌ OLD
// module.exports = mongoose.model("Students", usersSchema);

// ✅ NEW
export default mongoose.model("Students", usersSchema);