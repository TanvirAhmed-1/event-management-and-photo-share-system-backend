import prisma from "../../utils/prisma";

const getAllPackages = async () => {
  const result = await prisma.package.findMany({
    orderBy: {
      price: "asc",
    },
  });
  return result;
};

export const PackageService = {
  getAllPackages,
};
