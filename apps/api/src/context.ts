import { createSchema } from "graphql-yoga";
import { typeDefs } from "./schema.js";
import { resolvers, type Context } from "./resolvers.js";
import { getTokenFromHeader, verifyToken } from "./lib/auth.js";

export const schema = createSchema<Context>({
  typeDefs,
  resolvers,
});

export function buildContext(authHeader?: string | null): Context {
  const token = getTokenFromHeader(authHeader);
  if (!token) return { user: null };
  try {
    return { user: verifyToken(token) };
  } catch {
    return { user: null };
  }
}
