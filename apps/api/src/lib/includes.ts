export const orderInclude = {
  items: { include: { menuItem: true } },
  restaurant: true,
  delivery: {
    include: {
      driver: {
        include: { locations: { orderBy: { createdAt: "desc" as const }, take: 1 } },
      },
    },
  },
  rating: true,
} as const;

export const offerInclude = {
  delivery: {
    include: {
      order: { include: { restaurant: true, items: { include: { menuItem: true } } } },
    },
  },
  driver: true,
} as const;
