# Automatic project repair

**Date:** 2026-10-12. **Status:** First implementation in the
`feat/automatic-project-repair` worktree; committed audit and live qualification
remain outstanding. **Tracking:** `ramify-agent-6ft`; committed qualification `ramify-agent-y03`.

A fault while preparing a local architect's next turn can prevent the ordinary
correction workflow from receiving an engineer's partial result. This mechanism
allows one engineer session to repair the target project and restore that turn.
The original result stays partial; the responsible architect decides the next
implementation step and ordinary gates still decide acceptance.

This is a separate, later workflow built on implemented
[Plan 40](../plans/40-invalid-project-recovery/main-plan.md). Invalid ownership,
unavailable views and ordinary partial results already handled by Plan 40 do not
trigger repair. The [design hypothesis](automatic-project-repair.hypothesis.md)
records the rationale. The implementation witness injects a source-dependent
preparation exception; it does not establish an observed residual production
failure after Plan 40.

## Authority and admission

The [harness principles](../harness.principles.md) still apply. The initial
architect may submit `contingentRepairAssignment` with the project root module,
explicit included child subtrees and instructions. The harness resolves and
records that assignment while current ownership is available. Naming the root
alone does not include its child modules. Whole-project ordinary source access
requires explicitly including those subtrees. Provider exclusions, independent
nested project boundaries and protected files remain enforced by the existing
Plan 40 guard. No new agent role or bypass guard is introduced.

The supported boundary is the construction of a local architect work turn after
a committed partial result. Before fallible construction the harness commits a
`repair-preparation-recorded` event and matching preparation record. It identifies
the work item, attempt, accepted commit, original assignment/result/invocation,
repair assignment and retained input references. When delegation exists it also
captures the candidate head, tree and changed paths; missing candidate evidence
refuses fallback without preventing ordinary turn construction. Earlier preparation with
semantic effects is outside this boundary and is not replayed.

A thrown exception at this boundary admits repair only when all conditions hold:

- The run remains active with invocation and time allowance available.
- The initial architect recorded a matching root repair assignment.
- No automatic repair invocation has started in this run.
- Every preceding writer has a unique confirmed release.
- The original invocation submitted its partial result, settled, and has no
  refused or unknown mutation placement.
- The candidate's existing changes remain permitted by that original assignment.
- The current provider can establish unchanged module topology and the harness
  can capture candidate identities and source evidence.
- The exception is not a typed ownership, historical-authority or schema
  validation outcome belonging to ordinary handling.

Refusal is a retained incident and terminates with the original obstruction and
admission reason. Environment reports, exhausted correction attempts, test
failures, rejected submissions, denied writes, session timeouts and user stops
are not independent triggers. Failure before this boundary keeps existing error
handling. The first version is deliberately restricted to this one boundary.

## Invocation and verification

The repair uses the existing engineer role, fresh session, guarded equipment and
root working directory. `work.automaticRepair` identifies its incident. It has
one invocation, the run's captured engineer defaults for idle, absolute and
command time, and the ordinary engineer context policy. Absolute and command
limits are capped by the remaining whole-run time. It cannot replenish any run
allowance or recursively repair its own failure.

The prompt includes the frozen plan package, exact operation, original partial
assignment/result references, thrown exception and retained diagnostics, root
assignment, candidate/accepted identities, existing dirty paths, limits and the
required handback. It instructs the agent to preserve useful partial work and
restore only preparation. A repair requiring changes to the running harness or
unavailable authority must report `blocked`.

The agent submits `submit_automatic_repair`:

```ts
{
  outcome: 'ready' | 'blocked';
  summary: string;
  checks: string[];
  remainingWork: string[];
  suspectedCause: string | null;
  evidence: string[];
}
```

`ready` is a claim to verify. The harness requires confirmed writer settlement, no refused or unknown repair
mutation placement, preserved captured documents and protected configuration,
preserved module declarations and
module topology, and a delta inside captured and current write authority. Protected file identities are captured immediately before repair and compared
using the same hash/mode representation afterward, so legitimate earlier accepted
changes and unchanged configuration symlinks are preserved. The
first version protects all existing declaration bytes; it cannot create, remove,
re-parent or redesign modules. A successful repair must also allow the same pure
turn construction to run again with refreshed views.

A fresh responsible architect receives the repair report, current evidence and
original partial result. The harness records the verified delta and `continued`
incident together after delivering that turn. It does not mark an iteration or
work item complete on the repair agent's judgment.

Later committing gates accept only unchanged canonical ordinary files or
recorded deletions from that verified delta, with matching hashes and modes.
They require a co-committed incident/delta, matching captured authority and prior
confirmed writer release. Existing candidate changes must retain their original
authority; a broad repair cannot authorize them retroactively. Current ownership
can narrow repair authority. Later edits cannot borrow the earlier repair's
permission merely by naming the same path. The first subsequent passing committing gate consumes the supplement, so
restoring old repair bytes after a later accepted change has no special authority.
A harness commit limited to scenario files does not consume unaccepted repair
source changes.

## Durable evidence and interruption

