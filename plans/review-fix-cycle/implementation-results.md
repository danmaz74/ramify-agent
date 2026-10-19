# Review and fix cycle implementation evidence

Recorded 2026-10-19 before iteration 3 and cumulative assessments. Later gates and
exact protected-change decisions remain in the harness job; this record does not
assert those pending results.

The [captured plan](plan.md) was implemented in a separate local worktree on
`feat/review-fix-cycle`. Source checkout HEAD was
`9a6a40092e512ad6c302107cb75b3086a6fee7bf`. Commit
`686c5943320650d0ed4c3cf099496de7e57ee09e` captured the plan and supporting analysis
before registration and is the original plan/protection baseline. Unrelated main
checkout changes were left in place. No push or tracker synchronization occurred.

## Iterations

Astra coordinated one native Sol worker for each outcome, reusing that worker for
selected repairs. The execution is `review-fix-cycle/20261019T133612Z-c8937d`.

| Outcome | Native iteration | Implementation candidate | Retained result at this record |
| --- | --- | --- | --- |
| R1–R4 focused context and usable inspection | `it-3986ac0d-5b4c-4f1b-b04c-2890bb8f30d3` | `1709aa9942bb464ed971395df08b84e6dc71d61a` | `as-0003`: audit and semantic obligations satisfied; protected specifications pending |
| Assisted R5–R8 and shared decisions/summary | `it-0dc5acef-bea7-4e5d-beb8-52eb869fe6af` | `b9b8e0623c505a8fb787000e00eb3101eed184d5` | `as-0007`: audit and selected-fix obligations satisfied; protected specifications pending |
| Automated R5–R8 and both final paths R9 | `it-814187e8-f533-4b8c-8504-f5b96bfe553c` | `a7196f65557d13c5c41449744f6e9ec3872d4980` | Worker checks passed; independent assessment follows |

Each worker ran focused composed tests, stable type-check and `check:self`.
The first iteration also ran the registered native candidate-inspection witness.
Automated initial review → decision → repair → continuation and final review →
repair → completion were exercised with scripted external answers. Purposeful
extra review, unavailable advisory continuation, exact user protection authority,
normal reload and retry were covered by the relevant compositions. This was a
live native assisted implementation, not a live full automated project run.

The coordinator used the official MCP client over the repository's stdio server.
The runtime was restarted only between completed assessments, to load committed
policy changes; the same job, captured input and original baseline were retained.
The supported Pi model was explicitly `openai/gpt-6-astra:high` after the initial
model capability failure. No review was cancelled for elapsed time or silence.

## Actual assessment work

The configured auditor selected its own scope. No scope override or duplicate
direct whole-suite run was used. `as-0001` selected full mode through the provider's
normal fallback; subsequent rows selected `ramify-partial`.

Review operation span below is the interval between its first and last durable
operation transitions, including tool execution and model waiting. Audit seconds
are the provider's recorded audit execution duration. These are separate measures;
they do not measure active engineering effort or establish a speedup.

| Assessment | Audit | Audit seconds | Review policy / availability | Review operation span seconds | Gate |
| --- | --- | ---: | --- | ---: | --- |
| `as-0001` | failed | 835.929 | unavailable; no provider events | — | incomplete |
| `as-0002` | passed | 142.644 | submitted before explicit policy records | 363.759 | action-required |
| `as-0003` | passed | 814.590 | submitted before explicit policy records | 115.543 | action-required |
| `as-0004` | passed | 817.633 | broad | 221.246 | action-required |
| `as-0005` | failed | 808.881 | not-run | — | action-required |
| `as-0006` | passed | 87.070 | focused-follow-up | 199.695 | action-required |
| `as-0007` | passed | 815.579 | focused-follow-up | 125.702 | action-required |

