import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import config from "../../config";

export async function seedSuperAdmin() {
  try {
    const superAdminEmail = config.super_admin.email;
    const superAdminPhone = config.super_admin.phone;
    const superAdminPassword = config.super_admin.password;

    // 1. Check if Super Admin already exists
    const superAdminExists = await prisma.user.findFirst({
      where: {
        OR: [
          { email: superAdminEmail },
          { role: "SUPER_ADMIN" }
        ]
      }
    });

    if (superAdminExists) {
      console.log("Super Admin already exists, skipping super admin seed.");
      return;
    }

    // 2. Find Premium package to assign to Super Admin (so they have 20GB by default!)
    const premiumPackage = await prisma.package.findFirst({
      where: { name: { equals: "Premium", mode: "insensitive" } },
    });

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(superAdminPassword, config.bcrypt_salt_rounds);

    // 4. Create Super Admin user
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: superAdminEmail,
        phone: superAdminPhone,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        packageId: premiumPackage?.id || null,
        usedStorageMB: 0
      }
    });

    console.log("Super Admin seeded successfully!");
    console.log(`Email: ${superAdminEmail}`);
    console.log("Password: (Configured via env or default 'superadmin12345')");
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
  }
}
