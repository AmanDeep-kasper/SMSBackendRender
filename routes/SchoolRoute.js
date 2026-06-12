import express from "express";
import { registerSchool } from "../controllers/SchoolController.js";

const router = express.Router();

router.post("/register", registerSchool);

export default router;