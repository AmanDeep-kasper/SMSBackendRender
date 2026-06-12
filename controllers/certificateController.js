import Certificate from "../models/CertificateModel.js";
import CertificateCounter from "../models/CertificateCounterModel.js";
import Class from "../models/Academic/AddClassModel.js";
import Student from "../models/studentsmodel.js";

const CERTIFICATE_PREFIX = {
  transfer: "TC",
  bonafide: "BON",
  dob: "DOB",
  character: "CHAR",
  participation: "PART",
  appreciation: "APP",
  achievement: "ACH",
};

const SINGLE_ACTIVE_CERTIFICATE_TYPES = new Set([
  "transfer",
  "bonafide",
  "dob",
  "character",
]);

const DEFAULT_SCHOOL_META = {
  name: "School name",
  address: "2972 Westheimer Rd. Santa Ana, Illinois 85486",
  contact: "Phone: +91-22-1234-5678 | Email: info@greenwood.edu.in",
};

/** Old certificate dummy used ordinal labels — exclude from real class lists */
const ORDINAL_CLASS_PATTERN = /^\d+(st|nd|rd|th)$/i;

function sortMetaValues(values = []) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
}

function isRealClassName(className) {
  return Boolean(className) && !ORDINAL_CLASS_PATTERN.test(String(className).trim());
}

function buildClassOptions(studentClasses = [], classModelNames = []) {
  const merged = new Set(
    [...studentClasses, ...classModelNames]
      .map((className) => String(className).trim())
      .filter(isRealClassName)
  );
  return sortMetaValues([...merged]);
}

function getCertificateTypeLabel(certificateType) {
  return certificateType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeStudentId(rawId) {
  if (!rawId || typeof rawId !== "string") return "";
  const trimmed = rawId.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return trimmed;
  }

  const threeDigit = String(parseInt(digits, 10)).padStart(3, "0");
  const fourDigit = String(parseInt(digits, 10)).padStart(4, "0");

  if (/^STUD-/i.test(trimmed)) {
    return `STUD-${fourDigit}`;
  }

  if (/^STU-?/i.test(trimmed)) {
    return `STU${threeDigit}`;
  }

  return trimmed;
}

function getStudentIdVariants(rawId) {
  if (!rawId || typeof rawId !== "string") return [];

  const trimmed = rawId.trim();
  const digits = trimmed.replace(/\D/g, "");
  const variants = new Set([trimmed]);

  if (digits) {
    const numeric = String(parseInt(digits, 10));
    variants.add(`STU${numeric.padStart(3, "0")}`);
    variants.add(`STU-${numeric.padStart(3, "0")}`);
    variants.add(`STUD-${numeric.padStart(4, "0")}`);
  }

  const normalized = normalizeStudentId(trimmed);
  if (normalized) {
    variants.add(normalized);
  }

  return [...variants];
}

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", options);
}

function formatSubjectsStudied(academic = {}) {
  const subjectNames = (academic.subjects || [])
    .map((subject) => subject?.name)
    .filter(Boolean);
  const optionalSubjects = (academic.optionalSubjects || []).filter(Boolean);
  return [...subjectNames, ...optionalSubjects].join(", ");
}

function formatFeeConcession(feeInfo = {}) {
  if (feeInfo.concessionType) {
    return `Yes - ${feeInfo.concessionType}`;
  }
  if (feeInfo.scholarshipDetails?.isScholarshipApplicable) {
    const scholarshipType = feeInfo.scholarshipDetails.scholarshipType || "Scholarship";
    return `Yes - ${scholarshipType}`;
  }
  if (feeInfo.concessionPercentage || feeInfo.concessionAmount) {
    return "Yes";
  }
  return "";
}

function formatSchoolDuesPaidUpto(feeInfo = {}) {
  const paymentHistory = feeInfo.paymentHistory || [];
  if (!paymentHistory.length) return "";

  const latestPayment = [...paymentHistory].sort(
    (left, right) => new Date(right.date || 0) - new Date(left.date || 0)
  )[0];

  return latestPayment?.date
    ? formatDate(latestPayment.date, { day: "2-digit", month: "long", year: "numeric" })
    : "";
}

