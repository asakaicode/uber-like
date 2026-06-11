import { UserRole } from '@uber-like/database';
import { OrderStatus } from '@uber-like/database';
import { OfferStatus } from '@uber-like/database';
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { UserModel, RestaurantModel, OrderItemModel, OrderModel, DeliveryModel, OfferModel, DriverInfoModel } from '../models.js';
import { MenuItem as MenuItemModel, Rating as RatingModel } from '@uber-like/database';
import { Context } from '../lib/auth.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  customerId?: Maybe<Scalars['ID']['output']>;
  driverId?: Maybe<Scalars['ID']['output']>;
  restaurantId?: Maybe<Scalars['ID']['output']>;
  token: Scalars['String']['output'];
  user: User;
};

export type CreateOrderInput = {
  deliveryAddress: Scalars['String']['input'];
  deliveryLat: Scalars['Float']['input'];
  deliveryLng: Scalars['Float']['input'];
  items: Array<OrderItemInput>;
  restaurantId: Scalars['ID']['input'];
};

export type Delivery = {
  __typename?: 'Delivery';
  distanceToCustomer?: Maybe<Scalars['Float']['output']>;
  distanceToRestaurant?: Maybe<Scalars['Float']['output']>;
  driver?: Maybe<DriverInfo>;
  estimatedMinutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  order: Order;
  reward?: Maybe<Scalars['Int']['output']>;
  status: Scalars['String']['output'];
  totalDistance?: Maybe<Scalars['Float']['output']>;
};

export type DriverInfo = {
  __typename?: 'DriverInfo';
  heading?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  rating: Scalars['Float']['output'];
};

export type DriverOffer = {
  __typename?: 'DriverOffer';
  createdAt: Scalars['DateTime']['output'];
  delivery: Delivery;
  distanceToCustomer?: Maybe<Scalars['Float']['output']>;
  distanceToRestaurant?: Maybe<Scalars['Float']['output']>;
  estimatedMinutes?: Maybe<Scalars['Int']['output']>;
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  order: Order;
  priority: Scalars['Float']['output'];
  reward?: Maybe<Scalars['Int']['output']>;
  routeGeometry?: Maybe<Scalars['String']['output']>;
  status: OfferStatus;
  totalDistance?: Maybe<Scalars['Float']['output']>;
};

export type DriverOfferConnection = {
  __typename?: 'DriverOfferConnection';
  edges: Array<DriverOfferEdge>;
  pageInfo: PageInfo;
};

export type DriverOfferEdge = {
  __typename?: 'DriverOfferEdge';
  cursor: Scalars['String']['output'];
  node: DriverOffer;
};

export type MenuItem = {
  __typename?: 'MenuItem';
  id: Scalars['ID']['output'];
  isAvailable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptOrder: Order;
  confirmDelivery: Delivery;
  confirmPickup: Delivery;
  createOrder: Order;
  login: AuthPayload;
  rateDriver: Rating;
  register: AuthPayload;
  rejectOrder: Order;
  respondToOffer: DriverOffer;
  setDriverOnline: DriverInfo;
  updateDriverLocation: DriverInfo;
};


export type MutationAcceptOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationConfirmDeliveryArgs = {
  deliveryId: Scalars['ID']['input'];
};


export type MutationConfirmPickupArgs = {
  deliveryId: Scalars['ID']['input'];
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRateDriverArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  orderId: Scalars['ID']['input'];
  score: Scalars['Int']['input'];
};


export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: UserRole;
};


export type MutationRejectOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationRespondToOfferArgs = {
  accept: Scalars['Boolean']['input'];
  offerId: Scalars['ID']['input'];
};


export type MutationSetDriverOnlineArgs = {
  isOnline: Scalars['Boolean']['input'];
};


