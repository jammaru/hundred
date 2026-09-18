import type { PieceRole, Role } from '@jev/shogi-engine';

const KANJI: Record<string, string> = {
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
  '+s': '全',
  '+n': '圭',
  '+l': '杏',
  '+p': 'と',
};

export const HAND_ORDER: Role[] = ['r', 'b', 'g', 's', 'n', 'l', 'p'];

export const kanjiOf = (role: string, side: 'sente' | 'gote'): string => {
  if (role === 'k') {
    return side === 'sente' ? '玉' : '王';
  }
  return KANJI[role] ?? role;
};

export const isPromoted = (role: string): boolean => role.startsWith('+');

export const roleLabel = (role: PieceRole | Role): string => KANJI[role] ?? role;
