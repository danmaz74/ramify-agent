# Plan 41: recover interrupted operations and classify empty mutations honestly

**Date:** 2026-10-12. **Status:** implemented; final qualification in progress.
See [implementation results](implementation-results.md) for delivered behavior
and qualification evidence.
**Target:** ramify-agent. **Tracking:** `ramify-agent-9dt.12` for recovery,
`ramify-agent-9dt.11` for empty mutation classification; authoring is
`ramify-agent-7c9`. External repair admission is `ramify-agent-pkl`;
extension authoring is `ramify-agent-col`, and review corrections are
`ramify-agent-wsq`. Beads owns work status.

This is an outcome-based implementation plan. The executing architects choose
the decomposition and assignments; no iteration schedule is prescribed. For
harness execution, package this document as
`plans/41-interruption-recovery/plan.md`. Its links are authored relative to
`docs/plans/`; rewrite them to resolve from the packaged location, because the
harness follows local links to capture the linked obligations and a broken link
silently drops them. Writing this plan does not launch a run.

## Problem and intended result

The revision-preview trial `20261012T125409Z-e38169` retained four accepted
provider iterations and an accepted capability handback. A later plan-architect
fork lost its stream while composing a deviation submission. No submission was
accepted, but the run immediately became terminal. A reviewer interruption had
already recovered successfully, demonstrating that recovery depends on the role.
The same trial recorded an ownership failure on a read-only turn: an empty
mutation query omitted every `--path`, so Ramify answered its default `.` and
the harness correctly rejected that answer against the requested empty set.

Deliver predictable recovery for ordinary run operations and an honest empty
mutation outcome. Preserve accepted work, partial edits, authority, evidence and
finite execution bounds. The operator must be able to resume a recoverable run
without creating a new run or manually editing its durable records.
The primary operator workflow includes fixing an obstruction outside the run,
personally or through a separate agent, then resuming the retained work. The fix
may change target source, supported configuration, the environment or the harness
runtime. Resume must distinguish those deliberate repairs from unexplained drift.

## Decisions confirmed by the user

- Eligible provider or connection interruptions receive bounded automatic
  retries, then pause the same run for explicit resume.
- Apply the new contract to new runs. Historical terminal runs, including the
  motivating trial, remain terminal; reopening or migrating them is excluded.
- New runs can pause at a recoverable obstruction, accept an externally performed
  repair through explicit resume admission, and continue in the same run. The
  operator authorizes another attempt; no separate agent approval of the
  operator's diagnosis is required.

Use two automatic retries after the initial attempt as the default, consistent
with the existing per-gate infrastructure retry default of two
(`infrastructureRetriesPerGate` in `subs/harness/src/run/policy.ts`). Capture
the policy when the run starts. An explicit resume authorizes one further
bounded attempt group for the paused operation; it does not reset total
invocation or active execution limits. Automatic attempts within that group
remain restricted to eligible transport failures. A nontransport obstruction
waits for explicit external repair admission. These numeric defaults are policy,
not a claim about optimal recovery cost.

## Required behavior

### One recovery contract across ordinary roles

Apply the same eligibility, retry accounting and durable pause rules to ordinary
run roles: initial architect, catalog extractor, global fork, local architect,
engineer, contract engineer, capability architect, reviewer, failure analyst,
context selector, nonfunctional coordinator and nonfunctional repair engineer.
Purpose matters as well as the stored role: retain the special automatic
root-repair exception below. Cover fresh invocations, continuations and forks,
including unresolved requests, consultations, reviews and capability returns.

Recognize infrastructure interruption from structured executor/adapter evidence.
Preserve the provider's diagnostic and actual interruption classification. Do
not infer recoverability by matching words in free-text errors. Provider-neutral
evidence must distinguish retryable transport/service failures from known
permanent failures such as rejected credentials. If evidence is insufficient,
pause with the classification gap instead of automatically retrying or
inventing a semantic outcome. Adapter faults and corrupt durable state must not
be silently relabeled as transient provider failures.

