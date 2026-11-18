import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { PackageRoutes } from "../modules/package/package.route";
import { UserRoutes } from "../modules/user/user.route";
import { EventRoutes } from "../modules/event/event.route";
import { PhotoRoutes } from "../modules/photo/photo.route";
import { AiRoutes } from "../modules/ai/ai.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { EventTypeRoutes } from "../modules/eventType/eventType.route";
import { ServiceCatalogRoutes } from "../modules/serviceCatalog/serviceCatalog.route";
import { FoodRoutes } from "../modules/food/food.route";
import { PricingRoutes } from "../modules/pricing/pricing.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { BlogRoutes } from "../modules/blog/blog.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { VendorRoutes } from "../modules/vendor/vendor.route";

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
  {
    path: "/event-types",
    route: EventTypeRoutes,
  },
  {
    path: "/services",
    route: ServiceCatalogRoutes,
  },
  {
    path: "/food",
    route: FoodRoutes,
  },
  {
    path: "/pricing",
    route: PricingRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/blogs",
    route: BlogRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/vendors",
    route: VendorRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const BaseRouter = router;
