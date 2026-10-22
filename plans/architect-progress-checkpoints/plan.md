# Repetition triggers architect reconsideration

## Problem and intended result

The harness adopted
[Repetition Triggers Architect Reconsideration](../../docs/prompt-optimization-module-architect.principles.md#repetition-triggers-architect-reconsideration)
on 2026-10-14 after the projections-extraction run `20261013T215727Z-a3e5c9`
was terminated at its twelfth assignment with useful work left (deferred issue
`ramify-agent-beo`). The proposal written for it,
[Plan 45](../../docs/plans/45-architect-progress-checkpoints/main-plan.md),
was never started. Since then Plan 44 and the two compatibility-layer removal
plans changed the ground it stood on:

- No lifetime count stops a run any more. `invocationRefusal` and
  `executionTimeRefusal` in `subs/harness/subs/autonomous/src/run/service.ts`
  return `null`; `run-bounds.test.ts` verifies that another assignment remains
  available after the captured iteration count. `maxIterationsPerWorkItem`,
  `maxIterationsPerCapabilityTask`, `maxWorkItems`, `maxPlacementRequests`,
  `maxInvocationsPerRun`, `runAbsoluteMs`, `cycleReplansPerWorkItem`,
  `reconciliationRoundsPerWorkItem`, `laterRoundMinimumRisk`,
  `budgetReturnsPerIteration`, `sessionReconstructionsPerWork` and
  `nonfunctionalRoundsPerPlan` are captured in every run's policy and read by
  nothing that decides anything. `captureCapabilityLimits` copies three of
  them into every capability task and throws when one is missing;
  `canStartInvocation` has no production caller.
- The bounds that remain active are local and already end in an architect
  decision or a person's: repair rounds per gate (`exhausted` closes the
  iteration and returns to the module architect), fork retries, plan
  deviations (the next one waits for the person), invocation idle and command
  timeouts, and review attempt settings.
- Policy adoption, legacy readers and successor import no longer exist. A run
  captures one policy and a retired form is refused.

The remaining gap is the principle's affirmative half. Nothing asks a module
architect or capability coordinator to stop and judge whether its repeated
assignments are going anywhere; it can assign iteration after iteration
against an unchanged obstacle, and the run's public state shows no such
judgment. Meanwhile the policy still carries the dead ceilings, which mislead
readers and tests into believing they are enforced.

The intended result: after a captured number of settled outcomes on one work
item or capability task, the responsible architect's next ordinary turn must
carry a progress assessment before its next action is applied. The harness
records that assessment, shows it, and refuses an action submitted without
one while a checkpoint is due. Counts trigger the assessment and never
establish progress, failure or completion. The dead ceiling fields and their
plumbing are removed under a new policy version.

The consumers are the autonomous full-run path (plan architect, module
architects, capability coordinators and the operators who inspect their
runs). The assisted path is not in scope: its coordinator skill already
detects and stops non-converging cycles itself.

## Required behavior

### A checkpoint falls due after a captured number of settled outcomes

- The run policy captures a positive checkpoint interval, one for work items
  and one for capability tasks. They are implementation defaults, not user
  budgets; three settled outcomes is the proposed default for both, and the
  implementation may record a different one with its reason. Tests may
  capture smaller fixture intervals.
- A settled outcome is one result delivered to the responsible architect for
  that work item or task: a closed iteration whatever its outcome, an answered
  placement or unresolved-decision request, a refused completion or failed
  completion gate, a reconciliation refusal, and for a capability task a
  settled capability assignment or answered exchange. Each is counted once by
  its durable identity. Gate attempts within an iteration, event delivery,
  scheduler re-entry, recovery replay and transport retries do not multiply
  it.
- The count is kept per work item and per capability task from the item's
  last accepted assessment, or from its start. Continuation of the run,
  reconstruction of a session and service restart retain the count; nothing
  resets lifetime history.
- When the count reaches the interval the checkpoint is due. The next
  ordinary turn of the responsible architect carries it. No additional model
  call, gate or audit is added to serve a due checkpoint.
- A due checkpoint cannot be bypassed by opening a new session, revising an
  outline, yielding the work item or moving the work to another owner. If an
  accepted engineer submission races with the trigger, its effects are
  reconciled first and the checkpoint is served in the resulting architect
  turn, once.

### The assessment is part of the architect's next action

- The existing architect action submission carries the assessment: a concise
  account of progress or its absence since the baseline, references to the
  evidence it rests on (iterations, gates, reviews, findings, decisions), and
  why the proposed next action is worthwhile. The action's existing goal,
  outline, placement, unresolved-decision, completion and escalation forms
  remain the ways to express what follows; no second decision protocol is
  introduced.
