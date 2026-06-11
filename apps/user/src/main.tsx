import "@uber-like/web/styles";
import { createAppBootstrap } from "@uber-like/web";
import { routeTree } from "./routeTree";

const router = createAppBootstrap(routeTree);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
