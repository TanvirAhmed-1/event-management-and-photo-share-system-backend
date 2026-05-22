import { z } from "zod";

const registerUserSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2).max(50),
  email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
  phone: z.string({ required_error: "Phone is required" }).min(6).max(20),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  packageId: z.string().optional(),
});

const loginUserSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
  password: z.string({ required_error: "Password is required" }),
});

export const AuthValidation = {
  registerUserSchema,
  loginUserSchema,
};
