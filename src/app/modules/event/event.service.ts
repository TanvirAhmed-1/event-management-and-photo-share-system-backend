import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import { ICreateEventRequest, IUpdateEventRequest } from "./event.interface";

const createEvent = async (userId: string, payload: ICreateEventRequest) => {
  const result = await prisma.event.create({
    data: {
      title: payload.title,
      coverImage: payload.coverImage || null,
      userId,
    },
  });
  return result;
};

const getAllEvents = async (userId: string) => {
  const result = await prisma.event.findMany({
    where: { userId },
    include: {
      _count: {
        select: { photos: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const getEventById = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      photos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found!");
  }

  if (event.userId !== userId) {
    throw new Error("Unauthorized Access! You cannot access this event.");
  }

  return event;
};

const updateEvent = async (
  userId: string,
  eventId: string,
  payload: IUpdateEventRequest
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found!");
  }

  if (event.userId !== userId) {
    throw new Error("Unauthorized Access! You cannot modify this event.");
  }

  const result = await prisma.event.update({
    where: { id: eventId },
    data: payload,
  });

  return result;
};

const deleteEvent = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      photos: true,
    },
  });

  if (!event) {
    throw new Error("Event not found!");
  }

  if (event.userId !== userId) {
    throw new Error("Unauthorized Access! You cannot delete this event.");
  }

  const photos = event.photos;
  const photoIds = photos.map((p) => p.id);
  const totalSizeDeleted = photos.reduce((acc, p) => acc + p.sizeMB, 0);

  // 1. Delete images from Cloudinary
  for (const photo of photos) {
    try {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    } catch (err) {
      console.error(`Failed to delete photo ${photo.publicId} from Cloudinary:`, err);
    }
  }

  // 2. Perform DB deletions in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete face embeddings for all event photos
    if (photoIds.length > 0) {
      await tx.faceEmbedding.deleteMany({
        where: {
          photoId: { in: photoIds },
        },
      });

      // Delete photos from DB
      await tx.photo.deleteMany({
        where: {
          eventId: eventId,
        },
      });
    }

    // Delete event from DB
    await tx.event.delete({
      where: { id: eventId },
    });

    // Update user used storage
    if (totalSizeDeleted > 0) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        const newUsedStorage = Math.max(0, user.usedStorageMB - totalSizeDeleted);
        await tx.user.update({
          where: { id: userId },
          data: { usedStorageMB: newUsedStorage },
        });
      }
    }
  });

  return { message: "Event and all its photos deleted successfully!" };
};

export const EventService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
