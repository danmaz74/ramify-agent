# Task restart and unnecessary recovery complexity

**Date:** 2026-10-18. **Status:** analysis and simplification recommendations.
**Source baseline:** `091ca382d8b514bdc6b83f0e98f00f5e395b56f1`, with the working
tree inspected on this date. No runtime changes are made by this analysis.

Recovery should normally restart the unfinished task through ordinary execution.
A fresh agent receives the assignment and relevant decisions, inspects the current
project, and continues. Retaining the previous session can save work, but cannot
be a requirement for completing the task. Recovery is expected to be rare; its
frequency and runtime cost are not measured here.

The current implementation goes substantially beyond that requirement. It tries
to restore exact invocations and session points, authenticate comprehensive
before/after identities, preserve individual tool effects, and admit continuation
through a separate protocol. These choices create failure conditions and supporting
code that ordinary task restart would not need. The strongest removal candidates
are implementation-hash vetoes, prompt-transition allowlists, mandatory retained
sessions, and treating every unfinished tool call as a blocking external effect.

This is a source-based assessment of necessity under the user's task-restart
principle. It does not establish that every line containing “recovery” is
unnecessary, or that the current implementation violates its older specifications.
Several excessive restrictions are explicitly required by current tests; those
contracts must change with the implementation.

## The principle and the facts that must survive

[Harness Principles](../harness.principles.md) already says an interrupted agent
can restart from the beginning, inspect files, and avoid redoing or undoing work.
The user's clarification applies that principle to the architecture of the
harness: keep the exceptional machinery small and rely on agents' ordinary
ability to assess the situation.

The distinction is between a task and an attempt to execute it. The task retains
its goal, scope, decisions, dependencies and eventual result. A provider session,
prompt packet, tool-call sequence and invocation identifier describe an attempt.
An interruption need not preserve that attempt to preserve the task.

| Necessary fact | Why current files alone are insufficient | Sufficient responsibility |
| --- | --- | --- |
| The assignment, requirements and applicable decisions | Partial code does not uniquely describe the intended outcome or decisions made elsewhere. | Persist the task and make relevant records accessible to a fresh agent. |
| The previous execution can no longer write or submit | A surviving process can race the replacement; an old callback can arrive late. | Settle registered processes and prevent a superseded attempt from publishing a result. |
| A task result or workflow transition was already accepted | Code does not establish whether a child was assigned, a decision accepted, or a handback delivered. | Persist task results and transitions with stable identities and apply each transition once. |
| A concrete operation whose repetition matters completed | Some effects can finish before their acknowledgement is recorded. | Inspect the actual destination or use an operation identity for that effect. |

Explicit user stops, approval requirements and assignment boundaries continue to
apply. An interrupted run remains authorized work unless an actual instruction or
unresolved condition says otherwise. Missing credentials, unreadable essential
task records, or a surviving writer can prevent progress; losing a conversation
does not.

The fourth fact must stay narrow. Reading files, searching and running ordinary
checks are repeatable. Partially edited files are inspectable by the replacement
agent. A Git commit can be located in Git. A tracker mutation needs inspection of
the tracker. Arbitrary shell commands cannot all be assumed repeatable, but neither
can they all be classified as uncertain external operations merely because a
session ended. Retain the command and relevant result location when an actual
ambiguity matters.

Ordinary acceptance still verifies the resulting candidate. An old audit remains
evidence about its original candidate; fresh verification can establish the new
candidate without reproducing the previous sequence of audit attempts. Accepted
decisions remain available for the responsible architect to reconsider when
current evidence warrants it.

## Code distribution and measurement

The [inventory](2026-10-18-task-restart-and-recovery-complexity.inventory.json)
records source hashes, matching line locations and selected method spans. The
scan covers TS, TSX and CSS under `src` and `subs`, excluding tests, fixtures,
dependencies and generated views. It searches recovery, restart, restoration,
resume, session loss, effect reconciliation and related identifiers, then follows
the relevant callers and supporting code. It does not search superseded designs.

