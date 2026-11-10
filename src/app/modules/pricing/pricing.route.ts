import { Router } from "express";
import validateData from "../../middlewares/validateData";
import { PricingController } from "./pricing.controller";
import { PricingValidation } from "./pricing.validation";

const router = Router();

// Calculate pricing preview (Public or Authenticated)
router.post(
  "/preview",
  validateData(PricingValidation.calculatePriceSchema),
  PricingController.calculatePrice
);

export const PricingRoutes = router;

