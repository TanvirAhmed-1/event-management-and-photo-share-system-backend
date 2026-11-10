import auth from "../../middlewares/auth";
import { Router } from "express";
import { PackageController } from "./package.controller";

const router = Router();

router.get("/", PackageController.getAllPackages);
router.post("/", auth("SUPER_ADMIN"), PackageController.createPackage);
router.patch("/:id", auth("SUPER_ADMIN"), PackageController.updatePackage);
router.delete("/:id", auth("SUPER_ADMIN"), PackageController.deletePackage);

export const PackageRoutes = router;
