import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { slugify } from "../../utils/slug";
import { ICreateEventTypeRequest, IUpdateEventTypeRequest } from "./eventType.interface";
import { logAudit } from "../../utils/audit";

const createEventType = async (payload: ICreateEventTypeRequest, adminId?: string) => {
  const generatedSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const existingBySlug = await prisma.eventType.findUnique({
    where: { slug: generatedSlug },
  });

  if (existingBySlug) {
    throw new AppError(httpStatus.CONFLICT, `Event type with slug '${generatedSlug}' already exists!`);
  }

  // Transaction to create event type and its initial field configuration
  const result = await prisma.$transaction(async (tx) => {
    const eventType = await tx.eventType.create({
      data: {
        name: payload.name,
        slug: generatedSlug,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        minGuests: payload.minGuests ?? 1,
        maxGuests: payload.maxGuests ?? null,
        defaultGuests: payload.defaultGuests ?? null,
        allowServiceSelection: payload.allowServiceSelection ?? true,
        allowFoodSelection: payload.allowFoodSelection ?? true,
        displayOrder: payload.displayOrder ?? 0,
      },
    });

    // If fields are passed, create them. Otherwise, seed sensible defaults
    const fieldsToCreate: any[] = payload.fields && payload.fields.length > 0
      ? payload.fields
      : [
          { key: "eventName", label: "Event Name", fieldType: "TEXT", isRequired: true, isEnabled: true, displayOrder: 1 },
          { key: "eventDate", label: "Event Date", fieldType: "DATE", isRequired: true, isEnabled: true, displayOrder: 2 },
          { key: "eventTime", label: "Event Time", fieldType: "TEXT", isRequired: false, isEnabled: true, displayOrder: 3 },
          { key: "venue", label: "Venue / Location", fieldType: "TEXT", isRequired: true, isEnabled: true, displayOrder: 4 },
          { key: "guestCount", label: "Expected Guest Count", fieldType: "NUMBER", isRequired: true, isEnabled: true, displayOrder: 5 },
          { key: "description", label: "Special Requirements / Notes", fieldType: "TEXT", isRequired: false, isEnabled: true, displayOrder: 6 },
        ];

    await tx.eventTypeField.createMany({
      data: fieldsToCreate.map((f: any, idx: number) => ({
        eventTypeId: eventType.id,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType || "TEXT",
        options: f.options ? f.options : undefined,
        isRequired: f.isRequired ?? false,
        isEnabled: f.isEnabled ?? true,
        displayOrder: f.displayOrder ?? idx + 1,
      })),
    });

    return tx.eventType.findUnique({
      where: { id: eventType.id },
      include: {
        fields: { orderBy: { displayOrder: "asc" } },
      },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_EVENT_TYPE",
    entity: "EventType",
    entityId: result?.id,
    after: result,
  });

  return result;
};

const getAllEventTypes = async (includeInactive = false) => {
  const whereClause: any = {
    deletedAt: null,
  };

  if (!includeInactive) {
    whereClause.isActive = true;
  }

  const result = await prisma.eventType.findMany({
    where: whereClause,
    include: {
      fields: {
        where: includeInactive ? {} : { isEnabled: true },
        orderBy: { displayOrder: "asc" },
      },
      _count: {
        select: {
          services: true,
          foods: true,
          events: true,
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  return result;
};

const getEventTypeById = async (id: string, includeInactive = false) => {
  const eventType = await prisma.eventType.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      fields: {
        where: includeInactive ? {} : { isEnabled: true },
        orderBy: { displayOrder: "asc" },
      },
      services: {
        where: includeInactive ? {} : { isActive: true },
        include: {
          service: {
            include: {
              category: true,
              packages: { where: { isActive: true } },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
      foods: {
        where: includeInactive ? {} : { isActive: true },
        include: {
          foodCategory: true,
          foodItem: true,
          foodPackage: {
            include: {
              items: {
                include: { foodItem: true },
              },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!eventType) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  return eventType;
};

const updateEventType = async (id: string, payload: IUpdateEventTypeRequest, adminId?: string) => {
  const existing = await prisma.eventType.findUnique({
    where: { id },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  let slugToUpdate = existing.slug;
  if (payload.slug && payload.slug !== existing.slug) {
    slugToUpdate = slugify(payload.slug);
    const slugInUse = await prisma.eventType.findFirst({
      where: { slug: slugToUpdate, id: { not: id } },
    });
    if (slugInUse) {
      throw new AppError(httpStatus.CONFLICT, `Slug '${slugToUpdate}' is already in use by another event type.`);
    }
  }

  const result = await prisma.eventType.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      slug: slugToUpdate,
      description: payload.description !== undefined ? payload.description : existing.description,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : existing.imageUrl,
      minGuests: payload.minGuests ?? existing.minGuests,
      maxGuests: payload.maxGuests !== undefined ? payload.maxGuests : existing.maxGuests,
      defaultGuests: payload.defaultGuests !== undefined ? payload.defaultGuests : existing.defaultGuests,
      allowServiceSelection: payload.allowServiceSelection ?? existing.allowServiceSelection,
      allowFoodSelection: payload.allowFoodSelection ?? existing.allowFoodSelection,
      displayOrder: payload.displayOrder ?? existing.displayOrder,
      isActive: payload.isActive ?? existing.isActive,
    },
    include: {
      fields: { orderBy: { displayOrder: "asc" } },
    },
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_EVENT_TYPE",
    entity: "EventType",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteEventType = async (id: string, adminId?: string) => {
  const existing = await prisma.eventType.findUnique({
    where: { id },
    include: {
      _count: {
        select: { events: true },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  // Safe delete check: if events exist, prevent hard deletion
  if (existing._count.events > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete event type '${existing.name}' because ${existing._count.events} existing event(s) are using it. You can deactivate it instead.`
    );
  }

  // Safe to delete or soft-delete
  await prisma.$transaction(async (tx) => {
    await tx.eventTypeField.deleteMany({ where: { eventTypeId: id } });
    await tx.eventTypeService.deleteMany({ where: { eventTypeId: id } });
    await tx.eventTypeFood.deleteMany({ where: { eventTypeId: id } });
    await tx.eventType.delete({ where: { id } });
  });

  await logAudit({
    actorId: adminId,
    action: "DELETE_EVENT_TYPE",
    entity: "EventType",
    entityId: id,
    before: existing,
  });

  return { message: "Event type deleted successfully!" };
};

const toggleActiveEventType = async (id: string, adminId?: string) => {
  const existing = await prisma.eventType.findUnique({
    where: { id },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  const updated = await prisma.eventType.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    actorId: adminId,
    action: "TOGGLE_ACTIVE_EVENT_TYPE",
    entity: "EventType",
    entityId: id,
    before: { isActive: existing.isActive },
    after: { isActive: updated.isActive },
  });

  return updated;
};

const syncEventTypeFields = async (id: string, fields: any[], adminId?: string) => {
  const existing = await prisma.eventType.findUnique({
    where: { id },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing fields and re-create them with provided configuration
    await tx.eventTypeField.deleteMany({ where: { eventTypeId: id } });

    await tx.eventTypeField.createMany({
      data: fields.map((f, idx) => ({
        eventTypeId: id,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType || "TEXT",
        options: f.options ? f.options : undefined,
        isRequired: f.isRequired ?? false,
        isEnabled: f.isEnabled ?? true,
        displayOrder: f.displayOrder ?? idx + 1,
      })),
    });

    return tx.eventTypeField.findMany({
      where: { eventTypeId: id },
      orderBy: { displayOrder: "asc" },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "SYNC_EVENT_TYPE_FIELDS",
    entity: "EventTypeField",
    entityId: id,
    after: result,
  });

  return result;
};

export const EventTypeService = {
  createEventType,
  getAllEventTypes,
  getEventTypeById,
  updateEventType,
  deleteEventType,
  toggleActiveEventType,
  syncEventTypeFields,
};
