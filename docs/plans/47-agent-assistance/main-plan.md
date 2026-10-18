# Plan 47: agent assistance and delegated post-iteration assessment

**Date:** 2026-10-18. **Status:** implemented; committed audit and native repair pilot passed.
See the [implementation record](implementation-results.md) for evidence, measured behavior and qualification limits.
**Execution:** sequential iterations, coordinated by an ordinary Codex Astra
session using native Sol implementation agents. This is an implementation
schedule for that workflow, not an input to the current full-plan harness.
**Source baseline:** `091ca382d8b514bdc6b83f0e98f00f5e395b56f1` plus the
uncommitted assistance proposals. Recheck affected interfaces when implementing;
other work in the checkout is not part of this plan.

## Outcome

Astra delegates a completed iteration's entire assessment to ramify-agent.
The service checks the exact candidate, runs ramify-audit, compares protected
files, schedules independent Pi reviews, investigates and reconciles concerns,
and returns one compact gate result. Astra coordinates implementation and acts
on remaining repairs or decisions, without conducting routine review itself.

All agentic assessment uses Pi. Native Sol workers implement changes and
repairs. A worker focusing on a module can edit any other module required by
its task. No assistance operation introduces a module-based write restriction,
scope-expansion request or special permission for cross-module work.

The current harness remains usable. Assistance becomes a separately callable
facility under the harness's contract and durable-state ownership, sharing
existing behavior where useful without requiring the old execution lifecycle.
The implementation makes existing assessment facilities callable by assisted
execution. Where a thin wrapper fits, use it. Where workflow coupling prevents
that, extract the shared behavior and have both the harness and assisted
wrappers call it. Migrate the affected harness caller in the same increment;
leaving an old implementation beside a new assisted copy is not completion.

MCP is the primary interface from the first iteration. Plan management is
limited to registering an execution and linking its assessments and findings.
Astra retains the plan, sequencing and worker coordination; RA does not gain
a task scheduler, progress ledger or acceptance-inventory workflow.
An assisted execution is a new `assisted` job kind alongside the existing
`implementation` and `manual` kinds. It uses the same plans, job IDs, storage
and persistence infrastructure, with a small execution-specific handler.
There is no parallel plan registry or separate plan-execution ID system.

This plan implements the [assistance principles](../../architecture/agent-assistance/approach.principles.md),
[Astra coordination proposal](../../architecture/agent-assistance/astra-coordination.proposal.md)
and [post-iteration assessment proposal](../../architecture/agent-assistance/review-and-findings.proposal.md).
The last document supersedes the earlier arrangement in which Astra scheduled
reviewers and reconciled their reports. The [capability inventory](../../architecture/agent-assistance/capability-usage-analysis.md)
is a reuse reference, not a requirement to omit the now-selected review features.

## Runtime code changes

This is an integration and selective extraction plan. Delivered behavior such
as auditing, review scheduling and finding reconciliation is not a list of new
subsystems to implement.

| Runtime change | Existing foundation | Required addition or adaptation |
| --- | --- | --- |
| MCP surface | Harness services and command admission | Thin transport/tools using existing services and the assisted handler. |
| Assisted execution | Plans, jobs, IDs, discovery and ledger | Small job schema/handler and execution-kind-aware queries. |
| Assessment entry point | Audit, review, reconciliation and finding facilities | Compose them around candidate/brief inputs and return a compact result. |
| Review integration | Pi, queue, snapshot tools, reports and coverage validation | Shared factual briefing and preparation, with harness and assisted adapters. Combined review and requirement coverage are targeted extensions. |
| Reconciliation integration | Pi assessment, finding decisions and concise briefs | Shared evidence/decision handling with execution-specific authority and follow-up adapters. |
| Protected-path check | Existing Git candidate adapter and guarded-change handling | Compare Git revisions, filter protected paths and apply authorized exceptions. |
| Follow-up and continuation | Candidate evidence, finding history, audit reuse and durable records | Connect these facilities to assisted assessments; no second recovery engine. |

## Skills, instructions and documentation

These deliverables are separate from runtime code capabilities:

- Astra coordination skill: start/recover an assisted job, submit candidates
  and act on compact outcomes.
- Sol module-work skill: optional module focus and ordinary cross-module work.
- Pi instruction adaptations: review/reconciliation wording for factual inputs
  and the authority supplied by each execution wrapper. Shared behavioral
  guidance stays shared; prompt-rendering code changes belong to runtime work.
