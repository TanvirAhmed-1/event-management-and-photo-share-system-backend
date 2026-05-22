import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { EventService } from "./event.service";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "../../middlewares/auth";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  // Cover image can be sent via request body (either direct URL or after a previous upload process)
  const result = await EventService.createEvent(userId, req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Event created successfully!",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await EventService.getAllEvents(userId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Events retrieved successfully!",
    data: result,
  });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await EventService.getEventById(userId, req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event details retrieved successfully!",
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await EventService.updateEvent(userId, req.params.id, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event updated successfully!",
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new Error("Unauthorized Access");
  }

  const result = await EventService.deleteEvent(userId, req.params.id);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Event deleted successfully!",
    data: result,
  });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
