# Removing Pi restrictions that violate harness principles

**Date:** 2026-10-15. **Status:** Batch 1 implemented and locally verified.
Batches 2 and 3 remain proposed. Committed audit evidence is published separately
by ramify-audit.

The first changes should remove restrictions that directly contradict the
project's existing principles: counts deciding whether work may continue,
recoverable failures ending a plan, inherited context becoming mandatory, and
architects lacking operations for their authorized planning work.

The [restriction inventory](2026-10-15-pi-restrictions-audit.md) identifies 41
families across execution, Pi integration, submissions and administration. This
analysis selects a first implementation scope from that inventory and proposes
three batches. The implementation notes below record the selected Batch 1
mechanics; the remaining proposals do not establish implementation or approval.

The user's governing direction is to help and guide Pi, with an exceptionally
high bar for restrictions called necessary. Existing comments, specifications
and tests establish how a restriction works; they do not establish its necessity.
A removal should simplify execution rather than introduce an approval registry,
exception mechanism or replacement quota.

Count-based checkpoints serve two purposes: preventing indefinite attempts to
resolve correctness problems, and preventing improvement loops whose additional
benefit no longer justifies their cost. A threshold prompts an architect's
assessment of those questions. It cannot establish the answer. Removing hard
ceilings must preserve reconsideration and the ability to end unnecessary
refinement once requirements are satisfied.

**Context and guidance support agent judgment throughout execution.**

