import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { serve, upgradeWebSocket } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { POPULATION } from '@hundred/domain';
import { createWorld } from '@hundred/simulation';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WebSocketServer } from 'ws';

import { loadConfig } from './config';
import { createLogger } from './logger';
import { createDecisionProvider } from './runtime/provider';
import { createRecorder } from './runtime/recorder';
import { SimulationRunner } from './runtime/runner';
import { DecisionScheduler } from './runtime/scheduler';
import { Hub } from './websocket/hub';

const config = loadConfig();
const logger = createLogger();
const world = createWorld(config.worldSeed, POPULATION);
const { provider, id: providerId } = createDecisionProvider(config, logger);
const hub = new Hub();
const recorder = createRecorder(world, providerId, config.recordRun && providerId !== 'replay');
const scheduler = new DecisionScheduler(
  world,
  provider,
  hub,
  recorder,
  logger,
  config.maxConcurrency,
  config.maxQps,
  config.batchSize,
);
const runner = new SimulationRunner(world, hub, scheduler, recorder, providerId);

logger.info('world created', {
  seed: world.seed,
  population: world.npcs.length,
  provider: providerId,
  recording: Boolean(recorder),
});
if (recorder) {
  logger.info('recording path', { directory: recorder.directory });
}

const app = new Hono();
app.use(
  '/api/*',
  cors({
    origin: ['http://127.0.0.1:5188', 'http://localhost:5188'],
  }),
);

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    seed: world.seed,
    population: world.npcs.length,
    provider: providerId,
  }),
);

app.get(
  '/ws',
  upgradeWebSocket(() => ({
    onOpen(_event, socket) {
      hub.add(socket);
      hub.send(socket, runner.snapshot());
    },
    onMessage(event) {
      const message = hub.parse(String(event.data));
      if (!message) {
        return;
      }
      if (message.type === 'simulation.pause') {
        runner.pause();
      }
      if (message.type === 'simulation.resume') {
        runner.resume();
      }
      if (message.type === 'simulation.setSpeed') {
        runner.setSpeed(message.speed);
      }
      if (message.type === 'npc.inspect') {
        runner.inspect(message.npcId);
      }
      if (message.type === 'god.act') {
        runner.godAct(message.intent, message.npcId);
      }
    },
    onClose(_event, socket) {
      hub.remove(socket);
    },
  })),
);

const webRoot = config.webRoot ?? resolve(process.cwd(), 'apps/hundred-web/dist');
if (existsSync(webRoot)) {
  app.use('/*', serveStatic({ root: webRoot }));
  app.get('*', serveStatic({ root: webRoot, path: 'index.html' }));
}

const wss = new WebSocketServer({ noServer: true });
serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
  websocket: { server: wss as never },
});

runner.start();

const webUrl =
  existsSync(webRoot) && process.env.NODE_ENV === 'production'
    ? `http://${config.host}:${config.port}`
    : 'http://127.0.0.1:5188';

console.info(`
Hundred

World seed: ${world.seed}
Population: ${world.npcs.length}

Decision provider: ${providerId === 'jev' ? 'Jev' : providerId === 'replay' ? 'Replay' : 'Rules'}
Recording: ${recorder ? 'enabled' : 'disabled'}

Web:
${webUrl}
`);
