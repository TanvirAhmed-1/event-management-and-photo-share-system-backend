import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import config from "../../config";

export async function seedSuperAdmin() {
  try {
    const superAdminEmail = config.super_admin.email;
    const superAdminPhone = config.super_admin.phone;
    const superAdminPassword = config.super_admin.password;

    // 1. Check if a user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (existingUserByEmail) {
      if (existingUserByEmail.role !== "SUPER_ADMIN" || !existingUserByEmail.isActive) {
        console.log(`[Seed] User with email ${superAdminEmail} exists but role is ${existingUserByEmail.role}. Self-healing: updating to SUPER_ADMIN...`);
        await prisma.user.update({
          where: { email: superAdminEmail },
          data: {
            role: "SUPER_ADMIN",
            isActive: true
          }
        });
        console.log("Super Admin role updated successfully!");
      } else {
        console.log("Super Admin already exists, skipping super admin seed.");
      }
      return;
    }

    const superAdminExists = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" }
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
        usedStorageMB: 0,
        isActive: true
      }
    });

    console.log("Super Admin seeded successfully!");
    console.log(`Email: ${superAdminEmail}`);
    console.log("Password: (Configured via env or default 'superadmin12345')");
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
  }
}
