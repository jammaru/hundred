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

Open `http://127.0.0.1:5188`. No API key is required. The world starts in **Rules** mode.

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

Original sprites are retained in `apps/web/public/assets/sprites`. The Vite sprite
plugin produces `/assets/world/*.png` for both development and production. It
removes bright and dark magenta, recovers RGB data beneath alpha erased by the
legacy shadow key, and trims each sprite with transparent padding. This must happen
before browser decoding, which discards RGB under fully transparent pixels.
Do not apply the legacy `sprite:key --shadow` option to architectural sprites:
it can erase connected gray roofs and walls. The recovery mode is specifically for
these legacy sources, not arbitrary new transparent artwork.

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
