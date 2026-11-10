import prisma from "./prisma";
import { toDecimal } from "./money";

export const seedDynamicEngine = async () => {
  console.log("🌱 [Seed] Checking and seeding dynamic event engine data...");

  // 1. Seed Event Types
  const eventTypesData = [
    {
      name: "Wedding",
      slug: "wedding",
      description: "Grand wedding celebrations, receptions, and ceremonies.",
      minGuests: 50,
      maxGuests: 2000,
      defaultGuests: 200,
      displayOrder: 1,
    },
    {
      name: "Birthday",
      slug: "birthday",
      description: "Fun birthday parties for kids, teens, and adults.",
      minGuests: 10,
      maxGuests: 300,
      defaultGuests: 30,
      displayOrder: 2,
    },
    {
      name: "Get Together",
      slug: "get-together",
      description: "Informal reunions, friend meetups, and family gatherings.",
      minGuests: 5,
      maxGuests: 200,
      defaultGuests: 20,
      displayOrder: 3,
    },
    {
      name: "Corporate Event",
      slug: "corporate-event",
      description: "Annual meetings, conferences, seminars, and networking galas.",
      minGuests: 20,
      maxGuests: 1000,
      defaultGuests: 100,
      displayOrder: 4,
    },
    {
      name: "Anniversary",
      slug: "anniversary",
      description: "Milestone wedding and business anniversaries.",
      minGuests: 20,
      maxGuests: 500,
      defaultGuests: 50,
      displayOrder: 5,
    },
    {
      name: "Engagement",
      slug: "engagement",
      description: "Pre-wedding ring ceremony and engagement party.",
      minGuests: 20,
      maxGuests: 400,
      defaultGuests: 80,
      displayOrder: 6,
    },
  ];

  const eventTypeMap = new Map<string, string>(); // slug -> id

  for (const et of eventTypesData) {
    const existing = await prisma.eventType.findUnique({ where: { slug: et.slug } });
    if (!existing) {
      const created = await prisma.eventType.create({
        data: et,
      });
      eventTypeMap.set(et.slug, created.id);

      // Default fields
      await prisma.eventTypeField.createMany({
        data: [
          { eventTypeId: created.id, key: "eventName", label: "Event Name", fieldType: "TEXT", isRequired: true, isEnabled: true, displayOrder: 1 },
          { eventTypeId: created.id, key: "eventDate", label: "Event Date", fieldType: "DATE", isRequired: true, isEnabled: true, displayOrder: 2 },
          { eventTypeId: created.id, key: "eventTime", label: "Event Time", fieldType: "TEXT", isRequired: false, isEnabled: true, displayOrder: 3 },
          { eventTypeId: created.id, key: "venue", label: "Venue / Location", fieldType: "TEXT", isRequired: true, isEnabled: true, displayOrder: 4 },
          { eventTypeId: created.id, key: "guestCount", label: "Expected Guest Count", fieldType: "NUMBER", isRequired: true, isEnabled: true, displayOrder: 5 },
          { eventTypeId: created.id, key: "description", label: "Special Requirements", fieldType: "TEXT", isRequired: false, isEnabled: true, displayOrder: 6 },
        ],
      });
    } else {
      eventTypeMap.set(et.slug, existing.id);
    }
  }

  // 2. Seed Service Categories
  const serviceCategories = [
    { name: "Photography & Video", slug: "photography-video", displayOrder: 1 },
    { name: "Decoration & Stage", slug: "decoration-stage", displayOrder: 2 },
    { name: "Venue Booking", slug: "venue-booking", displayOrder: 3 },
    { name: "Sound & Lighting", slug: "sound-lighting", displayOrder: 4 },
    { name: "Beauty & Makeup", slug: "beauty-makeup", displayOrder: 5 },
    { name: "Entertainment", slug: "entertainment", displayOrder: 6 },
  ];

  const serviceCategoryMap = new Map<string, string>();
  for (const sc of serviceCategories) {
    const existing = await prisma.serviceCategory.findUnique({ where: { slug: sc.slug } });
    if (!existing) {
      const created = await prisma.serviceCategory.create({ data: sc });
      serviceCategoryMap.set(sc.slug, created.id);
    } else {
      serviceCategoryMap.set(sc.slug, existing.id);
    }
  }

  // 3. Seed Services
  const servicesData = [
    {
      name: "Photography",
      slug: "photography",
      categorySlug: "photography-video",
      pricingModel: "FIXED" as const,
      basePrice: 10000,
      description: "Professional DSLR/Mirrorless event photography with high-res edited photos.",
      aiPhotoShareMode: "ADDON" as const,
      aiAddonPrice: 3000,
      isVendorBased: true,
    },
    {
      name: "Videography",
      slug: "videography",
      categorySlug: "photography-video",
      pricingModel: "PER_DAY" as const,
      basePrice: 20000,
      description: "Full cinematic video coverage, trailer, and 4K highlights.",
      isVendorBased: true,
    },
    {
      name: "Wedding Decoration",
      slug: "wedding-decoration",
      categorySlug: "decoration-stage",
      pricingModel: "FIXED" as const,
      basePrice: 8000,
      description: "Complete floral and structural wedding hall setup.",
    },
    {
      name: "Birthday Decoration",
      slug: "birthday-decoration",
      categorySlug: "decoration-stage",
      pricingModel: "FIXED" as const,
      basePrice: 8000,
      description: "Theme balloons, birthday backdrop, lighting and table arrangement.",
    },
    {
      name: "Stage Decoration",
      slug: "stage-decoration",
      categorySlug: "decoration-stage",
      pricingModel: "FIXED" as const,
      basePrice: 15000,
      description: "Exclusive main stage designing with flowers, lighting, and sofa.",
    },
    {
      name: "Venue",
      slug: "venue",
      categorySlug: "venue-booking",
      pricingModel: "FIXED" as const,
      basePrice: 5000,
      description: "Air-conditioned premium convention center with parking.",
      isVendorBased: true,
    },
    {
      name: "Sound System & Lighting",
      slug: "sound-system-lighting",
      categorySlug: "sound-lighting",
      pricingModel: "PER_DAY" as const,
      basePrice: 12000,
      description: "High quality JBL sound system, wireless mics, and ambient LED lights.",
    },
    {
      name: "Makeup Artist",
      slug: "makeup-artist",
      categorySlug: "beauty-makeup",
      pricingModel: "PER_PERSON" as const,
      basePrice: 5000,
      description: "Bridal or party makeover by certified artists.",
      isVendorBased: true,
    },
    {
      name: "Cake",
      slug: "cake",
      categorySlug: "entertainment",
      pricingModel: "FIXED" as const,
      basePrice: 2500,
      description: "Custom customized multi-tiered theme cake.",
    },
    {
      name: "DJ & Live Music",
      slug: "dj-live-music",
      categorySlug: "entertainment",
      pricingModel: "PER_HOUR" as const,
      basePrice: 3000,
      description: "Professional DJ setup with live song mixing.",
    },
  ];

  const serviceMap = new Map<string, string>(); // slug -> id
  for (const s of servicesData) {
    const existing = await prisma.service.findUnique({ where: { slug: s.slug } });
    if (!existing) {
      const created = await prisma.service.create({
        data: {
          name: s.name,
          slug: s.slug,
          categoryId: serviceCategoryMap.get(s.categorySlug) || null,
          description: s.description,
          pricingModel: s.pricingModel,
          basePrice: toDecimal(s.basePrice),
          aiPhotoShareMode: s.aiPhotoShareMode || "NONE",
          aiAddonPrice: s.aiAddonPrice ? toDecimal(s.aiAddonPrice) : null,
          isVendorBased: s.isVendorBased || false,
        },
      });
      serviceMap.set(s.slug, created.id);
    } else {
      serviceMap.set(s.slug, existing.id);
    }
  }

  // 4. Assign Services to Event Types
  // Wedding gets: Photography, Videography, Wedding Decoration, Stage Decoration, Venue, Sound, Makeup
  const weddingId = eventTypeMap.get("wedding");
  if (weddingId) {
    const weddingServices = [
      "photography",
      "videography",
      "wedding-decoration",
      "stage-decoration",
      "venue",
      "sound-system-lighting",
      "makeup-artist",
    ];
    for (const slug of weddingServices) {
      const sId = serviceMap.get(slug);
      if (sId) {
        await prisma.eventTypeService.upsert({
          where: { eventTypeId_serviceId: { eventTypeId: weddingId, serviceId: sId } },
          create: { eventTypeId: weddingId, serviceId: sId, isActive: true },
          update: { isActive: true },
        });
      }
    }
  }

  // Birthday gets: Birthday Decoration, Cake, Photography, DJ & Live Music
  const birthdayId = eventTypeMap.get("birthday");
  if (birthdayId) {
    const birthdayServices = ["birthday-decoration", "cake", "photography", "dj-live-music"];
    for (const slug of birthdayServices) {
      const sId = serviceMap.get(slug);
      if (sId) {
        await prisma.eventTypeService.upsert({
          where: { eventTypeId_serviceId: { eventTypeId: birthdayId, serviceId: sId } },
          create: { eventTypeId: birthdayId, serviceId: sId, isActive: true },
          update: { isActive: true },
        });
      }
    }
  }

  // Get Together gets: Photography, Venue, Sound & Lighting
  const getTogetherId = eventTypeMap.get("get-together");
  if (getTogetherId) {
    const gtServices = ["photography", "venue", "sound-system-lighting"];
    for (const slug of gtServices) {
      const sId = serviceMap.get(slug);
      if (sId) {
        await prisma.eventTypeService.upsert({
          where: { eventTypeId_serviceId: { eventTypeId: getTogetherId, serviceId: sId } },
          create: { eventTypeId: getTogetherId, serviceId: sId, isActive: true },
          update: { isActive: true },
        });
      }
    }
  }

  // 5. Seed Food Categories
  const foodCategories = [
    { name: "Rice & Biryani", slug: "rice-biryani", displayOrder: 1 },
    { name: "Meat & Poultry", slug: "meat-poultry", displayOrder: 2 },
    { name: "Beverages & Drinks", slug: "beverages-drinks", displayOrder: 3 },
    { name: "Desserts & Sweets", slug: "desserts-sweets", displayOrder: 4 },
  ];

  const foodCategoryMap = new Map<string, string>();
  for (const fc of foodCategories) {
    const existing = await prisma.foodCategory.findUnique({ where: { slug: fc.slug } });
    if (!existing) {
      const created = await prisma.foodCategory.create({ data: fc });
      foodCategoryMap.set(fc.slug, created.id);
    } else {
      foodCategoryMap.set(fc.slug, existing.id);
    }
  }

  // 6. Seed Food Items (Exact sample items from SRS: Chicken Roast ৳100, Polao ৳80, Beef Rezala ৳150, Borhani ৳40, Dessert ৳60)
  const foodItemsData = [
    {
      name: "Chicken Roast",
      slug: "chicken-roast",
      categorySlug: "meat-poultry",
      pricePerPerson: 100,
      dietaryLabels: ["HALAL", "NON_VEGETARIAN"],
      description: "Classic Bangladeshi wedding-style tender chicken roast.",
    },
    {
      name: "Polao",
      slug: "polao",
      categorySlug: "rice-biryani",
      pricePerPerson: 80,
      dietaryLabels: ["HALAL", "VEGETARIAN"],
      description: "Fragrant Chinigura rice ghee polao.",
    },
    {
      name: "Beef Rezala",
      slug: "beef-rezala",
      categorySlug: "meat-poultry",
      pricePerPerson: 150,
      dietaryLabels: ["HALAL", "NON_VEGETARIAN"],
      description: "Slow-cooked royal beef rezala with rich gravy.",
    },
    {
      name: "Borhani",
      slug: "borhani",
      categorySlug: "beverages-drinks",
      pricePerPerson: 40,
      dietaryLabels: ["HALAL", "VEGETARIAN"],
      description: "Traditional spicy yogurt digestive beverage.",
    },
    {
      name: "Dessert (Firni)",
      slug: "dessert-firni",
      categorySlug: "desserts-sweets",
      pricePerPerson: 60,
      dietaryLabels: ["HALAL", "VEGETARIAN"],
      description: "Creamy traditional shahi firni in clay pots.",
    },
  ];

  const foodItemMap = new Map<string, string>();
  for (const fi of foodItemsData) {
    const existing = await prisma.foodItem.findUnique({ where: { slug: fi.slug } });
    if (!existing) {
      const created = await prisma.foodItem.create({
        data: {
          name: fi.name,
          slug: fi.slug,
          categoryId: foodCategoryMap.get(fi.categorySlug)!,
          pricePerPerson: toDecimal(fi.pricePerPerson),
          dietaryLabels: fi.dietaryLabels,
          description: fi.description,
          minOrderQuantity: 5,
        },
      });
      foodItemMap.set(fi.slug, created.id);
    } else {
      foodItemMap.set(fi.slug, existing.id);
    }
  }

  // 7. Assign Food to Event Types
  // Wedding gets all 5 items
  if (weddingId) {
    for (const [slug, id] of foodItemMap.entries()) {
      const existing = await prisma.eventTypeFood.findFirst({
        where: { eventTypeId: weddingId, foodItemId: id },
      });
      if (!existing) {
        await prisma.eventTypeFood.create({
          data: { eventTypeId: weddingId, foodItemId: id, isActive: true },
        });
      }
    }
  }

  // Birthday gets: Polao, Chicken Roast, Borhani, Dessert
  if (birthdayId) {
    const birthdayFood = ["polao", "chicken-roast", "borhani", "dessert-firni"];
    for (const slug of birthdayFood) {
      const id = foodItemMap.get(slug);
      if (id) {
        const existing = await prisma.eventTypeFood.findFirst({
          where: { eventTypeId: birthdayId, foodItemId: id },
        });
        if (!existing) {
          await prisma.eventTypeFood.create({
            data: { eventTypeId: birthdayId, foodItemId: id, isActive: true },
          });
        }
      }
    }
  }

  // Get Together gets: Polao, Chicken Roast, Borhani
  if (getTogetherId) {
    const gtFood = ["polao", "chicken-roast", "borhani"];
    for (const slug of gtFood) {
      const id = foodItemMap.get(slug);
      if (id) {
        const existing = await prisma.eventTypeFood.findFirst({
          where: { eventTypeId: getTogetherId, foodItemId: id },
        });
        if (!existing) {
          await prisma.eventTypeFood.create({
            data: { eventTypeId: getTogetherId, foodItemId: id, isActive: true },
          });
        }
      }
    }
  }

  console.log("✅ [Seed] Dynamic event engine seed completed successfully!");
};

