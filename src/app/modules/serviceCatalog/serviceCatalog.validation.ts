import { z } from "zod";

const pricingModelEnum = z.enum([
  "FIXED",
  "PER_PERSON",
  "PER_HOUR",
  "PER_DAY",
  "PER_UNIT",
  "CUSTOM_QUOTATION",
]);

const vendorSelectionModeEnum = z.enum(["NONE", "OPTIONAL", "REQUIRED"]);
const aiPhotoShareModeEnum = z.enum(["NONE", "INCLUDED", "ADDON"]);

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

const createServiceSchema = z.object({
  name: z.string({ required_error: "Service name is required" }).min(2),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  description: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  pricingModel: pricingModelEnum,
  basePrice: z.number().nonnegative("Base price must be >= 0").optional().nullable(),
  unitLabel: z.string().optional().nullable(),
  minQuantity: z.number().int().positive().optional().default(1),
  maxQuantity: z.number().int().positive().optional().nullable(),
  minHours: z.number().int().positive().optional().nullable(),
  maxHours: z.number().int().positive().optional().nullable(),
  minDays: z.number().int().positive().optional().nullable(),
  maxDays: z.number().int().positive().optional().nullable(),
  isVendorBased: z.boolean().optional().default(false),
  aiPhotoShareMode: aiPhotoShareModeEnum.optional().default("NONE"),
  aiAddonPrice: z.number().nonnegative().optional().nullable(),
  defaultStoragePlanId: z.string().optional().nullable(),
});

const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  pricingModel: pricingModelEnum.optional(),
  basePrice: z.number().nonnegative().optional().nullable(),
  unitLabel: z.string().optional().nullable(),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional().nullable(),
  minHours: z.number().int().positive().optional().nullable(),
  maxHours: z.number().int().positive().optional().nullable(),
  minDays: z.number().int().positive().optional().nullable(),
  maxDays: z.number().int().positive().optional().nullable(),
  isVendorBased: z.boolean().optional(),
  aiPhotoShareMode: aiPhotoShareModeEnum.optional(),
  aiAddonPrice: z.number().nonnegative().optional().nullable(),
  defaultStoragePlanId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const assignServiceSchema = z.object({
  services: z.array(
    z.object({
      serviceId: z.string().uuid("Invalid service ID"),
      isRequired: z.boolean().optional().default(false),
      isActive: z.boolean().optional().default(true),
      displayOrder: z.number().int().optional().default(0),
      minQuantity: z.number().int().positive().optional().nullable(),
      maxQuantity: z.number().int().positive().optional().nullable(),
      defaultQuantity: z.number().int().positive().optional().nullable(),
      priceOverride: z.number().nonnegative().optional().nullable(),
      allowMultipleVendors: z.boolean().optional().default(false),
      allowMultiplePackages: z.boolean().optional().default(false),
      vendorSelectionMode: vendorSelectionModeEnum.optional().default("OPTIONAL"),
    })
  ),
});

const createPackageSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  vendorId: z.string().uuid().optional().nullable(),
  name: z.string({ required_error: "Package name is required" }).min(2),
  description: z.string().optional(),
  pricingModel: pricingModelEnum,
  price: z.number().nonnegative("Price must be >= 0").optional().nullable(),
  features: z.array(z.string()).optional().default([]),
});

const updatePackageSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  pricingModel: pricingModelEnum.optional(),
  price: z.number().nonnegative().optional().nullable(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const ServiceCatalogValidation = {
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  assignServiceSchema,
  createPackageSchema,
  updatePackageSchema,
};

