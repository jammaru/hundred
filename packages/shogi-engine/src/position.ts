import { attacksFrom, forcedPromotion, inPromoZone, isAttacked, kingSquare } from './attacks';
import { parseSfen, startSfen } from './sfen';
import {
  baseRole,
  canPromoteRole,
  cloneHands,
  fileOf,
  other,
  promoteRole,
  rankOf,
  type BoardMove,
  type DropMove,
  type Move,
  type Piece,
  type Position,
  type Role,
  type Side,
} from './types';

export const startPosition = (): Position => parseSfen(startSfen);

const copyBoard = (board: Array<Piece | null>): Array<Piece | null> => board.slice();

export const clonePosition = (position: Position): Position => ({
  board: copyBoard(position.board),
  hands: cloneHands(position.hands),
  sideToMove: position.sideToMove,
  ply: position.ply,
});

const playOn = (position: Position, move: Move): Position => {
  const next = clonePosition(position);
  const side = next.sideToMove;
  if (move.kind === 'drop') {
    next.hands[side][move.role] -= 1;
    next.board[move.to] = { side, role: move.role };
  } else {
    const piece = next.board[move.from];
    if (!piece) {
      return next;
    }
    const captured = next.board[move.to];
    if (captured) {
      next.hands[side][baseRole(captured.role)] += 1;
    }
    next.board[move.from] = null;
    const role = move.promote ? promoteRole(piece.role) : piece.role;
    next.board[move.to] = { side, role };
  }
  next.sideToMove = other(side);
  next.ply += 1;
  return next;
};

const inCheck = (position: Position, side: Side): boolean => {
  const king = kingSquare(position.board, side);
  return king !== undefined && isAttacked(position.board, king, other(side));
};

const hasUnpromotedPawnOnFile = (position: Position, side: Side, file: number): boolean => {
  for (let rank = 0; rank < 9; rank += 1) {
    const piece = position.board[file + rank * 9];
    if (piece?.side === side && piece.role === 'p') {
      return true;
    }
  }
  return false;
};

const canDropPawnMate = (position: Position, to: number, side: Side): boolean => {
  const trial: Position = {
    board: copyBoard(position.board),
    hands: cloneHands(position.hands),
    sideToMove: side,
    ply: position.ply,
  };
  trial.board[to] = { side, role: 'p' };
  trial.hands[side].p -= 1;
  trial.sideToMove = other(side);
  if (!inCheck(trial, trial.sideToMove)) {
    return false;
  }
  return legalMovesFrom(trial, true).length === 0;
};

const boardMoves = (position: Position): BoardMove[] => {
  const moves: BoardMove[] = [];
  const side = position.sideToMove;
  for (let from = 0; from < 81; from += 1) {
    const piece = position.board[from];
    if (!piece || piece.side !== side) {
      continue;
    }
    for (const to of attacksFrom(position.board, from, piece)) {
      const zone = inPromoZone(from, side) || inPromoZone(to, side);
      const must = forcedPromotion(piece.role, to, side);
      if (must) {
        moves.push({ kind: 'board', from, to, promote: true });
        continue;
      }
      moves.push({ kind: 'board', from, to, promote: false });
      if (zone && canPromoteRole(piece.role)) {
        moves.push({ kind: 'board', from, to, promote: true });
      }
    }
  }
  return moves;
};

const dropMoves = (position: Position, ignoreUchifuzume: boolean): DropMove[] => {
  const moves: DropMove[] = [];
  const side = position.sideToMove;
  const empty: number[] = [];
  for (let square = 0; square < 81; square += 1) {
    if (!position.board[square]) {
      empty.push(square);
    }
  }
  const roles = (Object.keys(position.hands[side]) as Role[]).filter(
    (role) => role !== 'k' && position.hands[side][role] > 0,
  );
  for (const role of roles) {
    for (const to of empty) {
      const rank = rankOf(to);
      if (role === 'p' || role === 'l') {
        if (rank === (side === 'sente' ? 0 : 8)) {
          continue;
        }
      }
      if (role === 'n') {
        if (side === 'sente' ? rank <= 1 : rank >= 7) {
          continue;
        }
      }
      if (role === 'p' && hasUnpromotedPawnOnFile(position, side, fileOf(to))) {
        continue;
      }
      if (!ignoreUchifuzume && role === 'p' && canDropPawnMate(position, to, side)) {
        continue;
      }
      moves.push({ kind: 'drop', role, to });
    }
  }
  return moves;
};

const legalMovesFrom = (position: Position, ignoreUchifuzume = false): Move[] => {
  const side = position.sideToMove;
  const candidates: Move[] = [...boardMoves(position), ...dropMoves(position, ignoreUchifuzume)];
  return candidates.filter((move) => !inCheck(playOn(position, move), side));
};

export const legalMoves = (position: Position): Move[] => legalMovesFrom(position);

export const play = (position: Position, move: Move): Position => {
  const legal = legalMovesFrom(position);
  const match = legal.find((item) => sameMove(item, move));
  if (!match) {
    throw new Error('illegal move');
  }
  return playOn(position, match);
};

export const sameMove = (a: Move, b: Move): boolean => {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'drop' && b.kind === 'drop') {
    return a.role === b.role && a.to === b.to;
  }
  if (a.kind === 'board' && b.kind === 'board') {
    return a.from === b.from && a.to === b.to && a.promote === b.promote;
  }
  return false;
};

export const isCheck = (position: Position): boolean => inCheck(position, position.sideToMove);

export const isMate = (position: Position): boolean =>
  isCheck(position) && legalMovesFrom(position).length === 0;

export const isStalemate = (position: Position): boolean =>
  !isCheck(position) && legalMovesFrom(position).length === 0;
