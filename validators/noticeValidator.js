import Joi from "joi";

const validRoles = ["All", "Student", "Super Admin", "Teacher"];

const attachmentItemSchema = Joi.object({
  url: Joi.string().required(),
  fileName: Joi.string().required(),
  fileType: Joi.string().valid("image", "pdf").required()
});

const createNoticeSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    "string.empty": "Title is required",
    "string.base": "Title must be a string"
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "string.base": "Description must be a string"
  }),
 
  publishDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    "string.pattern.base": "Publish date must be in YYYY-MM-DD format",
    "string.empty": "Publish date is required"
  }),
  publishTime: Joi.string().required().messages({
    "string.empty": "Publish time is required"
  }),
  messageFor: Joi.array().items(Joi.string().valid(...validRoles)).single().min(1).required().messages({
    "array.min": "Message For must contain at least one recipient role",
    "any.only": "Invalid role selected in Message For"
  }),
  // attachments: Joi.array().items(attachmentItemSchema).max(2).optional()
  //   .custom((attachments, helpers) => {
  //     const imageCount = attachments.filter(file => file.fileType === "image").length;
  //     const pdfCount = attachments.filter(file => file.fileType === "pdf").length;

  //     if (imageCount > 1) {
  //       return helpers.message({ custom: "Only one image file is allowed." });
  //     }
  //     if (pdfCount > 1) {
  //       return helpers.message({ custom: "Only one PDF file is allowed." });
  //     }
  //     return attachments;
  //   }),

   attachments: Joi.array().items(attachmentItemSchema).max(2).optional()
    .custom((attachments, helpers) => {
      // 1. If attachments array doesn't exist, return it immediately without running filters
      if (!attachments || attachments.length === 0) {
        return attachments;
      }

      const imageCount = attachments.filter(file => file.fileType === "image").length;
      const pdfCount = attachments.filter(file => file.fileType === "pdf").length;

      if (imageCount > 1) {
        return helpers.message({ custom: "Only one image file is allowed." });
      }
      if (pdfCount > 1) {
        return helpers.message({ custom: "Only one PDF file is allowed." });
      }
      return attachments;
    })

 
});

const updateNoticeSchema = Joi.object({
  title: Joi.string().trim().optional(),
  description: Joi.string().optional(),

  publishDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    "string.pattern.base": "Publish date must be in YYYY-MM-DD format"
  }),
  publishTime: Joi.string().optional(),
  messageFor: Joi.array().items(Joi.string().valid(...validRoles)).single().min(1).optional(),
  // attachments: Joi.array().items(attachmentItemSchema).max(2).optional()
  //   .custom((attachments, helpers) => {
  //     const imageCount = attachments.filter(file => file.fileType === "image").length;
  //     const pdfCount = attachments.filter(file => file.fileType === "pdf").length;

  //     if (imageCount > 1) {
  //       return helpers.message({ custom: "Only one image file is allowed." });
  //     }
  //     if (pdfCount > 1) {
  //       return helpers.message({ custom: "Only one PDF file is allowed." });
  //     }
  //     return attachments;
  //   }),
 



  attachments: Joi.array().items(attachmentItemSchema).max(2).optional()
    .custom((attachments, helpers) => {
      if (!attachments || attachments.length === 0) {
        return attachments;
      }

      const imageCount = attachments.filter(file => file.fileType === "image").length;
      const pdfCount = attachments.filter(file => file.fileType === "pdf").length;

      if (imageCount > 1) {
        return helpers.message({ custom: "Only one image file is allowed." });
      }
      if (pdfCount > 1) {
        return helpers.message({ custom: "Only one PDF file is allowed." });
      }
      return attachments;
    }),
 
});

const mongoIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid Notice ID format",
    "string.hex": "Invalid Notice ID format"
  })
});

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = source === "params" ? req.params : req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    if (source === "params") {
      req.params = value;
    } else {
      req.body = value;
    }
    next();
  };
};

export {
  createNoticeSchema,
  updateNoticeSchema,
  mongoIdSchema,
  validate
};
