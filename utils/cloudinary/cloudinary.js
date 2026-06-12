import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// import dotenv from "dotenv/config";    // Already imported above
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export default cloudinary;