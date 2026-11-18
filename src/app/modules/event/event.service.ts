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
import { SettingsService } from "../settings/settings.service";

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

  // Enforce Event Date Capacity & Same-Date Request Policy
  let dateConflictWarning = false;
  if (payload.eventDate) {
    const parsedDate = new Date(payload.eventDate);
    if (!isNaN(parsedDate.getTime())) {
      const dateStr = parsedDate.toISOString().split("T")[0];
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

      const settings = await SettingsService.getPlatformSettings();
      const existingOnDate = await prisma.event.count({
        where: {
          eventDate: { gte: dayStart, lte: dayEnd },
          status: { notIn: ["CANCELLED", "ARCHIVED"] },
          isActive: true,
        },
      });

      if (existingOnDate >= settings.maxEventsPerDay) {
        if (!settings.allowSameDateRequests) {
          throw new AppError(
            httpStatus.CONFLICT,
            `Date ${dateStr} is already full (Max ${settings.maxEventsPerDay} event(s)/day). Please choose another date.`
          );
        }
        dateConflictWarning = true;
      }
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

  return { ...result, dateConflictWarning };
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

const getDateAvailabilitySummary = async () => {
  const settings = await SettingsService.getPlatformSettings();
  const events = await prisma.event.findMany({
    where: {
      eventDate: { not: null },
      status: { notIn: ["CANCELLED", "ARCHIVED"] },
      isActive: true,
    },
    select: {
      id: true,
      eventDate: true,
      status: true,
    },
  });

  const dates: Record<
    string,
    { total: number; confirmed: number; pending: number; isFull: boolean }
  > = {};

  for (const ev of events) {
    if (!ev.eventDate) continue;
    const dateStr = ev.eventDate.toISOString().split("T")[0];
    if (!dates[dateStr]) {
      dates[dateStr] = { total: 0, confirmed: 0, pending: 0, isFull: false };
    }
    dates[dateStr].total += 1;
    if (ev.status === "CONFIRMED" || ev.status === "IN_PROGRESS" || ev.status === "COMPLETED") {
      dates[dateStr].confirmed += 1;
    } else {
      dates[dateStr].pending += 1;
    }
    dates[dateStr].isFull = dates[dateStr].total >= settings.maxEventsPerDay;
  }

  return { settings, dates };
};

const updateEventStatusAdmin = async (
  eventId: string,
  status: "CONFIRMED" | "CANCELLED" | "PLANNING" | "DRAFT",
  allowMultipleOverride = false
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, "Event not found!");
  }

  if (status === "CONFIRMED" && event.eventDate) {
    const settings = await SettingsService.getPlatformSettings();
    const dateStr = event.eventDate.toISOString().split("T")[0];
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const confirmedCount = await prisma.event.count({
      where: {
        id: { not: eventId },
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        isActive: true,
      },
    });

    if (confirmedCount >= settings.maxEventsPerDay && !allowMultipleOverride) {
      throw new AppError(
        httpStatus.CONFLICT,
        `SAME_DATE_CONFLICT: ${confirmedCount} event(s) already confirmed on ${dateStr} (Daily limit: ${settings.maxEventsPerDay}). Review and approve override to grant multiple-event access.`
      );
    }
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status },
    include: { eventType: true, user: { select: { name: true, email: true, phone: true } } },
  });

  return updated;
};

