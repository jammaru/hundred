# 005. Custom avatar assets

## Status

Accepted

## Context

External avatar APIs and mixed-license sprite packs complicate OSS distribution.

## Decision

Generate original vector parts from a seed in `@hundred/avatar` and render them in both Pixi and SVG portraits.

## Consequences

Every NPC has a face. Appearance stays MIT-licensed and offline.