- MCP setup, usage and evidence documentation, plus the recorded pilot results.

Update Pi instructions with the relevant runtime increments. Package the
coordinator/worker skills and complete user documentation in iteration 6.

## Delivery sequence

Implement these iterations in order, retaining working behavior and tests from
earlier increments. The first complete assessment is available after iteration
4; the ordinary multi-iteration workflow is trialled and qualified in iteration
6. Every increment is exposed through the same MCP service. A parallel CLI
command surface is optional, not a prerequisite or a separate delivery stage.

| Iteration | Deliverable | Completion evidence |
| --- | --- | --- |
| 1 | MCP service and assisted jobs in the existing plan system | Astra starts an assisted job and assessments reference its existing plan/job identity without starting the full harness lifecycle. |
| 2 | Reused audit integration, Git protection check and principle evidence | Results concern the submitted commit without duplicate audit or file-snapshot machinery. |
| 3 | Shared Pi review preparation, scheduling and coverage | Harness and assisted adapters use common review behavior with accurate execution-specific inputs. |
| 4 | Shared reconciliation/finding handling and assisted gate result | One assessment returns clear, action-required or incomplete; the existing harness uses the extracted behavior too. |
| 5 | Reused verification and continuation for assisted assessments | Repairs and cumulative assessment retain candidate identity and completed evidence. |
| 6 | Coordinator/worker skills, real MCP pilot and qualification | Astra coordinates native Sol work and receives condensed Pi assessment results through the installed MCP client. |

No iteration may return `clear` while required later functionality is still
absent. During construction, unfinished stages are explicit incomplete work.
Do not expose a temporary production bypass that skills later depend on.

## Boundaries shared by every iteration

- Inputs identify the base and candidate commits, iteration outcome and
  acceptance references. An assisted job supplies the project,
  captured plan and protection baseline; RA retrieves its relevant prior
  findings and decisions rather than asking Astra to resend them each time.
  Final assessment additionally names the original plan baseline. Neither a
  complete coordinator transcript nor a harness engineer submission is needed.
- Inspection uses the existing Git-backed candidate readers. Create scratch
  checkouts only for diagnostics that require them; ordinary review needs no
  second source-snapshot implementation. Audit uses the provider's candidate
  execution facilities and committed configuration. Candidate
  commits remain the native workflow's responsibility under its existing
  authorization; assessment does not commit edits.
- Assessment does not modify implementation source. Pi receives normal
  inspection tools and necessary diagnostics, with artifact-producing checks
  in suitable scratch locations. Do not withhold evidence needed to investigate
  or expose source-edit operations and unrestricted writes to the engineer's
  checkout. Source-read-only assessment is distinct from module write policing.
- Audit, protection and review outcomes remain separate. Semantic triage cannot
  waive mandatory failures, weaken acceptance or authorize protected edits.
  A `.principles.md` suffix does not make a proposed principle adopted.
- Detailed evidence stays in harness-owned records. Default output contains
  identities, concise progress, outcomes, remaining issues, gaps and evidence
  references, without reviewer transcripts or repeated settled observations.
- Active findings remain local. There is no automatic Beads creation,
  synchronization or dependency on tracker availability.

## Iteration 1: MCP and assisted executions in the existing plan system

Define the public request, job and result contracts and document them with
their owner. Introduce an assistance owner under the harness, exposed through
its public surface to a thin MCP adapter. Add `assisted` to the existing job
kinds, with a small record and event schema of its own. Reuse plan discovery,
job identity, storage, command admission and the generic ledger. Do not wrap
`step gate`, `step after` or `RunService.start`, fabricate work items, or load
architect prompts and implementation policy just to register an execution.

Implement the basic registration flow through MCP. The following tool names
and abbreviated arguments are illustrative, not existing commands:

```text
plan_start(plan_id, execution: "assisted", command_id) -> { plan_id, job_id }
iteration_assess(plan_id, job_id, base, candidate, brief, command_id) -> assessment_id
assessment_status(plan_id, job_id, assessment_id)
assessment_result(plan_id, job_id, assessment_id)
assessment_cancel(plan_id, job_id, assessment_id)
```

