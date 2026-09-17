# Architecture

Hundred keeps three jobs separate:

1. **Jev / DecisionProvider** — what should this NPC do next?
2. **Simulation engine** — what happens if they do it?
3. **Renderer** — what does it look like?

```text
domain
  ▲
simulation / decision / protocol
  ▲
server                     web + avatar
```

The local Hono server owns the world clock, needs, economy, relationships, and recording. The browser interpolates movement in PixiJS and keeps React limited to inspector, HUD, and controls.
