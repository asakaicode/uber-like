import type {
  Delivery,
  DriverLocation,
  DriverOffer,
  DriverProfile,
  MenuItem,
  Order,
  OrderItem,
  Rating,
  Restaurant,
  UserRole,
} from "@uber-like/database";

export interface UserModel {
  id: string;
  email: string;
  role: UserRole;
}

export interface DriverInfoModel {
  id: string;
  name: string;
  rating: number;
  lat: number | null;
  lng: number | null;
  heading: number | null;
}

export type RestaurantModel = Restaurant & { menuItems?: MenuItem[] };
export type OrderItemModel = OrderItem & { menuItem: MenuItem };
export type DeliveryModel = Delivery & {
  driver?: (DriverProfile & { locations?: DriverLocation[] }) | null;
  order?: OrderModel;
};
export type OrderModel = Order & {
  items?: OrderItemModel[];
  restaurant?: RestaurantModel;
  delivery?: DeliveryModel | null;
  rating?: Rating | null;
};
export type OfferModel = DriverOffer & { delivery: DeliveryModel & { order: OrderModel } };
