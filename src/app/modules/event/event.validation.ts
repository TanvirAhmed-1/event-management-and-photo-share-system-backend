import { z } from "zod";

const createEventSchema = z.object({
  title: z.string({ required_error: "Event title is required" }).min(2),
  coverImage: z.string().url().optional().or(z.literal("")),
  eventTypeId: z.string().uuid("Invalid eventTypeId").optional(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  description: z.string().optional(),
  additionalRequirements: z.string().optional(),
  customFieldValues: z.record(z.any()).optional(),
});

const updateEventDetailsSchema = z.object({
  title: z.string().min(2).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  eventTypeId: z.string().uuid().optional(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  description: z.string().optional(),
  additionalRequirements: z.string().optional(),
  customFieldValues: z.record(z.any()).optional(),
});

const selectServicesSchema = z.object({
  services: z.array(
    z.object({
      serviceId: z.string().uuid("Invalid serviceId"),
      packageId: z.string().uuid().optional().nullable(),
      vendorId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive().optional(),
      hours: z.number().int().positive().optional(),
      days: z.number().int().positive().optional(),
      includeAiAddon: z.boolean().optional(),
      notes: z.string().optional(),
    })
  ),
});

const selectFoodSchema = z.object({
  foods: z.array(
    z.object({
      foodItemId: z.string().uuid().optional().nullable(),
      foodPackageId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive().optional().nullable(),
    })
  ),
});

const updateGuestCountSchema = z.object({
  guestCount: z.number({ required_error: "guestCount is required" }).int().positive(),
});

const confirmEventSchema = z.object({
  expectedGrandTotal: z.number().nonnegative().optional().or(z.string().optional()),
});

const customCreateEventSchema = z.object({
  title: z.string().min(2).optional(),
  eventTypeId: z.string().uuid("Invalid eventTypeId"),
  city: z.string().min(1, "City/Area is required"),
  area: z.string().optional(),
  venue: z.string().min(2, "Venue or event address is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  guestCount: z.number().int().positive("Guest count must be positive"),
  services: z
    .array(
      z.object({
        serviceId: z.string().uuid("Invalid serviceId"),
        quantity: z.number().int().positive().optional().default(1),
        hours: z.number().int().positive().optional(),
        days: z.number().int().positive().optional(),
        includeAiAddon: z.boolean().optional().default(false),
        notes: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  foods: z
    .array(
      z.object({
        foodItemId: z.string().uuid("Invalid foodItemId"),
        quantity: z.number().int().positive().optional(),
      })
    )
    .optional()
    .default([]),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().min(6, "Phone number is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  paymentMethod: z.enum(["BKASH", "SSLCOMMERZ", "CASH"]).optional().default("BKASH"),
  payAdvance: z.boolean().optional().default(true),
  additionalRequirements: z.string().optional(),
});

export const EventValidation = {
  createEventSchema,
  updateEventDetailsSchema,
  selectServicesSchema,
  selectFoodSchema,
  updateGuestCountSchema,
  confirmEventSchema,
  customCreateEventSchema,
};

