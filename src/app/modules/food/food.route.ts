import { Router } from "express";
import auth from "../../middlewares/auth";
import validateData from "../../middlewares/validateData";
import { FoodController } from "./food.controller";
import { FoodValidation } from "./food.validation";

const router = Router();

// ================= Food Categories =================
router.get("/categories", FoodController.getAllCategories);
router.get("/categories/:id", FoodController.getCategoryById);
router.post(
  "/categories",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.createCategorySchema),
  FoodController.createCategory
);
router.patch(
  "/categories/:id",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.updateCategorySchema),
  FoodController.updateCategory
);
router.delete("/categories/:id", auth("SUPER_ADMIN"), FoodController.deleteCategory);

// ================= Food Combos / Packages =================
router.get("/packages", FoodController.getAllFoodPackages);
router.get("/packages/:id", FoodController.getFoodPackageById);
router.post(
  "/packages",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.createFoodPackageSchema),
  FoodController.createFoodPackage
);
router.patch(
  "/packages/:id",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.updateFoodPackageSchema),
  FoodController.updateFoodPackage
);
router.delete("/packages/:id", auth("SUPER_ADMIN"), FoodController.deleteFoodPackage);

// ================= Assignments to EventType =================
router.get("/assignments/:eventTypeId", FoodController.getFoodByEventType);
router.put(
  "/assignments/:eventTypeId",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.assignFoodSchema),
  FoodController.assignFoodToEventType
);
router.delete("/assignments/:assignmentId", auth("SUPER_ADMIN"), FoodController.unassignFood);

// ================= Food Items =================
router.get("/items", FoodController.getAllFoodItems);
router.get("/items/:id", FoodController.getFoodItemById);
router.post(
  "/items",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.createFoodItemSchema),
  FoodController.createFoodItem
);
router.patch(
  "/items/:id",
  auth("SUPER_ADMIN"),
  validateData(FoodValidation.updateFoodItemSchema),
  FoodController.updateFoodItem
);
router.delete("/items/:id", auth("SUPER_ADMIN"), FoodController.deleteFoodItem);
router.patch("/items/:id/toggle-active", auth("SUPER_ADMIN"), FoodController.toggleActiveFoodItem);

export const FoodRoutes = router;

