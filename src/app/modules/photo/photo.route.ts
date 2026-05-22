import { Router } from "express";
import { PhotoController } from "./photo.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/cloudinary";

const router = Router();

// Upload multiple photos (max 20 per request)
router.post(
  "/upload",
  auth(),
  upload.array("photos", 20),
  PhotoController.uploadPhotos
);

// Delete single photo
router.delete("/:id", auth(), PhotoController.deletePhoto);

// Get all photos of an event
router.get("/event/:eventId", auth(), PhotoController.getPhotosByEvent);

// Download all photos of an event as ZIP
router.get("/event/:eventId/download-zip", auth(), PhotoController.downloadEventZip);

export const PhotoRoutes = router;
