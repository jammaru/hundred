import { parseUsi, squareToUsi, type Role } from '@jev/shogi-engine';

import { Koma } from './Koma';
import type { GameView } from './types';

const FILES = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
const RANKS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HOSHI = new Set([30, 32, 48, 50]);

interface BoardProps {
  game: GameView;
  selectedFrom?: number;
  selectedDrop?: Role;
  targets: Set<number>;
  onSquare: (index: number) => void;
  disabled?: boolean;
}

const lastSquares = (lastUsi: string): Set<number> => {
  try {
    const move = parseUsi(lastUsi);
    return move.kind === 'drop' ? new Set([move.to]) : new Set([move.from, move.to]);
  } catch {
    return new Set();
  }
};

export const Board = ({
  game,
  selectedFrom,
  selectedDrop,
  targets,
  onSquare,
  disabled,
}: BoardProps) => {
  const last = game.lastUsi ? lastSquares(game.lastUsi) : new Set<number>();
  return (
    <div className="boardWrap">
      <ol className="fileLabels" aria-hidden="true">
        {FILES.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ol>
      <div className="boardRow">
        <div className="board" aria-label="Shogi board">
          {Array.from({ length: 81 }, (_, index) => {
            const piece = game.squares[index];
            const target = targets.has(index);
            const selected = selectedFrom === index;
            const classes = [
              'square',
              HOSHI.has(index) ? 'hoshi' : '',
              last.has(index) ? 'last' : '',
              selected ? 'selected' : '',
              target ? 'target' : '',
              selectedDrop && target ? 'dropTarget' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={index}
                type="button"
                className={classes}
                disabled={disabled}
                onClick={() => onSquare(index)}
                aria-label={squareToUsi(index)}
              >
                {piece ? (
                  <Koma
                    role={piece.role}
                    side={piece.side}
                    selected={selected}
                    last={last.has(index) && Boolean(piece)}
                  />
                ) : target ? (
                  <span className="dot" />
                ) : null}
              </button>
            );
          })}
        </div>
        <ol className="rankLabels" aria-hidden="true">
          {RANKS.map((rank) => (
            <li key={rank}>{rank}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};