- While a checkpoint is due, an action without an assessment is refused with
  a reason naming the checkpoint, and the architect resubmits within the
  existing rejected-submission handling. A turn with no due checkpoint needs
  no assessment.
- The harness validates structure and authority: the assessment is present,
  its references resolve to records of that work item or task, and it was
  submitted by the responsible architect for the current work item, iteration
  baseline and invocation. It does not judge the rationale's quality by
  comparing text.
- The architect's choices at a checkpoint are the ordinary ones: continue with
  the expected contribution stated, change the approach or decomposition,
  request a decision beyond its authority through placement or unresolved
  handling, report a concrete obstruction, or complete the work. Resolving an
  uncertainty without a source change can be progress. Passing checks,
  commits and tool activity do not by themselves establish progress or
  completion; a required scenario that remains incomplete stays outstanding.
- Lack of progress is distinct from unfinished work. A missing external
  prerequisite is recorded as an obstruction with its condition for
  resumption, through existing escalation and terminal handling. The count
  supplies neither outcome.

### Counts never decide

- No count completes, fails, blocks or closes a work item, capability task or
  run. The former ceilings are not replaced by a maximum number of
  checkpoints, assessments or continuations.
- Every bound that can still stop execution is one of the retained local
  bounds listed under the problem statement, and each ends in the existing
  architect decision, recovery obstruction or person's decision. The
  implementation names them in the specification.

### Checkpoint state is durable, replayable and recoverable

- Whether a checkpoint is due is derived by replay of the run log; the
  accepted assessment is an event bound to the work item or task, the
  baseline range it assessed, the responsible authority, the invocation and
  the action it accompanied.
- A crash after the assessment is accepted but before its action is fully
  applied is completed once by existing reconciliation; no second assessment
  is requested for that checkpoint. A crash before acceptance leaves the
  checkpoint due with its evidence.
- A stale or replayed submission from an earlier invocation cannot clear a
  newer checkpoint, overwrite an accepted assessment or regain writer
  authority, through the existing revision and authority checks.
- An explicit operator stop takes precedence over continuation: no engineer
  execution starts while a stop is pending, and the retained work remains
  inspectable.

### Checkpoint state is visible

- The public run snapshot and the projections show, for each work item and
  capability task, the settled outcomes since its baseline, the interval, the
  due or assessed state, the responsible architect, the latest assessment
  summary and its next action, and any recorded obstruction. They never show
  a remaining implementation allowance. The CLI and web module receive this
  through the harness-owned contracts they already consume.

### Retired ceilings leave the policy

- Every `limits` field of the run policy that no production code reads to
  decide anything is removed from `defaultLimits`, the policy schema, the
  capability policy and task records, and the tests that asserted their
  values. The list under the problem statement is the inventory found by
  inspection; the implementation verifies it and removes any further field
  found to be in the same state, or records why it stays.
- `captureCapabilityLimits`, `canStartInvocation` and the `CapabilityLimits`
  type go with them; a capability task captures no count-based limit. The
  `maxRounds` marker on `nonfunctional-phase-started` is removed unless a
  reader of it is found and named.
- The `limit-exceeded` terminal reason has no producer once the `null`
  refusal stubs are removed; the reason and the stubs are deleted.
