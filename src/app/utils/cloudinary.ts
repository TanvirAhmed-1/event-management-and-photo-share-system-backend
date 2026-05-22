import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import config from "../config";

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "wedding-ai",
      resource_type: "auto", // Allow images and other assets
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size limit
  },
});

export default cloudinary;
