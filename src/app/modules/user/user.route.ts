import { Router } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/dashboard", auth(), UserController.getUserDashboard);
router.post("/select-package", auth(), UserController.selectPackage);
router.get("/admin/users", auth(), UserController.getAllUsersAdmin);
router.patch("/admin/users/:id/toggle-active", auth(), UserController.toggleUserActiveAdmin);
router.patch("/admin/users/:id/update-package", auth(), UserController.selectPackageAdmin);

export const UserRoutes = router;
