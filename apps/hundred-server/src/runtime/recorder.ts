import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { DecisionResult, World, WorldEvent } from '@hundred/domain';
import { describeEvent } from '@hundred/simulation';

export interface RunRecorder {
  recordDecision(input: {
    tick: number;
    npcId: string;
    availableActions: string[];
    result: DecisionResult;
  }): void;
  recordEvent(world: World, event: WorldEvent): void;
  directory: string;
}

const workspaceRoot = (): string => {
  let dir = process.cwd();
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir);
    if (parent === dir) {
      return process.cwd();
    }
    dir = parent;
  }
  return dir;
};

export const createRecorder = (
  world: World,
  provider: string,
  enabled: boolean,
): RunRecorder | undefined => {
  if (!enabled) {
    return undefined;
  }
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const directory = join(workspaceRoot(), 'runs', `${stamp}_seed-${world.seed}`);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'manifest.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        engineVersion: world.engineVersion,
        seed: world.seed,
        provider,
        createdAt: new Date().toISOString(),
        population: world.npcs.length,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(directory, 'decisions.jsonl'), '');
  writeFileSync(join(directory, 'events.jsonl'), '');
  return {
    directory,
    recordDecision({ tick, npcId, availableActions, result }) {
      appendFileSync(
        join(directory, 'decisions.jsonl'),
        `${JSON.stringify({
          tick,
          npcId,
          availableActions,
          probabilities: result.probabilities,
          selected: result.selected,
          provider: result.provider,
          fallback: result.fallback,
        })}\n`,
      );
    },
    recordEvent(current, event) {
      appendFileSync(
        join(directory, 'events.jsonl'),
        `${JSON.stringify({
          tick: event.tick,
          type: event.type,
          text: describeEvent(current, event),
        })}\n`,
      );
    },
  };
};
