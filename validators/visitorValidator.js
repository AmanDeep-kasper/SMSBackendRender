// import Joi from "Joi";
// const mobilePattern = /^[0-9]{10}$/;
// const namePattern = /^[a-zA-Z\s]+$/;

// const createVisitorRegisterSchema=Joi.object({
  
// date: Joi.string().allow('', null).optional(),
// name: Joi.string().required().pattern(namePattern).messages({
//     'string.pattern.base': 'Visitor name must contain letters and spaces only',
//     'string.empty': 'Visitor name is required'
//   }),
//   phone: Joi.string().required().pattern(mobilePattern).messages({
//     'string.pattern.base': 'Mobile number must be exactly 10 digits',
//     'string.empty': 'Mobile number is required'
//   }),
//   purpose: Joi.string().required().pattern(namePattern).max(50).messages({
//     'string.pattern.base': 'Purpose should contain letters and spaces only',
//     'string.max': 'Purpose cannot exceed 50 characters',
//     'string.empty': 'Purpose of visit is required'
//   }),
//   idProofNumber: Joi.string().max(12).allow('', null).messages({
//     'string.max': 'ID Proof Number cannot exceed 12 characters'
//   }),
//   noOfPerson: Joi.string().default('1').custom((value, helpers) => {
//     if (parseInt(value) < 1) {
//       return helpers.message('Number of persons must be at least 1');
//     }
// return value;
//   }),
// note: Joi.string().max(1000).allow('', null).custom((value, helpers) => {
//     if (!value) return value;
//     const words = value.trim().split(/\s+/);
//     if (words.length > 100) {
//       return helpers.message('Note cannot exceed 100 words');
//     }
//     return value;

// }),
//   checkInTime: Joi.string().allow('', null).optional(),
//   checkOutTime: Joi.string().allow('', null).default(''),
//   status: Joi.string().valid('Checked In', 'Checked Out').allow('', null).optional(),
 
// });


// const updateVisitorRegisterSchema = Joi.object({
//   date: Joi.string().optional().allow('', null),
//   name: Joi.string().pattern(namePattern).optional().allow('', null),
//   phone: Joi.string().pattern(mobilePattern).optional().allow('', null),
//   purpose: Joi.string().pattern(namePattern).max(50).optional().allow('', null),
//   idProofNumber: Joi.string().max(12).optional().allow('', null),
//   noOfPerson: Joi.string().optional().allow('', null),
//   note: Joi.string().max(1000).optional().allow('', null),

//   checkInTime: Joi.string().optional().allow('', null),
//   checkOutTime: Joi.string().optional().allow('', null),
//   status: Joi.string().valid('Checked In', 'Checked Out').optional(),
 
// });




// const validate = (schema) => {
//   return (req, res, next) => {
//     const { error, value } = schema.validate(req.body, {
//       abortEarly: false,
//       stripUnknown: true
//     });

//     if (error) {
//       const errors = error.details.map(detail => ({
//         field: detail.path.join('.'),
//         message: detail.message
//       }));

//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors
//       });
//     }

//     req.body = value;
//     next();
//   };
// };

// export {
//   createVisitorRegisterSchema,
//   updateVisitorRegisterSchema,
//   validate
// };