# 002. No Next.js

## Status

Accepted

## Context

The product is a single simulation screen. SSR, SEO routes, and server components add no value.

## Decision

Use Vite + React + PixiJS.

## Consequences

The frontend stays a client app. The local Hono server is the only backend.
