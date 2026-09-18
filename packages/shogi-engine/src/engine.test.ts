import { describe, expect, it } from 'vitest';

import { moveToUsi, parseUsi, squareToJa } from './notation';
import { legalMoves, play, startPosition } from './position';
import { makeSfen, parseSfen, startSfen } from './sfen';

describe('shogi engine', () => {
  it('starts from the standard SFEN', () => {
    const position = startPosition();
    expect(makeSfen(position)).toBe(startSfen);
    expect(position.sideToMove).toBe('sente');
  });

  it('allows the opening pawn push 7g7f', () => {
    const position = startPosition();
    const moves = legalMoves(position).map(moveToUsi);
    expect(moves).toContain('7g7f');
    expect(moves).toHaveLength(30);
    const next = play(position, parseUsi('7g7f'));
    expect(next.sideToMove).toBe('gote');
    expect(makeSfen(next)).toContain('w');
  });

  it('rejects a pawn jump', () => {
    const position = startPosition();
    expect(() => play(position, parseUsi('7g7e'))).toThrow('illegal move');
  });

  it('names squares in Japanese from the top rank', () => {
    expect(squareToJa(parseUsi('5i5h').from)).toBe('5九');
    expect(squareToJa(parseUsi('7g7f').to)).toBe('7六');
  });

  it('parses a drop and forbids nifu', () => {
    const position = parseSfen('lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b P 1');
    const drops = legalMoves(position).filter((move) => move.kind === 'drop');
    expect(drops).toHaveLength(0);
  });
});
