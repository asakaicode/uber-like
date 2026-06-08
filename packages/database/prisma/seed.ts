import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RESTAURANTS = [
  { name: "Tokyo Station Ramen", lat: 35.6812, lng: 139.7671 },
  { name: "Shibuya Sushi", lat: 35.6595, lng: 139.7005 },
  { name: "Shinjuku Curry", lat: 35.6938, lng: 139.7034 },
];

const MENU_TEMPLATES = [
  { name: "Classic Set", price: 980 },
  { name: "Premium Set", price: 1480 },
  { name: "Side Dish", price: 380 },
  { name: "Drink", price: 280 },
  { name: "Dessert", price: 450 },
];

async function main() {
  await prisma.rating.deleteMany();
  await prisma.driverOffer.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const customerUser = await prisma.user.create({
    data: {
      email: "customer@example.com",
      passwordHash,
      role: UserRole.CUSTOMER,
      customerProfile: { create: { name: "Test Customer" } },
    },
    include: { customerProfile: true },
  });

  const restaurantUsers = await Promise.all(
    RESTAURANTS.map(async (r, i) =>
      prisma.user.create({
        data: {
          email: `restaurant${i + 1}@example.com`,
          passwordHash,
          role: UserRole.RESTAURANT,
          restaurant: {
            create: { name: r.name, lat: r.lat, lng: r.lng, isOpen: true },
          },
        },
        include: { restaurant: true },
      }),
    ),
  );

  for (const ru of restaurantUsers) {
    if (!ru.restaurant) continue;
    await prisma.menuItem.createMany({
      data: MENU_TEMPLATES.map((m) => ({
        restaurantId: ru.restaurant!.id,
        name: m.name,
        price: m.price,
      })),
    });
  }

  const driverPositions = [
    { lat: 35.6762, lng: 139.6503, name: "Driver Taro" },
    { lat: 35.7101, lng: 139.8107, name: "Driver Hanako" },
    { lat: 35.6467, lng: 139.7101, name: "Driver Jiro" },
  ];

  for (let i = 0; i < driverPositions.length; i++) {
    const d = driverPositions[i]!;
    const driverUser = await prisma.user.create({
      data: {
        email: `driver${i + 1}@example.com`,
        passwordHash,
        role: UserRole.DRIVER,
        driverProfile: {
          create: { name: d.name, isOnline: true, rating: 4.5 + i * 0.2 },
        },
      },
      include: { driverProfile: true },
    });
    if (driverUser.driverProfile) {
      await prisma.driverLocation.create({
        data: {
          driverId: driverUser.driverProfile.id,
          lat: d.lat,
          lng: d.lng,
          heading: 90,
        },
      });
    }
  }

  console.log("Seed completed:");
  console.log("  customer@example.com / password123");
  console.log("  restaurant1@example.com / password123");
  console.log("  driver1@example.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
