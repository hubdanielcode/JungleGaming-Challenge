import { io, type Socket } from "socket.io-client";
import { environmentConfig } from "@/lib/env";
import type { RealtimeEvent } from "@/types";

/* - O cliente mantém uma conexão por sessão e descarta eventos antigos pela versão do recurso. - */

class RealtimeClient {
  private socket: Socket | null = null;
  private currentSessionId: string | null = null;
  private lastVersionByResource = new Map<string, number>();
  private hasConnectedBefore = false;

  /* - A sessão vai na query string (não em "auth") porque o binding de mocks do Socket.IO só decodifica pacotes de evento, não o handshake de conexão. - */

  connect(sessionId: string): Socket {
    if (this.socket && this.currentSessionId === sessionId) {
      return this.socket;
    }

    this.disconnect();
    this.currentSessionId = sessionId;
    this.lastVersionByResource.clear();
    this.hasConnectedBefore = false;
    this.socket = io(environmentConfig.socketUrl, {
      transports: ["websocket"],
      query: { sessionId },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.currentSessionId = null;
    this.lastVersionByResource.clear();
    this.hasConnectedBefore = false;
  }

  /* - Dispara só a partir da segunda vez que o socket conecta, ou seja, numa reconexão de
   *   verdade — não na conexão inicial, que já é coberta pelo primeiro fetch natural de cada
   *   consulta do TanStack Query. O evento nativo "connect" do Socket.IO não faz essa distinção
   *   sozinho, por isso guardamos "hasConnectedBefore" por sessão. - */

  onReconnect(handler: () => void) {
    if (!this.socket) {
      return () => undefined;
    }

    const handleConnect = () => {
      if (this.hasConnectedBefore) {
        handler();
      }

      this.hasConnectedBefore = true;
    };

    this.socket.on("connect", handleConnect);

    return () => {
      this.socket?.off("connect", handleConnect);
    };
  }

  onConnectionLost(handler: () => void) {
    this.socket?.on("disconnect", handler);
    return () => {
      this.socket?.off("disconnect", handler);
    };
  }

  onResourceEvent<TPayload>(eventName: string, handler: (eventEnvelope: RealtimeEvent<TPayload>) => void) {
    if (!this.socket) {
      return () => undefined;
    }

    const handleResourceEvent = (eventEnvelope: RealtimeEvent<TPayload>) => {
      const resourceKey = `${eventEnvelope.resource}:${eventEnvelope.resourceId}`;
      const lastAppliedVersion = this.lastVersionByResource.get(resourceKey) ?? 0;

      if (eventEnvelope.version <= lastAppliedVersion) {
        return;
      }

      this.lastVersionByResource.set(resourceKey, eventEnvelope.version);
      handler(eventEnvelope);
    };

    this.socket.on(eventName, handleResourceEvent);

    return () => {
      this.socket?.off(eventName, handleResourceEvent);
    };
  }
}

export const realtimeClient = new RealtimeClient();