| Surface | Physical lines | Interpretation |
| --- | ---: | --- |
| Ten files named for recovery or restart, including CLI and UI | 1,049 | Dedicated surface; includes necessary behavior and reporting. |
| Twenty-nine selected methods in `RunService` | 1,523 | Loading, restoration, admission, restart and accepted-result reconciliation; method spans include adjacent comments. |
| `run/session-operations.ts`, `run/session-store.ts`, agent `session-operations.ts` | 1,600 | Shared persistence and execution machinery; much also supports ordinary continuation. |
| `steps/runner.ts` | 1,324 | Mixed execution code with a separate manual recovery implementation. |

The textual scan finds 1,810 matching lines in 123 source files. These are
navigation counts, not removable-line estimates. Recovery is concentrated in
`RunService` and session execution, but its requirements reach gates, role
workflows, records, public protocols, clients and tests. The earlier 24,918-line
count for `run/` describes all run orchestration and must not be attributed to
recovery.

## Confirmed unnecessary restrictions

### F01 Runtime source and lockfile equality

[recovery-runtime.ts](../../subs/harness/src/run/recovery-runtime.ts),
`captureInstalledRecoveryRuntime` and `recoveryRuntimeFromSources`, hash installed
source groups and the whole lockfile into five purported contract identities.
[recovery-admission.ts](../../subs/harness/src/run/recovery-admission.ts),
`validateExternalRepair`, rejects differing contract hashes. The manual path in
[steps/runner.ts](../../subs/harness/src/steps/runner.ts),
`runResourceInvocation`, compares the entire recorded runtime identity too.

Source equality does not establish whether a task can execute, and a source change
does not establish incompatibility. This can reject precisely the harness fix
needed to continue. The hashed source entries also include absolute paths, so
relocating the harness can change the identity without changing its source bytes.
Remove these equality conditions from admission and dispatch.
Keep version information for provenance and handle concrete unreadable records or
unsupported operations where they are encountered. Hashes identifying a candidate
or checking a record's contents serve different purposes and are not implicated.

### F02 Prompt hashes and bespoke transition allowlists

[restart-runtime.ts](../../subs/harness/src/run/restart-runtime.ts) contains three
literal old/new prompt-hash pairs in `promptTransitions`, a special legacy policy
case, and an exact captured Ramify version check. Its normalization functions
rewrite comparison identities to admit those selected transitions.
[service.ts](../../subs/harness/src/run/service.ts) also checks prompt equality in
`load`, `captureRecoveryIdentity`, `nonfunctionalResumeRefusal` and
`restoreInvocation`.

Use current role procedures and tools to execute the retained task. Preserve the
user's requirements and accepted decisions independently of the old prompt bytes.
Delete the prompt allowlist and equality vetoes. A genuine provider record-format
conversion may still be necessary; exact provider version equality alone is not
such a conversion. `restart-runtime.test.ts` explicitly tests refusal of an
unknown prompt change, so this is an intentional restriction to replace.

### F03 Useful cached context becomes mandatory execution state

[service.ts](../../subs/harness/src/run/service.ts), `recoveryBlockers`, requires
the exact recorded session source unless a named reconstruction is present.
[steps/runner.ts](../../subs/harness/src/steps/runner.ts) restricts fallback during
recovery groups to callers supplying a particular fallback constructor.
[consultations/tools.ts](../../subs/harness/src/consultations/tools.ts) explicitly
sets `allowFreshFallback: false`; [consultations/targets.ts](../../subs/harness/src/consultations/targets.ts)
represents the responsible architect through a recorded session point.

The same dependency appears in optional administration:
[beads-sessions.ts](../../subs/harness/src/run/beads-sessions.ts), `deliver`, refuses
an unavailable source point even though its task already includes captured
implementation evidence and issue bindings.

Keep role/task identity and the relevant context. Try reuse when available;
otherwise construct an ordinary fresh task. A consultation must still reach the
responsible architect role, and tracker administration must still use its captured
workspace and issue bindings. Neither requires the original model history.

### F04 Restoring the exact invocation instead of executing the task

[service.ts](../../subs/harness/src/run/service.ts), `restoreInvocation`, matches
historical invocations by role, work, prompt hash, requested input hash and
submission tool. It rejects ambiguous or changed matches and can reopen the old
invocation's observations and transcript. `Run` carries `restoring`,
`restoredInvocations`, `restorationSequence` and related flags.

