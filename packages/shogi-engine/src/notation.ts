import { fileOf, rankOf, type Move, type PieceRole, type Role } from './types';

const FILES = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
const RANKS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export const squareToUsi = (square: number): string =>
  `${FILES[fileOf(square)]}${RANKS[rankOf(square)]}`;

const usiToSquare = (token: string): number => {
  const file = FILES.indexOf(token[0] ?? '');
  const rank = RANKS.indexOf(token[1] ?? '');
  if (file < 0 || rank < 0) {
    throw new Error(`bad square ${token}`);
  }
  return file + rank * 9;
};

const dropLetter: Record<Role, string> = {
  k: 'K',
  r: 'R',
  b: 'B',
  g: 'G',
  s: 'S',
  n: 'N',
  l: 'L',
  p: 'P',
};

export const moveToUsi = (move: Move): string => {
  if (move.kind === 'drop') {
    return `${dropLetter[move.role]}*${squareToUsi(move.to)}`;
  }
  return `${squareToUsi(move.from)}${squareToUsi(move.to)}${move.promote ? '+' : ''}`;
};

export const parseUsi = (usi: string): Move => {
  if (usi.includes('*')) {
    const [roleToken, toToken] = usi.split('*');
    const role = (roleToken ?? 'P').toLowerCase() as Role;
    return { kind: 'drop', role, to: usiToSquare(toToken ?? '5e') };
  }
  const promote = usi.endsWith('+');
  const body = promote ? usi.slice(0, -1) : usi;
  return {
    kind: 'board',
    from: usiToSquare(body.slice(0, 2)),
    to: usiToSquare(body.slice(2, 4)),
    promote,
  };
};

const ROLE_JA: Record<PieceRole, string> = {
  k: '玉',
  r: '飛',
  b: '角',
  g: '金',
  s: '銀',
  n: '桂',
  l: '香',
  p: '歩',
  '+r': '龍',
  '+b': '馬',
  '+s': '成銀',
  '+n': '成桂',
  '+l': '成香',
  '+p': 'と',
};

const NUM_JA = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export const squareToJa = (square: number): string => {
  const file = 9 - fileOf(square);
  const rank = rankOf(square) + 1;
  return `${file}${NUM_JA[rank]}`;
};

export const moveToJa = (move: Move, moving?: PieceRole): string => {
  const dest = squareToJa(move.to);
  if (move.kind === 'drop') {
    return `${dest}${ROLE_JA[move.role]}打`;
  }
  const name = ROLE_JA[moving ?? 'p'];
  const promo = move.promote ? '成' : '';
  return `${dest}${name}${promo}（${squareToUsi(move.from)}）`;
};
