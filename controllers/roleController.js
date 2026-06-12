import Role from "../models/rolemodel.js";
import Students from "../models/studentsmodel.js";
import mongoose from "mongoose";

const getSystemRolePermissions = (roleName) => {
  if (roleName === "Admin") {
    return {
      Dashboard: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Students: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Teachers: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Staff: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      Roles: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: false,
        import: false,
        all: true,
      },
    };
  }

  if (roleName === "Teacher") {
    return {
      Dashboard: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Students: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Attendance: {
        create: true,
        read: true,
        update: true,
        delete: false,
        export: true,
        import: false,
        all: false,
      },
      Exams: {
        create: false,
        read: true,
        update: true,
        delete: false,
        export: true,
        import: false,
        all: false,
      },
    };
  }

  if (roleName === "Student") {
    return {
      Dashboard: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Profile: {
        create: false,
        read: true,
        update: true,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Attendance: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Exams: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Results: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
      Fees: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
        import: false,
        all: false,
      },
    };
  }

  return {};
};


// helper
export const createSchoolFixedRoles = async (schoolId, adminId) => {
  const roles = ["Admin", "Teacher", "Student"];

  for (const roleName of roles) {
    const existingRole = await Role.findOne({
      roleName,
      schoolId,
      isSystemRole: true,
    });

    if (!existingRole) {
      await Role.create({
        roleName,
        schoolId,
        createdBy: adminId,
        isSystemRole: true,
        status: "Active",
        modulePermissions: getSystemRolePermissions(roleName),
      });
    }
  }
};

// Create role with only modulePermissions
export const createRole = async (req, res, next) => {
  try {
    const { roleName, status, modulePermissions = {} } = req.body;

    // Validate required fields
    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const systemRoles = ["Super Admin", "Admin", "Teacher", "Student"];

    if (systemRoles.includes(roleName)) {
      return res.status(400).json({
        message: `${roleName} is a system role. You cannot create it manually.`,
      });
    }

    // Check for existing role
    const existingRole = await Role.findOne({
      roleName,
      schoolId: req.user.schoolId,
    });
    if (existingRole) {
      return res
        .status(400)
        .json({ message: "Role already exists in this school" });
    }

    // Ensure modulePermissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    Object.keys(modulePermissions).forEach((module) => {
      const perms = modulePermissions[module];

      enhancedPermissions[module] = {
        create: perms.create || false,
        read: perms.read || false,
        update: perms.update || false,
        delete: perms.delete || false,
        export: perms.export || false,
        import: perms.import || false,
        all:
          perms.all ||
          (perms.create &&
            perms.read &&
            perms.update &&
            perms.delete &&
            perms.export &&
            perms.import) ||
          false,
      };
    });

    const newRole = await Role.create({
      roleName,
      status: status || "Active",
      modulePermissions: enhancedPermissions,

      // important for SaaS
      schoolId: req.user.schoolId,
      createdBy: req.user.id,
      isSystemRole: false,
    });

    // await newRole.save();

    res.status(201).json({
      message: "Custom role created successfully",
      role: newRole,
    });
  } catch (error) {
    next(error);
    console.error("Create role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all roles with member count
export const getAllRoles = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.userType !== "Super Admin") {
      filter.$or = [{ schoolId: req.user.schoolId }, { isSystemRole: true }];
    }

    const roles = await Role.find(filter).sort({ createdAt: -1 });

    // Manually calculate member count for each role
    const formattedRoles = await Promise.all(
      roles.map(async (role) => {
        const memberCount = await Students.countDocuments({
          "account.role": role._id,
        });

        return {
          _id: role._id,
          roleName: role.roleName,
          status: role.status,
          isSystemRole: role.isSystemRole,
          modulePermissions: role.modulePermissions,
          memberCount,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        };
      }),
    );

    res.status(200).json(formattedRoles);
  } catch (error) {
    next(error);
    console.error("Get all roles error:", error);
    res.status(500).json({
      message: "Error fetching roles",
      error: error.message,
    });
  }
};

