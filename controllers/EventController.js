import EventModel, { EVENT_TYPES } from "../models/EventModel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import streamifier from "streamifier";
import {
  parseEventDate,
  formatEventResponse,
  sendSuccess,
  sendError,
  buildEventFilter,
  getPagination,
  getPaginationMeta,
  parseBooleanField,
  resolveLocation,
  findEventByIdentifier,
} from "../utils/events/eventHelpers.js";

// ==========================
// CLOUDINARY HELPERS
// ==========================

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "school-events",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

const buildImagePayload = (uploaded, file) => ({
  url: uploaded.secure_url,
  publicId: uploaded.public_id,
  fileName: file.originalname,
});

// Default image when user does not upload a file (Unsplash — Happy Holidays board)
const DEFAULT_EVENT_IMAGE = {
  url:
    process.env.DEFAULT_EVENT_IMAGE_URL ||
    "https://images.unsplash.com/photo-1542933187-f593f66c125b?w=800&auto=format&fit=crop&q=80",
  publicId: "",
  fileName: "default-happy-holidays.jpg",
};

// ==========================
// CREATE
// ==========================

export const createEvent = async (req, res) => {
  let imageData = null;

  try {
    const {
      title,
      description,
      date,
      type,
      organizer,
      startTime,
      endTime,
      isHoliday,
    } = req.body;

    if (!title?.trim()) {
      return sendError(res, 400, "Title is required");
    }

    if (!description?.trim()) {
      return sendError(res, 400, "Description is required");
    }

    if (!date) {
      return sendError(res, 400, "Date is required");
    }

    if (type && !EVENT_TYPES.includes(type)) {
      return sendError(res, 400, `Invalid event type. Allowed: ${EVENT_TYPES.join(", ")}`);
    }

    let parsedDate;
    try {
      parsedDate = parseEventDate(date);
    } catch (dateErr) {
      return sendError(res, 400, dateErr.message);
    }

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file);
      imageData = buildImagePayload(uploaded, req.file);
    } else {
      imageData = DEFAULT_EVENT_IMAGE;
    }

    const event = await EventModel.create({
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      type: type || "academic",
      location: resolveLocation(req.body),
      organizer: organizer?.trim() || "Administration",
      startTime: startTime || "09:00",
      endTime: endTime || "14:00",
      isHoliday: parseBooleanField(isHoliday, false),
      image: imageData,
    });

    return sendSuccess(res, 201, {
      message: "Event created successfully",
      data: formatEventResponse(event),
    });
  } catch (error) {
    if (imageData?.publicId) {
      await deleteFromCloudinary(imageData.publicId);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, "Validation failed", error.message);
    }

    return sendError(res, 500, "Failed to create event", error);
  }
};

// ==========================
// GET ALL (with pagination + filters)
// ==========================

export const getAllEvents = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildEventFilter(req.query);

    const [events, total] = await Promise.all([
      EventModel.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit),
      EventModel.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, {
      message: "Events fetched successfully",
      data: events.map(formatEventResponse),
      count: events.length,
      pagination: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch events", error);
  }
};

// ==========================
// GET UPCOMING
// ==========================

export const getUpcomingEvents = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildEventFilter(req.query, { upcoming: true });

    const [events, total] = await Promise.all([
      EventModel.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit),
      EventModel.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, {
      message: "Upcoming events fetched successfully",
      data: events.map(formatEventResponse),
      count: events.length,
      pagination: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch upcoming events", error);
  }
};

// ==========================
// GET ONE
// ==========================

export const getEventById = async (req, res) => {
  try {
    const event = await findEventByIdentifier(req.params.id);

    if (!event) {
      return sendError(res, 404, "Event not found");
    }

    return sendSuccess(res, 200, {
      data: formatEventResponse(event),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch event", error);
  }
};

// ==========================
// UPDATE (safe Cloudinary flow)
// ==========================

export const updateEvent = async (req, res) => {
  let newUploadedImage = null;

  try {
    const event = await findEventByIdentifier(req.params.id);

    if (!event) {
      return sendError(res, 404, "Event not found");
    }

    const updatePayload = {};

    if (req.body.title !== undefined) {
      if (!String(req.body.title).trim()) {
        return sendError(res, 400, "Title cannot be empty");
      }
      updatePayload.title = String(req.body.title).trim();
    }

    if (req.body.description !== undefined) {
      if (!String(req.body.description).trim()) {
        return sendError(res, 400, "Description cannot be empty");
      }
      updatePayload.description = String(req.body.description).trim();
    }

    if (req.body.date !== undefined) {
      try {
        updatePayload.date = parseEventDate(req.body.date);
      } catch (dateErr) {
        return sendError(res, 400, dateErr.message);
      }
    }

    if (req.body.type !== undefined) {
      if (!EVENT_TYPES.includes(req.body.type)) {
        return sendError(res, 400, `Invalid event type. Allowed: ${EVENT_TYPES.join(", ")}`);
      }
      updatePayload.type = req.body.type;
    }

    if (req.body.location !== undefined || req.body.venue !== undefined) {
      updatePayload.location = resolveLocation(req.body);
    }

    if (req.body.organizer !== undefined) {
      updatePayload.organizer = String(req.body.organizer).trim() || "Administration";
    }

    if (req.body.startTime !== undefined) updatePayload.startTime = req.body.startTime;
    if (req.body.endTime !== undefined) updatePayload.endTime = req.body.endTime;

    if (req.body.isHoliday !== undefined) {
      updatePayload.isHoliday = parseBooleanField(req.body.isHoliday, false);
    }

    const oldPublicId = event.image?.publicId;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file);
      newUploadedImage = buildImagePayload(uploaded, req.file);
      updatePayload.image = newUploadedImage;
    }

    const updated = await EventModel.findByIdAndUpdate(event._id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      if (newUploadedImage?.publicId) {
        await deleteFromCloudinary(newUploadedImage.publicId);
      }
      return sendError(res, 500, "Failed to update event in database");
    }

    if (newUploadedImage?.publicId && oldPublicId && oldPublicId !== newUploadedImage.publicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return sendSuccess(res, 200, {
      message: "Event updated successfully",
      data: formatEventResponse(updated),
    });
  } catch (error) {
    if (newUploadedImage?.publicId) {
      await deleteFromCloudinary(newUploadedImage.publicId);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, "Validation failed", error.message);
    }

    return sendError(res, 500, "Failed to update event", error);
  }
};

// ==========================
// DELETE
// ==========================

export const deleteEvent = async (req, res) => {
  try {
    const event = await findEventByIdentifier(req.params.id);

    if (!event) {
      return sendError(res, 404, "Event not found");
    }

    const imagePublicId = event.image?.publicId;

    await EventModel.findByIdAndDelete(event._id);

    if (imagePublicId) {
      await deleteFromCloudinary(imagePublicId);
    }

    return sendSuccess(res, 200, {
      message: "Event deleted successfully",
    });
  } catch (error) {
    return sendError(res, 500, "Failed to delete event", error);
  }
};