Invalid submissions, semantic partial results, requests for capabilities,
unresolved decisions, context-budget returns, cancellation and execution-bound
exhaustion retain their own handling and budgets. They do not become transport
retries. A retry never waives a gate, enlarges scope, decides a plan deviation or
answers an unresolved semantic question. Ordinary engineer failures still return
to the responsible architect; a qualifying transport interruption first receives
this recovery handling instead of being prematurely turned into a partial.

Count every successor invocation and retain all original attempts. Existing
review retries and provider-internal retries must have explicit accounting;
do not accidentally multiply independent retry loops or reset a request's
semantic budget. Use bounded, cancellation-aware delays between automatic
attempts. Document their policy, including how provider retry hints are bounded.
Repeated service startup must not replenish automatic attempts.

### Other obstructions that permit external repair

For new runs, also support a durable recovery pause for a failed ordinary task
preparation or an executor/adapter defect when the ledger and original inputs are
readable, writers and tools have confirmed settlement, and the harness can identify
the unfinished operation and reconcile its effects. Known environment blockers,
including rejected credentials, may await external correction without receiving
automatic transport retries. Retain the original exception and classification;
pausing does not establish that the obstruction is transient or repaired.

Existing semantic correction and automatic project repair get their ordinary
handling first. This extension neither converts semantic rejection into a pause
nor invokes a repair engineer for every exception. Where automatic project repair
is not applicable, an otherwise recoverable ordinary preparation obstruction can
pause directly. Interrupted, blocked or unverified automatic root-repair attempts
retain their existing manual-attention and terminal behavior; resuming those
attempts is outside this extension.

At the automatic-repair preparation boundary, a refusal before a repair
invocation starts for that obstruction may also pause the ordinary operation if
all general recovery preconditions hold. Examples are a missing contingent
repair assignment or an already spent repair allowance following a successfully
completed repair. Retain the refusal incident and its reason, but do not
terminate solely because automatic repair was unavailable. After an admitted
external correction, retry the pending ordinary preparation; do not launch the
refused repair or replenish its allowance. This explicitly replaces the
specification's unconditional refusal-is-terminal rule for eligible new-policy
runs. Refusals caused by corrupt state, unconfirmed settlement, unaccounted
effects or other failed recovery preconditions retain their existing failure
handling. A prior unfinished, blocked or unverified repair is not a
spent-but-successful repair.

Do not turn every internal failure into a usable pause. Corrupt or incompatible
durable state, unconfirmed settlement, user stop and exhausted whole-run limits
retain their explicit failure or terminal handling. An unknown effect stays a
resume blocker until its completion is independently reconciled; an operator's
diagnosis alone cannot establish it.

### Recover readiness and check-execution obstructions

The pause contract also covers infrastructure obstructions outside agent
invocations: readiness checks and iteration, capability/work-item and final
audit gates. Use structured check/provider evidence to distinguish inability to
execute or obtain a result from an actual assertion failure. A missing check
executable, unavailable check service or settled runner interruption may pause
the pending boundary when ordinary bounded infrastructure recovery is exhausted
or inapplicable. A generic `not-verified` verdict alone is insufficient: preserve
its cause and apply the same state, settlement and effect-reconciliation rules.
Actual failing assertions retain ordinary repair and semantic handling.

Record the pending boundary, candidate/configuration identities, original
submission or assessment when present, spent attempts and unresolved effect
identities. After admitted correction, resume that boundary with a new check
attempt; do not rerun the engineer or architect merely to recreate an already
accepted submission. Readiness resumes its unfinished prerequisite without
repeating committed setup effects. A final gate resumes qualification for the
still-applicable assessed candidate; changed prerequisites instead require the
existing reassessment or correction path before qualification.

Reuse authenticated completed effects and qualification only where applicable
to the same candidate and configuration. Reconcile a commit or audit receipt
whose acknowledgement was lost before deciding a new attempt is needed. A new
attempt retains its predecessor and producer evidence, and cannot duplicate an
accepted commit or gate transition. Check execution and selection remain owned
by ramify-audit; this recovery adds no alternate runner or verdict.

