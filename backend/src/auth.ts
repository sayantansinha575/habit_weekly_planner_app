import { prisma } from "./prisma"; //auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
console.log("JWT SECRET:", JWT_SECRET);

export const upsertSupabaseUser = async (email: string, supabaseId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !existingUser;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      supabaseId,
    },
    create: {
      email,
      supabaseId,
      subscriptionStatus: "FREE",
    },
  });

  return { user, isNewUser };
};

export const register = async (email: string, password: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isValid) throw new Error("Invalid password");

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  return { user, token };
};
