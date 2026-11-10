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

export const EventValidation = {
  createEventSchema,
  updateEventDetailsSchema,
  selectServicesSchema,
  selectFoodSchema,
  updateGuestCountSchema,
  confirmEventSchema,
};