The server is configured for a project. Use the existing plan convention,
`plans/<plan-id>/plan.md`, and its discovery/read functions. `plan_start` reads
that plan, captures its exact contents and content identity, and creates an
assisted job using the existing job-ID allocator. It does not launch analysis,
decompose the plan or start workers. This replaces the earlier arbitrary
`plan_file` registration proposal; supporting other locations is not required.
This schedule under `docs/plans/` remains an authoring document; preparing an
executable plan at the conventional location is separate from starting a job.

Reuse the existing layout, adding assessment artifacts beneath the job:

```text
plans/<plan-id>/
  plan.md
  .harness/jobs/<job-id>/
    job.json                 # kind: assisted
    input/plan.md            # captured plan
    events.jsonl             # generic ledger, assisted event schema
    assessments/...
    check-findings/...
```

`job_id` is the execution ID; do not add a second ID or mapping table. The
assisted record retains schema/kind, plan/job identity, creation time, project
identity and captured-input references, including the protection baseline when
available. Assessment records belong to that job. Findings and decisions inherit
its association automatically. Validate project, plan, job kind and assessment
references; reject conflicting associations and cross-job repair links.

Starting the same plan deliberately again creates another job. Reconnecting or
restarting Astra uses the existing job. Extend shared execution discovery with
a small summary/read surface that distinguishes implementation, manual and
assisted jobs and exposes their appropriate detail references. Today's run list
depends on loaded implementation runs: shared directories alone do not provide
this query. Reuse the shared query through MCP rather than maintaining a second
catalog. No full assisted-run dashboard is required. Preserve captured content
if the plan changes; governing requirement changes follow existing authority.

Reuse command admission, content hashes and receipts for registration and
assessment retries. Persist and reload accepted commands so a lost response
returns the original job or assessment; reject the same command ID with changed
inputs. Creation has the existing initial-version semantics. The MCP adapter
can supply that detail without asking Astra to manage a new protocol.
No task tree, iteration-start ceremony, progress percentages, automatic
requirement extraction or plan state machine is required. The underlying
assessment facility remains callable with explicit inputs; it must not invent
another plan registry to support standalone use.

Document MCP startup/configuration and errors in this iteration and exercise
the installed client immediately. Use the existing executable entry point to
launch the server; globally installed packaging, HTTP hosting and a companion
daemon are not prerequisites. Keep detailed artifacts retrievable on demand.

Resolve commits and capture requirement document versions at admission.
Reject malformed requests clearly; record valid requests whose required
evidence is unavailable as incomplete. Distinguish input errors from findings
about the candidate.

Persist assessment transitions through the existing generic ledger and record
commit helpers, with the assisted event schema. Do not reuse the full
implementation `RunLog` schema or create a second persistence engine. Preserve
existing record versions; dispatch readers and recovery by job kind. The
implementation driver must never resume an assisted job as implementation work.

Respect the existing single-writer ownership and project lock. MCP must use
the current owner or acquire ownership itself, not become a competing writer
alongside the HTTP harness. Keep this within existing ownership mechanisms;
a new multi-process coordination service is outside scope.

Separate assessment execution from observation so it can outlive short MCP
requests. The server can own running assessments; surviving server termination
as running work is not required. Persist interruption for explicit continuation.
Cancellation affects the named assessment, not the containing job's other
records. Iteration 5 completes stage-level resumption. Status reads never start
work; an idle assisted job is not a continuously running implementation driver.

**Verify:** register through the actual MCP client, attach an assessment and
recover the same plan/job identity after reopening the store. Cover mixed job
kinds under one plan, separate assisted executions, idempotent/conflicting retry,
unknown IDs, cross-job links, quiet polling, cancellation and unavailable
results. Verify single-writer ownership and that implementation recovery does
not drive assisted jobs. Existing implementation/manual records remain readable
through their appropriate handlers. Reconnection launches no new work.

## Iteration 2: reuse audit and compare protected paths through Git

Use the existing configured-audit adapter and ramify-audit provider. It already
handles committed candidates, result provenance, completed-request reuse and
workspace execution. Supply assisted job/attempt ownership through its existing
ports. Where that binding is tied to full-run records, extract the common
ownership/receipt handling and connect both execution wrappers. Do not add a
parallel CLI execution path or reproduce provider selection, caching or cleanup.
Preserve existing harness policy while assistance uses default provider scope;
explicit obligations may justify an override with its reason recorded.
Distinguish failed audit from unavailable evidence and preserve the provider's
actual requested/reused candidate identities.

