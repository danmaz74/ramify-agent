# Plan 45: architect progress checkpoints

**Date:** 2026-10-14. **Status:** proposed; implementation has not started.
**Target:** ramify-agent. **Execution:** six ordered implementation iterations,
as requested. This document starts no implementation, live run, commit or push.

**Note (2026-10-22):** the policy-adoption, legacy-reader and
historical-successor requirements below are superseded by the
[compatibility-layer removal plan](../../../plans/compatibility-layer-removal-continuation/plan.md).
The proposal is otherwise unchanged. The simplified execution input adapted to
the current code, where the lifetime ceilings are already unenforced, is
[plans/architect-progress-checkpoints/plan.md](../../../plans/architect-progress-checkpoints/plan.md).

## Outcome and decision

Implement [Repetition Triggers Architect Reconsideration](../../harness.principles.md#repetition-triggers-architect-reconsideration).
After a captured number of repetitions, the responsible architect must assess
progress and reconsider the next action. Counts determine when that decision is
due; the architect determines what the evidence means. There is no maximum
number of implementation iterations or progress checkpoints.

Cover repetition across assignments and within an engineer session. An engineer
that stays active while repeating ineffective work must eventually return to
its architect for reconsideration. A normal next architect turn serves a due
checkpoint without an additional model call. A checkpoint within an assignment
retains the assignment and its partial work until an architect decides what
follows. It does not fabricate an engineer result.

The [analysis brief](../../analysis/2026-10-14-architect-owned-progress-analysis-brief.md)
defines the original problem and required compatibility. The subsequent user
decision adds repetition-triggered checkpoints, including within an engineer
session, in place of the proposed periodic time-based progress check-in.
Existing stall detection remains independent.

The motivating run `20261013T215727Z-a3e5c9` accepted twelve assignments but
failed when the architect proposed a thirteenth. Two scenarios were judged done;
six scenario definitions and final comparison remained. Its replacement repeated
nine intake invocations and a readiness audit lasting 650.361 seconds, as retained
in the [dogfooding record](../../analysis/2026-10-13-projections-extraction-dogfooding.md).
These are observed costs of that workaround, not measured savings from this plan.

Source inspected at `5364524e11ce13fb91968521763fef62fc12791f`, with the adopted
principle present as an uncommitted change. Recheck the implementation baseline
before execution, including independent bootstrap fixes. Preserve unrelated
working-tree changes and historical outcomes.

## Required behavior

### Checkpoint cadence

Capture finite positive intervals in the run policy, separately from historical
ceilings and explicit operator constraints. Proposed starting defaults are three
coordination steps, three failed engineer repair cycles, and twenty-four engineer
tool calls. These are implementation defaults for reconsideration frequency,
not user-supplied budgets or claims of optimal cost. Iteration 1 may refine these
defaults with a recorded rationale; a configuration UI is outside scope.

A coordination step is one settled outcome delivered to the responsible
architect: an assignment result, a returned placement or unresolved-decision
exchange, a refused completion or failed completion gate, or a correction's
reassessment. Count its durable logical identity once. Internal gate attempts,
event delivery, scheduler re-entry and recovery invocations do not multiply it.
Maintain separate coordination history for each work item or capability task;
the responsible non-functional coordinator uses the same principle for its work.

Within an assignment, count each completed execution-tool call once, including
reads and unsuccessful calls: active repetition need not change source or reach
a gate. Exclude submission/preview plumbing, observation replay, compaction and
transport retries. A completed repair cycle means an engineer's proposed repair
was evaluated and the relevant check still failed. Document the exact event
classification and precedence in the specification. Identity, rather than text
similarity, controls deduplication; the harness does not infer cycles from prose.

Either engineer threshold makes one checkpoint due. Coincident triggers share
one checkpoint and retain both reasons. Do not count the architect's checkpoint
tools against the suspended engineer. Continuation, reconstruction and service
restart retain counts for the logical assignment. An accepted assessment advances
the checkpoint's recorded baseline; it never resets lifetime history.

The next normal architect turn carries a due coordination checkpoint. If an
engineer threshold becomes due first, suspend further execution at a safe
boundary and obtain the architect decision. Due checkpoints cannot be skipped by
starting a new session, revising an outline or moving to another owner. For an
accepted engineer submission racing with the trigger, reconcile its effects and
serve the checkpoint in the resulting architect turn, once.

### Evidence and judgment

Use the existing architect action submission to carry a checkpoint assessment:
a concise account of progress or lack of progress, references to supporting
evidence, and why the proposed next action is worthwhile. Reuse the action's
existing goal, outline and escalation fields instead of duplicating them in a
second decision protocol. An ordinary turn without a due checkpoint need not
produce a separate checkpoint report.

The harness binds the assessment to its checkpoint, responsible authority,
current task and assignment, invocation, decision revision and evidence basis.
The architect receives the original goal, previous assessment, intervening
engineer findings, accepted and unaccepted changes, actual gates and reviews,
pending review coverage, outstanding acceptance obligations and known external
prerequisites. Deliver a concise delta with direct artifact references; reconstruct
the same decision from durable evidence when session history is unavailable.

Resolving an uncertainty or eliminating a plausible cause can be progress without
a source edit. Passing automation, commits and tool activity do not establish
progress or completion. The architect can continue useful work, change the
approach or decomposition, seek another owner's decision, or report a concrete
obstruction. Repeating an unsuccessful approach requires a stated reason or
changed evidence. Validate authority, references and required fields; do not use
string comparison to decide whether the rationale is good enough.

Lack of progress is distinct from unfinished work. A missing external prerequisite
retains pending work with a concrete condition for resumption. A validated
unresolvable requirement follows the existing responsible-authority escalation
and terminal handling. The checkpoint count supplies neither outcome. This
mechanism requires reconsideration; it cannot guarantee that an architect never
misjudges a cycle.

### Architect authority and engineer suspension

The module architect owns the judgment for ordinary and contract module work.
For a capability assignment, record the issuing architect's explicit responsibility
for the named module scope and delegated outcome. The existing capability
architect can exercise that delegated responsibility; coordinating several owners
does not authorize it to replace another owner's architectural decision. Return
decisions beyond its authority through the existing placement or unresolved
workflow. Keep task-wide coordination distinct from module-scoped judgment.

At an engineer checkpoint, prevent further tool admission, settle already admitted
tools and reconcile their effects before architect assessment or replacement
execution. Preserve partial edits and suspended capability consumers. No checkpoint
automatically runs an audit, commits source, closes the assignment as partial or
failed, enlarges write scope, or creates a second writer.

A continue decision resumes the same logical assignment with recorded guidance.
A changed assignment uses the existing scope validation, explicit supersession
and durable assignment identities. Unconfirmed settlement remains a recovery
obstruction; a stop receipt alone is insufficient. Reuse session operations and
effect reconciliation. The actual Pi adapter must enforce the boundary, including
batches of tool calls; a prompt requesting voluntary return is insufficient.

Existing capability action validation normally refuses coordination while an
assignment is open. Add narrowly scoped authority for its authenticated checkpoint
decision without relaxing ordinary action validation. Where current submission
actions cannot express continuation of an open assignment, extend that architect's
action contract to express it; do not manufacture a new assignment merely to resume.
Completion cannot bypass settlement of the suspended assignment and its effects.

Standalone or manual execution with no available responsible architect leaves an
inspectable pending checkpoint for the supported driver to handle. It must neither
bypass the checkpoint nor invent an architect. Existing explicitly authorized
debugger waits and operator stops take precedence over automatic continuation.

### Durability and compatibility

Persist the due checkpoint before advancing past its execution boundary. Bind the
accepted assessment and intended action durably, then use existing reconciliation
to finish the action exactly once. A crash after assessment acceptance must not
cause another assessment or duplicate assignment. A stale or replayed submission
cannot clear a newer checkpoint, overwrite an assessment or revive old authority.

An interrupted assessment remains pending. Use existing bounded transport retry
groups and recovery for an unavailable architect; do not mark its work failed or
ask the operator to replenish progress allowance. A real missing prerequisite may
require operator intervention. No checkpoint schedules an endless tight retry loop.

Introduce a versioned effective policy for architect progress checkpoints.
Fresh runs capture it; compatible interrupted runs adopt it at supported recovery
boundaries. Preserve captured policy and all earlier events. Adoption must also
work when resource continuity is already enabled: its current presence check is
not sufficient for this migration.

An explicitly prepared successor of the retained twelve-assignment failure
imports assignment identities, accepted commits, audit identities, scenario
dispositions and remaining obligations. Adopt the new policy before admission,
and obtain one current architect checkpoint assessment. Do not synthesize several
overdue historical checkpoints or infer old assessments from successful gates.
The original terminal event remains terminal history. Reuse compatible intake;
changed candidate or producer evidence still requires applicable reassessment and
qualification. Unsupported nested successor boundaries retain explicit blockers;
this plan does not silently expand restart support to every historical state.

New execution must never enforce inherited task limits merely because the task
record still contains them. Automatic runs, manual steps, restart import, policy
adoption and public projections must agree on effective behavior. Keep legacy
records readable, including old terminal reasons and exhausted-round evidence.
Explicit user-supplied execution constraints retain their separate provenance and
requested behavior; old default ceilings cannot be relabeled as user constraints.

### Remove alternate ceilings and preserve independent bounds

Complete the following inventory against the execution baseline. The named paths
are navigation pointers, not prescribed new module boundaries.

| Current mechanism | Required disposition |
| --- | --- |
| `maxIterationsPerWorkItem`: ordinary/contract assignment, work-item resumption, ordinary/nested qualification in `run/service.ts`; `steps/authoring.ts` and `steps/after.ts` | Remove total-count admission and failure. Keep assignment numbering and use checkpoints at the relevant architect boundary. |
| Capability assignment ceiling and captured `maxAssignments` in `capability/policy.ts` and task records | Remove total-count enforcement, including imported tasks. |
| `maxWorkItems` and combined task/work-item check in `capability/ledger.ts` | Remove lifetime work-unit ceilings. Keep structural and ownership validation. |
| `maxPlacementRequests`, including unresolved requests | Remove lifetime request ceilings; recurring decisions require architect reconsideration. |
| `cycleReplansPerWorkItem` | Preserve cycle detection and evidence; replace count-based termination with a responsible architectural decision. |
| Work-item/capability gate repair and repeated completion-refusal counts | Preserve failures and blockers; allow architect-directed correction without a total retry ceiling. |
| `repairRoundsPerIteration` | A local repair batch may return work for architect assessment. It cannot terminate useful work or bypass a due checkpoint. |
| Reconciliation rounds and count-dependent floors | Remove the last-round prohibition on correction and count-based shortcuts around fresh assessment. Preserve risk, evidence and disposition authority. |
| Non-functional rounds, including `.max(3)` schemas, round decisions and external-repair admission | Remove the total correction/reassessment ceiling. Closure needs the responsible judgment and current candidate evidence. |
| Invocation/time/resource-return/reconstruction fields and capability helper functions | Distinguish active enforcement from historical fields and unused helpers. Retain Plan 44 continuity; no replacement lifetime cap. |
| Fork, readiness and infrastructure retries; rejected input/submission batches | Retain bounded exchanges or recovery groups where useful. Exhaustion yields the appropriate architect decision or concrete recovery obstruction, not semantic abandonment. |
| Settlement deadlines, command timeouts, review concurrency/queue and payload bounds | Retain their independent execution or representation responsibilities. Pending work and required review coverage survive recovery. |
| Plan-deviation approval and exceptional root-repair authority | Preserve these separate authority boundaries. Ordinary continuation spends neither authority; the number of progress checkpoints changes neither. |

Do not remove a counter merely because it is numerical. For every retained bound
that can stop execution, state the independent authority or actual obstruction
that justifies the outcome. Defaults live in
[run policy](../../../subs/harness/src/run/policy.ts); inspect each caller as well.

### Specification and prompt migration

The new principle replaces the count-based correction policy in
[CheckFinding principles](../../check-findings.principles.md#bound-the-correction-loop)
and its [specification](../../check-findings.spec.md#bound-the-correction-loop).
Update those commitments in implementation: a round number cannot force a finding
to remain unresolved, forbid correction, or excuse a missing assessment. Explicit
authorized waiver, deferral and unresolved dispositions retain their meaning;
required tests and scenarios remain non-waivable through that mechanism. Risk and
credibility inform the architect's choice without a last-round prohibition.

Update the [harness specification](../../harness.spec.md),
[loop architecture](../../architecture/autonomous-implementation-loop.md),
[harness README](../../../subs/harness/README.md), non-functional contracts and
module/capability architect, reconciliation, qualification and engineer procedures
alongside the relevant implementation. Plan 44's permission to retain semantic
round limits no longer authorizes a cumulative limit on useful correction work.
Keep historical plans and results intact; describe the new rule in current contracts.

Prompts must explain the trigger, evidence and expected decision without claiming
that the count proves a cycle. Engineer guidance must explain retained work and
continuation after a checkpoint. Public inspection and existing CLI/web views show
the due reason, assessed history range, responsible architect, pending/accepted
assessment, next action and any concrete obstruction. They never show a remaining
implementation allowance. No new dashboard, role or general scheduler is required.

## Implementation iterations

Execute these in order. Each iteration includes focused meaningful tests and its
related current contract changes. These delivery iterations are not runtime limits
on the engineers implementing the plan. Internal ownership and exact schemas remain
implementation choices within the contracts above.

### 1. Durable checkpoint contract and policy

Define captured intervals, event classification, due/accepted checkpoint identity,
responsible authority, evidence basis and assessment/action linkage. Extend existing
records and submissions; avoid a parallel progress tracker. Implement pure replay
and admission decisions with legacy readers and shared effective-policy selection.

Verify threshold crossing, coincident triggers, duplicate observations, monotonic
history, interrupted assessments and stale decisions with small in-memory records.
Record the final default intervals and the complete counter inventory. Keep new
production policy activation deferred until the execution and migration paths work.

### 2. Checkpoints at existing architect turns

Integrate coordination-step accounting and evidence deltas into ordinary, contract,
capability and qualification turns. Use the existing action submission to accept
an assessment and its next action. Deliver missing-scope decisions to the current
authority, and preserve existing completion reporting and scenario obligations.

Verify continuation, changed approach, learning without source changes, escalation
and completion refusal. Show that a due checkpoint uses one already-required
architect invocation and adds no gate. Include a delegated multi-owner example.

### 3. Engineer checkpoints during active execution

Implement repair/tool-call triggers through shared execution admission and session
handling, including the preserving Pi path. Settle admitted work, retain the
assignment, obtain the responsible architect's decision and continue or supersede
through ordinary authority rules. Provide manual-step handling for the same state.

Verify a busy ineffective engineer reaches assessment, read-only activity counts,
batched calls cannot escape admission, a simultaneous submission is reconciled once,
and an unknown mutation prevents replacement. Exercise actual adapter integration
with scripted model responses, not only fabricated runner outcomes. Missing native
continuation support must have a named reconstruction path, never an implicit reset.

### 4. Remove total-work ceilings throughout correction and scheduling

Remove the active ceilings in the inventory from scheduler, contract/capability
execution and manual steps. Migrate reconciliation and non-functional decisions and
schemas so further correction depends on responsible judgment. Preserve bounded
local repair/recovery batches and independent authority checks.

Verify minimal counterexamples beyond former assignment, qualification, placement,
work-unit, cycle, completion-repair, reconciliation and non-functional thresholds.
Check that no count establishes completion or weakens required acceptance. Correct
the conflicting CheckFinding principle and current specification in this iteration.

### 5. Recovery, adoption and supported successor execution

Integrate checkpoint replay with interruption, compaction, reconstruction, effect
reconciliation and service startup. Extend policy adoption, restart-import versions
and capability-policy compatibility; manual after-handling must use effective
policy rather than the original captured record. Import retained work without
reenforcing its old ceilings or replaying accepted actions.

Verify crashes before and after due-record persistence, accepted assessment,
action application and continuation dispatch. Verify the retained cap failure's
successor reaches its architect decision without intake, duplicate assignments or
lost judgments. Include external changes requiring fresh qualification, unsupported
restart boundaries, stop precedence and concurrent/stale resume commands.

### 6. Inspection, activation and composed qualification

Expose checkpoint state through harness-owned public contracts and existing CLI/web
consumers. Finish prompt/documentation migration, including standalone limitations.
Activate the complete new policy for fresh runs and compatible explicit recovery.
Do not ship a policy that removes ceilings before its checkpoint paths are usable.

Run the composed acceptance below, focused regression checks, type checking and
`npm run check:self`. Final implementation qualification uses a clean committed
candidate and the default configured audit, with commit authorization obtained as
required by repository instructions. Record actual coverage and remaining live
evidence separately. No provider release is assumed; a demonstrated provider need
follows that project's release workflow and exact pin adoption here.

## Acceptance examples

The small intervals below are fixture settings, not production defaults. Seed
minimal durable histories when crossing a former threshold; do not perform thirteen
live model calls or native audits to prove an admission rule.

```gherkin
Feature: Repetition triggers a responsible progress decision

  Scenario: Useful work continues beyond twelve assignments
    Given a work item retains twelve assignments and their accepted evidence
    And a coordination checkpoint is due
    When its module architect assesses useful progress and assigns the next outcome
    Then assignment thirteen is admitted with its expected contribution recorded
    And prior assignments and outstanding acceptance obligations remain intact

  Scenario: The existing architect turn serves the checkpoint
    Given a coordination checkpoint interval of three settled outcomes
    When the third outcome returns to the work item's architect
    Then its normal next turn must assess progress before another action is applied
    And no separate checkpoint invocation or audit is added

  Scenario: Busy repetition within an assignment reaches the architect
    Given an engineer tool-call checkpoint interval of two
    And the engineer retains partial edits without an accepted submission
    When two execution-tool calls settle and further calls are proposed
    Then further engineer tool admission waits for a progress assessment
    And the responsible architect receives the assignment and retained evidence
    And no engineer completion or partial result is invented

  Scenario: Read-only repetition cannot evade reconsideration
    Given an engineer tool-call checkpoint interval of two
    When the engineer completes two reads without returning a result
    Then a progress checkpoint becomes due despite no source change
    And the tool count supplies no judgment about whether the reads were useful

  Scenario: The architect changes an ineffective approach
    Given a checkpoint exposes repeated failed attempts and unchanged relevant evidence
    When the architect judges the approach ineffective and submits a revised assignment
    Then the revised assignment is validated and applied under its module authority
    And the old attempts and the reason for the change remain recorded

  Scenario: Investigation can advance the requirement without a commit
    Given an engineer resolved a material interface uncertainty without changing source
    When the architect cites that finding and explains the next experiment
    Then continuation is admitted without requiring a commit or passing audit as proof of progress

  Scenario: Passing checks cannot establish completion
    Given an assignment has a passing audit and no review concerns
    And a required scenario remains incomplete
    When the architect requests further implementation at a checkpoint
    Then the work continues and the scenario remains outstanding
    And the checkpoint does not mark the work item complete

  Scenario: Repeated checkpoints do not exhaust an allowance
    Given a work item has several accepted checkpoint assessments
    When another checkpoint becomes due and its architect authorizes continuation
    Then work continues without a maximum checkpoint count
    And each assessment and its history range remain available

  Scenario: Multiple engineer triggers produce one checkpoint
    Given one failed repair reaches both the repair and tool-call intervals
    When the engineer reaches a settled execution boundary
    Then one checkpoint records both triggers and receives one architect assessment

  Scenario: Unknown tool effects prevent overlapping execution
    Given an engineer checkpoint is due while an admitted command has uncertain effects
    When its stop receipt does not establish settlement
    Then the checkpoint retains an inspectable recovery obstruction
    And neither a replacement writer nor candidate acceptance is admitted
    When settlement and the effects are independently established
    Then the pending architect decision can proceed from those effects

  Scenario: Accepted submission racing with a checkpoint is preserved
    Given a checkpoint becomes due as the engineer's submission is accepted
    When the harness reconciles the accepted submission and its effects
    Then it serves the checkpoint in the resulting architect turn
    And it neither repeats the submission nor fabricates a second assignment result

  Scenario: Assessment interruption preserves the due checkpoint
    Given a checkpoint is due and its architect has accepted no assessment
    When provider interruption and service restart require reconstruction
    Then the same checkpoint remains pending with its evidence and responsible authority
    And recovery neither clears the trigger nor consumes a progress allowance

  Scenario: An accepted assessment survives a lost acknowledgement
    Given an assessment and intended next action are durably accepted
    When execution stops before the action is fully applied
    Then recovery reconciles and applies that action once
    And no second architect assessment is requested for the accepted checkpoint

  Scenario: Stale authority cannot clear a newer checkpoint
    Given an earlier checkpoint is assessed and another checkpoint is now due
    When the old invocation replays its assessment or attempts further mutation
    Then it cannot clear the new checkpoint or regain writer authority
    And the accepted earlier assessment remains unchanged

  Scenario: Delegated progress respects module decision authority
    Given a capability coordinator is responsible for an assignment in one module
    And its checkpoint identifies an interface decision owned by another architect
    When the coordinator requests that decision through the existing authority workflow
    Then the owning architect receives the unresolved decision and evidence
    And the suspended assignment retains its scope and outstanding goal

  Scenario: Correction remains possible beyond former round ceilings
    Given module, capability and non-functional work have reached their former correction limits
    And current evidence identifies unmet obligations
    When their responsible authorities authorize further correction and reassessment
    Then the corrections remain eligible under their ordinary authority rules
    And no round count permits completion or removes required evidence

  Scenario: A linked successor preserves work from the old cap failure
    Given a compatible terminal source failed after twelve assignments with two done scenarios
    And accepted intake and six pending scenario definitions are retained
    When an explicit linked successor is prepared and resumed under the checkpoint policy
    Then it reaches the responsible architect's current checkpoint without repeating intake
    And it preserves assignment identities and applicable scenario judgments
    And the imported cap does not refuse the next authorized assignment
    And the predecessor's failure and captured policy remain unchanged

  Scenario: Manual execution observes the same effective policy
    Given a manual step has adopted checkpoint policy over a legacy captured iteration ceiling
    When its responsible architect authorizes an assignment beyond that ceiling
    Then authoring and after-handling admit the same assignment once
    And a due checkpoint without an available architect remains pending

  Scenario: A real prerequisite causes a meaningful wait
    Given an architect judges that continuation requires a missing external service
    When it records that prerequisite at a checkpoint
    Then the task waits with the concrete obstruction and retained work
    And it does not automatically repeat an identical ineffective assignment
    When the prerequisite is restored through supported recovery
    Then continuation requires no replenished progress allowance

  Scenario: Explicit stop wins over checkpoint continuation
    Given an architect is assessing a due checkpoint
    When the operator stops the run before continuation is admitted
    Then no new engineer execution starts
    And retained work and actual settlement evidence remain available
```

## Qualification and handoff

Follow [Testing ramify-agent](../../testing.spec.md). Ordinary tests script external
Git, audit, command and model answers, using the real relevant orchestration and
adapter logic. Native tool/kernel claims require an exact reviewed test-boundary
entry. Use the minimum fixture history for each distinct behavior; retain all
configured audit projects. Run focused checks and then the configured default
audit on the authorized clean committed candidate:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

Include a coverage table for ordinary/contract engineers, capability and nested
qualification, reconciliation, non-functional correction, manual steps and the
actual Pi execution boundary. Cover the inventory's former thresholds beyond the
illustrative scenarios. Verify required checks and scenario judgment separately.
Measure extra architect calls and gates in scripted cases to establish that normal
coordination checkpoints add neither; this is not a claim about live token savings.

A separately authorized real follow-up should demonstrate continuation with
retained progress and report actual checkpoint decisions, repeated or avoided
intake/audit work, and observed time/usage. Do not restart or modify a live run as
part of authoring or scripted qualification, and do not claim the historical run
was recovered until a real supported successor demonstrates it.

This is the requested iterative roadmap document under `docs/plans/`. If execution
will use ramify-agent, prepare its supported `plans/<plan-id>/plan.md` input with
these requirements and acceptance, adjusting local links. Keep implementation
results and unrelated working notes outside that captured input. No agent roster,
parallel-agent schedule or tracker administration is prescribed by this plan.
