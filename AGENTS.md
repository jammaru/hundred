# AGENTS.md

Hundred is a local-first open source society simulation. One hundred NPCs live in a tiny town. Jev (TypeSafe System One) only answers **what this person should do next**. The engine, not the model, writes the story.

## Layout

- `packages/domain` — types and clamps, no I/O
- `packages/simulation` — clock, needs, economy, actions, God Mode conditions
- `packages/decision` / `packages/decision-jev` — rules vs Jev Choice
- `packages/protocol` — Zod websocket messages
- `packages/avatar` — faces
- `apps/server` — Hono + ws on `127.0.0.1:8787`
- `apps/web` — React chrome + PixiJS world

## Skills

Project skills live in `.agents/skills/`. Read `.agents/skills/typesafe-ai/SKILL.md` before changing Jev/TypeSafe code.

## Rules

- English for code, comments, and commit messages. UI strings are EN+JA dictionaries in `apps/web/src/i18n/messages.ts`.
- Do not import React, PixiJS, or Hono from domain/simulation.
- Do not call `Math.random()` in simulation. Use `Rng`.
- Jev is Choice-only. God Mode changes **conditions** (food, rain, festival), never scripted theft.
- The world renderer is Pixi, not React. Keep 100 sprites off the React tree.
- Camera modes: `town` (pan/zoom), `follow`, `first` (see through an NPC).
- Prefer existing patterns. `pnpm check` before claiming done.
- Verify web UI in the browser when layout or world rendering changes.

## Commands

```bash
pnpm install
pnpm dev
pnpm check
```
