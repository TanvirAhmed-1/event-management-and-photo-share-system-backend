import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

const validateData = (schemaObj: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // validating schema object
      await schemaObj.parseAsync(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateData;
