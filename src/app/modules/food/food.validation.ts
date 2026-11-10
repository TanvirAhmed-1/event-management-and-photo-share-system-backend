import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string({ required_error: "Category name is required" }).min(2),
  slug: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().optional().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createFoodItemSchema = z.object({
  name: z.string({ required_error: "Food item name is required" }).min(2),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  description: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  pricePerPerson: z.number({ required_error: "Price per person is required" }).nonnegative(),
  dietaryLabels: z.array(z.string()).optional().default([]),
  minOrderQuantity: z.number().int().positive().optional().default(1),
  maxOrderQuantity: z.number().int().positive().optional().nullable(),
  allowQuantityOverride: z.boolean().optional().default(false),
});

const updateFoodItemSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  pricePerPerson: z.number().nonnegative().optional(),
  dietaryLabels: z.array(z.string()).optional(),
  minOrderQuantity: z.number().int().positive().optional(),
  maxOrderQuantity: z.number().int().positive().optional().nullable(),
  allowQuantityOverride: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const createFoodPackageSchema = z.object({
  name: z.string({ required_error: "Combo name is required" }).min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  pricePerPerson: z.number({ required_error: "Combo price per person is required" }).nonnegative(),
  minPersons: z.number().int().positive().optional().default(1),
  itemIds: z.array(z.string().uuid("Invalid item ID")).min(1, "Combo must include at least 1 food item"),
});

const updateFoodPackageSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  pricePerPerson: z.number().nonnegative().optional(),
  minPersons: z.number().int().positive().optional(),
  itemIds: z.array(z.string().uuid("Invalid item ID")).optional(),
  isActive: z.boolean().optional(),
});

const assignFoodSchema = z.object({
  assignments: z.array(
    z.object({
      foodCategoryId: z.string().uuid().optional().nullable(),
      foodItemId: z.string().uuid().optional().nullable(),
      foodPackageId: z.string().uuid().optional().nullable(),
      isExcluded: z.boolean().optional().default(false),
      isActive: z.boolean().optional().default(true),
      displayOrder: z.number().int().optional().default(0),
      priceOverride: z.number().nonnegative().optional().nullable(),
      minOrderOverride: z.number().int().positive().optional().nullable(),
      allowQuantityOverride: z.boolean().optional().nullable(),
      isDefaultSelected: z.boolean().optional().default(false),
    })
  ).min(1, "At least one food assignment is required"),
});

export const FoodValidation = {
  createCategorySchema,
  updateCategorySchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  createFoodPackageSchema,
  updateFoodPackageSchema,
  assignFoodSchema,
};

