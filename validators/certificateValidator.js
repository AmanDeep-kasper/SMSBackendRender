import Joi from "joi";

const certificateTypes = [
  "transfer",
  "bonafide",
  "dob",
  "character",
  "participation",
  "appreciation",
  "achievement",
];

const dateString = Joi.string().trim().allow("");

const tcFormDataSchema = Joi.object({
  dateOfFirstAdmission: dateString,
  lastClassStudied: Joi.string().trim().allow(""),
  annualExamResult: Joi.string().trim().allow(""),
  failedInClass: Joi.string().trim().allow(""),
  subjectsStudied: Joi.string().trim().allow(""),
  qualifiedForPromotion: Joi.string().trim().allow(""),
  promotionTargetClass: Joi.string().trim().allow(""),
  schoolDuesPaidUpto: Joi.string().trim().allow(""),
  feeConcession: Joi.string().trim().allow(""),
  workingDaysInSession: Joi.string().trim().allow(""),
  workingDaysPresent: Joi.string().trim().allow(""),
  nccCadetScoutGuide: Joi.string().trim().allow(""),
  gamesExtracurricular: Joi.string().trim().allow(""),
  generalConduct: Joi.string().trim().allow(""),
  dateOfApplication: dateString,
  dateOfIssue: dateString,
  reasonForLeaving: Joi.string().trim().allow(""),
  otherRemarks: Joi.string().trim().allow(""),
}).default({});

export const createCertificateSchema = Joi.object({
  certificateType: Joi.string().valid(...certificateTypes).required(),
  studentId: Joi.string().trim().required(),
  academicYear: Joi.string().trim().required(),
  className: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
  issueDate: Joi.date().optional(),
  status: Joi.string().valid("draft", "issued").default("issued"),
  templateId: Joi.when("certificateType", {
    is: Joi.valid("participation", "appreciation", "achievement"),
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().allow("").optional(),
  }),
  subtitle: Joi.when("certificateType", {
    is: Joi.valid("participation", "appreciation", "achievement"),
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().allow("").optional(),
  }),
  content: Joi.when("certificateType", {
    is: Joi.valid("participation", "appreciation", "achievement"),
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().allow("").optional(),
  }),
  tcFormData: tcFormDataSchema,
}).custom((value, helpers) => {
  if (
    value.certificateType === "transfer" &&
    !value.tcFormData?.reasonForLeaving?.trim()
  ) {
    return helpers.message({
      custom: "Reason for leaving is required for Transfer Certificate",
    });
  }
  return value;
});

export const updateCertificateSchema = Joi.object({
  academicYear: Joi.string().trim().optional(),
  className: Joi.string().trim().optional(),
  section: Joi.string().trim().optional(),
  issueDate: Joi.date().optional(),
  status: Joi.string().valid("draft", "issued").optional(),
  templateId: Joi.string().trim().allow("").optional(),
  subtitle: Joi.string().trim().allow("").optional(),
  content: Joi.string().trim().allow("").optional(),
  tcFormData: tcFormDataSchema.optional(),
}).min(1);

export const listCertificatesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow("").default(""),
  certificateType: Joi.string().valid(...certificateTypes).allow("").optional(),
  academicYear: Joi.string().trim().allow("").optional(),
  className: Joi.string().trim().allow("").optional(),
  section: Joi.string().trim().allow("").optional(),
  studentId: Joi.string().trim().allow("").optional(),
  sortBy: Joi.string().valid("issueDate", "createdAt", "certificateNo").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const studentQuerySchema = Joi.object({
  academicYear: Joi.string().trim().required(),
  className: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
});

export const studentCertificateQuerySchema = Joi.object({
  certificateType: Joi.string().valid(...certificateTypes).optional(),
  academicYear: Joi.string().trim().allow("").optional(),
  className: Joi.string().trim().allow("").optional(),
  section: Joi.string().trim().allow("").optional(),
});

export const mongoIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid Certificate ID format",
    "string.hex": "Invalid Certificate ID format",
  }),
});

export const studentIdParamSchema = Joi.object({
  studentId: Joi.string().trim().required(),
});

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate =
      source === "params"
        ? req.params
        : source === "query"
          ? req.query
          : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    if (source === "params") req.params = value;
    else if (source === "query") req.validatedQuery = value;
    else req.body = value;

    next();
  };
};
