import streamifier from "streamifier";
import HomeworkSubmission from "../models/homeworkSubmissionModel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import User from "../models/studentsmodel.js";
import HomeworkModel from "../models/HomeworkModel.js";


const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "homeworksubmissions",
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


// CREATE SUBMISSION
// export const createHomeworkSubmission = async (req, res) => {
//   try {
//     const {
//     //   studentId,
//       homeworkId,
//     //   name,
//       remark,
//     } = req.body;

//     let uploadedFile = {};

//     if (req.file) {
//       const cloudinaryResult = await uploadToCloudinary(req.file);

//       uploadedFile = {
//         name: req.file.originalname,
//         size: formatFileSize(req.file.size),
//         url: cloudinaryResult.secure_url,
//         type: req.file.mimetype.split("/")[1],
//         public_id: cloudinaryResult.public_id,
//       };
//     }

//     const totalCount = await HomeworkSubmission.countDocuments();

//     // get user full name safely
//     let fullname;

//     // const user = await User.findById(req.user?._id);

//     // if (user) {
//     //   fullname = user?.studentInfo?.personalInfo?.fullName;
//     // }

//     const submission = await HomeworkSubmission.create({
//       submissionId: `STUD-${String(totalCount + 1).padStart(3, "0")}`,
//       studentId:req.user.id,
//       homeworkId,
//       name:req.user.name || fullname || req.user?.account?.username,
//       date: new Date().toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }),
//       files: req.file ? "1 file" : "0 file",
//       status: "Submitted",
//       remark: remark || "-",
//       submissionFile: uploadedFile,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Homework submitted successfully",
//       data: submission,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const createHomeworkSubmission = async (req, res) => {
    let uploadedFile = {};

    try {
        const {
            homeworkId,
            remark,
        } = req.body;

        // Upload file to cloudinary
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file);

            uploadedFile = {
                name: req.file.originalname,
                size: formatFileSize(req.file.size),
                url: cloudinaryResult.secure_url,
                type: req.file.mimetype.split("/")[1],
                public_id: cloudinaryResult.public_id,
                resource_type: cloudinaryResult.resource_type,
            };
        }

        try {
            const totalCount = await HomeworkSubmission.countDocuments();

            let fullname;

            const user = await User.findById(req.user?._id);

            if (user) {
                fullname = user?.studentInfo?.personalInfo?.fullName;
            }

            const submission = await HomeworkSubmission.create({
                submissionId: `STUD-${String(totalCount + 1).padStart(3, "0")}`,
                studentId: req.user.id,
                homeworkId,
                name:
                    req.user.name ||
                    fullname ||
                    req.user?.account?.username,

                date: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),

                files: req.file ? "1 file" : "0 file",
                status: "Submitted",
                remark: remark || "-",
                submissionFile: uploadedFile,
            });

            await HomeworkModel.findByIdAndUpdate(
                homeworkId,
                { $inc: { submitted: 1, progress: 1 } }
            );
            return res.status(201).json({
                success: true,
                message: "Homework submitted successfully",
                data: submission,
            });

        } catch (dbError) {

            // Delete uploaded file if DB save fails
            if (uploadedFile?.public_id) {
                // console.log(uploadedFile.public_id)
                await deleteFromCloudinary(
                    uploadedFile.public_id,
                    uploadedFile.resource_type
                );
            }

            throw dbError;
        }

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET ALL SUBMISSIONS
// export const getAllHomeworkSubmissions = async (req, res) => {
//     try {
//         // const submissions = await HomeworkSubmission.find()
//         //   .populate("studentId")
//         //   .populate("homeworkId")
//         //   .sort({ createdAt: -1 });

//         const { homeworkId } = req.query
//         const submissions = await HomeworkSubmission.find({ homeworkId: homeworkId })

//         res.status(200).json({
//             success: true,
//             data: submissions,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

