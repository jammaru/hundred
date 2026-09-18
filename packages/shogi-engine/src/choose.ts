import { isCheck } from './position';
import { play as apply } from './position';
import { baseRole, type Move, type Position } from './types';

const VALUE: Record<string, number> = {
  p: 1,
  l: 3,
  n: 4,
  s: 5,
  g: 6,
  b: 8,
  r: 10,
  k: 0,
  '+p': 4,
  '+l': 4,
  '+n': 4,
  '+s': 5,
  '+b': 10,
  '+r': 12,
};

export const scoreMove = (position: Position, move: Move): number => {
  let score = 0;
  if (move.kind === 'board') {
    const victim = position.board[move.to];
    if (victim) {
      score += (VALUE[victim.role] ?? 0) * 12;
    }
    if (move.promote) {
      score += 18;
    }
    const mover = position.board[move.from];
    if (mover && baseRole(mover.role) === 'p') {
      score += 1;
    }
  } else {
    score += (VALUE[move.role] ?? 0) + 2;
  }
  const next = apply(position, move);
  if (isCheck(next)) {
    score += 22;
  }
  return score;
};

export const pickRulesMove = (position: Position, moves: Move[]): Move => {
  const ranked = [...moves].sort((a, b) => scoreMove(position, b) - scoreMove(position, a));
  return ranked[0] ?? moves[0]!;
};

export const candidateMoves = (position: Position, moves: Move[], limit = 16): Move[] => {
  if (moves.length <= limit) {
    return moves;
  }
  const ranked = [...moves].sort((a, b) => scoreMove(position, b) - scoreMove(position, a));
  return ranked.slice(0, limit);
};