export type MutationUpdateDriverLocationArgs = {
  heading?: InputMaybe<Scalars['Float']['input']>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export { OfferStatus };

export type Order = {
  __typename?: 'Order';
  createdAt: Scalars['DateTime']['output'];
  delivery?: Maybe<Delivery>;
  deliveryAddress: Scalars['String']['output'];
  deliveryLat: Scalars['Float']['output'];
  deliveryLng: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  items: Array<OrderItem>;
  rating?: Maybe<Rating>;
  restaurant: Restaurant;
  status: OrderStatus;
  totalAmount: Scalars['Int']['output'];
};

export type OrderConnection = {
  __typename?: 'OrderConnection';
  edges: Array<OrderEdge>;
  pageInfo: PageInfo;
};

export type OrderEdge = {
  __typename?: 'OrderEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  id: Scalars['ID']['output'];
  menuItem: MenuItem;
  quantity: Scalars['Int']['output'];
  unitPrice: Scalars['Int']['output'];
};

export type OrderItemInput = {
  menuItemId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export { OrderStatus };

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<User>;
  myActiveDelivery?: Maybe<Delivery>;
  myOffers: DriverOfferConnection;
  order?: Maybe<Order>;
  orders: OrderConnection;
  restaurant?: Maybe<Restaurant>;
  restaurantOrders: OrderConnection;
  restaurants: Array<Restaurant>;
};


export type QueryMyOffersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<OfferStatus>;
};


export type QueryOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<OrderStatus>;
};


export type QueryRestaurantArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRestaurantOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<OrderStatus>;
};

export type Rating = {
  __typename?: 'Rating';
  comment?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  score: Scalars['Int']['output'];
};

export type Restaurant = {
  __typename?: 'Restaurant';
  id: Scalars['ID']['output'];
  isOpen: Scalars['Boolean']['output'];
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
  menuItems: Array<MenuItem>;
  name: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  driverAssigned: Order;
  driverLocationUpdated?: Maybe<DriverInfo>;
  driverOfferReceived: DriverOffer;
  newOrder: Order;
  orderStatusChanged: Order;
};


export type SubscriptionDriverAssignedArgs = {
  orderId: Scalars['ID']['input'];
};


export type SubscriptionDriverLocationUpdatedArgs = {
  deliveryId: Scalars['ID']['input'];
};


export type SubscriptionNewOrderArgs = {
  restaurantId: Scalars['ID']['input'];
};


export type SubscriptionOrderStatusChangedArgs = {
  orderId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: UserRole;
};

export { UserRole };

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AuthPayload: ResolverTypeWrapper<Omit<AuthPayload, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateOrderInput: CreateOrderInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Delivery: ResolverTypeWrapper<DeliveryModel>;
  DriverInfo: ResolverTypeWrapper<DriverInfoModel>;
  DriverOffer: ResolverTypeWrapper<OfferModel>;
  DriverOfferConnection: ResolverTypeWrapper<Omit<DriverOfferConnection, 'edges'> & { edges: Array<ResolversTypes['DriverOfferEdge']> }>;
  DriverOfferEdge: ResolverTypeWrapper<Omit<DriverOfferEdge, 'node'> & { node: ResolversTypes['DriverOffer'] }>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  MenuItem: ResolverTypeWrapper<MenuItemModel>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  OfferStatus: OfferStatus;
  Order: ResolverTypeWrapper<OrderModel>;
  OrderConnection: ResolverTypeWrapper<Omit<OrderConnection, 'edges'> & { edges: Array<ResolversTypes['OrderEdge']> }>;
  OrderEdge: ResolverTypeWrapper<Omit<OrderEdge, 'node'> & { node: ResolversTypes['Order'] }>;
  OrderItem: ResolverTypeWrapper<OrderItemModel>;
  OrderItemInput: OrderItemInput;
  OrderStatus: OrderStatus;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Rating: ResolverTypeWrapper<RatingModel>;
  Restaurant: ResolverTypeWrapper<RestaurantModel>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  User: ResolverTypeWrapper<UserModel>;
  UserRole: UserRole;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AuthPayload: Omit<AuthPayload, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean']['output'];
  CreateOrderInput: CreateOrderInput;
  DateTime: Scalars['DateTime']['output'];
  Delivery: DeliveryModel;
  DriverInfo: DriverInfoModel;
  DriverOffer: OfferModel;
  DriverOfferConnection: Omit<DriverOfferConnection, 'edges'> & { edges: Array<ResolversParentTypes['DriverOfferEdge']> };
  DriverOfferEdge: Omit<DriverOfferEdge, 'node'> & { node: ResolversParentTypes['DriverOffer'] };
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  MenuItem: MenuItemModel;
  Mutation: Record<PropertyKey, never>;
  Order: OrderModel;
  OrderConnection: Omit<OrderConnection, 'edges'> & { edges: Array<ResolversParentTypes['OrderEdge']> };
  OrderEdge: Omit<OrderEdge, 'node'> & { node: ResolversParentTypes['Order'] };
  OrderItem: OrderItemModel;
  OrderItemInput: OrderItemInput;
  PageInfo: PageInfo;
  Query: Record<PropertyKey, never>;
  Rating: RatingModel;
  Restaurant: RestaurantModel;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  User: UserModel;
}>;

