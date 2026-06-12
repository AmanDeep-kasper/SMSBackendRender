import HomeworkModel from "../models/HomeworkModel.js";
import HomeworkSubmissionModel from "../models/homeworkSubmissionModel.js";
import User from "../models/studentsmodel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import streamifier from "streamifier";

// ==========================
// HELPERS
// ==========================

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "homeworks",
                resource_type: "auto",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
    });
};

const deleteFromCloudinary = async (public_id, resource_type = "auto") => {
    if (!public_id) return;

    try {
        await cloudinary.uploader.destroy(public_id, { resource_type });
    } catch (err) {
        console.error("Cloudinary delete error:", err.message);
    }
};

const formatFileSize = (bytes = 0) => {
    if (!bytes) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${sizes[i]}`;
};

const capitalize = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();


export const updateHomeworkStatuses = async () => {
    const now = new Date();

    const homeworks = await HomeworkModel.find(
        {},
        {
            total: 1,
            submitted: 1,
            publishDate: 1,
            dueDate: 1,
            status: 1,
        }
    );

    const bulkOps = [];

    for (const hw of homeworks) {
        let status = "Active";

        if (hw.publishDate > now) {
            status = "Pending";
        } else if (hw.submitted >= hw.total && hw.total > 0) {
            status = "Completed";
        } else if (hw.dueDate < now) {
            status = "Overdue";
        }

        if (status !== hw.status) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: hw._id },
                    update: { $set: { status } },
                },
            });
        }
    }

    if (bulkOps.length) {
        await HomeworkModel.bulkWrite(bulkOps);
    }
};

// ==========================
// CREATE
// ==========================
export const createHomework = async (req, res) => {
    try {
        const {
            title,
            description,
            subject,
            className,
            section,
            teacher,
            status,
            //   publishDate,
            dueDate,
        } = req.body;

        let attachment = null;

        // console.log(req.body)


        if (req.file) {
            const uploaded = await uploadToCloudinary(req.file);

            attachment = {
                name: req.file.originalname,
                size: formatFileSize(req.file.size),
                url: uploaded.secure_url,
                public_id: uploaded.public_id,
                resource_type: uploaded.resource_type,
            };
        }

        let totalStudents = 40

        let fullname;

        const user = await User.findById(req.user?._id);

        if (user) {
            fullname = user?.studentInfo?.personalInfo?.fullName;
        }

        const homework = await HomeworkModel.create({
            title: capitalize(title),
            description,
            subject: capitalize(subject),
            className: capitalize(className),
            section: capitalize(section),
            teacher: capitalize(fullname || req.user?.account?.username || teacher),
            status,
            // publishDate: new Date().toLocaleDateString("en-GB", {
            //     day: "2-digit",
            //     month: "short",
            //     year: "numeric",
            // }),
            publishDate: new Date().now,
            submitted: 0,
            total: totalStudents,
            checked: 0,
            // submittedCount: `0/${totalStudents}`,
            // pendingCount: `0/${totalStudents}`,
            // checkedCount: `0/${totalStudents}`,
            // dueDate: new Date(dueDate).toLocaleDateString("en-GB", {
            //     day: "2-digit",
            //     month: "short",
            //     year: "numeric",
            // }),
            dueDate: dueDate,
            attachment,
        });

        res.status(201).json({
            success: true,
            message: "Homework created successfully",
            data: homework,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create homework",
            error: error.message,
        });
    }
};

// ==========================
// GET ALL
// ==========================
export const getAllHomework = async (req, res) => {
    try {

        await updateHomeworkStatuses();
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const { className, status, search } = req.query;

        const filter = {};

        // ✅ Class filter
        if (className) {
            filter.className = className;
        }

        // ✅ Search filter (FIXED: title + subject)
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // ✅ Status filter
        const now = new Date();

        if (status === "Active") {
            filter.dueDate = { $gte: now };
        }
        else if (status === "Overdue") {
            filter.dueDate = { $lt: now };
        }
        else if (status === "Pending") {
            filter.publishDate = { $gte: now }
        }
        else if (status === "Completed") {
            filter.$expr = {
                $eq: ["$submitted", "$total"],
            };
        }

        const [data, totalDocuments] = await Promise.all([
            HomeworkModel.find({ ...filter, active: true })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            HomeworkModel.countDocuments(filter),
        ]);

        const formatDate = (date) =>
            date
                ? new Date(date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : null;

        const formattedData = data.map((ele) => {
            const total = ele.total || 0;
            const submitted = ele.submitted || 0;
            const checked = ele.checked || 0;

            return {
                ...ele,
                _id: ele._id.toString(),
                publishDate: formatDate(ele.publishDate),
                dueDate: formatDate(ele.dueDate),
                submittedCount: `${submitted}/${total}`,
                pendingCount: `${Math.max(total - submitted, 0)}/${total}`,
                checkedCount: `${checked}/${total}`,
            };
        });

        res.status(200).json({
            success: true,
            count: formattedData.length,
            pagination: {
                total: totalDocuments,
                page,
                limit,
                totalPages: Math.ceil(totalDocuments / limit),
            },
            data: formattedData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch homework",
            error: error.message,
        });
    }
};

// ==========================
// GET ONE
// ==========================
export const getSingleHomework = async (req, res) => {
    try {

        const data = await HomeworkModel.findOne({
            _id: req.params.id,
            active: true
        }).lean();

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Homework not found",
            });
        }

        const formattedData = {
            ...data,
            publishDate: new Date(data.publishDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),

            dueDate: new Date(data.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),

            submittedCount: `${data.submitted}/${data.total}`,

            pendingCount: `${data.total - data.submitted}/${data.total}`,

            checkedCount: `${data.checked}/${data.total}`,
        };

        res.status(200).json({
            success: true,
            data: formattedData,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch homework",
            error: error.message,
        });
    }
};

// ==========================
// UPDATE
// ==========================
export const updateHomework = async (req, res) => {
    try {
        const homework = await HomeworkModel.findOne({
            _id: req.params.id,
            active: true
        });

        if (!homework) {
            return res.status(404).json({
                success: false,
                message: "Homework not found",
            });
        }

        const allowedStatus = ["Active", "Inactive", "Completed"];

        if (req.body.status && !allowedStatus.includes(req.body.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        let attachment = homework.attachment;

        if (req.file) {
            if (homework.attachment?.public_id) {
                await deleteFromCloudinary(
                    homework.attachment.public_id,
                    homework.attachment.resource_type
                );
            }

            const uploaded = await uploadToCloudinary(req.file);

            attachment = {
                name: req.file.originalname,
                size: formatFileSize(req.file.size),
                url: uploaded.secure_url,
                public_id: uploaded.public_id,
                resource_type: uploaded.resource_type,
            };
        }

        const allowedFields = {
            title: req.body.title ? capitalize(req.body.title) : undefined,
            description: req.body.description,
            subject: req.body.subject ? capitalize(req.body.subject) : undefined,
            className: req.body.className
                ? capitalize(req.body.className)
                : undefined,
            section: req.body.section ? capitalize(req.body.section) : undefined,
            teacher: req.body.teacher ? capitalize(req.body.teacher) : undefined,
            status: req.body.status,
            publishDate: req.body.publishDate,
            dueDate: req.body.dueDate,
            attachment,
        };

        Object.keys(allowedFields).forEach(
            (key) => allowedFields[key] === undefined && delete allowedFields[key]
        );

        const updated = await HomeworkModel.findOneAndUpdate(
            { _id: req.params.id, active: true },
            allowedFields,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Homework updated successfully",
            data: updated,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update homework",
            error: error.message,
        });
    }
};

// ==========================
// DELETE
// ==========================
export const deleteHomework = async (req, res) => {
    try {
        const homework = await HomeworkModel.findOneAndUpdate(
            { _id: req.params.id, active: true },
            { active: false },
            { new: true }
        );
        if (!homework) {
            return res.status(404).json({
                success: false,
                message: "Homework not found",
            });
        }

        // if (homework.attachment?.public_id) {
        //     await deleteFromCloudinary(
        //         homework.attachment.public_id,
        //         homework.attachment.resource_type
        //     );
        // }

        // await HomeworkModel.findByIdAndDelete(req.params.id);

        // ================= soft delete ==================
        const submissions = await HomeworkSubmissionModel.updateMany(
            {
                homeworkId: req.params.id,
                active: true
            },
            {
                active: false
            }
        );
        console.log(submissions)

        res.status(200).json({
            success: true,
            message: "Homework deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete homework",
            error: error.message,
        });
    }
};