An explicit resume authorizes one additional bounded infrastructure attempt group
for the pending boundary under its captured limits. Preserve all previous
attempts and counters; this authorization is a new group, not a reset of spent
allowances. Use the boundary's existing retry policy without stacking the agent
transport retry loop around it. Whole-run limits and semantic repair budgets
remain unchanged. An unresolved infrastructure obstruction pauses again after
that group; stop, unsafe state and whole-run exhaustion retain terminal handling.

### Preserve the operation and reconcile its effects

Recovery identifies the interrupted logical operation, run, role, work/request,
assignment revision, original session source and accepted candidate. A real new
attempt receives its own invocation/session-operation identities and a durable
link to its predecessor. It never overwrites an old packet or reuses an old
operation identity to execute different work.

Before retry or resume, reconcile durable submissions and effects. If a valid
submission was accepted before an acknowledgement was lost, finish its pending
transition through the existing effect journal; do not ask the model to submit
it again. Accepted provider iterations, handbacks, decisions, commits and gates
must not be replayed as missing work. Fresh correction and qualification required
by an admitted external change are new work with their own evidence; they do not
rewrite earlier acceptance. This is an orchestration guarantee, not an assumption
that an LLM will reproduce identical tool calls.

Incomplete streamed tool arguments are evidence only. They are neither an
accepted submission nor a rejected submission without an actual verdict. Partial
edits remain available, with their mutation evidence; do not reset the tree to
erase them. Revalidate authority and candidate identity before further writes or
acceptance. Never replay a shell command or uncertain mutating tool merely
because its response was lost. Reconcile an established effect or pause when its
completion cannot be established safely.

Use the recorded exact source for a continuation or fork when available. When
it is unavailable, use only an explicitly named, source-backed reconstruction
supported by current session contracts, recording its inputs and degraded mode.
If that reconstruction cannot be established, pause with the missing prerequisite.
Never silently fork from a newer parent or claim a fresh context is an exact
continuation. The durable workflow, not an in-memory session, owns progress.

### Durable pause and supported same-run resume

Exhausted eligible automatic retries leave the run nonterminal and visibly
awaiting recovery. Record the failed operation, interruption evidence, attempt
counts, accepted progress, retained partial work and resume prerequisites. This
infrastructure pause does not require an LLM to successfully submit an
environment-problem decision first. Existing architect-authored environment
problems retain their semantic authority and response workflow.

Quiesce ordinary scheduling before declaring a usable pause. Already admitted
operations settle under their existing bounds; accepted results remain durable.
Unconfirmed writer or tool settlement prevents any successor writer or gate and
must remain visible as a blocker. Preserve existing terminal handling where
settlement cannot be established; a pause must not claim the project is safe
merely because a live-invocation map is empty.

Provide harness-owned query and resume commands, a documented CLI operation and
a Run-page resume action. The web module projects these contracts and forwards
commands; it does not infer eligibility or write durable recovery state. Show
why the run paused and why resume is available or blocked. Resume targets a
specific current recovery occurrence and revision. Stable command identities
deduplicate exact retries; conflicting content and stale occurrences are refused.
Concurrent clients can admit at most one successor attempt group.

Before admission, revalidate captured inputs and policy compatibility, candidate
and assignment identity, source/reconstruction availability, writer settlement
and ordinary authority checks. Known retained partial edits are part of recovery;
external changes require the admission contract below, and unexplained drift is
refused. A rejected resume launches no model operation and reports the failed
prerequisite. Stop takes precedence over retries and resume,
retaining existing stop settlement and terminal behavior.

A recovery pause survives service restart and waits for an explicit resume;
restart alone does not authorize another attempt group. If the service stops
during an ordinary operation or recovery transition, reconcile durable progress
before scheduling further work. An interrupted operation without an accepted
result enters the same recoverable handling when its prerequisites can be
established. Unreadable or incompatible committed state fails explicitly.

