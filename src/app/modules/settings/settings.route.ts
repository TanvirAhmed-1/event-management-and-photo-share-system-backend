import { Router } from "express";
import auth from "../../middlewares/auth";
import { SettingsController } from "./settings.controller";

const router = Router();

router.get("/", SettingsController.getSettings);
router.patch("/", auth("SUPER_ADMIN", "ADMIN"), SettingsController.updateSettings);

export const SettingsRoutes = router;
