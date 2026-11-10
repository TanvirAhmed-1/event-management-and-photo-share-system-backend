import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { toDecimal, roundMoney } from "../../utils/money";
import {
  IPricingCalculationInput,
  IPriceBreakdown,
  IComputedServiceLine,
  IComputedFoodLine,
} from "./pricing.interface";

const calculatePrice = async (input: IPricingCalculationInput): Promise<IPriceBreakdown> => {
  const { eventTypeId, guestCount, services = [], foods = [] } = input;

  if (guestCount < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "Guest count must be at least 1");
  }

  // 1. Fetch EventType
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });

  if (!eventType || eventType.deletedAt || !eventType.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, "Event type not found or inactive!");
  }

  // 2. Fetch all active service assignments for this event type
  const eventTypeServices = await prisma.eventTypeService.findMany({
    where: {
      eventTypeId,
      isActive: true,
      service: { isActive: true, deletedAt: null },
    },
    include: {
      service: {
        include: {
          packages: { where: { isActive: true } },
        },
      },
    },
  });

  const serviceAssignmentMap = new Map<string, (typeof eventTypeServices)[0]>();
  eventTypeServices.forEach((ets) => {
    serviceAssignmentMap.set(ets.serviceId, ets);
  });

  // 3. Fetch all active food assignments for this event type
  const eventTypeFoods = await prisma.eventTypeFood.findMany({
    where: {
      eventTypeId,
      isActive: true,
    },
    include: {
      foodCategory: {
        include: {
          items: { where: { isActive: true, deletedAt: null } },
        },
      },
      foodItem: true,
      foodPackage: {
        include: {
          items: { include: { foodItem: true } },
        },
      },
    },
  });

  // Map allowed food items and packages
  const allowedFoodItems = new Map<string, { pricePerPerson: Prisma.Decimal; name: string; category?: string; allowOverride: boolean; minOrder: number; maxOrder?: number | null }>();
  const allowedFoodCombos = new Map<string, { pricePerPerson: Prisma.Decimal; name: string; minPersons: number }>();
  const excludedFoodItemIds = new Set<string>();

  eventTypeFoods.forEach((etf) => {
    if (etf.isExcluded && etf.foodItemId) {
      excludedFoodItemIds.add(etf.foodItemId);
    }
  });

  eventTypeFoods.forEach((etf) => {
    if (etf.foodItem && etf.foodItem.isActive && !etf.foodItem.deletedAt && !etf.isExcluded) {
      allowedFoodItems.set(etf.foodItem.id, {
        pricePerPerson: etf.priceOverride ?? etf.foodItem.pricePerPerson,
        name: etf.foodItem.name,
        allowOverride: etf.allowQuantityOverride ?? etf.foodItem.allowQuantityOverride,
        minOrder: etf.minOrderOverride ?? etf.foodItem.minOrderQuantity,
        maxOrder: etf.foodItem.maxOrderQuantity,
      });
    }

    if (etf.foodCategory && etf.foodCategory.isActive && !etf.isExcluded) {
      etf.foodCategory.items.forEach((item) => {
        if (!excludedFoodItemIds.has(item.id) && !allowedFoodItems.has(item.id)) {
          allowedFoodItems.set(item.id, {
            pricePerPerson: etf.priceOverride ?? item.pricePerPerson,
            name: item.name,
            category: etf.foodCategory?.name,
            allowOverride: etf.allowQuantityOverride ?? item.allowQuantityOverride,
            minOrder: etf.minOrderOverride ?? item.minOrderQuantity,
            maxOrder: item.maxOrderQuantity,
          });
        }
      });
    }

    if (etf.foodPackage && etf.foodPackage.isActive && !etf.isExcluded) {
      allowedFoodCombos.set(etf.foodPackage.id, {
        pricePerPerson: etf.priceOverride ?? etf.foodPackage.pricePerPerson,
        name: etf.foodPackage.name,
        minPersons: etf.minOrderOverride ?? etf.foodPackage.minPersons,
      });
    }
  });

  // ==========================================
  // 4. Calculate Services
  // ==========================================
  const computedServices: IComputedServiceLine[] = [];
  let servicesSubtotal = new Prisma.Decimal(0);
  let pendingQuotationsCount = 0;

  for (const s of services) {
    const assignment = serviceAssignmentMap.get(s.serviceId);
    if (!assignment) {
      throw new AppError(
        httpStatus.UNPROCESSABLE_ENTITY,
        `Service with ID '${s.serviceId}' is not assigned or not active for event type '${eventType.name}'!`
      );
    }

    const service = assignment.service;
    let selectedPackage = null;

    if (s.packageId) {
      selectedPackage = service.packages.find((p) => p.id === s.packageId);
      if (!selectedPackage) {
        throw new AppError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Package '${s.packageId}' not found or inactive for service '${service.name}'!`
        );
      }
    }

    const effectivePricingModel = selectedPackage ? selectedPackage.pricingModel : service.pricingModel;
    const effectiveBasePrice = selectedPackage
      ? (selectedPackage.price ? toDecimal(selectedPackage.price) : new Prisma.Decimal(0))
      : (assignment.priceOverride ? toDecimal(assignment.priceOverride) : (service.basePrice ? toDecimal(service.basePrice) : new Prisma.Decimal(0)));

    let lineTotal = new Prisma.Decimal(0);
    const qty = s.quantity ?? assignment.defaultQuantity ?? 1;
    const hours = s.hours ?? 1;
    const days = s.days ?? 1;
    let isQuotationRequired = false;

    // Pricing Model Calculation
    switch (effectivePricingModel) {
      case "FIXED":
        lineTotal = effectiveBasePrice.mul(qty);
        break;
      case "PER_PERSON":
        lineTotal = effectiveBasePrice.mul(guestCount);
        break;
      case "PER_HOUR":
        lineTotal = effectiveBasePrice.mul(hours);
        break;
      case "PER_DAY":
        lineTotal = effectiveBasePrice.mul(days);
        break;
      case "PER_UNIT":
        lineTotal = effectiveBasePrice.mul(qty);
        break;
      case "CUSTOM_QUOTATION":
        isQuotationRequired = true;
        lineTotal = new Prisma.Decimal(0); // Quoted by vendor/admin later
        pendingQuotationsCount++;
        break;
    }

    // AI Photo Share add-on
    let hasAiAddon = false;
    let addonPriceDecimal = new Prisma.Decimal(0);

    if (service.aiPhotoShareMode === "ADDON" && s.includeAiAddon && service.aiAddonPrice) {
      hasAiAddon = true;
      addonPriceDecimal = toDecimal(service.aiAddonPrice);
      lineTotal = lineTotal.add(addonPriceDecimal);
    } else if (service.aiPhotoShareMode === "INCLUDED") {
      hasAiAddon = true;
    }

    lineTotal = roundMoney(lineTotal);
    servicesSubtotal = servicesSubtotal.add(lineTotal);

    computedServices.push({
      serviceId: service.id,
      serviceName: service.name,
      packageId: selectedPackage?.id,
      packageName: selectedPackage?.name,
      pricingModel: effectivePricingModel,
      unitPrice: effectiveBasePrice.toFixed(2),
      quantity: qty,
      hours: effectivePricingModel === "PER_HOUR" ? hours : undefined,
      days: effectivePricingModel === "PER_DAY" ? days : undefined,
      hasAiAddon,
      aiAddonPrice: hasAiAddon && addonPriceDecimal.gt(0) ? addonPriceDecimal.toFixed(2) : undefined,
      lineTotal: lineTotal.toFixed(2),
      isQuotationRequired,
    });
  }

  // ==========================================
  // 5. Calculate Food
  // ==========================================
  const computedFoods: IComputedFoodLine[] = [];
  let foodsSubtotal = new Prisma.Decimal(0);

  for (const f of foods) {
    if (f.foodItemId) {
      const item = allowedFoodItems.get(f.foodItemId);
      if (!item) {
        throw new AppError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Food item '${f.foodItemId}' is not available for event type '${eventType.name}'!`
        );
      }

      const isQuantityOverridden = Boolean(f.quantity && f.quantity !== guestCount);
      if (isQuantityOverridden && !item.allowOverride) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Custom quantity is not allowed for food item '${item.name}'. It must match event guest count (${guestCount}).`
        );
      }

      const effectiveQty = isQuantityOverridden && f.quantity ? f.quantity : guestCount;

      if (effectiveQty < item.minOrder) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Minimum order quantity for '${item.name}' is ${item.minOrder} persons.`
        );
      }

      if (item.maxOrder && effectiveQty > item.maxOrder) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Maximum order quantity for '${item.name}' is ${item.maxOrder} persons.`
        );
      }

      const lineTotal = roundMoney(item.pricePerPerson.mul(effectiveQty));
      foodsSubtotal = foodsSubtotal.add(lineTotal);

      computedFoods.push({
        foodItemId: f.foodItemId,
        name: item.name,
        category: item.category,
        pricePerPerson: item.pricePerPerson.toFixed(2),
        quantity: effectiveQty,
        isQuantityOverridden,
        lineTotal: lineTotal.toFixed(2),
      });
    } else if (f.foodPackageId) {
      const combo = allowedFoodCombos.get(f.foodPackageId);
      if (!combo) {
        throw new AppError(
          httpStatus.UNPROCESSABLE_ENTITY,
          `Food combo '${f.foodPackageId}' is not available for event type '${eventType.name}'!`
        );
      }

      const effectiveQty = f.quantity ?? guestCount;
      if (effectiveQty < combo.minPersons) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Minimum guest count for combo '${combo.name}' is ${combo.minPersons} persons.`
        );
      }

      const lineTotal = roundMoney(combo.pricePerPerson.mul(effectiveQty));
      foodsSubtotal = foodsSubtotal.add(lineTotal);

      computedFoods.push({
        foodPackageId: f.foodPackageId,
        name: combo.name,
        pricePerPerson: combo.pricePerPerson.toFixed(2),
        quantity: effectiveQty,
        isQuantityOverridden: Boolean(f.quantity && f.quantity !== guestCount),
        lineTotal: lineTotal.toFixed(2),
      });
    }
  }

  // ==========================================
  // 6. Charges & Taxes
  // ==========================================
  const subtotalBeforeCharges = servicesSubtotal.add(foodsSubtotal);

  // Fetch charge rules (active for this event type or global)
  const chargeRules = await prisma.chargeRule.findMany({
    where: {
      isActive: true,
      OR: [{ eventTypeId }, { eventTypeId: null }],
    },
  });

  let totalCharges = new Prisma.Decimal(0);
  const computedCharges = chargeRules.map((rule) => {
    let chargeAmount = new Prisma.Decimal(0);
    if (rule.valueType === "PERCENT") {
      chargeAmount = roundMoney(subtotalBeforeCharges.mul(rule.value).div(100));
    } else {
      chargeAmount = roundMoney(toDecimal(rule.value));
    }
    totalCharges = totalCharges.add(chargeAmount);
    return {
      name: rule.name,
      valueType: rule.valueType,
      amount: chargeAmount.toFixed(2),
    };
  });

  const subtotalWithCharges = subtotalBeforeCharges.add(totalCharges);

  // Fetch tax rules
  const taxRules = await prisma.taxRule.findMany({
    where: {
      isActive: true,
      OR: [{ eventTypeId }, { eventTypeId: null }],
    },
  });

  let totalTax = new Prisma.Decimal(0);
  const computedTaxes = taxRules.map((tax) => {
    const taxAmount = roundMoney(subtotalWithCharges.mul(tax.ratePercent).div(100));
    totalTax = totalTax.add(taxAmount);
    return {
      name: tax.name,
      ratePercent: `${tax.ratePercent}%`,
      amount: taxAmount.toFixed(2),
    };
  });

  const discountDecimal = new Prisma.Decimal(0);
  const grandTotal = roundMoney(subtotalWithCharges.add(totalTax).sub(discountDecimal));

  return {
    currency: "BDT",
    guestCount,
    services: {
      items: computedServices,
      subtotal: servicesSubtotal.toFixed(2),
      pendingQuotationsCount,
    },
    foods: {
      items: computedFoods,
      subtotal: foodsSubtotal.toFixed(2),
    },
    subtotal: subtotalBeforeCharges.toFixed(2),
    charges: computedCharges,
    totalCharges: totalCharges.toFixed(2),
    discount: discountDecimal.toFixed(2),
    taxes: computedTaxes,
    totalTax: totalTax.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
  };
};

export const PricingService = {
  calculatePrice,
};

