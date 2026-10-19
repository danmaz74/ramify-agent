# Simplify recovery around ordinary task restart

## Problem and intended result

Recovery currently preserves and authenticates much of an interrupted attempt:
session history, prompt and runtime identities, tool effects, repair declarations
and workflow-specific replay state. Hosted runs and standalone commands implement
overlapping continuation protocols. These mechanisms complicate ordinary
execution and prevent useful work when the task itself remains understandable.

Make recovery a small facility for returning unfinished work to ordinary
execution. If an agent was performing task X, a replacement agent can perform
task X from current files and durable task records, including in a fresh session.
The agent assesses what has already happened and what remains. The harness
preserves the few facts inspection alone cannot establish: execution ownership,
the assignment and its authority, accepted results, pending obligations, and
particular consequential operations whose outcome is otherwise ambiguous.

The governing requirements are the adopted
[harness recovery principles](../../docs/harness-recovery.principles.md),
especially KISS. This plan covers all nineteen findings in the 2026-10-18
recovery analysis, including their consumers and analogous duplication discovered
during implementation. It replaces the narrower proposed outcome of
`plans/session-independent-recovery/plan.md`; that earlier input remains historical
context and does not impose a second recovery design.

The result must reduce mechanisms, states and exceptional paths. Relocating the
existing implementation, or adding fresh-session exceptions to every old path,
does not satisfy this plan.

## Required behavior

### Restart the task through ordinary execution

An interrupted attempt leaves its task pending unless a durable accepted result
already exists. Settle the former execution and its child processes before
replacement. Deliver an existing accepted result through ordinary completion
handling once; otherwise execute the unfinished task through the same task
construction, tools, scope and acceptance used without an interruption.

Fresh execution receives the assignment, relevant requirements, accepted
decisions, dependencies, pending findings and reviews, and references to current
work. Use existing durable task records and ordinary context construction.
Supply a concise interruption note when useful. Do not create a parallel catalog
of every run obligation or require the previous prompt packet, invocation, tool
sequence or conversation to be reconstructed.

Keep partial source, staged and unstaged changes, untracked source, failing tests
and stubs. Capture the candidate and attribution after the previous writer has
settled. Neither interruption nor cleanup establishes task completion. Existing
scope and exclusion rules continue to apply, including recorded ownership while
the target project is temporarily invalid. External changes remain distinguishable
from an engineer's changes without requiring a recovery declaration protocol.

Apply this behavior to all existing task-bearing paths: initial analysis,
architecture and decomposition, context/catalog work, engineering, capability
coordination and reconciliation, reviews, consultations, failure analysis,
nonfunctional assessment and repair, automatic root repair, standalone sessions,
steps and debugger exchanges. Accepted child assignments and handbacks remain
durable; continuing a parent does not recreate them. An unfinished child or
consumer remains pending. Administrative sessions use the same available-context
fallback while keeping their existing separate authority and outcome.

### Concentrate the remaining recovery policy

Provide one small recovery module under the harness. It owns the shared policy
for re-entering an interrupted task and exposes facilities that hosted and
standalone execution can invoke. Its contract must be understandable in terms of
the task, the former attempt's settlement, accepted results and any specific
unresolved operation. Exact API names and internal decomposition belong to the
implementing architects.

The shared behavior is:

- Determine whether ordinary execution may continue, an accepted result needs
  ordinary delivery, or a concrete prerequisite still prevents continuation.
- Coordinate replacement only after the old attempt has settled and cannot
  write or submit. Use existing ownership and lifecycle facilities.
- Reconcile a particular consequential operation through its owner's inspection
  or idempotency facility when needed.
- Return unfinished work to ordinary dispatch with optional reusable context;
  report a specific reason when that cannot be done.

Keep these responsibilities with their existing owners:

| Owner | Responsibility retained |
| --- | --- |
| Ledger | Durable transactions, torn-tail handling, record rematerialization and generic idempotency primitives. |
| Agent/provider lifecycle | Session creation and optional reuse, native compaction, cancellation, actual settlement and dispatch/publication fences. |
| Harness task and workflow owners | Assignments, dependencies, task construction, scheduling, accepted decisions, results and their delivery. |
| Process and project ownership | Project lock, writer ownership, child-process settlement and process identity checks. |
| Git, checks, audit and other effect owners | Inspectable operation outcomes, candidate-bound verification and safe cleanup of owned resources. |
| HTTP, CLI and web | Thin adapters and projections of the harness's common behavior. |