Only fully reached operator waiting is excluded from active run time. Model
execution, retry delays and settlement consume the ordinary bounds. Retain the
remaining budgets of unrelated waiting reviews without renewing expired ones.
Total attempts, active time, pause duration and known usage remain inspectable;
unknown provider usage remains unknown. Exhausted whole-run limits remain
terminal and are not overridden by resume.

### Admit external repairs before continuation

Provide a read-only recovery inspection through the harness query, CLI and Run
page. It identifies the obstruction, current operation boundary, retained work,
changes since the settled pause, runtime compatibility, remaining allowances and
resume blockers without launching a model. An operator or separate agent can
repair while execution is quiescent; the harness must not race those edits with
background writers or silently resume during service startup.

Resume can carry an external repair declaration identifying the changed areas,
the operator's explanation and optional diagnostic evidence. Compare it with
actual retained and current identities. Record target HEAD, candidate tree and
staged, unstaged and untracked source changes where present, supported
configuration changes, and old/new harness and provider identities.
Environment-only fixes need no fabricated source delta; record the declared
change and available observations without capturing credentials or secrets.
Retain the original obstruction and pause evidence unchanged. A declaration is
not proof that the fix works.

Successful admission commits the observed repair, operator command, compatibility
result, outstanding verification and chosen continuation boundary before execution.
Bind admission to that exact observed candidate and runtime; another edit before
dispatch requires revalidation, not silent adoption. Duplicate commands and crash
recovery cannot adopt the repair or dispatch its successor twice. Refusal preserves
the candidate and reports actionable blockers, without resetting files or making
a model call.

External target edits have explicit operator provenance, separate from the
original engineer assignment and from an automatic-repair delta. Adoption does
not claim those edits were made by a harness invocation, excuse an earlier scope
violation or enlarge subsequent agent write scope. Give later gates enough
authenticated evidence to account for the admitted external delta; simply
ignoring outside-assignment paths is insufficient. Fresh ownership, protected
files, excluded projects and normal qualification remain enforced.

Permit compatible harness fixes and compatible changes to operational target
configuration needed to remove the obstruction. Define supported compatibility
for captured policy, record schemas, submission validators, session equipment,
assignment authority and audit configuration; changed versions alone are neither
proof of compatibility nor grounds to refuse every runtime fix. Preserve frozen
plan/instruction packages, accepted Git history and historical evidence. Manual
edits to harness-owned durable records are never an external repair. Changes to
those packages, weakened acceptance checks, incompatible policy or unreadable
records remain refused. A supported operational audit-configuration change must
retain all required checks and invalidate affected prior qualification. Record
its newly admitted configuration revision without replacing the original capture;
this permits no agent bypass of protected-file guards. Do not silently rewrite
captured inputs or execute changed bindings under an old operation ID.

Resume at the nearest valid workflow boundary. With no accepted result, prepare
a new attempt of the outstanding role using current evidence and the repair
description. With an accepted result, finish only its still-valid pending effects;
if the external repair invalidates their prerequisites, return the conflict to
the responsible authority before applying them. Preserve useful partial work.
Reuse the exact recorded session point when compatible, append the changed facts,
or record a supported fresh reconstruction. An accepted external fix does not
pretend the interrupted model response completed.

Earlier decisions and gates remain historical evidence for their original
candidates. Identify affected outstanding obligations and evidence after repair;
when applicability cannot be established, require fresh qualification instead of
assuming the old evidence covers the new candidate. The responsible architect
revisits affected semantic choices through existing correction paths. Unaffected
accepted work is retained. Every resumed candidate still meets ordinary completion
and final gates, and the next attempt may establish that the obstruction persists.

External repair consumes no automatic root-repair invocation. It also replenishes
none: retain spent invocation/time allowances, semantic retry budgets and the
one-repair limit. Preserve each verified automatic-repair delta and whether a
passing gate consumed it. A changed path cannot borrow earlier repair permission;
its external modification needs its own admission evidence. The first qualifying
gate consumes an unconsumed repair supplement under the existing rules.

### Empty mutation classification

