# Adopt the proven review and fix cycle

**Status:** proposed for native assisted implementation; execution has not started.
**Inspected source baseline:** `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`.
**Execution:** Astra coordinates native Sol engineering; ramify-agent assesses
committed iterations. This document does not resume the stopped execution.

## Outcome and scope

Make both automated and assisted review follow the practical baseline established
in cucumber-viz: relevant context, ordinary inspection, one review pass, useful
finding decisions, selected repairs and relevant verification. A reviewer finding
another possible improvement is not, by itself, a reason to continue fixing.

Implement the nine baseline proposals in the
[review/fix-cycle analysis](../../docs/analysis/2026-10-19-review-fix-cycle.md).
That analysis separates source facts, retained observations, user experience and
author judgments. Cucumber-viz's months of successful use, as reported by the
user, establish the starting point. The analysis is supporting context, not a
requirement to inspect every source or historical artifact it references.

Start from what an ordinary agent would do. Adopt the established workflow first;
additional restrictions and checks must demonstrate their value through actual
use. Do not preemptively compensate for hypothetical weaknesses in that workflow.
If experience later suggests an improvement, try it separately and evaluate it.

The optional experiments in the analysis are outside this plan: partial inline
patch delivery, an additional assisted repair-delta comparison, new review-session
reuse behavior, splitting large reviews, and improved issue matching. In
particular, do not build automated review partitioning, persistent review cursors,
semantic matchers, dependency proof graphs, per-requirement evidence caches or a
new telemetry system. Existing facilities may continue to serve their callers.

## Required behavior and complexity

The estimates describe implementation effort and the expected net complexity
afterward, not elapsed time. They overlap and should not be added together.

| ID | Required result | Change effort | Added or removed complexity |
| --- | --- | --- | --- |
| R1 | Assisted reviewers initially receive the current goal, relevant acceptance text and guidance, changes and earlier decisions. Remove eager transitive-reference qualifications and repeated whole-plan delivery. Original material remains available on demand; final review receives the plan-level context it needs. | Low–medium | Decrease: simplify preparation using existing briefs, references and evidence access. No new selection service. |
| R2 | Automated design preparation uses guidance relevant to the task and affected owners, selected through ordinary coordinator/architect judgment. A principles filename alone does not make a document an initial review obligation. | Medium | Decrease: replace global inclusion with existing task/module context and supplied references. No scoring agent. |
| R3 | Reviewers have ordinary candidate-inspection tools, including shell access for large or compressed evidence, and instructions to review without editing source. Tools inspect the intended candidate. | Medium | Small initial addition if candidate checkout acquisition is needed; consolidate existing equipment instead of maintaining two mandatory inspection paths. |
| R4 | Inspection is selected by the reviewer. Missing or unread files, including supplemental artifacts, do not automatically become blocking coverage gaps. Report conclusions and meaningful limitations without an exhaustive inspected/missing inventory. | Medium | Substantial decrease: remove coverage enforcement and its completion dependencies. No substitute coverage schema. |
| R5 | Default to one iteration code/scope review pass. Applying selected repairs does not automatically launch the same broad review again. Additional review is available for a concrete user or coordinator reason, such as substantial new behavior introduced by a repair. | Medium | Decrease: change scheduling and completion policy using existing review/iteration identities. No new budget store or scheduler. |
| R6 | The existing coordinator/architect can choose fix now, leave or defer for discretionary findings, including in assisted work. A short rationale suffices; ordinary decisions do not require user approval or a new adjudicator. | Medium–high | Small policy/API addition to expose existing dispositions; overall decrease in mandatory workflow. No new finding database or materiality-proof schema. |
| R7 | Review prompts include a bounded summary of relevant existing findings, dispositions and rationales. Ask reviewers to avoid repeating unchanged issues and explain meaningful changed circumstances when raising one again. | Low | Small formatter/projection over existing records. No new durable ledger, automatic matching or reopening mechanism. |
| R8 | A concrete failed configured check returns its diagnostic evidence directly to the engineer/coordinator for repair. It does not automatically trigger broad semantic review and reconciliation that restate the failure. | Low–medium | Decrease: simplify stage sequencing and use existing stage/result records to show what ran. |
| R9 | Retain a useful final assessment of the complete plan, including applicable fixed/nonfunctional requirements. After selected repairs, follow up on the fix and relevant surrounding behavior through ordinary agent judgment instead of restarting the whole catalog by default. | Medium–high | Decrease: adapt final preparation, follow-up selection and completion together. No proof cache or dependency graph. |

These are workflow requirements, not new conditions an engineer must prove before
starting work. Context selection and finding selection belong to the existing
agents; do not turn either into another mandatory assessment stage.

## Completion, authority and compatibility

