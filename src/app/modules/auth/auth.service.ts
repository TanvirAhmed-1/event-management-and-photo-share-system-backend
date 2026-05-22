import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { ILoginUserRequest, IRegisterUserRequest } from "./auth.interface";

const registerUser = async (payload: IRegisterUserRequest) => {
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingUserByEmail) {
    throw new Error("User with this email already exists!");
  }

  const existingUserByPhone = await prisma.user.findUnique({
    where: { phone: payload.phone },
  });
  if (existingUserByPhone) {
    throw new Error("User with this phone number already exists!");
  }

  // Find the package to assign
  let assignedPackageId = null;

  if (payload.packageId) {
    const selectedPackage = await prisma.package.findUnique({
      where: { id: payload.packageId },
    });
    if (!selectedPackage) {
      throw new Error("Selected package not found!");
    }
    assignedPackageId = selectedPackage.id;
  } else {
    // Fallback to Free package if not provided
    const freePackage = await prisma.package.findFirst({
      where: { name: { equals: "Free", mode: "insensitive" } },
    });
    assignedPackageId = freePackage?.id || null;
  }

  const hashedPassword = await bcrypt.hash(payload.password!, config.bcrypt_salt_rounds);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      packageId: assignedPackageId,
      usedStorageMB: 0,
    },
    include: {
      package: true,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      packageId: newUser.packageId,
      role: newUser.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expires_in as any }
  );

  const { password, ...userData } = newUser;

  return {
    user: userData,
    accessToken: token,
  };
};

const loginUser = async (payload: ILoginUserRequest) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: {
      package: true,
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const isPasswordMatched = await bcrypt.compare(payload.password!, user.password);
  if (!isPasswordMatched) {
    throw new Error("Incorrect password!");
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      packageId: user.packageId,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expires_in as any }
  );

  const { password, ...userData } = user;

  return {
    user: userData,
    accessToken: token,
  };
};

export const AuthService = {
  registerUser,
  loginUser,
};
