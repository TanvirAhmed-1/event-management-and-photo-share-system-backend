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

const getAllUsersAdmin = catchAsync(async (req: Request, res: Response) => {
  const userRole = (req as AuthenticatedRequest).user?.role;
  if (userRole !== "SUPER_ADMIN") {
    throw new Error("Forbidden Access! Super Admin privileges required.");
  }

  const result = await UserService.getAllUsersAdmin();

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "All users retrieved successfully for admin!",
    data: result,
  });
});

const toggleUserActiveAdmin = catchAsync(async (req: Request, res: Response) => {
  const userRole = (req as AuthenticatedRequest).user?.role;
  if (userRole !== "SUPER_ADMIN") {
    throw new Error("Forbidden Access! Super Admin privileges required.");
  }

  const { id } = req.params;
  const result = await UserService.toggleUserActiveAdmin(id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `User activation status updated successfully! Current status: ${result.isActive ? "Active" : "Inactive"}`,
    data: result,
  });
});

const selectPackageAdmin = catchAsync(async (req: Request, res: Response) => {
  const userRole = (req as AuthenticatedRequest).user?.role;
  if (userRole !== "SUPER_ADMIN") {
    throw new Error("Forbidden Access! Super Admin privileges required.");
  }

  const { id } = req.params;
  const { packageId } = req.body;
  if (!packageId) {
    throw new Error("Package ID is required");
  }

  const result = await UserService.selectPackageAdmin(id, packageId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "User plan overridden successfully by Super Admin!",
    data: result,
  });
});

export const UserController = {
  getUserDashboard,
  selectPackage,
  getAllUsersAdmin,
  toggleUserActiveAdmin,
  selectPackageAdmin,
};
