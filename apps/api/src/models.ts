import type {
  Delivery,
  DriverOffer,
  DriverProfile,
  MenuItem,
  Order,
  OrderItem,
  Rating,
  Restaurant,
  UserRole,
} from "@uber-like/database";

// GraphQL の各 type に対応する「resolver の親オブジェクト」型。
// リレーションは optional にし、ロードされていない場合は各 type の
// field resolver が遅延フェッチする。

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
  driver?: DriverProfile | null;
  order?: OrderModel;
};

export type OrderModel = Order & {
  items?: OrderItemModel[];
  restaurant?: RestaurantModel;
  delivery?: DeliveryModel | null;
  rating?: Rating | null;
};

export type OfferModel = DriverOffer & {
  delivery: DeliveryModel & { order: OrderModel };
};