[run/session-operations.ts](../../subs/harness/src/run/session-operations.ts),
`start`, preserves original packet and declaration equality. A particularly
concrete consequence is `originalNonfunctionalContext` in `service.ts`: it
recognizes legacy `snapshot_diff` tool descriptions and preserves their old
behavior for restoration.

Retaining an accepted result is necessary. Reconstructing an unaccepted invocation
with the same prompt and tool descriptions is not. Use the existing task identity
to find an accepted result or start a new attempt through the current constructor.
Keep old transcripts as history. This removes the need to emulate old tool prose
and reconstruct control flow from invocation fingerprints.

### F05 Every tool call becomes a potentially blocking external effect

In agent [session-operations.ts](../../subs/harness/subs/agent/src/session-operations.ts),
`effect` records intent, a separate owner completion receipt for non-submission
tools, and completion. The intent write is unconditional after tool validation;
it also applies to nonmutating reads. In harness
[run/session-operations.ts](../../subs/harness/src/run/session-operations.ts),
`unresolvedEffects` returns every intent without filtering by tool behavior,
despite its comment describing mutating effects. `reconcileOwnedEffects` depends
on an owner receipt rather than inspection by the new task.

Both run and manual recovery use this list to block replacement. Ordinary harness
bindings also do not supply the generic engine's `recoverEffect` callback. Thus
an interruption between recording a read's intent and recording its completion
can prevent task restart even though repeating the read is sufficient. This is a
direct consequence of the code paths, not a claim about an observed production
incident.

Keep tool observations for transcripts. Reserve durable effect reconciliation
that blocks execution for actual workflow transitions and concrete consequential
external operations. Local partial edits can be inspected by the replacement
agent after the writer has stopped. Keep accepted submission persistence and
rejection of late submissions.

### F06 Post-edit checks acquire their own blocking effect lifecycle

The same `effect` function journals `afterMutation:<tool>` separately, refuses a
previous hook whose completion is unknown, and only then completes delivery of
the original tool result. A successful edit followed by an interrupted Ramify
check therefore leaves an additional prerequisite unrelated to reconstructing
the task.

Retain the edit and report that the check did not complete. Run the check again
through ordinary verification. A post-edit diagnostic need not finish the exact
previous invocation to allow the engineer to inspect and continue.

### F07 Shared transcript validation can obstruct unrelated fresh work

[session-store.ts](../../subs/harness/src/run/session-store.ts), `load`, validates
the shared journal and historical payloads when opening the store. Its cached
path scans every cached payload fingerprint and throws when one is missing.
`commitOwned` calls `load` again. The store is opened for the project's shared
session operations in `RunService.operations`.

Integrity checks are appropriate when reading a transcript or recovering an
accepted result. Making availability of all historical transcript payloads a
precondition for opening the shared store or recording a fresh session couples
optional history to current work. Separate essential task/result records from
optional reusable conversation data; report unavailable history at its point of
use. Preserve journal consistency and reject actual corruption of required task
records. Do not silently replace corrupt authoritative records with an empty run.

## Duplicate continuation and admission machinery

### F08 Comprehensive external repair declarations before ordinary work

[recovery-admission.ts](../../subs/harness/src/run/recovery-admission.ts) compares
candidate tree, HEAD, index, staged/unstaged/untracked sets, file identities,
runtime, configuration, captured inputs and durable-record identities. It requires
declarations selecting `target`, `configuration`, `environment` or `runtime`.
`repairDispatchBlockers` compares the complete admitted identity again before
dispatch. `captureRecoveryIdentity` in
[service.ts](../../subs/harness/src/run/service.ts) rereads the ledger, materialized
records, prompts, source documents, audit configuration and installed runtime.

Keeping the task and observing current files does not require classifying every
intervening edit into a recovery declaration. The task can include a concise
change note and the agent can inspect Git. Preserve the original requirements,
scope and checks; a change to those is an ordinary architectural or user decision.
Restrict mechanical consistency checks to the particular record or operation that
requires them. Candidate identity still matters when accepting a specific audit,
review or commit; it need not freeze the workspace before exploration can resume.

