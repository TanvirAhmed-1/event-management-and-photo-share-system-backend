import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { FoodService } from "./food.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

// Category controllers
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.createCategory(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Food category created successfully!",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await FoodService.getAllCategories(includeInactive);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food categories retrieved successfully!",
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await FoodService.getCategoryById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food category retrieved successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.updateCategory(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food category updated successfully!",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.deleteCategory(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

// Food Item controllers
const createFoodItem = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.createFoodItem(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Food item created successfully!",
    data: result,
  });
});

const getAllFoodItems = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, dietaryLabel, includeInactive, q } = req.query;
  const result = await FoodService.getAllFoodItems({
    categoryId: categoryId as string,
    dietaryLabel: dietaryLabel as string,
    includeInactive: includeInactive === "true",
    q: q as string,
  });
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food items retrieved successfully!",
    data: result,
  });
});

const getFoodItemById = catchAsync(async (req: Request, res: Response) => {
  const result = await FoodService.getFoodItemById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food item retrieved successfully!",
    data: result,
  });
});

const updateFoodItem = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.updateFoodItem(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food item updated successfully!",
    data: result,
  });
});

const deleteFoodItem = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.deleteFoodItem(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const toggleActiveFoodItem = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.toggleActiveFoodItem(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `Food item is now ${result.isActive ? "active" : "inactive"}!`,
    data: result,
  });
});

// Food Package (Combo) controllers
const createFoodPackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.createFoodPackage(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Food package/combo created successfully!",
    data: result,
  });
});

const getAllFoodPackages = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await FoodService.getAllFoodPackages(includeInactive);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food packages retrieved successfully!",
    data: result,
  });
});

const getFoodPackageById = catchAsync(async (req: Request, res: Response) => {
  const result = await FoodService.getFoodPackageById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food package retrieved successfully!",
    data: result,
  });
});

const updateFoodPackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.updateFoodPackage(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food package updated successfully!",
    data: result,
  });
});

const deleteFoodPackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.deleteFoodPackage(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

// EventTypeFood assignment controllers
const getFoodByEventType = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await FoodService.getFoodByEventType(req.params.eventTypeId, includeInactive);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food menu for event type retrieved successfully!",
    data: result,
  });
});

const assignFoodToEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.assignFoodToEventType(
    req.params.eventTypeId,
    req.body.assignments,
    adminId
  );
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Food assigned to event type successfully!",
    data: result,
  });
});

const unassignFood = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await FoodService.unassignFood(req.params.assignmentId, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const FoodController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem,
  toggleActiveFoodItem,
  createFoodPackage,
  getAllFoodPackages,
  getFoodPackageById,
  updateFoodPackage,
  deleteFoodPackage,
  getFoodByEventType,
  assignFoodToEventType,
  unassignFood,
};

