# Recovery simplification implementation

Implementation of the [recovery simplification plan](../../plans/recovery-simplification/plan.md)
against base `091ca382d8b514bdc6b83f0e98f00f5e395b56f1`, on branch
`refactor/recovery-simplification`. The [recovery principles](../harness-recovery.principles.md)
govern the change. This document records implementation and verification; the
[original analysis](2026-10-18-task-restart-and-recovery-complexity.md) remains a
historical inventory of the previous design.

## Result and ownership

An unfinished task uses ordinary task construction and current files. Optional
session context may be reused, but its absence does not prevent a fresh session.
The former execution must actually settle. A durable accepted result is delivered
once, and an ambiguous consequential operation is resolved by its owner before
replacement. Stops, deliberate debugger pauses and pending user decisions remain
effective.

The new [recovery module](../../subs/harness/subs/recovery/README.md) owns the common
re-entry decision, interruption classification and bounded, cancellable transport
retry policy. It has no durable state, role catalog or dependency on `RunService`.
Hosted and standalone callers use the same
[ordinary task restart constructor](../../subs/harness/src/steps/runner.ts).
This concentrates policy rather than relocating all workflow and durability code.

| Remaining owner | Concrete reason it remains |
| --- | --- |
| Agent and process lifecycle | Establish that the previous invocation and its children cannot write or publish; fence late callbacks. |
| Ledger | Preserve accepted transactions, rematerialize committed records and handle an interrupted append. |
| Task and workflow owners | Read assignments, dependencies and accepted decisions; schedule unfinished children and deliver retained results once. |
| Git and other effect owners | Resolve a lost acknowledgement using the actual operation identity, such as a commit trailer. |
| Candidate and gate owners | Attribute external changes separately, enforce assignment scope and verify the actual candidate against required checks. |
| Legacy record readers | Keep historical failed runs and already-created linked successors readable without producing new synthetic histories. |
| CLI, HTTP and web | Forward ordinary commands and display the unfinished task, retained work and concrete obstruction. |

The service still contains substantial normal workflow orchestration. It was not
replaced by a generic recovery engine. Specialized readers for accepted engineer,
capability, review and repair results remain because those decisions cannot be
inferred from source files. Their optional conversation payloads are not execution
prerequisites.

The production TypeScript/TSX diff against the base removes 2,378 lines and adds
984, including the new source files: a net reduction of 1,394 lines. This counts
changed production source only, excludes tests and documents, and does not count
whole mixed workflow files as recovery savings. The shared policy implementation
is 55 lines; candidate attribution is 47 lines. These measurements describe the
change rather than establish its acceptance.

## Quantitative comparison

The comparison includes the audit corrections against the same base. Physical
line counts include blank lines and comments. The affected-file comparison uses
the union of all 43 changed production TypeScript/TSX files, including additions
and deletions; it includes unchanged normal workflow code in those files.

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| Production lines in affected files | 29,471 | 28,077 | −1,394 (4.7%) |
| Production lines across `src/` and `subs/` | 91,766 | 90,372 | −1,394 (1.5%) |
| AST decision sites in affected files | 4,987 | 4,537 | −450 (9.0%) |
| `&&`, `\|\|`, `??` operator sites in affected files | 3,119 | 2,762 | −357 (11.4%) |
| `RunService` method implementations | 296 | 283 | −13 (4.4%) |
| `InvocationRequest` fields | 59 | 56 | −3 |
| `service.ts` lines | 13,421 | 12,439 | −982 (7.3%) |
| `restart-import.ts` lines | 353 | 132 | −221 (62.6%) |

AST counts use the installed TypeScript 7 parser on both Git trees, with zero
syntactic diagnostics. Decision sites count `if`, runtime ternaries, non-default
`case` clauses, loops and `catch` clauses. Operator counts are separate. These
are reproducible syntax counts, not formal cyclomatic complexity, execution-path
counts, maintenance effort, performance, model-token savings or a recovery-only
percentage. No runtime or token-cost improvement was measured.

Two runtime-compatibility modules and five restart-import producer functions were
removed; three legacy import readers remain. The five shared policy/backoff
functions occupy 55 lines. Lifecycle ownership, accepted-result delivery and
workflow scheduling remain with their owners; the module size does not represent
all remaining recovery-related code. Compatibility schemas retain historical
fields, so the reduced invocation interface is not a count of every public field
removed.

