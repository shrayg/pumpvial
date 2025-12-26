import { io } from "socket.io-client";

export function createSocket(options) {
  const baseURL = "wss://ws.pumpagent.com";
  // const baseURL = "localhost:4000";

  const query = {};

  if (options?.mints) {
    query.mints = JSON.stringify(options.mints);
  }

  if (options?.users) {
    query.users = JSON.stringify(options.users);
  }

  if (options?.pools) {
    query.pools = JSON.stringify(options.pools);
  }

  const socket = io(baseURL, {
    query,
    transports: ["websocket"],
  });

  return socket;
}