When the observed mutation path set is genuinely empty, return empty placement
classifications without invoking path ownership acquisition. Record no
`placementFailure` attributable to that empty observation; `outsideScope` and
`unknownPlacement` remain empty. This means there were no paths to classify,
not that a provider answered or current project ownership was verified.

Preserve failure to obtain the mutation observation itself: an unavailable diff
or snapshot is not an empty set. Likewise, nonempty targets whose physical
resolution fails must not disappear merely because no paths could be queried.
Preserve strict requested-path validation for every nonempty ownership query,
including explicit `.` requests, and the provider's existing default-root
behavior for callers that intentionally request it.

The empty observation shortcut does not bypass candidate acceptance. Earlier
retained changes still require fresh current ownership and required checks for
the complete candidate. Protected-file, symlink, excluded-tree, shell-mutation,
historical-authority and scope rules remain effective. A no-delta turn must not
erase earlier unknown placement or acquisition failures on actual changes.

## Compatibility and specification obligations

The following linked documents supply applicable obligations, carried explicitly
above; implementation must update affected specifications to match the delivered
contract without rewriting historical reports:

- [Harness principles](../../harness.principles.md): runtime failure is not a
  semantic outcome; agents make semantic judgments; durable state owns progress;
  interruptions must permit restarted work without losing accepted progress.
- [Harness specification](../../harness.spec.md): recorded write authority,
  fresh ownership at acceptance, exact source/reconstruction provenance,
  bounded execution, writer settlement and idempotent command admission remain
  enforced. Add ordinary retry/pause/resume, recoverable nontransport
  obstructions, readiness and audit-gate recovery, and external repair
  admission, including provenance at subsequent gates and compatible
  runtime/configuration changes. Distinguish empty mutation observations from
  acceptance ownership requirements.
- [CheckFinding specification](../../check-findings.spec.md): an execution gap
  is not a pass or source violation; unavailable placement is distinct from
  demonstrated outside-scope changes. Preserve these distinctions in projections.
- [Automatic project repair](../../architecture/automatic-project-repair.spec.md):
  interrupted automatic root-repair attempts still require manual attention;
  startup never automatically launches another root-repair session. Preserve the
  one-repair allowance and verified-delta consumption across external repair
  admission; this plan does not resume terminal or unfinished root-repair attempts.
  Revise refusal-is-terminal for eligible pre-invocation refusals under the new
  policy as specified above; retain the original refusal evidence and unsafe-state
  exclusions. The implementation must update that specification explicitly.
- The debugger's live-server requirement in the harness specification remains:
  unfinished debug-enabled runs are interrupted on server restart. This plan
  does not make debugger conversations resumable across server loss. Eligible
  transport failures while its server stays alive may use ordinary recovery,
  preserving breakpoint occurrence and interaction identity.

Older records remain readable with their original meanings and terminal status.
Do not reinterpret historical `agent-failed` events as recoverable pauses or
silently upgrade captured policies. New runs capture the new recovery policy;
unsupported versions produce explicit compatibility failures.
Compatible runtime updates for a paused run under the new policy are supported
as specified above; this does not authorize historical-run migration.

Standalone session/step execution, historical-run migration, general filesystem
rollback, checkpoint optimization, semantic correction policy changes and new
provider releases are outside this plan. Reuse existing public provider surfaces;
no sibling-source imports, linked dependencies or unapproved pin assumptions.

## Acceptance

The numbers in the first scenario describe a scripted counterexample modeled on
the retained trial; they do not require another paid reproduction.