## Findings addressed

| Analysis finding | Implementation |
| --- | --- |
| F01 Runtime source and lockfile equality | Removed runtime capture and restart compatibility implementation; installed procedures execute readable task records. |
| F02 Prompt identity allowlists | Removed recovery transition allowlists; current ordinary prompts are constructed for the retained assignment. Immutable evidence within one attempt remains immutable. |
| F03 Mandatory cached context | Hosted tasks, standalone tasks, consultations and administrative sessions can use fresh context. Exact context operations still report an unavailable source accurately. |
| F04 Exact invocation reconstruction | Replaced replay construction with ordinary task restart; retain assignment and accepted results rather than requiring the old conversation. |
| F05 Every tool call journaled | Reads, searches and inspectable source edits bypass the durable consequential-effect journal; scope, settlement and publication fences still apply. |
| F06 Post-edit receipt lifecycle | Removed the separate blocking journal for post-edit checks. Tool owners classify inspectable diagnostics; known direct and prepared focused shell checks do not block on a missing receipt. Unknown or compound commands retain reconciliation. |
| F07 Unrelated payload validation | Session stores validate optional record bodies and payloads when requested. Journal ordering, ownership and essential task evidence remain validated. |
| F08 Repair declarations | New continuation commands require no repair declaration. Exact candidate observations provide attribution independently of recovery approval. |
| F09 Recovery approval ceremony | Active authorized work can continue on startup after settlement; historical failed work needs one continuation command. Intentional holds remain. |
| F10 Duplicate manual protocol | Standalone execution shares re-entry, interruption classification, retry policy and ordinary task construction with hosted execution. |
| F11 Synthetic restart history | New continuation stays in the original run and appends `job-continued`; old failure events remain unchanged. Linked-successor import code is read-only compatibility. |
| F12 Eligibility matrix | Removed blanket exclusions for unfinished analysis, engineering, capability and repair work. Missing essential records identify a concrete obstruction. |
| F13 Workflow replay controllers | Reduced restoration to ordinary durable task/accepted-result readers and completion handling, including nested capability and root repair. |
| F14 Runtime-triggered invalidation | Candidate applicability and actual changes determine reassessment. Runtime identity alone does not invalidate accepted work. |
| F15 Repair admission checks in gates | Removed repair-proof reauthentication. Gates retain ordinary scope, exclusions, candidate applicability and required-check semantics. |
| F16 Additional gate/readiness controllers | Removed recovery group reconstruction and setup receipt hashes. Readiness repeats ordinary preparation; commit effects retain actual reconciliation. |
| F17 Recovery progress heuristics | Removed candidate/tool-count progress resets. One bounded transport/resource replacement policy leaves unresolved work pending. |
| F18 Parallel task inventory | Removed broad recovery task catalog construction; durable assignments and ordinary context remain the inputs. |
| F19 Public restriction protocol | Normal continuation needs a command identity, not occurrence/revision/repair forms. Legacy fields remain readable; web controls expose Continue task/Continue plan. |

## Implementation locations

- [Shared policy](../../subs/harness/subs/recovery/src/reentry.ts) and its
  [declared surface](../../subs/harness/subs/recovery/module.ramify): re-entry,
  classification, bounded retry and cancellation.
- [Hosted workflow](../../subs/harness/src/run/service.ts): ordinary task
  dispatch, accepted-result delivery, same-run continuation, deliberate holds
  and lifecycle ownership. Removed runtime compatibility capture, broad task
  inventories and role-specific prompt reconstruction.
- [Standalone runner](../../subs/harness/src/steps/runner.ts) and
  [manual adapter](../../subs/harness/src/steps/manual.ts): shared construction,
  settlement and command deduplication. Recorded task goal, requirements and
  effective scope prevent an old accepted result being attached to different work.
- [Agent effect dispatch](../../subs/harness/subs/agent/src/session-operations.ts),
  [session adapter](../../subs/harness/src/run/session-operations.ts) and
  [store](../../subs/harness/src/run/session-store.ts): local optional-context
  validation and consequential effect reconciliation.
