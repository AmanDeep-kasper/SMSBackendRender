import express from "express";

import * as OnlineClassController from "../controllers/OnlineClassController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/",authMiddleware, OnlineClassController.createOnlineClass);
router.get("/", OnlineClassController.getAllOnlineClasses);
router.get("/:id",OnlineClassController.getOnlineClassById);
router.put("/:id", OnlineClassController.updateOnlineClass);
router.delete("/:id", OnlineClassController.deleteOnlineClass);

export default router;