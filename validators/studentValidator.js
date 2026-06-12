// validators/studentValidator.js
// const Joi = require('joi');
import Joi from "joi";

// Custom validation for Indian mobile numbers (10 digits)
const mobilePattern = /^[0-9]{10}$/;
const pincodePattern = /^[0-9]{6}$/;
const aadhaarPattern = /^[0-9]{12}$/;
const namePattern = /^[a-zA-Z\s\-\.']+$/;
const percentagePattern = /^\d{1,3}(?:\.\d{1,2})?$/;

// Personal Info Validation Schema
const personalInfoSchema = Joi.object({
  fullName: Joi.string().required().min(2).max(100).pattern(namePattern).messages({
    'string.pattern.base': 'Full name must contain only letters, spaces, hyphens, dots, or apostrophes',
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters'
  }),
  firstName: Joi.string().allow('', null).max(50),
  lastName: Joi.string().allow('', null).max(50),
  dateOfBirth: Joi.date().required().max('now').messages({
    'date.max': 'Date of birth cannot be in the future',
    'date.base': 'Invalid date format'
  }),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  nationality: Joi.string().allow('', null),
  religion: Joi.string().allow('', null),
  category: Joi.string().valid('General', 'OBC', 'SC', 'ST', 'Other').allow('', null),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('', null),
  placeOfBirth: Joi.string().allow('', null).max(100),
  motherTongue: Joi.string().allow('', null),
  languagesKnown: Joi.array().items(Joi.string()),
  aadhaarNumber: Joi.string().pattern(aadhaarPattern).allow('', null).messages({
    'string.pattern.base': 'Aadhaar number must be exactly 12 digits'
  }),
  samagraId: Joi.string().allow('', null),
  identificationMarks: Joi.string().allow('', null).max(200)
});

// Previous School Schema
const previousSchoolSchema = Joi.object({
  name: Joi.string().allow('', null).max(200),
  board: Joi.string().allow('', null).max(100),
  schoolCode: Joi.string().allow('', null).max(20),
  yearOfPassing: Joi.string().allow('', null),
  percentage: Joi.number().min(0).max(100).allow('', null),
  grade: Joi.string().allow('', null),
  transferCertificateNo: Joi.string().allow('', null).max(50),
  transferReason: Joi.string().allow('', null).max(200)
});

// Subject Schema
const subjectSchema = Joi.object({
  name: Joi.string().required(),
  maxMarks: Joi.number().positive().required(),
  obtainedMarks: Joi.number().min(0).required(),
  percentage: Joi.number().min(0).max(100)
});

// Academic Info Schema
const academicInfoSchema = Joi.object({
  academicYear: Joi.string().required().pattern(/^\d{4}-\d{4}$/).messages({
    'string.pattern.base': 'Academic year must be in format YYYY-YYYY'
  }),
  currentClass: Joi.string().required(),
  section: Joi.string().allow('', null),
  previousSchool: previousSchoolSchema,
  subjects: Joi.array().items(subjectSchema),
  stream: Joi.string().valid('Science', 'Commerce', 'Arts', 'Vocational').allow('', null),
  optionalSubjects: Joi.array().items(Joi.string())
});

// Address Schema
const addressSchema = Joi.object({
  addressLine1: Joi.string().required().min(5).max(200),
  addressLine2: Joi.string().allow('', null).max(200),
  city: Joi.string().required().min(2).max(50),
  state: Joi.string().required().min(2).max(50),
  country: Joi.string().default('India'),
  pincode: Joi.string().pattern(pincodePattern).required().messages({
    'string.pattern.base': 'Pincode must be exactly 6 digits'
  }),
  landmark: Joi.string().allow('', null).max(100)
});


const permanentAddressSchema = Joi.object({
  addressLine1: Joi.string().allow('', null).min(5).max(200),
  addressLine2: Joi.string().allow('', null).max(200),
  city: Joi.string().allow('', null).min(2).max(50),
  state: Joi.string().allow('', null).min(2).max(50),
  country: Joi.string().default('India'),
  pincode: Joi.string().pattern(pincodePattern).allow('', null),
  landmark: Joi.string().allow('', null).max(100),
  sameAsCurrent: Joi.boolean().default(false)
}).allow(null); 

// Contact Info Schema
const contactInfoSchema = Joi.object({
  primaryMobile: Joi.string().pattern(mobilePattern).required(),
  secondaryMobile: Joi.string().pattern(mobilePattern).allow('', null),
  email: Joi.string().email().required(),
  alternateEmail: Joi.string().email().allow('', null),
  currentAddress: addressSchema.required(),
  permanentAddress: Joi.alternatives().try(
    permanentAddressSchema,
    Joi.valid(null)  // ✅ Allow null
  ).optional()
});

// Parent/Guardian Details Schema
const parentDetailSchema = Joi.object({
  fullName: Joi.string().pattern(namePattern).allow('', null).min(2).max(100),
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  occupation: Joi.string().allow('', null),
  qualification: Joi.string().allow('', null),
  designation: Joi.string().allow('', null).max(100),
  organizationName: Joi.string().allow('', null).max(100),
  organizationAddress: Joi.string().allow('', null).max(200),
  annualIncome: Joi.number().min(0).allow('', null),
  mobileNumber: Joi.string().pattern(mobilePattern).allow('', null),
  email: Joi.string().email().allow('', null),
  profileImage: Joi.object({
    url: Joi.string(),
    public_id: Joi.string()
  }),
  aadhaarNumber: Joi.string().pattern(aadhaarPattern).allow('', null),
  panNumber: Joi.string().allow('', null)
});

const localGuardianSchema = Joi.object({
  fullName: Joi.string().pattern(namePattern).allow('', null).min(2).max(100),
  relation: Joi.string().allow('', null),
  mobileNumber: Joi.string().pattern(mobilePattern).allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.object({
    addressLine1: Joi.string().allow('', null),
    addressLine2: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string(),
    pincode: Joi.string().pattern(pincodePattern).allow('', null)
  }),
  profileImage: Joi.object({
    url: Joi.string(),
    public_id: Joi.string()
  })
});

const siblingSchema = Joi.object({
  fullName: Joi.string().pattern(namePattern).required(),
  admissionNumber: Joi.string().required(),
  class: Joi.string().required(),
  section: Joi.string().allow('', null),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  relation: Joi.string().required(),
  dateOfBirth: Joi.date().allow('', null)
});

const parentInfoSchema = Joi.object({
  father: parentDetailSchema,
  mother: parentDetailSchema,
  localGuardian: localGuardianSchema,
  siblings: Joi.array().items(siblingSchema),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relation: Joi.string(),
    mobileNumber: Joi.string().pattern(mobilePattern),
    alternateNumber: Joi.string().pattern(mobilePattern).allow('', null)
  })
});

