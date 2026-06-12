

import Room from "../../models/Academic/AddRoomModel.js";



export const createRoom = async (req, res) => {
  try {
    const {
      roomName,
      roomType,
      location,
      floor,
      capacity,
      area,
      status,
      desks,
      chairs,
      teacherTable,
      facilities,
      note,
    } = req.body;
    const existingroomName = await Room.findOne({roomName})
    if(existingroomName){
      return res.status(409).json({message:
        'Room Name already exist'
      })
    }

    // ✅ Required validation
    if (!roomName || !roomType || !location || !capacity || !area) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const newRoom = new Room({
      roomName,
      roomType,
      location,
      floor,
      capacity: Number(capacity) || 0,
      area: Number(area) || 0,
      status,

      furniture: {
        desks: Number(desks) || 0,
        chairs: Number(chairs) || 0,
        teacherTable: Number(teacherTable) || 0,
      },

      // ✅ ensure array
      facilities: Array.isArray(facilities)
        ? facilities
        : facilities
        ? [facilities]
        : [],

      note,
    });

    await newRoom.save();

    res.status(201).json({
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (err) {
    console.error(err); // 👈 IMPORTANT for debugging
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};


export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    res.status(200).json({
      message: "Rooms fetched successfully",
      data: rooms,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching rooms",
      error: err.message,
    });
  }
};
// View Room
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ data: room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      roomName,
      roomType,
      location,
      floor,
      capacity,
      area,
      status,
      desks,
      chairs,
      teacherTable,
      facilities,
      note,
    } = req.body;

    // optional validation
    if (!roomName || !roomType || !location) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        roomName,
        roomType,
        location,
        floor,
        capacity: Number(capacity) || 0,
        area: Number(area) || 0,
        status,

        furniture: {
          desks: Number(desks) || 0,
          chairs: Number(chairs) || 0,
          teacherTable: Number(teacherTable) || 0,
        },

        facilities: Array.isArray(facilities)
          ? facilities
          : facilities
          ? [facilities]
          : [],

        note,
      },
      { new: true } // ✅ return updated data
    );

    if (!updatedRoom) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.status(200).json({
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating room",
      error: err.message,
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Room.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({
      message: "Room deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting room",
      error: err.message,
    });
  }
};