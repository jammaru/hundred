import {
  candidateMoves,
  isCheck,
  legalMoves,
  moveToJa,
  moveToUsi,
  pickRulesMove,
} from '@jev/shogi-engine';
import type { Move, Position } from '@jev/shogi-engine';
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

export interface AiChoice {
  move: Move;
  provider: 'jev' | 'rules';
  fallback: boolean;
  probabilities: Record<string, number>;
}

export const chooseMove = async (
  position: Position,
  options: { apiKey?: string | undefined; timeoutMs: number; wantJev: boolean },
): Promise<AiChoice> => {
  const legal = legalMoves(position);
  const selectedPool = candidateMoves(position, legal, 16);
  const fallbackMove = pickRulesMove(position, selectedPool);
  const fallback: AiChoice = {
    move: fallbackMove,
    provider: 'rules',
    fallback: false,
    probabilities: { [moveToUsi(fallbackMove)]: 1 },
  };
  if (!options.wantJev || !options.apiKey || selectedPool.length === 0) {
    return fallback;
  }
  const criteria: Record<string, string> = {};
  for (const move of selectedPool) {
    const moving = move.kind === 'board' ? position.board[move.from]?.role : move.role;
    criteria[moveToUsi(move)] = moveToJa(move, moving);
  }
  try {
    const client = new TypeSafeClient({
      apiKey: options.apiKey,
      defaultModel: 'jev-latest',
      timeout: options.timeoutMs,
      retry: { maxRetries: 0 },
      logLevel: 'error',
    });
    const response = await client.systemOne({
      model: 'jev-latest',
      state: {
        side: position.sideToMove,
        check: isCheck(position),
        candidates: Object.values(criteria),
      },
      questions: {
        move: choice(
          {
            task: 'Choose the next shogi move.',
            guidance:
              'You are playing Gote. Prefer king safety, material, and development. Capture hanging pieces. Do not pick a move that ignores check.',
          },
          criteria,
        ),
      },
    });
    const answer = response.answers.move;
    if (!answer || answer.type !== 'choice') {
      return { ...fallback, fallback: true };
    }
    const picked = selectedPool.find((move) => moveToUsi(move) === answer.choice) ?? fallbackMove;
    return {
      move: picked,
      provider: 'jev',
      fallback: false,
      probabilities: answer.probabilities,
    };
  } catch {
    return { ...fallback, fallback: true };
  }
};
