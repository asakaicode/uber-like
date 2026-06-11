import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";
import { buildContext, schema } from "./context.js";
import type { Context } from "./lib/auth.js";
import { prisma } from "@uber-like/database";

const port = Number(process.env.API_PORT ?? 4000);

const yoga = createYoga<{ request: Request }, Context>({
  schema,
  context: ({ request }) => buildContext(request.headers.get("authorization")),
  graphiql: true,
  maskedErrors: false,
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true,
  },
});

const server = createServer(yoga);
const wss = new WebSocketServer({ server, path: yoga.graphqlEndpoint });

useServer(
  {
    schema,
    context: (ctx) => {
      const auth = ctx.connectionParams?.authorization as string | undefined;
      return buildContext(auth ?? null);
    },
  },
  wss,
);

server.listen(port, "0.0.0.0", () => {
  console.log(`GraphQL API running at http://0.0.0.0:${port}${yoga.graphqlEndpoint}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
