# Plan 41 implementation results

**Date:** 2026-10-12. **Status:** implementation qualification in progress.

The implementation adds captured `operation-recovery/1` policy to new runs.
Structured transport failures receive two automatic successors, then leave a
settled, nonterminal pause. Explicit resume addresses an occurrence and revision,
retains the run's spent limits, and authorizes another bounded group. Older
captures retain their previous behavior. No historical run was reopened.

Invocation packets and session operations retain predecessor identities. An
accepted submission survives a lost provider acknowledgement without another
model submission. Pauses retain partial source and reconcile established effects;
an operator declaration cannot establish completion of an uncertain tool.
Scheduling and gate admission wait for confirmed writer, tool, readiness and
review settlement. Only fully reached operator waits are excluded from active
execution time.

External repair admission records exact HEAD, candidate tree, index, tracked and
untracked paths, blob identities and modes, configuration, installed runtime,
captured inputs and durable record identities. It authenticates observed changes
against declared target, configuration, environment or runtime repairs, then
revalidates immediately before dispatch. Runtime changes require service restart;
protected policy, records, submissions, equipment and authority source hashes must
remain exact. The run, step, evidence, check and audit owners belong to protected authority,
so this conservative compatibility policy refuses edits to those files and changes
to the captured dependency lock identity. Compatible adapter changes can resume
after restart. Environment evidence contains operator
provenance, not credentials.

Configured readiness and audit obstructions use their existing infrastructure
budgets, independently of agent transport retries. Accepted producers are retained.
Changed final candidates receive fresh assessments within the remaining captured
round allowance, retaining previous assessments and deviations. Current merge
readiness uses the applicable assessment's deviations; earlier invalidated
decisions remain historical evidence. Authentication
supplements identify external source repairs without enlarging ordinary assignment
scope or bypassing protected, excluded, ownership or audit checks.

Ordinary preparation failures and eligible pre-invocation automatic repair refusals
can wait for an external correction. Successful automatic repair remains spent;
its unchanged unconsumed source supplement survives. Unfinished, blocked,
unverified or unsafe automatic root repair retains terminal handling.

Empty observed mutation sets now yield empty placement without a path query.
Unavailable observations and unresolved nonempty targets retain their failure;
candidate acceptance still requires current ownership for retained source edits.

## Implementation iterations

The requested execution used one agent for each of six iterations, with integration
and qualification by the coordinating agent.

| Iteration | Delivered scope | Focused evidence |
| --- | --- | --- |
| 1 | Empty mutation classification and ownership boundary | [empty mutations](../../../subs/harness/src/tests/empty-mutations.test.ts), [ownership evidence](../../../subs/harness/subs/evidence/src/tests/ownership-evidence.test.ts) |
| 2 | Captured policy, invocation lineage, settlement, pause, resume and restart | [operation recovery](../../../subs/harness/src/tests/operation-recovery.test.ts) |
| 3 | External repair admission, readiness and committing gates | [admission](../../../subs/harness/src/tests/recovery-admission.test.ts), [gate lifecycle](../../../subs/harness/src/tests/recovery-gate-lifecycle.test.ts), [configuration lifecycle](../../../subs/harness/src/tests/recovery-configuration-lifecycle.test.ts) |
| 4 | Public inspection, HTTP, CLI and web | [HTTP](../../../subs/harness/src/tests/recovery-http.test.ts), [CLI](../../../src/tests/recovery-client.test.ts), [web](../../../subs/web/src/tests/recovery.test.tsx) |
| 5 | Ordinary caller transitions and budget preservation | [caller recovery](../../../subs/harness/src/tests/operation-recovery-callers.test.ts) |
| 6 | Preparation failures and eligible automatic repair refusals | [preparation recovery](../../../subs/harness/src/tests/preparation-recovery.test.ts) |

## Role and purpose coverage

The [caller recovery suite](../../../subs/harness/src/tests/operation-recovery-callers.test.ts)
drives the real service with scripted external boundaries. These are composed
workflow transitions, rather than calls to the retry helper alone.

| Role or purpose | Covered transition |
| --- | --- |
| Initial architect | Fresh analysis before accepted placement |
| Catalog extractor | Intake before initial architecture |
| Global fork | Placement consultation from the recorded source |
| Local architect | Orientation and continued organizing turn |
| Engineer | Unfinished iteration before accepted completion |
| Contract engineer | Delegated contract iteration |
| Capability architect | Fresh and continued coordination |
| Capability qualifier | Qualification purpose stored as a local architect |
| Reviewer | One semantic attempt containing two transport invocations; cumulative budget |
| Failure analyst | Failure account retained before returning to the architect |
| Context selector | Forked selection |
| Nonfunctional coordinator | Assessment and action; previously accepted phase retained |
| Nonfunctional repair engineer | Repair attempt; prior assessment retained |
| Automatic root repair | Purpose exception: blocked/unverified/interrupted repair stays terminal |
| Debug-server restart | Purpose exception retains previous lifecycle |

Additional integration witnesses cover [ordinary iteration and work-item gates](../../../subs/harness/src/tests/ordinary-gate-recovery.test.ts),
[capability handback qualification](../../../subs/harness/src/tests/capability-gate-recovery.test.ts),
[readiness source commits and lost acknowledgements](../../../subs/harness/src/tests/recovery-readiness-source.test.ts),
[final reassessment and deviation history](../../../subs/harness/src/tests/final-deviation-recovery.test.ts),
and [gate scheduling admission](../../../subs/harness/src/tests/gate-recovery-admission.test.ts).
The union producer inventory cites actual recovery, readiness, preparation and
public-consumer witnesses; unsupported values must not be excused as implemented.

## Qualification

Focused changed-file qualification covers 207 unique cases across 26 files. The
51-case rerun of composition, ownership, core recovery and gate admission passed
after preserving the historical gate behavior and supplying captured policy in
explicit gate fixtures. The core recovery suite passes all 23 cases, including
pre-dispatch retry accounting, post-outcome crash cuts, unknown effects, mixed
startup, peer review settlement, stop during delay and final effect prerequisites.
A separate regression group of 206 tests
across 12 existing service, session, review, readiness, capability, nonfunctional
and adapter files passed. Preparation qualification passed all 14 new cases and
12 historical automatic repair cases. Final reassessment and historical deviation
qualification passed 17 cases, including final target/configuration repair,
historical deviation review and merge-readiness rules. `npm run check:self` and `npm run build:web`
passed during integration.

TypeScript and the complete union producer inventory pass. `check:self` reports
zero errors and three warnings in the working checkout; the isolated candidate
passes with zero errors and zero warnings. Candidate TypeScript and staged
whitespace checks also pass. The configured default audit remains the final
qualification step. The audit
requires a clean committed candidate. No commit, push or Dolt remote sync has been
performed under the repository's conservative Beads profile.
