import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { PackageRoutes } from "../modules/package/package.route";
import { UserRoutes } from "../modules/user/user.route";
import { EventRoutes } from "../modules/event/event.route";
import { PhotoRoutes } from "../modules/photo/photo.route";
import { AiRoutes } from "../modules/ai/ai.route";
import { ReviewRoutes } from "../modules/review/review.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/packages",
    route: PackageRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/events",
    route: EventRoutes,
  },
  {
    path: "/photos",
    route: PhotoRoutes,
  },
  {
    path: "/ai",
    route: AiRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const BaseRouter = router;