### F09 Ordinary interruption becomes a new permission ceremony

For current policies, [service.ts](../../subs/harness/src/run/service.ts), `load`,
calls `waitOperationRecovery` after server interruption and states that a new
model, writer or gate producer needs explicit compatible resume. The retry loop
records attempt groups and holds after its automatic allowance. The pause has an
occurrence ID, revision, prerequisites and a separate resume command. Nontransport
classifications can require an external repair declaration before retry.

Continuation of already assigned work needs no new permission merely because the
server or session ended. Keep a bounded backoff for repeated transport failures
and a visible waiting condition for missing credentials or other real obstacles.
Preserve explicit stops and user-requested breakpoints. Remove occurrence-based
reapproval as a general requirement for restarting the task. Existing stop/resume
contracts must be deliberately updated; this analysis does not change them.

### F10 Manual execution implements a second recovery protocol

[steps/runner.ts](../../subs/harness/src/steps/runner.ts), `runResourceInvocation`,
contains its own binding hashes, candidate/runtime comparisons, effect checks,
retry counters, predecessor reconstruction and pause/resume records. Hosted runs
instead use `RunService.recoverableInvocation` through `host.resourceInvocation`.
[steps/manual.ts](../../subs/harness/src/steps/manual.ts) adds command-intent files,
result records and waiting for an identical command's response. Both
[steps/run.ts](../../subs/harness/src/steps/run.ts) and
[sessions/single.ts](../../subs/harness/src/sessions/single.ts) wrap that protocol.

Use one ordinary task execution path with adapters for hosted and manual callers.
Keep command deduplication where clients can resend a command, but do not maintain
a second compatibility and reconstruction system because the caller is a CLI.
The manual path's stronger whole-runtime and candidate-equality conditions are a
concrete example of behavior diverging between the two implementations.

### F11 Failed-run continuation requires importing a synthetic history

[restart-import.ts](../../subs/harness/src/run/restart-import.ts) builds an
inventory of old events and records, carries ancestry, validates cross-references,
copies artifacts, filters lifecycle events and creates negative event sequences.
[RunLog.installWorkflowImport](../../subs/harness/src/run/log.ts) overlays imported
history into `ledger.replay`. `restartPlan`, `prepareRestart`,
`compareRecoveryIdentity` and `initializeRestartBranch` in
[service.ts](../../subs/harness/src/run/service.ts) add source claims, identity
normalization, successor staging and another Git branch lifecycle.

This complexity follows the choice to make continuation a new run that must look
like the old workflow to existing reducers. Restarting unfinished tasks does not
intrinsically require a new run, branch or transplanted event log. Preserve failed
attempt history under the task. If a separate run is a desired product feature,
make it an explicit fork/import operation; ordinary interruption should not depend
on that machinery. Existing historical imports need to remain readable during a
migration, without requiring new continuations to generate them.

### F12 An eligibility matrix excludes the work that most needs restart

`planRestartImport` requires accepted initial analysis, rejects unfinished engineer
assignments, unfinished capability tasks, suspended consumers, active automatic
root repairs and active non-functional coordination. It reconstructs a narrow
architect task from the submission tool declared in an old prompt manifest.

These are implementation boundaries, not missing facts that make the task
impossible. An unfinished engineer assignment already describes a task; a
suspended consumer already describes a dependency. Resume the pending task and
preserve dependency/result identities. Keep actual reasons to wait, such as a
live writer or a missing essential assignment. Do not extend this matrix one
exception at a time.

### F13 Each workflow reproduces its own execution history

[service.ts](../../subs/harness/src/run/service.ts) has specialized restoration in
`takeWorkItem`, `assignIteration`, `takeIteration`, `takeContract`,
`runContractSession`, `contractGate`, `registerAgreement`,
`replayAcceptedBoundaryFork`, `recoveredBoundaryPartial`,
`replayAcceptedCapabilityQualification`, `recoverVerifyingHandback`, and
`originalNonfunctionalContext`. `load` has separate capability, non-functional,
ordinary-session, automatic-repair and debug-enabled branches. Some branches
belong to older policies; they still carry maintenance cost but should not be
described as all executing for a new run.