For protection, register a fixed Git baseline commit and the protected-path
rules before edits. Git stores the baseline file contents and identities.
Default assistance selection to `.principles.md` and `.spec.md`, honor stricter
project rules and allow explicit paths with applicable exclusions. Keep this
small selection policy in existing job records; candidate edits cannot silently
weaken it. No new filesystem walker, copied file snapshot, per-file hashing
store or rename detector is needed for this comparison.

Use the existing `CandidateSource.diffNameStatus` operation, which delegates to:

```text
git diff --name-status -z --no-renames BASELINE CANDIDATE --
```

Filter the changed paths using the retained protection rules. With renames
represented as deletion/addition, moving a sealed file out of the selection
still exposes its deletion. Include newly matching paths and type/mode changes;
read Git tree entries or blobs through existing adapters when detail is needed.
Treat additions according to the declared policy. Compare against the original
execution baseline, not just the previous iteration. This checks net candidate
changes, not temporary edits later reverted. It does not add edit interception.

Git answers what changed; RA applies protection policy and exact authorized
exceptions. Identify an exception by its accepted before/after evidence and
authority in existing decision records. A reason alone does not authorize an
edit. An exception does not reset the baseline or permit unrelated later edits.

Protected inputs must be represented in the baseline. Use existing Git status/
listing adapters to detect relevant staged, unstaged or untracked inputs at
registration; report a setup gap rather than silently omitting them, snapshotting
them through a new mechanism or committing them automatically. Unrelated dirty
files do not require a clean checkout. Standalone assessment can supply the same
baseline/rules directly. An uncommitted plan document still uses existing plan
capture; it is not a reason to duplicate Git storage for protected source.

Reuse document/principle discovery and design-guidance preparation for review
context. Source locations, scope and adoption status remain explicit. Git
comparison neither decides a principle's meaning nor adopts a proposal. Keep
material ambiguity for Pi assessment without new approval steps for reads.

**Verify:** both execution wrappers use the same audit invocation/provenance
behavior; completed provider evidence is reused correctly. Changing local HEAD
does not change the submitted candidate. Cover protected deletion, rename out
of selection, additions, type/mode changes, policy edits and exact exceptions;
a reverted net change is absent. Dirty protected inputs leave a setup gap while
unrelated dirty files do not. Ordinary cross-module edits are not seal failures.

## Iteration 3: Pi reviews and honest coverage

Reuse Pi execution and candidate preparation behind independent inputs. Supply
outcome, requirements, applicable principles, changes and tools for inspecting
source, consumers and tests. Omit engineering assignment module guards. Models
and effort are configuration; all semantic assessment uses Pi.

The existing review queue already accepts callbacks; wrap it directly where
that fits. Existing review requests/messages, however, assume a work item,
assignment and passing gate. Extract common factual briefing, packet preparation
and validation inputs from those assumptions. The harness wrapper translates
its actual assignments/gate evidence; the assisted wrapper supplies the brief
and actual audit state. Neither invents a passing gate. Both use the shared
candidate readers, snapshot tools and validation in this iteration.

Every substantive iteration gets independent code and scope review, normally
combined. Scope concerns intended outcomes, missing behavior and unjustified
unrelated work, not crossing module boundaries. Have Pi identify design review
needs from interface, ownership, dependency, protocol and principle-sensitive
changes. Include the question in the combined review or request a separate
perspective, retaining the reason. Planning and reviewing may share a session;
do not add a mandatory planner role merely to choose reviewers.

Record selected questions/material, evidence supplied, declared inspection,
optional observed reads, omissions and deliberately unselected work separately.
Requirements with no implementation still need an answer or a gap. Validate
structure and source identities without claiming delivered bytes prove
understanding.
Retain existing delivered-patch/read evidence validation. Add requirement-level
coverage and combined questions to the shared contract where necessary, keeping
legacy reports readable. Do not replace it with a parallel coverage recorder
or native-read interception. Output bounds must expose unfinished coverage or
allow continuation rather than silently truncate material concerns.

Audit and review may run concurrently on the same candidate; preserve audit
results for reconciliation even if a reviewer finished first. Configure
concurrency and bounded operational retries without Astra managing sessions.
Exhausted retries preserve gaps. A required review failure cannot become a
successful report with zero concerns.

