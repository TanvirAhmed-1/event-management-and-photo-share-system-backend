import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { UserService } from "./user.service";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "../../middlewares/auth";

const getUserDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await UserService.getUserDashboard(userId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard metrics fetched successfully!",
    data: result,
  });
});

const selectPackage = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const { packageId } = req.body;
  if (!packageId) {
    throw new Error("Package ID is required");
  }

  const result = await UserService.selectPackage(userId, packageId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Package selected successfully!",
    data: result,
  });
});

export const UserController = {
  getUserDashboard,
  selectPackage,
};
