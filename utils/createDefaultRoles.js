// backend/utils/createDefaultRolesIfNotExist.js
// const Role = require('../models/rolemodel');
import Role from "../models/rolemodel.js";

const createDefaultRolesIfNotExist = async () => {
  try {
    // Get all possible modules from your frontend ALL_MODULES
    // You should import or define all modules here
    const ALL_MODULES_FOR_SMS = {
      Dashboard: true,
      Students: true,
      "Student Details": true,
      "Student Attendance": true,
      "Student Performance": true,
      "Student Promotion": true,
      "Student ID Card": true,
      Staff: true,
      "Staff Attendance": true,
      "Staff Leave": true,
      "Staff ID Card": true,
      Classes: true,
      Sections: true,
      Subjects: true,
      Timetable: true,
      Exams: true,
      Results: true,
      Rooms: true,
      "Fee Management": true,
      Payroll: true,
      Expenses: true,
      Certificate: true,
      Receipt: true,
      Library: true,
      Transport: true,
      Facilities: true,
      Notice: true,
      Messages: true,
      Events: true,
      Calendar: true,
      "Online Test": true,
      "Question Bank": true,
      Homework: true,
      Reports: true,
      Settings: true,
      Users: true,
      Roles: true  // ← IMPORTANT: Add Roles module!
    };

    // Create full permissions object for Super Admin and Admin
    const createFullPermissions = () => {
      const permissions = {};
      Object.keys(ALL_MODULES_FOR_SMS).forEach(module => {
        permissions[module] = {
          create: true,
          read: true,
          update: true,
          delete: module === 'Settings' ? false : true, // Settings no delete
          export: true,
          import: true,
          all: module === 'Settings' ? false : true
        };
      });
      return permissions;
    };

    const defaultRoles = [
      {
        roleName: 'Super Admin',
        status: 'Active',
        modulePermissions: createFullPermissions() // ✅ Full permissions
      },
      {
        roleName: 'Admin',
        status: 'Active',
        modulePermissions: createFullPermissions() // ✅ Full permissions
      },
      {
        roleName: 'Student',
        status: 'Active',
        modulePermissions: {
          Dashboard: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Profile: { create: false, read: true, update: true, delete: false, export: false, import: false, all: false },
          Attendance: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Results: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Fees: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Library: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Notice: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Homework: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false }
        }
      },
      {
        roleName: 'Teacher',
        status: 'Active',
        modulePermissions: {
          Dashboard: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Students: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          Attendance: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          Marks: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          Timetable: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Homework: { create: true, read: true, update: true, delete: true, export: false, import: false, all: false },
          Results: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false }
        }
      },
      {
        roleName: 'Employee',
        status: 'Active',
        modulePermissions: {
          Dashboard: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          Attendance: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          Leave: { create: true, read: true, update: true, delete: false, export: false, import: false, all: false },
          Salary: { create: false, read: true, update: false, delete: false, export: true, import: false, all: false },
          Profile: { create: false, read: true, update: true, delete: false, export: false, import: false, all: false }
        }
      }
    ];

    for (const role of defaultRoles) {
      const existingRole = await Role.findOne({ roleName: role.roleName });
      if (!existingRole) {
        await Role.create(role);
        console.log(`✅ Created default role: ${role.roleName}`);
      } else {
        // Update existing Admin/Super Admin with full permissions if they're empty
        if ((role.roleName === 'Admin' || role.roleName === 'Super Admin') && 
            Object.keys(existingRole.modulePermissions || {}).length === 0) {
          existingRole.modulePermissions = createFullPermissions();
          await existingRole.save();
          console.log(`✅ Updated ${role.roleName} with full permissions`);
        }
      }
    }
  } catch (error) {
    console.error('Error creating default roles:', error);
  }
};

// module.exports = createDefaultRolesIfNotExist;
export default createDefaultRolesIfNotExist;