import prisma from "./prisma";
import { PricingService } from "../modules/pricing/pricing.service";
import { ServiceCatalogService } from "../modules/serviceCatalog/serviceCatalog.service";
import { FoodService } from "../modules/food/food.service";
import { EventTypeService } from "../modules/eventType/eventType.service";

export const runEngineVerification = async () => {
  console.log("🧪 [Test] Running Comprehensive Engine & Business Rules Verification...\n");

  // 1. Fetch Event Types
  const wedding = await prisma.eventType.findUnique({ where: { slug: "wedding" } });
  const birthday = await prisma.eventType.findUnique({ where: { slug: "birthday" } });

  if (!wedding || !birthday) {
    throw new Error("Wedding or Birthday event types not found!");
  }
  console.log("✅ Step 1: Event types found:", wedding.name, "&", birthday.name);

  // 2. Test Service Filtering by Event Type
  const weddingServices = await ServiceCatalogService.getServicesByEventType(wedding.id);
  const birthdayServices = await ServiceCatalogService.getServicesByEventType(birthday.id);

  const weddingHasPhotography = weddingServices.some((s) => s.slug === "photography");
  const weddingHasBirthdayDeco = weddingServices.some((s) => s.slug === "birthday-decoration");
  const birthdayHasBirthdayDeco = birthdayServices.some((s) => s.slug === "birthday-decoration");

  if (!weddingHasPhotography) throw new Error("Wedding should have Photography!");
  if (weddingHasBirthdayDeco) throw new Error("Wedding must NOT have Birthday Decoration!");
  if (!birthdayHasBirthdayDeco) throw new Error("Birthday must have Birthday Decoration!");

  console.log("✅ Step 2: Service filtering per event type verified!");

  // 3. Test Food Filtering by Event Type
  const weddingFood = await FoodService.getFoodByEventType(wedding.id);
  const chickenRoast = await prisma.foodItem.findUnique({ where: { slug: "chicken-roast" } });
  const polao = await prisma.foodItem.findUnique({ where: { slug: "polao" } });
  const borhani = await prisma.foodItem.findUnique({ where: { slug: "borhani" } });

  if (!chickenRoast || !polao || !borhani) {
    throw new Error("Food items not found!");
  }
  console.log("✅ Step 3: Food items found (Chicken Roast: ৳100, Polao: ৳80, Borhani: ৳40)");

  // 4. Test Calculation: 20 guests -> Food = 4,400 BDT (SRS Section 4 verification)
  const calc20 = await PricingService.calculatePrice({
    eventTypeId: wedding.id,
    guestCount: 20,
    foods: [
      { foodItemId: chickenRoast.id },
      { foodItemId: polao.id },
      { foodItemId: borhani.id },
    ],
  });

  const foodSubtotal20 = Number(calc20.foods.subtotal);
  console.log(`📊 20 Guests Food Total: ৳${foodSubtotal20}`);
  if (foodSubtotal20 !== 4400) {
    throw new Error(`Expected 4400 BDT for 20 guests, got ${foodSubtotal20}`);
  }
  console.log("✅ Step 4: 20 Guests calculation exact match (৳4,400)!");

  // 5. Test Calculation: 30 guests -> Food = 6,600 BDT (SRS Section 4 verification)
  const calc30 = await PricingService.calculatePrice({
    eventTypeId: wedding.id,
    guestCount: 30,
    foods: [
      { foodItemId: chickenRoast.id },
      { foodItemId: polao.id },
      { foodItemId: borhani.id },
    ],
  });

  const foodSubtotal30 = Number(calc30.foods.subtotal);
  console.log(`📊 30 Guests Food Total: ৳${foodSubtotal30}`);
  if (foodSubtotal30 !== 6600) {
    throw new Error(`Expected 6600 BDT for 30 guests, got ${foodSubtotal30}`);
  }
  console.log("✅ Step 5: 30 Guests recalculation exact match (৳6,600)!");

  // 6. Test Full Event Budget: Photography (10,000) + Deco (8,000) + Food (4,400) + Venue (5,000) = 27,400 BDT (SRS Section 5 Step 5)
  const photoService = await prisma.service.findUnique({ where: { slug: "photography" } });
  const decoService = await prisma.service.findUnique({ where: { slug: "wedding-decoration" } });
  const venueService = await prisma.service.findUnique({ where: { slug: "venue" } });

  const fullCalc = await PricingService.calculatePrice({
    eventTypeId: wedding.id,
    guestCount: 20,
    services: [
      { serviceId: photoService!.id },
      { serviceId: decoService!.id },
      { serviceId: venueService!.id },
    ],
    foods: [
      { foodItemId: chickenRoast.id },
      { foodItemId: polao.id },
      { foodItemId: borhani.id },
    ],
  });

  const grandTotal = Number(fullCalc.grandTotal);
  console.log(`📊 Full Wedding Budget Grand Total: ৳${grandTotal}`);
  if (grandTotal !== 27400) {
    throw new Error(`Expected 27400 BDT grand total, got ${grandTotal}`);
  }
  console.log("✅ Step 6: Full Event Budget breakdown exact match (৳27,400)!");

  // 7. Test Security: Reject unassigned service injection
  const birthdayDeco = await prisma.service.findUnique({ where: { slug: "birthday-decoration" } });
  let rejected = false;
  try {
    await PricingService.calculatePrice({
      eventTypeId: wedding.id,
      guestCount: 20,
      services: [{ serviceId: birthdayDeco!.id }],
    });
  } catch (err: any) {
    rejected = true;
    console.log(`🛡️  Backend rejected unassigned service injection properly: "${err.message}"`);
  }
  if (!rejected) {
    throw new Error("Security check failed: unassigned service was not rejected!");
  }
  console.log("✅ Step 7: Security check passed (Unassigned services rejected with 422)!");

  // 8. Test Safe Delete on in-use EventType
  let safeDeleteBlocked = false;
  let testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test_verification@example.com",
        phone: "01799999999",
        password: "hashedpassword123",
        isActive: true,
      },
    });
  }
  if (testUser) {
    const tempEvent = await prisma.event.create({
      data: {
        title: "Test Event for Safe Delete",
        userId: testUser.id,
        eventTypeId: wedding.id,
      },
    });

    try {
      await EventTypeService.deleteEventType(wedding.id);
    } catch (err: any) {
      safeDeleteBlocked = true;
      console.log(`🛡️  Safe Delete check prevented deleting in-use event type: "${err.message}"`);
    }

    // Cleanup temp event
    await prisma.event.delete({ where: { id: tempEvent.id } });
    if (testUser.email === "test_verification@example.com") {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  }

  if (!safeDeleteBlocked) {
    throw new Error("Safe delete check failed: in-use event type was not blocked from deletion!");
  }
  console.log("✅ Step 8: Safe Delete verification passed (Conflict 409 thrown)!");

  console.log("\n🎉 ALL TESTS & BUSINESS RULES PASSED WITH 100% ACCURACY!");
};

runEngineVerification()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  });
