# AGENTS.md

Jev Lab is a local-first collection of TypeSafe Jev use cases. Jev (TypeSafe System One) only answers **what should happen next**. Engines, not the model, keep rules, clocks, and worlds.

## Products

- **Hundred** — 100 NPCs in a tiny town. Jev chooses the next action for a person.
- **Jev Shogi** — human Sente vs Jev/rules Gote. Jev chooses among legal shogi moves.

## Layout

- `packages/domain` — Hundred types and clamps, no I/O
- `packages/simulation` — Hundred clock, needs, economy, actions, God Mode conditions
- `packages/decision` / `packages/decision-jev` — rules vs Jev Choice
- `packages/protocol` — Zod websocket messages
- `packages/avatar` — faces
- `packages/shogi-engine` — MIT shogi rules (SFEN/USI), no I/O
- `apps/lab-web` — product hub on `127.0.0.1:5173`
- `apps/hundred-server` — Hono + ws on `127.0.0.1:8787`
- `apps/hundred-web` — React chrome + PixiJS world on `127.0.0.1:5188`
- `apps/shogi-server` — Hono shogi API on `127.0.0.1:8788`
- `apps/shogi-web` — wooden board UI on `127.0.0.1:5191`

## Skills

Project skills live in `.agents/skills/`. Read `.agents/skills/typesafe-ai/SKILL.md` before changing Jev/TypeSafe code.

## Rules

- English for code, comments, and commit messages. UI strings are EN+JA dictionaries (`apps/hundred-web/src/i18n/messages.ts`, `apps/shogi-web/src/i18n.ts`, `apps/lab-web/src/i18n.ts`).
- Do not import React, PixiJS, or Hono from domain/simulation/shogi-engine.
- Do not call `Math.random()` in simulation. Use `Rng`.
- Jev is Choice-only. God Mode changes **conditions** (food, rain, festival), never scripted theft. Shogi Jev only picks a legal USI move.
- The Hundred world renderer is Pixi, not React. Keep 100 sprites off the React tree.
- Camera modes: `town` (pan/zoom), `follow`, `first` (see through an NPC).
- Prefer existing patterns. `pnpm check` before claiming done.
- Verify web UI in the browser when layout or world rendering changes.

## Commands

```bash
pnpm install
pnpm dev
pnpm check
```