Normal execution must not assemble a recovery identity or implement a role-specific
restart controller merely to invoke an agent. The recovery module receives narrow
contracts through the declared Ramify boundaries. It must not receive all of
`RunService`, import sibling internals without exposure, own another event log,
duplicate the scheduler, or introduce a generic plugin/callback framework for
every role. The harness remains the owner of durable workflow changes.

Some recovery-related calls necessarily remain at lifecycle and effect boundaries.
Concentration means one policy and reusable facilities, not moving unrelated
durability, process management and acceptance into the new module. Document each
remaining specialized mechanism and the concrete fact it protects.

### Make session context optional everywhere

Reuse a useful available session or fork point as an optimization. Missing,
corrupt or incompatible optional transcript/provider payloads must not prevent
fresh execution of a readable task, including consultations and administrative
sessions. Inspect optional context when it is requested; unrelated historical
payloads must not be prerequisites for opening the store or starting another task.

An explicitly requested exact session operation may still report that its source
is unavailable. The task execution owner then chooses ordinary fresh execution;
do not silently pretend an exact fork succeeded. A provider failure unrelated to
optional context remains its actual diagnostic. Unreadable essential task or
accepted-result records remain concrete obstructions; do not guess their contents
or treat them as cache loss.

Use the installed runtime and current procedures. Remove recovery vetoes based
only on source, lockfile, dependency, prompt or old tool-description hashes.
Preserve captured user requirements, accepted decisions and effective authority.
A concrete unsupported record or required operation may prevent continuation;
report that specific incompatibility. Do not maintain prompt-hash allowlists or
whole-runtime compatibility emulation to execute old work.

### Keep only consequential effect reconciliation

Reads, ordinary diagnostics, post-edit checks and inspectable partial source edits
must not require exact tool-call replay or completion receipts before a task can
restart. Their history may remain observable, but an interrupted call alone does
not create a blocking external effect. Rerun a required check through ordinary
verification when its result is missing.

Retain durable accepted submissions and meaningful workflow transitions. A lost
acknowledgement must not create a duplicate child assignment, handback, commit,
accepted decision or administrative mutation. Use existing owner records and
inspection before repeating a consequential operation. If a specific operation
cannot be resolved, name the affected task and missing evidence; do not convert
every unfinished intent into a blanket prohibition on fresh work.

Execution ownership is independent of effect replay: even an interrupted read
does not permit overlapping writers. Old attempts and late callbacks cannot
mutate state or submit for replacements. A stop receipt or an elapsed timeout is
not evidence that a process has settled.

### Continue authorized work without a recovery approval ceremony

An ordinary interruption, lost session or repaired runtime does not create a new
approval requirement. On service restart, an already-authorized active run can
continue once its real prerequisites and ownership are established. An execution
command for an unfinished standalone task uses the same rule. Read-only
inspection/listing commands do not initiate execution.

Preserve explicit user stops, debugger pauses, pending user decisions and ordinary
plan authorization. Do not automatically reopen a completed or deliberately
stopped run. Continuing a historical failed run requires a continuation request;
it must not then require a separate repair declaration or occurrence/revision
approval just because the earlier attempt failed. A historical recovery wait
caused solely by interruption must be distinguishable from a deliberate stop.

Keep concurrency protection and idempotent command handling after a lost reply.
Remove recovery-only occurrence/revision forms, repair declarations and attempt
group approvals where normal command and task identity suffice. Inspection should
show the unfinished task, retained work, current obstruction and normal next action.

Keep a single bounded, cancellation-aware transport retry policy where useful.
Do not multiply retries across wrappers or add progress heuristics based on tool
counts, elapsed time or tree hashes. A persistent unavailable prerequisite is
reported without a busy retry loop. The responsible architect decides semantic
progress and handoff; native compaction and stalled-session handling preserve the
task. Neither resource observations nor attempt counts terminate the run or spend
a semantic correction round merely because an attempt was interrupted.

### Continue unfinished workflows without reconstructing execution history

Remove restrictions that reject restart solely because analysis, an engineer,
nested capability, a suspended consumer, root repair or nonfunctional work was
unfinished. Retain and execute the pending work, with its ordinary dependencies
and acceptance. If no analysis has been accepted, analysis itself remains pending.

