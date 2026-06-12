// utils/validation.js
// const DOMPurify = require('dompurify');
import DOMPurify from 'dompurify';
import crypto from 'crypto'

// Sanitize input to prevent XSS
// const sanitizeInput = (input) => {
  export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// Encrypt sensitive data (Aadhaar, PAN)
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // 32 chars
const IV_LENGTH = 16;

// const encrypt = (text) => {
  export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// const decrypt = (text) => {
  export const decrypt = (text) => {
  if (!text) return null;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Validation rules
// const validationRules = {
export const validationRules = {
  // Student Basic Info
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.']+$/,
    message: "Student name must be 2-100 characters and contain only letters, spaces, hyphens, dots, and apostrophes"
  },
  
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  
  phone: {
    required: true,
    pattern: /^\d{10}$/,
    message: "Please enter a valid 10-digit mobile number"
  },
  
  dateOfBirth: {
    required: true,
    validate: (value) => {
      const date = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 3 && age <= 100;
    },
    message: "Student must be between 3 and 100 years old"
  },
  
  aadhaarNumber: {
    required: false,
    pattern: /^\d{12}$/,
    message: "Please enter a valid 12-digit Aadhaar number",
    encrypt: true
  },
  
  panNumber: {
    required: false,
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: "Please enter a valid PAN number (e.g., ABCDE1234F)",
    encrypt: true
  },
  
  gender: {
    required: true,
    options: ["Male", "Female", "Other"],
    message: "Please select a gender"
  },
  
  nationality: {
    required: true,
    options: ["India", "U.S.A", "U.K", "Canada", "Australia", "Other"],
    message: "Please select a nationality"
  },
  
  religion: {
    required: false,
    options: ["Hindu", "Muslim", "Sikh", "Christian", "Buddhist", "Jain", "Other"],
    message: "Please select a religion"
  },
  
  category: {
    required: false,
    options: ["General", "OBC", "SC", "ST", "Other"],
    message: "Please select a category"
  },
  
  bloodGroup: {
    required: false,
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    message: "Please select a blood group"
  },
  
  placeOfBirth: {
    required: false,
    minLength: 2,
    maxLength: 100,
    message: "Place of birth must be 2-100 characters"
  },
  
  motherTongue: {
    required: false,
    options: ["Hindi", "English", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati", "Malayalam", "Kannada", "Odia", "Punjabi", "Other"],
    message: "Please select a mother tongue"
  },
  
  languagesKnown: {
    required: false,
    message: "Please select a language"
  },
  
  // Academic Info
  academicYear: {
    required: true,
    options: ["2023-2024", "2024-2025", "2025-2026", "2026-2027"],
    message: "Please select an academic year"
  },
  
  currentClass: {
    required: true,
    options: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    message: "Please select a class"
  },
  
  section: {
    required: false,
    options: ["A", "B", "C", "D", "E"],
    message: "Please select a section"
  },
  
  stream: {
    required: false,
    options: ["Science", "Commerce", "Arts", "Vocational"],
    message: "Please select a stream"
  },
  
  house: {
    required: false,
    options: ["Red", "Blue", "Green", "Yellow"],
    message: "Please select a house"
  },
  
  yearOfPassing: {
    required: false,
    pattern: /^\d{4}$/,
    min: 1950,
    max: new Date().getFullYear(),
    message: "Please enter a valid year (1950-current year)"
  },
  
  percentage: {
    required: false,
    min: 0,
    max: 100,
    message: "Percentage must be between 0 and 100"
  },
  
  // Address
  addressLine1: {
    required: true,
    minLength: 5,
    maxLength: 200,
    message: "Address must be 5-200 characters"
  },
  
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: "City name must be 2-50 characters"
  },
  
  state: {
    required: true,
    message: "Please select a state"
  },
  
  country: {
    required: true,
    message: "Please select a country"
  },
  
  pincode: {
    required: true,
    pattern: /^\d{6}$/,
    message: "Please enter a valid 6-digit pincode"
  },
  
  // Parent Info
  fatherName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.']+$/,
    message: "Father's name must be 2-100 characters"
  },
  
  fatherMobile: {
    required: false,
    pattern: /^\d{10}$/,
    message: "Please enter a valid 10-digit mobile number"
  },
  
  fatherEmail: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  
  fatherOccupation: {
    required: false,
    options: ["Government Employee", "Private Employee", "Business", "Professional", "Retired", "Homemaker", "Unemployed", "Other"],
    message: "Please select an occupation"
  },
  
  fatherQualification: {
    required: false,
    options: ["Below Matriculation", "Matriculation", "Intermediate", "Graduation", "Post Graduation", "Diploma", "Professional Degree", "PhD", "Other"],
    message: "Please select a qualification"
  },
  
  fatherAnnualIncome: {
    required: false,
    min: 0,
    max: 100000000,
    message: "Please enter a valid annual income"
  },
  
  motherName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.']+$/,
    message: "Mother's name must be 2-100 characters"
  },
  
  motherMobile: {
    required: false,
    pattern: /^\d{10}$/,
    message: "Please enter a valid 10-digit mobile number"
  },
  
  motherEmail: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  
  motherOccupation: {
    required: false,
    options: ["Government Employee", "Private Employee", "Business", "Professional", "Retired", "Homemaker", "Unemployed", "Other"],
    message: "Please select an occupation"
  },
  
  motherQualification: {
    required: false,
    options: ["Below Matriculation", "Matriculation", "Intermediate", "Graduation", "Post Graduation", "Diploma", "Professional Degree", "PhD", "Other"],
    message: "Please select a qualification"
  },
  
  motherAnnualIncome: {
    required: false,
    min: 0,
    max: 100000000,
    message: "Please enter a valid annual income"
  },
  
  guardianRelation: {
    required: false,
    options: ["Father", "Mother", "Uncle", "Aunt", "Grandfather", "Grandmother", "Brother", "Sister", "Other"],
    message: "Please select a relation"
  },
  
  // Medical Info
  allergies: {
    required: false,
    maxLength: 200,
    message: "Allergies info cannot exceed 200 characters"
  },
  
  chronicIllness: {
    required: false,
    maxLength: 200,
    message: "Chronic illness info cannot exceed 200 characters"
  },
  
  dietaryRestrictions: {
    required: false,
    maxLength: 200,
    message: "Dietary restrictions cannot exceed 200 characters"
  },
  
  medication: {
    required: false,
    maxLength: 200,
    message: "Medication info cannot exceed 200 characters"
  },
  
  doctorContact: {
    required: false,
    pattern: /^\d{10}$/,
    message: "Please enter a valid 10-digit doctor's contact number"
  },
  
  // Transport
  route: {
    required: false,
    message: "Please select a route"
  },
  
  busStop: {
    required: false,
    message: "Please select a bus stop"
  },
  
  // Fee
  feeCategory: {
    required: false,
    options: ["General", "Scholarship", "Staff Ward", "Other"],
    message: "Please select a fee category"
  },
  
  concessionType: {
    required: false,
    options: ["Percentage", "Fixed Amount"],
    message: "Please select a concession type"
  },
  
  studentStatus: {
    required: true,
    options: ["Active", "Inactive", "Alumni"],
    message: "Please select a status"
  }
};

