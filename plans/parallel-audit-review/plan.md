# Independent audit and semantic review

**Status:** proposed for native assisted implementation; execution has not started.
**Source baseline:** `a5bed437ff5bbf1de06666907b696df086b4ebf7`.
**Execution:** Astra coordinates native Sol engineering; ramify-agent assesses
committed iterations. This plan changes assisted and automated execution alike.

## Outcome

Separate preparing an immutable candidate from accepting it. Run its configured
audit and scheduled semantic review independently and concurrently. Collect both
results before deciding the candidate's repairs or acceptance. An audit failure
must not suppress, cancel or erase semantic review.

Keep audit verdicts deterministic. Use the existing reconciliation stage for
semantic concerns and audit evidence that needs judgment, including whether an
unstable test belongs to this plan. Reuse the existing providers, review scheduler,
finding domain and persistence mechanisms. Do not introduce a universal assessment
engine, another agent stage, a new finding store or a second audit interpreter.

The user explicitly replaces the audit-first, failed-audit-skips-review policy in
[the assisted service specification](../../docs/architecture/agent-assistance/service.spec.md),
[the assistance guide](../../docs/agent-assistance.md), and R8 of the earlier
[review/fix-cycle plan](../review-fix-cycle/plan.md). Preserve that plan's other
outcomes, including useful review scope and deliberate omission of repeated broad
review after selected repairs. Historical plans and results retain their original
meaning; update current behavioral contracts during implementation.

## Requirements and acceptance

### R1. One candidate, independent checks

After candidate preparation, audit and each scheduled semantic review can start
without waiting for the other's result. They name the same immutable source.
Finish scenario rendering and other source preparation before either starts.
Keep the original plan baseline distinct from the iteration diff base.

Apply this to assisted iteration and final assessments, automated iteration
reviews, and automated final semantic qualification. Existing code/scope/design
review selection and capacity limits remain meaningful; concurrency does not
require every review to start simultaneously. A shared scheduler or writer lock
must not accidentally retain an audit-before-review dependency.

### R2. Review is independent of audit

Review asks whether the candidate implements the intended behavior, scope,
integration and design, including source-level test quality. Its task, initial
context and scheduling do not depend on the current audit verdict, diagnostics or
instability. Remove assertions that the candidate already passed its gate and
instructions to retrieve the current audit as part of semantic review. Do not
substitute a pending audit field or manufacture an uncertainty because the reviewer
was not supplied execution results. The harness separately evaluates configured
check obligations.

Earlier semantic findings and decisions remain useful context. Build that context
from semantic records rather than injecting aggregate audit failures as review
obligations. Preserve ordinary inspection tools and historical evidence; this is
task separation, not a new access-control mechanism.

Choose broad, focused or deliberately unrun review from semantic history and the
coordinator/architect's request. Preserve purposeful extra reviews. New audit
instability can require reconciliation without forcing another broad review.

### R3. Combine outcomes without changing their authority

Persist each result independently. A failed audit with a clean review produces
actionable audit diagnostics. A failed audit with semantic concerns retains both.
An unavailable audit remains an evidence gap even if review succeeds. An unavailable
review does not erase audit evidence; existing explicit advisory-continuation
authority remains available and cannot bypass failed checks or substantive gaps.

Required check failures and their matching passing witnesses remain governed by
the existing deterministic finding rules. An LLM cannot declare a failed audit
passed, dismiss its required obligation, or infer a repair from an arbitrary green
rerun. Audit failure alone requires no reconciliation invocation. When semantic
reconciliation is needed, supply a concise factual audit summary and a usable
evidence reference; retrieve relevant details on demand.

An assessment or final completion cannot be clear while a required check is
unfinished, failed or unavailable. Protection authority, requirement satisfaction
and existing finding dispositions retain their separate meanings. Review findings
from a failed candidate remain source-bound evidence, never proof that a later
candidate has been reviewed or that an earlier accepted source contained them.

### R4. Preserve test-reliability obligations after joining results

Use provider-established current or retained instability, including native retry
evidence. The audit adapter supplies that evidence; it does not decide test origin.
Move its semantic interpretation from reviewer prompts to existing reconciliation.
Trigger reconciliation for such evidence even when review is clean or deliberately
unrun, and even when audit passes with warnings.

