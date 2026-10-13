# Execution continuity, context pressure and stalled sessions

**Date:** 2026-10-13. **Status:** analysis recording Dan's explicit decisions;
runtime migration is unimplemented by this document.

## Decision and principles

After Plan 43 stopped at an architect context threshold, Dan required removal
of every mechanism that terminates a run for such resource reasons. Increasing
the thresholds does not meet that decision. The durable commitment is recorded
in [Harness Principles](../harness.principles.md#resource-observations-preserve-run-continuity):

> A run never terminates because a context-size or time threshold is reached.
> Context-size checks serve only to optimize work through compaction or handoff
> to a new session. Time-limit checks serve only to recover a session that may
> be stuck. Compaction, handoff and recovery preserve the run's task, accepted
> work, authority and pending obligations.

These are adopted principles, not optional efficiency recommendations. Their
adoption does not claim that current code implements them. The earlier
[context-budget analysis](2026-10-10-context-budgets-and-compaction.md)
remains historical evidence of the implementation and the decisions that were
then unresolved; this decision resolves the question of whether resource
thresholds may end a run.

Context size means the estimated tokens currently occupying the model's
conversation, including instructions, history and tool results. It is distinct
from cumulative billed tokens, cached-token charges and elapsed time.

Ending one session to continue its work in another is permitted optimization
or recovery. Ending the run because that session reached a resource threshold
violates the principle. Relabeling the terminal result as `internal`,
`agent-failed`, `limit-exceeded` or an exhausted retry allowance changes
nothing about its cause.

## What Plan 43 actually demonstrated

Run `20261012T214112Z-fe22d2` targeted
`/workspaces/worktrees/plan43-prompt-guidance-and-review-evidence`. The
launcher used committed runtime `72f5d39`; target baseline was
`4968f33be7b6cc26f4ed4d7f0a6e538463503981`. The retained implementation is
`591083c5b5c9253e7bf037f8199d4cd12fd07023` on branch
`ramify-agent-run/20261012T214112Z-fe22d2`. Its
[execution note](2026-10-12-plan43-dogfooding.md) records preparation and
the operator intervention.

At event 688, work item `wi-003` was held on an administrative Beads handoff.
The read-only architect could not update or observe the intended tracker.
The operator recorded bounded implementation status through `bd`, read it
back, and submitted the existing resume command. Event 689 accepted that
command; event 690 continued architect session `ses-0039` as `inv-0060`, with
reason `environment-resumed`. Beads was working and this hold was cleared.

The resumed invocation's context observation reports 205,728 tokens and a
272,000-token window. Its captured architect policy has a 0.75 window fraction
and a 16,000-token report reserve. The effective threshold for ending work was
therefore `0.75 × 272000 − 16000 = 188000` tokens. The observation exceeded
this harness threshold; it does not establish a provider context rejection.

The recorded `budget.threshold` is 150,000, the absolute fallback value rather
than the effective fraction-based threshold. That misleading measurement was
already identified in the October 10 analysis. It must not be used to explain
which rule fired.

At `2026-10-13T04:57:56.038Z`, event 694 recorded
`context-budget-reached` without an accepted submission or final report.
Event 699 failed the run with `internal: The module architect of wi-003
ended without a result (context-budget-reached)`. No automatic successor
continued the architect's task.

The run retained two completed work items, all eight architect-reported done
scenarios, and a passing latest iteration gate `ga-0009`. It had not reached
final qualification. Code review's `cf-0003` timestamp-authentication defect
still required correction. The cutoff stopped the ordinary reconciliation
that should have handled that finding; passing scenarios do not erase it.

Authoritative evidence remains in the target's
`plans/43-prompt-guidance-and-review-evidence/.harness/jobs/20261012T214112Z-fe22d2/`:
`job.json`, `events.jsonl`, `invocations/inv-0060/observations.jsonl`,
`invocations/inv-0060/outcome.json`, and the referenced gate and review records.
Recorded timestamps in this section are UTC. This analysis does not modify
those records or reinterpret the failed run as successful.

## Where the current mechanisms conflict

The following inventory describes inspected source in main baseline
`a46aae8fe4a297d8b06ab17b971e35d295bd56cd` and the committed Plan 43 launcher
`72f5d39`. It identifies concrete paths for migration, not an exhaustive
qualification of every present or future deadline.

| Mechanism | Observed implementation | Required consequence |
| --- | --- | --- |
| Context threshold | `defaultContextPolicies` in `run/policy.ts` assigns role fractions, fallback token figures and reserves. `contextBudgetReached` in the agent port compares observed context against them. | Context pressure chooses compaction or a useful successor session. It establishes no terminal run condition. |
| Adapter cutoff | Pi `session-operations.ts` disables compaction, calls `contextBudgetReached` in `finishTurn`, ends its loop and returns `context-budget-reached`. | Remove the hard termination path and make optimization effective in the actual execution loop. |
| Misstated compaction support | Architect policy says `compaction: allowed`, but the preserving Pi driver uses `enabled: false` and replaces the SDK's request/turn preparation callbacks. | Actual compaction or handoff must work with preservation; setting a policy flag alone is insufficient. |
| Role handling | Local architect handling rejects any outcome without a submission; engineer, contract engineer and capability architect paths explicitly fail on context returns. Review attempts become unverified and retry under finite attempt policy. | Every role preserves its pending task and continues through compaction or handoff. A resource-triggered successor is never a semantic failure or an accepted result. |
| Whole-run elapsed allowance | `invocationRefusal`, `executionTimeRefusal`, gate admission and repair preparation use `runAbsoluteMs`. The Plan 43 runtime bypasses these checks for new runs with `unlimitedRunDuration`; main and historical policies still contain the rule. | Remove elapsed age as a reason to refuse continuation or terminate the run across all admission and recovery paths. |
| Invocation absolute timer | `InvocationBounds` expires `invocationAbsoluteMs` even when activity continues. The launcher repair raises this value to 30 minutes. | A timer may investigate and recover a possibly stalled operation. Elapsed lifetime alone must not interrupt healthy progress or end the run. |
| Idle watchdog | `InvocationBounds.touch` resets inactivity on port events; held commands extend that watchdog until their own deadline and margin. The launcher repair also forwards content-free model streaming progress. | Keep useful progress observations and stalled-session detection. A watchdog event initiates recovery and retains the task. |
| Check and command deadlines | Readiness, gate execution, commands and settlement have their own deadlines. Recovery distinguishes selected transport and execution obstructions from other endings. | A stalled producer or command is recovered through its owner. A timeout is not proof of an assertion failure, satisfied acceptance or exhausted run authority. |
| Recovery-count ceilings | Run policy includes limits on budget returns, session reconstruction, invocations and iterations. Some paths turn their exhaustion into run failure. | Inventory caps that act as substitutes for resource cutoffs; they must not turn repeated context handoffs or stalled-session recovery into terminal resource exhaustion. |

Source navigation:
[run policy](../../subs/harness/src/run/policy.ts),
[agent context contract](../../subs/harness/subs/agent/src/interfaces/port.ts),
[Pi session operations](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts),
[invocation watchdogs](../../subs/harness/src/run/port-events.ts),
[run orchestration](../../subs/harness/src/run/service.ts),
[invocation runner](../../subs/harness/src/steps/runner.ts),
[readiness](../../subs/harness/src/run/readiness.ts), and
[review completion](../../subs/harness/src/run/review-finish.ts).
These links are navigation into the checkout; the revisions above identify the
analyzed behavior. `git show 72f5d39:<path>` recovers the exact launcher source.

The runtime repair that raised deadlines and removed the new-run duration cap
addressed a concrete idle-progress defect, but it did not implement this
principle. The context policy and cutoff remained, and a longer absolute
invocation deadline still ends healthy work for elapsed time.

## Required runtime direction

### Context pressure preserves work

Use context estimates to keep the work useful: compact when appropriate, or
hand off to a new session with the current assignment, original need, accepted
decisions, pending findings and direct evidence pointers. Apply this to every
role and every fresh, continued, forked or reconstructed operation.

Handoff need not wait for an overloaded session to produce a report it can
no longer submit. Durable task and effect records provide recovery evidence;
an available agent-authored handoff can improve the next session's briefing.
Neither is an invented accepted result. A failed compaction requires another
recovery path, preserving the run and the actual obstruction.

The model's physical context window still exists. A provider context rejection
must likewise lead to compaction or source-backed reconstruction. Disabling
the harness cutoff while leaving compaction and handoff unavailable would only
move the failure to the next model request.

### Time observations recover potentially stalled work

Watch time together with relevant activity, including model streaming, tools,
producer progress, locks and operator waiting. A quiet interval is a reason to
inspect whether work may be stuck; it is not a semantic verdict. A session
that remains useful does not lose execution merely for being old.

When a session or operation is stuck, settle or fence it, reconcile its effects,
and resume the pending task in a suitable session. A stalled shell command,
check producer or settlement needs the same causal distinction. Its interrupted
execution remains unverified until the responsible producer supplies evidence.
ramify-audit continues to own check execution facts and results.

Retain detection deadlines and measured elapsed time where they support that
recovery. Remove whole-run time budgets and every conversion from a context
or timer event into terminal failure. An automatic attempt group may conclude
and require a different recovery approach; an attempt counter cannot make
resource exhaustion a reason to abandon the run. Unreconciled effects or an
unavailable prerequisite remain explicit obstructions, not evidence of completion.

### Preservation serves continuation

Compaction rewrites the active conversation, so exact native-prefix reuse
cannot be assumed across it. Keep prior request and transcript artifacts
immutable. Record the compacted history or successor as a new boundary with
its actual source, current task bindings and model observations. An older fork
must use its retained source evidence or an explicitly recorded reconstruction.

Never trade continuation for a cache-prefix guarantee. Report lost reuse or
changed cache behavior honestly; do not disable optimization to preserve a
prefix until the run fails. Guards, submission validators, write scopes and
accepted-effect deduplication remain effective in every successor. A stalled
mutation with unknown effects must not be replayed blindly or overlapped by a
second writer.

### Contracts and migration make the decision effective

Update the agent outcomes, run handling, recovery eligibility, policies,
metrics, projections and delivered instructions together. A role's old
`context-budget-reached` result must not continue to imply run failure after
the new context policy is introduced. Preserve old records and their original
meaning without rewriting historical outcomes or claiming retroactive success.
New execution and any explicitly admitted recovery must apply the adopted
principle and record its policy; retaining an old policy cannot silently
restore a terminal cutoff in current work.

The [harness specification](../harness.spec.md) currently retains ordinary
execution-bound handling, whole-run exhaustion and finite recovery allowance
language. These contracts need an explicit migration consistent with the
principle. The Pi module's
[execution-policy description](../../subs/harness/subs/agent/subs/pi/README.md#execution-policy)
also states the existing hard-budget failure and disabled compaction. Those
statements describe current behavior; they do not override Dan's new decision.

## Evidence needed to qualify the correction

Qualification should demonstrate continuation at the real consumer boundary:

- An architect crosses the former Plan 43 threshold, compacts or hands off,
  handles a pending review finding, and continues the same run.
- The same property holds for engineers, contract engineers, coordinators,
  reviewers, extractors, selectors and failure analysts, without manufacturing
  submissions or reducing review coverage.
- A session continues making progress beyond an old absolute-time allowance;
  no terminal result follows from its age.
- A silent or stalled operation is recovered with controlled clocks and actual
  settlement evidence. Accepted submissions and completed mutations are not
  replayed; unknown effects remain visible.
- Repeated context handoffs and stalled-operation recovery never exhaust a
  replacement run-ending count budget.
- Readiness, checks, repairs, continuation, forks and restart retain the same
  principle. Compaction and reconstructed histories keep original artifacts
  and honest provenance.

Follow [Testing ramify-agent](../testing.spec.md): ordinary evidence uses
scripted external answers and controlled time; actual provider or kernel
claims use the required reviewed native boundaries. No new paid trial is
needed to establish the existing defect from retained Plan 43 evidence.

This document is analysis, not an execution plan or qualification receipt. It
records the fundamental principle and the migration obligations. It makes no
runtime changes, starts no run and leaves unfinished implementation tracked
in Beads.