export const getAllHomeworkSubmissions = async (req, res) => {
    try {
        let {
            search,
            status,
            remark,
            studentId,
            homeworkId,
            date,
        } = req.query;

        await HomeworkSubmission.updateMany(
            { active: { $exists: false } },
            { $set: { active: true } }
        );

        // normalize filters
        const normalizeFilter = (value) =>
            value?.toLowerCase() === "all" ? "" : value;

        status = normalizeFilter(status);
        remark = normalizeFilter(remark);
        studentId = normalizeFilter(studentId);
        homeworkId = normalizeFilter(homeworkId);
        date = normalizeFilter(date);

        // filter object
        const filter = {};

        // search across multiple fields
        if (search) {
            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    remark: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    status: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // exact filters
        if (status) filter.status = status;

        if (remark) {
            filter.remark = {
                $regex: remark,
                $options: "i",
            };
        }

        if (date) filter.date = date;

        // ObjectId filters
        if (studentId) {
            //   if (!mongoose.Types.ObjectId.isValid(studentId)) {
            //     return res.status(400).json({
            //       success: false,
            //       message: "Invalid studentId",
            //     });
            //   }

            filter.studentId = studentId;
        }

        if (homeworkId) {
            //   if (!mongoose.Types.ObjectId.isValid(homeworkId)) {
            //     return res.status(400).json({
            //       success: false,
            //       message: "Invalid homeworkId",
            //     });
            //   }

            filter.homeworkId = homeworkId;
        }

        const submissions = await HomeworkSubmission.find({ ...filter, active: true })
        //   .populate("studentId")
        //   .populate("homeworkId")
        //   .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// GET SINGLE SUBMISSION
export const getSingleHomeworkSubmission = async (req, res) => {
    try {
        const submission = await HomeworkSubmission.findOne({ _id: req.params.id, active: true })
            .populate("homeworkId");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        const data = submission.toObject();

        if (data.homeworkId?.publishDate) {
            data.homeworkId.publishDate = new Date(data.homeworkId.publishDate)
                .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
        }

        if (data.date) {
            data.date = new Date(data.date)
                .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
        }

        if (data.homeworkId?.dueDate) {
            data.homeworkId.dueDate = new Date(data.homeworkId.dueDate)
                .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
        }

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// UPDATE SUBMISSION
export const updateHomeworkSubmission = async (req, res) => {
    try {
        const submission = await HomeworkSubmission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        // delete old file
        if (req.file && submission.submissionFile?.public_id) {
            await deleteFromCloudinary(
                submission.submissionFile.public_id,
                submission.submissionFile.resource_type
            );
        }

        let updatedFile = submission.submissionFile;

        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file);

            updatedFile = {
                name: req.file.originalname,
                size: formatFileSize(req.file.size),
                url: cloudinaryResult.secure_url,
                type: req.file.mimetype.split("/")[1],
                public_id: cloudinaryResult.public_id,
            };
        }

        // submission.name = req.body.name || submission.name;
        submission.remark = req.body.remark || submission.remark;
        submission.status = req.body.status || submission.status;
        submission.submissionFile = updatedFile;

        await submission.save();

        if (submission.status === "Checked") {
            await HomeworkModel.findByIdAndUpdate(
                submission.homeworkId,
                { $inc: { checked: 1 } },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: "Submission updated successfully",
            data: submission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// DELETE SUBMISSION
export const deleteHomeworkSubmission = async (req, res) => {
    try {
        const submission = await HomeworkSubmission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        // delete cloudinary file
        // if (submission.submissionFile?.public_id) {
        //     await deleteFromCloudinary(
        //         submission.submissionFile.public_id,
        //         submission.submissionFile.resource_type
        //     );
        // }

        // await submission.deleteOne();
        const deletedSubmission = await Submission.findOneAndUpdate(
            { _id: req.params.id, active: true },
            { active: false },
            { new: true }
        );

        if (!deletedSubmission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }


        await HomeworkModel.findOneAndUpdate(
            { _id: submission.homeworkId, active: true },
            { $inc: { submitted: -1, progress: -1 } }
        );

        res.status(200).json({
            success: true,
            message: "Submission deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};