Prefer reporting an existing assessment-type finding that states the observed
instability and the unresolved question of plan responsibility. Unknown attribution
is not an established new-test defect or an automatic repair assignment. Existing
report/disposition contracts should suffice unless implementation identifies a
concrete missing distinction. Repeated or reused observations must not create
duplicate obligations merely because both execution paths use them.

Reconciliation determines origin per test against the original execution baseline,
including additions to existing files and earlier plan iterations. Moves, renames
and edits alone do not make an existing test new.

- An established existing flaky test creates no repair investigation, reruns or
  assignment. Preserve its evidence and provider verdict. A strict failure policy
  remains blocking without authorizing repair of the existing test or a waiver.
- An unstable test added by this plan requires repair or replacement with reliable
  verification preserving intended coverage. Record the substantive obligation
  through existing requirement/finding facilities so ordinary discretionary
  disposition cannot silently remove it.
- Unknown origin remains qualified uncertainty until relevant inspection resolves
  it. Neither assume a new test nor silently clear the question.
- Closing an added-test repair requires semantic verification of reliable coverage;
  a passing audit alone is insufficient. Weakening assertions, skipping cases,
  increasing retries or rerunning until green is not the repair.

### R5. Automated scheduling starts at candidate creation

In automated iterations, request reviews when the prepared commit exists, before
its audit verdict. Use the existing review queue and candidate identities. Remove
the passing-gate prerequisite from request preparation, admission, prompts and
consumers that currently assume it. Include ordinary and capability-task engineer
paths and their restart behavior.

Keep work-item reconciliation at its existing useful completion boundary. On an
audit failure, collect that candidate's review result before producing the combined
repair handback. Do not add a mandatory per-iteration reconciliation loop solely
to restate failed checks. Audit evidence needing judgment follows R4 through the
existing responsible reconciliation machinery. Its source must name the candidate
being assessed, not silently fall back to the last accepted commit.

An automated iteration may retain existing downstream scheduling once its gate
passes, but outstanding reviews remain pending obligations for the relevant
completion boundary. Creating a commit or requesting a review does not advance the
accepted source or discharge provider/consumer obligations.

### R6. Automated final qualification uses the same separation

Prepare and retain the final candidate before its read-only semantic assessment
and final configured audit. Run those checks concurrently on that source, then
use their results for existing final decisions and repair selection. Preserve
whole-plan fixed/nonfunctional requirements, integration, required scenario
coverage and final audit scope.

Do not parallelize the entire existing semantic assessment/repair loop with an
audit: that loop can change source. Separate its read-only assessment of one
candidate from investigation that mutates source, repair execution and completion.
A source-changing repair prepares a new candidate and receives applicable checks;
old evidence keeps its original provenance. Final publication and approval
readiness consume the joined results, not whichever finishes first.

### R7. Retention, cancellation and timing remain simple

Reuse existing stage/operation records and serialized writers. Retain the exact
candidate as soon as checks can be scheduled, using existing commit evidence or
the smallest necessary extension. An interruption after either result is retained
must allow ordinary restart to reuse it and finish missing work. Preserve readable
historical records and accepted results without inventing past parallel execution.

An ordinary failed check is a result, not cancellation of its sibling. Settle or
retain both operations before ending their orchestration scope. Explicit stop
settles active work and prevents late writes through existing authority rules.
Do not add elapsed-time cancellation, recovery protocols or a new state machine
merely to coordinate two operations. Preserve existing refusal/reassessment when
a finding revision or candidate changes.

Record enough stage start/completion information to distinguish overlap and
elapsed duration. Reuse existing invocation timing where appropriate; extend
records only where needed. Consumers must not derive parallel stage durations by
subtracting consecutive completion timestamps. Historical missing times remain
unknown; provider execution time and evidence-retrieval time remain distinct.

## Module impact and reuse

