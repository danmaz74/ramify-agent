# Iteration 3 — shared prepared-task execution

Base: `0297b979be5378faca81834655ef02a4aaf77e94`. Workflow cadence follows the user-approved native implementation and one-review decision in [execution notes](../execution-notes.md). Historical RA statuses and the parked inspection experiment are unchanged.

## Delivered boundary

`subs/harness/subs/task-execution` now runs the actual prepared attempt used by managed runs, manual steps and standalone sessions. It owns session/store binding, fresh/continue/fork operations and context-loss fallback orchestration, generic equipment/tool/submission binding, framing and manifests, observations/port recording, transcripts/readers/pages, transcript writer cache and writer/process settlement. Reused operations retain their original packet/authority/tool/acceptance correlations; preparation is lazy so changed or unavailable prompt files cannot replace original retry inputs.

The parent InvocationRunner remains the workflow admission/recovery and atomic journal adapter. Its call to `executePreparedTask` passes selected immutable values and per-invocation callbacks, not Run, RunLog, mutexes, mutable maps, StepInputs, starting-input groups or LoadedPackage. Workflow adapters retain task/role/procedure/schema/environment selection, scheduling, successor admission, semantic retry/completion, authority/destinations, consultation construction/delivery and scratch/candidate policy. Shared framing is the same implementation used by render and execution. Writer release/accepted outcomes still pass the original serialized journal transitions and current-authority fences.

Administrative Beads sessions retain direct agent operations and consume the shared session-reference reader; they are not forced through autonomous task envelopes. Assisted Pi retains its own established workflow. Agent/Pi, session-store, ledger, evidence and KPI are real providers; recovery policy remains with workflow admission through the existing recovery provider. Child ordinary source imports no autonomous scheduling implementation.

Review policy still disables elapsed-silence cancellation for review/reconciliation/NFR assessment paths. Explicit stop, actual failure and settlement remain effective. Durable schemas, hashes, manifests, original input/tool identities and historical readers remain compatible. `AgentSessionRef` and `invocationUsageSchema` are distinct bindings for existing originals beside unrelated browser projection names.

## Actual structural observations

Counts use the base Git tree and current source, excluding generated views. Import counts identify target file/export spellings; they are structural descriptors, not provider identity proofs or productivity measurements.

| Descriptor | Before | After |
| --- | ---: | ---: |
| Parent production files | 208 | 196 |
| Parent testing source files | 410 | 400 |
| Parent runner lines | 1,251 | 865 |
| Task-execution production files / lines | part of parent | 17 / 3,640 |
| Task-execution owner-local test files / lines | part of parent | 9 / 1,283 |
| Declared child API bindings, including companions/testing | absent | 111 |
| Child direct external named import bindings | no comparable child | 73 |

The child consumes six owners: parent common/data contracts, agent, evidence, KPI, ledger and session-store. Native writer settlement moved with its exact three claims; `src/tests/test-boundaries.json` changes only that file path. Eight ordinary component test files and their transcript helper moved; mixed managed/manual/standalone/consultation/provider integration remains with its behavior. No test assertion, process guard or owning native case was weakened.

## Verification and limits

- Three focused guarded Node runs passed: 16 files/181 tests; 14 files/168 tests; 15 files/133 tests. These are execution counts with some overlap. They cover packet/tool/provenance compatibility, fresh/continue/fork and immutable retries, managed/manual/standalone callers, unavailable-context recovery, stop/settlement, consultations, administrative sessions, review lifetime, sibling providers and historical projections.
- Exact native writer boundary: one file, all three cases passed.
- `npm run type-check`, `npm run check:self` and `git diff --check`: passed. Module check covers 19 owners with zero errors/warnings and 477 explicit analysis limits.
- Ordinary/testing API catalogs refreshed for task-execution, harness, assistance, reviews, projections, KPI and root consumers; actual source/declaration access checked, not inferred solely from an architect view. Generated catalogs retain coverage/truncation limits.
- No duplicate full audit. Final configured audit and whole-plan native review remain with the coordinator.

No protected requirements, package/lock/configuration files or principles changed. Original baseline artifacts remain untouched; no large producer evidence was duplicated. Comparable operational task/latency/token observations are unavailable, so no productivity gain is claimed. The retained workflow adapter is intentional policy and journal ownership, not an obsolete forwarding path.
