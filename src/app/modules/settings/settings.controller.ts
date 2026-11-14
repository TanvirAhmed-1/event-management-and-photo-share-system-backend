import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { SettingsService } from "./settings.service";

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const data = await SettingsService.getPlatformSettings();
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Platform settings retrieved successfully!",
    data,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const data = await SettingsService.updatePlatformSettings(req.body);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Platform settings updated successfully!",
    data,
  });
});

export const SettingsController = {
  getSettings,
  updateSettings,
};
