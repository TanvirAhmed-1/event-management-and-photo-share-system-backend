import { PricingModel, VendorSelectionMode, AiPhotoShareMode } from "@prisma/client";

export interface ICreateServiceCategory {
  name: string;
  slug?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export interface IUpdateServiceCategory {
  name?: string;
  slug?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ICreateService {
  name: string;
  slug?: string;
  categoryId?: string;
  description?: string;
  images?: string[];
  pricingModel: PricingModel;
  basePrice?: number | string;
  unitLabel?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minHours?: number;
  maxHours?: number;
  minDays?: number;
  maxDays?: number;
  isVendorBased?: boolean;
  aiPhotoShareMode?: AiPhotoShareMode;
  aiAddonPrice?: number | string;
  defaultStoragePlanId?: string;
}

export interface IUpdateService {
  name?: string;
  slug?: string;
  categoryId?: string;
  description?: string;
  images?: string[];
  pricingModel?: PricingModel;
  basePrice?: number | string;
  unitLabel?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minHours?: number;
  maxHours?: number;
  minDays?: number;
  maxDays?: number;
  isVendorBased?: boolean;
  aiPhotoShareMode?: AiPhotoShareMode;
  aiAddonPrice?: number | string;
  defaultStoragePlanId?: string;
  isActive?: boolean;
}

export interface IAssignServiceToEventType {
  serviceId: string;
  isRequired?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  minQuantity?: number;
  maxQuantity?: number;
  defaultQuantity?: number;
  priceOverride?: number | string;
  allowMultipleVendors?: boolean;
  allowMultiplePackages?: boolean;
  vendorSelectionMode?: VendorSelectionMode;
}

export interface ICreateServicePackage {
  serviceId: string;
  vendorId?: string;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  price?: number | string;
  features?: string[];
}

