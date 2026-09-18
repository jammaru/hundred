import {
  emptyHands,
  type Hands,
  type Piece,
  type PieceRole,
  type Position,
  type Role,
  type Side,
} from './types';

export const startSfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

const roleFromChar = (char: string): PieceRole => {
  const lower = char.toLowerCase();
  if (char.startsWith('+')) {
    return `+${lower.slice(1)}` as PieceRole;
  }
  return lower as PieceRole;
};

const charFromRole = (role: PieceRole, side: Side): string => {
  const map: Record<string, string> = {
    k: 'k',
    r: 'r',
    b: 'b',
    g: 'g',
    s: 's',
    n: 'n',
    l: 'l',
    p: 'p',
    '+r': '+r',
    '+b': '+b',
    '+s': '+s',
    '+n': '+n',
    '+l': '+l',
    '+p': '+p',
  };
  const token = map[role] ?? 'p';
  return side === 'sente' ? token.toUpperCase() : token;
};

const parseHands = (token: string): Hands => {
  const hands = emptyHands();
  if (!token || token === '-') {
    return hands;
  }
  let i = 0;
  while (i < token.length) {
    let count = 1;
    const head = token[i];
    if (head !== undefined && head >= '0' && head <= '9') {
      let digits = '';
      while (i < token.length && token[i]! >= '0' && token[i]! <= '9') {
        digits += token[i];
        i += 1;
      }
      count = Number(digits);
    }
    const char = token[i];
    if (!char) {
      break;
    }
    const side: Side = char === char.toUpperCase() ? 'sente' : 'gote';
    const role = char.toLowerCase() as Role;
    hands[side][role] += count;
    i += 1;
  }
  return hands;
};

export const parseSfen = (sfen: string): Position => {
  const [boardToken = '', turn = 'b', handToken = '-', plyToken = '1'] = sfen.trim().split(/\s+/);
  const board: Array<Piece | null> = Array.from({ length: 81 }, () => null);
  const ranks = boardToken.split('/');
  for (let rank = 0; rank < 9; rank += 1) {
    const row = ranks[rank] ?? '';
    let file = 0;
    for (let i = 0; i < row.length; i += 1) {
      const char = row[i]!;
      if (char >= '1' && char <= '9') {
        file += Number(char);
        continue;
      }
      const promoted = char === '+';
      const pieceChar = promoted ? row[i + 1] : char;
      if (!pieceChar) {
        break;
      }
      if (promoted) {
        i += 1;
      }
      const role = roleFromChar(promoted ? `+${pieceChar}` : pieceChar);
      const side: Side = pieceChar === pieceChar.toUpperCase() ? 'sente' : 'gote';
      board[file + rank * 9] = { side, role };
      file += 1;
    }
  }
  return {
    board,
    hands: parseHands(handToken),
    sideToMove: turn === 'w' ? 'gote' : 'sente',
    ply: Number(plyToken) || 1,
  };
};

const handToken = (hands: Hands): string => {
  const order: Role[] = ['r', 'b', 'g', 's', 'n', 'l', 'p'];
  let token = '';
  for (const side of ['sente', 'gote'] as const) {
    for (const role of order) {
      const count = hands[side][role];
      if (count <= 0) {
        continue;
      }
      if (count > 1) {
        token += String(count);
      }
      const letter = side === 'sente' ? role.toUpperCase() : role;
      token += letter;
    }
  }
  return token || '-';
};

export const makeSfen = (position: Position): string => {
  const ranks: string[] = [];
  for (let rank = 0; rank < 9; rank += 1) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 9; file += 1) {
      const piece = position.board[file + rank * 9];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        row += String(empty);
        empty = 0;
      }
      row += charFromRole(piece.role, piece.side);
    }
    if (empty > 0) {
      row += String(empty);
    }
    ranks.push(row);
  }
  const turn = position.sideToMove === 'sente' ? 'b' : 'w';
  return `${ranks.join('/')} ${turn} ${handToken(position.hands)} ${position.ply}`;
};
