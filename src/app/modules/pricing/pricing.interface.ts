import { PricingModel } from "@prisma/client";

export interface ICalculateServiceItem {
  serviceId: string;
  packageId?: string;
  quantity?: number;
  hours?: number;
  days?: number;
  includeAiAddon?: boolean;
}

export interface ICalculateFoodItem {
  foodItemId?: string;
  foodPackageId?: string;
  quantity?: number; // if user overrode quantity, otherwise uses guestCount
}

export interface IPricingCalculationInput {
  eventTypeId: string;
  guestCount: number;
  services?: ICalculateServiceItem[];
  foods?: ICalculateFoodItem[];
}

export interface IComputedServiceLine {
  serviceId: string;
  serviceName: string;
  packageId?: string;
  packageName?: string;
  pricingModel: PricingModel;
  unitPrice: string;
  quantity: number;
  hours?: number;
  days?: number;
  hasAiAddon: boolean;
  aiAddonPrice?: string;
  lineTotal: string;
  isQuotationRequired: boolean;
}

export interface IComputedFoodLine {
  foodItemId?: string;
  foodPackageId?: string;
  name: string;
  category?: string;
  pricePerPerson: string;
  quantity: number; // number of guests/persons
  isQuantityOverridden: boolean;
  lineTotal: string;
}

export interface IPriceBreakdown {
  currency: string;
  guestCount: number;
  services: {
    items: IComputedServiceLine[];
    subtotal: string;
    pendingQuotationsCount: number;
  };
  foods: {
    items: IComputedFoodLine[];
    subtotal: string;
  };
  subtotal: string;
  charges: {
    name: string;
    valueType: string;
    amount: string;
  }[];
  totalCharges: string;
  discount: string;
  taxes: {
    name: string;
    ratePercent: string;
    amount: string;
  }[];
  totalTax: string;
  grandTotal: string;
}

