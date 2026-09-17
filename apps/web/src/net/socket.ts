import type { ClientMessage, NpcPublic, ServerMessage } from '@hundred/protocol';
import { serverMessageSchema } from '@hundred/protocol';

import { useUiStore } from '../stores/ui-store';
import type { WorldRuntime } from '../world/runtime';

export class SimulationSocket {
  private socket: WebSocket | undefined;
  private reconnectTimer: number | undefined;
  private disposed = false;
  private readonly runtime: WorldRuntime;

  constructor(runtime: WorldRuntime) {
    this.runtime = runtime;
  }

  connect(): void {
    if (this.disposed) {
      return;
    }
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = new WebSocket(`${protocol}://${location.host}/ws`);
    this.socket.addEventListener('message', (event) => {
      const parsed = serverMessageSchema.safeParse(JSON.parse(String(event.data)));
      if (!parsed.success) {
        return;
      }
      this.handle(parsed.data);
    });
    this.socket.addEventListener('close', () => {
      if (this.disposed) {
        return;
      }
      this.reconnectTimer = window.setTimeout(() => this.connect(), 1200);
    });
  }

  send(message: ClientMessage): void {
    this.socket?.send(JSON.stringify(message));
  }

  inspect(npcId: string): void {
    this.send({ type: 'npc.inspect', npcId });
  }

  dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }
    this.socket?.close();
  }

  private handle(message: ServerMessage): void {
    const store = useUiStore.getState();
    if (message.type === 'world.snapshot') {
      store.setSnapshot(message);
      store.setPeople(toPeople(message.npcs));
      this.runtime.applySnapshot(message);
      return;
    }
    if (message.type === 'world.patch') {
      const current = store.snapshot;
      if (current) {
        store.setSnapshot({
          ...current,
          tick: message.tick,
          day: message.day,
          minuteOfDay: message.minuteOfDay,
          food: message.food,
          averageWealth: message.averageWealth,
          incidentsToday: message.incidentsToday,
          unemployed: message.unemployed,
          helpsToday: message.helpsToday,
          fightsToday: message.fightsToday,
          weather: message.weather,
          shopOpen: message.shopOpen,
          festival: message.festival,
          npcs: message.npcs,
        });
      }
      store.setPeople(toPeople(message.npcs));
      this.runtime.applyPatch(message.npcs, message.tick);
      return;
    }
    if (message.type === 'event.created') {
      store.addEvent(message);
      return;
    }
    if (message.type === 'npc.inspected') {
      store.setInspected(message.npc);
      return;
    }
    if (message.type === 'simulation.status' && store.snapshot) {
      store.setSnapshot({
        ...store.snapshot,
        status: message.status,
        speed: message.speed,
        provider: message.provider,
      });
    }
    if (message.type === 'decision.started' || message.type === 'decision.resolved') {
      const selected = store.selectedNpcId;
      if (selected === message.npcId) {
        this.inspect(selected);
      }
    }
  }
}

const toPeople = (npcs: NpcPublic[]) => {
  const people: Record<string, NpcPublic> = {};
  for (const npc of npcs) {
    people[npc.id] = npc;
  }
  return people;
};
