import {
  isCheck,
  isMate,
  legalMoves,
  moveToJa,
  moveToUsi,
  type Move,
  type Position,
} from '@jev/shogi-engine';

interface SquareView {
  index: number;
  side: 'sente' | 'gote';
  role: string;
}

export interface GameView {
  id: string;
  sfen: string;
  squares: Array<SquareView | null>;
  hands: Position['hands'];
  sideToMove: Position['sideToMove'];
  legal: string[];
  lastUsi?: string;
  check: boolean;
  mate: boolean;
  history: Array<{ usi: string; ja: string; provider?: 'jev' | 'rules' }>;
  provider: 'jev' | 'rules';
  thinking: boolean;
}

export const toView = (
  id: string,
  position: Position,
  history: GameView['history'],
  last: Move | undefined,
  provider: 'jev' | 'rules',
  thinking: boolean,
  sfen: string,
): GameView => {
  const view: GameView = {
    id,
    sfen,
    squares: position.board.map((piece, index) =>
      piece ? { index, side: piece.side, role: piece.role } : null,
    ),
    hands: position.hands,
    sideToMove: position.sideToMove,
    legal: legalMoves(position).map(moveToUsi),
    check: isCheck(position),
    mate: isMate(position),
    history,
    provider,
    thinking,
  };
  if (last) {
    view.lastUsi = moveToUsi(last);
  }
  return view;
};

export const describeMove = (position: Position, move: Move): string => {
  const moving = move.kind === 'board' ? position.board[move.from]?.role : move.role;
  return moveToJa(move, moving);
};
