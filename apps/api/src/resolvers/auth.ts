import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { Prisma, UserRole, prisma } from "@uber-like/database";
import type { Resolvers } from "../generated/resolver-types.js";
import type { JwtPayload } from "../lib/auth.js";
import { requireAuth, signToken } from "../lib/auth.js";

const profileInclude = {
  customerProfile: true,
  restaurant: true,
  driverProfile: true,
} as const;

function buildAuthPayload(user: {
  id: string;
  email: string;
  role: UserRole;
  customerProfile?: { id: string } | null;
  restaurant?: { id: string } | null;
  driverProfile?: { id: string } | null;
}) {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    customerId: user.customerProfile?.id,
    restaurantId: user.restaurant?.id,
    driverId: user.driverProfile?.id,
  };
  return {
    token: signToken(payload),
    user: { id: user.id, email: user.email, role: user.role },
    customerId: user.customerProfile?.id ?? null,
    restaurantId: user.restaurant?.id ?? null,
    driverId: user.driverProfile?.id ?? null,
  };
}

export const authResolvers: Partial<Resolvers> = {
  Query: {
    me: (_, __, ctx) => {
      if (!ctx.user) return null;
      return prisma.user.findUnique({
        where: { id: ctx.user.userId },
        select: { id: true, email: true, role: true },
      });
    },
  },

  Mutation: {
    register: async (_, args) => {
      const passwordHash = await bcrypt.hash(args.password, 10);
      try {
        const user = await prisma.user.create({
          data: {
            email: args.email,
            passwordHash,
            role: args.role,
            ...(args.role === UserRole.CUSTOMER
              ? { customerProfile: { create: { name: args.name } } }
              : {}),
            ...(args.role === UserRole.RESTAURANT
              ? { restaurant: { create: { name: args.name, lat: 35.6812, lng: 139.7671 } } }
              : {}),
            ...(args.role === UserRole.DRIVER
              ? { driverProfile: { create: { name: args.name } } }
              : {}),
          },
          include: profileInclude,
        });
        return buildAuthPayload(user);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          throw new GraphQLError("Email already registered", {
            extensions: { code: "EMAIL_TAKEN" },
          });
        }
        throw err;
      }
    },

    login: async (_, args) => {
      const user = await prisma.user.findUnique({
        where: { email: args.email },
        include: profileInclude,
      });
      if (!user || !(await bcrypt.compare(args.password, user.passwordHash))) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }
      return buildAuthPayload(user);
    },
  },
};