The necessary part is retaining accepted decisions and delivering their results
once. Each role can have its own normal task constructor and completion handler.
The extra part is re-entering the old driver and matching its intermediate
invocations, phases and packets. Move unfinished task selection into ordinary
scheduling and use the same handler whether a task's latest attempt was interrupted
or never started. A requested debugger pause remains a pause; losing its live
server need not inherently discard the whole workflow.

## Recovery requirements spread into ordinary acceptance

### F14 Runtime changes invalidate unrelated completion evidence

`planRestartImport` treats any runtime identity change as a producer change. It
then marks imported `work-item-completed` and `obligation-reported: done` events,
gates, reviews and non-functional assessments inapplicable. The source/runtime
comparison can therefore reopen completion conclusions even when the candidate
is unchanged and the fix concerns unrelated harness code.

Keep historical completion decisions. Reassess the affected work when the
candidate, requirement or relevant verification behavior changed. A new harness
hash alone does not establish which conclusions changed. If a fresh final audit
is the simplest sufficient verification, run it through the ordinary path rather
than constructing a global event-invalidation layer.

### F15 Gates revalidate the recovery protocol instead of just the candidate

[recovery-gate.ts](../../subs/harness/src/run/recovery-gate.ts),
`authenticatedExternalRepairs`, reconstructs resume-command receipts, occurrences,
record identities and restart normalization to recompute an admission.
[committing-gate.ts](../../subs/harness/src/run/committing-gate.ts),
[nonfunctional-phase.ts](../../subs/harness/src/run/nonfunctional-phase.ts) and
[readiness-commit.ts](../../subs/harness/src/run/readiness-commit.ts) consume this
proof. The non-functional reducer has a special invalidation transition tied to
an admitted recovery occurrence.

Keep verification of the actual candidate, required checks, relevant accepted
assessment, and allowed changes. Those facts can come from ordinary task and
assignment records. They do not require repeating a recovery-specific admission
proof at each downstream boundary. Ordinary correction and correction after an
interruption should converge on the same acceptance behavior.

### F16 Separate retry and repair controllers accumulate around checks

`reachReadinessOwned` in [service.ts](../../subs/harness/src/run/service.ts) manages
readiness recovery groups, preparation-start/completion records, external repair
commits and counters. [readiness.ts](../../subs/harness/src/run/readiness.ts)
contains `recoveryFor` and `performRecovery`, including dependency installation,
daemon restart and command rerun. [committing-gate.ts](../../subs/harness/src/run/committing-gate.ts)
has another attempt-group loop.

Simple transport retry and project setup commands can be useful and should not be
replaced automatically with an LLM call. The excess is multiple controllers and
the rule that any unacknowledged preparation command holds continuation until its
producer independently proves completion. After process settlement, inspect the
environment and repeat setup when its contract permits it. Send a repairable
diagnosis to an ordinary agent task when interpretation is needed. Keep special
effect handling for setup commands with actual nonrepeatable consequences.

Classification of provider errors in
[recovery-checks.ts](../../subs/harness/src/run/recovery-checks.ts) is not by itself
unnecessary: assertions and infrastructure failures can require different action.
It should remain a small consumer of provider facts, without becoming another
implementation-repair authority.

### F17 Recovery introduces another progress detector

`recoverableInvocation` counts distinct successful effect hashes and a
`progressIdentity` to reset automatic retry allowances. The manual runner
independently compares candidate trees and completed effects. Reading a different
file can count as a new successful effect without establishing progress on the
assignment. Useful reasoning can also occur without changing the candidate.

Retry delay belongs to transport handling. Progress judgment belongs to the
responsible architect and the normal task loop. Preserve native compaction and
stall detection, but remove recovery-specific semantic progress proxies and their
duplicate counters. This is distinct from removing all retry limits: persistent
transport failure still warrants backoff and a visible waiting state.

### F18 Fresh reconstruction builds a broad parallel task catalog

