interface SquareView {
  index: number;
  side: 'sente' | 'gote';
  role: string;
}

export interface GameView {
  id: string;
  sfen: string;
  squares: Array<SquareView | null>;
  hands: {
    sente: Record<string, number>;
    gote: Record<string, number>;
  };
  sideToMove: 'sente' | 'gote';
  legal: string[];
  lastUsi?: string;
  check: boolean;
  mate: boolean;
  history: Array<{ usi: string; ja: string; provider?: 'jev' | 'rules' }>;
  provider: 'jev' | 'rules';
  thinking: boolean;
}
