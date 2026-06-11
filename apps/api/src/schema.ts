export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum UserRole {
    CUSTOMER
    RESTAURANT
    DRIVER
  }

  enum OrderStatus {
    PENDING_RESTAURANT
    RESTAURANT_REJECTED
    QUEUED
    OFFERED
    DRIVER_ASSIGNED
    PICKED_UP
    DELIVERED
    COMPLETED
  }

  enum OfferStatus {
    PENDING
    ACCEPTED
    REJECTED
    EXPIRED
  }

  type User {
    id: ID!
    email: String!
    role: UserRole!
  }

  type AuthPayload {
    token: String!
    user: User!
    customerId: ID
    restaurantId: ID
    driverId: ID
  }

  type Restaurant {
    id: ID!
    name: String!
    lat: Float!
    lng: Float!
    isOpen: Boolean!
    menuItems: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    price: Int!
    isAvailable: Boolean!
  }

  type OrderItem {
    id: ID!
    quantity: Int!
    unitPrice: Int!
    menuItem: MenuItem!
  }

  type DriverInfo {
    id: ID!
    name: String!
    rating: Float!
    lat: Float
    lng: Float
    heading: Float
  }

  type Delivery {
    id: ID!
    status: String!
    driver: DriverInfo
    order: Order!
    distanceToRestaurant: Float
    distanceToCustomer: Float
    totalDistance: Float
    estimatedMinutes: Int
    reward: Int
  }

  type Rating {
    id: ID!
    score: Int!
    comment: String
  }

  type Order {
    id: ID!
    status: OrderStatus!
    totalAmount: Int!
    deliveryAddress: String!
    deliveryLat: Float!
    deliveryLng: Float!
    createdAt: DateTime!
    restaurant: Restaurant!
    items: [OrderItem!]!
    delivery: Delivery
    rating: Rating
  }

  type DriverOffer {
    id: ID!
    status: OfferStatus!
    priority: Float!
    expiresAt: DateTime!
    createdAt: DateTime!
    delivery: Delivery!
    order: Order!
    distanceToRestaurant: Float
    distanceToCustomer: Float
    totalDistance: Float
    estimatedMinutes: Int
    reward: Int
    routeGeometry: String
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type OrderEdge {
    cursor: String!
    node: Order!
  }

  type OrderConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
  }

  type DriverOfferEdge {
    cursor: String!
    node: DriverOffer!
  }

  type DriverOfferConnection {
    edges: [DriverOfferEdge!]!
    pageInfo: PageInfo!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    restaurantId: ID!
    items: [OrderItemInput!]!
    deliveryAddress: String!
    deliveryLat: Float!
    deliveryLng: Float!
  }

  type Query {
    me: User
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    order(id: ID!): Order
    orders(first: Int, after: String, status: OrderStatus): OrderConnection!
    restaurantOrders(first: Int, after: String, status: OrderStatus): OrderConnection!
    myOffers(first: Int, after: String, status: OfferStatus): DriverOfferConnection!
    myActiveDelivery: Delivery
  }

  type Mutation {
    register(email: String!, password: String!, name: String!, role: UserRole!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createOrder(input: CreateOrderInput!): Order!
    acceptOrder(orderId: ID!): Order!
    rejectOrder(orderId: ID!): Order!
    setDriverOnline(isOnline: Boolean!): DriverInfo!
    updateDriverLocation(lat: Float!, lng: Float!, heading: Float): DriverInfo!
    respondToOffer(offerId: ID!, accept: Boolean!): DriverOffer!
    confirmPickup(deliveryId: ID!): Delivery!
    confirmDelivery(deliveryId: ID!): Delivery!
    rateDriver(orderId: ID!, score: Int!, comment: String): Rating!
  }

  type Subscription {
    orderStatusChanged(orderId: ID!): Order!
    newOrder(restaurantId: ID!): Order!
    driverOfferReceived: DriverOffer!
    driverAssigned(orderId: ID!): Order!
    driverLocationUpdated(deliveryId: ID!): DriverInfo
  }
`;
