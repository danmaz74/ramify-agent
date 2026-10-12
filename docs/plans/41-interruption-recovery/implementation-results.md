# Plan 41 implementation results

**Date:** 2026-10-12. **Status:** implemented and qualified.

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
whitespace checks also pass. The configured default audit passes from the clean
committed candidate described below. The user authorized the isolated implementation commits and recording the
audit result. No remote push or Dolt remote sync was performed.

## Audit evidence

The configured default command was run from a clean committed candidate:

```bash
node_modules/.bin/ramify-audit audit --cwd . --json
```

The first candidate was `598999afdbcd0143f657c379d7eeef6a6fb884d1`. The auditor
selected full mode through its drift-cap policy, preserving all six configured
checks. Type checks, structure, patch integrity, web build and the configured
Cucumber profile passed. That profile selected zero scenarios; it establishes
no scenario coverage. Vitest found five failures: standalone manual source
fallback, command/event/lineage inventories, and a shell test that assumed
unpromised dispatch order. The fixes preserve ordinary recovery reconstruction
requirements and assert original command-to-call-ID correspondence. Their
97-case focused group passes.

Original failure evidence remains under:

- Report: `99bbd43d2268e775326a01bb05010ceb49dc930a`
- Run ref: `refs/audited/runs/2026-10-12T18-49-31Z-598999afd`
- Source tree: `98278a35a5c55c1a8fd642de0cef84549887723a`

The corrected candidate `22ed021e17da2e35ecda7f065f882b7744a5e0df` passes the
same default command. The auditor selected seven affected modules, retained all
six configured checks, and reran every carried failure. It recorded 3,050 passing
Vitest cases and two skipped cases across 357 files; no test failed. Its complete
failure ledger has no outstanding entries. Type checks, structure, patch integrity,
web build and the configured zero-scenario Cucumber profile passed.

The composed verdict is **pass**, with the original full audit as its verified
baseline and every original failure cleared. No scope override was used.

- Producer: `ramify-audit 0.8.0`
- Request: `26a79eea-c44a-4e12-b77c-d6b1234c6ca5`
- Run: `f766afba-86ce-441c-802a-ab8b8f389c0c`
- Report: `ba2328d61bb5e1c2e7eca86e4dabd4b41bf47525`
- Run ref: `refs/audited/runs/2026-10-12T19-12-24Z-22ed021e1`
- Tree ref: `refs/audited/by-tree/853596343767e37c0218ee295fbd8d28f05975da`
- Duration: `677.386 seconds`

Retrieve the passing evidence or verify branch applicability with:

```bash
git show ba2328d61bb5e1c2e7eca86e4dabd4b41bf47525:reports/audit/summary.json
node_modules/.bin/ramify-audit check-branch plan41-interruption-recovery --cwd . --json
```

The role/purpose table and scripted witnesses above establish the implementation
assessment; the audit establishes configured check health. Historical trial runs
retain their original terminal meaning.
