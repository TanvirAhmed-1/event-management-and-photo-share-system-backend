import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { PhotoService } from "./photo.service";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "../../middlewares/auth";
import prisma from "../../utils/prisma";
import archiver from "archiver";
import axios from "axios";

const uploadPhotos = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const { eventId } = req.body;
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new Error("No photos uploaded!");
  }

  const result = await PhotoService.uploadPhotos(userId, eventId, files);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: `${result.uploadedCount} photos uploaded and processed successfully!`,
    data: result,
  });
});

const deletePhoto = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await PhotoService.deletePhoto(userId, req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Photo deleted successfully!",
    data: result,
  });
});

const getPhotosByEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await PhotoService.getPhotosByEvent(userId, req.params.eventId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Photos retrieved successfully!",
    data: result,
  });
});

const downloadEventZip = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const { eventId } = req.params;

  // Confirm event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      photos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Event not found" });
    return;
  }

  if (event.userId !== userId) {
    res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized Access" });
    return;
  }

  if (!event.photos || event.photos.length === 0) {
    res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "No photos in this event to download" });
    return;
  }

  // Set response headers for zip file download
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${event.title.replace(/\s+/g, "_")}_photos.zip"`
  );

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression level
  });

  // Handle archive errors
  archive.on("error", (err) => {
    console.error("ZIP Archive Error:", err);
    if (!res.headersSent) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to generate zip file",
        error: err.message,
      });
    }
  });

  // Pipe archive data directly to Express response stream
  archive.pipe(res);

  // Download and stream each image
  for (let i = 0; i < event.photos.length; i++) {
    const photo = event.photos[i];
    try {
      const response = await axios({
        url: photo.imageUrl,
        method: "GET",
        responseType: "stream",
      });

      // Extract original file extension or fallback to jpg
      const extension = photo.imageUrl.split(".").pop()?.split("?")[0] || "jpg";
      const filename = `photo_${i + 1}.${extension}`;

      archive.append(response.data, { name: filename });
    } catch (err: any) {
      console.error(`Failed to stream photo ${photo.imageUrl} to ZIP:`, err.message);
      // Skip individual failures to ensure the zip is generated with available images
    }
  }

  // Finalize the archive
  await archive.finalize();
});

export const PhotoController = {
  uploadPhotos,
  deletePhoto,
  getPhotosByEvent,
  downloadEventZip,
};
