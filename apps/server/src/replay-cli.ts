import { resolve } from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('Usage: pnpm replay ./runs/<run-directory>');
  process.exit(1);
}

process.env.DECISION_PROVIDER = 'replay';
process.env.REPLAY_PATH = resolve(process.cwd(), target);
process.env.RECORD_RUN = 'false';

await import('./index');
