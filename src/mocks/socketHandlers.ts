import { toSocketIo } from "@mswjs/socket.io-binding";
import { ws } from "msw";
import type { WebSocketHandlerConnection } from "msw";
import { environmentConfig } from "@/lib/env";
import { realtimeBus } from "./realtimeBus";
import { getScenarioConfig } from "./scenarios";

/* - O binding permite que o socket.io-client real seja exercitado através do Mock Service Worker. - */

const socketLink = ws.link(environmentConfig.socketUrl);

type SocketIoConnection = ReturnType<typeof toSocketIo>;

/* - O MSW v2 e o @mswjs/socket.io-binding divergem no tipo de `connection` (WebSocketHandlerConnection vs WebSocketConnectionData do @mswjs/interceptors). É uma incompatibilidade conhecida do pacote, sem impacto em runtime,por isso o cast via `unknown` isolado nesta função. - */

const toSocketIoConnection = (connection: WebSocketHandlerConnection) => toSocketIo(connection as unknown as Parameters<typeof toSocketIo>[0]);

const connectedSockets = new Set<SocketIoConnection["server"]>();

const socketHandler = socketLink.addEventListener("connection", (connection) => {
  const socket = toSocketIoConnection(connection);

  if (getScenarioConfig().offline) {
    connection.client.close();
    return;
  }

  connectedSockets.add(socket.server);

  connection.client.addEventListener("close", () => {
    connectedSockets.delete(socket.server);
  });
});

realtimeBus.subscribe((eventName, eventEnvelope) => {
  for (const socket of connectedSockets) {
    socket.emit(eventName, eventEnvelope);
  }
});

export const socketHandlers = [socketHandler];
