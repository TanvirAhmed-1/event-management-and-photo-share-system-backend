import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { BlogService } from "./blog.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const authorId = (req as AuthenticatedRequest).user?.id as string;
  const result = await BlogService.createBlog(req.body, authorId);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Blog article created successfully!",
    data: result,
  });
});

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const includeDrafts = req.query.includeDrafts === "true";
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const result = await BlogService.getAllBlogs(includeDrafts, category, search);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog articles retrieved successfully!",
    data: result,
  });
});

const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const includeDrafts = req.query.includeDrafts === "true";
  const result = await BlogService.getBlogBySlug(req.params.slug, includeDrafts);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog article retrieved successfully!",
    data: result,
  });
});

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.updateBlog(req.params.id, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog article updated successfully!",
    data: result,
  });
});

const togglePublishBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.togglePublishBlog(req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `Blog ${result.isPublished ? "published" : "moved to drafts"}!`,
    data: result,
  });
});

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.deleteBlog(req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog article deleted successfully!",
    data: result,
  });
});

export const BlogController = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  togglePublishBlog,
  deleteBlog,
};
