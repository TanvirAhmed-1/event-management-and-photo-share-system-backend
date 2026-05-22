import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import axios from "axios";
import config from "../../config";
import { IMulterFile } from "./photo.interface";

const uploadPhotos = async (
  userId: string,
  eventId: string,
  files: IMulterFile[]
) => {
  if (!files || files.length === 0) {
    throw new Error("No files uploaded!");
  }

  // 1. Check Event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    // Delete files from Cloudinary if event is invalid
    for (const file of files) {
      if (file.filename) await cloudinary.uploader.destroy(file.filename);
    }
    throw new Error("Event not found!");
  }

  if (event.userId !== userId) {
    // Delete files from Cloudinary if unauthorized
    for (const file of files) {
      if (file.filename) await cloudinary.uploader.destroy(file.filename);
    }
    throw new Error("Unauthorized Access! You do not own this event.");
  }

  // 2. Storage Limit Check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { package: true },
  });

  if (!user) {
    // Delete files from Cloudinary
    for (const file of files) {
      if (file.filename) await cloudinary.uploader.destroy(file.filename);
    }
    throw new Error("User not found!");
  }

  // Calculate total upload size in MB
  const uploadSizeMB = files.reduce((acc, file) => {
    // Multer size is in bytes
    const sizeInMB = file.size / (1024 * 1024);
    return acc + sizeInMB;
  }, 0);

  const storageLimit = user.package?.storageLimitMB || 0;
  const currentUsed = user.usedStorageMB;

  if (currentUsed + uploadSizeMB > storageLimit) {
    // Delete uploaded files from Cloudinary to free up space
    for (const file of files) {
      if (file.filename) {
        await cloudinary.uploader.destroy(file.filename);
      }
    }
    throw new Error(
      `Storage limit exceeded! Remaining storage is ${(storageLimit - currentUsed).toFixed(
        2
      )} MB, but your upload is ${uploadSizeMB.toFixed(2)} MB.`
    );
  }

  const processedPhotos = [];

  // 3. Process each file
  for (const file of files) {
    const sizeMB = file.size / (1024 * 1024);
    const imageUrl = file.path; // Cloudinary URL
    const publicId = file.filename!; // Cloudinary public_id

    // Save Photo in DB
    const photo = await prisma.photo.create({
      data: {
        imageUrl,
        publicId,
        sizeMB,
        eventId,
      },
    });

    processedPhotos.push(photo);

    // Call Python AI Service to process face embedding
    try {
      const aiResponse = await axios.post(`${config.ai_service_url}/process-photo`, {
        imageUrl,
      });

      if (aiResponse.data.success && aiResponse.data.faces.length > 0) {
        const faces = aiResponse.data.faces;

        // Save face embeddings in DB
        await prisma.faceEmbedding.createMany({
          data: faces.map((face: any) => ({
            photoId: photo.id,
            vector: face.embedding, // Vector is Json field
          })),
        });
      }
    } catch (err: any) {
      console.error(
        `AI face processing failed for photo ${photo.id}. Details: ${err.message}`
      );
    }
  }

  // 4. Update user's usedStorageMB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      usedStorageMB: currentUsed + uploadSizeMB,
    },
  });

  return {
    uploadedCount: processedPhotos.length,
    photos: processedPhotos,
    usedStorageMB: parseFloat(updatedUser.usedStorageMB.toFixed(2)),
  };
};

const deletePhoto = async (userId: string, photoId: string) => {
  // Find photo and confirm ownership
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      event: true,
    },
  });

  if (!photo) {
    throw new Error("Photo not found!");
  }

  if (photo.event.userId !== userId) {
    throw new Error("Unauthorized Access! You cannot delete this photo.");
  }

  // 1. Delete from Cloudinary
  try {
    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId);
    }
  } catch (err) {
    console.error(`Failed to delete photo ${photo.publicId} from Cloudinary:`, err);
  }

  // 2. Perform DB deletion and update storage in transaction
  await prisma.$transaction(async (tx) => {
    // Delete face embeddings
    await tx.faceEmbedding.deleteMany({
      where: { photoId },
    });

    // Delete photo record
    await tx.photo.delete({
      where: { id: photoId },
    });

    // Update user used storage
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (user) {
      const newUsedStorage = Math.max(0, user.usedStorageMB - photo.sizeMB);
      await tx.user.update({
        where: { id: userId },
        data: { usedStorageMB: newUsedStorage },
      });
    }
  });

  return { message: "Photo deleted successfully!" };
};

const getPhotosByEvent = async (userId: string, eventId: string) => {
  // Confirm event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found!");
  }

  if (event.userId !== userId) {
    throw new Error("Unauthorized Access! You do not own this event.");
  }

  const result = await prisma.photo.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

export const PhotoService = {
  uploadPhotos,
  deletePhoto,
  getPhotosByEvent,
};