// Validation function
// const validateField = (field, value, isRequired = false) => {
  export const validateField = (field, value, isRequired = false) => {
  const rule = validationRules[field];
  if (!rule) return null;
  
  // Check required
  if (rule.required || isRequired) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return rule.message || `${field} is required`;
    }
  }
  
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null; // Optional field, no value, skip validation
  }
  
  const stringValue = String(value).trim();
  
  // Check min length
  if (rule.minLength && stringValue.length < rule.minLength) {
    return rule.message || `${field} must be at least ${rule.minLength} characters`;
  }
  
  // Check max length
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return rule.message || `${field} must be at most ${rule.maxLength} characters`;
  }
  
  // Check pattern
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return rule.message || `Invalid ${field} format`;
  }
  
  // Check options
  if (rule.options && !rule.options.includes(stringValue)) {
    return rule.message || `Please select a valid option for ${field}`;
  }
  
  // Check min/max numbers
  if (rule.min !== undefined && parseFloat(stringValue) < rule.min) {
    return rule.message || `${field} must be at least ${rule.min}`;
  }
  
  if (rule.max !== undefined && parseFloat(stringValue) > rule.max) {
    return rule.message || `${field} must be at most ${rule.max}`;
  }
  
  // Custom validation
  if (rule.validate && !rule.validate(value)) {
    return rule.message || `Invalid ${field}`;
  }
  
  return null;
};

// Complete form validation
// const validateForm = (formData, requiredFields = []) => {
  export const validateForm = (formData, requiredFields = []) => {
  const errors = {};
  
  // Validate all fields
  Object.keys(validationRules).forEach(field => {
    const isRequired = requiredFields.includes(field) || validationRules[field]?.required;
    const error = validateField(field, formData[field], isRequired);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

// Format select options for dropdowns
// const getSelectOptions = (fieldName) => {
  export const getSelectOptions = (fieldName) => {
  const rule = validationRules[fieldName];
  if (rule && rule.options) {
    return rule.options.map(opt => ({ value: opt, label: opt }));
  }
  return [];
};

// module.exports = {
//   sanitizeInput,
//   encrypt,
//   decrypt,
//   validateField,
//   validateForm,
//   getSelectOptions,
//   validationRules
// };