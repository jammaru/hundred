import type { DecisionProvider } from '@hundred/decision';
import type { DecisionResult, Npc, World } from '@hundred/domain';
import {
  beginAction,
  buildDecisionContext,
  createRng,
  type EngineDecisionContext,
} from '@hundred/simulation';

import type { Logger } from '../logger';
import type { Hub } from '../websocket/hub';
import type { RunRecorder } from './recorder';

interface DecisionJob {
  npc: Npc;
  context: EngineDecisionContext;
}

export class DecisionScheduler {
  private modelInflight = 0;
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
  private readonly batchSize: number;

  constructor(
    world: World,
    provider: DecisionProvider,
    hub: Hub,
    recorder: RunRecorder | undefined,
    logger: Logger,
    maxConcurrency: number,
    maxQps: number,
    batchSize: number,
  ) {
    this.world = world;
    this.provider = provider;
    this.hub = hub;
    this.recorder = recorder;
    this.logger = logger;
    this.maxConcurrency = maxConcurrency;
    this.maxQps = maxQps;
    this.batchSize = Math.max(1, batchSize);
  }

  tick(): void {
    this.refill();
    const cheap: DecisionJob[] = [];
    const paid: DecisionJob[] = [];
    for (const npc of this.world.npcs) {
      if (!this.isDue(npc)) {
        continue;
      }
      const context = buildDecisionContext(this.world, npc);
      if (this.provider.needsModel?.(context)) {
        paid.push({ npc, context });
      } else {
        cheap.push({ npc, context });
      }
    }
    if (cheap.length > 0) {
      this.launch(cheap, false);
    }
    while (paid.length > 0 && this.modelInflight < this.maxConcurrency && this.tokens >= 1) {
      const batch = paid.splice(0, this.batchSize);
      this.tokens -= 1;
      this.launch(batch, true);
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

  private launch(jobs: DecisionJob[], countsAsModel: boolean): void {
    if (jobs.length === 0) {
      return;
    }
    for (const job of jobs) {
      this.pending.add(job.npc.id);
      job.npc.decision.status = 'deciding';
      this.hub.broadcast({
        type: 'decision.started',
        npcId: job.npc.id,
        tick: this.world.clock.tick,
      });
    }
    if (countsAsModel) {
      this.modelInflight += 1;
    }
    const controller = new AbortController();
    void this.provider
      .decideMany(
        jobs.map((job) => job.context),
        controller.signal,
      )
      .then((results) => {
        jobs.forEach((job, index) => {
          this.applyResult(job, results[index]);
        });
      })
      .catch((error: unknown) => {
        this.logger.warn('decision batch failed', {
          count: jobs.length,
          error: error instanceof Error ? error.message : 'unknown',
        });
        for (const job of jobs) {
          job.npc.decision.status = 'idle';
          job.npc.decision.dueTick = this.world.clock.tick + 20;
        }
      })
      .finally(() => {
        for (const job of jobs) {
          this.pending.delete(job.npc.id);
        }
        if (countsAsModel) {
          this.modelInflight -= 1;
        }
      });
  }

  private applyResult(job: DecisionJob, result: DecisionResult | undefined): void {
    const current = this.world.npcs.find((person) => person.id === job.npc.id);
    if (!current || !result) {
      return;
    }
    const rng = createRng(job.context.seed);
    beginAction(this.world, current, result, rng);
    this.recorder?.recordDecision({
      tick: job.context.tick,
      npcId: job.npc.id,
      availableActions: job.context.availableActions.map((action) => action.type),
      result,
    });
    this.hub.broadcast({
      type: 'decision.resolved',
      npcId: job.npc.id,
      tick: this.world.clock.tick,
      provider: result.provider,
      fallback: result.fallback,
      selected: result.selected,
      probabilities: Object.fromEntries(
        Object.entries(result.probabilities).map(([key, value]) => [key, value ?? 0]),
      ),
    });
    if (result.fallback) {
      this.logger.warn('decision fallback', { npcId: job.npc.id, provider: result.provider });
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.lastRefill = now;
    this.tokens = Math.min(this.maxQps, this.tokens + elapsed * this.maxQps);
  }
}