function formatDateOfFirstAdmission(admissionDate, admissionClass = "") {
  if (!admissionDate && !admissionClass) return "";
  if (!admissionDate) return admissionClass;
  const formattedDate = formatDate(admissionDate, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return admissionClass ? `${formattedDate}, ${admissionClass}` : formattedDate;
}

function buildTcPrefillFields(student) {
  const info = student?.studentInfo || {};
  const academic = info.academicInfo || {};
  const feeInfo = info.feeInfo || {};

  return {
    dateOfFirstAdmission: formatDateOfFirstAdmission(info.admissionDate),
    subjectsStudied: formatSubjectsStudied(academic),
    schoolDuesPaidUpto: formatSchoolDuesPaidUpto(feeInfo),
    feeConcession: formatFeeConcession(feeInfo),
    failedInClass: "",
    workingDaysInSession: "",
    workingDaysPresent: "",
    lastClassStudied: academic.currentClass || "",
  };
}

function buildStudentSnapshot(student) {
  const info = student?.studentInfo || {};
  const personal = info.personalInfo || {};
  const parent = info.parentInfo || {};
  const academic = info.academicInfo || {};

  return {
    studentName: personal.fullName || "",
    admissionNumber: info.admissionNumber || "",
    rollNumber: info.rollNumber || "",
    fatherName: parent.father?.fullName || "",
    motherName: parent.mother?.fullName || "",
    dateOfBirth: personal.dateOfBirth ? formatDate(personal.dateOfBirth, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) : "",
    nationality: personal.nationality || "",
    casteCategory: personal.category || "",
    gender: personal.gender || "",
    currentClass: academic.currentClass || "",
    section: academic.section || "",
    academicYear: academic.academicYear || "",
  };
}

function formatCertificate(certificate) {
  const snapshot = certificate.studentSnapshot || {};
  return {
    _id: certificate._id,
    id: certificate._id?.toString(),
    certificateType: certificate.certificateType,
    certificateNo: certificate.certificateNo,
    tcNo: certificate.certificateNo,
    studentId: certificate.studentId,
    studentName: snapshot.studentName || "",
    admissionNumber: snapshot.admissionNumber || "",
    rollNumber: snapshot.rollNumber || "",
    fatherName: snapshot.fatherName || "",
    motherName: snapshot.motherName || "",
    dateOfBirth: snapshot.dateOfBirth || "",
    nationality: snapshot.nationality || "",
    casteCategory: snapshot.casteCategory || "",
    gender: snapshot.gender || "",
    academicYear: certificate.academicYear,
    className: certificate.className,
    section: certificate.section,
    issueDate: certificate.issueDate,
    issuedDate: certificate.issuedDate || formatDate(certificate.issueDate),
    status: certificate.status,
    templateId: certificate.templateId || "",
    subtitle: certificate.subtitle || "",
    content: certificate.content || "",
    lastStudiesClass: certificate.lastStudiesClass || certificate.className,
    enrollmentClass: certificate.enrollmentClass || certificate.className,
    transferReason: certificate.transferReason || "",
    transferToSchool: certificate.transferToSchool || "",
    dateOfLeaving: certificate.dateOfLeaving || "",
    conduct: certificate.conduct || "",
    tcFormData: certificate.tcFormData || {},
    studentSnapshot: snapshot,
    createdAt: certificate.createdAt,
    updatedAt: certificate.updatedAt,
  };
}

function formatStudentForCertificate(student) {
  const info = student.studentInfo || {};
  const academic = info.academicInfo || {};
  const snapshot = buildStudentSnapshot(student);
  const tcPrefill = buildTcPrefillFields(student);

  return {
    _id: student._id,
    fullName: snapshot.studentName,
    studentId: info.studentId || student._id?.toString(),
    admissionNumber: snapshot.admissionNumber,
    rollNumber: snapshot.rollNumber,
    academicYear: academic.academicYear || "",
    class: academic.currentClass || "",
    currentClass: academic.currentClass || "",
    section: academic.section || "",
    fatherName: snapshot.fatherName,
    motherName: snapshot.motherName,
    nationality: snapshot.nationality,
    category: snapshot.casteCategory,
    gender: snapshot.gender,
    dateOfBirth: snapshot.dateOfBirth,
    ...tcPrefill,
  };
}

function formatStudentFromCertificateSnapshot(certificate) {
  const snapshot = certificate?.studentSnapshot || {};
  const tcFormData = certificate?.tcFormData || {};
  return {
    _id: certificate.studentRef,
    fullName: snapshot.studentName || "",
    studentId: certificate.studentId,
    admissionNumber: snapshot.admissionNumber || "",
    rollNumber: snapshot.rollNumber || "",
    academicYear: certificate.academicYear || snapshot.academicYear || "",
    class: certificate.className || snapshot.currentClass || "",
    currentClass: certificate.className || snapshot.currentClass || "",
    section: certificate.section || snapshot.section || "",
    fatherName: snapshot.fatherName || "",
    motherName: snapshot.motherName || "",
    nationality: snapshot.nationality || "",
    category: snapshot.casteCategory || "",
    gender: snapshot.gender || "",
    dateOfBirth: snapshot.dateOfBirth || "",
    dateOfFirstAdmission: tcFormData.dateOfFirstAdmission || "",
    subjectsStudied: tcFormData.subjectsStudied || "",
    schoolDuesPaidUpto: tcFormData.schoolDuesPaidUpto || "",
    feeConcession: tcFormData.feeConcession || "",
    failedInClass: tcFormData.failedInClass || "",
    workingDaysInSession: tcFormData.workingDaysInSession || "",
    workingDaysPresent: tcFormData.workingDaysPresent || "",
    lastClassStudied: tcFormData.lastClassStudied || certificate.className || "",
  };
}

async function findStudentByStudentId(studentId) {
  const studentIdVariants = getStudentIdVariants(studentId);
  return Student.findOne({
    userType: "Student",
    $or: [
      { "studentInfo.studentId": { $in: studentIdVariants } },
      { _id: /^[0-9a-fA-F]{24}$/.test(studentId) ? studentId : null },
    ],
  });
}

async function generateCertificateNo(certificateType, issueDate) {
  const year = new Date(issueDate || Date.now()).getFullYear();
  const counter = await CertificateCounter.findOneAndUpdate(
    { certificateType, year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const prefix = CERTIFICATE_PREFIX[certificateType];
  return `${prefix}-${year}-${String(counter.sequence).padStart(4, "0")}`;
}

export const getCertificateMeta = async (req, res) => {
  try {
    const [
      studentYears,
      studentClasses,
      studentSections,
      classModelNames,
      classModelSections,
    ] = await Promise.all([
      Student.distinct("studentInfo.academicInfo.academicYear", { userType: "Student" }),
      Student.distinct("studentInfo.academicInfo.currentClass", { userType: "Student" }),
      Student.distinct("studentInfo.academicInfo.section", { userType: "Student" }),
      Class.distinct("className"),
      Class.distinct("section"),
    ]);

    const academicYears = sortMetaValues(studentYears.filter(Boolean)).reverse();
    const classes = buildClassOptions(studentClasses, classModelNames);

    const sections = sortMetaValues(
      [...new Set([...studentSections, ...classModelSections].filter(Boolean))]
    );

    res.status(200).json({
      success: true,
      data: {
        academicYears,
        classes,
        sections,
        school: DEFAULT_SCHOOL_META,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCertificateStudents = async (req, res) => {
  try {
    const { academicYear, className, section } = req.validatedQuery || req.query;
    const students = await Student.find({
      userType: "Student",
      "studentInfo.academicInfo.academicYear": academicYear,
      "studentInfo.academicInfo.currentClass": className,
      "studentInfo.academicInfo.section": section,
    }).select("studentInfo");

    res.status(200).json({
      success: true,
      data: students.map(formatStudentForCertificate),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCertificateStudentById = async (req, res) => {
  try {
    const student = await findStudentByStudentId(req.params.studentId);
    if (!student) {
      const certificate = await Certificate.findOne({
        studentId: normalizeStudentId(req.params.studentId),
        isDeleted: false,
      }).sort({ createdAt: -1 });

      if (!certificate) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      return res.status(200).json({
        success: true,
        data: formatStudentFromCertificateSnapshot(certificate),
      });
    }

    res.status(200).json({
      success: true,
      data: formatStudentForCertificate(student),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCertificates = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      certificateType,
      academicYear,
      className,
      section,
      studentId,
      sortBy,
      sortOrder,
    } = req.validatedQuery || req.query;

    const filter = { isDeleted: false };
    if (certificateType) filter.certificateType = certificateType;
    if (academicYear) filter.academicYear = academicYear;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (studentId) filter.studentId = { $in: getStudentIdVariants(studentId) };
    if (search) {
      filter.$or = [
        { certificateNo: { $regex: search, $options: "i" } },
        { "studentSnapshot.studentName": { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [total, certificates] = await Promise.all([
      Certificate.countDocuments(filter),
      Certificate.find(filter).sort(sort).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: certificates.map(formatCertificate),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.status(200).json({ success: true, data: formatCertificate(certificate) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCertificateByStudent = async (req, res) => {
  try {
    const studentIdVariants = getStudentIdVariants(req.params.studentId);
    const filter = {
      studentId: { $in: studentIdVariants },
      isDeleted: false,
    };
    const { certificateType, academicYear, className, section } =
      req.validatedQuery || req.query;
    if (certificateType) filter.certificateType = certificateType;
    if (academicYear) filter.academicYear = academicYear;
    if (className) filter.className = className;
    if (section) filter.section = section;

    const certificate = await Certificate.findOne(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: certificate ? formatCertificate(certificate) : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCertificate = async (req, res) => {
  try {
    const requestedStudentId = normalizeStudentId(req.body.studentId);
    const requestedStudentVariants = getStudentIdVariants(req.body.studentId);
    const student = await findStudentByStudentId(req.body.studentId);
    const snapshotSource = student
      ? null
      : await Certificate.findOne({
          studentId: { $in: requestedStudentVariants },
          isDeleted: false,
        }).sort({ createdAt: -1 });

    if (!student && !snapshotSource) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const studentId = normalizeStudentId(
      student?.studentInfo?.studentId || snapshotSource?.studentId || req.body.studentId,
    );

    const duplicateFilter = {
      certificateType: req.body.certificateType,
      studentId,
      academicYear: req.body.academicYear,
      className: req.body.className,
      section: req.body.section,
      isDeleted: false,
    };

    if (!SINGLE_ACTIVE_CERTIFICATE_TYPES.has(req.body.certificateType)) {
      duplicateFilter.templateId = req.body.templateId;
      duplicateFilter.content = req.body.content;
    }

    const existing = await Certificate.findOne(duplicateFilter);
    if (existing) {
      const certificateLabel = getCertificateTypeLabel(req.body.certificateType);
      return res.status(409).json({
        success: false,
        message: `${certificateLabel} certificate already exists for this student`,
        data: formatCertificate(existing),
      });
    }

    if (req.body.certificateType === "transfer") {
      const existingTransfer = await Certificate.findOne({
        certificateType: "transfer",
        studentId,
        isDeleted: false,
      });
      if (existingTransfer) {
        return res.status(409).json({
          success: false,
          message: "Transfer certificate already exists for this student",
          data: formatCertificate(existingTransfer),
        });
      }
    }

    const issueDate = req.body.issueDate || new Date();
    const certificateNo = await generateCertificateNo(req.body.certificateType, issueDate);
    const snapshot = student
      ? buildStudentSnapshot(student)
      : snapshotSource.studentSnapshot || {};
    const tcFormData = req.body.tcFormData || {};

    const certificate = await Certificate.create({
      certificateType: req.body.certificateType,
      certificateNo,
      studentId,
      studentRef: student?._id || snapshotSource?.studentRef || null,
      academicYear: req.body.academicYear,
      className: req.body.className,
      section: req.body.section,
      issueDate,
      status: req.body.status || "issued",
      studentSnapshot: snapshot,
      templateId: req.body.templateId,
      subtitle: req.body.subtitle,
      content: req.body.content,
      enrollmentClass: req.body.className,
      lastStudiesClass: tcFormData.lastClassStudied || req.body.className,
      issuedDate: tcFormData.dateOfIssue || formatDate(issueDate),
      transferReason: tcFormData.reasonForLeaving || "",
      dateOfLeaving: tcFormData.dateOfIssue || "",
      conduct: tcFormData.generalConduct || "",
      transferToSchool: "",
      tcFormData,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      data: formatCertificate(certificate),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate certificate record",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    const tcFormData = req.body.tcFormData || certificate.tcFormData || {};
    if (
      certificate.certificateType === "transfer" &&
      !tcFormData.reasonForLeaving?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason for leaving is required for Transfer Certificate",
      });
    }

    certificate.academicYear = req.body.academicYear || certificate.academicYear;
    certificate.className = req.body.className || certificate.className;
    certificate.section = req.body.section || certificate.section;
    certificate.issueDate = req.body.issueDate || certificate.issueDate;
    certificate.status = req.body.status || certificate.status;
    certificate.templateId = req.body.templateId ?? certificate.templateId;
    certificate.subtitle = req.body.subtitle ?? certificate.subtitle;
    certificate.content = req.body.content ?? certificate.content;
    certificate.tcFormData = tcFormData;
    certificate.enrollmentClass = req.body.className || certificate.enrollmentClass;
    certificate.lastStudiesClass = tcFormData.lastClassStudied || certificate.lastStudiesClass;
    certificate.issuedDate = tcFormData.dateOfIssue || certificate.issuedDate;
    certificate.transferReason = tcFormData.reasonForLeaving || certificate.transferReason;
    certificate.dateOfLeaving = tcFormData.dateOfIssue || certificate.dateOfLeaving;
    certificate.conduct = tcFormData.generalConduct || certificate.conduct;
    certificate.updatedBy = req.user?._id || certificate.updatedBy;

    await certificate.save();

    res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      data: formatCertificate(certificate),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    certificate.isDeleted = true;
    certificate.deletedAt = new Date();
    certificate.updatedBy = req.user?._id || certificate.updatedBy;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
