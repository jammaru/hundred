# 001. Local first

## Status

Accepted

## Context

Hundred is an open source simulation, not a hosted world.

## Decision

Bind to `127.0.0.1`, store runs on disk, and keep the only remote dependency as the optional Jev API.

## Consequences

Clone, install, and `pnpm dev` work without accounts, databases, or CDN assets.
