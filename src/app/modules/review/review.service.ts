import prisma from "../../utils/prisma";
import { ICreateReviewRequest } from "./review.interface";

const createReview = async (payload: ICreateReviewRequest) => {
  const newReview = await prisma.review.create({
    data: {
      name: payload.name,
      rating: Number(payload.rating),
      comment: payload.comment,
      imageUrl: payload.imageUrl || null,
    },
  });
  return newReview;
};

const getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return reviews;
};

export const ReviewService = {
  createReview,
  getAllReviews,
};
