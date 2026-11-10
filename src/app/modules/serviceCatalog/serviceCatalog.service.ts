import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { slugify } from "../../utils/slug";
import { toDecimal } from "../../utils/money";
import {
  ICreateServiceCategory,
  IUpdateServiceCategory,
  ICreateService,
  IUpdateService,
  IAssignServiceToEventType,
  ICreateServicePackage,
} from "./serviceCatalog.interface";
import { logAudit } from "../../utils/audit";

// ==========================================
// 1. Service Category Operations
// ==========================================

const createCategory = async (payload: ICreateServiceCategory, adminId?: string) => {
  const generatedSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const existing = await prisma.serviceCategory.findUnique({
    where: { slug: generatedSlug },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, `Category slug '${generatedSlug}' already exists!`);
  }

  const result = await prisma.serviceCategory.create({
    data: {
      name: payload.name,
      slug: generatedSlug,
      imageUrl: payload.imageUrl || null,
      displayOrder: payload.displayOrder ?? 0,
    },
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_SERVICE_CATEGORY",
    entity: "ServiceCategory",
    entityId: result.id,
    after: result,
  });

  return result;
};

const getAllCategories = async (includeInactive = false) => {
  const result = await prisma.serviceCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: { select: { services: true } },
    },
    orderBy: { displayOrder: "asc" },
  });
  return result;
};

const getCategoryById = async (id: string) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      services: {
        where: { isActive: true, deletedAt: null },
      },
    },
  });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Service category not found!");
  }
  return category;
};

