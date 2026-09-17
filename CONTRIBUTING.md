# Contributing

Hundred is a local-first open source society simulation. Read the architecture notes in `docs/` before changing package boundaries.

## Development

```bash
pnpm install
pnpm dev
```

Before opening a pull request:

```bash
pnpm check
```

That runs format, lint, typecheck, unit tests, boundary checks, dead-code detection, and build.

## Rules

- Keep Jev behind `@hundred/decision-jev`.
- Agent skills live in `.agents/skills/`. See `AGENTS.md`.
- Do not import React, PixiJS, or Hono from `@hundred/domain` or `@hundred/simulation`.
- Do not call `Math.random()` in simulation code. Use `Rng`.
- English for code, UI, and commit messages.
