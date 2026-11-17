import { Router } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/cloudinary";
import { UploadController } from "./upload.controller";

const router = Router();

router.post(
  "/image",
  auth("ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  UploadController.uploadSingleImage
);

router.post(
  "/images",
  auth("ADMIN", "SUPER_ADMIN"),
  upload.array("images", 10),
  UploadController.uploadMultipleImages
);

export const UploadRoutes = router;
