import prisma from "../../utils/prisma";

const getUserDashboard = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      package: true,
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  // Count events
  const totalEvents = await prisma.event.count({
    where: { userId },
  });

  // Count photos for all user events
  const totalPhotos = await prisma.photo.count({
    where: {
      event: {
        userId,
      },
    },
  });

  const storageLimit = user.package?.storageLimitMB || 0;
  const storageUsed = user.usedStorageMB;
  const remainingStorage = Math.max(0, storageLimit - storageUsed);

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    packageInfo: user.package
      ? {
          id: user.package.id,
          name: user.package.name,
          storageLimitMB: user.package.storageLimitMB,
          price: user.package.price,
          durationDays: user.package.durationDays,
          packageActivatedAt: user.packageActivatedAt,
          packageExpiredAt: user.packageExpiredAt,
          isExpired: user.packageExpiredAt ? new Date() > user.packageExpiredAt : false,
        }
      : null,
    stats: {
      totalEvents,
      totalPhotos,
      storageLimitMB: storageLimit,
      storageUsedMB: parseFloat(storageUsed.toFixed(2)),
      remainingStorageMB: parseFloat(remainingStorage.toFixed(2)),
    },
  };
};

const selectPackage = async (userId: string, packageId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const targetPackage = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!targetPackage) {
    throw new Error("Package not found!");
  }

  const durationDays = targetPackage.durationDays;
  const packageActivatedAt = new Date();
  const packageExpiredAt = new Date();
  packageExpiredAt.setDate(packageExpiredAt.getDate() + durationDays);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      packageId: targetPackage.id,
      packageActivatedAt,
      packageExpiredAt,
    },
    include: {
      package: true,
    },
  });

  const { password, ...userData } = updatedUser;
  return userData;
};

const getAllUsersAdmin = async () => {
  const result = await prisma.user.findMany({
    include: {
      package: true,
      _count: {
        select: { events: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const toggleUserActiveAdmin = async (targetUserId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const result = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive: !user.isActive,
    },
  });
  return result;
};

const selectPackageAdmin = async (targetUserId: string, packageId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const targetPackage = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!targetPackage) {
    throw new Error("Package not found!");
  }

  const durationDays = targetPackage.durationDays;
  const packageActivatedAt = new Date();
  const packageExpiredAt = new Date();
  packageExpiredAt.setDate(packageExpiredAt.getDate() + durationDays);

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      packageId: targetPackage.id,
      packageActivatedAt,
      packageExpiredAt,
    },
    include: {
      package: true,
    },
  });

  const { password, ...userData } = updatedUser;
  return userData;
};

export const UserService = {
  getUserDashboard,
  selectPackage,
  getAllUsersAdmin,
  toggleUserActiveAdmin,
  selectPackageAdmin,
};
