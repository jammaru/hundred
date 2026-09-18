import { at, fileOf, rankOf, type Piece, type PieceRole, type Side } from './types';

const onBoard = (file: number, rank: number): boolean =>
  file >= 0 && file < 9 && rank >= 0 && rank < 9;

const step = (square: number, df: number, dr: number): number | undefined => {
  const file = fileOf(square) + df;
  const rank = rankOf(square) + dr;
  return onBoard(file, rank) ? at(file, rank) : undefined;
};

const GOLD: Record<Side, Array<[number, number]>> = {
  sente: [
    [0, -1],
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ],
  gote: [
    [0, 1],
    [-1, 1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
  ],
};

const SILVER: Record<Side, Array<[number, number]>> = {
  sente: [
    [0, -1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  gote: [
    [0, 1],
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ],
};

const KING: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const KNIGHT: Record<Side, Array<[number, number]>> = {
  sente: [
    [-1, -2],
    [1, -2],
  ],
  gote: [
    [-1, 2],
    [1, 2],
  ],
};

const RAY_ORTHO: Array<[number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const RAY_DIAG: Array<[number, number]> = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const collectSteps = (
  board: Array<Piece | null>,
  from: number,
  side: Side,
  deltas: Array<[number, number]>,
): number[] => {
  const targets: number[] = [];
  for (const [df, dr] of deltas) {
    const to = step(from, df, dr);
    if (to === undefined) {
      continue;
    }
    const occupant = board[to];
    if (!occupant || occupant.side !== side) {
      targets.push(to);
    }
  }
  return targets;
};

const collectRays = (
  board: Array<Piece | null>,
  from: number,
  side: Side,
  deltas: Array<[number, number]>,
): number[] => {
  const targets: number[] = [];
  for (const [df, dr] of deltas) {
    let file = fileOf(from) + df;
    let rank = rankOf(from) + dr;
    while (onBoard(file, rank)) {
      const to = at(file, rank);
      const occupant = board[to];
      if (!occupant) {
        targets.push(to);
      } else {
        if (occupant.side !== side) {
          targets.push(to);
        }
        break;
      }
      file += df;
      rank += dr;
    }
  }
  return targets;
};

export const attacksFrom = (board: Array<Piece | null>, from: number, piece: Piece): number[] => {
  const { side, role } = piece;
  if (role === 'k') {
    return collectSteps(board, from, side, KING);
  }
  if (role === 'g' || role === '+p' || role === '+l' || role === '+n' || role === '+s') {
    return collectSteps(board, from, side, GOLD[side]);
  }
  if (role === 's') {
    return collectSteps(board, from, side, SILVER[side]);
  }
  if (role === 'n') {
    return collectSteps(board, from, side, KNIGHT[side]);
  }
  if (role === 'p') {
    return collectSteps(board, from, side, [[0, side === 'sente' ? -1 : 1]]);
  }
  if (role === 'l') {
    return collectRays(board, from, side, [[0, side === 'sente' ? -1 : 1]]);
  }
  if (role === 'b') {
    return collectRays(board, from, side, RAY_DIAG);
  }
  if (role === 'r') {
    return collectRays(board, from, side, RAY_ORTHO);
  }
  if (role === '+b') {
    return [...collectRays(board, from, side, RAY_DIAG), ...collectSteps(board, from, side, KING)];
  }
  if (role === '+r') {
    return [...collectRays(board, from, side, RAY_ORTHO), ...collectSteps(board, from, side, KING)];
  }
  return [];
};

export const isAttacked = (board: Array<Piece | null>, square: number, by: Side): boolean => {
  for (let from = 0; from < 81; from += 1) {
    const piece = board[from];
    if (!piece || piece.side !== by) {
      continue;
    }
    if (attacksFrom(board, from, piece).includes(square)) {
      return true;
    }
  }
  return false;
};

export const kingSquare = (board: Array<Piece | null>, side: Side): number | undefined => {
  for (let square = 0; square < 81; square += 1) {
    const piece = board[square];
    if (piece?.side === side && piece.role === 'k') {
      return square;
    }
  }
  return undefined;
};

const lastRank = (side: Side): number => (side === 'sente' ? 0 : 8);

export const inPromoZone = (square: number, side: Side): boolean => {
  const rank = rankOf(square);
  return side === 'sente' ? rank <= 2 : rank >= 6;
};

export const forcedPromotion = (role: PieceRole, to: number, side: Side): boolean => {
  const rank = rankOf(to);
  if (role === 'p' || role === 'l') {
    return rank === lastRank(side);
  }
  if (role === 'n') {
    return side === 'sente' ? rank <= 1 : rank >= 7;
  }
  return false;
};
