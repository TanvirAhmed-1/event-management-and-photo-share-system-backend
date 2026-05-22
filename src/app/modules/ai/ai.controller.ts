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

  const matchedPhotos = await AiService.searchFace(eventId, file);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `Face matching completed successfully! Found ${matchedPhotos.length} matching photos.`,
    data: matchedPhotos,
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

export const AiController = {
  searchFace,
  processPhotoEmbeddings,
};
