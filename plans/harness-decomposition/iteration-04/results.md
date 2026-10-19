# Iteration 4 — autonomous lifecycle and planning

Base: `a4e0a85b36b14d4984547a881d4197c204794058`. The user-approved native implementation/one-review cadence in [execution notes](../execution-notes.md) applies. Historical RA statuses and the parked inspection experiment are unchanged.

## Delivered boundary

Autonomous owns managed admission, stop/resume, activity ordering, recovery, lifecycle records/log and serialized accepted transitions. Parent application composition binds its project lock into a held-authority interface and a quiescent-close callback. Only the parent callback releases the lock, after the unchanged run/admin/session settlement checks. HTTP and CLI use that composition; projections receive the existing frozen read-only query interface.

The nested planning child now performs intake/incorporation, principles extraction, initial architecture, each captured-document check, source recheck, acceptance derivation and immutable catalog/incorporation staging. It then proposes the one `analysis-accepted` event with entries, hypotheses, registry, initial work and scenarios in the same record bundle. Lifecycle retains current-authority fencing, contingent repair authorization, the authoritative commit, approval/stop waiting and crash seams. Reopening after acceptance skips planning; staged files without the accepted event confer no authority.

Planning receives captured inputs/view/baseline facts and an explicit read-only task request/executor, not Run, RunLog, mutexes, live maps or the whole InvocationRequest. Initial/extractor prompt construction moved with it. Accepted evidence reads take a captured manifest and accepted immutable references. Owner selectors select entries/hypotheses/registry from immutable replay lines; the universal projection composes those selectors. Legacy schemas, storage paths, errors, citations and public browser protocol remain unchanged.

Shared invocation/outcome/session/lineage/usage schemas now belong to task-execution, whose ordinary source has no autonomous imports. The actual managed/manual/standalone runtime remains shared. Existing provider contracts and ordinary/testing exposures serve moved source and real consumers; no obsolete service forwarding file remains. Coordination and acceptance algorithms remain explicitly local to autonomous for iterations 5–6. This is an intermediate boundary, not completion of the whole decomposition. No-review-time-limit behavior is preserved.

## Actual structural observations

Counts exclude generated catalogs. Testing source includes helpers. API counts are distinct explicitly named ordinary exposure spellings, including companions and relayed names; they are not minimal API or productivity claims.

| Descriptor | Before | After |
| --- | ---: | ---: |
| Harness-parent production / testing source files | 196 / 400 | 98 / 388 |
| Autonomous production files / lines | part of parent | 94 / 30,269 |
| Autonomous owner-local testing files / lines | part of parent | 9 / 2,983 |
| Planning production files / lines | part of parent | 10 / 1,570 |
| Planning owner-local testing files / lines | part of parent | 4 / 1,373 |
| Autonomous / planning distinct ordinary exposure names | absent | 665 / 69 |
| Task-execution production / testing source files | 17 / 10 | 18 / 10 |

Direct relative-import provider owners: autonomous 14, planning 8, task-execution 7 (including agent/Pi separately). Planning's lifecycle dependencies are immutable records/captured-document reading; its execution uses explicit ports. The intermediate autonomous API remains broad because manual/integration consumers and typed companions still share workflow helpers. Later owner cuts must account for that breadth. No comparable operational task, latency or token observations establish a performance/productivity benefit.

## Verification and limits

- Guarded focused runs passed: 12 files/183 tests covering planning, source drift/rejection, accepted bundle/scenarios, evidence-stage and accepted-transition crash seams, review-stop, lifecycle reopening and composed recovery; 11 files/94 tests covering lifecycle commands/bounds/replay/restart, materialization, HTTP/query isolation and shared standalone/manual callers. An earlier five-file/40-test run overlaps these checks.
- Exact registered native Git/protocol/restart witnesses: three files, all six cases passed. Registry entries and process guards are unchanged.
- `npm run type-check`, `npm run check:self` and `git diff --check` passed. Module check reports 21 owners, zero errors/warnings and 711 explicit analysis limits; coverage remains partial.
- Consumer ordinary/testing catalogs were refreshed with the installed CLI, including lifecycle/planning, harness/root, task execution and sibling providers/projections. Actual supported entries were inspected; catalogs retain their own coverage/truncation limits. Architect materialization is contextual evidence, not a substitute for those APIs.
- No duplicate full audit. Final configured audit and whole-plan native review remain with the coordinator.

No protected requirements, principles, package/lock/configuration files changed. Original baseline/collector artifacts remain untouched. No large evidence copies were generated. Current README files describe the two owners and their intermediate boundaries.
