import { ErrorRequestHandler } from "express";
import { ZodError, ZodIssue } from "zod";
import httpStatus from "http-status";

type TSingleIssue = {
  field: string;
  message: string;
};

type TIssues = {
  issues: TSingleIssue[];
};

const zodErrorMessageGenerator = (err: ZodError) => {
  let errorMessage = "";
  const errorDetails: TIssues = {
    issues: [],
  };

  err?.issues.forEach((item: ZodIssue) => {
    const fieldName = String(item.path[item.path.length - 1]);
    const singleMsg = `${fieldName} is ${item.message.toLowerCase()}. `;

    const issueObj: TSingleIssue = {
      field: item.path[item.path.length - 1] as string,
      message: item.message,
    };

    errorMessage += singleMsg;
    errorDetails.issues.push(issueObj);
  });

  return {
    errorMessage: errorMessage.trim(),
    errorDetails,
  };
};

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong!";
  let errorDetails = err;

  // Handling zod error
  if (err instanceof ZodError) {
    const parsedZod = zodErrorMessageGenerator(err);
    statusCode = httpStatus.BAD_REQUEST;
    message = parsedZod.errorMessage;
    errorDetails = parsedZod.errorDetails;
  }

  // Handle specific database errors or client authorization issues
  if (err.message === "Unauthorized Access" || err.message === "Invalid or expired token!") {
    statusCode = httpStatus.UNAUTHORIZED;
  } else if (err.message?.includes("not found")) {
    statusCode = httpStatus.NOT_FOUND;
  } else if (
    err.message?.includes("already exists") ||
    err.message?.includes("limit exceeded")
  ) {
    statusCode = httpStatus.BAD_REQUEST;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails: process.env.NODE_ENV === "development" ? errorDetails : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
