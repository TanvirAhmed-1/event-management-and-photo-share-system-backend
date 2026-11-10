export interface ICreateFoodCategory {
  name: string;
  slug?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export interface IUpdateFoodCategory {
  name?: string;
  slug?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ICreateFoodItem {
  name: string;
  slug?: string;
  categoryId: string;
  description?: string;
  images?: string[];
  pricePerPerson: number | string;
  dietaryLabels?: string[];
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  allowQuantityOverride?: boolean;
}

export interface IUpdateFoodItem {
  name?: string;
  slug?: string;
  categoryId?: string;
  description?: string;
  images?: string[];
  pricePerPerson?: number | string;
  dietaryLabels?: string[];
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  allowQuantityOverride?: boolean;
  isActive?: boolean;
}

export interface ICreateFoodPackage {
  name: string;
  description?: string;
  imageUrl?: string;
  pricePerPerson: number | string;
  minPersons?: number;
  itemIds: string[]; // foodItemIds
}

export interface IAssignFoodToEventType {
  foodCategoryId?: string;
  foodItemId?: string;
  foodPackageId?: string;
  isExcluded?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  priceOverride?: number | string;
  minOrderOverride?: number;
  allowQuantityOverride?: boolean;
  isDefaultSelected?: boolean;
}

