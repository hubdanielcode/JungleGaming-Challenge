import type { RealtimeEvent } from "@/types";

type RealtimeListener = (eventName: string, eventEnvelope: RealtimeEvent<unknown>) => void;

let nextEventVersionNumber = 1;

const getNextEventVersion = () => {
  return nextEventVersionNumber++;
};

class RealtimeBus {
  private listeners = new Set<RealtimeListener>();

  subscribe(listener: RealtimeListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit<TPayload>(eventName: string, resourceName: string, resourceId: string, payload: TPayload, resourceVersion = getNextEventVersion()) {
    const eventEnvelope: RealtimeEvent<TPayload> = {
      id: `evt_${Math.random().toString(36).slice(2)}`,
      resource: resourceName,
      resourceId,
      version: resourceVersion,
      emittedAt: new Date().toISOString(),
      payload,
    };

    for (const listener of this.listeners) {
      listener(eventName, eventEnvelope as RealtimeEvent<unknown>);
    }
  }
}

export const realtimeBus = new RealtimeBus();

export { getNextEventVersion };
