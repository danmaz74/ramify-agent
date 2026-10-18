# Assisted iteration records through one MCP tool

**Status:** proposed for native assisted implementation; execution has not started.
**Source baseline:** `d50362bd317e60093fee14d06c773ff097cd4548`.
**Execution:** Astra coordinates native Sol implementation; RA performs candidate assessment through Pi and the configured audit.

## Outcome

Make assisted iterations measurable with two calls to one MCP tool: record when work starts, then submit its candidate for checking. Retain declared module focus, the initial Git commit and timestamps in the existing assisted job. Reuse assessment and audit evidence so a later analysis can count iterations, distinguish repairs, reconstruct changes and measure elapsed time without a separate tracker.

The implementation must preserve unrestricted cross-module engineering, existing assessment gates, protected-file handling and the original plan-execution baseline. Iteration observations do not become a scheduler or permission system.

## Current behavior and applicable commitments

The [assisted service contract](../../docs/architecture/agent-assistance/service.spec.md) currently exposes `iteration_assess` with explicit `base`, `candidate`, `brief` and assessment context on each request. It retains assessment identities, submission timestamps, stage completion times, audit evidence and findings, but no distinct native iteration identity or start time. `plan_start` captures the plan-execution baseline; that is not necessarily an iteration's initial commit.

Follow the target's [repository instructions](../../AGENTS.md), [harness principles](../../docs/harness.principles.md) and [testing contract](../../docs/testing.spec.md). The [assistance principles](../../docs/architecture/agent-assistance/approach.principles.md) describe the proposed direction; this plan explicitly retains its commitments to lightweight native coordination, unrestricted cross-module edits, reuse and honest evidence. Document status remains relevant; a filename does not establish adoption.

The public service specification will need an additive update describing the new tool and records. Preserve its existing protection, authority, recovery and gating guarantees. No principle changes are needed.

## Required behavior

### One tool with two actions

Expose `iteration` with action-specific arguments. Both actions identify the existing `plan_id`, `job_id` and retryable `command_id`. The transport remains a thin adapter over harness-owned behavior.

**`action: "start"`** accepts:

- `brief`: the intended outcome.
- `focus_module`: a project-relative module path, or explicit `null` for a broader assignment. This is declared focus, not a write scope or a computed ownership claim.
- Optional `base`: a Git revision; default to the target checkout's HEAD.

The service resolves the initial commit to its full Git identity, records its own start timestamp, persists the brief and focus once, and returns an `iteration_id` with the captured start information. No Pi session, audit, candidate commit or implementation work is launched.

Observe whether the checkout has staged, unstaged or untracked changes at registration using existing Git facilities. A dirty checkout is allowed and remains visibly qualified: the initial commit does not contain those edits, so later diffs are not exact attribution to the iteration. An unavailable cleanliness observation is explicitly unknown, never clean. Capture enough provenance to distinguish an explicit base from the observed checkout HEAD when they differ. Resolve missing/invalid base revisions as ordinary input errors; never invent a commit. If HEAD changes during default-base capture, report the ambiguity or retry the bounded observation rather than silently presenting a coherent snapshot.

**`action: "end"`** accepts:

- `iteration_id` and the exact candidate commit.
- Existing assessment-specific inputs where useful: acceptance references, pinned requirement documents and `previous_assessment`.
- Optional additional context that supplements the stored outcome without replacing it.

Retrieve the original commit, brief and focus from the start record. Do not require clients to repeat them or allow the end call to overwrite them. Submit to the existing assessment pipeline and return an `assessment_id` promptly. Existing status, result, detail, cancellation and explicit resume operations continue to serve the assessment.

`end` means the candidate is ready for checking. It does not assert acceptance. Audit, protection comparison, Pi analysis, finding reconciliation and the gate retain their existing behavior.

### Identity, repairs and continuation

An iteration belongs to exactly one assisted job. Multiple iterations may be open; there is no implicit current iteration. Reject an unknown iteration or one belonging to another job without launching assessment work.

Retried start requests with the same command ID and arguments return the same ID, timestamp and initial commit, including after restart or HEAD movement. Retried end requests return the same assessment without another launch. A changed request under an existing command ID retains the existing conflict behavior. Check command replay before recapturing volatile Git facts. Reuse command admission and ledger recovery rather than introducing a second idempotency system.

