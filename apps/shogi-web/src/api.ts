import type { GameView } from './types';

const parse = async (response: Response): Promise<GameView> => {
  if (!response.ok) {
    throw new Error(`shogi ${response.status}`);
  }
  return (await response.json()) as GameView;
};

export const createGame = (): Promise<GameView> =>
  fetch('/api/games', { method: 'POST' }).then(parse);

export const playMove = (id: string, usi: string): Promise<GameView> =>
  fetch(`/api/games/${id}/move`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usi }),
  }).then(parse);