```gherkin
Feature: Recover interrupted ordinary run operations

  Scenario: An interrupted architect answer recovers without repeating accepted work
    Given a run has four accepted provider iterations and an accepted capability handback
    And its unresolved architect fork loses transport while streaming unsubmitted arguments
    When the next bounded attempt submits a valid answer
    Then the same unresolved request advances in the same run
    And the four iterations and handback are not executed or accepted again
    And the incomplete arguments have no submission verdict

  Scenario: Retry exhaustion survives restart and explicit resume
    Given an eligible operation and both of its automatic retries lose transport
    When the settled run pauses and the service restarts
    Then the run retains its recovery occurrence and spent retry budget
    And no model operation starts until an explicit resume is admitted
    When the operator resumes that occurrence and the next attempt succeeds
    Then the same run continues with its accepted progress intact

  Scenario: A service interruption retains an unfinished operation
    Given an ordinary non-debug run has an admitted architect operation with no accepted submission
    When its service stops and restarts with writer settlement and source evidence available
    Then recovery retains the operation identity and accepted run progress
    And any successor is linked to that interrupted operation under the captured retry policy

  Scenario: Lost acknowledgement does not repeat an accepted decision
    Given an architect submission was durably accepted before its acknowledgement was lost
    When recovery reconciles the interrupted operation
    Then its pending workflow transition finishes once
    And no replacement model invocation is requested for that accepted answer

  Scenario: An interrupted writer retains edits without replaying an uncertain command
    Given an engineer changed an authorized file before transport failed
    And a mutating shell operation has no established completion
    When recovery examines the retained operation
    Then the edit and original evidence remain available
    And the shell operation is not automatically replayed
    And another writer is blocked until settlement and effects are reconciled

  Scenario: Concurrent resumes admit one attempt group
    Given a run is paused at a current recovery occurrence
    When two clients resume it and one repeats its identical command
    Then exactly one successor attempt group is admitted
    And the identical command returns its original receipt
    And a new command for the stale occurrence is refused

  Scenario: Changed captured input blocks resume
    Given a run is paused for recovery
    And a captured instruction package has changed
    When the operator requests resume
    Then the command reports the changed-input prerequisite
    And no model operation is launched

  Scenario: Semantic rejection does not consume transport retries
    Given an architect submits a structurally invalid decision over a successful connection
    When the harness rejects that submission
    Then ordinary submission correction rules apply
    And no transport retry or recovery pause is created for that rejection

  Scenario: Stop wins while recovery is waiting
    Given a run is waiting for a transport retry or operator resume
    When the operator stops the run
    Then ordinary stop settlement completes
    And no queued retry or later resume launches a successor

  Scenario: A historical failed run remains terminal
    Given a run was recorded as failed under the older policy
    When the new harness loads it and receives a resume request
    Then its recorded failure remains unchanged
    And the resume request is refused without starting work
```

