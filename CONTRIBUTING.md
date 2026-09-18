# Contributing

Jev Lab is a local-first collection of TypeSafe Jev products. Read the architecture notes in `docs/` before changing package boundaries.

## Development

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173` for the lab hub, `5188` for Hundred, and `5191` for Jev Shogi.

Before opening a pull request:

```bash
pnpm check
```

That runs format, lint, typecheck, unit tests, boundary checks, dead-code detection, and build.

## Rules

- Keep Hundred Jev behind `@hundred/decision-jev`. Shogi Jev stays in `apps/shogi-server`.
- Agent skills live in `.agents/skills/`. See `AGENTS.md`.
- Do not import React, PixiJS, or Hono from `@hundred/domain`, `@hundred/simulation`, or `@jev/shogi-engine`.
- Do not call `Math.random()` in simulation code. Use `Rng`.
- English for code and commit messages. UI strings are EN+JA dictionaries.