| Owner | Existing behavior and intended change |
| --- | --- |
| `harness/assistance` | `assessment.ts`, `service.ts`, `findings.ts`, `approval.ts` and Pi bindings already own the complete assisted pipeline. Start independent operations, retain results, join outcomes and adapt repair-review selection and readiness together. |
| `harness/reviews` | Shared review preparation, candidate tools, queue, concern binding and reconciliation validation. Remove audit-dependent review wording and inputs; retain general source-level test-quality guidance. Keep audit-specific reliability guidance with reconciliation. |
| `harness/audit` | `createConfiguredAudit` and `configuredAuditInstability` supply provider evidence. Reuse them; any needed structured projection stays here. Do not parse provider internals in workflow consumers or build another verdict. |
| `harness/check-findings` and harness finding composition | Reuse factual witnesses, semantic reports, dispositions and replay. Shared observation-to-finding composition belongs with existing harness composition, while the finding domain remains pure. Confirm how required reliability obligations survive coordinator decisions. |
| `harness/autonomous/acceptance` | `committing-gate.ts`, `after-handling.ts`, review admission/settlement and `acceptance.ts` own the candidate, checks, reconciliation and final qualification. Separate candidate preparation from qualification and final completion here. |
| `harness/autonomous/work-coordination` and autonomous composition | `coordination.ts` currently requests reviews only after a passed gate and manages failed-gate handbacks. Adapt these consumers and service wiring with acceptance; preserve capability and ordinary iteration semantics. |
| `harness/nonfunctional`, projections and web consumers | Adapt final assessment inputs and any affected timing/status projections through their owning contracts. UI reads actual stage states; it does not reconstruct a required serial order. |

The relevant architect records and module declarations were inspected. Refreshed
ordinary API views for assistance and autonomous acceptance both include
`createConfiguredAudit`, `configuredAuditInstability`, reconciliation preparation
and validation, and `decideCheckFindingChange`; each also receives its applicable
review preparation. The inspected view revision is
`rev/1:2bd84340-c78c-4ef2-8880-5e3eda388afb:1`. Both views report coverage limits
and truncated entries; these positive matches establish availability, while
absence elsewhere would not establish unavailability. Refresh the views in the
execution checkout. Existing shared facilities are exposed through harness.
New helpers, if needed,
must be exposed by their actual owner and re-exposed through the appropriate
ancestor; include declarations and consumer integration in the same iteration.
No new module or cross-workflow orchestration interface is required by this plan.

Important source boundaries are
[the assisted assessor](../../subs/harness/subs/assistance/src/assessment.ts),
[automated candidate commit and audit](../../subs/harness/subs/autonomous/subs/acceptance/src/committing-gate.ts),
[automated review requests](../../subs/harness/subs/autonomous/subs/acceptance/src/after-handling.ts),
[engineer completion](../../subs/harness/subs/autonomous/subs/work-coordination/src/coordination.ts),
[final qualification and reconciliation](../../subs/harness/subs/autonomous/subs/acceptance/src/acceptance.ts),
and [shared reliability guidance](../../subs/harness/subs/reviews/src/test-reliability.ts).

## Proposed iterations

### 1. Independent assisted checks and shared finding semantics

**Focus:** assistance with reviews, audit evidence projection and finding composition.
Keep these together because review independence and reliability interpretation
must change together to avoid losing warnings that currently reach the reviewer.

Deliver R1–R4 and R7 for assisted iteration and final assessments. Establish the
shared review/reconciliation inputs and reliability finding behavior that automated
execution will reuse. Adapt assisted API outcomes, finalization, timing and current
documentation in the same iteration. Shared changes must leave automated consumers
working, including their current reliability interpretation until its replacement
is integrated; finish their scheduling and migrate that interpretation in the next
iteration.

**Acceptance:** controlled pending audit does not prevent review from starting,
and pending review does not prevent audit. Both completion orders retain equivalent
outcomes. Failed/unavailable audit preserves a successful review and vice versa.
Audit failure alone creates no reconciliation call. Instability with a clean or
unrun review still receives origin judgment, preserving all R4 outcomes. A required
new-test repair cannot disappear through a discretionary coordinator choice.

Verify through the real assisted service/assessor composition with scripted
providers, including retained-result restart, cancellation, purposeful review,
correction skips and protection finalization. Commit and obtain RA assessment.

### 2. Automated iteration checks begin with the committed candidate

**Dependency:** iteration 1's shared semantics. **Focus:** autonomous acceptance
with work-coordination and service composition. These owners jointly define the
commit, review admission and repair handback; splitting them would leave the
essential behavior unverified.

Deliver R1–R5 and R7 for automated iterations, including capability-task engineers.
Schedule existing reviews from retained candidate creation, preserve gate authority,
and join failed-check diagnostics with that candidate's semantic findings. Connect
R4 to existing reconciliation even when no reviewer concern triggers it. Keep
existing work-item completion and ordinary repair policy rather than adding a
second acceptance loop.

