import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    secret: process.env.JWT_SECRET || "super-secret-wedding-ai-photo-finder-key-2026",
    expires_in: process.env.JWT_EXPIRES_IN || "30d",
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_SECRET || "",
  },
  ai_service_url: process.env.AI_SERVICE_URL || "http://127.0.0.1:5000",
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL || "superadmin@weddingai.com",
    password: process.env.SUPER_ADMIN_PASSWORD || "superadmin12345",
    phone: process.env.SUPER_ADMIN_PHONE || "01700000000",
  },
};
