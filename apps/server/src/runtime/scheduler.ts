import type { DecisionProvider } from '@hundred/decision';
import type { Npc, World } from '@hundred/domain';
import { buildDecisionContext, createRng } from '@hundred/simulation';
import { beginAction } from '@hundred/simulation';

import type { Logger } from '../logger';
import type { Hub } from '../websocket/hub';
import type { RunRecorder } from './recorder';

export class DecisionScheduler {
  private inflight = 0;
  private tokens = 0;
  private lastRefill = Date.now();
  private readonly pending = new Set<string>();
  private readonly world: World;
  private readonly provider: DecisionProvider;
  private readonly hub: Hub;
  private readonly recorder: RunRecorder | undefined;
  private readonly logger: Logger;
  private readonly maxConcurrency: number;
  private readonly maxQps: number;

  constructor(
    world: World,
    provider: DecisionProvider,
    hub: Hub,
    recorder: RunRecorder | undefined,
    logger: Logger,
    maxConcurrency: number,
    maxQps: number,
  ) {
    this.world = world;
    this.provider = provider;
    this.hub = hub;
    this.recorder = recorder;
    this.logger = logger;
    this.maxConcurrency = maxConcurrency;
    this.maxQps = maxQps;
  }

  tick(): void {
    this.refill();
    const due = this.world.npcs.filter((npc) => this.isDue(npc));
    for (const npc of due) {
      if (this.inflight >= this.maxConcurrency || this.tokens < 1) {
        break;
      }
      this.tokens -= 1;
      this.launch(npc);
    }
  }

  private isDue(npc: Npc): boolean {
    if (this.pending.has(npc.id) || npc.decision.status === 'deciding') {
      return false;
    }
    if (npc.action.phase === 'moving' || npc.action.phase === 'acting') {
      return false;
    }
    return this.world.clock.tick >= npc.decision.dueTick;
  }

  private launch(npc: Npc): void {
    this.pending.add(npc.id);
    this.inflight += 1;
    npc.decision.status = 'deciding';
    const context = buildDecisionContext(this.world, npc);
    this.hub.broadcast({ type: 'decision.started', npcId: npc.id, tick: this.world.clock.tick });
    const controller = new AbortController();
    void this.provider
      .decide(context, controller.signal)
      .then((result) => {
        const current = this.world.npcs.find((person) => person.id === npc.id);
        if (!current) {
          return;
        }
        const rng = createRng(context.seed);
        beginAction(this.world, current, result, rng);
        this.recorder?.recordDecision({
          tick: context.tick,
          npcId: npc.id,
          availableActions: context.availableActions.map((action) => action.type),
          result,
        });
        this.hub.broadcast({
          type: 'decision.resolved',
          npcId: npc.id,
          tick: this.world.clock.tick,
          provider: result.provider,
          fallback: result.fallback,
          selected: result.selected,
          probabilities: Object.fromEntries(
            Object.entries(result.probabilities).map(([key, value]) => [key, value ?? 0]),
          ),
        });
        if (result.fallback) {
          this.logger.warn('decision fallback', { npcId: npc.id, provider: result.provider });
        }
      })
      .catch((error: unknown) => {
        this.logger.warn('decision failed', {
          npcId: npc.id,
          error: error instanceof Error ? error.message : 'unknown',
        });
        npc.decision.status = 'idle';
        npc.decision.dueTick = this.world.clock.tick + 20;
      })
      .finally(() => {
        this.pending.delete(npc.id);
        this.inflight -= 1;
      });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.lastRefill = now;
    this.tokens = Math.min(this.maxQps, this.tokens + elapsed * this.maxQps);
  }
}
