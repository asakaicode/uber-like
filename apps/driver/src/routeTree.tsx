import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearToken, getToken } from "@uber-like/web";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

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
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/",
  component: DashboardPage,
});

export const routeTree = rootRoute.addChildren([loginRoute, authedRoute.addChildren([indexRoute])]);
