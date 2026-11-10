import { EventStatus, RepriceMode } from "@prisma/client";

export interface ICreateEventRequest {
  title: string;
  coverImage?: string;
  eventTypeId?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  guestCount?: number;
  description?: string;
  additionalRequirements?: string;
  customFieldValues?: Record<string, any>;
}

export interface IUpdateEventDetailsRequest {
  title?: string;
  coverImage?: string;
  eventTypeId?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  guestCount?: number;
  description?: string;
  additionalRequirements?: string;
  customFieldValues?: Record<string, any>;
  repriceOnGuestChange?: RepriceMode;
  status?: EventStatus;
}

export interface ISelectServicesRequest {
  services: {
    serviceId: string;
    packageId?: string;
    vendorId?: string;
    quantity?: number;
    hours?: number;
    days?: number;
    includeAiAddon?: boolean;
    notes?: string;
  }[];
}

export interface ISelectFoodRequest {
  foods: {
    foodItemId?: string;
    foodPackageId?: string;
    quantity?: number; // optional custom override
  }[];
}

export interface IConfirmEventRequest {
  expectedGrandTotal?: number | string;
}