export type AuthPayloadResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  customerId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  driverId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  restaurantId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeliveryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Delivery'] = ResolversParentTypes['Delivery']> = ResolversObject<{
  distanceToCustomer?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  distanceToRestaurant?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  driver?: Resolver<Maybe<ResolversTypes['DriverInfo']>, ParentType, ContextType>;
  estimatedMinutes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Order'], ParentType, ContextType>;
  reward?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalDistance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
}>;

export type DriverInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DriverInfo'] = ResolversParentTypes['DriverInfo']> = ResolversObject<{
  heading?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lat?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  lng?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rating?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
}>;

export type DriverOfferResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DriverOffer'] = ResolversParentTypes['DriverOffer']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  delivery?: Resolver<ResolversTypes['Delivery'], ParentType, ContextType>;
  distanceToCustomer?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  distanceToRestaurant?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  estimatedMinutes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Order'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  reward?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  routeGeometry?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OfferStatus'], ParentType, ContextType>;
  totalDistance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
}>;

export type DriverOfferConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DriverOfferConnection'] = ResolversParentTypes['DriverOfferConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['DriverOfferEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
}>;

export type DriverOfferEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DriverOfferEdge'] = ResolversParentTypes['DriverOfferEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['DriverOffer'], ParentType, ContextType>;
}>;

export type MenuItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MenuItem'] = ResolversParentTypes['MenuItem']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isAvailable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  acceptOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationAcceptOrderArgs, 'orderId'>>;
  confirmDelivery?: Resolver<ResolversTypes['Delivery'], ParentType, ContextType, RequireFields<MutationConfirmDeliveryArgs, 'deliveryId'>>;
  confirmPickup?: Resolver<ResolversTypes['Delivery'], ParentType, ContextType, RequireFields<MutationConfirmPickupArgs, 'deliveryId'>>;
  createOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationCreateOrderArgs, 'input'>>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'email' | 'password'>>;
  rateDriver?: Resolver<ResolversTypes['Rating'], ParentType, ContextType, RequireFields<MutationRateDriverArgs, 'orderId' | 'score'>>;
  register?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationRegisterArgs, 'email' | 'name' | 'password' | 'role'>>;
  rejectOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationRejectOrderArgs, 'orderId'>>;
  respondToOffer?: Resolver<ResolversTypes['DriverOffer'], ParentType, ContextType, RequireFields<MutationRespondToOfferArgs, 'accept' | 'offerId'>>;
  setDriverOnline?: Resolver<ResolversTypes['DriverInfo'], ParentType, ContextType, RequireFields<MutationSetDriverOnlineArgs, 'isOnline'>>;
  updateDriverLocation?: Resolver<ResolversTypes['DriverInfo'], ParentType, ContextType, RequireFields<MutationUpdateDriverLocationArgs, 'lat' | 'lng'>>;
}>;

export type OfferStatusResolvers = EnumResolverSignature<{ ACCEPTED?: any, EXPIRED?: any, PENDING?: any, REJECTED?: any }, ResolversTypes['OfferStatus']>;

export type OrderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Order'] = ResolversParentTypes['Order']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  delivery?: Resolver<Maybe<ResolversTypes['Delivery']>, ParentType, ContextType>;
  deliveryAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deliveryLat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  deliveryLng?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['OrderItem']>, ParentType, ContextType>;
  rating?: Resolver<Maybe<ResolversTypes['Rating']>, ParentType, ContextType>;
  restaurant?: Resolver<ResolversTypes['Restaurant'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OrderStatus'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type OrderConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['OrderConnection'] = ResolversParentTypes['OrderConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['OrderEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
}>;

export type OrderEdgeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['OrderEdge'] = ResolversParentTypes['OrderEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Order'], ParentType, ContextType>;
}>;

