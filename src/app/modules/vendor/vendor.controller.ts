import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { VendorService } from "./vendor.service";

const checkAvailability = catchAsync(async (req: Request, res: Response) => {
  const date = req.query.date as string;
  const serviceIdsParam = req.query.serviceIds as string | undefined;
  const serviceIds = serviceIdsParam ? serviceIdsParam.split(",").filter(Boolean) : undefined;

  const result = await VendorService.checkAvailability(date, serviceIds);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor availability checked successfully!",
    data: result,
  });
});

export const VendorController = {
  checkAvailability,
};

