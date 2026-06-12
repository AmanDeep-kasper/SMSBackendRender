import Staff from "../../models/Staffs/AddStaff.models.js";
import cloudinary from "../../utils/cloudinary/cloudinary.js";
import Counter from "../../models/Counter.js/Counter.js";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const isPdf = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? "raw" : "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

export const createStaff = async (req, res) => {
  try {
    let profilePhoto = null;
    let documents = [];

    // ================= VALIDATIONS =================

    // Staff Name
    if (!req.body.personalInfo?.staffName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Staff Name is required",
      });
    }

    // Date of Birth
    if (!req.body.personalInfo?.dob) {
      return res.status(400).json({
        success: false,
        message: "Date of Birth is required",
      });
    }

    // Gender
    if (!req.body.personalInfo?.gender) {
      return res.status(400).json({
        success: false,
        message: "Gender is required",
      });
    }

    // Mobile Number
    if (!req.body.contactInfo?.mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile Number is required",
      });
    }

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(req.body.contactInfo.mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Mobile Number",
      });
    }

    // Email
    if (!req.body.contactInfo?.email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(req.body.contactInfo.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email Address",
      });
    }

    // Aadhaar Validation
    if (
      req.body.personalInfo?.aadhaarNumber &&
      !/^\d{12}$/.test(req.body.personalInfo.aadhaarNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar Number must be 12 digits",
      });
    }

    // PAN Validation
    if (
      req.body.personalInfo?.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
        req.body.personalInfo.panNumber.toUpperCase(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN Number",
      });
    }

    // Qualification Parse
    if (typeof req.body.qualificationInfo?.qualifications === "string") {
      req.body.qualificationInfo.qualifications = JSON.parse(
        req.body.qualificationInfo.qualifications,
      );
    }

    const counter = await Counter.findOneAndUpdate(
      { id: "staffId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const staffId = `EMP${String(counter.seq).padStart(5, "0")}`;

    // Generate Username & Password
    const email = req.body.personalInfo.staffName.toLowerCase();
    const staffName = req.body.personalInfo.staffName.trim();

    const firstName = staffName.split(" ")[0].toLowerCase();
    const last3Digits = staffId.slice(-3);

    const username = `${email}Staff@Kasperinfoetech.org`.toLowerCase();
    const password = `${firstName}${last3Digits}`;

    // Upload Profile
    if (req.files?.profilePhoto?.[0]) {
      const result = await uploadToCloudinary(
        req.files.profilePhoto[0],
        "staff/profile",
      );

      profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // Upload Documents
    if (req.files?.documents?.length > 0) {
      // Handle titles properly
      let documentTitles = req.body.documentTitles || [];

      // If single title comes as string convert to array
      if (!Array.isArray(documentTitles)) {
        documentTitles = [documentTitles];
      }

      documents = await Promise.all(
        req.files.documents.map(async (file, index) => {
          const result = await uploadToCloudinary(file, "staff/documents");

          return {
            title: documentTitles[index] || file.originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
          };
        }),
      );
    }

    const staffData = {
      staffId,
      username,
      password,
      ...req.body,
      profilePhoto,
      documents,
    };

    const staff = await Staff.create(staffData);

    const responseData = staff.toObject();

    delete responseData.password;

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: responseData,
      credentials: {
        username,
        password,
      },
    });
  } catch (error) {
    console.log("CREATE STAFF ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const search = req.query.search || "";
    const role = req.query.role || "";

    const skip = (page - 1) * limit;

    let query = {};

    // staff by staff Name OR Staff ID

    if (search) {
      query.$or = [
        {
          "personalInfo.staffName": {
            $regex: search,
            $options: "i",
          },
        },
        {
          staffId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // role filter
    if (role) {
      query["employmentInfo.role"] = role;
    }

    const totalStaff = await Staff.countDocuments(query);

    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: staff,
      pagination: {
        totalStaff,
        currentPage: page,
        totalPages: Math.ceil(totalStaff / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    // get id from url
    const { id } = req.params;
    // find staff

    const staff = await Staff.findById(id);
    // check if exist

    if (!staff) {
      return res.status({
        success: false,
        message: "Staff not found",
      });
    }
    // delete profile in clodinary
    if (staff.profilePhoto?.publicId) {
      await cloudinary.uploader.destroy(staff.profilePhoto.publicId);
    }
    // delete documents from cloudinary
    if (staff.documents?.length > 0) {
      for (const doc of staff.documents) {
        if (doc.publicId) {
          await cloudinary.uploader.destroy(doc.publicId, {
            resource_type: "raw",
          });
        }
      }
    }

    // delete data

    await Staff.findByIdAndDelete(id);

    // response send
    res.status(200).json({
      success: "true",
      message: "Staff deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = Staff.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "staff not found",
      });
    }

    let profilePhoto = staff.profilePhoto;
    let documents = staff.documents || [];

    // Parse qualifications if coming as string

    if (typeof req.body.qualificationInfo?.qualifications === "string") {
      req.body.qualificationInfo.qualifications = JSON.parse(
        req.body.qualificationInfo.qualifications,
      );
    }

    // Replace profile photo
    if (req.files?.profilePhoto?.[0]) {
      if (staff.profilePhoto?.publicId) {
        await cloudinary.uploader.destroy(staff.profilePhoto.publicId);
      }
      const result = await uploadToCloudinary(
        req.file.profilePhoto[0],
        "staff/profile",
      );
      profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }
    // Add new documents
    if (req.files?.documents?.length > 0) {
      let documentTitles = req.body.documentTitles || [];

      if (!Array.isArray(documentTitles)) {
        documentTitles = [documentTitles];
      }

      const newDocuments = await Promise.all(
        req.files.documents.map(async (file, index) => {
          const result = await uploadToCloudinary(file, "staff/documents");

          return {
            title: documentTitles[index] || file.originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
          };
        }),
      );

      documents = [...documents, ...newDocuments];
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      {
        ...req.body,
        profilePhoto,
        documents,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.log("UPDATE STAFF ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLoginPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { loginPermission } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      id,
      {
        loginPermission,
      },
      { new: true },
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login permission updated",
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendPasswordChangeLink = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    staff.resetPasswordToken = token;
    staff.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await staff.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendEmail(
      staff.contactInfo.email,
      "Password Reset Request",
      `Hello ${staff.personalInfo.staffName},

Click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.`,
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