// Medical Info Schema
const medicalInfoSchema = Joi.object({
  allergies: Joi.array().items(Joi.string()),
  chronicIllness: Joi.array().items(Joi.string()),
  dietaryRestrictions: Joi.array().items(Joi.string()),
  physicalDisability: Joi.boolean().default(false),
  disabilityDetails: Joi.string().allow('', null).max(500),
  medication: Joi.array().items(Joi.object({
    name: Joi.string(),
    dosage: Joi.string(),
    timing: Joi.string()
  })),
  doctor: Joi.object({
    name: Joi.string(),
    contactNumber: Joi.string().pattern(mobilePattern),
    clinicAddress: Joi.string()
  }),
  medicalNotes: Joi.string().allow('', null).max(1000),
  insuranceDetails: Joi.object({
    provider: Joi.string(),
    policyNumber: Joi.string(),
    validUntil: Joi.date()
  }),
  vaccinationStatus: Joi.object({
    isVaccinated: Joi.boolean().default(false),
    vaccinationDetails: Joi.array().items(Joi.string()),
    lastVaccinationDate: Joi.date()
  })
});

// Transport Info Schema
const transportInfoSchema = Joi.object({
  opted: Joi.boolean().default(false),
  route: Joi.string().allow('', null).max(50),
  busStop: Joi.string().allow('', null).max(100),
  busNumber: Joi.string().allow('', null).max(20),
  vehicleNumber: Joi.string().allow('', null),
  driverName: Joi.string().allow('', null).max(100),
  driverContact: Joi.string().pattern(mobilePattern).allow('', null),
  pickupPoint: Joi.string().allow('', null),
  dropPoint: Joi.string().allow('', null),
  transportFee: Joi.number().min(0),
  conductorName: Joi.string().allow('', null)
});

