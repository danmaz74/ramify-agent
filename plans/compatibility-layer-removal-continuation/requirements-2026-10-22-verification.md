# Requirement clarification: test verification of the final candidate

Applies to `plans/compatibility-layer-removal-continuation/plan.md`.

The plan's constraints state the required verification: `npm run type-check`,
`npm run check:self` and the configured audit must pass. The iteration 4
recommendation ("Dependencies and verification. ... Type check, full
`npm test`, self check, the configured audit, ...") is a forecast of the same
verification, not an additional obligation. The configured audit's
`agent-tests` check is `npm test --maxWorkers=4`; a configured audit that
passed at the exact final candidate, in whichever mode ramify-audit executed,
is the plan's test verification. No separate `npm test` run is required, and
the outcome of a separate run outside the audit is not evidence the plan asks
for. Timeouts and transport races observed only in such a run under host load
are not findings against the candidate.

This clarification settles the reading of "full `npm test`" in the
recommendation. It changes no required behavior, constraint or acceptance
scenario.
