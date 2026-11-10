import prisma from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import crypto from "crypto";
import {
  ICreateEventRequest,
  IUpdateEventDetailsRequest,
  ISelectServicesRequest,
  ISelectFoodRequest,
  IConfirmEventRequest,
} from "./event.interface";
import { PricingService } from "../pricing/pricing.service";
import { toDecimal, roundMoney } from "../../utils/money";

// ==========================================
// 1. Create and List Events
// ==========================================

const createEvent = async (userId: string, payload: ICreateEventRequest) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.isActive) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Please activate your plan and contact admin. Phone: 01786924911"
    );
  }

  if (user.packageExpiredAt && new Date() > user.packageExpiredAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your subscription package has expired! Please upgrade or renew your package to create new events."
    );
  }

  // Validate eventTypeId if provided
  if (payload.eventTypeId) {
    const eventType = await prisma.eventType.findUnique({
      where: { id: payload.eventTypeId },
    });
    if (!eventType || eventType.deletedAt || !eventType.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, "Selected event type is invalid or inactive!");
    }
  }

  const result = await prisma.event.create({
    data: {
      title: payload.title,
      coverImage: payload.coverImage || null,
      userId,
      eventTypeId: payload.eventTypeId || null,
      eventDate: payload.eventDate ? new Date(payload.eventDate) : null,
      eventTime: payload.eventTime || null,
      venue: payload.venue || null,
      guestCount: payload.guestCount ?? null,
      description: payload.description || null,
      additionalRequirements: payload.additionalRequirements || null,
      customFieldValues: payload.customFieldValues ? payload.customFieldValues : undefined,
      wizardStep: payload.eventTypeId ? 2 : 1,
    },
    include: {
      eventType: true,
    },
  });

  return result;
};

const getAllEvents = async (userId: string, isSuperAdmin = false) => {
  const result = await prisma.event.findMany({
    where: isSuperAdmin ? {} : { userId },
    include: {
      eventType: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      budget: true,
      _count: {
        select: {
          photos: true,
          serviceSelections: true,
          foodSelections: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const getEventById = async (userId: string, eventId: string, isSuperAdmin = false) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventType: {
        include: {
          fields: { orderBy: { displayOrder: "asc" } },
        },
      },
      serviceSelections: {
        include: {
          service: {
            include: { category: true },
          },
        },
      },
      foodSelections: {
        include: {
          foodItem: {
            include: { category: true },
          },
          foodPackage: {
            include: {
              items: { include: { foodItem: true } },
            },
          },
        },
      },
      budget: true,
      priceSnapshots: {
        orderBy: { version: "desc" },
        take: 1,
      },
      photos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (!isSuperAdmin && event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access! You cannot access this event.");
  }

  return event;
};

// ==========================================
// 2. Wizard & Selections
// ==========================================

const updateEventDetails = async (
  userId: string,
  eventId: string,
  payload: IUpdateEventDetailsRequest
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access! You cannot modify this event.");
  }

  if (payload.eventTypeId && payload.eventTypeId !== event.eventTypeId) {
    const eventType = await prisma.eventType.findUnique({
      where: { id: payload.eventTypeId },
    });
    if (!eventType || eventType.deletedAt || !eventType.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, "Selected event type is invalid or inactive!");
    }
  }

  const result = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: payload.title ?? event.title,
      coverImage: payload.coverImage !== undefined ? payload.coverImage : event.coverImage,
      eventTypeId: payload.eventTypeId ?? event.eventTypeId,
      eventDate: payload.eventDate ? new Date(payload.eventDate) : event.eventDate,
      eventTime: payload.eventTime !== undefined ? payload.eventTime : event.eventTime,
      venue: payload.venue !== undefined ? payload.venue : event.venue,
      guestCount: payload.guestCount !== undefined ? payload.guestCount : event.guestCount,
      description: payload.description !== undefined ? payload.description : event.description,
      additionalRequirements: payload.additionalRequirements !== undefined ? payload.additionalRequirements : event.additionalRequirements,
      customFieldValues: payload.customFieldValues !== undefined ? payload.customFieldValues : (event.customFieldValues as any),
      repriceOnGuestChange: payload.repriceOnGuestChange ?? event.repriceOnGuestChange,
      status: payload.status ?? event.status,
    },
    include: {
      eventType: true,
    },
  });

  return result;
};

