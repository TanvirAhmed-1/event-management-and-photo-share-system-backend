import { z } from "zod";

const fieldTypeEnum = z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "BOOLEAN"]);

const eventTypeFieldSchema = z.object({
  key: z.string({ required_error: "Field key is required" }).min(1),
  label: z.string({ required_error: "Field label is required" }).min(1),
  fieldType: fieldTypeEnum.default("TEXT"),
  options: z.any().optional(),
  isRequired: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

const createEventTypeSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  minGuests: z.number().int().positive().default(1),
  maxGuests: z.number().int().positive().optional().nullable(),
  defaultGuests: z.number().int().positive().optional().nullable(),
  allowServiceSelection: z.boolean().optional().default(true),
  allowFoodSelection: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
  fields: z.array(eventTypeFieldSchema).optional(),
});

const updateEventTypeSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  minGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional().nullable(),
  defaultGuests: z.number().int().positive().optional().nullable(),
  allowServiceSelection: z.boolean().optional(),
  allowFoodSelection: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateFieldsSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string().uuid().optional(),
      key: z.string().min(1),
      label: z.string().min(1),
      fieldType: fieldTypeEnum.default("TEXT"),
      options: z.any().optional(),
      isRequired: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
      displayOrder: z.number().int().optional(),
    })
  ),
});

export const EventTypeValidation = {
  createEventTypeSchema,
  updateEventTypeSchema,
  updateFieldsSchema,
};

