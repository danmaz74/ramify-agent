# Iteration 5: work coordination

Base: `5b5aa2a6db3e6907626eeed7f7189e719dfed414`.

The new autonomous/work-coordination child owns the actual placement and work
loop, frontier/hypothesis delivery, assignment publication, contract revisions
and obligations, qualification/delegation, nested capability stack and consumer
return. Managed execution calls this implementation. Manual execution and
read-only projections consume its publication decisions, records and historical
selectors; there is no duplicate scheduling algorithm or service forwarder.

The child receives detached, versioned committed observations and captured run
inputs, plus specific execution, evidence, acceptance and transition ports. It
owns its prepared-scope cache. No mutable Run, RunLog, ledger, mutex or live map
crosses the interface. Lifecycle retains serialized writes, idempotent effect
intent/completion and existing crash seams. Domain stack/body validation lives
with coordination and is rechecked at the lifecycle append.

Acceptance remains autonomous-local for iteration 6. Its handback result carries
the full gate, retained gate record identity, candidate tree, reviews, accepted
completion basis and reconciliation identity, with explicit historical absence.
Lifecycle checks these under the same handback serialization, including current
writer settlement and candidate tree. A new composed regression changes the
source after verification-started and proves that handback and successor work
are refused. Recovery still reuses the authenticated action and completed gate;
partial results and original consumer-goal resumption retain their semantics.
This small lifecycle fence is needed now because a boolean acceptance port would
lose the exact candidate basis across the new boundary.

The universal committed-record reader now composes planning, coordination and
shared task selectors. Invocation/outcome selection belongs to task execution;
record hashing and retained-record reading share the existing harness reader.
Historical event/schema shapes, public browser contracts and unlimited review
lifetimes are preserved. No principle, specification or protected configuration
changed. Five native registry entries changed only their owner-relative file
paths; claims and process guards remain intact.

## Verification

- Guarded coordination plus composed acceptance: 29 files, 183 tests passed.
- Shared managed/manual/standalone, recovery, query, lineage and KPI consumers:
  13 files, 143 tests passed.
- Final selector/lineage checks: 2 files, 20 tests passed (overlaps the above).
- Five exact native boundary files: 7 tests passed; registry discovery: 32 tests
  passed. Native witnesses cover actual Git/produced-test/delegation/recovery
  behavior; ordinary tests retain scripted external answers.
- Root type-check, check:self and staged patch checks passed. Module checking
  covered 22 owners and 1,034 source files: zero errors/warnings, with 732
  explicitly reported analysis limits and partial coverage.
- Refreshed all 22 consumer ordinary/testing API views and the architect view.
  Inspected the actual autonomous consumer catalog for WorkCoordination and its
  ports, and the new owner's ordinary/testing metadata and entries. Generated
  views are not edited or committed; API metadata reports bounded/truncated
  entries rather than complete verification.

## Structural observations and remaining work

Counts below are actual nearest-module source ownership, excluding generated
views; testing counts include helpers. They are structural descriptors.

| Owner | Production files | Production lines | Testing files |
| --- | ---: | ---: | ---: |
| Harness parent | 98 | 21,394 | 348 |
| Autonomous | 47 | 15,178 | 9 |
| Work coordination | 57 | 15,654 | 40 |
| Task execution | 19 | 3,931 | 10 |

Autonomous previously had 94 production files and 30,269 lines. Work coordination
has 33 test files (28 guarded, five native) and seven helpers. Its ordinary
imports use 12 declared provider owners, including the explicit lifecycle/data
ports in its parent, planning, task execution, evidence, agent, ledger and KPI.
Its declaration names 389 distinct ordinary and 46 testing exposure spellings;
these include companion contracts and are not a claim of minimal API size.

Iteration 6 still owns extraction of candidate qualification, gates, reviews,
reconciliation, completion/obligation discharge and close-correction, together
with remaining mixed acceptance/lifecycle adapters. Project locks, jobs,
commands and shared support retain their explicit parent ownership. No paired
operational performance observation exists; no productivity, latency or token
improvement is claimed. Original baseline files and the parked inspection
experiment are unchanged.
