import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import httpStatus from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully!",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged in successfully!",
    data: result,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
};
