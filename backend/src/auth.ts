import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export const upsertSupabaseUser = async (email: string, supabaseId: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Update existing user with supabaseId if not set
    if (!user.supabaseId) {
      return prisma.user.update({
        where: { id: user.id },
        data: { supabaseId },
      });
    }
    return user;
  }

  // New User - Start 7-day trial
  const trialStartDate = new Date();
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setDate(trialStartDate.getDate() + 7);

  return prisma.user.create({
    data: {
      email,
      supabaseId,
      subscriptionStatus: "TRIAL",
      trialStartDate,
      subscriptionEndDate,
    },
  });
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
