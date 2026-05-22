import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateData from "../../middlewares/validateData";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateData(AuthValidation.registerUserSchema),
  AuthController.registerUser
);

router.post(
  "/login",
  validateData(AuthValidation.loginUserSchema),
  AuthController.loginUser
);

export const AuthRoutes = router;
