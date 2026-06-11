import { createClient, type Client } from "graphql-ws";
import { getToken } from "./index.js";
import { WS_URL } from "./index.js";

let wsClient: Client | null = null;
let wsToken: string | null = null;

export function getWsClient(): Client {
  const token = getToken();
  if (wsClient && token === wsToken) return wsClient;
  wsClient?.dispose();
  wsClient = createClient({
    url: WS_URL,
    connectionParams: token ? { authorization: `Bearer ${token}` } : {},
  });
  wsToken = token;
  return wsClient;
}