A repair uses another end call with the same iteration ID, a new candidate and a new command ID. The existing prior-assessment link carries review/finding context. Preserve the iteration's original commit and start time; do not count repair candidates as new iterations. Comparing the original commit with each candidate gives cumulative changes; comparing successive candidates gives repair changes. No source copies or new Git snapshot store are needed.

Keep start records and their linked assessment identities recoverable through `job_detail`, including iterations with no assessment. Preserve existing job-detail fields. Those with no assessment are described as started and not assessed; do not infer abandonment or completion. Module-focused work remains module-focused even when its diff touches other owners. Old assessments lacking an iteration record have unknown focus and implementation timing, not an invented classification.

### Timing and evidence

Use the existing service clock for iteration start, assessment submission and a new assessment completion timestamp. Completion is recorded when a valid outcome is durably committed, whether the gate is clear, action-required or incomplete. Queued, running, interrupted or cancelled assessments without a completed outcome have no fabricated completion time. Resume preserves the original request timestamp; timestamps already committed remain stable on replay. Existing records without the added field remain readable and expose missing timing honestly.

Retain enough information to derive, without storing redundant aggregate metrics:

- Time to first candidate: first linked assessment submission minus iteration start.
- Assessment elapsed time: its completion minus submission.
- Time to a clear candidate: that assessment's completion minus iteration start.
- Number of assessment attempts associated with the iteration.

These are elapsed intervals, including waiting and interruptions. Parallel iteration intervals are not additive plan duration. Do not substitute Git commit timestamps for recorded call times or infer active worker effort. Clock inconsistencies remain explicit rather than yielding invented positive durations. A clear result is evidence for its candidate, not approval of subsequent edits.

Preserve existing audit results, counts, durations, selection, provenance and reuse references. Historical audit execution duration is not current retrieval cost. This feature adds no test runner, local command log, token collector or per-stage timer system. Observation and post-execution analysis can join the retained records later; a new report command, dashboard and postmortem skill are outside this plan.

### Compatibility and native guidance

Keep existing `iteration_assess` clients and historical records working. That entry point and the new end action must compose the same assessment implementation. Cumulative final-plan assessment continues to use the original registered plan baseline, not an iteration baseline. Iteration metadata must not alter assessment policy or become mandatory for legacy calls.

Update the [coordinator skill](../../.agents/skills/ramify-agent-coordinate/SKILL.md) to call start immediately before an outcome's implementation begins and end when its committed candidate is ready. Retain the returned iteration ID in continuation notes, reuse it for repairs, and keep final-plan assessment separate. The [worker skill](../../.agents/skills/ramify-agent-module-work/SKILL.md) continues to leave candidate assessment to the coordinator; amend it only if needed to keep the handoff consistent. Update the [usage guide](../../docs/agent-assistance.md) and service contract with actual argument/result shapes and examples.

Native skills are separate deliverables from runtime behavior. Module-focus advice stays advisory. Do not add permission requests, scope expansion, exclusive-open-iteration rules, automatic source repair or a required plan task graph.

## Module impact and reuse

| Owner or surface | Expected work and reuse |
| --- | --- |
| Harness: [assistance contracts](../../subs/harness/src/assistance/contracts.ts), [service](../../subs/harness/src/assistance/service.ts), [store](../../subs/harness/src/assistance/store.ts), [MCP](../../subs/harness/src/assistance/mcp.ts) | Own the new iteration record, start/end admission, assessment link, completion timestamp and retrieval. Reuse project locking, command receipts, ledger commits, recovery and the existing assessor. Most implementation knowledge is here. |
| Evidence: [Git helpers](../../subs/harness/subs/evidence/src/git.ts) | Existing `currentHead`, `resolveCommit` and `isCleanRepository` are exposed to the harness. Prefer those supported helpers for commit and cleanliness observations. If a small missing acquisition contract is discovered, add it here and verify the harness consumer; do not introduce another Git command runner. |
| Ledger, audit, reviews and findings children | Consume their existing contracts. No new persistence system, audit parser, review policy or finding lifecycle is expected. |
| Skills and documentation | Explain the two calls, repairs, retained identities and timing limitations. These edits belong with the end-to-end feature. |
| Root CLI, web and KPI | No new commands, projections or metric subsystem are required. The existing MCP server entry point remains sufficient. |