- The run policy version advances. A run captured under the previous version
  is refused as a retired form, per
  [Run state and compatibility](../../AGENTS.md#run-state-and-compatibility);
  nothing converts or adopts it.

### Documentation changes with the implementation

- `docs/harness.spec.md`: a section stating the checkpoint contract (what
  counts, when due, what the assessment carries, what the harness validates,
  what inspection shows, that no count decides) and the list of retained
  bounds with their deciding authority; the phrase "within the policy's
  ceilings" under "A Module Engineer's Failure Is Its Architect's Decision"
  is corrected to name the bounds an architect may still raise.
- `docs/check-findings.principles.md`, "Bound the correction loop": the count
  bound on correction rounds is replaced by the checkpoint: correction
  continues while the responsible architect judges it worthwhile at each
  checkpoint; unresolved remains a normal disposition that never blocks a
  gate and is the person's to pursue. The specification is updated where it
  states the round bound.
- `docs/architecture/autonomous-implementation-loop.md`, sections 2 to 4:
  the module architect's and coordinator's turns describe the checkpoint.
- `subs/harness/src/prompts/architect-engineering.procedure.md` and
  `capability-architect.procedure.md`: explain the trigger, the evidence the
  turn receives, what the assessment must contain and that the count proves
  nothing by itself. `subs/harness/README.md` where it lists policy limits.
- `docs/plans/45-architect-progress-checkpoints/main-plan.md` is history and
  is not rewritten.

## Constraints and scope

- Run state from earlier harness versions is not a compatibility target.
  Long-lived files this plan must keep readable: `ramify-agent.json`,
  `ramify-audit.json`, `src/tests/test-boundaries.json` and retained evidence
  under `docs/`. None changes shape.
- The harness stays the single durable writer and owns the public contracts;
  the web module projects and forwards only. Keep the toolkit dependency
  direction and the test boundaries in
  [Testing ramify-agent](../../docs/testing.spec.md): scripted model, Git,
  audit and command answers in ordinary tests.
- No new role, scheduler, dashboard or configuration surface. A due
  checkpoint uses the architect invocation the loop already requires.
- The module architect's authority over its module and the capability
  coordinator's delegated responsibility are unchanged. Coordinating several
  owners does not let the coordinator replace another owner's decision; such
  a decision goes through the existing placement or unresolved workflow.
- Plan-deviation approval and exceptional root-repair authority are separate
  and unchanged; checkpoints spend neither.
- Out of scope: checkpoints inside an engineer session (tool-call or
  repair-cycle triggers that suspend a running engineer); the assisted path
  and its coordinator; the historical run's successor; a configuration UI.
- Assessable by inspection after the change: the removed field names, the
  removed function names, `limit-exceeded` and the previous policy version
  string appear nowhere in `src/` or `subs/`; historical documents under
  `docs/` are not rewritten.
- Qualification is the configured audit on the committed candidate. This plan
  asks for nothing else, per
  [A Plan Asks for the Audit and Nothing More](../../docs/harness.principles.md#a-plan-asks-for-the-audit-and-nothing-more).

## Acceptance

The intervals below are fixture settings. Seed minimal durable histories to
cross a former threshold; do not perform thirteen live model calls.

```gherkin
Scenario: Useful work continues past any former ceiling
  Given a work item retains twelve closed iterations and their accepted evidence
  And its checkpoint has been assessed with a continue decision
  When its module architect assigns the next iteration
  Then the thirteenth iteration is admitted with its expected contribution recorded
  And prior iterations and outstanding acceptance obligations remain intact

Scenario: The existing architect turn serves the checkpoint
  Given a work-item checkpoint interval of three settled outcomes
  When the third outcome since the baseline returns to the work item's architect
  Then its next ordinary turn must carry an assessment before its action is applied
  And no separate invocation, gate or audit is added

Scenario: A due checkpoint refuses an action without an assessment
  Given a work-item checkpoint is due
  When the architect submits an iteration assignment without an assessment
  Then the submission is refused with a reason naming the checkpoint
  And the resubmitted action with an assessment and resolving references is accepted

Scenario: Gate attempts and recovery do not multiply outcomes
  Given a work-item checkpoint interval of three settled outcomes
  And one iteration closed after two gate attempts and one recovery replay
  When the run's log is replayed
  Then that iteration counts as one settled outcome

Scenario: Investigation can advance the requirement without a commit
  Given an engineer resolved a material interface uncertainty without changing source
  When the architect's assessment cites that finding and explains the next experiment
  Then continuation is admitted without a commit or passing gate as proof of progress

Scenario: Passing checks cannot establish completion
  Given an iteration has a passing gate and no review concerns
  And a required scenario remains incomplete
  When the architect's assessment continues implementation
  Then the work continues and the scenario remains outstanding
  And no count marks the work item complete

Scenario: Repeated checkpoints do not exhaust an allowance
  Given a work item has several accepted assessments
  When another checkpoint falls due and its architect continues with a stated reason
  Then work continues without a maximum number of checkpoints
  And every assessment and its assessed range remain available

Scenario: An accepted assessment survives a lost acknowledgement
  Given an assessment and its action are durably accepted
  When execution stops before the action is fully applied
  Then recovery applies that action once
  And no second assessment is requested for the same checkpoint

Scenario: Assessment interruption preserves the due checkpoint
  Given a checkpoint is due and no assessment has been accepted
  When the service restarts and reconstructs the architect session
  Then the same checkpoint remains due with its evidence and responsible authority

Scenario: Stale authority cannot clear a newer checkpoint
  Given an earlier checkpoint was assessed and another is now due
  When the earlier invocation replays its assessment
  Then the new checkpoint stays due and the earlier assessment is unchanged
  And the replaying invocation regains no writer authority

Scenario: A capability coordinator assesses its own task
  Given a capability task reaches its checkpoint interval of settled assignments
  And the coordinator's assessment identifies a decision owned by another module's architect
  When it requests that decision through the existing placement workflow
  Then the owning architect receives the decision with the evidence
  And the capability task retains its scope and outstanding goal

Scenario: A real prerequisite causes a meaningful wait
  Given an architect's assessment records that continuation needs a missing external service
  Then the work item waits with that obstruction and its retained work
  And no identical assignment is repeated automatically

Scenario: Explicit stop wins over continuation
  Given an architect is assessing a due checkpoint
  When the operator stops the run before its action is applied
  Then no engineer execution starts
  And the retained work and settlement evidence remain inspectable

Scenario: Inspection shows the judgment, never an allowance
  Given a work item with an assessed checkpoint and one due checkpoint
  When the run snapshot is projected
  Then it shows the outcomes since the baseline, the due state, the responsible architect and the latest assessment and next action
  And it shows no remaining number of assignments or invocations

Scenario: A run captured under the previous policy version is refused
  Given a job record captured under the previous run policy version
  When the harness opens it to continue or project the run
  Then the operation fails with a diagnostic naming the record and the expected version
  And nothing converts or adopts the record
```

Structural evidence: the identifier inspection named under constraints, the
specification sections named under documentation, and the retained-bounds list
with its deciding authority in `docs/harness.spec.md`.

## Module impact and existing facilities

| Owner | Change | Contracts that change with it |
| --- | --- | --- |
| `autonomous` (`src/run/records.ts`, `log.ts`, `policy.ts` at the harness root, `service.ts`) | checkpoint intervals in the policy and its version; assessment event and its replay; removal of dead `limits` fields, the refusal stubs and `limit-exceeded` | the policy schema consumed by `work-coordination`, `task-workflow` and `projections`; the run log's event union |
| `work-coordination` (`coordination.ts`, `submission.ts`, `capability/policy.ts`, `capability/records.ts`) | counting settled outcomes per work item and capability task; serving the due checkpoint in the architect turn; accepting and validating the assessment on the action submission; removal of capability limits | the architect action submission schema; the capability task record |
| `acceptance` | `nonfunctional-phase-started` without `maxRounds`; repair rounds per gate unchanged | the nonfunctional phase event with `nonfunctional` |
| `projections` and the harness root protocol (`src/interfaces/protocol/runs.ts`) | checkpoint state per work item and task in the snapshot; the terminal reason enum | the snapshot consumed by the CLI and `web` |
| `web` | renders the checkpoint state the snapshot carries | none; it receives the contract |
| prompts (`subs/harness/src/prompts/`) and `docs/` | the procedure text and specification sections named above | none |

Existing facilities to use: per-work-item replay of `iteration-closed`,
`placement-requested` and `decision-delivered`, `revision-needed`,
`reconciliation-refused`, `capability-assignment-settled` and
`capability-exchange-answered` in `log.ts`; the architect submission
validation and rejected-submission handling in `work-coordination`; the
revision and writer-authority checks that already refuse stale submissions;
the snapshot projection in `projections`. The generated architect and API
views under `.ramify-architect/` and each owner's `src/.ramify/` establish
which exposures a consumer may import; refresh them from the project root
after changing a `module.ramify`.

## Context and recommendations

- Optional: keep the interval next to the retained local bounds in
  `defaultLimits` and name it for what it counts (settled outcomes per work
  item, settled assignments per capability task), so that the policy table
  reads as triggers plus local bounds and nothing else.
- Optional: derive the baseline from the last assessment event rather than
  storing a counter, so that replay, reconstruction and restart need no extra
  state.
- The assessment's references should be the identifiers the architect already
  sees in its turn input: iteration ids, gate ids, review ids, finding ids and
  decision ids. The turn input for a due checkpoint should present a concise
  delta since the baseline with those identifiers, not a transcript.
- Plan 45 is background material: its inventory table and acceptance list
  were written against the 2026-10-14 source and most of its removal work has
  since happened; its engineer-session triggers are excluded here.
- The deferred issue `ramify-agent-beo` records the original defect; its
  disposition is repository bookkeeping outside this plan.

## Prerequisites and unresolved decisions

- Engineer-session checkpoints are excluded. The observed failure was across
  assignments, an engineer that repeats ineffective work already returns to
  its architect through repair-round exhaustion and idle bounds, and suspending
  a native session mid-batch is the costliest part of the original proposal.
  Reopen it as its own plan if a live run shows an engineer looping inside one
  assignment.
- The default interval of three is a proposal. The implementation may choose
  another with a recorded reason; the acceptance scenarios use fixture values.
