# Repeated final assessments after a documentation correction

Plan 42 repeated the assessment pipeline after a two-file documentation correction, then submitted another cumulative final assessment on the same commit. This added substantial latency despite retaining the earlier behavioral conclusions. The appropriate improvement is a final-assessment repair that verifies the changed claims and carries forward still-applicable evidence, with explicit provenance.

## Observed case

Assisted job `20261021T092602Z-c16df0` used runtime commit `66c72246` and `ramify-audit@0.12.0`. Final assessment `as-0029` found that the specification and inventory incorrectly described placement-request names as automatically derived. Commit `db7250c732ba074dae93f2e4758a79e6b63a0220` corrected that description: two Markdown files, 12 insertions and 9 deletions, with no production or test changes. The coordinator submitted iteration assessment `as-0030`, then cumulative final assessment `as-0031` on that same commit.

| Assessment | Purpose | Request to audit completion | Review | Reconciliation | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| `as-0028` | Preceding implementation repair | 16m23s | 3m17s | 2m17s | 21m58s |
| `as-0029` | First cumulative final | 9m44s; audit reused | 4m33s | 1m48s | 16m06s |
| `as-0030` | Documentation correction | 16m17s | 1m28s | 1m23s | 19m11s |
| `as-0031` | Repeated final, same commit | 14m24s; audit reused | 2m17s | 2m22s | 19m04s |

Final evidence collected after completion at 2026-10-22 10:48:52 UTC (12:48:52 Europe/Rome). Durations are rounded from stage timestamps. Review is the interval from review-policy completion to recorded review completion; reconciliation follows it. These are wall-clock intervals, not measured model inference time. The two post-correction assessments consumed **38m15s**, or **38m51s** including the gap between submissions. Final substantive review passed; only exact protected-file approval remained.

## Audit work versus audit latency

The docs-only audit used default partial selection, not a full test run. It omitted Vitest and Cucumber and executed module checks (30.660s), type checking (12.137s), web build (0.653s), and patch validation (0.006s): **43.456 seconds of recorded command durations**. The provider reported **970.388 seconds** overall. About 927 seconds lie outside those command durations; retained evidence here does not identify the cause. Command durations must not be equated with the entire audit's critical path.

Both final assessments reused an existing audit report, yet took 9m44s and 14m24s to record the audit stage. Reuse therefore avoided check execution without providing a fast return. The reused report's original duration is historical metadata, not another execution duration.

## Review work and correction direction

The documentation review usefully checked the revised wording against the author schema, acceptance code and existing test. It took 1m28s, followed by 1m23s of reconciliation, and explicitly retained earlier behavioral conclusions. The repeated final added 2m17s of review and 2m22s of reconciliation on the same candidate. These review/reconciliation intervals total **7m30s** across the pair. The targeted check was appropriate; a separate iteration assessment followed by another cumulative final was avoidable. A final assessment is still necessary, but its repair need not repeat every stage indiscriminately.

Support a repair of the prior final assessment: bind the new candidate and document blobs, review the documentation delta and affected claims, preserve unaffected requirement outcomes, refresh protection comparisons, and recompute final readiness. Reuse audit evidence only under the provider's supported applicability rules; changed normative behavior can require broader verification. Instrument audit admission, locking, checkout/setup, selection, reuse lookup and command execution separately before attributing the unexplained delay. Do not treat documentation changes as automatic approval or weaken protected-file authority.

## Evidence

[Timing extract](2026-10-22-plan42-docs-assessment-overhead/timings.json) preserves assessment and stage timestamps, candidate IDs, audit selection and report references. Originals are under `plans/42-descriptive-identifiers/.harness/jobs/20261021T092602Z-c16df0/` in execution checkout `/workspaces/worktrees/plan42-assisted-20261021`, particularly `assessments/as-0028` through `as-0031` and their referenced evidence. Audit reports: `5a443a91118538736495c564173784a314ed84c7` and `d99fcbb39c5a38e5a802402b636ac37dea09dcbb`. This is a timing analysis of one repair cycle, not a complete run postmortem or proof of a specific audit bottleneck.
