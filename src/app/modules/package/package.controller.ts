import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { PackageService } from "./package.service";
import httpStatus from "http-status";

const getAllPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.getAllPackages();

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Packages retrieved successfully!",
    data: result,
  });
});

export const PackageController = {
  getAllPackages,
};
