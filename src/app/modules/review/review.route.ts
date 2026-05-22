import { Router } from "express";
import { ReviewController } from "./review.controller";
import { upload } from "../../utils/cloudinary";

const router = Router();

// Submit a user review with optional reviewer avatar image
router.post("/", upload.single("avatar"), ReviewController.createReview);

// Publicly retrieve all user reviews to show on home page
router.get("/", ReviewController.getAllReviews);

export const ReviewRoutes = router;
