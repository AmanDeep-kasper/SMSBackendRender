// sms/backend/middleware/authorize.js
// const User = require("../models/studentsmodel");
import User from "../models/studentsmodel.js";

// const authorize = (allowedRoles) => {
  export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate('account.role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      const userRole = user.account.role?.roleName;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// const hasModulePermission = (module, action) => {
  export const hasModulePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate('account.role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      const role = user.account.role;
      const permissions = role?.modulePermissions;
      
      // Super Admin and Admin have all permissions
      if (role?.roleName === 'Super Admin' || role?.roleName === 'Admin') {
        return next();
      }
      
      const modulePerms = permissions?.[module];
      
      if (!modulePerms || !modulePerms[action]) {
        return res.status(403).json({ 
          message: `You don't have permission to ${action} ${module}` 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Permission check error' });
    }
  };
};

// module.exports = { authorize, hasModulePermission };