`as-0005` retained only audit, protection and `review-policy` stages: its concrete
configured-check diagnostic went directly to the engineer, with no semantic
review or reconciliation invocation. `as-0004` recorded the initial broad review;
`as-0006` and `as-0007` recorded focused selected-fix follow-ups. Those follow-ups
verified established obligations rather than launching another broad catalog.
The protected-only results were not described as `clear`.

Completed stages and finding decisions are retained beneath
[the execution evidence](.harness/jobs/20261019T133612Z-c8937d/).
Session operations and actual delivered messages remain in
[the session store](../.harness/session-operations/store/), keyed by operation ID.
These are local generated evidence, not committed replacement records.

## Representative delivered context

The actual `as-0007-review-2` task began with:

```text
Combined code and scope review as-0007 for iteration as-0007.

Candidate commit: b9b8e0623c505a8fb787000e00eb3101eed184d5; tree: cde053e8192acc7ebd22da1c26c6e77a8d1db944; base commit: 1709aa9942bb464ed971395df08b84e6dc71d61a.
Audit: passed — composed pass.

## Intended outcome

Focused repair follow-up: inspect the selected repairs and relevant surrounding behavior. Do not repeat the broad iteration review or unchanged discretionary issues. Verify previously unmet requirements affected by the repair.
Deliver R5-R8 for assisted work and shared decision/summary facilities: ordinary coordinator dispositions, bounded known-finding context, direct failed-check diagnostics, one default broad pass per iteration with selected repair verification and purposeful extra review; align public commands, results, completion and coordination guidance.
Declared module focus: subs/harness/subs/assistance. Focus is advisory; cross-module changes are allowed.
```

The reviewer received `snapshot_list`, `snapshot_read`, `snapshot_search`,
`snapshot_diff`, `shell`, `assessment_evidence` and `submit_assisted_review`.
Its system instructions included: “Select relevant inspection and report
meaningful limitations without an exhaustive file inventory. Do not edit source.”
The original plan was fetched on demand in this follow-up. Candidate shell
inspection used the pinned disposable checkout; the native witness exercised
compressed evidence and cleanup, including nested project paths.

| Actual review operation | Delivered task UTF-8 bytes | Stored operation body SHA-256 |
| --- | ---: | --- |
| `as-0002-review-2` | 183563 | `f899abd3c91376297929cd3ed53f1e4ec6488f543918ae42db724691ea779445` |
| `as-0003-review-2` | 196639 | `9c0a0337a6b2dcaf5c8346ae260422d162751e8f94a1e061b515dc1d1085d2d8` |
| `as-0004-review-2` | 67265 | `90e74014a6bd378a353340fca7ba0f10218dc7877ce92adbf5cc426b18116b43` |
| `as-0006-review-2` | 83879 | `5c2fe79ccd9712b243eea3d17f41b596498e72578c7c38f2a0d2088bf076961b` |
| `as-0007-review-2` | 88006 | `3a3ee4f9e115d946a8223781472fdb3ef0b91c757c9af896883d7b1483ed6bf5` |

These task sizes include the delivered candidate patch. Candidates and cumulative
iteration diffs differ, so the rows are not controlled context-cost comparisons.
No speedup is claimed against the [supporting analysis](../../docs/analysis/2026-10-19-review-fix-cycle.md).
The demonstrated change is review policy and usable context: current goal,
relevant references, candidate evidence, earlier dispositions and rationale,
original material on demand, and explicit focused follow-up. Partial inline patch
delivery and other optional experiments remain outside this plan.

## Completion and authority

The three protected specification changes are the
[assisted service contract](../../docs/architecture/agent-assistance/service.spec.md),
[harness contract](../../docs/harness.spec.md) and
[plan-context catalog contract](../../docs/architecture/plan-context-catalog.spec.md).
They replace obsolete strict policy as requested by the plan. They remain subject
to exact user protection authority; coordinator finding dispositions do not supply
it. No principle adoption/status was changed. A separate cumulative assessment
against the original baseline follows the final iteration assessment.
