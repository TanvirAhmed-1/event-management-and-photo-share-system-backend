import { Router } from "express";
import { AiController } from "./ai.controller";
import { upload } from "../../utils/cloudinary";

const router = Router();

// Guest search endpoint - takes eventId (in body) and selfie (as file)
router.post("/search-face", upload.single("selfie"), AiController.searchFace);

// Process single photo manually (e.g. for testing/reprocessing)
router.post("/process-photo", AiController.processPhotoEmbeddings);

// Reprocess all photos in an event manually
router.post("/reprocess-event", AiController.reprocessEventEmbeddings);

export const AiRoutes = router;
