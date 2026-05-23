import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { AiService } from "./ai.service";
import httpStatus from "http-status";

const searchFace = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.body;
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  const file = req.file;
  if (!file) {
    throw new Error("Selfie file is required");
  }

  const { photos, packageExpired, eventTitle } = await AiService.searchFace(eventId, file);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: packageExpired
      ? "This event's package is inactive! Please ask the organizer to upgrade or renew."
      : `Face matching completed successfully! Found ${photos.length} matching photos.`,
    data: photos,
    packageExpired,
    eventTitle,
  });
});

const processPhotoEmbeddings = catchAsync(async (req: Request, res: Response) => {
  const { photoId } = req.body;
  if (!photoId) {
    throw new Error("Photo ID is required");
  }

  const result = await AiService.processPhotoEmbeddings(photoId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Photo embeddings processed successfully!",
    data: result,
  });
});

const reprocessEventEmbeddings = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.body;
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  const result = await AiService.reprocessEventEmbeddings(eventId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event photos reprocessed successfully!",
    data: result,
  });
});

export const AiController = {
  searchFace,
  processPhotoEmbeddings,
  reprocessEventEmbeddings,
};
