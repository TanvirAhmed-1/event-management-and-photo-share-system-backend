import { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";

const catchAsync = (func: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch((err) => {
      // Handling user already exist
      if (err.message === "User already exist!") {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: err.message,
          errorDetails: err,
        });
      }

      // Handling unauthorized user
      if (err.message === "Unauthorized Access") {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: err.message,
          errorDetails: err,
        });
      }

      // Handling user not found
      if (err.message === "User not found") {
        res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: err.message,
          errorDetails: err,
        });
      }

      // Handling incorrect password
      if (err.message === "Incorrect password") {
        res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: err.message,
          errorDetails: err,
        });
      }

      next(err);
    });
  };
};

export default catchAsync;
