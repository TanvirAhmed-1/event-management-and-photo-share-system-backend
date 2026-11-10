import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFoundHandler from "./app/middlewares/notFoundHandler";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { BaseRouter } from "./app/routes";

const app: Application = express();

app.use(helmet());
app.use(cors());

// Global rate limit + stricter limit for auth endpoints
app.use(
  "/api",
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again later." },
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, status: "ok", uptime: process.uptime() });
});

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