const selectServices = async (userId: string, eventId: string, payload: ISelectServicesRequest) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access!");
  }

  if (!event.eventTypeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Event must have an eventTypeId before selecting services.");
  }

  // Pre-validate via pricing service simulation
  await PricingService.calculatePrice({
    eventTypeId: event.eventTypeId,
    guestCount: event.guestCount || 1,
    services: payload.services,
    foods: [],
  });

  const result = await prisma.$transaction(async (tx) => {
    // Delete old selections
    await tx.eventServiceSelection.deleteMany({ where: { eventId } });

    // Insert new selections
    await tx.eventServiceSelection.createMany({
      data: payload.services.map((s) => ({
        eventId,
        serviceId: s.serviceId,
        packageId: s.packageId || null,
        vendorId: s.vendorId || null,
        quantity: s.quantity ?? 1,
        hours: s.hours ?? null,
        days: s.days ?? null,
        includeAiAddon: s.includeAiAddon ?? false,
        notes: s.notes || null,
        status: "SELECTED",
      })),
    });

    await tx.event.update({
      where: { id: eventId },
      data: { wizardStep: Math.max(event.wizardStep, 4) },
    });

    return tx.eventServiceSelection.findMany({
      where: { eventId },
      include: { service: true },
    });
  });

  return result;
};

const selectFood = async (userId: string, eventId: string, payload: ISelectFoodRequest) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access!");
  }

  if (!event.eventTypeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Event must have an eventTypeId before selecting food menu.");
  }

  // Pre-validate via pricing service simulation
  await PricingService.calculatePrice({
    eventTypeId: event.eventTypeId,
    guestCount: event.guestCount || 1,
    services: [],
    foods: payload.foods,
  });

  const result = await prisma.$transaction(async (tx) => {
    // Delete old selections
    await tx.eventFoodSelection.deleteMany({ where: { eventId } });

    // Insert new selections
    await tx.eventFoodSelection.createMany({
      data: payload.foods.map((f) => ({
        eventId,
        foodItemId: f.foodItemId || null,
        foodPackageId: f.foodPackageId || null,
        quantity: f.quantity ?? null,
        isQuantityOverridden: Boolean(f.quantity && f.quantity !== event.guestCount),
      })),
    });

    await tx.event.update({
      where: { id: eventId },
      data: { wizardStep: Math.max(event.wizardStep, 5) },
    });

    return tx.eventFoodSelection.findMany({
      where: { eventId },
      include: { foodItem: true, foodPackage: true },
    });
  });

  return result;
};

const previewEventBudget = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      serviceSelections: true,
      foodSelections: true,
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access!");
  }

  if (!event.eventTypeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Event must have an eventTypeId to calculate budget.");
  }

  const breakdown = await PricingService.calculatePrice({
    eventTypeId: event.eventTypeId,
    guestCount: event.guestCount || 1,
    services: event.serviceSelections.map((s) => ({
      serviceId: s.serviceId,
      packageId: s.packageId || undefined,
      quantity: s.quantity,
      hours: s.hours || undefined,
      days: s.days || undefined,
      includeAiAddon: s.includeAiAddon,
    })),
    foods: event.foodSelections.map((f) => ({
      foodItemId: f.foodItemId || undefined,
      foodPackageId: f.foodPackageId || undefined,
      quantity: f.quantity || undefined,
    })),
  });

  return breakdown;
};

