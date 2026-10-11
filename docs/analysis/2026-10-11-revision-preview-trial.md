# Revision-preview trial design

The [revision-preview plan](../../subs/harness/fixtures/collection-review/plans/revision-preview/plan.md)
adds one tRPC operation to Collection Review. It exercises a consumer needing
new provider behavior, reuse of an existing unexposed helper, failure semantics,
existing callers and one substantive non-functional requirement. This document
defines evaluation of a future run; no execution result is claimed.

## Why this is small

The Reviews adapter needs new preview behavior from Review Validation.
Validation needs Catalog Core's existing `resolvePredecessors`, currently
exported for local use but absent from its module's exposures. Existing schemas,
review rules and the assembled tRPC test client supply the rest. There is no new
UI, transport, stored data or package dependency.

The non-functional requirement is independent inspection snapshots in Catalog
Core. The baseline `selectRevisions` returns the stored array for `all` and a
shallow slice for `latest`; revision objects remain shared in both cases.
Direct mutation-isolation tests can therefore demonstrate a real correction.
Testing only over tRPC or MCP would miss this gap because serialization copies
the data. This is a source finding, not a recorded failing test run.

## Harness coverage to evaluate

Keep this evaluation outside the captured plan. The plan defines the product
and its ownership constraints; architects choose the execution decomposition.
Do not force an unnecessary repair or withhold a requirement to create an event.

| Goal | Evidence needed from the actual run |
| --- | --- |
| Delegation for new behavior | A consumer capability request, provider work under its assigned owner, accepted current handback, and continuation of the original consumer through integration and acceptance. Merely changing two modules is insufficient. |
| Reuse of an unexposed capability | Discovery of `resolvePredecessors`, a decision to reuse it, the required declarations, and Validation's actual use of that same binding. Inspect imports and source as well as the structural check. |
| Nested coordination | Whether the Validation work requests Catalog Core's capability while its parent task remains open, and whether the resulting handback resumes the correct work. If architects resolve exposure directly or choose another valid decomposition, record nested delegation as unexercised. |
| Consumer integration and failure semantics | The assembled-client scenarios pass with real Validation and Catalog Core implementations. A missing predecessor reaches the consumer as a finding; absent input differs from an empty chain. |
| Compatibility | Existing stored-record reviews and scoped inspections retain their results; the resolver retains ordering and repeated references; the report-based validator retains its contract. |
| Non-functional work | The snapshot requirement survives catalog extraction, reaches relevant assignments, produces a Catalog Core implementation change and direct isolation evidence, and is assessed against the final candidate. Record whether it was satisfied during functional work or through a later repair. |
| Session and context handling | Trace the requesting engineer's suspension and continuation, capability plans, handback briefs, refreshed views and relevant context-selection forks. A repeat analysis can compare first-call cache reuse at those boundaries. |

Product acceptance and harness coverage are separate judgments. A correct
implementation without a real delegated task meets the feature requirements
but does not satisfy this trial's delegation goal. Similarly, an early snapshot
fix covers non-functional delivery and assessment but does not exercise a later
non-functional repair round. Report both outcomes explicitly.

## Run and assessment

Use a fresh prepared copy of Collection Review with plan ID `revision-preview`;
the fixture's existing trial preparation discovers plans by path. Install the
copy's own dependencies and retain its committed configured audit. Record the
harness revision, target baseline, model and run ID before evaluating results.
Run setup and model selection belong to the later execution request.

Use the [postmortem skill](../../.claude/skills/ramify-agent-postmortem/SKILL.md)
to assess retained evidence after execution. In addition to the table above,
record wall time, model calls, usage/cost, exposure-related exploration, retries
and review findings. Include corrective work and missing evidence. Successful
configured checks alone do not establish semantic completion or delegation.

The [dogfooding skill](../../.claude/skills/ramify-agent-dogfooding/SKILL.md)
applies when carrying out useful work on a real target project and repairing
harness defects during delivery. This repeatable fixture trial retains its
existing preparation workflow.