const updateCategory = async (id: string, payload: IUpdateServiceCategory, adminId?: string) => {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Service category not found!");
  }

  let slugToUpdate = existing.slug;
  if (payload.slug && payload.slug !== existing.slug) {
    slugToUpdate = slugify(payload.slug);
    const inUse = await prisma.serviceCategory.findFirst({
      where: { slug: slugToUpdate, id: { not: id } },
    });
    if (inUse) {
      throw new AppError(httpStatus.CONFLICT, `Category slug '${slugToUpdate}' is already in use.`);
    }
  }

  const result = await prisma.serviceCategory.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      slug: slugToUpdate,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : existing.imageUrl,
      displayOrder: payload.displayOrder ?? existing.displayOrder,
      isActive: payload.isActive ?? existing.isActive,
    },
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_SERVICE_CATEGORY",
    entity: "ServiceCategory",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteCategory = async (id: string, adminId?: string) => {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Service category not found!");
  }

  if (existing._count.services > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete category '${existing.name}' because ${existing._count.services} service(s) are linked to it. Reassign or delete those services first.`
    );
  }

  await prisma.serviceCategory.delete({ where: { id } });

  await logAudit({
    actorId: adminId,
    action: "DELETE_SERVICE_CATEGORY",
    entity: "ServiceCategory",
    entityId: id,
    before: existing,
  });

  return { message: "Service category deleted successfully!" };
};

// ==========================================
// 2. Service Operations
// ==========================================

const createService = async (payload: ICreateService, adminId?: string) => {
  const generatedSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const existingSlug = await prisma.service.findUnique({
    where: { slug: generatedSlug },
  });

  if (existingSlug) {
    throw new AppError(httpStatus.CONFLICT, `Service with slug '${generatedSlug}' already exists!`);
  }

  if (payload.categoryId) {
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new AppError(httpStatus.NOT_FOUND, "Selected service category does not exist!");
    }
  }

  const result = await prisma.service.create({
    data: {
      name: payload.name,
      slug: generatedSlug,
      categoryId: payload.categoryId || null,
      description: payload.description || null,
      images: payload.images || [],
      pricingModel: payload.pricingModel,
      basePrice: payload.basePrice !== undefined && payload.basePrice !== null ? toDecimal(payload.basePrice) : null,
      unitLabel: payload.unitLabel || null,
      minQuantity: payload.minQuantity ?? 1,
      maxQuantity: payload.maxQuantity ?? null,
      minHours: payload.minHours ?? null,
      maxHours: payload.maxHours ?? null,
      minDays: payload.minDays ?? null,
      maxDays: payload.maxDays ?? null,
      isVendorBased: payload.isVendorBased ?? false,
      aiPhotoShareMode: payload.aiPhotoShareMode || "NONE",
      aiAddonPrice: payload.aiAddonPrice !== undefined && payload.aiAddonPrice !== null ? toDecimal(payload.aiAddonPrice) : null,
      defaultStoragePlanId: payload.defaultStoragePlanId || null,
    },
    include: { category: true },
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_SERVICE",
    entity: "Service",
    entityId: result.id,
    after: result,
  });

  return result;
};

const getAllServices = async (query: {
  categoryId?: string;
  pricingModel?: any;
  includeInactive?: boolean;
  q?: string;
}) => {
  const where: any = {
    deletedAt: null,
  };

  if (!query.includeInactive) {
    where.isActive = true;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.pricingModel) {
    where.pricingModel = query.pricingModel;
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const result = await prisma.service.findMany({
    where,
    include: {
      category: true,
      packages: { where: { isActive: true } },
      _count: { select: { eventTypes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
      packages: { where: { isActive: true } },
      eventTypes: {
        include: {
          eventType: { select: { id: true, name: true, slug: true, isActive: true } },
        },
      },
    },
  });

  if (!service || service.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found!");
  }

  return service;
};

const updateService = async (id: string, payload: IUpdateService, adminId?: string) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found!");
  }

  let slugToUpdate = existing.slug;
  if (payload.slug && payload.slug !== existing.slug) {
    slugToUpdate = slugify(payload.slug);
    const inUse = await prisma.service.findFirst({
      where: { slug: slugToUpdate, id: { not: id } },
    });
    if (inUse) {
      throw new AppError(httpStatus.CONFLICT, `Service slug '${slugToUpdate}' is already in use.`);
    }
  }

  if (payload.categoryId) {
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new AppError(httpStatus.NOT_FOUND, "Category does not exist!");
    }
  }

  const result = await prisma.service.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      slug: slugToUpdate,
      categoryId: payload.categoryId !== undefined ? payload.categoryId : existing.categoryId,
      description: payload.description !== undefined ? payload.description : existing.description,
      images: payload.images !== undefined ? payload.images : existing.images,
      pricingModel: payload.pricingModel ?? existing.pricingModel,
      basePrice: payload.basePrice !== undefined ? (payload.basePrice === null ? null : toDecimal(payload.basePrice)) : existing.basePrice,
      unitLabel: payload.unitLabel !== undefined ? payload.unitLabel : existing.unitLabel,
      minQuantity: payload.minQuantity ?? existing.minQuantity,
      maxQuantity: payload.maxQuantity !== undefined ? payload.maxQuantity : existing.maxQuantity,
      minHours: payload.minHours !== undefined ? payload.minHours : existing.minHours,
      maxHours: payload.maxHours !== undefined ? payload.maxHours : existing.maxHours,
      minDays: payload.minDays !== undefined ? payload.minDays : existing.minDays,
      maxDays: payload.maxDays !== undefined ? payload.maxDays : existing.maxDays,
      isVendorBased: payload.isVendorBased ?? existing.isVendorBased,
      aiPhotoShareMode: payload.aiPhotoShareMode ?? existing.aiPhotoShareMode,
      aiAddonPrice: payload.aiAddonPrice !== undefined ? (payload.aiAddonPrice === null ? null : toDecimal(payload.aiAddonPrice)) : existing.aiAddonPrice,
      defaultStoragePlanId: payload.defaultStoragePlanId !== undefined ? payload.defaultStoragePlanId : existing.defaultStoragePlanId,
      isActive: payload.isActive ?? existing.isActive,
    },
    include: { category: true },
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_SERVICE",
    entity: "Service",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteService = async (id: string, adminId?: string) => {
  const existing = await prisma.service.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          selections: true,
          eventTypes: true,
        },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found!");
  }

  // Safe delete check: if customer selections exist, do NOT hard delete!
  if (existing._count.selections > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete service '${existing.name}' because it has ${existing._count.selections} existing customer selection(s). You can deactivate it instead.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventTypeService.deleteMany({ where: { serviceId: id } });
    await tx.servicePackage.deleteMany({ where: { serviceId: id } });
    await tx.service.delete({ where: { id } });
  });

  await logAudit({
    actorId: adminId,
    action: "DELETE_SERVICE",
    entity: "Service",
    entityId: id,
    before: existing,
  });

  return { message: "Service deleted successfully!" };
};

const toggleActiveService = async (id: string, adminId?: string) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found!");
  }

  const updated = await prisma.service.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    actorId: adminId,
    action: "TOGGLE_ACTIVE_SERVICE",
    entity: "Service",
    entityId: id,
    before: { isActive: existing.isActive },
    after: { isActive: updated.isActive },
  });

  return updated;
};

// ==========================================
// 3. EventTypeService Assignment Operations
// ==========================================

const getServicesByEventType = async (eventTypeId: string, includeInactive = false) => {
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });
  if (!eventType || eventType.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  const assignments = await prisma.eventTypeService.findMany({
    where: {
      eventTypeId,
      ...(includeInactive ? {} : { isActive: true, service: { isActive: true, deletedAt: null } }),
    },
    include: {
      service: {
        include: {
          category: true,
          packages: { where: { isActive: true } },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Map to clear structure combining service details with event-type overrides
  return assignments.map((a) => {
    const s = a.service;
    return {
      assignmentId: a.id,
      serviceId: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category?.name || "General",
      categoryId: s.categoryId,
      description: s.description,
      images: s.images,
      pricingModel: s.pricingModel,
      basePrice: a.priceOverride ?? s.basePrice,
      isPriceOverridden: a.priceOverride !== null,
      unitLabel: s.unitLabel,
      minQuantity: a.minQuantity ?? s.minQuantity,
      maxQuantity: a.maxQuantity ?? s.maxQuantity,
      defaultQuantity: a.defaultQuantity ?? 1,
      isRequired: a.isRequired,
      isVendorBased: s.isVendorBased,
      allowMultipleVendors: a.allowMultipleVendors,
      allowMultiplePackages: a.allowMultiplePackages,
      vendorSelectionMode: a.vendorSelectionMode,
      aiPhotoShareMode: s.aiPhotoShareMode,
      aiAddonPrice: s.aiAddonPrice,
      packages: s.packages,
      displayOrder: a.displayOrder,
      isActive: a.isActive && s.isActive,
    };
  });
};

const assignServicesToEventType = async (
  eventTypeId: string,
  services: IAssignServiceToEventType[],
  adminId?: string
) => {
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });
  if (!eventType || eventType.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  // Validate all serviceIds exist
  const serviceIds = services.map((s) => s.serviceId);
  const foundServices = await prisma.service.findMany({
    where: { id: { in: serviceIds }, deletedAt: null },
  });

  if (foundServices.length !== serviceIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "One or more service IDs are invalid or deleted!");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing assignments not in the new list, or upsert each
    await tx.eventTypeService.deleteMany({
      where: {
        eventTypeId,
        serviceId: { notIn: serviceIds },
      },
    });

    for (let i = 0; i < services.length; i++) {
      const item = services[i];
      await tx.eventTypeService.upsert({
        where: {
          eventTypeId_serviceId: {
            eventTypeId,
            serviceId: item.serviceId,
          },
        },
        create: {
          eventTypeId,
          serviceId: item.serviceId,
          isRequired: item.isRequired ?? false,
          isActive: item.isActive ?? true,
          displayOrder: item.displayOrder ?? i + 1,
          minQuantity: item.minQuantity ?? null,
          maxQuantity: item.maxQuantity ?? null,
          defaultQuantity: item.defaultQuantity ?? null,
          priceOverride: item.priceOverride !== undefined && item.priceOverride !== null ? toDecimal(item.priceOverride) : null,
          allowMultipleVendors: item.allowMultipleVendors ?? false,
          allowMultiplePackages: item.allowMultiplePackages ?? false,
          vendorSelectionMode: item.vendorSelectionMode || "OPTIONAL",
        },
        update: {
          isRequired: item.isRequired ?? false,
          isActive: item.isActive ?? true,
          displayOrder: item.displayOrder ?? i + 1,
          minQuantity: item.minQuantity !== undefined ? item.minQuantity : null,
          maxQuantity: item.maxQuantity !== undefined ? item.maxQuantity : null,
          defaultQuantity: item.defaultQuantity !== undefined ? item.defaultQuantity : null,
          priceOverride: item.priceOverride !== undefined ? (item.priceOverride === null ? null : toDecimal(item.priceOverride)) : undefined,
          allowMultipleVendors: item.allowMultipleVendors ?? false,
          allowMultiplePackages: item.allowMultiplePackages ?? false,
          vendorSelectionMode: item.vendorSelectionMode || "OPTIONAL",
        },
      });
    }

    return tx.eventTypeService.findMany({
      where: { eventTypeId },
      include: { service: true },
      orderBy: { displayOrder: "asc" },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "ASSIGN_SERVICES_TO_EVENT_TYPE",
    entity: "EventTypeService",
    entityId: eventTypeId,
    after: result,
  });

  return result;
};

const unassignService = async (eventTypeId: string, serviceId: string, adminId?: string) => {
  const existing = await prisma.eventTypeService.findUnique({
    where: {
      eventTypeId_serviceId: { eventTypeId, serviceId },
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Assignment not found!");
  }

  await prisma.eventTypeService.delete({
    where: {
      eventTypeId_serviceId: { eventTypeId, serviceId },
    },
  });

  await logAudit({
    actorId: adminId,
    action: "UNASSIGN_SERVICE_FROM_EVENT_TYPE",
    entity: "EventTypeService",
    entityId: `${eventTypeId}_${serviceId}`,
    before: existing,
  });

  return { message: "Service unassigned from event type successfully!" };
};

// ==========================================
// 4. Service Package Operations
// ==========================================

const createPackage = async (payload: ICreateServicePackage, adminId?: string) => {
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service || service.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Target service does not exist!");
  }

  const result = await prisma.servicePackage.create({
    data: {
      serviceId: payload.serviceId,
      vendorId: payload.vendorId || null,
      name: payload.name,
      description: payload.description || null,
      pricingModel: payload.pricingModel,
      price: payload.price !== undefined && payload.price !== null ? toDecimal(payload.price) : null,
      features: payload.features || [],
    },
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_SERVICE_PACKAGE",
    entity: "ServicePackage",
    entityId: result.id,
    after: result,
  });

  return result;
};

const updatePackage = async (id: string, payload: any, adminId?: string) => {
  const existing = await prisma.servicePackage.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Package not found!");
  }

  const result = await prisma.servicePackage.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      description: payload.description !== undefined ? payload.description : existing.description,
      pricingModel: payload.pricingModel ?? existing.pricingModel,
      price: payload.price !== undefined ? (payload.price === null ? null : toDecimal(payload.price)) : existing.price,
      features: payload.features ?? existing.features,
      isActive: payload.isActive ?? existing.isActive,
    },
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_SERVICE_PACKAGE",
    entity: "ServicePackage",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deletePackage = async (id: string, adminId?: string) => {
  const existing = await prisma.servicePackage.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Package not found!");
  }

  await prisma.servicePackage.delete({ where: { id } });

  await logAudit({
    actorId: adminId,
    action: "DELETE_SERVICE_PACKAGE",
    entity: "ServicePackage",
    entityId: id,
    before: existing,
  });

  return { message: "Package deleted successfully!" };
};

export const ServiceCatalogService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  toggleActiveService,
  getServicesByEventType,
  assignServicesToEventType,
  unassignService,
  createPackage,
  updatePackage,
  deletePackage,
};