// Fee Info Schema
const feeInfoSchema = Joi.object({
  feeCategory: Joi.string().allow('', null),
  concessionType: Joi.string().allow('', null),
  concessionAmount: Joi.number().min(0),
  concessionPercentage: Joi.number().min(0).max(100),
  totalFee: Joi.number().min(0),
  paidAmount: Joi.number().min(0).default(0),
  pendingAmount: Joi.number().min(0).default(0),
  feeStructure: Joi.array().items(Joi.object({
    head: Joi.string(),
    amount: Joi.number(),
    frequency: Joi.string().valid('Monthly', 'Quarterly', 'Yearly')
  })),
  paymentHistory: Joi.array().items(Joi.object({
    date: Joi.date().default(Date.now),
    amount: Joi.number(),
    mode: Joi.string().valid('Cash', 'Cheque', 'Online', 'DD'),
    transactionId: Joi.string(),
    receiptNumber: Joi.string(),
    remarks: Joi.string()
  })),
  scholarshipDetails: Joi.object({
    isScholarshipApplicable: Joi.boolean().default(false),
    scholarshipType: Joi.string(),
    scholarshipAmount: Joi.number(),
    scholarshipProvider: Joi.string(),
    scholarshipValidUntil: Joi.date()
  })
});

// Account Schema
const accountSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(mobilePattern).required(),
  status: Joi.string().valid('Active', 'Inactive', 'Suspended', 'Graduated', 'Transferred').default('Active')
});

// Main Student Creation Schema
// validators/studentValidator.js - Complete fixed version