```gherkin
Feature: Resume after an external repair

  Scenario: An ordinary preparation defect waits for an external fix
    Given an ordinary architect task preparation throws outside the automatic repair boundary
    And its durable inputs are readable and preceding writers and effects have settled
    When the harness records the obstruction
    Then the same run pauses with its unfinished operation identified
    And no automatic transport retry or repair engineer is started for that exception

  Scenario: A missing automatic repair assignment permits external correction
    Given ordinary architect preparation fails at the automatic repair boundary
    And automatic repair is refused because no contingent repair assignment exists
    And the original inputs are readable and all preceding writers and effects have settled
    When the refusal is recorded
    Then the ordinary operation pauses without starting a repair invocation
    When the operator admits an external correction and resumes
    Then the pending ordinary preparation is retried
    And the original refusal remains recorded without new repair authority

  Scenario: Unconfirmed settlement still prevents recovery after a repair refusal
    Given automatic repair is refused before invocation because a preceding writer has not confirmed settlement
    When the operator declares an external fix
    Then the run does not become eligible for resume
    And existing writer-settlement failure handling remains effective

  Scenario: A separate agent fixes target source before explicit resume
    Given a run is paused with accepted provider work and partial consumer edits
    And a separate agent corrects the target obstruction while execution is quiescent
    When the operator declares the external change and resumes the current occurrence
    Then the harness records the actual external delta separately from the original assignment
    And the next responsible role receives the retained work and repair description
    And unaffected accepted provider work is not repeated
    And later gates account for the external delta without expanding agent write scope

  Scenario: A compatible harness fix resumes the retained operation
    Given an ordinary adapter defect paused a run under the new recovery policy
    And the operator installs a compatible harness fix while preserving captured instructions and records
    When the service restarts
    Then the run still waits for explicit resume
    When the operator declares the fix and resumes the current occurrence
    Then admission records the old and new runtime identities and compatibility result
    And the same unfinished operation proceeds with a new attempt identity
    And no agent approval of the operator diagnosis is required

  Scenario: An environment-only repair needs no source edit
    Given rejected credentials paused an otherwise recoverable operation without automatic retries
    And the operator corrects the credentials without changing target source
    When the operator declares the environment repair and resumes
    Then the next bounded attempt can establish whether access is restored
    And the recovery record invents no source delta and contains no credentials

  Scenario: A supported operational configuration fix preserves required checks
    Given a run paused because a configured check could not locate its executable
    And the operator corrects that operational configuration without removing or weakening required checks
    When the compatible external repair is admitted
    Then the old and new configuration identities remain recorded
    And affected prior qualification is not reused for the changed configuration
    And the required checks qualify the resumed candidate

  Scenario: A final audit execution obstruction resumes the pending gate
    Given a final candidate assessment is accepted
    And the final audit cannot execute a required check after bounded infrastructure recovery
    And its runner and effects have confirmed settlement
    When the operator corrects the check environment and explicitly resumes the paused run
    Then the pending final gate receives a new bounded check attempt for the unchanged candidate
    And the accepted assessment is not requested from an agent again
    And all earlier audit attempts and spent allowances remain recorded
    And the run completes only after the required final qualification passes

  Scenario: Readiness recovery preserves completed setup effects
    Given readiness has committed a setup effect before a required service becomes unavailable
    And ordinary infrastructure recovery is exhausted with confirmed settlement
    When the operator restores that service and resumes the paused readiness boundary
    Then the unfinished prerequisite is checked again
    And the committed setup effect is not executed again

  Scenario: A test assertion failure retains semantic repair handling
    Given an audit successfully executes a check that reports a failing assertion
    When the gate handles that result
    Then the existing repair or responsible-authority workflow receives the failure
    And the assertion failure alone does not create an infrastructure recovery pause

  Scenario: An external change invalidates earlier acceptance applicability
    Given a paused run has a decision and passing gate for an accepted provider candidate
    And an external repair changes the provider behavior on which the consumer relies
    When the repair is admitted
    Then the original decision and gate remain historical evidence
    And the responsible architect receives the affected obligation for reassessment
    And the changed candidate requires fresh qualification before completion

  Scenario: Unexplained drift blocks resume
    Given a run is paused with a retained candidate identity
    And target source changed after the pause without an external repair declaration
    When the operator requests resume
    Then the harness identifies the unexplained changes and launches no model operation
    And the changed files and original run evidence remain intact

  Scenario: A declared but incompatible repair blocks resume
    Given a run is paused and the operator declares a runtime or configuration repair
    And that repair changes an unsupported policy contract or weakens required acceptance checks
    When the operator requests resume
    Then the harness reports the compatibility failure and launches no model operation
    And the declaration does not overwrite captured policy or earlier evidence

  Scenario: External repair preserves spent automatic repair authority
    Given a paused run has used its one automatic root-repair invocation
    And a passing gate has consumed that repair delta
    When an external correction is admitted and execution resumes
    Then no new automatic repair allowance is created
    And the consumed delta supplies no permission for the external correction
    And spent execution and semantic retry allowances remain spent

  Scenario: Another edit after repair admission prevents stale dispatch
    Given an external repair was admitted for an exact candidate and runtime
    And the candidate changes again before successor dispatch
    When the harness attempts continuation
    Then it requires revalidation of the new change before launching work
    And it does not silently include the new change in the prior admission
```

