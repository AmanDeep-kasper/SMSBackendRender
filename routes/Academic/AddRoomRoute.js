import express from "express";
import { createRoom, getRooms, updateRoom, getRoomById, deleteRoom } from "../../controllers/Academic/AddRoomController.js";

const router = express.Router();

router.post("/", createRoom);
router.get("/", getRooms);
router.put("/:id", updateRoom); 
router.get("/rooms/:id", getRoomById);
router.delete("/:id", deleteRoom);

export default router;