// Get role by ID with member count
export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Add validation for invalid IDs
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid role ID provided",
      });
    }

    // Optional: Add MongoDB ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid role ID format",
      });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const memberCount = await Students.countDocuments({
      "account.role": role._id,
    });

    const formattedRole = {
      _id: role._id,
      roleName: role.roleName,
      status: role.status,
      modulePermissions: role.modulePermissions,
      memberCount: memberCount || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    res.status(200).json(formattedRole);
  } catch (error) {
    next(error);
    console.error("Error fetching role by ID:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get only active roles (for dropdowns)
export const getActiveRoles = async (req, res, next) => {
  try {
    const activeRoles = await Role.find({
      status: "Active",
      $or: [{ schoolId: req.user.schoolId }, { isSystemRole: true }],
    });

    // Format for react-select with member counts
    const formattedRoles = await Promise.all(
      activeRoles.map(async (role) => {
        const memberCount = await Students.countDocuments({
          "account.role": role._id,
        });

        return {
          label: role.roleName,
          value: role._id,
          memberCount: memberCount || 0,
          permissions: role.modulePermissions,
        };
      }),
    );

    res.status(200).json(formattedRoles);
  } catch (error) {
    next(error);
    console.error("Get active roles error:", error);
    res.status(500).json({
      message: "Error fetching active roles",
      error: error.message,
    });
  }
};

// Update role
export const updateRole = async (req, res, next) => {
  try {
    const { roleName, status, modulePermissions } = req.body;

    // Ensure modulePermissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    if (modulePermissions) {
      Object.keys(modulePermissions).forEach((module) => {
        const perms = modulePermissions[module];
        enhancedPermissions[module] = {
          create: perms.create || false,
          read: perms.read || false,
          update: perms.update || false,
          delete: perms.delete || false,
          export: perms.export || false,
          import: perms.import || false,
          all:
            (perms.create &&
              perms.read &&
              perms.update &&
              perms.delete &&
              perms.export &&
              perms.import) ||
            perms.all ||
            false,
        };
      });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      {
        roleName,
        status,
        modulePermissions: enhancedPermissions,
      },
      { new: true, runValidators: true },
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    next(error);
    console.error("Update role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete role (with check for assigned users)
export const deleteRole = async (req, res, next) => {
  try {
    const roleId = req.params.id;

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(400).json({
        message: "System role cannot be deleted",
      });
    }

    // Check if any users are assigned to this role
    const userCount = await Students.countDocuments({ "account.role": roleId });

    if (userCount > 0) {
      return res.status(400).json({
        message: `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
      });
    }

    await Role.findByIdAndDelete(roleId);

    res.status(200).json({
      message: "Role deleted successfully",
      deletedRole: role,
    });
  } catch (error) {
    next(error);
    console.error("Delete role error:", error);
    res.status(500).json({
      message: "Error deleting role",
      error: error.message,
    });
  }
};

// Get role member count
export const getRoleMemberCount = async (req, res, next) => {
  try {
    const roleId = req.params.id;
    const count = await Students.countDocuments({ "account.role": roleId });

    res.status(200).json({ count });
  } catch (error) {
    next(error);
    console.error("Get role member count error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update role status
export const updateRoleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role status updated successfully",
      role,
    });
  } catch (error) {
    next(error);
    console.error("Update role status error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Duplicate role
export const duplicateRole = async (req, res, next) => {
  try {
    const roleId = req.params.id;
    const { newRoleName } = req.body;

    if (!newRoleName) {
      return res.status(400).json({ message: "New role name is required" });
    }

    // Check if new role name already exists
    const existingRole = await Role.findOne({ roleName: newRoleName });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    // Get original role
    const originalRole = await Role.findById(roleId);
    if (!originalRole) {
      return res.status(404).json({ message: "Original role not found" });
    }

    // Create duplicate with new name
    const duplicateRole = new Role({
      roleName: newRoleName,
      status: originalRole.status,
      modulePermissions: originalRole.modulePermissions,
    });

    await duplicateRole.save();

    res.status(201).json({
      message: "Role duplicated successfully",
      role: duplicateRole,
    });
  } catch (error) {
    next(error);
    console.error("Duplicate role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/roles/assign-permissions
export const assignPermissions = async (req, res, next) => {
  const { roleId, permissions } = req.body;
  try {
    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    // Ensure permissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    Object.keys(permissions).forEach((module) => {
      const perms = permissions[module];
      enhancedPermissions[module] = {
        create: perms.create || false,
        read: perms.read || false,
        update: perms.update || false,
        delete: perms.delete || false,
        export: perms.export || false,
        import: perms.import || false,
        all:
          (perms.create &&
            perms.read &&
            perms.update &&
            perms.delete &&
            perms.export &&
            perms.import) ||
          perms.all ||
          false,
      };
    });

    role.modulePermissions = enhancedPermissions;
    await role.save();

    res.status(200).json({
      message: "Permissions updated successfully",
      role,
    });
  } catch (err) {
    next(err);
    console.error("Assign permissions error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
