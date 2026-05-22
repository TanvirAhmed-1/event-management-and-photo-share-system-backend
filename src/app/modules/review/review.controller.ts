import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { ReviewService } from "./review.service";
import httpStatus from "http-status";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { name, rating, comment } = req.body;
  const file = req.file; // Optional avatar uploaded to Cloudinary

  if (!name || !rating || !comment) {
    throw new Error("Name, rating, and comment are required fields.");
  }

  const reviewData = {
    name,
    rating: Number(rating),
    comment,
    imageUrl: file ? file.path : undefined, // Cloudinary URL if uploaded
  };

  const newReview = await ReviewService.createReview(reviewData);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review submitted successfully! Thank you for your feedback.",
    data: newReview,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await ReviewService.getAllReviews();

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews retrieved successfully!",
    data: reviews,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
};