- [Candidate attribution](../../subs/harness/src/run/candidate-attribution.ts),
  [gate attribution](../../subs/harness/src/run/recovery-gate.ts),
  [committing gate](../../subs/harness/src/run/committing-gate.ts) and
  [readiness](../../subs/harness/src/run/readiness.ts): ordinary source and
  verification contracts. Root repair retains separate original and replacement
  candidate baselines so downtime edits remain distinguishable.
- [Legacy imports](../../subs/harness/src/run/restart-import.ts) retain only
  readers. `run/recovery-runtime.ts` and `run/restart-runtime.ts` were deleted.
  [Historical admission schemas](../../subs/harness/src/run/recovery-admission.ts)
  remain readable; new work does not construct a repair-admission identity.
- [Recovery client](../../src/recovery-client.ts),
  [continuation client](../../src/restart-client.ts),
  [task control](../../subs/web/src/recovery.tsx) and
  [plan control](../../subs/web/src/restart.tsx): ordinary continuation commands
  with stable identities and concise task-oriented presentation.

## Verification

Local validation passed on the worktree. The checks below are focused runs, with
overlapping selections; their counts must not be added as a unique test total.

| Verification | Result |
| --- | --- |
| `npm run type-check` | All four package/configuration checks passed. |
| `npm run check:self` | Passed: zero errors and warnings; partial static coverage with reported analysis limits. |
| `npm run build:web` | Passed; the bundle-size advisory remains. |
| `npm run test:scenarios` | 16 scenarios, 252 steps passed. |
| Hosted lifecycle and debugger | 32 cases passed; preparation recovery passed 14 cases; capability recovery and accepted-result context loss passed 17 cases. |
| Composed crash boundaries | 49 cases passed across the three composition-recovery suites; run-recovery's 35 cases passed. |
| Root and nonfunctional repair | 16 automatic-root cases and 17 nonfunctional-recovery cases passed, including current-candidate attribution and actual old-owner drainage. |
| Session and effect behavior | 139 tests passed across agent operations, shell classification/tools and store behavior; the follow-up legacy-check store run passed all 18 cases. |
| Physical optional context loss | 27 workflow caller cases passed, including 16 missing/corrupt-payload variants across ordinary roles and accepted orientation without a session point; store-cache's 58 cases passed. |
| Accepted results without context | Separate orientation and capability cases physically remove every provider payload after acceptance, then deliver the original accepted result once without a session point. Both passed. |
| Standalone task continuity | 33 cases passed, including accepted-result delivery, command deduplication and refusal to attach an old result to changed goals or scope. |
| Protocol and presentation | 44 client/configuration cases and 75 protocol/effect cases passed; projection suites passed 137 cases. |
| Candidate qualification | 39 focused check/readiness cases, both readiness source-correction cases and all five iteration-gate scenarios passed. Final-deviation's two cases passed. |
| Registered native witnesses | Writer settlement, project locking, retained Git refs/index/source, surviving child-process ownership, audit workspace cleanup (7 cases) and standalone CLI execution (3 cases) passed after the changes. |

Ordinary tests use scripted external answers under the process guard. The native
witnesses are the exact cases registered in
[test-boundaries.json](../../src/tests/test-boundaries.json). No live model or
external administrative service was invoked.

The first configured audit, on `4b1a2c5d9ab878bf03d2401c83492db1ea68cb73`,
automatically selected full scope. Patch integrity, type checking, scenarios,
structural checking and the web build passed. The regression suite reported
3,711 passed, 60 failed and two skipped tests. Its evidence remains at
`refs/audited/runs/2026-10-18T07-46-56Z-4b1a2c5d9`.

The corrective changes preserve the original accepted submission and task
binding, avoid delivering consumed capability/reconciliation decisions again,
retain pending contract work, and keep deliberate debugger pauses. Tests now
exercise ordinary continuation and preservation of pending work without an
execution agent, rather than requiring synthetic interruption or failed-review
records. Corrected focused suites passed, including 43 review/reconciliation
cases, 120 session/context cases and the native debugger process witness.

The configured audit must be repeated on the corrective commit. The authoritative
result for any committed candidate is its `git notes --ref=audit show <commit>`
entry and associated `refs/audited` report. Local focused runs do not substitute
for that qualification.
