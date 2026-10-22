# Requirement clarification, 2026-10-22 (b): the scope-size view schema

This document clarifies the plan at
[plan.md](plan.md) for job `20261022T070359Z-22e31a`. It resolves a
contradiction inside the captured plan; it changes no outcome. It is pinned as a
requirement document in every later iteration end and in the cumulative final
assessment, alongside [requirements-2026-10-22.md](requirements-2026-10-22.md).

## The contradiction

The constraint that reserves work for the continuation plan says that in
`subs/harness/src/interfaces/protocol/runs.ts` "only the manifest, intent and
observation schemas change under this plan", and the interactions
recommendation repeats "leave the rest of that file alone". The identifier
evidence in the same plan requires that `scope-size/1` appears nowhere in
`src/` or `subs/`, and the measurement requirement says run measurements are
read and compared under `scope-size/2` only.

`scopeSizeViewSchema` in that file still declares
`policy: z.enum(['scope-size/1', 'scope-size/2'])`. The iteration-2 worker
read the file constraint as protecting that line and left it unchanged. The
configured audit then fails: the union-producer test in
`subs/harness/src/tests/composition.test.ts` reports the value
`metrics.evaluation.invocations[].efficiency.declared.policy = scope-size/1`
as having no producer and no recorded reason.

## Resolution

The identifier evidence governs. The scope-size view is the measurement form
this plan retires, so it belongs with the manifest, intent and observation
schemas that the plan changes in `runs.ts`:

- Narrow the `policy` member of `scopeSizeViewSchema` to `scope-size/2` only.
  The `ScopeSizeView` type follows. Nothing else in `runs.ts` changes under this
  plan; the reserved-for-continuation constraint otherwise stands as written.
- Do not record a "no producer" reason for `scope-size/1` in the composition
  union inventory. The value is removed, not explained.
- The web module and projections consume the view through its type; adjust any
  consumer the narrowed type breaks, without adding a fallback or adoption path.

This is an authoring clarification by the external observer, not a user
decision. The removal of `scope-size/1` was always the plan's required
outcome; the file constraint was written too broadly.
