# Jev Lab

**Use cases for [Jev](https://docs.typesafe.ai), TypeSafe’s System One model.** Jev only answers the next choice. Engines keep the rules.

```text
  Jev Lab
  ├── Hundred     100 people, one town
  └── Jev Shogi   human Sente, Jev Gote
```

## Quick start

```bash
git clone https://github.com/jammaru/jev-lab.git
cd jev-lab
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173`. No API key is required. Products start in **Rules** mode.

| App       | URL                   |
| --------- | --------------------- |
| Lab hub   | http://127.0.0.1:5173 |
| Hundred   | http://127.0.0.1:5188 |
| Jev Shogi | http://127.0.0.1:5191 |

`pnpm dev:hundred` and `pnpm dev:shogi` start one product at a time.

## Products

### Hundred

One hundred NPCs live in a tiny town with hunger, money, jobs, relationships, and memories. Jev only answers **what should this person do next?**

### Jev Shogi

A wooden shogi board. You play Sente. After each legal move, Jev (or local rules) chooses Gote’s reply from engine-legal USI moves. Jev never invents an illegal move.

## Nix development environment

The committed `flake.lock` pins Nixpkgs. The development shell supplies Node.js 24,
Git, and a Corepack-backed `pnpm` that honors the exact `packageManager` version.
Install Nix using the [official instructions](https://nixos.org/download/), then run:

```bash
nix develop
pnpm install --frozen-lockfile
pnpm dev
```

On Windows, run these commands inside a WSL2 Linux distribution. Keep Linux and
Windows dependency installations separate; do not reuse `node_modules` across OSes.
For an untracked flake in a fresh working tree, use `nix develop path:.`.
If your Nix installation does not enable flakes, add
`experimental-features = nix-command flakes` to `~/.config/nix/nix.conf`.
Optional direnv integration is available through `.envrc` (`direnv allow`).
The shell does not load `.env` or install dependencies automatically.

Validate the environment with `nix flake check` and the application with `pnpm check`.
For browser tests on Ubuntu/WSL, install Chromium and its OS dependencies once:

```bash
pnpm --filter @hundred/web exec playwright install --with-deps chromium
pnpm test:e2e
```

When editing files on the Windows filesystem from Windows tools, Vite's WSL file
watcher may miss changes. Restart `pnpm dev` before verifying, or keep the checkout
and editor inside WSL.

### World sprites

Original sprites are retained in `apps/hundred-web/public/assets/sprites`. The Vite sprite
plugin produces `/assets/world/*.png` for both development and production. It
removes bright and dark magenta, recovers RGB data beneath alpha erased by the
legacy shadow key, and trims each sprite with transparent padding. This must happen
before browser decoding, which discards RGB under fully transparent pixels.
Do not apply the legacy `sprite:key --shadow` option to architectural sprites:
it can erase connected gray roofs and walls. The recovery mode is specifically for
these legacy sources, not arbitrary new transparent artwork.

## Enable Jev

Keep the key in `.env`. Hundred stays on local Rules unless you opt in. Jev Shogi uses Jev whenever the key is present.

```bash
cp .env.example .env
```

```env
JEV_API_KEY=your_key_here
DECISION_PROVIDER=rules
SHOGI_PROVIDER=jev
```

```bash
pnpm test:jev
```

That live test is the cheap way to confirm the key. Hundred: set `DECISION_PROVIDER=jev` only when you want the town to spend credits. Shogi: `SHOGI_PROVIDER=jev` (the default when a key exists). `SHOGI_PROVIDER=rules` forces local replies. If Jev times out or errors, engines fall back to rules.

## How it works

- Hundred simulation: movement, needs, food, work, theft, help, fights
- Shogi engine: legal moves, drops, promotion, check, mate
- Decision providers: `rules`, `jev` (Hundred also has `replay`)
- Hundred renderer: cozy pixel-art town in PixiJS, React inspector, town / follow / first-person cameras
- Recording: `apps/hundred-server/runs/<timestamp>_seed-<seed>/`

Jev never receives a whole world or a whole game tree. Each request is compact state plus the currently legal options.

## Replay

```bash
pnpm replay ./apps/hundred-server/runs/<run-directory>
```

This replays recorded Hundred decisions and never calls the Jev API.

## Development

```bash
pnpm check
```

Stack: TypeScript, pnpm workspaces, Vite, React 19, PixiJS 8, Hono, Zod, Vitest, Oxlint, Oxfmt.

## License

MIT © [jammaru](https://github.com/jammaru)
