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

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.createPackage(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Package created successfully!",
    data: result,
  });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackageService.updatePackage(id, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Package updated successfully!",
    data: result,
  });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackageService.deletePackage(id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Package deleted successfully!",
    data: result,
  });
});

export const PackageController = {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
};
