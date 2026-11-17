import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IMulterFile } from "../photo/photo.interface";

const uploadSingleImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as IMulterFile | undefined;
  if (!file || !file.path) {
    throw new AppError(httpStatus.BAD_REQUEST, "No image file provided!");
  }

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Image uploaded to Cloudinary successfully!",
    data: {
      url: file.path,
      publicId: file.filename,
    },
  });
});

const uploadMultipleImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as IMulterFile[] | undefined;
  if (!files || files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No image files provided!");
  }

  const uploaded = files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `${uploaded.length} image(s) uploaded to Cloudinary successfully!`,
    data: {
      urls: uploaded.map((item) => item.url),
      files: uploaded,
    },
  });
});

export const UploadController = {
  uploadSingleImage,
  uploadMultipleImages,
};
