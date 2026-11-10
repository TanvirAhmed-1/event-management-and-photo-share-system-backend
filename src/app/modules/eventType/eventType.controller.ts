import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { EventTypeService } from "./eventType.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

const createEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await EventTypeService.createEventType(req.body, adminId);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Event type created successfully!",
    data: result,
  });
});

const getAllEventTypes = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await EventTypeService.getAllEventTypes(includeInactive);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event types retrieved successfully!",
    data: result,
  });
});

const getEventTypeById = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const result = await EventTypeService.getEventTypeById(req.params.id, includeInactive);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event type retrieved successfully!",
    data: result,
  });
});

const updateEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await EventTypeService.updateEventType(req.params.id, req.body, adminId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event type updated successfully!",
    data: result,
  });
});

const deleteEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await EventTypeService.deleteEventType(req.params.id, adminId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const toggleActiveEventType = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await EventTypeService.toggleActiveEventType(req.params.id, adminId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: `Event type is now ${result.isActive ? "active" : "inactive"}!`,
    data: result,
  });
});

const syncEventTypeFields = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).user?.id;
  const result = await EventTypeService.syncEventTypeFields(req.params.id, req.body.fields, adminId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event type fields updated successfully!",
    data: result,
  });
});

export const EventTypeController = {
  createEventType,
  getAllEventTypes,
  getEventTypeById,
  updateEventType,
  deleteEventType,
  toggleActiveEventType,
  syncEventTypeFields,
};

