import prisma from "./prisma";

export async function seedPackages() {
  try {
    const count = await prisma.package.count();
    if (count === 0) {
      await prisma.package.createMany({
        data: [
          {
            name: "Free",
            storageLimitMB: 500,
            price: 0,
            description: ["500 MB Storage", "Basic AI Matching", "Single Downloads"],
          },
          {
            name: "Basic",
            storageLimitMB: 5120, // 5 GB
            price: 19,
            description: ["5 GB Storage", "Fast AI Matching", "ZIP Downloads", "Email Support"],
          },
          {
            name: "Premium",
            storageLimitMB: 20480, // 20 GB
            price: 49,
            description: ["20 GB Storage", "Priority AI Matching", "ZIP Downloads", "24/7 Priority Support"],
          },
        ],
      });
      console.log("Packages seeded successfully!");
    } else {
      console.log("Packages already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding packages:", error);
  }
}

export async function seedReviews() {
  try {
    const count = await prisma.review.count();
    if (count === 0) {
      await prisma.review.createMany({
        data: [
          {
            name: "Sarah & Michael",
            rating: 5,
            comment: "Absolutely incredible! Our guests were blown away by how fast the AI found their photos. With over 2,000 photos uploaded, guests found their matches within seconds just by uploading a selfie!",
            imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=150",
          },
          {
            name: "David K.",
            rating: 5,
            comment: "As a guest, I usually have to wait weeks to get photos from the couple. With this app, I just scanned my selfie and instantly downloaded all 15 high-res photos I was in. Best wedding tech ever!",
            imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
          },
          {
            name: "Emily R.",
            rating: 5,
            comment: "I recommend this platform to all my wedding clients now. The ZIP download stream is super-fast, storage capacity is huge, and the setup takes less than 2 minutes. Outstanding service!",
            imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
          },
        ],
      });
      console.log("Reviews seeded successfully!");
    } else {
      console.log("Reviews already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding reviews:", error);
  }
}

