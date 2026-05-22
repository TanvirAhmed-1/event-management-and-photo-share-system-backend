import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import axios from "axios";
import config from "../../config";
import { IAiSearchCandidate } from "./ai.interface";

const searchFace = async (eventId: string, selfieFile: Express.Multer.File) => {
  if (!selfieFile) {
    throw new Error("Selfie image is required!");
  }

  const selfieUrl = selfieFile.path; // Cloudinary URL
  const selfiePublicId = selfieFile.filename; // Cloudinary public_id

  try {
    // 1. Fetch all face embeddings for the given event
    const faceEmbeddings = await prisma.faceEmbedding.findMany({
      where: {
        photo: {
          eventId,
        },
      },
    });

    if (faceEmbeddings.length === 0) {
      return [];
    }

    // 2. Format candidates for the Python service
    const candidates: IAiSearchCandidate[] = faceEmbeddings.map((emb) => ({
      photoId: emb.photoId,
      vector: emb.vector,
    }));

    // 3. Call Python service to match embeddings
    const aiResponse = await axios.post(`${config.ai_service_url}/search-face`, {
      selfieUrl,
      candidates,
      threshold: 0.55, // Similarity threshold
    });

    if (!aiResponse.data.success) {
      throw new Error(aiResponse.data.error || "Failed to search face");
    }

    const matchedPhotoIds = aiResponse.data.matches;

    // 4. Fetch the matched photos from DB
    const matchedPhotos = await prisma.photo.findMany({
      where: {
        id: { in: matchedPhotoIds },
      },
      orderBy: { createdAt: "desc" },
    });

    return matchedPhotos;
  } finally {
    // 5. Always delete the guest's selfie from Cloudinary to protect privacy and save space
    try {
      if (selfiePublicId) {
        await cloudinary.uploader.destroy(selfiePublicId);
      }
    } catch (err) {
      console.error(`Failed to delete temporary selfie ${selfiePublicId}:`, err);
    }
  }
};

const processPhotoEmbeddings = async (photoId: string) => {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new Error("Photo not found!");
  }

  // 1. Call Python service
  const aiResponse = await axios.post(`${config.ai_service_url}/process-photo`, {
    imageUrl: photo.imageUrl,
  });

  if (!aiResponse.data.success) {
    throw new Error(aiResponse.data.error || "AI service failed to process photo");
  }

  const faces = aiResponse.data.faces;

  // 2. Delete existing embeddings and insert new ones in transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.faceEmbedding.deleteMany({
      where: { photoId },
    });

    if (faces.length > 0) {
      await tx.faceEmbedding.createMany({
        data: faces.map((face: any) => ({
          photoId: photo.id,
          vector: face.embedding,
        })),
      });
    }

    return faces.length;
  });

  return { photoId, facesDetected: result };
};

export const AiService = {
  searchFace,
  processPhotoEmbeddings,
};