**Verify:** scripted Pi covers combined review, design escalation, omitted
acceptance behavior, malformed output, missing coverage and valid zero-concern
review. Exercise both adapters against shared logic, including a pending/failed
audit that must not be described as passed. Inspect rendered prompts and tool
definitions. Reserve claims about actual Pi execution for native evidence and
the pilot.

## Iteration 4: investigation, reconciliation and gating

Adapt the existing Pi reconciliation flow rather than create a new investigation
engine. Extract evidence-packet construction, assessment validation and brief
formation where they depend on work-item completion or module-architect history.
Use factual source, findings, review outcomes and explicit authority inputs.
The harness wrapper retains its architect/correction behavior; the assisted
wrapper returns remaining actions to Astra. Both call the extracted behavior.
Existing fresh-session fallback is reusable; exact history is not a new need.

Complete the delegated sequence. Pi receives reports, check results and relevant
prior decisions, not every reviewer's conversation. Investigate uncertainty
where plausible harm and available evidence justify the effort. Reuse sessions
where useful; a separate investigation role for every observation is unnecessary.

Merge concerns about the same behavior or obligation, preserving material
disagreement. Filename matches and similar wording are insufficient. Retain
reports, but create active findings only for repair, investigation, verification
or unresolved decisions. Record supported dismissals and accepted minor
tradeoffs without creating backlog items.

Use the existing CheckFinding domain's run ownership for the assisted job and
its record materialization helpers for reports, decisions and relations. Carry
finding events in the assisted job's ledger, retaining assessment/candidate
evidence references. Preserve findings across that job's iterations without
creating work-item owners or a parallel finding store. Adapt trusted evidence
and actor bindings where required; reuse does not make Pi assertions trusted
verification evidence by themselves.
The current finding transaction helper accepts `RunLog`. Extract the narrow
transaction/state interface it actually needs and connect both log adapters.
Keep decision validation, replay, atomic commit and materialization shared.
Do not copy the transition helper into assistance or introduce a second issue
lifecycle. Promote only actionable observations; retain other notes in reports.

Return consolidated repair briefs describing failing behavior, consequence,
evidence, relevant requirement and needed verification. For remaining decisions,
explain alternatives and why evidence or authority is insufficient. Worthwhile
optional deferred work remains a handoff recommendation, never an automatic
tracker write or a disguised fix.

Assemble the result deterministically around validated Pi judgments:

| Result | Required meaning |
| --- | --- |
| `clear` | Required checks passed, required assessment completed and no material issue requires coordinator action under the declared policy. |
| `action-required` | A repair need is established, or a material decision/protected commitment conflict remains. |
| `incomplete` | Required assessment evidence could not be obtained or validated. |

When defects and required gaps coexist, use `incomplete` and include both.
A declared best-effort gap can coexist with `clear` but remains visible. A
required failing check always prevents `clear`, regardless of Pi's prose.
The result is not a proof that all defects are absent.

**Verify:** differently worded reports of one defect consolidate; distinct
defects in one file survive; an investigated false positive is dismissed with
evidence; an accepted tradeoff creates no active task. Reject attempted waiver
of a failed mandatory check. Cover material disagreement and protected-change
conflicts. A complete request reaches its result without Astra involvement.
Exercise equivalent evidence through both wrappers to verify shared disposition
rules, including refusal to waive required failures. Validate each wrapper's
actual authority separately; sharing code does not make their authorities equal.

## Iteration 5: repairs, cumulative review and continuation

Accept a new candidate linked to a prior assessment. Preserve original evidence
and decisions; never relabel old inspection as review of new source. Pi selects
focused follow-up including dependencies whose changes invalidate reasoning
about otherwise unchanged files. Carry decisions forward only while applicable.

Close factual failures with applicable successful check evidence and semantic
concerns with assessment of repaired behavior. A worker's “fixed” claim is
insufficient. Investigate repeated concerns before returning the same repair
request. Operational limits may stop investigation with an explicit unresolved
outcome; no round count turns outstanding work into success.

Add final cumulative acceptance/integration assessment against the original
plan baseline and current candidate. Earlier local reviews inform it but do
not substitute for verifying the combined result. Use the same facility.