The stable boundary is the existing assessor input: a concrete base, candidate and intended outcome. Resolve iteration inputs into that boundary. A persisted effective assessment request may retain the resolved inputs for historical replay; this is deliberate evidence reuse, not a separate mutable copy of iteration metadata.

## Proposed implementation iteration

**Iteration 1 — Record and assess a native iteration through MCP.**

- **Outcome:** a client starts a focused or broader iteration, implements freely, submits and repairs candidates, reconnects and retrieves enough evidence to reconstruct the iteration and its elapsed intervals. Existing assessment callers continue to work.
- **Focus:** `subs/harness`. Keep schemas, persistence, transport, assessment composition and their integration tests together: separating these would make multiple workers learn the same admission and recovery invariants. Small Git-provider, skill and documentation edits can be made by the same worker.
- **Dependencies:** the assisted implementation already on the source baseline; an installed configured audit and Pi credentials only for live assessment qualification. No separate discovery iteration or parallel worker is justified by the current evidence.
- **Verification:** service and official MCP client tests exercise the acceptance cases below with controlled clocks and scripted external answers. Run the repository's required structural/type checks and a default configured audit on the committed candidate. RA performs iteration assessment, followed by cumulative final-plan assessment. The coordinator may use the existing assessment entry point to qualify the new tool before adopting it.

Use one already-oriented Sol worker for this coherent outcome. Split only if inspection reveals a substantive independent Git-provider requirement; retain one explicit integration owner. Candidate corrections remain repair attempts within the iteration rather than a prescribed new iteration for every fix.

## Acceptance and qualification

| Case | Required evidence |
| --- | --- |
| Focused and broader starts | The actual MCP tool accepts both action variants; a focused path or explicit null, brief, server time and resolved initial commit are retrievable. No assessor runs on start. |
| Git provenance | Default HEAD and explicit-base cases retain full identities. Dirty starts are allowed and qualified; unavailable status is unknown. Invalid revisions and a moving default HEAD cannot silently produce a false baseline. No commit, reset or source snapshot is created. |
| End-to-end assessment | End inherits the registered brief and initial commit, links the candidate and iteration, and returns before a held assessor completes. Existing result retrieval reports the actual gate and completion timestamp. Acceptance/document references reach the shared assessor. |
| Retry and recovery | Lost start/end responses, close/reopen and missing materialized records retain identities and original times through existing ledger recovery. Conflicting retries and wrong-job iteration references do not create work. |
| Repair | Two candidates submitted under one iteration produce linked assessments and one iteration count, with the same start/base. Submission retries do not increase attempt count. |
| Timing and overlap | Controlled times demonstrate the derived intervals. Two independently open iterations stay distinct. Interrupted/resumed assessments retain submission time; unfinished and legacy records do not acquire fabricated completion times. |
| Compatibility | Existing `iteration_assess`, final baseline validation, cancellation, finding follow-up and protected-change handling still work. New and old entry points share assessment composition. |
| User workflow | The coordinator/usage examples match the implemented schema, start before implementation, retain IDs and use end again for repairs. Module focus never blocks cross-module edits. |

Follow [test boundaries](../../docs/testing.spec.md): ordinary tests script Git, audit and Pi answers; real process claims require an existing applicable native boundary or a reviewed new entry. Extend the focused [service tests](../../subs/harness/src/tests/assistance-service.test.ts) and [MCP tests](../../subs/harness/src/tests/assistance-mcp.test.ts), rather than testing documentation wording.

During implementation qualification, retain a small MCP start/end/retrieval witness against disposable committed source if practical, using existing audit reuse and a real assessment when configured. Do not manufacture a defect just to force a repair. Distinguish live observations from scripted repair/recovery coverage and do not claim performance gains from interface tests. A live-exercise limitation is reported as such; it does not justify substituting fabricated timing.

Planning this feature does not register an execution, run Pi or change service behavior. Implementation handoff consists of this plan, its source baseline and the single proposed iteration. Any material deviation from the requirements should be recorded explicitly; ordinary implementation choices remain with the coordinator and worker.
