import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "apps/api/src/schema.ts",
  ignoreNoDocuments: true,
  generates: {
    "apps/api/src/generated/resolver-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../lib/auth.js#Context",
        useIndexSignature: true,
        scalars: { DateTime: "Date" },
        enumValues: {
          UserRole: "@uber-like/database#UserRole",
          OrderStatus: "@uber-like/database#OrderStatus",
          OfferStatus: "@uber-like/database#OfferStatus",
        },
        mappers: {
          User: "../models.js#UserModel",
          Restaurant: "../models.js#RestaurantModel",
          MenuItem: "@uber-like/database#MenuItem as MenuItemModel",
          OrderItem: "../models.js#OrderItemModel",
          Order: "../models.js#OrderModel",
          Delivery: "../models.js#DeliveryModel",
          DriverOffer: "../models.js#OfferModel",
          DriverInfo: "../models.js#DriverInfoModel",
          Rating: "@uber-like/database#Rating as RatingModel",
        },
      },
    },
    "packages/web/src/gql/": {
      preset: "client",
      documents: ["apps/user/src/**/*.tsx", "apps/restaurant/src/**/*.tsx", "apps/driver/src/**/*.tsx"],
      config: {
        scalars: { DateTime: "string" },
        enumsAsTypes: true,
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
