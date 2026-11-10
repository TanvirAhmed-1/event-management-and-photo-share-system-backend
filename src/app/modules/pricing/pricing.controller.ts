import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { PricingService } from "./pricing.service";

const calculatePrice = catchAsync(async (req: Request, res: Response) => {
  const result = await PricingService.calculatePrice(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Pricing calculated successfully!",
    data: result,
  });
});

export const PricingController = {
  calculatePrice,
};

