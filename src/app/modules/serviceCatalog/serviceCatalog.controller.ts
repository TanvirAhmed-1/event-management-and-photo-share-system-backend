import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { ServiceCatalogService } from "./serviceCatalog.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

// Category controllers
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.createCategory(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Service category created successfully!",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await ServiceCatalogService.getAllCategories(includeInactive);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully!",
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceCatalogService.getCategoryById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Category retrieved successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.updateCategory(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully!",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.deleteCategory(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

// Service controllers
const createService = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.createService(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Service created successfully!",
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, pricingModel, includeInactive, q } = req.query;
  const result = await ServiceCatalogService.getAllServices({
    categoryId: categoryId as string,
    pricingModel: pricingModel as any,
    includeInactive: includeInactive === "true",
    q: q as string,
  });
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Services retrieved successfully!",
    data: result,
  });
});

const getServiceById = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceCatalogService.getServiceById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Service retrieved successfully!",
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.updateService(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Service updated successfully!",
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.deleteService(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const toggleActiveService = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.toggleActiveService(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `Service is now ${result.isActive ? "active" : "inactive"}!`,
    data: result,
  });
});

// EventTypeService assignment controllers
const getServicesByEventType = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await ServiceCatalogService.getServicesByEventType(req.params.eventTypeId, includeInactive);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Services for event type retrieved successfully!",
    data: result,
  });
});

const assignServicesToEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.assignServicesToEventType(
    req.params.eventTypeId,
    req.body.services,
    adminId
  );
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Services assigned to event type successfully!",
    data: result,
  });
});

const unassignService = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.unassignService(
    req.params.eventTypeId,
    req.params.serviceId,
    adminId
  );
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

// Package controllers
const createPackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.createPackage(req.body, adminId);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Service package created successfully!",
    data: result,
  });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.updatePackage(req.params.id, req.body, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Service package updated successfully!",
    data: result,
  });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await ServiceCatalogService.deletePackage(req.params.id, adminId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const ServiceCatalogController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  toggleActiveService,
  getServicesByEventType,
  assignServicesToEventType,
  unassignService,
  createPackage,
  updatePackage,
  deletePackage,
};