Wire assisted continuation into existing persistence, provider reuse and Pi
session operations. If needed, extract stage-completion/recovery behavior behind
the same two-wrapper pattern. Avoid a new recovery framework or new cache.
Retain finished stages, detect interrupted ownership
and resume unfinished work with fresh Pi sessions and durable decisions. Exact
conversation replay is unnecessary. Cancelled assessments stay cancelled; resume/retry
is explicit, never a consequence of polling. Stop owned processes and release
scratch resources without touching unrelated work. Do not claim exactly-once
external execution after crashes unless supported; record uncertain attempts
and prevent duplicate accepted stage results.

**Verify:** repair closes a genuine finding; dependency change triggers relevant
reassessment; valid settled decisions do not reappear as new issues. Final
review catches a requirement omitted between iterations. Exercise interruption
after a completed stage, simultaneous observers, resume and cancellation at
the appropriate test boundary.

## Iteration 6: non-runtime deliverables, real MCP pilot and qualification

Author concise coordinator and module-work skills using skill authoring
conventions. The coordinator skill uses `plans/<plan-id>/plan.md`, one assisted
`plan_start` call before edits, reuse of the returned plan/job IDs, candidate
preparation, brief construction,
assessment submission, quiet observation, compact result handling and cumulative
acceptance. On a fresh session it retrieves the existing execution rather than
starting another. RA attaches findings automatically. Native Sol performs
repairs. The skill does not ask Astra to schedule reviewers or reconcile
their output.

Make module specialization an efficiency choice: favor it when ownership is
coherent, interfaces reasonably stable and concentrated context likely to
reduce work. Prefer broader assignments when tightly coupled changes make
coordination more expensive. These are heuristics, not a numeric admission
score. Workers may cross module boundaries, coordinate overlapping writers
normally, and report changes, verification and remaining integration obligations.

Provide principles and seal information before edits through baseline inspection
and existing generated views. A new module-context aggregation command is not
required. Distinguish protected commitments from module boundaries and preserve
project authority without inventing approval steps.

Run a bounded real implementation task through Astra, native Sol and MCP
assessment, including cross-module integration where the task calls for it.
Observe repairs and resolved findings if they naturally arise; scripted cases
cover paths absent from the live task. Do not inject artificial defects into
real work to manufacture success.

Retain candidate identities, actual Pi/tool evidence, useful findings, gaps,
review/repair time, repeated concerns, coordinator interactions and text returned
to Astra. Record available context/compaction observations without requiring
interception of native reads. Measure Pi and total elapsed cost as well as
coordinator burden. Compare ordinary independent review where feasible; one
task cannot establish general performance improvement. Fix demonstrated workflow
defects before declaring the workflow qualified.

**Verify:** a real candidate receives an honest assessment, Astra handles only
remaining actions, and cumulative acceptance is exercised. Record unavailable
capabilities and unobserved behavior. Writing this plan does not launch a pilot.

Complete MCP setup, configuration, evidence and limitation documentation.
Qualify final behavior through the installed client and actual protocol in
addition to scripted tests: reconnect without duplicate Pi sessions, retrieve
details explicitly and cancel only the named job. A transport failure does not
erase a persisted assessment outcome. Run affected current-harness regressions
and complete project qualification. Any optional CLI wrapper must call the same
service and records; it adds no workflow or separate acceptance policy.

## Reuse and compatibility

