import { Router } from "express";
import { PackageController } from "./package.controller";

const router = Router();

router.get("/", PackageController.getAllPackages);
router.post("/", PackageController.createPackage);
router.patch("/:id", PackageController.updatePackage);
router.delete("/:id", PackageController.deletePackage);

export const PackageRoutes = router;
