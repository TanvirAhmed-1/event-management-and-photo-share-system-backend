import { Router } from "express";
import { VendorController } from "./vendor.controller";

const router = Router();

router.get("/availability", VendorController.checkAvailability);

export const VendorRoutes = router;