`retainedResourceTask` in [service.ts](../../subs/harness/src/run/service.ts)
collects open findings, capability requests, all requirements, unsettled reviews,
all tracked scenarios and broad record-path sets. Resource continuation embeds
that JSON, original task text and additional recovery instructions alongside the
ordinary prompt and briefing. The manual runner constructs another version.

Task inputs should already contain the goal, applicable requirements, assignment
and useful evidence locations. Reuse the normal constructor, adding a short
interruption note when useful. Keep dependencies and unresolved obligations in
their existing records; do not create another recovery-specific representation
of the run or require it to be complete before an agent can inspect the project.

### F19 The restriction model expands the public protocol and its tests

[protocol/runs.ts](../../subs/harness/src/interfaces/protocol/runs.ts),
[run/records.ts](../../subs/harness/src/run/records.ts) and
[run/log.ts](../../subs/harness/src/run/log.ts) expose recovery occurrence/revision,
attempt groups, repair declarations, before/after identities, restart generations
and retained-task details. CLI [recovery-client.ts](../../src/recovery-client.ts)
and [restart-client.ts](../../src/restart-client.ts), browser
[recovery.tsx](../../subs/web/src/recovery.tsx) and
[restart.tsx](../../subs/web/src/restart.tsx), and HTTP handlers carry them to users.

This is downstream complexity from F01–F18, not evidence that inspection or a
resume button is inherently unnecessary. A task can show its current attempt,
interruption reason and any concrete obstacle. Keep user controls for genuine
waits and stops; retire fields and forms that exist only to satisfy hash equality,
blanket repair declarations or successor preparation. Read old records through
bounded compatibility code rather than requiring new tasks to obey old execution
restrictions.

## What should remain

| Area | Required behavior to preserve |
| --- | --- |
| [ledger](../../subs/harness/subs/ledger/README.md), [jobs/commit.ts](../../subs/harness/src/jobs/commit.ts) | Durable transitions, handling of torn trailing writes, rebuilding record files, and stable accepted results. |
| [store/lock.ts](../../subs/harness/src/store/lock.ts), [run/writer.ts](../../subs/harness/src/run/writer.ts), process execution | One active owner, actual child-process settlement, and rejection of late writes or submissions. Process identity checks avoid acting on a reused PID. |
| [jobs/commands.ts](../../subs/harness/src/jobs/commands.ts) | Deduplication of commands a client may resend after losing a response. |
| Assignment and [ownership-authority.ts](../../subs/harness/src/work/ownership-authority.ts) records | The module engineer's authorized region and relevant exclusions, including a usable recorded boundary while the project is temporarily invalid. |
| Ordinary task and dependency records | Accepted architect decisions, pending child tasks, handbacks and their relationship to consumers. A provider handback does not imply consumer completion. |
| Candidate-bound audit and review records | What was checked, its result and the actual source examined. Verify the resulting work through normal acceptance. |
| [audit-workspaces.ts](../../subs/harness/src/run/audit-workspaces.ts) | Cleanup of worktrees actually owned by the harness, with checks preventing removal of an unrelated or changed worktree. |
| Git and tracker operations with consequences | Find an already-created commit; inspect a tracker mutation before repeating it. Optional tracker failures remain administrative. |
| Session reuse, transcripts and metrics | Useful context reuse and honest history, without making unavailable optional history a task-execution prerequisite. |

The invalid-project repair machinery and automatic root-repair assignments also
implement normal repair and scope behavior. Their entire size cannot be counted
as recovery overhead. The unnecessary portion is making their interrupted attempts
special restart cases instead of retaining and executing the repair assignment.

Similarly, multiple checks of whether an attempt is still active can be needed
around asynchronous callbacks. Fencing an old attempt is necessary; it is not the
same as requiring the replacement to reproduce the old session.

## How the complexity accumulated

The source history shows successive layers, rather than a single recovery feature:

| Commit | Date | Layer introduced or changed |
| --- | --- | --- |
| `f2487595` and `9123c86d` | 2026-10-08 | Durable session operations and ordinary continuation integration. |
| `598999af` | 2026-10-12 | Plan 41 interruption recovery and external repair admission. |
| `bfa1dda8` and `1aa8645a` | 2026-10-13 | Context/stall continuity, retained-task restoration and admission corrections. |
| `32a18569` and `68160188` | 2026-10-13 | Linked terminal restart, retained inventories and qualification corrections. |
| `d9154e68` | 2026-10-15 | Continuation and correction without several artificial count limits. |

These commits include useful features and repairs; their whole diffs are not
removal candidates. The architectural pattern is cumulative: exact invocation
preservation needs identities, identities need compatibility exceptions, exceptions
need admission proofs, and those proofs reach ordinary gates and public controls.
Moving the same machinery into a new recovery module would reduce file size but
leave that complexity intact.

The existing [session-independent recovery proposal](../../plans/session-independent-recovery/plan.md)
already targets missing sessions, runtime-hash vetoes and unfinished workflow
coverage. This analysis is broader: remove the need for specialized recovery
paths where ordinary task execution suffices, instead of only teaching each
existing path to accept more cases. The proposal is an existing local input;
its presence does not establish implementation of those requirements.

## Simplification and verification implications

The desired execution shape is small:

1. Load the task and its recorded state; honor an explicit stop or pending user
   decision.
2. Ensure the old attempt and its child processes have stopped. Reconcile any
   particular consequential operation that remains genuinely ambiguous.
3. If an accepted task result exists, complete its ordinary delivery once.
   Otherwise create a new attempt with the normal task constructor and current
   project state, reusing session context only when useful and available.
4. Let the agent inspect and finish the task, then apply ordinary acceptance.

This does not require a new generic recovery framework, permission matrix or
replacement event-sourcing implementation. Existing assignment, result, ledger,
scope and scheduler code should supply the necessary facts. The main design work
is separating durable task state from attempt/session state and consolidating
normal completion handling.

The first removal targets are F01–F07: they directly obstruct useful work without
establishing a necessary task fact. Consolidating hosted and manual execution and
removing exact invocation restoration then makes the role-specific branches,
successor import and admission protocol substantially less necessary. Preserve
read access to history; remove obsolete tests of restrictions along with those
restrictions, rather than adding more exceptional allowances.

Tests that currently lock in the excessive behavior include
[operation-recovery.test.ts](../../subs/harness/src/tests/operation-recovery.test.ts)
R09/R10/R12/R13 and C06,
[restart-runtime.test.ts](../../subs/harness/src/tests/restart-runtime.test.ts),
[recovery-admission.test.ts](../../subs/harness/src/tests/recovery-admission.test.ts),
and the separate manual resource, consultation, and restart suites. They are
evidence of current contracts, not evidence that the contracts are necessary.

Replacement acceptance should demonstrate these outcomes:

- A fresh engineer completes an interrupted assignment from partial edits,
  without its previous session or exact prompt packet.
- A harness/prompt fix does not itself block that task.
- An interrupted read or post-edit check does not prevent a new attempt.
- Accepted submissions, child assignments and handbacks are delivered once even
  if their acknowledgement was lost.
- A surviving process or late callback cannot modify or complete a replacement's
  task; an explicit stop remains effective.
- Changed source is inspected and verified through ordinary correction and
  acceptance, retaining the previous results as history.
- Nested capability work, consultations, non-functional work and repairs use the
  same continuation behavior as ordinary tasks, including from CLI entrypoints.
- Missing optional transcript history does not prevent fresh execution, while
  missing essential task records produce a precise, local diagnostic.

This is a broad static inventory of the recovery mechanisms and their consumers,
not a proof that every possible redundant branch has been identified. No runtime
or performance experiment is needed to establish the explicit equality vetoes,
blocking conditions and duplicated controllers above. Deletion estimates and
behavioral equivalence require the subsequent refactor and its focused tests;
the full sizes of mixed files must not be advertised as savings.

## Validation of this analysis

All 55 local file links resolve, and the inventoried source hashes match the
inspected checkout. `npm run check:self` completed with a passing check, zero
errors, three warnings and 457 analysis limits; its reported coverage is partial.
That check verifies the repository's current structure, not the proposed
simplifications. No behavioral tests or source changes were introduced.
