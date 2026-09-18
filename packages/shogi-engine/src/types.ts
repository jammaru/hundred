export type Side = 'sente' | 'gote';

export type Role = 'k' | 'r' | 'b' | 'g' | 's' | 'n' | 'l' | 'p';

export type PieceRole = Role | '+r' | '+b' | '+s' | '+n' | '+l' | '+p';

export interface Piece {
  side: Side;
  role: PieceRole;
}

export interface DropMove {
  kind: 'drop';
  role: Role;
  to: number;
}

export interface BoardMove {
  kind: 'board';
  from: number;
  to: number;
  promote: boolean;
}

export type Move = DropMove | BoardMove;

export type Hands = Record<Side, Record<Role, number>>;

export interface Position {
  board: Array<Piece | null>;
  hands: Hands;
  sideToMove: Side;
  ply: number;
}

const FILES = 9;

export const fileOf = (square: number): number => square % FILES;
export const rankOf = (square: number): number => Math.floor(square / FILES);
export const at = (file: number, rank: number): number => file + rank * FILES;

export const other = (side: Side): Side => (side === 'sente' ? 'gote' : 'sente');

export const baseRole = (role: PieceRole): Role =>
  role.startsWith('+') ? (role.slice(1) as Role) : (role as Role);

export const canPromoteRole = (role: PieceRole): role is Role =>
  role === 'p' || role === 'l' || role === 'n' || role === 's' || role === 'b' || role === 'r';

export const promoteRole = (role: PieceRole): PieceRole => {
  if (role === 'p') {
    return '+p';
  }
  if (role === 'l') {
    return '+l';
  }
  if (role === 'n') {
    return '+n';
  }
  if (role === 's') {
    return '+s';
  }
  if (role === 'b') {
    return '+b';
  }
  if (role === 'r') {
    return '+r';
  }
  return role;
};

export const emptyHands = (): Hands => ({
  sente: { k: 0, r: 0, b: 0, g: 0, s: 0, n: 0, l: 0, p: 0 },
  gote: { k: 0, r: 0, b: 0, g: 0, s: 0, n: 0, l: 0, p: 0 },
});

export const cloneHands = (hands: Hands): Hands => ({
  sente: { ...hands.sente },
  gote: { ...hands.gote },
});