const createStudentSchema = Joi.object({
  userType: Joi.string().valid('Student').default('Student'),
  account: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(mobilePattern).required(),
    status: Joi.string().valid('Active', 'Inactive', 'Suspended', 'Graduated', 'Transferred').default('Active')
  }).required(),
  studentInfo: Joi.object({
    personalInfo: Joi.object({
      fullName: Joi.string().required().min(2).max(100).pattern(namePattern),
      firstName: Joi.string().allow('', null).max(50),
      lastName: Joi.string().allow('', null).max(50),
      dateOfBirth: Joi.date().allow(null).optional(),
      gender: Joi.string().valid('Male', 'Female', 'Other').allow('', null).optional(),
      nationality: Joi.string().allow('', null),
      religion: Joi.string().allow('', null),
      category: Joi.string().valid('General', 'OBC', 'SC', 'ST', 'Other').allow('', null),
      bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('', null),
      placeOfBirth: Joi.string().allow('', null).max(100),
      motherTongue: Joi.string().allow('', null),
      languagesKnown: Joi.array().items(Joi.string()),
      aadhaarNumber: Joi.string().pattern(aadhaarPattern).allow('', null),
      samagraId: Joi.string().allow('', null),
      identificationMarks: Joi.string().allow('', null).max(200)
    }),
    academicInfo: Joi.object({
      academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).allow('', null).optional(),
      currentClass: Joi.string().allow('', null).optional(),
      section: Joi.string().allow('', null),
      previousSchool: Joi.object({
        name: Joi.string().allow('', null).max(200),
        board: Joi.string().allow('', null).max(100),
        schoolCode: Joi.string().allow('', null).max(20),
        yearOfPassing: Joi.string().allow('', null),
        percentage: Joi.number().min(0).max(100).allow('', null),
        grade: Joi.string().allow('', null),
        transferCertificateNo: Joi.string().allow('', null).max(50),
        transferReason: Joi.string().allow('', null).max(200)
      }),
      subjects: Joi.array().items(Joi.object({
        name: Joi.string(),
        maxMarks: Joi.number().positive(),
        obtainedMarks: Joi.number().min(0),
        percentage: Joi.number().min(0).max(100)
      })),
      stream: Joi.string().valid('Science', 'Commerce', 'Arts', 'Vocational').allow('', null),
      optionalSubjects: Joi.array().items(Joi.string())
    }),
    contactInfo: Joi.object({
      primaryMobile: Joi.string().pattern(mobilePattern).allow('', null).optional(),
      secondaryMobile: Joi.string().pattern(mobilePattern).allow('', null),
      email: Joi.string().email().allow('', null).optional(),
      alternateEmail: Joi.string().email().allow('', null),
      currentAddress: Joi.object({
        addressLine1: Joi.string().allow('', null).optional(),
        addressLine2: Joi.string().allow('', null).max(200),
        city: Joi.string().allow('', null).optional(),
        state: Joi.string().allow('', null).optional(),
        country: Joi.string().default('India'),
        pincode: Joi.string().pattern(pincodePattern).allow('', null).optional(),
        landmark: Joi.string().allow('', null).max(100)
      }),
      permanentAddress: Joi.object({
        addressLine1: Joi.string().allow('', null).min(5).max(200),
        addressLine2: Joi.string().allow('', null).max(200),
        city: Joi.string().allow('', null).min(2).max(50),
        state: Joi.string().allow('', null).min(2).max(50),
        country: Joi.string().default('India'),
        pincode: Joi.string().pattern(pincodePattern).allow('', null),
        landmark: Joi.string().allow('', null).max(100),
        sameAsCurrent: Joi.boolean().default(false)
      })
    }),
    parentInfo: Joi.object({
      father: Joi.object({
        fullName: Joi.string().pattern(namePattern).allow('', null).min(2).max(100),
        mobileNumber: Joi.string().pattern(mobilePattern).allow('', null),
        email: Joi.string().email().allow('', null),
        occupation: Joi.string().allow('', null),
        qualification: Joi.string().allow('', null),
        designation: Joi.string().allow('', null).max(100),
        organizationName: Joi.string().allow('', null).max(100),
        organizationAddress: Joi.string().allow('', null).max(200),
        annualIncome: Joi.number().min(0).allow('', null)
      }),
      mother: Joi.object({
        fullName: Joi.string().pattern(namePattern).allow('', null).min(2).max(100),
        mobileNumber: Joi.string().pattern(mobilePattern).allow('', null),
        email: Joi.string().email().allow('', null),
        occupation: Joi.string().allow('', null),
        qualification: Joi.string().allow('', null),
        designation: Joi.string().allow('', null).max(100),
        organizationName: Joi.string().allow('', null).max(100),
        organizationAddress: Joi.string().allow('', null).max(200),
        annualIncome: Joi.number().min(0).allow('', null)
      }),
      localGuardian: Joi.object({
        fullName: Joi.string().pattern(namePattern).allow('', null).min(2).max(100),
        relation: Joi.string().allow('', null),
        mobileNumber: Joi.string().pattern(mobilePattern).allow('', null),
        email: Joi.string().email().allow('', null)
      }),
      siblings: Joi.array().items(Joi.object({
        fullName: Joi.string().pattern(namePattern),
        admissionNumber: Joi.string(),
        class: Joi.string(),
        section: Joi.string().allow('', null),
        gender: Joi.string().valid('Male', 'Female', 'Other'),
        relation: Joi.string(),
        dateOfBirth: Joi.date().allow('', null)
      })),
      emergencyContact: Joi.object({
        name: Joi.string(),
        relation: Joi.string(),
        mobileNumber: Joi.string().pattern(mobilePattern),
        alternateNumber: Joi.string().pattern(mobilePattern).allow('', null)
      })
    }),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(Joi.string()),
      chronicIllness: Joi.array().items(Joi.string()),
      dietaryRestrictions: Joi.array().items(Joi.string()),
      physicalDisability: Joi.boolean().default(false),
      disabilityDetails: Joi.string().allow('', null).max(500),
      medication: Joi.array().items(Joi.object({
        name: Joi.string(),
        dosage: Joi.string(),
        timing: Joi.string()
      })),
      doctor: Joi.object({
        name: Joi.string(),
        contactNumber: Joi.string().pattern(mobilePattern),
        clinicAddress: Joi.string()
      }),
      medicalNotes: Joi.string().allow('', null).max(1000),
      insuranceDetails: Joi.object({
        provider: Joi.string(),
        policyNumber: Joi.string(),
        validUntil: Joi.date()
      }),
      vaccinationStatus: Joi.object({
        isVaccinated: Joi.boolean().default(false),
        vaccinationDetails: Joi.array().items(Joi.string()),
        lastVaccinationDate: Joi.date()
      })
    }),
    transportInfo: Joi.object({
      opted: Joi.boolean().default(false),
      route: Joi.string().allow('', null).max(50),
      busStop: Joi.string().allow('', null).max(100),
      busNumber: Joi.string().allow('', null).max(20),
      vehicleNumber: Joi.string().allow('', null),
      driverName: Joi.string().allow('', null).max(100),
      driverContact: Joi.string().pattern(mobilePattern).allow('', null),
      pickupPoint: Joi.string().allow('', null),
      dropPoint: Joi.string().allow('', null),
      transportFee: Joi.number().min(0),
      conductorName: Joi.string().allow('', null)
    }),
    feeInfo: Joi.object({
      feeCategory: Joi.string().allow('', null),
      concessionType: Joi.string().allow('', null),
      concessionAmount: Joi.number().min(0),
      concessionPercentage: Joi.number().min(0).max(100),
      totalFee: Joi.number().min(0),
      paidAmount: Joi.number().min(0).default(0),
      pendingAmount: Joi.number().min(0).default(0),
      feeStructure: Joi.array().items(Joi.object({
        head: Joi.string(),
        amount: Joi.number(),
        frequency: Joi.string().valid('Monthly', 'Quarterly', 'Yearly')
      })),
      paymentHistory: Joi.array().items(Joi.object({
        date: Joi.date().default(Date.now),
        amount: Joi.number(),
        mode: Joi.string().valid('Cash', 'Cheque', 'Online', 'DD'),
        transactionId: Joi.string(),
        receiptNumber: Joi.string(),
        remarks: Joi.string()
      })),
      scholarshipDetails: Joi.object({
        isScholarshipApplicable: Joi.boolean().default(false),
        scholarshipType: Joi.string(),
        scholarshipAmount: Joi.number(),
        scholarshipProvider: Joi.string(),
        scholarshipValidUntil: Joi.date()
      })
    }),
    documents: Joi.object(),
    additionalInfo: Joi.object({
      previousSchoolDetails: Joi.object(),
      extraCurricularActivities: Joi.array(),
      achievements: Joi.array(),
      remarks: Joi.string().max(1000),
      specialInstructions: Joi.string().max(1000)
    }),
    accountInfo: Joi.object({
      status: Joi.string().valid('Active', 'Inactive', 'Alumni').default('Active')
    })
  })
});

