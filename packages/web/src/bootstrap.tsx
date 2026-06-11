import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";

export function createAppBootstrap<T extends AnyRoute>(routeTree: T) {
  const queryClient = new QueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = createRouter({ routeTree } as any) as ReturnType<typeof createRouter<T>>;

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>
    </React.StrictMode>,
  );

  return router;
}
