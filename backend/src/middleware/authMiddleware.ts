import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";

const SUPABASE_URL = "https://vzxmrdlkrcjmaiiedxgk.supabase.co";

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

import { prisma } from "../prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
  };
}

export const verifySupabaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    });

    console.log("JWT Verified for:", payload.email);

    // Look up internal backend user
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: payload.sub as string },
    });

    if (!dbUser) {
      console.warn("JWT Valid but user not synced in DB:", payload.email);
      // We could either return 401 or allow through but mark as incomplete
      // Given our flow, they should be synced.
      return res.status(401).json({ error: "User not found in system" });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      supabaseId: dbUser.supabaseId!,
    };

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
