import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";

const SUPABASE_URL = "https://vzxmrdlkrcjmaiiedxgk.supabase.co";

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`), //auth middleware
);
console.log("SUPABASE_URL:", SUPABASE_URL);
import { prisma } from "../prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
  };
}

// 1. Basic JWT Verification (Only checks if token is valid from Supabase)
export const verifySupabaseJWT = async (
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

    console.log("JWT Valid for:", payload.email);

    req.user = {
      id: "", // Not set yet
      email: payload.email as string,
      supabaseId: payload.sub as string,
    };

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 2. Strict Token Verification (Checks JWT + ensures user exists in our DB)
export const verifySupabaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // First, verify the JWT
  await verifySupabaseJWT(req, res, async () => {
    try {
      // Then, look up internal backend user
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: req.user?.supabaseId },
      });

      if (!dbUser) {
        console.warn("JWT Valid but user not synced in DB:", req.user?.email);
        return res.status(401).json({ error: "User not found in system" });
      }

      // Attach full internal user info
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        supabaseId: dbUser.supabaseId!,
      };

      next();
    } catch (err) {
      console.error("DB User Lookup Error:", err);
      return res
        .status(500)
        .json({ error: "Internal server error during auth" });
    }
  });
};
