import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import httpStatus from "http-status";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    phone: string;
    packageId?: string;
    role: string;
  };
}

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "You are not authorized! Token is missing.",
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        name: string;
        phone: string;
        packageId?: string;
        role: string;
      };

      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired token!",
      });
    }
  };
};

export default auth;
