import { Link, Outlet, createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { getToken, logout } from "@uber-like/web";
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
        <Link to="/">注文受信箱</Link>
        <button className="btn btn-secondary" onClick={logout}>
          ログアウト
        </button>
      </nav>
      <Outlet />
    </>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => authedRoute, path: "/", component: OrdersPage });

export const routeTree = rootRoute.addChildren([loginRoute, authedRoute.addChildren([indexRoute])]);