Existing failed-run history must remain readable with its original outcomes and
provenance. Continuing its unfinished work may retain the run or use a thin linked
successor as appropriate to existing terminal-record constraints. Neither option
may rewrite historical failures as successes, replay copied events as new
execution, or require a synthetic inventory of all historical records to dispatch
the next task. Accepted results and dependencies must remain accessible without
duplicating their semantics in a second workflow representation.

### Use ordinary candidate acceptance after changes

An agent inspects the current candidate and finishes its task. Required checks,
reviews, ownership rules and acceptance conditions remain effective. Changed
source or required check configuration receives the corresponding ordinary
reassessment and verification. Earlier results remain historical for the source
and configuration they describe; a runtime or prompt edit alone does not invalidate
unrelated accepted work.

Remove gate and readiness checks whose purpose is authenticating a recovery repair
admission. Preserve checks that establish actual candidate correctness, authority,
required coverage or applicability of prior evidence. Keep safe cleanup of
harness-owned audit workspaces. Interrupted preparation uses existing inspection
and idempotency where needed instead of a separate admission controller.

Administrative tracker work remains administrative: unavailable context can use a
fresh session, a lost mutation response needs readback when consequential, and a
failure does not block plan acceptance. Preserve the captured tracker workspace
and existing limits on administrative operations.

## Constraints and scope

This is a recovery simplification across the harness, agent integration, durable
record consumers and CLI/web adapters. It is not a rewrite of the ledger, normal
workflow scheduling, semantic progress assessment or the provider transport. Do
not change the Ramify dependency direction, import companion source, edit generated
views or add a second durable writer. Follow the repository's module contracts
and test boundaries.

Coordinate changes to public recovery commands, schemas and UI with their bundled
consumers. Recovery-only controls and obsolete states may be removed or replaced
with ordinary continuation; document the replacement behavior. Keep ordinary
start, stop, review and debugger behavior. An obsolete command must either adapt
to the common operation or return an actionable replacement, never invoke a
retained second recovery executor.

Keep existing readable run/task/result records usable, including records produced
by the current recovery implementation. Use the smallest concrete compatibility
conversion needed for task state. Do not rewrite immutable history or require old
session payloads/runtime installations. Unknown essential record formats produce
a specific diagnostic; this plan does not require inventing lost task data or
support for every historical binary. Distinguish obsolete infrastructure waits
from explicit user authority before continuing legacy records.

The following current contracts in `docs/harness.spec.md` must be updated as part
of implementation to the required behavior above:

- **Native Context Compaction Preserves The Task:** retain native compaction and
  architect decisions; remove mandatory source-backed successor context.
- **Ordinary Operations Retain Recovery Evidence:** replace exact invocation/source
  reconstruction and broad effect replay with durable task/results and fresh
  execution. Retain diagnostic classification and cancellation-aware retries.
- **Standalone Recovery Retains Its Original Inputs** and **Recovery Waiting And
  Explicit Resume:** retain task inputs, settlement, stop precedence and command
  deduplication; remove recovery-specific approval groups and identity admission.
- **Terminal Failure Can Prepare A Linked Successor:** preserve original history,
  command deduplication and retained work; replace eligibility matrices, copied
  inventories and prompt/runtime transition allowlists with pending-task continuity.
- **External Repairs Are Admitted With Operator Provenance:** replace mandatory
  declarations and repeated proof admission with ordinary candidate inspection,
  attribution, scope and qualification. Required checks cannot be weakened by a
  restart or configuration change.

Update affected agent/session contracts, protocol documentation and tests at the
same time. Current tests asserting the removed restrictions must be replaced
with tests of the new behavior, not preserved through special cases. Existing
principles about authority, durability and acceptance remain effective. No runtime
change or execution of this plan is implied by authoring this document.

## Acceptance

