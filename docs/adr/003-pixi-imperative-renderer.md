# 003. Pixi as an imperative renderer

## Status

Accepted

## Context

One hundred walking characters cannot live in React state at 60 FPS.

## Decision

Treat PixiJS as an imperative layer. React receives selected NPC snapshots, events, and control state only.

## Consequences

World positions stay inside the Pixi runtime. `@pixi/react` is not required.
