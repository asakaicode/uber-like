import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import type { UserRole } from "@uber-like/database";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  customerId?: string;
  restaurantId?: string;
  driverId?: string;
}

export interface Context {
  user: JwtPayload | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireAuth(ctx: { user: JwtPayload | null }): JwtPayload {
  if (!ctx.user) {
    throw new GraphQLError("Unauthorized", { extensions: { code: "UNAUTHENTICATED" } });
  }
  return ctx.user;
}

export function requireRole(user: JwtPayload, ...roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
  }
}