// Update Student Schema (all fields optional)
// validators/studentValidator.js

// Update Student Schema - ALL FIELDS SHOULD BE OPTIONAL
const updateStudentSchema = Joi.object({
  account: Joi.object({
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().pattern(mobilePattern).optional().allow('', null),
    status: Joi.string().valid('Active', 'Inactive', 'Suspended', 'Graduated', 'Transferred').optional()
  }).optional(),
  
  studentInfo: Joi.object({
    personalInfo: Joi.object({
      fullName: Joi.string().min(2).max(100).pattern(namePattern).optional().allow('', null),
      firstName: Joi.string().max(50).optional().allow('', null),
      lastName: Joi.string().max(50).optional().allow('', null),
      dateOfBirth: Joi.date().max('now').optional().allow('', null),
      gender: Joi.string().valid('Male', 'Female', 'Other').optional().allow('', null),
      nationality: Joi.string().optional().allow('', null),
      religion: Joi.string().optional().allow('', null),
      category: Joi.string().valid('General', 'OBC', 'SC', 'ST', 'Other').optional().allow('', null),
      bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional().allow('', null),
      placeOfBirth: Joi.string().max(100).optional().allow('', null),
      motherTongue: Joi.string().optional().allow('', null),
      languagesKnown: Joi.array().items(Joi.string()).optional(),
      aadhaarNumber: Joi.string().pattern(aadhaarPattern).optional().allow('', null),
      samagraId: Joi.string().optional().allow('', null),
      identificationMarks: Joi.string().max(200).optional().allow('', null)
    }).optional(),
    
    academicInfo: Joi.object({
      academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional().allow('', null),  // ✅ Made optional
      currentClass: Joi.string().optional().allow('', null),
      section: Joi.string().optional().allow('', null),
      stream: Joi.string().valid('Science', 'Commerce', 'Arts', 'Vocational').optional().allow('', null),
      previousSchool: Joi.object({
        name: Joi.string().max(200).optional().allow('', null),
        board: Joi.string().max(100).optional().allow('', null),
        schoolCode: Joi.string().max(20).optional().allow('', null),
        yearOfPassing: Joi.string().optional().allow('', null),
        percentage: Joi.number().min(0).max(100).optional().allow('', null),
        grade: Joi.string().optional().allow('', null),
        transferCertificateNo: Joi.string().max(50).optional().allow('', null),
        transferReason: Joi.string().max(200).optional().allow('', null)
      }).optional(),
      subjects: Joi.array().items(Joi.object({
        name: Joi.string(),
        maxMarks: Joi.number().positive(),
        obtainedMarks: Joi.number().min(0),
        percentage: Joi.number().min(0).max(100)
      })).optional(),
      optionalSubjects: Joi.array().items(Joi.string()).optional()
    }).optional(),
    
    contactInfo: Joi.object({
      primaryMobile: Joi.string().pattern(mobilePattern).optional(),
      secondaryMobile: Joi.string().pattern(mobilePattern).optional().allow('', null),
      email: Joi.string().email().optional(),
      alternateEmail: Joi.string().email().optional().allow('', null),
      currentAddress: Joi.object({
        addressLine1: Joi.string().min(5).max(200).optional(),
        addressLine2: Joi.string().max(200).optional().allow('', null),
        city: Joi.string().min(2).max(50).optional(),
        state: Joi.string().min(2).max(50).optional(),
        country: Joi.string().default('India'),
        pincode: Joi.string().pattern(pincodePattern).optional(),
        landmark: Joi.string().max(100).optional().allow('', null)
      }).optional(),
      permanentAddress: Joi.object({
        addressLine1: Joi.string().min(5).max(200).optional().allow('', null),
        addressLine2: Joi.string().max(200).optional().allow('', null),
        city: Joi.string().min(2).max(50).optional().allow('', null),
        state: Joi.string().min(2).max(50).optional().allow('', null),
        country: Joi.string().default('India'),
        pincode: Joi.string().pattern(pincodePattern).optional().allow('', null),
        landmark: Joi.string().max(100).optional().allow('', null),
        sameAsCurrent: Joi.boolean().default(false)
      }).optional()
    }).optional(),
    
    parentInfo: Joi.object({
      father: Joi.object({
        fullName: Joi.string().pattern(namePattern).min(2).max(100).optional().allow('', null),
        mobileNumber: Joi.string().pattern(mobilePattern).optional().allow('', null),
        email: Joi.string().email().optional().allow('', null),
        occupation: Joi.string().optional().allow('', null),
        qualification: Joi.string().optional().allow('', null),
        designation: Joi.string().max(100).optional().allow('', null),
        organizationName: Joi.string().max(100).optional().allow('', null),
        organizationAddress: Joi.string().max(200).optional().allow('', null),
        annualIncome: Joi.number().min(0).optional().allow('', null)
      }).optional(),
      mother: Joi.object({
        fullName: Joi.string().pattern(namePattern).min(2).max(100).optional().allow('', null),
        mobileNumber: Joi.string().pattern(mobilePattern).optional().allow('', null),
        email: Joi.string().email().optional().allow('', null),
        occupation: Joi.string().optional().allow('', null),
        qualification: Joi.string().optional().allow('', null),
        designation: Joi.string().max(100).optional().allow('', null),
        organizationName: Joi.string().max(100).optional().allow('', null),
        organizationAddress: Joi.string().max(200).optional().allow('', null),
        annualIncome: Joi.number().min(0).optional().allow('', null)
      }).optional(),
      localGuardian: Joi.object({
        fullName: Joi.string().pattern(namePattern).min(2).max(100).optional().allow('', null),
        relation: Joi.string().optional().allow('', null),
        mobileNumber: Joi.string().pattern(mobilePattern).optional().allow('', null),
        email: Joi.string().email().optional().allow('', null)
      }).optional(),
      siblings: Joi.array().items(Joi.object({
        fullName: Joi.string().pattern(namePattern).optional(),
        admissionNumber: Joi.string().optional(),
        class: Joi.string().optional(),
        section: Joi.string().optional().allow('', null),
        gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
        relation: Joi.string().optional(),
        dateOfBirth: Joi.date().optional().allow('', null)
      })).optional()
    }).optional(),
    
    medicalInfo: Joi.object({
      allergies: Joi.array().items(Joi.string()).optional(),
      chronicIllness: Joi.array().items(Joi.string()).optional(),
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      physicalDisability: Joi.boolean().optional(),
      medication: Joi.array().items(Joi.object({
        name: Joi.string(),
        dosage: Joi.string(),
        timing: Joi.string()
      })).optional(),
      doctor: Joi.object({
        name: Joi.string(),
        contactNumber: Joi.string().pattern(mobilePattern),
        clinicAddress: Joi.string()
      }).optional(),
      medicalNotes: Joi.string().max(1000).optional().allow('', null)
    }).optional(),
    
    transportInfo: Joi.object({
      opted: Joi.boolean().optional(),
      route: Joi.string().max(50).optional().allow('', null),
      busStop: Joi.string().max(100).optional().allow('', null),
      busNumber: Joi.string().max(20).optional().allow('', null),
      driverName: Joi.string().max(100).optional().allow('', null)
    }).optional(),
    
    feeInfo: Joi.object({
      feeCategory: Joi.string().optional().allow('', null),
      concessionType: Joi.string().optional().allow('', null),
      concessionAmount: Joi.number().min(0).optional().allow('', null),
      totalFee: Joi.number().min(0).optional().allow('', null)
    }).optional(),
    
    additionalInfo: Joi.object({
      remarks: Joi.string().max(1000).optional().allow('', null),
      specialInstructions: Joi.string().max(1000).optional().allow('', null)
    }).optional(),
    
    accountInfo: Joi.object({
      status: Joi.string().valid('Active', 'Inactive', 'Alumni').optional()
    }).optional()
  }).optional()
});

// Validation middleware wrapper
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    req.body = value;
    next();
  };
};

// module.exports = {
//   createStudentSchema,
//   updateStudentSchema,
//   validate
// };
export {
  createStudentSchema,
  updateStudentSchema,
  validate
};