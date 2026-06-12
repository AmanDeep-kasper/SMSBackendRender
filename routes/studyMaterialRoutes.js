// routes/studyMaterialRoutes.js

import express from "express";

import {
  createStudyMaterial,
  getAllStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
  addWishlist,
  getWishlist,
  removeWishlist,
} from "../controllers/studyMaterialController.js";

import upload from "../middleware/Multer/multer.js";
import { authMiddleware } from "../middleware/auth.js";


const router = express.Router();

// CREATE
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  createStudyMaterial
);

// GET ALL
router.get("/", getAllStudyMaterials);


router.get("/wishlist",authMiddleware,getWishlist)
router.post("/wishlist",authMiddleware,addWishlist)
router.delete("/wishlist/:id",authMiddleware,removeWishlist)


// GET SINGLE
router.get("/:id", getStudyMaterialById);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  updateStudyMaterial
);

// DELETE
router.delete("/:id", authMiddleware, deleteStudyMaterial);


export default router;