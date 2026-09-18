import { SIMULATION_TICK_MS, type World, type WorldEvent } from '@hundred/domain';
import { applyGod, createRng, stepWorld } from '@hundred/simulation';

import type { Hub } from '../websocket/hub';
import type { RunRecorder } from './recorder';
import type { DecisionScheduler } from './scheduler';
import { eventMessage, inspectMessage, patchMessage, snapshotMessage } from './serialize';

export class SimulationRunner {
  status: 'running' | 'paused' = 'running';
  speed: 1 | 2 | 4 = 1;
  readonly world: World;
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly rng;
  inspectedId: string | undefined;
  private patchCounter = 0;
  private readonly hub: Hub;
  private readonly scheduler: DecisionScheduler;
  private readonly recorder: RunRecorder | undefined;
  private readonly provider: 'jev' | 'rules' | 'replay';

  constructor(
    world: World,
    hub: Hub,
    scheduler: DecisionScheduler,
    recorder: RunRecorder | undefined,
    provider: 'jev' | 'rules' | 'replay',
  ) {
    this.world = world;
    this.hub = hub;
    this.scheduler = scheduler;
    this.recorder = recorder;
    this.provider = provider;
    this.rng = createRng(world.seed ^ 0x51ed);
  }

  start(): void {
    this.stop();
    this.timer = setInterval(() => {
      this.advance();
    }, SIMULATION_TICK_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  pause(): void {
    this.status = 'paused';
    this.hub.broadcast({
      type: 'simulation.status',
      status: this.status,
      speed: this.speed,
      provider: this.provider,
    });
  }

  resume(): void {
    this.status = 'running';
    this.hub.broadcast({
      type: 'simulation.status',
      status: this.status,
      speed: this.speed,
      provider: this.provider,
    });
  }

  setSpeed(speed: 1 | 2 | 4): void {
    this.speed = speed;
    this.hub.broadcast({
      type: 'simulation.status',
      status: this.status,
      speed: this.speed,
      provider: this.provider,
    });
  }

  inspect(npcId: string): void {
    this.inspectedId = npcId;
    const npc = this.world.npcs.find((person) => person.id === npcId);
    if (npc) {
      this.hub.broadcast(inspectMessage(this.world, npc));
    }
  }

  godAct(
    intent: 'add_food' | 'starve' | 'rain' | 'festival' | 'close_market' | 'gift' | 'aid',
    npcId?: string,
  ): void {
    const event = applyGod(this.world, intent, npcId);
    this.world.events.push(event);
    this.recorder?.recordEvent(this.world, event);
    this.hub.broadcast(eventMessage(this.world, event));
    this.hub.broadcast(this.snapshot());
    if (this.inspectedId) {
      this.inspect(this.inspectedId);
    }
  }

  snapshot() {
    return snapshotMessage(
      this.world,
      this.provider,
      this.status,
      this.speed,
      Boolean(this.recorder),
    );
  }

  private advance(): void {
    if (this.status !== 'running') {
      return;
    }
    const events: WorldEvent[] = [];
    for (let i = 0; i < this.speed; i += 1) {
      events.push(...stepWorld(this.world, this.rng));
      this.scheduler.tick();
    }
    for (const event of events) {
      this.recorder?.recordEvent(this.world, event);
      if (
        event.type === 'theft' ||
        event.type === 'witness' ||
        event.type === 'fight' ||
        event.type === 'help' ||
        event.type === 'conversation' ||
        event.type === 'transaction' ||
        event.type === 'world_shift'
      ) {
        this.hub.broadcast(eventMessage(this.world, event));
      }
    }
    this.patchCounter += 1;
    if (this.patchCounter % 2 === 0) {
      this.hub.broadcast(patchMessage(this.world));
    }
    if (this.inspectedId) {
      const npc = this.world.npcs.find((person) => person.id === this.inspectedId);
      if (npc && this.patchCounter % 4 === 0) {
        this.hub.broadcast(inspectMessage(this.world, npc));
      }
    }
  }
}
