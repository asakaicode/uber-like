import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearToken, getToken } from "@uber-like/web";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { RestaurantPage } from "./pages/RestaurantPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderTrackPage } from "./pages/OrderTrackPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authed",
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/login" });
  },
  component: () => (
    <>
      <nav className="nav">
        <span className="nav-title">Uber-like</span>
        <a href="/">店舗</a>
        <a href="/orders">注文履歴</a>
        <button className="btn-secondary btn" onClick={() => { clearToken(); window.location.href = "/login"; }}>
          ログアウト
        </button>
      </nav>
      <Outlet />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/",
  component: HomePage,
});

const restaurantRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/restaurant/$id",
  component: RestaurantPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/orders",
  component: OrdersPage,
});

const orderTrackRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/orders/$id",
  component: OrderTrackPage,
});

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authedRoute.addChildren([indexRoute, restaurantRoute, ordersRoute, orderTrackRoute]),
]);
