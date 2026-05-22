import { Router } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/dashboard", auth(), UserController.getUserDashboard);
router.post("/select-package", auth(), UserController.selectPackage);

export const UserRoutes = router;
