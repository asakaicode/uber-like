import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearToken, getToken } from "@uber-like/web";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

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
        <span className="nav-title">Restaurant</span>
        <a href="/">注文受信箱</a>
        <button className="btn btn-secondary" onClick={() => { clearToken(); window.location.href = "/login"; }}>
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
  component: OrdersPage,
});

export const routeTree = rootRoute.addChildren([loginRoute, authedRoute.addChildren([indexRoute])]);