Completion reflects the user's requirements, configured checks and the
coordinator's decisions about useful work. It does not require exhausting possible
improvements or making every subjective finding disappear. A deferred or declined
suggestion remains accurately recorded and does not keep the workflow in a repair
loop. Selected fixes are verified through relevant checks and ordinary inspection.

Actual unmet requirements and failed required checks retain their meaning. A
discretionary finding disposition does not rewrite the plan or pretend a failed
check passed. Preserve existing explicit user authority over protected changes;
do not classify routine review decisions as protected changes or fabricate a user
answer to record an agent decision.

Keep review availability and unresolved issues visible. A review deliberately not
scheduled is not reported as completed. An unavailable advisory review does not
automatically impose a universal stop: the existing coordinator decides what to
do and records the outcome. This needs no additional review agent.

One-pass review limits the number of automatic review/fix cycles. It does not
authorize elapsed-time or silence cancellation of a running review. Preserve the
separately requested removal of review execution deadlines when integrating with
the execution branch; do not make timeout redesign part of this plan.

Preserve original plan baselines, candidate identities, command retry behavior and
historical record readability. Historical coverage records may remain readable
without enforcing their old rule on new assessments. Continue using the harness
as the durable-state writer and existing public contracts for projections/web.
Adapt completion consumers consistently; a deliberate skipped review must not
leave them waiting forever for evidence that will never be produced.

## Module impact and existing facilities

The inspected checkout keeps assisted and automated orchestration in the harness
parent. A parallel decomposition may move these implementations. Follow their
responsibilities in the execution checkout; this plan does not depend on finishing
that decomposition and does not add new modules for review policy.

| Owner / source area | Reuse and expected changes |
| --- | --- |
| Harness `src/assistance/` | Existing iteration briefs, assessment stages, Pi invocation, finding commands and result construction implement assisted policy. Change preparation, tool binding, decisions and completion together. |
| Harness `src/run/`, `src/reviews/`, `src/nonfunctional/` | Existing review scheduling, reconciliation and final-review prompts implement automated policy. Use their current iteration and candidate identities to distinguish initial review from selected repairs. |
| `reviews` child | Existing assisted/automated preparation, snapshot evidence and submission validation serve the parent. Simplify initial context and coverage validation; retain useful candidate evidence and on-demand access. |
| `check-findings` child | Existing decision, replay, query and relation behavior already supplies dispositions and history. Reuse it for assisted coordinator decisions and known-issue summaries; keep workflow policy with orchestration. |
| `agent` / Pi, `evidence`, `audit` | Reuse native tool binding and existing candidate/workspace acquisition and cleanup where suitable. These owners provide operations; the workflow chooses review policy and candidate context. |
| `plan-evidence` and `nonfunctional` children | Reuse selected-context rendering and existing final-round results. Change follow-up policy without adding a new evidence-validity model. |
| Public contracts, projections, web and coordination guidance | Reflect decisions and actual stage execution accurately. Remove assumptions that every open suggestion or unread artifact prevents completion. Keep these consumers aligned with the owning workflow. |

The harness ordinary API catalog includes `prepareReview`,
`prepareAssistedReview`, `decideCheckFindingChange` and
`decideNonfunctionalRound`; their children already expose them to the parent.
Reuse those boundaries. Exact assisted command and tool-equipment changes need
joint provider/consumer work, not a speculative new interface hierarchy. If a new
exposure is necessary after source moves, update its owner's declaration and
consumers together and verify access in that consumer's generated API view.

Follow [repository instructions](../../AGENTS.md),
[prompt principles](../../docs/prompt-optimization.principles.md),
[harness principles](../../docs/harness.principles.md),
[recovery principles](../../docs/harness-recovery.principles.md),
[plan-context semantics](../../docs/architecture/plan-context-catalog.spec.md) and
[test boundaries](../../docs/testing.spec.md), preserving their adoption status.
Update the [assisted service specification](../../docs/architecture/agent-assistance/service.spec.md)
and affected automated contracts to describe the changed review policy, including
coordinator decisions, nonblocking limitations and stage outcomes. Do not retain
obsolete strict policy merely because the current specification describes it.

## Proposed iterations

The coordinator may adjust boundaries when implementation reveals a simpler
integration. Module focus permits necessary cross-module work. Sequence these
three outcomes because the later policies consume the earlier result and decision
contracts; parallelizing both workflow adapters immediately would duplicate that
discovery.

### 1. Focused review with usable inspection

Deliver R1–R4 across assisted and automated preparation. Focus on `reviews` with
the harness callers and native tool equipment in the same assignment: what the
reviewer receives, what it can inspect and what its answer means must agree.