The ledger is authoritative; materialized files are recoverable copies. Repair
incidents use `apr-0001` identities, distinct from run restart `RecoveryId` and
`rec-*` identities. The schema definitions linked below define exact strict
formats, nullability and validation:

| Record | Schema and materialization |
| --- | --- |
| Root assignment | `ramify-agent.automatic-repair-assignment/1`, `repairs/assignment.json` |
| Preparation | `ramify-agent.repair-preparation/1`, `repairs/preparations/<id>.json` |
| Incident revision | `ramify-agent.repair-incident/1`, `repairs/incidents/<incidentId>/<revision>.json` |
| Attempt evidence | `ramify-agent.automatic-repair-attempt/1`, `repairs/attempts/<incidentId>.json` |
| Verified delta | `ramify-agent.automatic-repair-delta/1`, `repairs/deltas/<incidentId>.json` |
| Export payload revision | `ramify-agent.repair-incident-export/1`, `repairs/exports/<incidentId>/<revision>.json` |

[Preparation, authority and delta formats](../../subs/harness/src/run/repair-preparation.ts),
[public incident/result formats](../../subs/harness/src/interfaces/protocol/repairs.ts),
[export format](../../subs/harness/src/run/repair-export.ts) and
[layout](../../subs/harness/src/run/records.ts) are harness-owned contracts.

Each incident retains its original exception, preparation and partial-result
references, admission decision, authority, candidate before and after, repair
invocation/session/result, verification, continuation, timing, available usage
and versions, and export state. `changedPaths` records aggregate candidate paths;
staged/unstaged/untracked arrays are populated only when separately known.
Unknown measurements remain null. Each completed attempt retains before/after
source identities and changes, protected-file identities and any diagnostic
capture failure, even when the agent reports blocked or verification fails. Only
a verified continuation produces an authorizing delta. The original obstruction
is never overwritten by the repair report.

The event lifecycle is `admitted → running → continued | blocked | unverified |
interrupted`, or initial `refused`. Admission may also end before invocation.
Incident revisions are consecutive. Export revisions may change only export
metadata. The projector rejects inconsistent record/event identities, invalid
transitions and rewritten original evidence.

Restart never launches another session for an admitted or running repair. An
unfinished repair becomes interrupted and requires manual attention, retaining
its candidate and evidence. Stop records interruption when possible; the UI also
derives interrupted display from a terminal stop/failure if an earlier incident
remains open, without inventing verification or confirmed writer settlement. Existing run restoration continues to own writer
settlement and terminal run handling; repair does not weaken those protections.

## Beads and UI

Every incident first commits a self-contained export payload locally. A configured
tracker uses an existing Beads workspace and an absolute `bd` executable; it need
not be the target project or contain a ramify-agent checkout. The harness never
initializes a tracker or chooses one from the target's current directory. The
configured workspace must contain its own existing `.beads` directory; an
ancestor's tracker is not implicitly selected.

Configure automatic export when starting the service:

```sh
npm run serve -- --project /absolute/target \
  --bd-executable /absolute/path/to/bd \
  --beads-workspace /absolute/existing/tracker
```

From the harness checkout, export or retry retained incidents while no service
holds the target project lock:

```sh
npx tsx src/main.ts repair export \
  --run /absolute/target/plans/example/.harness/jobs/RUN_ID \
  --bd-executable /absolute/path/to/bd \
  --beads-workspace /absolute/existing/tracker \
  --incident apr-0001 --json
```

Omit `--incident` to export all recorded incidents. The manual command requires
the original target/run directory structure and validates its ledger and payload;
it is not an importer for a detached backup directory.

Exports create Beads **tasks** labelled `repair-incident`, without asserting that
the root cause is a harness bug. Identity is
`ramify-agent:repair:<project-key>:<run-id>:<incident-id>`, where project-key is
SHA-256 of the existing target's canonical path, resolved for export identity
when the payload is created. Starting the service or manual exporter through a
symlink preserves that same identity. The adapter looks up all matching issues,
including closed ones, before creating, reconciles uncertain creation and retains
the issue ID. An issue discovered or created by an export is first recorded in
the run ledger; subsequent exports with that recorded ID update its description
with the retained payload. Export never changes its status or closes the
investigation. Multiple matches become `conflict`. Missing configuration, CLI,
tracker or delivery failure leaves `pending`; it does not invalidate a verified
repair. Calls use argument arrays and stdin, a 15-second command limit, a 1 MiB
payload/output limit and `bd --sandbox`; no Git or Dolt remote synchronization is
part of export. Manual retry preserves terminal run state.
The manual command exits 0 when every selected incident is exported, 1 when any
remains pending or conflicted, and 2 when the run cannot be opened or validated,
the project lock cannot be acquired, or the export result cannot be persisted.

The Run page shows a persistent repair count and incident history, including
admission/refusal, active state, original obstruction, transcript link, result,
verification/continuation, before/after candidate paths and identities, timing,
available usage and Beads state/issue ID. Session and timeline labels distinguish
repair engineer work from ordinary implementation. The web module only projects
harness-owned records.