export type OrderItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['OrderItem'] = ResolversParentTypes['OrderItem']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  menuItem?: Resolver<ResolversTypes['MenuItem'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unitPrice?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type OrderStatusResolvers = EnumResolverSignature<{ COMPLETED?: any, DELIVERED?: any, DRIVER_ASSIGNED?: any, OFFERED?: any, PENDING_RESTAURANT?: any, PICKED_UP?: any, QUEUED?: any, RESTAURANT_REJECTED?: any }, ResolversTypes['OrderStatus']>;

export type PageInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  myActiveDelivery?: Resolver<Maybe<ResolversTypes['Delivery']>, ParentType, ContextType>;
  myOffers?: Resolver<ResolversTypes['DriverOfferConnection'], ParentType, ContextType, Partial<QueryMyOffersArgs>>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType, RequireFields<QueryOrderArgs, 'id'>>;
  orders?: Resolver<ResolversTypes['OrderConnection'], ParentType, ContextType, Partial<QueryOrdersArgs>>;
  restaurant?: Resolver<Maybe<ResolversTypes['Restaurant']>, ParentType, ContextType, RequireFields<QueryRestaurantArgs, 'id'>>;
  restaurantOrders?: Resolver<ResolversTypes['OrderConnection'], ParentType, ContextType, Partial<QueryRestaurantOrdersArgs>>;
  restaurants?: Resolver<Array<ResolversTypes['Restaurant']>, ParentType, ContextType>;
}>;

export type RatingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Rating'] = ResolversParentTypes['Rating']> = ResolversObject<{
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type RestaurantResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Restaurant'] = ResolversParentTypes['Restaurant']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isOpen?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  lng?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  menuItems?: Resolver<Array<ResolversTypes['MenuItem']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  driverAssigned?: SubscriptionResolver<ResolversTypes['Order'], "driverAssigned", ParentType, ContextType, RequireFields<SubscriptionDriverAssignedArgs, 'orderId'>>;
  driverLocationUpdated?: SubscriptionResolver<Maybe<ResolversTypes['DriverInfo']>, "driverLocationUpdated", ParentType, ContextType, RequireFields<SubscriptionDriverLocationUpdatedArgs, 'deliveryId'>>;
  driverOfferReceived?: SubscriptionResolver<ResolversTypes['DriverOffer'], "driverOfferReceived", ParentType, ContextType>;
  newOrder?: SubscriptionResolver<ResolversTypes['Order'], "newOrder", ParentType, ContextType, RequireFields<SubscriptionNewOrderArgs, 'restaurantId'>>;
  orderStatusChanged?: SubscriptionResolver<ResolversTypes['Order'], "orderStatusChanged", ParentType, ContextType, RequireFields<SubscriptionOrderStatusChangedArgs, 'orderId'>>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
}>;

export type UserRoleResolvers = EnumResolverSignature<{ CUSTOMER?: any, DRIVER?: any, RESTAURANT?: any }, ResolversTypes['UserRole']>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Delivery?: DeliveryResolvers<ContextType>;
  DriverInfo?: DriverInfoResolvers<ContextType>;
  DriverOffer?: DriverOfferResolvers<ContextType>;
  DriverOfferConnection?: DriverOfferConnectionResolvers<ContextType>;
  DriverOfferEdge?: DriverOfferEdgeResolvers<ContextType>;
  MenuItem?: MenuItemResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  OfferStatus?: OfferStatusResolvers;
  Order?: OrderResolvers<ContextType>;
  OrderConnection?: OrderConnectionResolvers<ContextType>;
  OrderEdge?: OrderEdgeResolvers<ContextType>;
  OrderItem?: OrderItemResolvers<ContextType>;
  OrderStatus?: OrderStatusResolvers;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Rating?: RatingResolvers<ContextType>;
  Restaurant?: RestaurantResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserRole?: UserRoleResolvers;
}>;

