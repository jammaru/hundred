# 004. Decision provider boundary

## Status

Accepted

## Context

Jev is TypeSafe's System One model. It should choose a high-level action, not move sprites or write stories.

## Decision

`DecisionProvider` is the only AI boundary. Jev uses a Choice question over engine-filtered actions. Failures fall back to `RulesProvider`.

## Consequences

The simulation runs without an API key. Jev API changes stay inside `@hundred/decision-jev`.