| Existing facility | Intended use and boundary |
| --- | --- |
| [Plan discovery](../../../subs/harness/src/plans/discover.ts) and [job records](../../../subs/harness/src/jobs/records.ts) | Reuse plan locations, identities, job IDs and directories. Add `assisted` to the job kinds and extend common execution discovery; no second registry. |
| [Command admission](../../../subs/harness/src/jobs/commands.ts), [record commits](../../../subs/harness/src/jobs/commit.ts) and [ledger](../../../subs/harness/subs/ledger/) | Reuse retry receipts and durable transitions with a small assisted schema, without the full implementation log or driver. |
| [State directory](../../../subs/harness/src/store/state-directory.ts) and [project lock](../../../subs/harness/src/store/lock.ts) | Preserve generated-state isolation and single-writer ownership across transports. |
| [Pi adapter](../../../subs/harness/subs/agent/) | Reuse session/tool execution behind small review inputs; no native Codex engineering adapter. |
| [Review preparation](../../../subs/harness/subs/reviews/src/preparation.ts) and [scheduler](../../../subs/harness/src/reviews/scheduler.ts) | Wrap the queue; extract shared factual preparation/validation with harness and assisted input adapters. Preserve existing inspection evidence. |
| [Git candidate adapter](../../../subs/harness/subs/evidence/src/git.ts) | Reuse commit/tree/blob reads and `diffNameStatus`. Protection adds path selection and authorization interpretation, not another snapshot/hash engine. |
| [Document discovery](../../../subs/harness/subs/plan-evidence/src/discovery.ts) | Reuse captured plan and principle evidence for context. Do not turn it into a second protected-source inventory. |
| [Audit execution](../../../subs/harness/subs/audit/src/check-execution.ts) | Reuse invocation, receipts, provider reuse and workspace lifecycle. Extract coupled ownership bindings for both callers where needed; no parallel CLI runner. |
| [Reconciliation](../../../subs/harness/src/reviews/reconciliation.ts) and [message preparation](../../../subs/harness/src/reviews/reconciliation-message.ts) | Extract shared factual packets, judgment validation and briefs; wrappers supply their own authority and next-action handling. |
| [CheckFinding domain](../../../subs/harness/subs/check-findings/), [records](../../../subs/harness/src/check-findings/records.ts) and [transactions](../../../subs/harness/src/check-findings/transition.ts) | Reuse run-owned findings; abstract the transaction helper's `RunLog` dependency and migrate both callers to one implementation. |
| [Step gate](../../../subs/harness/src/steps/gate.ts) and [after](../../../subs/harness/src/steps/after.ts) | Remain current harness operations, not standalone assistance entry points. |

For each facility, prefer its existing public interface when a thin wrapper is
sufficient. Otherwise extract only the common behavior needed by the two real
callers, leaving execution policy in the wrappers. Define the smallest factual
inputs and effects required; do not replace missing harness records with fake
assignments or add optional fields throughout full-run contracts.

Each extraction includes migration of the affected harness path and the assisted
path to that same implementation, plus regression checks for both. An extracted
copy used only by assistance while the harness keeps the original logic is not
accepted. Preserve existing persisted records and intentional policy differences;
record those differences and test their translation at the adapters.

This applies to shared review, reconciliation, finding and audit behavior as
well as plans/jobs/persistence. It does not require migrating the full harness
driver to the assisted orchestration service. No general execution-plugin
framework, broad anticipatory refactor or renaming of existing kinds is needed.

## Acceptance examples

The iteration checks define detailed acceptance. These examples exercise the
new boundary from a client's perspective.

```gherkin
Feature: Delegate candidate assessment without delegating implementation

  Scenario: One registration links subsequent assessments and findings
    Given Astra started an assisted job for an existing plan through MCP
    When it submits two assessments using the returned plan and job IDs
    Then their findings and decisions belong to that job automatically
    And no task decomposition or iteration-start call is required

  Scenario: One plan supports different execution kinds
    Given a plan has an implementation job and a manual job
    When Astra starts an assisted job for the same plan
    Then shared execution discovery identifies all three jobs and their kinds
    And their records remain under the same plan's job directory
    And implementation recovery does not drive the assisted job

  Scenario: Retrying registration does not create another execution
    Given RA persisted a registration but Astra did not receive its response
    When Astra retries the same registration with the same command ID
    Then RA returns the original plan and job IDs
    And a deliberate new execution uses a new command ID

  Scenario: Different executions of one plan keep their findings separate
    Given the same plan document has two registered executions
    When an assessment creates a finding for the first execution
    Then the finding belongs only to the first execution
    And a repair assessment in the second execution cannot claim that link

  Scenario: A module-focused worker completes a cross-module change
    Given a worker focused on a consumer module
    And its task requires a compatible change in a provider module
    When it changes both modules and submits the resulting candidate
    Then assessment requires no module scope expansion
    And reviews whether the integrated behavior satisfies the task

  Scenario: Assessment remains tied to its submitted source
    Given assessment was admitted for candidate A
    When the implementation checkout advances to candidate B
    Then audit and review still concern candidate A
    And their result does not establish acceptance of candidate B

  Scenario: Reconciliation reduces coordinator work
    Given two reviewers reported the same confirmed defect
    And another observation was disproved through investigation
    When Pi reconciles the reports
    Then the compact result contains one evidence-backed repair brief
    And the disproved observation remains inspectable without becoming a task

  Scenario: A required review is unavailable
    Given the audit passed for the candidate
    And a required review could not produce a valid report
    When the assessment produces its result
    Then the result is incomplete
    And it identifies the missing review and recovery action

  Scenario: A protected requirement cannot be weakened to pass
    Given a required check failed
    And the candidate weakens a protected requirement without authority
    When reconciliation proposes accepting that change
    Then the gate remains not clear
    And the result retains both the check failure and protection conflict

  Scenario: A protected edit remains visible across later iterations
    Given a sealed file differs from the execution's baseline commit
    And that change has no authorized exception
    When a later candidate changes only unrelated implementation files
    Then the Git comparison still reports the protected change
    And assessment cannot clear the protection conflict

  Scenario: Renaming cannot hide a protected deletion
    Given the protection rules select a file at the baseline commit
    When the candidate moves it to a path outside that selection
    Then the Git comparison exposes the original path's deletion
    And the protection check assesses that deletion under the retained rules

  Scenario: Both execution kinds preserve shared verification rules
    Given a harness execution and an assisted execution have a required failing check
    When each adapter submits a proposed waiver to shared finding validation
    Then both proposals are rejected
    And each execution retains its own evidence and authority records

  Scenario: A repair needs new verification
    Given an earlier candidate has an active finding
    When a worker reports that a new candidate fixes it
    Then assessment verifies the applicable repaired behavior before closure
    And retains the old candidate's reports under their original identity

  Scenario: Reconnection observes existing work
    Given an assessment is running
    When the client disconnects and later requests its status
    Then the client observes the same assessment
    And status retrieval launches no additional audit or review
```

