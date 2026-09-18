import { serve } from '@hono/node-server';
import {
  isMate,
  makeSfen,
  moveToUsi,
  parseUsi,
  play,
  startPosition,
  type Move,
  type Position,
} from '@jev/shogi-engine';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { loadConfig } from './config';
import { chooseMove } from './jev';
import { describeMove, toView, type GameView } from './view';

interface Game {
  id: string;
  position: Position;
  history: GameView['history'];
  last?: Move;
}

const games = new Map<string, Game>();
const config = loadConfig();
const provider: 'jev' | 'rules' =
  config.providerMode === 'jev' && config.jevApiKey ? 'jev' : 'rules';

const snapshot = (game: Game, thinking = false): GameView =>
  toView(
    game.id,
    game.position,
    game.history,
    game.last,
    provider,
    thinking,
    makeSfen(game.position),
  );

const createGame = (): Game => {
  const game: Game = {
    id: `shogi_${Date.now().toString(36)}`,
    position: startPosition(),
    history: [],
  };
  games.set(game.id, game);
  return game;
};

const app = new Hono();
app.use(
  '/api/*',
  cors({
    origin: ['http://127.0.0.1:5191', 'http://localhost:5191', 'http://127.0.0.1:5173'],
  }),
);

app.get('/api/health', (c) => c.json({ ok: true, provider }));

app.post('/api/games', (c) => {
  const game = createGame();
  return c.json(snapshot(game));
});

app.get('/api/games/:id', (c) => {
  const game = games.get(c.req.param('id'));
  if (!game) {
    return c.json({ error: 'missing game' }, 404);
  }
  return c.json(snapshot(game));
});

app.post('/api/games/:id/move', async (c) => {
  const game = games.get(c.req.param('id'));
  if (!game) {
    return c.json({ error: 'missing game' }, 404);
  }
  const body = (await c.req.json()) as { usi?: string };
  if (!body.usi) {
    return c.json({ error: 'usi required' }, 400);
  }
  try {
    const before = game.position;
    const move = parseUsi(body.usi);
    const ja = describeMove(before, move);
    game.position = play(before, move);
    game.history.push({ usi: body.usi, ja });
    game.last = move;
  } catch {
    return c.json({ error: 'illegal move' }, 400);
  }
  if (game.position.sideToMove === 'gote' && !isMate(game.position)) {
    const ai = await chooseMove(game.position, {
      apiKey: config.jevApiKey,
      timeoutMs: config.timeoutMs,
      wantJev: provider === 'jev',
    });
    const ja = describeMove(game.position, ai.move);
    game.position = play(game.position, ai.move);
    game.history.push({
      usi: moveToUsi(ai.move),
      ja,
      provider: ai.provider,
    });
    game.last = ai.move;
  }
  return c.json(snapshot(game));
});

serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});

console.info(`[shogi] ${provider} http://${config.host}:${config.port}`);
