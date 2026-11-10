import { Router } from "express";
import auth from "../../middlewares/auth";
import validateData from "../../middlewares/validateData";
import { ServiceCatalogController } from "./serviceCatalog.controller";
import { ServiceCatalogValidation } from "./serviceCatalog.validation";

const router = Router();

// ================= Categories =================
router.get("/categories", ServiceCatalogController.getAllCategories);
router.get("/categories/:id", ServiceCatalogController.getCategoryById);
router.post(
  "/categories",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.createCategorySchema),
  ServiceCatalogController.createCategory
);
router.patch(
  "/categories/:id",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.updateCategorySchema),
  ServiceCatalogController.updateCategory
);
router.delete("/categories/:id", auth("SUPER_ADMIN"), ServiceCatalogController.deleteCategory);

// ================= Assignments to EventType =================
router.get("/assignments/:eventTypeId", ServiceCatalogController.getServicesByEventType);
router.put(
  "/assignments/:eventTypeId",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.assignServiceSchema),
  ServiceCatalogController.assignServicesToEventType
);
router.delete(
  "/assignments/:eventTypeId/:serviceId",
  auth("SUPER_ADMIN"),
  ServiceCatalogController.unassignService
);

// ================= Service Packages =================
router.post(
  "/packages",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.createPackageSchema),
  ServiceCatalogController.createPackage
);
router.patch(
  "/packages/:id",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.updatePackageSchema),
  ServiceCatalogController.updatePackage
);
router.delete("/packages/:id", auth("SUPER_ADMIN"), ServiceCatalogController.deletePackage);

// ================= Services =================
router.get("/", ServiceCatalogController.getAllServices);
router.get("/:id", ServiceCatalogController.getServiceById);
router.post(
  "/",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.createServiceSchema),
  ServiceCatalogController.createService
);
router.patch(
  "/:id",
  auth("SUPER_ADMIN"),
  validateData(ServiceCatalogValidation.updateServiceSchema),
  ServiceCatalogController.updateService
);
router.delete("/:id", auth("SUPER_ADMIN"), ServiceCatalogController.deleteService);
router.patch("/:id/toggle-active", auth("SUPER_ADMIN"), ServiceCatalogController.toggleActiveService);

export const ServiceCatalogRoutes = router;

