import prisma from "./src/app/utils/prisma";

async function populateRealData() {
  console.log("🚀 Starting database enrichment with professional real data...");

  // 1. Update Event Types with high quality photography images & descriptions
  const eventTypes = [
    {
      slug: "wedding",
      name: "Wedding",
      description: "Royal stages, bridal photography, and bespoke grand celebrations.",
      imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      minGuests: 50,
      maxGuests: 2500,
      defaultGuests: 250,
      displayOrder: 1,
    },
    {
      slug: "birthday",
      name: "Birthday",
      description: "Fun balloon decors, designer cakes, and vibrant celebration parties.",
      imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop",
      minGuests: 15,
      maxGuests: 400,
      defaultGuests: 40,
      displayOrder: 2,
    },
    {
      slug: "get-together",
      name: "Get Together",
      description: "Heartwarming family reunions, alumni meetups, and live feasts.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop",
      minGuests: 10,
      maxGuests: 300,
      defaultGuests: 30,
      displayOrder: 3,
    },
    {
      slug: "corporate-event",
      name: "Corporate Event",
      description: "Executive townhalls, product launches, conventions, and gala dinners.",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
      minGuests: 25,
      maxGuests: 1500,
      defaultGuests: 120,
      displayOrder: 4,
    },
    {
      slug: "engagement",
      name: "Engagement",
      description: "Floral ring exchange stages, candlelight ambiences, and photo sessions.",
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
      minGuests: 20,
      maxGuests: 500,
      defaultGuests: 80,
      displayOrder: 5,
    },
    {
      slug: "anniversary",
      name: "Anniversary",
      description: "Cherished milestone celebrations, vintage themes, and memory albums.",
      imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop",
      minGuests: 20,
      maxGuests: 600,
      defaultGuests: 60,
      displayOrder: 6,
    },
  ];

  for (const et of eventTypes) {
    await prisma.eventType.upsert({
      where: { slug: et.slug },
      update: {
        name: et.name,
        description: et.description,
        imageUrl: et.imageUrl,
        minGuests: et.minGuests,
        maxGuests: et.maxGuests,
        defaultGuests: et.defaultGuests,
        displayOrder: et.displayOrder,
      },
      create: {
        slug: et.slug,
        name: et.name,
        description: et.description,
        imageUrl: et.imageUrl,
        minGuests: et.minGuests,
        maxGuests: et.maxGuests,
        defaultGuests: et.defaultGuests,
        displayOrder: et.displayOrder,
      },
    });
  }
  console.log("✅ Event types enriched with photos!");

  // 2. Update Service Categories with photos
  const serviceCategories = [
    {
      slug: "photography-video",
      name: "Photography & Video",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
      displayOrder: 1,
    },
    {
      slug: "decoration-stage",
      name: "Decoration & Stage",
      imageUrl: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=800&auto=format&fit=crop",
      displayOrder: 2,
    },
    {
      slug: "venue-booking",
      name: "Venue Booking",
      imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop",
      displayOrder: 3,
    },
    {
      slug: "sound-lighting",
      name: "Sound & Lighting",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
      displayOrder: 4,
    },
    {
      slug: "beauty-makeup",
      name: "Beauty & Makeup",
      imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop",
      displayOrder: 5,
    },
    {
      slug: "entertainment",
      name: "Entertainment & Cakes",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
      displayOrder: 6,
    },
  ];

  for (const sc of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: sc.slug },
      update: { name: sc.name, imageUrl: sc.imageUrl, displayOrder: sc.displayOrder },
      create: { slug: sc.slug, name: sc.name, imageUrl: sc.imageUrl, displayOrder: sc.displayOrder },
    });
  }
  console.log("✅ Service categories updated!");

  // 3. Update Services with multi-image arrays and exact realistic pricing
  const servicesData = [
    {
      slug: "photography",
      name: "Cinematic Photography",
      images: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=800&auto=format&fit=crop",
      ],
      description: "High-resolution portrait & candid event photography with instant AI face identification.",
      basePrice: 5000,
      pricingModel: "FIXED",
    },
    {
      slug: "videography",
      name: "4K Cinematic Videography",
      images: [
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
      ],
      description: "Cinematic 4K highlights, cinematic teaser reel, gimbal stabilizers, and drone footage.",
      basePrice: 7000,
      pricingModel: "PER_DAY",
    },
    {
      slug: "wedding-decoration",
      name: "Royal Stage & Hall Decoration",
      images: [
        "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
      ],
      description: "Exquisite fresh floral mandap, LED fairy ceiling, illuminated entrance walkway & sofa set.",
      basePrice: 8000,
      pricingModel: "FIXED",
    },
    {
      slug: "venue",
      name: "Premium Convention Venues",
      images: [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
      ],
      description: "Fully air-conditioned luxury convention halls with banquet seating and VIP valet.",
      basePrice: 15000,
      pricingModel: "FIXED",
    },
    {
      slug: "sound-system-lighting",
      name: "Acoustic Rig & Dynamic Lighting",
      images: [
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
      ],
      description: "JBL line arrays, digital mixer, moving beam lights, smoke haze & wireless Shure mics.",
      basePrice: 3500,
      pricingModel: "PER_DAY",
    },
    {
      slug: "makeup-artist",
      name: "Bridal & Glam Makeover",
      images: [
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop",
      ],
      description: "HD & Airbrush party / bridal makeover by verified top makeup artists with styling.",
      basePrice: 5000,
      pricingModel: "PER_PERSON",
    },
    {
      slug: "cake",
      name: "Designer Celebration Cakes",
      images: [
        "https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800&auto=format&fit=crop",
      ],
      description: "Custom multi-tiered fondant, Belgian chocolate, and handcrafted flower-themed cakes.",
      basePrice: 2500,
      pricingModel: "FIXED",
    },
    {
      slug: "dj-live-music",
      name: "Club DJ & Live Musical Band",
      images: [
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
      ],
      description: "Energetic DJ performance with live remixing, acoustic guitars, and crowd animation.",
      basePrice: 6000,
      pricingModel: "PER_HOUR",
    },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findUnique({ where: { slug: s.slug } });
    if (existing) {
      await prisma.service.update({
        where: { slug: s.slug },
        data: {
          name: s.name,
          images: s.images,
          description: s.description,
          basePrice: s.basePrice,
        },
      });
    }
  }
  console.log("✅ Services enriched with multi-photos and descriptions!");

  // 4. Update Food Items with mouth-watering photography
  const foodData = [
    {
      slug: "chicken-roast",
      name: "Shahi Chicken Roast",
      images: ["https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800&auto=format&fit=crop"],
      pricePerPerson: 100,
      description: "Tender fried chicken simmered in aromatic shahi gravy with fried onions & spices.",
    },
    {
      slug: "polao",
      name: "Chinigura Ghee Polao",
      images: ["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=800&auto=format&fit=crop"],
      pricePerPerson: 80,
      description: "Aromatic Chinigura rice sautéed in pure dairy ghee with whole spices.",
    },
    {
      slug: "beef-rezala",
      name: "Kolkata Style Beef Rezala",
      images: ["https://images.unsplash.com/photo-1545247181-516773cae754?q=80&w=800&auto=format&fit=crop"],
      pricePerPerson: 150,
      description: "Slow-braised tender beef shank in rich cashew, poppy seed, and yogurt broth.",
    },
    {
      slug: "borhani",
      name: "Traditional Spicy Borhani",
      images: ["https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop"],
      pricePerPerson: 40,
      description: "Chilled traditional yogurt digestive drink infused with mint, coriander, and roasted cumin.",
    },
    {
      slug: "dessert-firni",
      name: "Matka Shahi Firni",
      images: ["https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop"],
      pricePerPerson: 60,
      description: "Clay-pot set traditional rice pudding garnished with saffron, pistachios, and silver leaf.",
    },
  ];

  for (const fi of foodData) {
    const existing = await prisma.foodItem.findUnique({ where: { slug: fi.slug } });
    if (existing) {
      await prisma.foodItem.update({
        where: { slug: fi.slug },
        data: {
          name: fi.name,
          images: fi.images,
          pricePerPerson: fi.pricePerPerson,
          description: fi.description,
        },
      });
    }
  }
  console.log("✅ Food items updated with cover images!");

  // 5. Ensure Showcase Events exist
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    const weddingType = await prisma.eventType.findUnique({ where: { slug: "wedding" } });
    const birthdayType = await prisma.eventType.findUnique({ where: { slug: "birthday" } });
    const corporateType = await prisma.eventType.findUnique({ where: { slug: "corporate-event" } });

    const sampleEvents = [
      {
        title: "Tahmid & Sarah's Royal Wedding Gala",
        coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
        userId: firstUser.id,
        eventTypeId: weddingType?.id,
        status: "CONFIRMED" as const,
        guestCount: 350,
        venue: "Sena Malancha, Dhaka",
        eventDate: new Date("2026-12-18"),
        eventTime: "07:30 PM",
        description: "Grand wedding celebration featuring royal floral stage, AI photo delivery & shahi kacchi feast.",
      },
      {
        title: "Zayaan's 1st Superhero Birthday Fiesta",
        coverImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200&auto=format&fit=crop",
        userId: firstUser.id,
        eventTypeId: birthdayType?.id,
        status: "CONFIRMED" as const,
        guestCount: 80,
        venue: "Celebration Convention, Banani",
        eventDate: new Date("2026-11-28"),
        eventTime: "05:00 PM",
        description: "Vibrant superhero theme birthday party with magic show, custom cake & live photography.",
      },
      {
        title: "Apex Innovations Annual Summit 2026",
        coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
        userId: firstUser.id,
        eventTypeId: corporateType?.id,
        status: "CONFIRMED" as const,
        guestCount: 200,
        venue: "Radisson Blu Water Garden, Dhaka",
        eventDate: new Date("2026-12-05"),
        eventTime: "10:00 AM",
        description: "Executive leadership conference and recognition dinner with full AV stage coverage.",
      },
    ];

    for (const ev of sampleEvents) {
      const existing = await prisma.event.findFirst({ where: { title: ev.title } });
      if (!existing) {
        await prisma.event.create({
          data: ev,
        });
        console.log(`Created sample event: ${ev.title}`);
      } else {
        await prisma.event.update({
          where: { id: existing.id },
          data: {
            coverImage: ev.coverImage,
            guestCount: ev.guestCount,
            venue: ev.venue,
            description: ev.description,
          },
        });
        console.log(`Updated sample event: ${ev.title}`);
      }
    }
  }

  console.log("🎉 Database enriched with all professional photos & data successfully!");
}

populateRealData()
  .catch((e) => {
    console.error("Error populating real data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
