import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFoundHandler from "./app/middlewares/notFoundHandler";
import cors from "cors";
import { BaseRouter } from "./app/routes";

const app: Application = express();

app.use(cors());

//Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route
app.use("/api", BaseRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to AI Wedding Photo Finder SaaS API!",
  });
});

// Global error handler
app.use(globalErrorHandler);

//Handling not found
app.use(notFoundHandler);

export default app;