```gherkin
Feature: Ordinary task restart after interruption

  Scenario: A fresh engineer finishes retained partial work
    Given an authorized engineer task was interrupted with staged edits, untracked source and a failing test
    And its former execution has settled and its session history is unavailable
    When execution of the unfinished task continues
    Then a fresh agent receives the original assignment and relevant accepted decisions
    And it can inspect all retained partial work within its ordinary scope
    And completion requires the task's ordinary submission and acceptance

  Scenario: Current procedures execute a retained task
    Given an unfinished task and its required records are readable by the installed runtime
    And the harness source, dependency pin and task prompt differ from the interrupted attempt
    When the authorized task continues
    Then those identity differences alone do not block execution or invalidate accepted work
    And the original requirements and effective authority still apply

  Scenario Outline: An unfinished workflow is ordinary pending work
    Given an authorized task was interrupted during <work>
    And its required task records are readable and its former execution has settled
    And no reusable session is available
    When execution continues
    Then the pending task runs with current context through ordinary execution
    And accepted decisions and child results are reused without duplicate assignments
    And its pending dependencies, reviews and acceptance obligations remain effective

    Examples:
      | work                              |
      | initial analysis                  |
      | module architecture               |
      | context and catalog selection     |
      | nested capability coordination    |
      | suspended consumer reconciliation |
      | review and failure analysis        |
      | nonfunctional assessment           |
      | nonfunctional repair               |
      | automatic root repair              |
      | consultation                       |

  Scenario: Hosted and standalone execution share continuation behavior
    Given equivalent unfinished assignments in a hosted run and a standalone step or session
    And their old attempts have settled and optional context is missing
    When their normal execution entrypoints continue those assignments
    Then both execute fresh tasks under the same continuation rules
    And neither requires recovery-only occurrence, revision or repair declaration input

  Scenario: Unrelated damaged context does not block useful work
    Given a historical session has a missing or corrupt optional payload
    And another task's essential records are readable
    When that task starts a fresh agent session
    Then the historical payload does not block execution

  Scenario: Essential missing task data is reported precisely
    Given an unfinished task has an unreadable essential assignment record
    When execution attempts to continue it
    Then the harness identifies that record and the information needed to proceed
    And it does not invent an assignment or report an unrelated runtime hash mismatch

  Scenario Outline: An interrupted inspectable operation does not require exact replay
    Given a settled attempt ended without a completion receipt for <operation>
    And its task and current files are available
    When the unfinished task continues
    Then that missing receipt does not prevent a fresh attempt
    And current files are preserved and required verification can run normally

    Examples:
      | operation         |
      | a source read     |
      | a source edit     |
      | a post-edit check |

  Scenario: Lost acknowledgements do not duplicate accepted workflow changes
    Given a task submission and its child assignment or handback were durably accepted
    And the attempt ended before observing the acknowledgement
    When execution continues after reopening the run
    Then the accepted result is delivered through ordinary completion once
    And no duplicate assignment, handback or agent submission is requested

  Scenario: A consequential operation uses its owner's evidence
    Given a commit was created but its caller did not receive the result
    When the interrupted task continues
    Then the existing commit is identified and recorded without creating another commit
    And unresolved evidence about a consequential operation identifies that operation specifically

  Scenario: A replacement cannot overlap a surviving writer
    Given an interrupted attempt still has a child process that may write
    When continuation is requested
    Then no replacement writer starts before actual settlement
    When the old attempt settles and a replacement starts
    Then late callbacks from the old attempt cannot write or submit for the replacement

  Scenario: Service restart continues existing authority
    Given an authorized active run was interrupted without an explicit user stop or pending approval
    And its old execution has settled and its required inputs are available
    When the service reopens the run
    Then its unfinished work continues without a new recovery approval
    And repeated or concurrent continuation commands cannot create overlapping attempts

  Scenario Outline: Recovery preserves intentional holds
    Given a run is held by <hold>
    When the service restarts or its status is inspected
    Then no agent task starts as a side effect
    And the original ordinary action is still required to proceed

    Examples:
      | hold                      |
      | an explicit user stop     |
      | a debugger pause          |
      | a pending user decision   |

  Scenario: Legacy failed work can continue without replaying its history
    Given a retained failed run has readable unfinished work and accepted child results
    And its former owners have settled but its session payloads are missing
    When the user requests continuation through the supported command
    Then the pending work can execute with its accepted results and dependencies
    And the historical failure and original evidence remain readable
    And old execution events are not presented as new execution

  Scenario: Current source changes receive ordinary acceptance
    Given source changed while an interrupted run was quiescent
    And the run's original requirements and scope remain available
    When authorized execution continues without a repair declaration
    Then the current changes are available for inspection with their attribution
    And affected assessment and verification use the actual resulting candidate
    And previous results remain historical without satisfying changed-candidate acceptance

  Scenario: A persistent infrastructure failure does not create a retry storm
    Given the configured transport retries have ended with the provider unavailable
    When the task cannot continue
    Then it remains unfinished with the concrete unavailable prerequisite reported
    And wrappers do not multiply retries or require approval for another recovery attempt group
    And no successful submission or semantic failure is invented

  Scenario: Administrative continuation remains separate from plan acceptance
    Given a tracker administration task has its captured workspace but no reusable session
    And a previous mutation may have completed before its response was lost
    When that task continues
    Then a fresh session can use ordinary tracker inspection to avoid duplicate mutation
    And an administrative failure does not block plan acceptance
```

