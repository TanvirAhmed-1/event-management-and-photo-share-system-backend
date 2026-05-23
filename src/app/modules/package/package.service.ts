import prisma from "../../utils/prisma";

const getAllPackages = async () => {
  const result = await prisma.package.findMany({
    orderBy: {
      price: "asc",
    },
  });
  return result;
};

const createPackage = async (payload: any) => {
  const result = await prisma.package.create({
    data: {
      name: payload.name,
      storageLimitMB: Number(payload.storageLimitMB),
      price: Number(payload.price),
      description: payload.description,
    },
  });
  return result;
};

const updatePackage = async (id: string, payload: any) => {
  const result = await prisma.package.update({
    where: { id },
    data: {
      name: payload.name,
      storageLimitMB: payload.storageLimitMB !== undefined ? Number(payload.storageLimitMB) : undefined,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      description: payload.description,
    },
  });
  return result;
};

const deletePackage = async (id: string) => {
  const result = await prisma.package.delete({
    where: { id },
  });
  return result;
};

export const PackageService = {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
};