```gherkin
Feature: Honest classification of empty mutations

  Scenario: A read-only capability request has no placement failure
    Given an engineer turn observes no changed paths and requests a capability
    When its mutation evidence is classified
    Then no path ownership query is issued for that empty observation
    And outside-scope and unknown-placement path lists are empty
    And the observation records no ownership acquisition failure or fabricated provider answer

  Scenario: An unavailable mutation observation is not empty
    Given mutation observation failed before its changed paths could be established
    When the harness records the turn outcome
    Then the observation failure remains visible
    And the harness does not report that no paths changed

  Scenario: Nonempty ownership mismatches remain unavailable
    Given an observation names a changed source file
    And the ownership provider answers only for the project root
    When its placement is classified
    Then the mismatched answer is rejected
    And the placement evidence remains unavailable for the changed file

  Scenario: An empty turn cannot qualify earlier retained changes
    Given a candidate contains a retained source edit from an earlier turn
    And the latest turn changed no paths
    When candidate acceptance cannot obtain fresh ownership for the retained edit
    Then the empty turn has no spurious placement failure
    And candidate acceptance remains blocked by the real ownership gap
```

Qualification must also supply a role/purpose coverage table for the common
recovery path and its explicit exceptions, with focused scripted cases at each
distinct caller transition. Cover unavailable fork sources and named rebuilds,
permanent/unknown provider outcomes, exhausted whole-run limits, review budget
preservation, empty effective queries from nonempty unresolved targets, explicit
root queries, and pause visibility/command behavior through CLI and web consumers.
Inspect ledger/effect recovery at the accepted-submission boundary and ensure
projections preserve predecessor identities, attempt counts and unknown usage.
Cover external repair inspection and declarations through CLI and web, admission
interrupted before and after its durable commit, and changes between inspection,
admission and dispatch. Verify retained tracked/untracked/index changes and
configuration/runtime identities without leaking environment secrets. Include
incompatible updates, pending accepted effects whose prerequisites changed,
unsupported session reuse with an explicit reconstruction, and both consumed and
unconsumed automatic-repair supplements. Refuse continuation through unfinished
automatic root repair, corrupt records or unconfirmed writer settlement even
when the operator declares a fix. Scripted cases must distinguish recovery of
original effects from new correction and qualification after external changes.
Cover eligible refusals both with no contingent assignment and after a successful
repair spent the allowance, keeping blocked or unfinished repairs excluded.
Exercise readiness and each distinct gate continuation, including lost commit
or audit acknowledgements, changed candidate/configuration applicability and
repeated infrastructure failure after an explicitly authorized attempt group.

Follow [Testing ramify-agent](../../testing.spec.md): ordinary tests script
external Git, CLI, provider and audit responses. Use controlled clocks for bounds;
do not reproduce random network failures or require a paid model run. Native
claims need exact reviewed entries in `src/tests/test-boundaries.json`.
Run relevant focused tests and `npm run check:self`. Final implementation
qualification uses the configured default audit from a clean committed candidate,
retaining every configured project; any scope override needs its own reason.
An audit establishes check health; the responsible architect assesses fulfillment.

## Context and implementation guidance

The [trial report](../../analysis/2026-10-12-revision-preview-plan40-trial.md)
is background evidence, not an additional acceptance specification. The original
run, partial stream and ownership probe must remain historical evidence.

Likely navigation seams, not prescribed ownership assignments:

- `subs/harness/src/run/service.ts`, `session-operations.ts`, `records.ts` and
  `policy.ts`: invocation handling, durable workflow restoration and bounds.
- `subs/harness/src/interfaces/protocol/runs.ts` and `transcripts.ts`: public
  commands, states and structured interruption evidence.
- `subs/harness/subs/agent/`: provider-neutral operations and executor evidence;
  preserve existing source verification and settlement contracts.
- `subs/harness/src/guard/write-guard.ts`, `run/mutations.ts` and
  `subs/harness/subs/evidence/src/ramify-cli.ts`: mutation observations,
  placement classification and ownership queries.
- `src/cli.ts` and `subs/web/`: operator-facing adapters to harness contracts.

Prefer extending shared invocation handling and existing durable effects over
independent retry loops for each role. Keep the empty-observation correction
local to the layer that knows the observation is genuinely empty; do not forge
an ownership answer to make an empty request look successful. The two outcomes
can be delivered independently; final qualification covers their composition.

No product-policy question remains open. Exact schemas, command spelling and
internal decomposition belong to implementation within these requirements.
