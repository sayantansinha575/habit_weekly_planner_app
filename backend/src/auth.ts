import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
console.log("JWT SECRET:", JWT_SECRET);

export const upsertSupabaseUser = async (
  email: string | undefined | null,
  supabaseId: string,
) => {
  // 1. Try to find by supabaseId (Best way)
  let user = await prisma.user.findUnique({
    where: { supabaseId },
  });

  // 2. If not found by ID, try finding by email to link accounts
  if (!user && email) {
    user = await prisma.user.findUnique({
      where: { email },
    });
  }

  const isNewUser = !user;
  const safeEmail = email || ""; // Fallback to empty string for required field

  if (user) {
    // UPDATE existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        supabaseId,
        // Only update email if it was previously empty or missing
        email:
          user.email === "" || user.email === "EMPTY" ? safeEmail : user.email,
      },
    });
  } else {
    // CREATE new user
    user = await prisma.user.create({
      data: {
        email: safeEmail,
        supabaseId,
        subscriptionStatus: "FREE",
      },
    });
  }

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