const confirmEvent = async (userId: string, eventId: string, payload: IConfirmEventRequest) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      serviceSelections: { include: { service: true } },
      foodSelections: { include: { foodItem: true, foodPackage: true } },
      priceSnapshots: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access!");
  }

  if (!event.eventTypeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Event must have an eventTypeId before confirmation.");
  }

  // 1. Calculate live pricing from backend pricing engine
  const breakdown = await PricingService.calculatePrice({
    eventTypeId: event.eventTypeId,
    guestCount: event.guestCount || 1,
    services: event.serviceSelections.map((s) => ({
      serviceId: s.serviceId,
      packageId: s.packageId || undefined,
      quantity: s.quantity,
      hours: s.hours || undefined,
      days: s.days || undefined,
      includeAiAddon: s.includeAiAddon,
    })),
    foods: event.foodSelections.map((f) => ({
      foodItemId: f.foodItemId || undefined,
      foodPackageId: f.foodPackageId || undefined,
      quantity: f.quantity || undefined,
    })),
  });

  // 2. Validate price match if expectedGrandTotal was sent by frontend
  if (payload.expectedGrandTotal !== undefined && payload.expectedGrandTotal !== null) {
    const expected = roundMoney(payload.expectedGrandTotal);
    const calculated = roundMoney(breakdown.grandTotal);
    if (!expected.equals(calculated)) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Price mismatch! Prices have changed. Expected: ৳${expected.toFixed(2)}, Actual: ৳${calculated.toFixed(2)}. Please review updated budget.`
      );
    }
  }

  // 3. Perform confirmation transaction
  const result = await prisma.$transaction(async (tx) => {
    // Generate event number if not set
    let eventNo = event.eventNo;
    if (!eventNo) {
      const year = new Date().getFullYear();
      const count = await tx.event.count();
      const seq = String(count + 1).padStart(6, "0");
      eventNo = `EVT-${year}-${seq}`;
    }

    const nextVersion = (event.priceSnapshots[0]?.version || 0) + 1;
    const inputHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(breakdown))
      .digest("hex");

    // Create immutable PriceSnapshot
    const snapshot = await tx.priceSnapshot.create({
      data: {
        eventId,
        version: nextVersion,
        breakdown: breakdown as any,
        inputHash,
        grandTotal: toDecimal(breakdown.grandTotal),
        reason: "Initial Event Confirmation",
        createdById: userId,
      },
    });

    // Upsert EventBudget
    await tx.eventBudget.upsert({
      where: { eventId },
      create: {
        eventId,
        subtotal: toDecimal(breakdown.subtotal),
        charges: toDecimal(breakdown.totalCharges),
        tax: toDecimal(breakdown.totalTax),
        discount: toDecimal(breakdown.discount),
        grandTotal: toDecimal(breakdown.grandTotal),
        currentSnapshotId: snapshot.id,
      },
      update: {
        subtotal: toDecimal(breakdown.subtotal),
        charges: toDecimal(breakdown.totalCharges),
        tax: toDecimal(breakdown.totalTax),
        discount: toDecimal(breakdown.discount),
        grandTotal: toDecimal(breakdown.grandTotal),
        currentSnapshotId: snapshot.id,
      },
    });

    // Populate snapshots on individual service selections
    for (const serviceLine of breakdown.services.items) {
      await tx.eventServiceSelection.updateMany({
        where: { eventId, serviceId: serviceLine.serviceId },
        data: {
          pricingModelSnapshot: serviceLine.pricingModel,
          unitPriceSnapshot: toDecimal(serviceLine.unitPrice),
          lineTotalSnapshot: toDecimal(serviceLine.lineTotal),
          nameSnapshot: serviceLine.serviceName,
          status: "CONFIRMED",
        },
      });
    }

    // Populate snapshots on individual food selections
    for (const foodLine of breakdown.foods.items) {
      if (foodLine.foodItemId) {
        await tx.eventFoodSelection.updateMany({
          where: { eventId, foodItemId: foodLine.foodItemId },
          data: {
            unitPriceSnapshot: toDecimal(foodLine.pricePerPerson),
            quantitySnapshot: foodLine.quantity,
            lineTotalSnapshot: toDecimal(foodLine.lineTotal),
            nameSnapshot: foodLine.name,
          },
        });
      } else if (foodLine.foodPackageId) {
        await tx.eventFoodSelection.updateMany({
          where: { eventId, foodPackageId: foodLine.foodPackageId },
          data: {
            unitPriceSnapshot: toDecimal(foodLine.pricePerPerson),
            quantitySnapshot: foodLine.quantity,
            lineTotalSnapshot: toDecimal(foodLine.lineTotal),
            nameSnapshot: foodLine.name,
          },
        });
      }
    }

    // Update Event Status
    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        eventNo,
        status: "CONFIRMED",
        wizardStep: 6,
        confirmedAt: new Date(),
      },
      include: {
        eventType: true,
        budget: true,
        serviceSelections: true,
        foodSelections: true,
      },
    });

    return {
      event: updatedEvent,
      priceSnapshot: snapshot,
      breakdown,
    };
  });

  return result;
};

const updateGuestCount = async (userId: string, eventId: string, newGuestCount: number) => {
  if (newGuestCount < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "Guest count must be at least 1");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      serviceSelections: true,
      foodSelections: true,
      priceSnapshots: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access!");
  }

  // Update guest count and automatically synchronize non-overridden food quantities
  const result = await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: { guestCount: newGuestCount },
    });

    // Auto-update food items where isQuantityOverridden is false
    await tx.eventFoodSelection.updateMany({
      where: {
        eventId,
        isQuantityOverridden: false,
      },
      data: {
        quantity: null, // null follows event guestCount
      },
    });

    // If event was already confirmed, recalculate and update budget
    if (event.status === "CONFIRMED" && event.eventTypeId) {
      const breakdown = await PricingService.calculatePrice({
        eventTypeId: event.eventTypeId,
        guestCount: newGuestCount,
        services: event.serviceSelections.map((s) => ({
          serviceId: s.serviceId,
          packageId: s.packageId || undefined,
          quantity: s.quantity,
          hours: s.hours || undefined,
          days: s.days || undefined,
          includeAiAddon: s.includeAiAddon,
        })),
        foods: event.foodSelections.map((f) => ({
          foodItemId: f.foodItemId || undefined,
          foodPackageId: f.foodPackageId || undefined,
          quantity: f.isQuantityOverridden ? (f.quantity || undefined) : undefined,
        })),
      });

      const nextVersion = (event.priceSnapshots[0]?.version || 0) + 1;
      const snapshot = await tx.priceSnapshot.create({
        data: {
          eventId,
          version: nextVersion,
          breakdown: breakdown as any,
          inputHash: crypto.createHash("sha256").update(JSON.stringify(breakdown)).digest("hex"),
          grandTotal: toDecimal(breakdown.grandTotal),
          reason: `Guest count updated from ${event.guestCount || 0} to ${newGuestCount}`,
          createdById: userId,
        },
      });

      await tx.eventBudget.upsert({
        where: { eventId },
        create: {
          eventId,
          subtotal: toDecimal(breakdown.subtotal),
          charges: toDecimal(breakdown.totalCharges),
          tax: toDecimal(breakdown.totalTax),
          discount: toDecimal(breakdown.discount),
          grandTotal: toDecimal(breakdown.grandTotal),
          currentSnapshotId: snapshot.id,
        },
        update: {
          subtotal: toDecimal(breakdown.subtotal),
          charges: toDecimal(breakdown.totalCharges),
          tax: toDecimal(breakdown.totalTax),
          discount: toDecimal(breakdown.discount),
          grandTotal: toDecimal(breakdown.grandTotal),
          currentSnapshotId: snapshot.id,
        },
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: {
        budget: true,
        foodSelections: true,
      },
    });
  });

  return result;
};

// ==========================================
// 3. Delete and Admin Toggle
// ==========================================

const deleteEvent = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      photos: true,
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (event.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized Access! You cannot delete this event.");
  }

  const photos = event.photos;
  const photoIds = photos.map((p) => p.id);
  const totalSizeDeleted = photos.reduce((acc, p) => acc + p.sizeMB, 0);

  // 1. Delete images from Cloudinary
  for (const photo of photos) {
    try {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    } catch (err) {
      console.error(`Failed to delete photo ${photo.publicId} from Cloudinary:`, err);
    }
  }

  // 2. Perform DB deletions in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete face embeddings for all event photos
    if (photoIds.length > 0) {
      await tx.faceEmbedding.deleteMany({
        where: { photoId: { in: photoIds } },
      });

      await tx.photo.deleteMany({
        where: { eventId },
      });
    }

    // Delete dynamic engine children
    await tx.priceSnapshot.deleteMany({ where: { eventId } });
    await tx.eventBudget.deleteMany({ where: { eventId } });
    await tx.eventServiceSelection.deleteMany({ where: { eventId } });
    await tx.eventFoodSelection.deleteMany({ where: { eventId } });

    // Delete event from DB
    await tx.event.delete({
      where: { id: eventId },
    });

    // Update user used storage
    if (totalSizeDeleted > 0) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        const newUsedStorage = Math.max(0, user.usedStorageMB - totalSizeDeleted);
        await tx.user.update({
          where: { id: userId },
          data: { usedStorageMB: newUsedStorage },
        });
      }
    }
  });

  return { message: "Event and all associated records deleted successfully!" };
};

const toggleEventActiveAdmin = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  const result = await prisma.event.update({
    where: { id: eventId },
    data: {
      isActive: !event.isActive,
    },
  });
  return result;
};

export const EventService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventDetails,
  selectServices,
  selectFood,
  previewEventBudget,
  confirmEvent,
  updateGuestCount,
  deleteEvent,
  toggleEventActiveAdmin,
};
