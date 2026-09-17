# Hundred

**100 AI agents. One tiny world. No scripted story.**

```text
   hair
  ┌────┐
  │ • •│
  │ ᴗ  │     100 people, one town
  └────┘     Jev chooses the next action
   ███       The engine decides what happens
   ╱ ╲
```

Hundred is a local-first open source society simulation. One hundred NPCs live in a tiny town with hunger, money, jobs, relationships, and memories. [Jev](https://docs.typesafe.ai), TypeSafe's System One model, only answers one question: **what should this person do next?**

![Hundred layout](docs/architecture/overview.md)

## Quick start

```bash
git clone https://github.com/jammaru/hundred.git
cd hundred
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173`. No API key is required. The world starts in **Rules** mode.

## Enable Jev

```bash
cp .env.example .env
```

```env
JEV_API_KEY=your_key_here
```

```bash
pnpm dev
```

The top bar shows `Jev ●` when decisions come from TypeSafe. If Jev times out or errors, the engine falls back to rules and the world keeps moving.

## How it works

- Simulation engine: movement, needs, food, work, theft, help, fights
- Decision providers: `rules`, `jev`, `replay`
- Renderer: cozy pixel-art town in PixiJS, React inspector, town / follow / first-person cameras
- Recording: `runs/<timestamp>_seed-<seed>/`

Jev never receives the whole world. Each request is a compact state object plus the currently available actions.

## Replay

```bash
pnpm replay ./runs/<run-directory>
```

This replays recorded decisions and never calls the Jev API.

## Development

```bash
pnpm check
```

Stack: TypeScript, pnpm workspaces, Vite, React 19, PixiJS 8, Hono, Zod, Vitest, Oxlint, Oxfmt.

## License

MIT © [jammaru](https://github.com/jammaru)
