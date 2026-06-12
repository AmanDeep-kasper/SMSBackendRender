import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import EventModel from "../models/EventModel.js";
import { parseEventDate } from "../utils/events/eventHelpers.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SEED_IMAGE = {
  url:
    process.env.DEFAULT_EVENT_IMAGE_URL ||
    "https://images.unsplash.com/photo-1542933187-f593f66c125b?w=800&auto=format&fit=crop&q=80",
  publicId: "",
  fileName: "default-event.jpg",
};

const buildSeedImage = (row) => {
  const url = typeof row.image === "string" ? row.image : row.image?.url;
  if (!url) return DEFAULT_SEED_IMAGE;

  return {
    url,
    publicId: "",
    fileName: `${row.id || "event"}-cover.jpg`,
  };
};

const resolveSeedFile = () => {
  const clientPath = path.resolve(__dirname, "../../client/src/data/events.json");
  const serverPath = path.resolve(__dirname, "../data/events.seed.json");

  if (fs.existsSync(clientPath)) return clientPath;
  if (fs.existsSync(serverPath)) return serverPath;

  throw new Error(
    "Seed file not found. Expected client/src/data/events.json or server/data/events.seed.json"
  );
};

const seedEvents = async () => {
  try {
    await connectDB();

    const seedFile = resolveSeedFile();
    const raw = fs.readFileSync(seedFile, "utf-8");
    const rows = JSON.parse(raw);

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log("No events found in seed file.");
      process.exit(0);
    }

    const operations = rows.map((row) => ({
      updateOne: {
        filter: { clientId: row.id },
        update: {
          $set: {
            clientId: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            location: row.venue || row.location || "",
            date: parseEventDate(row.date),
            startTime: row.startTime || "09:00",
            endTime: row.endTime || "14:00",
            isHoliday: row.isHoliday ?? false,
            organizer: "Administration",
            image: buildSeedImage(row),
          },
        },
        upsert: true,
      },
    }));

    const result = await EventModel.bulkWrite(operations, { ordered: false });

    console.log("Events seed completed.");
    console.log(`Source file: ${seedFile}`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Upserted: ${result.upsertedCount}`);
    console.log(`Total in file: ${rows.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Events seed failed:", error.message);
    process.exit(1);
  }
};

seedEvents();
