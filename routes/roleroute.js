import express from "express"; 

const router = express.Router();



import * as roleController from "../controllers/roleController.js"; 

import { authMiddleware } from "../middleware/auth.js";
// const { authorize } = require("../middleware/authorize");

// All role routes require authentication and admin access
router.use(authMiddleware);
// router.use(authorize(['Super Admin', 'Admin']));

// Role CRUD operations
router.post('/create', roleController.createRole);
router.get('/getRole', roleController.getAllRoles);
router.get('/roleById/:id', roleController.getRoleById);
router.put('/update/:id', roleController.updateRole);
router.delete('/delete/:id', roleController.deleteRole);

// Role status management
router.put('/update-status/:id', roleController.updateRoleStatus);

// Active roles (for dropdowns)
router.get('/getRole/active', roleController.getActiveRoles);

// Member count
router.get('/member-count/:id', roleController.getRoleMemberCount);

// Duplicate role
router.post('/duplicate/:id', roleController.duplicateRole);
router.post('/assign-permissions', roleController.assignPermissions);

// module.exports = router;
export default router; // ✅ ES Module export