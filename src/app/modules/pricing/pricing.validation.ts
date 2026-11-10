import { z } from "zod";

const calculatePriceSchema = z.object({
  eventTypeId: z.string({ required_error: "eventTypeId is required" }).uuid("Invalid eventTypeId"),
  guestCount: z.number({ required_error: "guestCount is required" }).int().positive(),
  services: z
    .array(
      z.object({
        serviceId: z.string().uuid("Invalid serviceId"),
        packageId: z.string().uuid().optional(),
        quantity: z.number().int().positive().optional(),
        hours: z.number().int().positive().optional(),
        days: z.number().int().positive().optional(),
        includeAiAddon: z.boolean().optional(),
      })
    )
    .optional()
    .default([]),
  foods: z
    .array(
      z.object({
        foodItemId: z.string().uuid().optional(),
        foodPackageId: z.string().uuid().optional(),
        quantity: z.number().int().positive().optional(),
      })
    )
    .optional()
    .default([]),
});

export const PricingValidation = {
  calculatePriceSchema,
};

