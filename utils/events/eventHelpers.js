import mongoose from "mongoose";
import EventModel, { EVENT_TYPES } from "../../models/EventModel.js";

// Parse YYYY-MM-DD from frontend into start-of-local-day Date
export const parseEventDate = (input) => {
  if (input === undefined || input === null || input === "") {
    throw new Error("Date is required");
  }

  let dateObj;

  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [year, month, day] = input.trim().split("-").map(Number);
    dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    dateObj = new Date(input);
  }

  if (Number.isNaN(dateObj.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  return dateObj;
};

export const formatDateForApi = (dateValue) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatEventResponse = (doc) => {
  if (!doc) return null;

  const event = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const location = event.location || "";

  return {
    id: event.clientId || event._id?.toString(),
    title: event.title,
    description: event.description,
    type: event.type,
    location,
    venue: location,
    date: formatDateForApi(event.date),
    startTime: event.startTime,
    endTime: event.endTime,
    isHoliday: event.isHoliday,
    organizer: event.organizer,
    image: event.image?.url || null,
    imageFileName: event.image?.fileName || "",
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};

export const sendSuccess = (res, status, { message, data, pagination, count } = {}) => {
  const payload = { success: true };

  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  if (pagination) payload.pagination = pagination;
  if (count !== undefined) payload.count = count;

  return res.status(status).json(payload);
};

export const sendError = (res, status, message, error) => {
  const payload = {
    success: false,
    message,
  };

  if (error) {
    payload.error = typeof error === "string" ? error : error.message || String(error);
  }

  return res.status(status).json(payload);
};

export const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getMonthDateRange = (year, month) => {
  const y = Number(year);
  const m = Number(month);

  if (!y || !m || m < 1 || m > 12) {
    throw new Error("Valid year and month (1-12) are required");
  }

  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  return { start, end };
};

export const buildEventFilter = (query = {}, options = {}) => {
  const filter = {};

  if (query.type && EVENT_TYPES.includes(query.type)) {
    filter.type = query.type;
  }

  if (query.year && query.month) {
    try {
      const { start, end } = getMonthDateRange(query.year, query.month);
      filter.date = { $gte: start, $lte: end };
    } catch {
      // ignore invalid month/year combo in filter builder
    }
  }

  if (query.search && String(query.search).trim()) {
    const escaped = String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escaped, $options: "i" };
  }

  if (options.upcoming) {
    filter.date = { ...(filter.date || {}), $gte: getStartOfToday() };
  }

  return filter;
};

export const getPagination = (query = {}) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
});

export const parseBooleanField = (value, defaultValue = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return defaultValue;
};

export const resolveLocation = (body = {}) => {
  const location = body.location || body.venue || "";
  return String(location).trim();
};

export const findEventByIdentifier = async (id) => {
  if (!id) return null;

  if (/^[a-fA-F0-9]{24}$/.test(id)) {
    const byId = await EventModel.findById(id);
    if (byId) return byId;
  }

  return EventModel.findOne({ clientId: id });
};

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