Structural acceptance requires a before/after inventory of the mechanisms below.
For each finding, identify what was removed or consolidated and the necessary
behavior retained. Include newly discovered analogous branches. Explain any
remaining specialized recovery path by the concrete fact ordinary inspection and
task execution cannot establish. Do not claim all lines in mixed workflow files
as recovery savings or use an arbitrary line-count target.

| Analysis finding | Required simplification evidence |
| --- | --- |
| F01 runtime equality; F02 prompt allowlists | No source/package/prompt equality admission or legacy prompt emulation is required to restart readable tasks. |
| F03 mandatory cached context; F04 exact invocation restoration | Fresh execution works through ordinary constructors across the covered roles without restoring old request identities. |
| F05 every-call effects; F06 post-edit effect lifecycle | Blocking reconciliation is limited to demonstrated consequential operations; reads, checks and inspectable edits do not participate in exact replay. |
| F07 whole-store history validation | Optional historical payload validation is local to requested reuse and does not prevent unrelated fresh execution. |
| F08 external repair identity protocol; F09 approval groups | Continuation uses ordinary authority, ownership, candidate inspection and command deduplication. |
| F10 manual recovery protocol | Hosted and standalone paths invoke the same recovery facilities; adapters contain no second state machine. |
| F11 synthetic restart history; F12 eligibility matrix | Existing pending tasks and accepted results support continuation across all required boundaries with readable historical provenance. |
| F13 workflow replay branches; F18 parallel retained-task catalog | Ordinary task construction and completion replace role-specific reconstruction and broad duplicated obligation inventories. |
| F14 unrelated evidence invalidation; F15 recovery-aware gates | Acceptance depends on the actual candidate, required checks and relevant inputs, without recovery-admission proofs. |
| F16 stacked retries; F17 progress proxies | Transport and settlement have clear existing owners; semantic progress remains the architect's decision. |
| F19 protocol, UI and restrictive tests | Obsolete controls, schemas, documentation and tests are removed or converted together with the behavior they represented. |

Demonstrate the recovery module's narrow declared surface and its use by hosted
and standalone consumers. List the recovery-related facilities left elsewhere
and why their existing owner needs them. Normal workflow owners must not keep
parallel recovery policy behind differently named helpers.

Use focused behavioral tests with scripted external answers under
`docs/testing.spec.md`. Preserve ledger fault tests and relevant registered native
witnesses for actual process, lock and Git claims. Exercise composed harness
behavior, including client projections of pending work and obstructions. Required
project checks, including `npm run check:self`, must pass; configured audit scope
and test-boundary rules remain effective. Passing new unit tests alone does not
establish deletion of the redundant mechanisms or preservation of these guarantees.

## Context and recommendations

The source analysis is recorded in
`docs/analysis/2026-10-18-task-restart-and-recovery-complexity.md`, with its companion
inventory. These are background navigation evidence; all required outcomes are
stated above. Source spans may change during implementation.

Useful current seams include `subs/harness/src/run/service.ts`,
`run/session-operations.ts`, `run/session-store.ts`, `run/recovery-*.ts`,
`run/restart-*.ts`, `steps/runner.ts`, consultations and administrative sessions,
and `subs/harness/subs/agent/src/session-operations.ts`. The existing ledger,
writer, project lock, task/result records and effect-owner inspection facilities
provide the foundations to reuse. Inspect current declarations before consuming
any child-module API; a source path is not an exposure contract.

An appropriate module placement is `subs/harness/subs/recovery`. Prefer a few
operations over a general recovery framework. A useful conceptual flow is:
load ordinary task state, settle the former attempt, resolve any particular
consequential ambiguity, then deliver an accepted result or dispatch the ordinary
task. Keep role-specific construction with the role's ordinary execution owner.
This is a design recommendation, not a prescribed API or implementation schedule.

No provider release or external service is a prerequisite to authoring this plan.
Architects derive the implementation breakdown and any provider changes actually
needed from the current project. Existing workspace changes must be preserved.
