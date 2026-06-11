import { GraphQLError } from "graphql";
import { prisma } from "@uber-like/database";
import type { DriverInfoModel } from "../models.js";

export async function getDriverLocation(driverId: string) {
  return prisma.driverLocation.findFirst({
    where: { driverId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDriverInfo(driverId: string): Promise<DriverInfoModel | null> {
  const driver = await prisma.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return null;
  const loc = await getDriverLocation(driverId);
  return {
    id: driver.id,
    name: driver.name,
    rating: driver.rating,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    heading: loc?.heading ?? null,
  };
}

export async function requireDriverInfo(driverId: string): Promise<DriverInfoModel> {
  const info = await getDriverInfo(driverId);
  if (!info) {
    throw new GraphQLError("Driver not found", { extensions: { code: "NOT_FOUND" } });
  }
  return info;
}
