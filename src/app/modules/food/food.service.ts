import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { slugify } from "../../utils/slug";
import { toDecimal } from "../../utils/money";
import {
  ICreateFoodCategory,
  IUpdateFoodCategory,
  ICreateFoodItem,
  IUpdateFoodItem,
  ICreateFoodPackage,
  IAssignFoodToEventType,
} from "./food.interface";
import { logAudit } from "../../utils/audit";

// ==========================================
// 1. Food Category Operations
// ==========================================

const createCategory = async (payload: ICreateFoodCategory, adminId?: string) => {
  const generatedSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const existing = await prisma.foodCategory.findUnique({
    where: { slug: generatedSlug },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, `Food category slug '${generatedSlug}' already exists!`);
  }

  const result = await prisma.foodCategory.create({
    data: {
      name: payload.name,
      slug: generatedSlug,
      imageUrl: payload.imageUrl || null,
      displayOrder: payload.displayOrder ?? 0,
    },
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_FOOD_CATEGORY",
    entity: "FoodCategory",
    entityId: result.id,
    after: result,
  });

  return result;
};

const getAllCategories = async (includeInactive = false) => {
  const result = await prisma.foodCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { displayOrder: "asc" },
  });
  return result;
};

const getCategoryById = async (id: string) => {
  const category = await prisma.foodCategory.findUnique({
    where: { id },
    include: {
      items: {
        where: { isActive: true, deletedAt: null },
      },
    },
  });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Food category not found!");
  }
  return category;
};