**Acceptance:** review starts while candidate audit is pending through the actual
automated scheduler. A failed audit neither suppresses review nor advances the
accepted source. The repair handback includes both results. A restarted commit
with an unfinished check reuses its candidate and retained results without duplicate
requests or findings. Code/scope/design selection, correction skips, capability
handback and later work-item reconciliation remain coherent.

Verify the composed automated workflow with scripted Git, audit and agent answers,
including failure before the first accepted iteration and failure after an earlier
accepted source. Update automated contracts and review-policy documentation.
Commit and obtain RA assessment.

### 3. Automated final checks and cumulative qualification

**Dependency:** iterations 1–2. **Focus:** autonomous acceptance and nonfunctional
assessment, with final publication and projections. Reuse the automated candidate
boundary already established rather than creating a separate final-check mechanism.

Deliver R6 and complete R7 across both paths. Separate final candidate preparation,
its read-only assessment, audit, decisions and source-changing repair. Retain final
scope, fixed/nonfunctional requirements, deviations and explicit authority. Complete
public status/timing consumers and cumulative documentation.

**Acceptance:** the final semantic assessment and audit overlap on the exact prepared
candidate. Either can finish first; neither alone publishes completion. A final
repair produces a distinct candidate, and stale evidence cannot accept it. Restart
after either final result retains that result and finishes the remaining obligation.
Final flakiness warnings and explicit protection/deviation decisions retain their
meaning in assisted and automated execution.

Verify cumulative cases below, run required project checks, commit and obtain RA
assessment. Finish with a cumulative final assessment against this original plan.

The coordinator may adjust these boundaries when implementation supplies better
evidence. Module focus permits necessary cross-module edits. No preliminary agent
investigation or separate infrastructure project is required. Sequential delivery
is preferred because the later iterations reuse the shared contracts and candidate
boundary established earlier.

## Verification and completion

Use [Testing ramify-agent](../../docs/testing.spec.md). Ordinary tests exercise
real workflow composition with scripted Git, audit, command and agent answers;
prove concurrency with controlled promises and observable ordering, not sleeps,
speed thresholds or live provider calls. Keep cases small and representative.

The combined evidence must cover:

1. Both completion orders and audit/review pass, failure and unavailability;
   independence of prompts and scheduling; honest deliberate skips.
2. Failed-candidate review preservation, combined repair handbacks and required
   checks that cannot be cleared by semantic judgment.
3. Warning, native-retry and retained instability; existing, new and unknown test
   origin; earlier-iteration additions and additions within existing files;
   required repair verification after a later passing audit.
4. Assisted and automated final candidate identity, no source mutation during
   checks, repairs on a new candidate and no premature completion.
5. Restart with either result retained, candidate committed before either result,
   explicit cancellation and existing stale-finding refusal behavior.
6. Actual service/scheduler composition, capability and ordinary automated work,
   protection/approval behavior and status/timing projections.

Use exact reviewed test-boundary registrations only if a claim truly needs a native
process. Do not introduce a live paid trial or benchmark as a prerequisite for this
control-flow change. Every implementation iteration includes focused checks and
`npm run check:self`. From a clean committed implementation candidate, qualify
with `node_modules/.bin/ramify-audit audit --cwd . --json` in default mode; retain
all configured project coverage and the auditor's scope decision. Do not weaken
tests or audit configuration to accommodate concurrency.

Follow [repository instructions](../../AGENTS.md),
[harness principles](../../docs/harness.principles.md),
[prompt principles](../../docs/prompt-optimization.principles.md) and
[recovery principles](../../docs/harness-recovery.principles.md), preserving their
stated adoption status. The harness remains the durable-state writer; web and
projection consumers receive its contracts. Existing exact protection authority
and immutable plan requirements remain effective.

## Local design questions

Resolve these during the owning implementation iteration, without adding new
requirements or approval stages:

- Which existing semantic requirement/finding representation best records unknown
  test origin and an established required reliability repair? Prefer the current
  report and disposition contracts; extend only the concrete missing distinction.
- Which existing commit receipt can establish automated candidate availability
  before the gate completes? Reuse it where sufficient; retain only the additional
  identity needed to resume ordinary work and schedule reviews once.
- Which parts of automated final assessment currently mutate source or choose
  repairs? Keep those outside concurrent read-only checks and preserve their
  original decision authority.

These questions affect local implementation, not the required independent-check
behavior or the proposed module ownership.