## Validation and completion

Follow [Testing ramify-agent](../../testing.spec.md). Ordinary tests use real
domain logic and scripted Git, audit, process and Pi answers, without launching
external processes. Tests belong in the owner's `src/tests/`. Register exact
native witnesses in [test-boundaries.json](../../../src/tests/test-boundaries.json)
only for claims requiring real Git, installed CLIs, Pi or process behavior.
Keep live-provider evidence distinct from deterministic test success.
Test extracted common behavior once at its owning boundary, then exercise each
wrapper's factual input translation, authority and observable outcomes. Include
affected legacy-record readers and existing harness call paths. Simulate Git
responses in ordinary protection tests; use exact native witnesses only for
Git behavior not already established by existing boundary coverage.

For each implementation iteration, run focused affected tests, type checking
and `npm run check:self`. Qualify authorized clean committed candidates with
`node_modules/.bin/ramify-audit audit --cwd . --json` in default mode. Explain
a concrete reason before scope overrides; quick tests do not replace configured
audit coverage. This schedule does not authorize commits or pushes.

Completion requires basic plan registration and linking through MCP,
reuse of the existing plan/job system, coordination skills, gate behavior,
honest recovery/coverage, compatibility of affected current-harness paths and
recorded pilot/qualification evidence. Report limitations and costs without
asserting unmeasured speed or context improvements. Missing required evidence
remains outstanding work.
Every extracted facility must be used by both execution wrappers. The completion
report separates runtime changes from skills/instructions/documentation and
identifies reused interfaces, shared extractions and genuinely new behavior.

## Optional follow-up after the core workflow

- **CLI convenience commands:** add wrappers over the MCP service's underlying
  operations if scripting needs them. They are not required for the initial
  assisted workflow or its qualification.
- **Ramify correctness hooks:** qualify installed host capabilities and timing
  before adding an opt-in adapter. Run structural diagnostics, not full audit
  after every edit. Temporary invalid states stay repairable; unavailable checks
  and timeouts remain visible. Hooks never police module focus, roll back source
  or become prerequisites for the post-iteration gate.
- **Module-context assembly:** add a convenience CLI/MCP operation if repeated
  gathering costs justify it. Use supported toolkit CLI and generated views.
- **Cross-module edit measurements:** derive from existing evidence if cheap;
  do not add interception or worker-ownership protocols just for this metric.
- **Selected deferred-issue promotion:** consider an authorized target tracker
  adapter only when useful deferred work exists. Keep Beads optional, preserve
  tracker policy and never promote every observation.

Automatic source repair inside assessment, a new full-plan orchestrator,
task/progress management, automatic acceptance-inventory extraction, full
harness migration, a separate repository, universal agent adapters and new web
projections are outside this implementation plan.
