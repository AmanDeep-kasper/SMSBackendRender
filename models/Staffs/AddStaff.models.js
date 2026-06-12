import mongoose from "mongoose";

const qualificationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    year: String,
    percentage: String,
  },
  { _id: false },
);

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,
    loginPermission: {
      type: Boolean,
      default: true,
    },
    profilePhoto: {
      url: String,
      publicId: String,
    },

    personalInfo: {
      staffName: { type: String, required: true },
      dob: String,
      gender: String,
      aadhaarNumber: String,
      panNumber: String,
      nationality: String,
      category: String,
      religion: String,
      bloodGroup: String,
      languageKnown: [String],
      maritalStatus: String,
      spouseName: String,
      spouseOccupation: String,
      spousePhone: String,
      numberOfChildren: String,
      fatherName: String,
      motherName: String,
    },

    contactInfo: {
      mobileNumber: String,
      alternateMobile: String,
      email: String,
      emergencyPhone: String,
      emergencyName: String,
      emergencyRelation: String,
    },

    currentAddress: {
      addressLine: String,
      country: String,
      state: String,
      city: String,
      pinCode: String,
    },

    permanentAddress: {
      sameAsCurrent: { type: Boolean, default: false },
      addressLine: String,
      country: String,
      state: String,
      city: String,
      pinCode: String,
    },

    qualificationInfo: {
      highestQualification: String,
      specialization: String,
      totalExperience: String,
      qualifications: [qualificationSchema],
    },

    employmentInfo: {
      role: String,
      staffCategory: String,
      department: String,
      employeeId: String,
      dateOfJoining: String,
      employeeType: String,
      workShift: String,
      drivingLicenseNumber: String,
    },

    bankInfo: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      uanNumber: String,
    },

    documents: [
      {
        title: String,
        fileUrl: String,
        publicId: String,
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Staff", staffSchema);
