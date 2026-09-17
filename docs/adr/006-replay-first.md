# 006. Replay first

## Status

Accepted

## Context

Jev calls cost money and make demos hard to reproduce.

## Decision

Record decisions to `runs/*/decisions.jsonl` and replay them with `pnpm replay`.

## Consequences

Demos, debugging, and regression tests can run without the Jev API.
