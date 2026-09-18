# Architecture

Jev Lab keeps three jobs separate in every product:

1. **Jev / Choice** — what should happen next?
2. **Engine** — what is legal, and what happens if they do it?
3. **Renderer** — what does it look like?

```text
Hundred                         Shogi
domain / shogi-engine
  ▲                               ▲
simulation / decision             legal moves + SFEN
  ▲                               ▲
hundred-server / hundred-web      shogi-server / shogi-web

lab-web links both products
```

Hundred: the local Hono server owns the world clock, needs, economy, relationships, and recording. The browser interpolates movement in PixiJS and keeps React limited to inspector, HUD, and controls.

Shogi: the engine owns legality. The server asks Jev (or rules) to pick one USI string from that list. The board is React, not Pixi.