const customCreateEvent = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const eventType = await prisma.eventType.findUnique({
    where: { id: payload.eventTypeId },
  });
  if (!eventType || eventType.deletedAt || !eventType.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Selected event type is invalid or inactive!");
  }

  const targetDate = new Date(payload.eventDate);
  if (isNaN(targetDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid event date format!");
  }

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const requestedServiceIds = (payload.services || []).map((s: any) => s.serviceId);

  // 1. Date Availability Check
  if (requestedServiceIds.length > 0) {
    const conflicts = await prisma.eventServiceSelection.findMany({
      where: {
        serviceId: { in: requestedServiceIds },
        event: {
          eventDate: { gte: dayStart, lte: dayEnd },
          status: { in: ["CONFIRMED", "IN_PROGRESS", "BOOKING_IN_PROGRESS"] },
          isActive: true,
        },
      },
      include: { service: true },
    });

    if (conflicts.length > 0) {
      const conflictNames = conflicts.map((c) => c.service.name).join(", ");
      throw new AppError(
        httpStatus.CONFLICT,
        `Date conflict: ${conflictNames} already booked on ${targetDate.toISOString().slice(0, 10)}. Please choose another date or service.`
      );
    }
  }

  // 2. Fetch Services & Food Items securely from DB
  const dbServices = requestedServiceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: requestedServiceIds }, isActive: true, deletedAt: null },
      })
    : [];
  const serviceMap = new Map(dbServices.map((s) => [s.id, s]));

  const requestedFoodIds = (payload.foods || []).map((f: any) => f.foodItemId);
  const dbFoods = requestedFoodIds.length
    ? await prisma.foodItem.findMany({
        where: { id: { in: requestedFoodIds }, isActive: true, deletedAt: null },
      })
    : [];
  const foodMap = new Map(dbFoods.map((f) => [f.id, f]));

  const guestCount = Number(payload.guestCount) || 100;
  let servicesTotal = 0;
  let foodTotal = 0;

  const serviceLines = (payload.services || [])
    .map((reqSvc: any) => {
      const svc = serviceMap.get(reqSvc.serviceId);
      if (!svc) return null;
      const base = Number(svc.basePrice);
      const qty = Number(reqSvc.quantity) || 1;
      let lineTotal = base * qty;
      if (svc.pricingModel === "PER_PERSON") lineTotal = base * guestCount * qty;
      else if (svc.pricingModel === "PER_HOUR") lineTotal = base * (Number(reqSvc.hours) || 4) * qty;
      else if (svc.pricingModel === "PER_DAY") lineTotal = base * (Number(reqSvc.days) || 1) * qty;
      servicesTotal += lineTotal;
      return {
        serviceId: svc.id,
        quantity: qty,
        hours: reqSvc.hours || null,
        days: reqSvc.days || null,
        includeAiAddon: !!reqSvc.includeAiAddon,
        notes: reqSvc.notes || null,
        pricingModelSnapshot: svc.pricingModel,
        unitPriceSnapshot: svc.basePrice,
        lineTotalSnapshot: lineTotal,
        nameSnapshot: svc.name,
      };
    })
    .filter(Boolean);

  const foodLines = (payload.foods || [])
    .map((reqFood: any) => {
      const item = foodMap.get(reqFood.foodItemId);
      if (!item) return null;
      const unitPrice = Number(item.pricePerPerson);
      const qty = Number(reqFood.quantity) || guestCount;
      const lineTotal = unitPrice * qty;
      foodTotal += lineTotal;
      return {
        foodItemId: item.id,
        quantity: qty,
        isQuantityOverridden: !!reqFood.quantity,
        unitPriceSnapshot: item.pricePerPerson,
        quantitySnapshot: qty,
        lineTotalSnapshot: lineTotal,
        nameSnapshot: item.name,
      };
    })
    .filter(Boolean);

  const subtotal = servicesTotal + foodTotal;
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% VAT
  const grandTotal = subtotal + tax;
  const advancePaid = payload.payAdvance ? Math.round(grandTotal * 0.2 * 100) / 100 : 0;

  const eventNo = `EVT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const fullVenue = [payload.venue, payload.area, payload.city].filter(Boolean).join(", ");
  const eventTitle = payload.title?.trim() || `${eventType.name} — ${payload.city}`;

  const created = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        title: eventTitle,
        coverImage: eventType.imageUrl || null,
        userId,
        eventTypeId: eventType.id,
        eventNo,
        status: "CONFIRMED",
        wizardStep: 4,
        eventDate: targetDate,
        eventTime: payload.eventTime || "Evening (6:00 PM - 11:00 PM)",
        venue: fullVenue,
        guestCount,
        additionalRequirements: payload.additionalRequirements || null,
        confirmedAt: new Date(),
        customFieldValues: {
          city: payload.city,
          area: payload.area || "",
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail || user.email,
          paymentMethod: payload.paymentMethod || "BKASH",
        },
        serviceSelections: {
          create: serviceLines as any,
        },
        foodSelections: {
          create: foodLines as any,
        },
        budget: {
          create: {
            subtotal,
            tax,
            grandTotal,
            paid: advancePaid,
          },
        },
      },
      include: {
        eventType: true,
        serviceSelections: true,
        foodSelections: true,
        budget: true,
      },
    });

    return ev;
  });

  return {
    bookingId: created.eventNo,
    event: created,
    invoice: {
      bookingId: created.eventNo,
      eventTitle: created.title,
      eventDate: created.eventDate,
      eventTime: created.eventTime,
      venue: created.venue,
      guestCount,
      servicesTotal,
      foodTotal,
      subtotal,
      vat: tax,
      grandTotal,
      advancePaid,
      dueAmount: grandTotal - advancePaid,
      paymentMethod: payload.paymentMethod || "BKASH",
      status: created.status,
    },
  };
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
  getDateAvailabilitySummary,
  updateEventStatusAdmin,
  customCreateEvent,
};
