/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query OfferHistory($first: Int, $after: String) {\n    myOffers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          status\n          createdAt\n          order {\n            id\n            restaurant {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.OfferHistoryDocument,
    "\n  query ActiveDelivery {\n    myActiveDelivery {\n      id\n      status\n      order {\n        id\n        status\n        deliveryLat\n        deliveryLng\n        restaurant {\n          name\n          lat\n          lng\n        }\n      }\n    }\n  }\n": typeof types.ActiveDeliveryDocument,
    "\n  mutation ConfirmPickup($deliveryId: ID!) {\n    confirmPickup(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n": typeof types.ConfirmPickupDocument,
    "\n  mutation ConfirmDelivery($deliveryId: ID!) {\n    confirmDelivery(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n": typeof types.ConfirmDeliveryDocument,
    "\n  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {\n    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {\n      id\n    }\n  }\n": typeof types.UpdateDriverLocationDocument,
    "\n  fragment OfferFields on DriverOffer {\n    id\n    status\n    expiresAt\n    totalDistance\n    estimatedMinutes\n    reward\n    order {\n      id\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n    }\n  }\n": typeof types.OfferFieldsFragmentDoc,
    "\n  query PendingOffers($first: Int, $status: OfferStatus) {\n    myOffers(first: $first, status: $status) {\n      edges {\n        node {\n          ...OfferFields\n        }\n      }\n    }\n  }\n": typeof types.PendingOffersDocument,
    "\n  subscription DriverOfferReceived {\n    driverOfferReceived {\n      ...OfferFields\n    }\n  }\n": typeof types.DriverOfferReceivedDocument,
    "\n  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {\n    respondToOffer(offerId: $offerId, accept: $accept) {\n      id\n      status\n    }\n  }\n": typeof types.RespondToOfferDocument,
    "\n  mutation SetDriverOnline($isOnline: Boolean!) {\n    setDriverOnline(isOnline: $isOnline) {\n      id\n    }\n  }\n": typeof types.SetDriverOnlineDocument,
    "\n  mutation DriverLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n": typeof types.DriverLoginDocument,
    "\n  mutation RestaurantLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      restaurantId\n    }\n  }\n": typeof types.RestaurantLoginDocument,
    "\n  query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {\n    restaurantOrders(first: $first, after: $after, status: $status) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          deliveryAddress\n          delivery {\n            id\n            driver {\n              id\n              name\n              rating\n            }\n          }\n          items {\n            id\n            quantity\n            menuItem {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.RestaurantOrdersDocument,
    "\n  subscription NewOrder($restaurantId: ID!) {\n    newOrder(restaurantId: $restaurantId) {\n      id\n    }\n  }\n": typeof types.NewOrderDocument,
    "\n  mutation AcceptOrder($orderId: ID!) {\n    acceptOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": typeof types.AcceptOrderDocument,
    "\n  mutation RejectOrder($orderId: ID!) {\n    rejectOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": typeof types.RejectOrderDocument,
    "\n  query Restaurants {\n    restaurants {\n      id\n      name\n      lat\n      lng\n      menuItems {\n        id\n        name\n        price\n      }\n    }\n  }\n": typeof types.RestaurantsDocument,
    "\n  mutation UserLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n": typeof types.UserLoginDocument,
    "\n  query OrderTrack($id: ID!) {\n    order(id: $id) {\n      id\n      status\n      totalAmount\n      deliveryAddress\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n      delivery {\n        id\n        driver {\n          id\n          name\n          rating\n          lat\n          lng\n          heading\n        }\n      }\n    }\n  }\n": typeof types.OrderTrackDocument,
    "\n  subscription OrderStatusChanged($orderId: ID!) {\n    orderStatusChanged(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": typeof types.OrderStatusChangedDocument,
    "\n  mutation RateDriver($orderId: ID!, $score: Int!, $comment: String) {\n    rateDriver(orderId: $orderId, score: $score, comment: $comment) {\n      id\n    }\n  }\n": typeof types.RateDriverDocument,
    "\n  query Orders($first: Int, $after: String) {\n    orders(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          restaurant {\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.OrdersDocument,
    "\n  query RestaurantDetail($id: ID!) {\n    restaurant(id: $id) {\n      id\n      name\n      menuItems {\n        id\n        name\n        price\n        isAvailable\n      }\n    }\n  }\n": typeof types.RestaurantDetailDocument,
    "\n  mutation CreateOrder($input: CreateOrderInput!) {\n    createOrder(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateOrderDocument,
};
const documents: Documents = {
    "\n  query OfferHistory($first: Int, $after: String) {\n    myOffers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          status\n          createdAt\n          order {\n            id\n            restaurant {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.OfferHistoryDocument,
    "\n  query ActiveDelivery {\n    myActiveDelivery {\n      id\n      status\n      order {\n        id\n        status\n        deliveryLat\n        deliveryLng\n        restaurant {\n          name\n          lat\n          lng\n        }\n      }\n    }\n  }\n": types.ActiveDeliveryDocument,
    "\n  mutation ConfirmPickup($deliveryId: ID!) {\n    confirmPickup(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n": types.ConfirmPickupDocument,
    "\n  mutation ConfirmDelivery($deliveryId: ID!) {\n    confirmDelivery(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n": types.ConfirmDeliveryDocument,
    "\n  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {\n    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {\n      id\n    }\n  }\n": types.UpdateDriverLocationDocument,
    "\n  fragment OfferFields on DriverOffer {\n    id\n    status\n    expiresAt\n    totalDistance\n    estimatedMinutes\n    reward\n    order {\n      id\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n    }\n  }\n": types.OfferFieldsFragmentDoc,
    "\n  query PendingOffers($first: Int, $status: OfferStatus) {\n    myOffers(first: $first, status: $status) {\n      edges {\n        node {\n          ...OfferFields\n        }\n      }\n    }\n  }\n": types.PendingOffersDocument,
    "\n  subscription DriverOfferReceived {\n    driverOfferReceived {\n      ...OfferFields\n    }\n  }\n": types.DriverOfferReceivedDocument,
    "\n  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {\n    respondToOffer(offerId: $offerId, accept: $accept) {\n      id\n      status\n    }\n  }\n": types.RespondToOfferDocument,
    "\n  mutation SetDriverOnline($isOnline: Boolean!) {\n    setDriverOnline(isOnline: $isOnline) {\n      id\n    }\n  }\n": types.SetDriverOnlineDocument,
    "\n  mutation DriverLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n": types.DriverLoginDocument,
    "\n  mutation RestaurantLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      restaurantId\n    }\n  }\n": types.RestaurantLoginDocument,
    "\n  query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {\n    restaurantOrders(first: $first, after: $after, status: $status) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          deliveryAddress\n          delivery {\n            id\n            driver {\n              id\n              name\n              rating\n            }\n          }\n          items {\n            id\n            quantity\n            menuItem {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.RestaurantOrdersDocument,
    "\n  subscription NewOrder($restaurantId: ID!) {\n    newOrder(restaurantId: $restaurantId) {\n      id\n    }\n  }\n": types.NewOrderDocument,
    "\n  mutation AcceptOrder($orderId: ID!) {\n    acceptOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": types.AcceptOrderDocument,
    "\n  mutation RejectOrder($orderId: ID!) {\n    rejectOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": types.RejectOrderDocument,
    "\n  query Restaurants {\n    restaurants {\n      id\n      name\n      lat\n      lng\n      menuItems {\n        id\n        name\n        price\n      }\n    }\n  }\n": types.RestaurantsDocument,
    "\n  mutation UserLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n": types.UserLoginDocument,
    "\n  query OrderTrack($id: ID!) {\n    order(id: $id) {\n      id\n      status\n      totalAmount\n      deliveryAddress\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n      delivery {\n        id\n        driver {\n          id\n          name\n          rating\n          lat\n          lng\n          heading\n        }\n      }\n    }\n  }\n": types.OrderTrackDocument,
    "\n  subscription OrderStatusChanged($orderId: ID!) {\n    orderStatusChanged(orderId: $orderId) {\n      id\n      status\n    }\n  }\n": types.OrderStatusChangedDocument,
    "\n  mutation RateDriver($orderId: ID!, $score: Int!, $comment: String) {\n    rateDriver(orderId: $orderId, score: $score, comment: $comment) {\n      id\n    }\n  }\n": types.RateDriverDocument,
    "\n  query Orders($first: Int, $after: String) {\n    orders(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          restaurant {\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.OrdersDocument,
    "\n  query RestaurantDetail($id: ID!) {\n    restaurant(id: $id) {\n      id\n      name\n      menuItems {\n        id\n        name\n        price\n        isAvailable\n      }\n    }\n  }\n": types.RestaurantDetailDocument,
    "\n  mutation CreateOrder($input: CreateOrderInput!) {\n    createOrder(input: $input) {\n      id\n    }\n  }\n": types.CreateOrderDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OfferHistory($first: Int, $after: String) {\n    myOffers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          status\n          createdAt\n          order {\n            id\n            restaurant {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query OfferHistory($first: Int, $after: String) {\n    myOffers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          status\n          createdAt\n          order {\n            id\n            restaurant {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveDelivery {\n    myActiveDelivery {\n      id\n      status\n      order {\n        id\n        status\n        deliveryLat\n        deliveryLng\n        restaurant {\n          name\n          lat\n          lng\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ActiveDelivery {\n    myActiveDelivery {\n      id\n      status\n      order {\n        id\n        status\n        deliveryLat\n        deliveryLng\n        restaurant {\n          name\n          lat\n          lng\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmPickup($deliveryId: ID!) {\n    confirmPickup(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation ConfirmPickup($deliveryId: ID!) {\n    confirmPickup(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmDelivery($deliveryId: ID!) {\n    confirmDelivery(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation ConfirmDelivery($deliveryId: ID!) {\n    confirmDelivery(deliveryId: $deliveryId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {\n    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {\n    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OfferFields on DriverOffer {\n    id\n    status\n    expiresAt\n    totalDistance\n    estimatedMinutes\n    reward\n    order {\n      id\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment OfferFields on DriverOffer {\n    id\n    status\n    expiresAt\n    totalDistance\n    estimatedMinutes\n    reward\n    order {\n      id\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingOffers($first: Int, $status: OfferStatus) {\n    myOffers(first: $first, status: $status) {\n      edges {\n        node {\n          ...OfferFields\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PendingOffers($first: Int, $status: OfferStatus) {\n    myOffers(first: $first, status: $status) {\n      edges {\n        node {\n          ...OfferFields\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DriverOfferReceived {\n    driverOfferReceived {\n      ...OfferFields\n    }\n  }\n"): (typeof documents)["\n  subscription DriverOfferReceived {\n    driverOfferReceived {\n      ...OfferFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {\n    respondToOffer(offerId: $offerId, accept: $accept) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {\n    respondToOffer(offerId: $offerId, accept: $accept) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetDriverOnline($isOnline: Boolean!) {\n    setDriverOnline(isOnline: $isOnline) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SetDriverOnline($isOnline: Boolean!) {\n    setDriverOnline(isOnline: $isOnline) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DriverLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n"): (typeof documents)["\n  mutation DriverLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RestaurantLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      restaurantId\n    }\n  }\n"): (typeof documents)["\n  mutation RestaurantLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      restaurantId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {\n    restaurantOrders(first: $first, after: $after, status: $status) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          deliveryAddress\n          delivery {\n            id\n            driver {\n              id\n              name\n              rating\n            }\n          }\n          items {\n            id\n            quantity\n            menuItem {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {\n    restaurantOrders(first: $first, after: $after, status: $status) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          deliveryAddress\n          delivery {\n            id\n            driver {\n              id\n              name\n              rating\n            }\n          }\n          items {\n            id\n            quantity\n            menuItem {\n              name\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NewOrder($restaurantId: ID!) {\n    newOrder(restaurantId: $restaurantId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  subscription NewOrder($restaurantId: ID!) {\n    newOrder(restaurantId: $restaurantId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcceptOrder($orderId: ID!) {\n    acceptOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation AcceptOrder($orderId: ID!) {\n    acceptOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RejectOrder($orderId: ID!) {\n    rejectOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RejectOrder($orderId: ID!) {\n    rejectOrder(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Restaurants {\n    restaurants {\n      id\n      name\n      lat\n      lng\n      menuItems {\n        id\n        name\n        price\n      }\n    }\n  }\n"): (typeof documents)["\n  query Restaurants {\n    restaurants {\n      id\n      name\n      lat\n      lng\n      menuItems {\n        id\n        name\n        price\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UserLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n"): (typeof documents)["\n  mutation UserLogin($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OrderTrack($id: ID!) {\n    order(id: $id) {\n      id\n      status\n      totalAmount\n      deliveryAddress\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n      delivery {\n        id\n        driver {\n          id\n          name\n          rating\n          lat\n          lng\n          heading\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query OrderTrack($id: ID!) {\n    order(id: $id) {\n      id\n      status\n      totalAmount\n      deliveryAddress\n      deliveryLat\n      deliveryLng\n      restaurant {\n        name\n        lat\n        lng\n      }\n      delivery {\n        id\n        driver {\n          id\n          name\n          rating\n          lat\n          lng\n          heading\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription OrderStatusChanged($orderId: ID!) {\n    orderStatusChanged(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  subscription OrderStatusChanged($orderId: ID!) {\n    orderStatusChanged(orderId: $orderId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RateDriver($orderId: ID!, $score: Int!, $comment: String) {\n    rateDriver(orderId: $orderId, score: $score, comment: $comment) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RateDriver($orderId: ID!, $score: Int!, $comment: String) {\n    rateDriver(orderId: $orderId, score: $score, comment: $comment) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Orders($first: Int, $after: String) {\n    orders(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          restaurant {\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Orders($first: Int, $after: String) {\n    orders(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          status\n          totalAmount\n          createdAt\n          restaurant {\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RestaurantDetail($id: ID!) {\n    restaurant(id: $id) {\n      id\n      name\n      menuItems {\n        id\n        name\n        price\n        isAvailable\n      }\n    }\n  }\n"): (typeof documents)["\n  query RestaurantDetail($id: ID!) {\n    restaurant(id: $id) {\n      id\n      name\n      menuItems {\n        id\n        name\n        price\n        isAvailable\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOrder($input: CreateOrderInput!) {\n    createOrder(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOrder($input: CreateOrderInput!) {\n    createOrder(input: $input) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;