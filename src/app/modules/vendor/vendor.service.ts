import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const checkAvailability = async (dateStr: string, serviceIds?: string[]) => {
  if (!dateStr) {
    throw new AppError(httpStatus.BAD_REQUEST, "Date query parameter is required (YYYY-MM-DD)");
  }

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  // Find all service selections for active/confirmed events on this date
  const bookedSelections = await prisma.eventServiceSelection.findMany({
    where: {
      ...(serviceIds && serviceIds.length > 0 ? { serviceId: { in: serviceIds } } : {}),
      event: {
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: ["CONFIRMED", "IN_PROGRESS", "BOOKING_IN_PROGRESS"] },
        isActive: true,
      },
    },
    include: {
      service: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  const bookedServiceIds = Array.from(new Set(bookedSelections.map((s) => s.serviceId)));
  const conflicts = bookedSelections.map((s) => ({
    serviceId: s.serviceId,
    serviceName: s.service.name,
  }));

  return {
    date: targetDate.toISOString().slice(0, 10),
    available: bookedServiceIds.length === 0,
    bookedServiceIds,
    conflicts,
  };
};

export const VendorService = {
  checkAvailability,
};