Replace full-plan/reference-inventory delivery with the relevant brief and
on-demand originals. Connect ordinary guidance selection to automated design
preparation. Supply candidate inspection tools and remove mandatory file coverage
from submission acceptance and assessment outcomes. Update affected contracts and
tests in this iteration, including historical-record readers.

Acceptance: an assisted review can finish with a supported conclusion while
leaving irrelevant historical artifacts unread; relevant compressed evidence can
be inspected with ordinary tools. Automated design review receives selected
guidance rather than every principles file. A real limitation is reported without
automatically being converted into a new required work item.

The iteration owns integration from preparation through Pi bindings to result
consumers for both paths. Verify representative composed cases and the actual
candidate-tool boundary as appropriate under the testing specification. No new
finding-decision or scheduling system is needed to complete this outcome.

### 2. Useful decisions and a bounded assisted cycle

Deliver R5–R8 for assisted work and the shared decision/summary facilities needed
by automated work. Depend on iteration 1's simpler review results. Focus on
assisted orchestration, the existing finding domain and public command/result
consumers together so a decision actually changes completion behavior.

Expose ordinary coordinator dispositions without impersonating a user approval.
Render a bounded existing-issue summary with decisions and rationales. Return
failed configured checks directly with their evidence. Review a coherent iteration
once, apply selected repairs, and let the coordinator choose relevant verification
or a purposeful extra review. Do not interpret submitting a corrective candidate
as an unconditional request to repeat the broad semantic review.

Acceptance: a review offering an optional improvement can be declined or deferred
and the iteration can continue; that decision survives normal reload and is visible
to later reviewers. A failed audit reaches the coordinator without launching
semantic review/reconciliation automatically. A repaired candidate can finish
after relevant verification without another broad pass, while a requested extra
review still runs and is recorded honestly.

This iteration owns assisted API/MCP, completion and coordination-guidance
integration. Verify these outcomes through the real workflow and finding-domain
composition with scripted external answers, including existing user-protection
behavior and stage visibility. Reuse available automated dispositions rather than
adding a second decision mechanism.

### 3. Bounded automated review and focused final follow-up

Complete R5–R8 in automated work and R9 in both paths. Depend on the earlier
preparation and decision contracts. Focus on automated scheduling/reconciliation
and final acceptance; keep their public result consumers in the same assignment
so intentionally omitted review work does not strand completion.

Apply the one-pass code/scope policy to an iteration and its corrections. Connect
ordinary finding decisions, known-issue summaries and direct check-failure
feedback to scheduling. Preserve relevant design review without making every
small repair trigger another broad review sequence.

Perform the useful final plan assessment. For subsequent selected fixes, prepare
a focused follow-up using existing results, the fix and relevant surrounding
behavior. The agent may broaden inspection for a concrete reason; it does not
need to prove every earlier judgment remains valid or repeat the catalog first.

Acceptance: an automated iteration with a selected correction progresses without
an automatic review loop; optional findings do not force another engineering
assignment. A final assessment that selects a repair can finish through focused
follow-up. Substantive unmet requirements remain visible. Both paths report
completed, unavailable and deliberately unrun work accurately and retain readable
historical results.

This iteration owns cumulative integration and documentation. Verify initial
review → decision → repair → continuation and final review → repair → completion
for both paths, including a purposeful extra review. Use representative cases,
not a new exhaustive coverage program.

## Verification and handoff

For each iteration, run relevant worker checks and assess its committed candidate
through ramify-agent. Finish with cumulative assessment against the original plan
and baseline. Apply the bounded review policy above to corrections; assessment
does not imply automatically repeating the broad review. Do not add a separate
strict qualification loop for this simplification.

Use ordinary tests with scripted external Git, CLI, audit and command answers.
Use an existing or appropriately registered native boundary test where a claim
requires actual candidate checkout/tool behavior. Run `npm run check:self` and
the configured default audit on clean committed candidates as required by the
repository; let the auditor choose scope. Avoid a redundant direct whole-suite
run or invented performance threshold.

Record representative delivered prompts, actual review invocations, decisions
and outcomes using existing evidence. Compare useful context and repeated work
with the analysis where comparable; distinguish audit time from review time.
The goal is a working simpler baseline, not a new measurement platform or a claim
of speedup without evidence.

At execution start, capture the chosen checkout's actual original baseline.
Resolve source moves and the separately developed deadline correction there;
neither requires completing the entire decomposition plan. Do not overwrite a
different execution's captured plan or rewrite its historical records.

The remaining implementation choices are local: the smallest candidate-checkout
adapter, the assisted command shape for existing dispositions, and how current
identities express an iteration's repair follow-up. Resolve them within the
owning iteration using existing facilities. They are not reasons to introduce
extra approval exchanges or preliminary architecture projects.
