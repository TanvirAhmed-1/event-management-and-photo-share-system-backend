import { Router } from "express";
import { PackageController } from "./package.controller";

const router = Router();

router.get("/", PackageController.getAllPackages);

export const PackageRoutes = router;
