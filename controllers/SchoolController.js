import School from "../models/SchoolModel.js";
import Role from "../models/roleModel.js";

const defaultRoles = [
    {
        roleName: "Super Admin",
        status: "Active",
        modulePermissions: [
            "userManagement",
            "schoolManagement",
            "roleManagement",
            "moduleManagement",
            "reportManagement",
            "userManagement",
        ],
    },
];

export const registerSchool = async (req, res) => {
    try {
        const {
            schoolName,
            email,
            phone,
            address,
        } = req.body;

        const schoolCode =
            "SCH" + Date.now();

        const school =
            await School.create({
                schoolName,
                schoolCode,
                email,
                phone,
                address,
            });

        await Role.insertMany([
            {
                roleName: "Administrator",
                schoolId: school._id,
                isSystemRole: true,
                status: "Active",
            },
            {
                roleName: "Teacher",
                schoolId: school._id,
                isSystemRole: true,
                status: "Active",
            },
            {
                roleName: "Student",
                schoolId: school._id,
                isSystemRole: true,
                status: "Active",
            },
        ]);

        return res.status(201).json({
            success: true,
            message: "School Registered Successfully",
            data: school,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};