The clarified principle,
[The Harness Makes Agents More Efficient Through Context and Guidance](../harness.principles.md#the-harness-makes-agents-more-efficient-through-context-and-guidance),
makes the purpose explicit. Before and during action, supply the context,
environment and tools that make the agent effective. During action, give useful
guidance, nudges and warnings. After action, assess the result and support
correction where necessary. Distrust of an agent's judgment is not a reason to
prevent the actions it considers necessary.

This applies across the proposed batches and to the inventory's tool and shell
restrictions. Role-based tool removal, prohibited diagnostic commands and
mandatory handoffs cannot be justified merely by the possibility that an agent
might choose badly. Give every agent all standard tools by default; select
specialized tools according to the task. Each denial of a standard tool needs
a specific reason consistent with the principle. The agent does not have to
demonstrate anticipated need to receive it. Explain useful defaults and give
feedback on actual results. The distinction between an exploratory
test run and evidence used for acceptance can be explained and recorded without
preventing the exploratory run.

Systematic mistakes call for diagnosis of the support the harness provides.
Missing instructions call for better guidance; excessive context and drift call
for context reduction, restructuring or a fresh task context carrying the
relevant knowledge. Tool removal does not correct either cause. The count-based
checkpoints should also consider whether the harness has supplied adequate
context and tools before attributing repeated problems to the agent's approach.

The [bounded-context principle](../harness.principles.md#bounded-context-is-what-makes-agents-efficient)
sets the current ceiling at 300,000 tokens of context occupancy. Preserve any
earlier native Pi compaction threshold. The ceiling calls for context reduction
while work continues; it does not justify removing tools or ending a run.

Apply this with simple changes:

- Remove repeated instructions and redundant evidence from delivered prompts;
  provide relevant summaries and references while keeping details accessible.
- Guide agents to split complex work into focused iterations and use forks for
  exploration whose detailed history need not enter the continuing context.
  Forks inherit their starting context; they isolate subsequent exploration,
  rather than shrinking that inherited prefix.
- Keep native Pi compaction enabled throughout. Prompt efficiency, decomposition
  and forks reduce its workload without delaying its own automatic trigger.
- Inspect the effective native threshold before changing runtime settings. If
  it already falls below 300,000 tokens, leave it alone. If it exceeds that
  ceiling, configure an earlier threshold through Pi's existing settings.
  Do not introduce a second token governor or custom compaction mechanism.

The current [Pi adapter](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L223)
already preserves effective model compaction settings and enables native
compaction; [role policies](../../subs/harness/src/run/policy.ts#L97) add no
competing token threshold. This clarification does not establish that every
selectable model already compacts below 300,000 tokens. Initial follow-up should
identify concrete prompt duplication and unnecessary context accumulation;
models already compacting earlier need no runtime limit change.

| Situation | Required direction |
| --- | --- |
| A role has no known use for a standard tool yet | Include it by default; anticipated use is not an admission requirement. |
| A tool is specialized for a particular task | Include it when that task calls for it. |
| A standard tool is omitted from a role's equipment | Require a specific reason for that denial; a role label or distrust of judgment is insufficient. |
| An agent chooses a diagnostic tool or command the harness would not have suggested | Provide guidance or a warning where useful; distrust of that choice does not justify preventing it. |
| Repeated mistakes reveal missing guidance | Supply the missing guidance and let the agent correct its work with its tools available. |
| Excessive context causes systematic drift | Improve or reconstruct the context while retaining the task and relevant knowledge; do not compensate by removing tools. |
| An action produces an incorrect result | Return the actual diagnostic and support correction. |

**Batch 1 restores architect judgment and continued correction.**

This batch combines three changes because their current failure paths reinforce
one another. Removing an iteration ceiling achieves little if the next format
error or failed verification still ends the run.

1. **Remove count-based decisions about continuation.** Remove lifetime
   ceilings on work-item iterations, capability assignments, work items,
   placement and unresolved requests, and dependency-cycle replanning. Remove
   repair-round ceilings, reconciliation's later-round risk floor and final-round
   prohibition on repair, and nonfunctional correction/reassessment ceilings.
   A count must not fail the run, establish completion or force an unresolved
   requirement into a deviation.

   Repetition remains visible to the responsible architect. It triggers
   assessment of whether further work is likely to resolve an unmet requirement
   or provide sufficient additional value for its cost. The architect changes
   ineffective approaches, seeks missing prerequisites, or ends further refinement
   when requirements are satisfied and additional improvement is not worthwhile.
   Continued useful work remains available. Use an existing architect turn whenever possible.
   A local repair exchange may hand control back to its architect without
   ending the plan or exhausting its ability to assign further work.

   This directly implements
   [Repetition Triggers Architect Reconsideration](../harness.principles.md#repetition-triggers-architect-reconsideration).
   Principal implementation sites are [run policy](../../subs/harness/src/run/policy.ts),
   [run execution](../../subs/harness/src/run/service.ts),
   [capability admission](../../subs/harness/src/capability/ledger.ts),
   [reconciliation](../../subs/harness/src/reviews/reconciliation.ts), and
   [nonfunctional rounds](../../subs/harness/subs/nonfunctional/src/rounds.ts).
   The inventory's findings 1, 2, 4 and 5 describe the current mechanisms.

2. **Make failed verification lead to correction.** A failed final gate
   should deliver its diagnostics to the responsible architect, which can
   delegate the correction and obtain verification again. An engineer ending
   without a result should return control to its architect. Preserve accepted
   work, partial edits and outstanding obligations through both outcomes.

   The agent doing the correction receives relevant failures and complete
   diagnostics, with report locations for further investigation. Completion
   requires the applicable evidence; a failed attempt to obtain that evidence
   leaves work pending. It does not establish that the plan cannot be completed.

   This implements
   [A Module Engineer's Failure Is Its Architect's Decision](../harness.principles.md#an-engineers-failure-is-its-architects-decision),
   [Prefer the Simplest Sufficient Correction](../harness.principles.md#prefer-the-simplest-sufficient-correction),
   and the [audit evidence principle](../harness.principles.md#ramify-audit-owns-check-execution-evidence).
   The [current final gate](../../subs/harness/src/run/service.ts#L12059) instead
   invokes run failure for a nonpassing verdict. Inventory finding 3 records
   this separate termination rule.

3. **Remove the three-error submission and tool-input quota.** Return
   actionable validation feedback and let Pi correct its input. Make the full
   set of errors available directly or through an accessible artifact. Repeated
   unsuccessful corrections can lead to architect assistance or clearer task
   instructions; their count must not exhaust the task.

   Validation can continue to identify an input that cannot be applied. The
   change is that Pi can repair it while retaining its work and context. If a
   session itself ends, the appropriate architect receives the unfinished task.

   This implements the statement in
   [The Harness Stays Small](../harness.principles.md#the-harness-stays-small-ramify-stays-outside-its-control-loop)
   that a runtime failure, including malformed output, is never a semantic
   outcome. The current quota is implemented in
   [submission judges](../../subs/harness/src/run/submissions.ts) and propagated
   through the [step runner](../../subs/harness/src/steps/runner.ts). Inventory
   finding 13 describes the resulting obstruction.

**Batch 1 acceptance examples**

| Situation | Required observable outcome |
| --- | --- |
| An architect proposes a thirteenth work-item assignment or twenty-fifth capability assignment with useful work remaining | The assignment can proceed; the old lifetime count cannot refuse it. |
| A run needs another work item or placement decision beyond its former limit | The responsible architect can create or resolve the work without replenishing an allowance. |
| A repair needs a fourth round | The architect can continue or change approach using the latest diagnostic. |
| Repeated correctness attempts leave a requirement unmet | A checkpoint makes the architect reconsider the approach or identify the obstruction; the count alone neither ends the run nor satisfies the requirement. |
| Requirements are satisfied but successive refinements offer diminishing benefit | The architect can end further refinement based on its expected value and cost, without waiting to exhaust a fixed allowance. |
| A checkpoint occurs during productive investigation | The architect can continue the work; the threshold itself is not evidence of an ineffective loop. |
| A later reconciliation identifies an easy low-risk correction | The architect can choose repair regardless of round number or a fixed risk floor. |
| Nonfunctional work remains unsatisfied after the former last round | Correction and reassessment remain available; the count does not force deviation or closure. |
| Pi corrects several invalid submissions and then supplies a valid one | The valid result is accepted without a new run or loss of prior work. |
| An engineer ends without a result | Its architect receives the unfinished task and decides what follows. |
| Final verification fails and the responsible engineer repairs the cause | The same retained workflow reaches another verification attempt and can complete when its requirements are satisfied. |
| Execution resumes after passing a former limit | Effective behavior remains the same; an inherited policy field cannot restore the removed ceiling. |
| The operator explicitly stops execution | The stop takes effect and no further assignment starts under the stopped execution. |

These examples should exercise the actual orchestration with scripted model,
Git, command and audit answers according to [Testing ramify-agent](../testing.spec.md).
Coverage must include ordinary and contract engineers, capability work, manual
steps, reconciliation and nonfunctional work. Merely changing policy defaults
does not satisfy the outcome if another caller, validator or imported record
still enforces the old rule.

**Batch 2 makes execution independent of retained session availability.**

4. **Make inherited context optional.** When an invocation cannot reuse its
   session, reconstruct its task from the repository and durable records and
   start fresh. Supply the goal, known evidence, decisions and pending work
   that the harness already holds. Prefer reuse where available; a real fork
   must still preserve the inherited context it claims to preserve.

   This applies to consultations as well as ordinary work. The current
   [consultation implementation](../../subs/harness/src/consultations/tools.ts#L89)
   explicitly disables fresh fallback. Missing cached context must not make
   an otherwise executable question unavailable.

   This directly implements
   [An Oriented Context Is Reused, Never Required](../harness.principles.md#an-oriented-context-is-reused-never-required)
   and the statement in
   [Forecast Early; Decide with Current Evidence](../harness.principles.md#forecast-early-decide-with-current-evidence)
   that session continuity is never required for recovery or correctness.
   Inventory findings 16 and 22 identify relevant restrictions; this batch
   does not require broadening the supported model/provider set.

5. **Recover after compatible implementation fixes and across unfinished tasks.**
   Remove selected-source and whole-lockfile equality as automatic recovery
   vetoes. Retain their hashes as provenance. Reconstruct the pending task
   using the installed runtime and the durable records it can read, preserve
   accepted work, and reassess evidence affected by the correction.

   Extend recovery to unfinished engineer assignments, capability tasks,
   automatic repair and nonfunctional coordination. An unfinished state is
   the work to resume. If a record actually needs migration or an effect needs
   reconciliation, identify and handle that concrete problem. Do not infer
   incompatibility solely from a changed implementation hash.

   This implements
   [Agent Invocations Should Be Considered Idempotent](../harness.principles.md#agent-invocations-should-be-considered-idempotent)
   and [Resource Observations Preserve Run Continuity](../harness.principles.md#resource-observations-preserve-run-continuity).
   Current restrictions are in
   [runtime fingerprints](../../subs/harness/src/run/recovery-runtime.ts),
   [recovery admission](../../subs/harness/src/run/recovery-admission.ts),
   [restart compatibility](../../subs/harness/src/run/restart-runtime.ts), and
   [restart import](../../subs/harness/src/run/restart-import.ts).
   Inventory findings 9–11 describe the mechanisms.

Acceptance should demonstrate a consultation completing without its old session,
an interrupted task continuing from a fresh session with retained changes, and
a compatible harness fix resuming work despite changed source or lockfile bytes.
Exercise each formerly excluded unfinished task state. Previously accepted
effects must not be repeated merely because a session was reconstructed;
affected qualification must be obtained for the resulting candidate.

**Batch 3 gives architects the planning operations their authority requires.**

6. **Allow incremental planning and tracking.** Give architects harness-owned
   operations for recording and revising authorized decisions and progress
   while continuing their investigation. Their final submission should answer
   the current task, rather than serve as the only opportunity to persist all
   planning and tracking changes.

   This directly implements
   [Architects Can Update Plans and Tracking Without Writing Code](../harness.principles.md#architects-can-update-plans-and-tracking-without-writing-code).
   The current [local architect equipment](../../subs/harness/src/steps/local-architect.ts#L234),
   [submission contract](../../subs/harness/src/work/submission.ts), and
   [obligation operations](../../subs/harness/src/work/obligations.ts) provide the
   starting points. Inventory finding 23 identifies the authority gap.

Acceptance should show an architect recording an authorized decision, doing
further investigation, revising that decision with its reason and retaining the
history through interruption. None of these actions should require ending the
reasoning session or writing implementation code.

**Relationship to Plan 45**

The earlier Plan 45 proposal already covers
much of Batch 1, including alternate ceilings, recovery and manual execution.
Reuse its accepted outcome and relevant acceptance cases. Incorporate the
explicit failed-final-gate correction path and continued submission correction
so that the implementation removes all three connected sources of abandonment.

The user selected native compaction as the checkpoint within an engineer session,
replacing the plan's proposed interruption after twenty-four tool calls. When Pi
starts compaction, the responsible architect reviews the assignment and current
evidence in parallel. Pi retains its completed summary and waits before its next
turn until the architect decides to continue or hand the unfinished task back.
Compaction alone establishes neither failure nor diminishing returns.

Across assignments, normal architect turns receive guidance to reconsider
repetition and the value of further refinement. Repeated failed repair cycles
return to those turns without exhausting future assignments. The Batch 1
implementation does not add Plan 45's separate coordination-counter protocol.
Semantic assessment belongs to the agent, not a text-matching heuristic.

Plan 45 currently preserves unsupported nested restart boundaries. Batch 2
deliberately extends beyond that scope. Its transport retry groups and other
retained bounds also require examination where they prevent fresh execution or
turn a recoverable interruption into abandonment. Their presence in the earlier
plan does not settle their necessity.

**Implementation direction**

Batch 1 removes the lifetime work, assignment, placement and dependency-replanning
ceilings, the submission/tool-input error quotas, and round-dependent restrictions
on reconciliation and non-functional corrections. Historical policy fields remain
readable for replay; their old values do not restore those ceilings. Failed final
verification now retains its evidence and asks the plan architect for a correction
goal and responsible module. Correction work, reassessment and another final
verification occur in the same run. Unfinished engineers return their retained
work to the responsible architect.

The compaction checkpoint preserves native Pi thresholds and summaries. Its
durable review identifies the engineer invocation and compaction occurrence;
restart reuses an accepted decision or obtains the pending review before work
resumes. A handoff records partial work without fabricating an engineer submission.
Explicit stop and failed compaction cancel the parallel review. Focused tests
cover both continue and handoff, delayed review, retained summary recovery,
submission correction beyond the former quota, and failed-final-gate correction.

Validation passed: `npm run type-check`, `npm run check:self`, focused ordinary
regressions for the affected execution and replay paths, and all three registered
native cases in `plan21-workflows.integration.test.ts` across a full-file run and
a focused rerun of its corrected final-verification fixture. The structural check
reported zero errors, three warnings and partial analysis coverage. Ordinary
regressions also cover contract and non-functional compaction handoffs, recovered
reconciliation repair decisions, and legacy NFR records closed by a former count
limit. A clean committed audit remains separate from this working-tree validation.

Future batches must retain the same behavior across fresh runs, compatible
resumption and manual steps, preserving old records as historical evidence.
Do not increase old limits, relabel them as user budgets or move their refusal
to another layer.

Proceed with fresh-session fallback and recovery, then incremental architect
operations. These are proposed delivery groupings, not a prescribed module
decomposition or agent schedule. All three should reduce mandatory handoffs
and machinery. The tool and shell restrictions must also be reconsidered against
the explicit context-and-guidance principle, restoring tools withheld out of
distrust wherever these workflows are changed. The inventory remains the wider
removal list, including evidence-format and scenario restrictions. Delivery
sequencing does not justify retaining a restriction that contradicts the
principles.