const updateCategory = async (id: string, payload: IUpdateFoodCategory, adminId?: string) => {
  const existing = await prisma.foodCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Food category not found!");
  }

  let slugToUpdate = existing.slug;
  if (payload.slug && payload.slug !== existing.slug) {
    slugToUpdate = slugify(payload.slug);
    const inUse = await prisma.foodCategory.findFirst({
      where: { slug: slugToUpdate, id: { not: id } },
    });
    if (inUse) {
      throw new AppError(httpStatus.CONFLICT, `Slug '${slugToUpdate}' already in use.`);
    }
  }

  const result = await prisma.foodCategory.update({
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
    action: "UPDATE_FOOD_CATEGORY",
    entity: "FoodCategory",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteCategory = async (id: string, adminId?: string) => {
  const existing = await prisma.foodCategory.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Food category not found!");
  }

  if (existing._count.items > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete category '${existing.name}' because ${existing._count.items} food item(s) are linked to it. Reassign or delete those items first.`
    );
  }

  await prisma.foodCategory.delete({ where: { id } });

  await logAudit({
    actorId: adminId,
    action: "DELETE_FOOD_CATEGORY",
    entity: "FoodCategory",
    entityId: id,
    before: existing,
  });

  return { message: "Food category deleted successfully!" };
};

// ==========================================
// 2. Food Item Operations
// ==========================================

const createFoodItem = async (payload: ICreateFoodItem, adminId?: string) => {
  const generatedSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const existingSlug = await prisma.foodItem.findUnique({
    where: { slug: generatedSlug },
  });

  if (existingSlug) {
    throw new AppError(httpStatus.CONFLICT, `Food item with slug '${generatedSlug}' already exists!`);
  }

  const categoryExists = await prisma.foodCategory.findUnique({
    where: { id: payload.categoryId },
  });
  if (!categoryExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Selected food category does not exist!");
  }

  const result = await prisma.foodItem.create({
    data: {
      name: payload.name,
      slug: generatedSlug,
      categoryId: payload.categoryId,
      description: payload.description || null,
      images: payload.images || [],
      pricePerPerson: toDecimal(payload.pricePerPerson),
      dietaryLabels: payload.dietaryLabels || [],
      minOrderQuantity: payload.minOrderQuantity ?? 1,
      maxOrderQuantity: payload.maxOrderQuantity ?? null,
      allowQuantityOverride: payload.allowQuantityOverride ?? false,
    },
    include: { category: true },
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_FOOD_ITEM",
    entity: "FoodItem",
    entityId: result.id,
    after: result,
  });

  return result;
};

const getAllFoodItems = async (query: {
  categoryId?: string;
  dietaryLabel?: string;
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

  if (query.dietaryLabel) {
    where.dietaryLabels = { has: query.dietaryLabel };
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const result = await prisma.foodItem.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return result;
};

const getFoodItemById = async (id: string) => {
  const item = await prisma.foodItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!item || item.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Food item not found!");
  }

  return item;
};

const updateFoodItem = async (id: string, payload: IUpdateFoodItem, adminId?: string) => {
  const existing = await prisma.foodItem.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Food item not found!");
  }

  let slugToUpdate = existing.slug;
  if (payload.slug && payload.slug !== existing.slug) {
    slugToUpdate = slugify(payload.slug);
    const inUse = await prisma.foodItem.findFirst({
      where: { slug: slugToUpdate, id: { not: id } },
    });
    if (inUse) {
      throw new AppError(httpStatus.CONFLICT, `Food item slug '${slugToUpdate}' is already in use.`);
    }
  }

  if (payload.categoryId) {
    const categoryExists = await prisma.foodCategory.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new AppError(httpStatus.NOT_FOUND, "Category does not exist!");
    }
  }

  const result = await prisma.foodItem.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      slug: slugToUpdate,
      categoryId: payload.categoryId !== undefined ? payload.categoryId : existing.categoryId,
      description: payload.description !== undefined ? payload.description : existing.description,
      images: payload.images !== undefined ? payload.images : existing.images,
      pricePerPerson: payload.pricePerPerson !== undefined ? toDecimal(payload.pricePerPerson) : existing.pricePerPerson,
      dietaryLabels: payload.dietaryLabels !== undefined ? payload.dietaryLabels : existing.dietaryLabels,
      minOrderQuantity: payload.minOrderQuantity ?? existing.minOrderQuantity,
      maxOrderQuantity: payload.maxOrderQuantity !== undefined ? payload.maxOrderQuantity : existing.maxOrderQuantity,
      allowQuantityOverride: payload.allowQuantityOverride ?? existing.allowQuantityOverride,
      isActive: payload.isActive ?? existing.isActive,
    },
    include: { category: true },
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_FOOD_ITEM",
    entity: "FoodItem",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteFoodItem = async (id: string, adminId?: string) => {
  const existing = await prisma.foodItem.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          selections: true,
          packageItems: true,
        },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Food item not found!");
  }

  // Safe delete check: if customer selections exist, do NOT hard delete!
  if (existing._count.selections > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete food item '${existing.name}' because it has ${existing._count.selections} existing customer selection(s). You can deactivate it instead.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventTypeFood.deleteMany({ where: { foodItemId: id } });
    await tx.foodPackageItem.deleteMany({ where: { foodItemId: id } });
    await tx.foodItem.delete({ where: { id } });
  });

  await logAudit({
    actorId: adminId,
    action: "DELETE_FOOD_ITEM",
    entity: "FoodItem",
    entityId: id,
    before: existing,
  });

  return { message: "Food item deleted successfully!" };
};

const toggleActiveFoodItem = async (id: string, adminId?: string) => {
  const existing = await prisma.foodItem.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Food item not found!");
  }

  const updated = await prisma.foodItem.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    actorId: adminId,
    action: "TOGGLE_ACTIVE_FOOD_ITEM",
    entity: "FoodItem",
    entityId: id,
    before: { isActive: existing.isActive },
    after: { isActive: updated.isActive },
  });

  return updated;
};

// ==========================================
// 3. Food Package (Combos) Operations
// ==========================================

const createFoodPackage = async (payload: ICreateFoodPackage, adminId?: string) => {
  // Check that all foodItemIds exist
  const items = await prisma.foodItem.findMany({
    where: { id: { in: payload.itemIds }, deletedAt: null },
  });

  if (items.length !== payload.itemIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "One or more item IDs in combo are invalid or deleted!");
  }

  const result = await prisma.$transaction(async (tx) => {
    const pkg = await tx.foodPackage.create({
      data: {
        name: payload.name,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        pricePerPerson: toDecimal(payload.pricePerPerson),
        minPersons: payload.minPersons ?? 1,
      },
    });

    await tx.foodPackageItem.createMany({
      data: payload.itemIds.map((foodItemId) => ({
        packageId: pkg.id,
        foodItemId,
      })),
    });

    return tx.foodPackage.findUnique({
      where: { id: pkg.id },
      include: {
        items: {
          include: { foodItem: true },
        },
      },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "CREATE_FOOD_PACKAGE",
    entity: "FoodPackage",
    entityId: result?.id,
    after: result,
  });

  return result;
};

const getAllFoodPackages = async (includeInactive = false) => {
  const result = await prisma.foodPackage.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      items: {
        include: { foodItem: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return result;
};

const getFoodPackageById = async (id: string) => {
  const pkg = await prisma.foodPackage.findUnique({
    where: { id },
    include: {
      items: {
        include: { foodItem: true },
      },
    },
  });

  if (!pkg) {
    throw new AppError(httpStatus.NOT_FOUND, "Food package/combo not found!");
  }

  return pkg;
};

const updateFoodPackage = async (id: string, payload: any, adminId?: string) => {
  const existing = await prisma.foodPackage.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Food package/combo not found!");
  }

  const result = await prisma.$transaction(async (tx) => {
    if (payload.itemIds && Array.isArray(payload.itemIds)) {
      await tx.foodPackageItem.deleteMany({ where: { packageId: id } });
      await tx.foodPackageItem.createMany({
        data: payload.itemIds.map((foodItemId: string) => ({
          packageId: id,
          foodItemId,
        })),
      });
    }

    return tx.foodPackage.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        description: payload.description !== undefined ? payload.description : existing.description,
        imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : existing.imageUrl,
        pricePerPerson: payload.pricePerPerson !== undefined ? toDecimal(payload.pricePerPerson) : existing.pricePerPerson,
        minPersons: payload.minPersons ?? existing.minPersons,
        isActive: payload.isActive ?? existing.isActive,
      },
      include: {
        items: { include: { foodItem: true } },
      },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "UPDATE_FOOD_PACKAGE",
    entity: "FoodPackage",
    entityId: id,
    before: existing,
    after: result,
  });

  return result;
};

const deleteFoodPackage = async (id: string, adminId?: string) => {
  const existing = await prisma.foodPackage.findUnique({
    where: { id },
    include: { _count: { select: { selections: true } } },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Food package/combo not found!");
  }

  if (existing._count.selections > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete combo '${existing.name}' because ${existing._count.selections} customer selection(s) reference it. You can deactivate it instead.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventTypeFood.deleteMany({ where: { foodPackageId: id } });
    await tx.foodPackageItem.deleteMany({ where: { packageId: id } });
    await tx.foodPackage.delete({ where: { id } });
  });

  await logAudit({
    actorId: adminId,
    action: "DELETE_FOOD_PACKAGE",
    entity: "FoodPackage",
    entityId: id,
    before: existing,
  });

  return { message: "Food package deleted successfully!" };
};

// ==========================================
// 4. EventTypeFood Assignment Operations
// ==========================================

const getFoodByEventType = async (eventTypeId: string, includeInactive = false) => {
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });
  if (!eventType || eventType.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  // 1. Fetch direct assignments for this event type
  const assignments = await prisma.eventTypeFood.findMany({
    where: {
      eventTypeId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      foodCategory: {
        include: {
          items: {
            where: { isActive: true, deletedAt: null },
          },
        },
      },
      foodItem: {
        include: { category: true },
      },
      foodPackage: {
        include: {
          items: { include: { foodItem: true } },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Track excluded foodItem IDs
  const excludedItemIds = new Set<string>();
  assignments.forEach((a) => {
    if (a.isExcluded && a.foodItemId) {
      excludedItemIds.add(a.foodItemId);
    }
  });

  // Organize items by categories, and separate combos
  const availableItemsMap = new Map<string, any>();
  const availableCombos: any[] = [];

  for (const a of assignments) {
    // A. Direct Food Item assignment
    if (a.foodItem && a.foodItem.isActive && !a.foodItem.deletedAt && !a.isExcluded) {
      availableItemsMap.set(a.foodItem.id, {
        assignmentId: a.id,
        foodItemId: a.foodItem.id,
        name: a.foodItem.name,
        slug: a.foodItem.slug,
        category: a.foodItem.category.name,
        categoryId: a.foodItem.categoryId,
        description: a.foodItem.description,
        images: a.foodItem.images,
        pricePerPerson: a.priceOverride ?? a.foodItem.pricePerPerson,
        isPriceOverridden: a.priceOverride !== null,
        dietaryLabels: a.foodItem.dietaryLabels,
        minOrderQuantity: a.minOrderOverride ?? a.foodItem.minOrderQuantity,
        maxOrderQuantity: a.foodItem.maxOrderQuantity,
        allowQuantityOverride: a.allowQuantityOverride ?? a.foodItem.allowQuantityOverride,
        isDefaultSelected: a.isDefaultSelected,
        displayOrder: a.displayOrder,
      });
    }

    // B. Category assignment (all active items in this category inherit assignment unless excluded)
    if (a.foodCategory && a.foodCategory.isActive && !a.isExcluded) {
      for (const item of a.foodCategory.items) {
        if (!excludedItemIds.has(item.id) && !availableItemsMap.has(item.id)) {
          availableItemsMap.set(item.id, {
            assignmentId: a.id,
            foodItemId: item.id,
            name: item.name,
            slug: item.slug,
            category: a.foodCategory.name,
            categoryId: a.foodCategory.id,
            description: item.description,
            images: item.images,
            pricePerPerson: a.priceOverride ?? item.pricePerPerson,
            isPriceOverridden: a.priceOverride !== null,
            dietaryLabels: item.dietaryLabels,
            minOrderQuantity: a.minOrderOverride ?? item.minOrderQuantity,
            maxOrderQuantity: item.maxOrderQuantity,
            allowQuantityOverride: a.allowQuantityOverride ?? item.allowQuantityOverride,
            isDefaultSelected: a.isDefaultSelected,
            displayOrder: a.displayOrder,
          });
        }
      }
    }

    // C. Food Package / Combo assignment
    if (a.foodPackage && a.foodPackage.isActive && !a.isExcluded) {
      availableCombos.push({
        assignmentId: a.id,
        foodPackageId: a.foodPackage.id,
        name: a.foodPackage.name,
        description: a.foodPackage.description,
        imageUrl: a.foodPackage.imageUrl,
        pricePerPerson: a.priceOverride ?? a.foodPackage.pricePerPerson,
        isPriceOverridden: a.priceOverride !== null,
        minPersons: a.minOrderOverride ?? a.foodPackage.minPersons,
        items: a.foodPackage.items.map((i) => ({
          foodItemId: i.foodItem.id,
          name: i.foodItem.name,
          dietaryLabels: i.foodItem.dietaryLabels,
        })),
        isDefaultSelected: a.isDefaultSelected,
        displayOrder: a.displayOrder,
      });
    }
  }

  // Group individual items by category
  const categoriesMap = new Map<string, { categoryName: string; categoryId: string; items: any[] }>();

  availableItemsMap.forEach((item) => {
    if (!categoriesMap.has(item.categoryId)) {
      categoriesMap.set(item.categoryId, {
        categoryName: item.category,
        categoryId: item.categoryId,
        items: [],
      });
    }
    categoriesMap.get(item.categoryId)!.items.push(item);
  });

  return {
    eventTypeId,
    eventTypeName: eventType.name,
    categories: Array.from(categoriesMap.values()),
    combos: availableCombos,
    totalAvailableItems: availableItemsMap.size,
    totalAvailableCombos: availableCombos.length,
  };
};

const assignFoodToEventType = async (
  eventTypeId: string,
  assignments: IAssignFoodToEventType[],
  adminId?: string
) => {
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });
  if (!eventType || eventType.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found!");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing food assignments for this event type to reset/sync cleanly
    await tx.eventTypeFood.deleteMany({ where: { eventTypeId } });

    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      await tx.eventTypeFood.create({
        data: {
          eventTypeId,
          foodCategoryId: a.foodCategoryId || null,
          foodItemId: a.foodItemId || null,
          foodPackageId: a.foodPackageId || null,
          isExcluded: a.isExcluded ?? false,
          isActive: a.isActive ?? true,
          displayOrder: a.displayOrder ?? i + 1,
          priceOverride: a.priceOverride !== undefined && a.priceOverride !== null ? toDecimal(a.priceOverride) : null,
          minOrderOverride: a.minOrderOverride ?? null,
          allowQuantityOverride: a.allowQuantityOverride ?? null,
          isDefaultSelected: a.isDefaultSelected ?? false,
        },
      });
    }

    return tx.eventTypeFood.findMany({
      where: { eventTypeId },
      include: {
        foodCategory: true,
        foodItem: true,
        foodPackage: true,
      },
      orderBy: { displayOrder: "asc" },
    });
  });

  await logAudit({
    actorId: adminId,
    action: "ASSIGN_FOOD_TO_EVENT_TYPE",
    entity: "EventTypeFood",
    entityId: eventTypeId,
    after: result,
  });

  return result;
};

const unassignFood = async (assignmentId: string, adminId?: string) => {
  const existing = await prisma.eventTypeFood.findUnique({
    where: { id: assignmentId },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Food assignment not found!");
  }

  await prisma.eventTypeFood.delete({ where: { id: assignmentId } });

  await logAudit({
    actorId: adminId,
    action: "UNASSIGN_FOOD_FROM_EVENT_TYPE",
    entity: "EventTypeFood",
    entityId: assignmentId,
    before: existing,
  });

  return { message: "Food assignment removed successfully!" };
};

export const FoodService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem,
  toggleActiveFoodItem,
  createFoodPackage,
  getAllFoodPackages,
  getFoodPackageById,
  updateFoodPackage,
  deleteFoodPackage,
  getFoodByEventType,
  assignFoodToEventType,
  unassignFood,
};
