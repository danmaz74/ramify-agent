# Context budgets and compaction

**Date:** 2026-10-10. **Status:** analysis; no decision taken, no code changed.
Written after the Plan 31 stage 1 engineer (run `20261010T1200Z-wi01-s0`,
inv-0005) ended with `context-budget-reached` and no submission, and Dan asked
whether the budget end is a pi feature or something an agent invented. His
stated design: when the model's maximum is reached, the session autocompacts.

## Summary

The budget end is harness code, not a pi feature. pi has automatic compaction
and nothing that ends a session at a budget. The harness's "context budget
return" entered through the hypothesis document that preceded Plan 3, became a
per-role policy table in the Plan 3 MVP, and Plan 4 built metrics around it.

What runs today is narrower than even that design. Since Plan 23 preserved
native prefixes (commit d6773842, 2026-10-08), the pi adapter switches pi's
compaction off for every session, whatever the role's policy says. No role
compacts; every role ends at its budget. The adapter also skips the design's
final report, so a budget end leaves the next session to rediscover what was
done.

## What pi does

pi's `AgentSession` owns compaction. `shouldCompact(contextTokens,
contextWindow, settings)` fires automatic compaction when the estimated
context reaches the window minus `reserveTokens`, or on provider overflow; the
default settings reserve 16,384 tokens and keep the most recent 20,000 tokens
of history verbatim, summarizing what precedes them. A manual compaction exists
too. Compaction emits `compaction_start` and `compaction_end`, and the session
reloads its entries afterwards. `SettingsManager` accepts
`compaction.enabled`, `reserveTokens`, `keepRecentTokens` and per-model
overrides, and the session exposes `setAutoCompactionEnabled`.

pi has no notion of a budget that ends the run. Its loop runs until the model
stops calling tools, the caller aborts, or a `finishTurn` callback returns an
`end` decision.

## What the harness does

### The rule

`contextBudgetReached` in `harness/agent`'s port interface applies one rule to
every implementation: when the window is known, the budget is
`budgetFraction × window`; otherwise it is `budgetTokens`; the budget is
reached when `tokens + reportReserveTokens >= budget`. The policy per role
lives in `run/policy.ts`:

| Role | Compaction | Fraction | Absolute | Report reserve |
| --- | --- | --- | --- | --- |
| initial-architect, local-architect, capability-architect, nonfunctional-coordinator | allowed | 0.75 | 150,000 | 16,000 |
| engineer, contract-engineer, nonfunctional-repair-engineer | forbidden | 0.70 | 140,000 | 12,000 |
| global-fork, catalog-extractor | forbidden | 0.60 | 120,000 | 16,000 |
| reviewer, failure-analyst, context-selector | forbidden | 0.60 | 120,000 | 8,000 |

The policy's own comment says neither figure has a default because "a role that
forgot its policy would otherwise be compacted silently": the budget was
designed as the alternative to compaction, not as a safety net beside it.

### The adapter

The pi adapter (`agent/pi/src/session-operations.ts`) creates every session
with `compaction: { enabled: false }`. Its `finishTurn` callback reads
`session.getContextUsage()` after each assistant turn, emits a
`context-observed` event, and returns `{ action: 'end' }` once the rule says
the budget is reached. The invocation then ends `context-budget-reached` with
the observed token count and no report. The scripted (fake) agent is the only
implementation that can attach a report to that outcome.

### The run

`RunService` treats the outcome by role:

- An engineer's budget return is `not-kept`; the run may start a fresh
  successor for the same iteration up to `budgetReturnsPerIteration` (6), then
  the iteration closes partial and the local architect decides. In the current
  code path the run instead fails `limit-exceeded`
  ("reached its hard context limit without an accepted return").
- A contract engineer's budget return closes the contract iteration
  (`work-closed`) and registers no agreement.
- The initial architect's budget return fails the analysis: "a budget return is
  never a completion".
- A reviewer's budget return is an `execution-failed` attempt, not a verdict.

The engineer and contract procedures tell the model that the `partial` report
"is also the report you write when the harness tells you the context budget is
reached". The harness never tells it: the adapter ends the loop at
`finishTurn`, after which no model turn happens.

### The projections

Plan 4 measures the mechanism: `budget-return-rate.<role>`,
`repeated-budget-returns`, and the `context-limits/1` projection that counts
budget returns beside threshold and overflow compactions and records each
role's compaction policy. Plan 4's own table (main plan, "Role | Compaction
policy") documents engineers as "budget return with report; a fresh successor
continues the same iteration".

## Where the design came from

| Date | Where | What it says |
| --- | --- | --- |
| 2026-09-20 | `docs/decomposition/dan-hypothesis-3.md`, "Context budgets and compaction" (commit cad6fcd3, "Dan harness MVP ideas") | Module engineer and contract sub-session: "return to the coordinator at the context threshold; no compaction". Coordinator and global architect: "allow compaction and record every occurrence". A configurable threshold leaves room for a final report; the engineer gets "one final response without tools" and returns `context_budget_reached` with that report. Compaction is "a diagnostic signal of context pressure, not an automatic failure". |
| 2026-09-20/21 | `docs/architecture/autonomous-implementation-loop.md`, same section | The hypothesis text carried into the loop's architecture, with decision forks added as a third no-compaction role. |
| 2026-09-21 | Plan 3 MVP (commit 2d280f6e) | `defaultContextPolicies` with today's numbers; `context-budget-reached` as an invocation outcome; `budgetReturnsPerIteration`. The adapter honored the policy: `session.setAutoCompactionEnabled(spec.context.compaction === 'allowed')`, so architects compacted and engineers did not. |
| 2026-09-21 | Plan 4 (token efficiency) | Records and displays budget returns and compactions by mechanism; keeps Plan 3's policy table. |
| 2026-10-08 | Plan 23 (commit d6773842, preserved native prefixes) | The adapter hard-codes `compaction: { enabled: false }` for every session. Its README: "The generic compaction permission is retained, including `allowed`; this preserving implementation conservatively disables actual automatic compaction." |

Whether the hypothesis document's budget table was Dan's wording or an agent's
elaboration of his hypothesis is not recoverable from the record. Everything
after it followed that document faithfully, and the one later change (Plan 23)
moved further away from autocompaction, not towards it.

## Why Plan 23 switched compaction off

Preservation keeps pi's native request prefix byte-identical across
continuations and forks, so a reused session hits the provider cache and so a
fork starts from an exact recorded point. `preservation.ts` serializes the
prefix with pi's own serializer and qualifies a continuation by comparing the
recorded artifact with the request about to be sent. A compaction rewrites the
message history: the summarized prefix no longer matches any recorded artifact,
every retained fork point before the cut becomes unreachable in the live
session, and the adapter's rule that "preserving history cannot remove tools"
(the error it throws if a request is attempted after the budget) has no
counterpart for a summary that removes messages. Disabling compaction was the
conservative way to keep the preservation invariants true.

That decision was taken inside the adapter and recorded only in its README.
Nothing told the run that `allowed` had become inert, so the policy table, the
Plan 4 table and the projections still describe compacting architects that do
not exist.

## Evidence from runs

**Plan 31 stage 1, inv-0005 (engineer, gpt-5.6-sol, window 272,000).**
Effective budget 0.7 × 272,000 = 190,400; minus the 12,000 reserve the rule
fires at 178,400. The loop ended at 178,899 tokens after 1,054 s, 42 model
turns and 30 mutations, with type-check, 11 module tests and the self-check
passing in the tree and no submission. Nothing was committed; the tree stayed
dirty for a hand-authored successor. Every record of the ending (the context
observations, the outcome's `budget.threshold`, the transcript note) names
140,000 as the threshold, which is the absolute figure the rule did not use;
21 observations sit above it while the session continued.

**Plan 28 self-run, inv-0008 (local architect).** An `allowed` role ended
`context-budget-reached` and a fresh session had to be started. With pi's
compaction disabled, "allowed" bought it nothing.

**Cost of the mechanism.** The engineer that reaches its budget has by then
spent its whole context on work that is usually nearly done; the successor
re-reads the project from scratch. A compaction at the same point would have
cost one summary call and kept the last 20,000 tokens of working memory.

## What autocompaction would mean for the harness

Re-enabling pi's compaction touches four places:

1. **Preservation.** A compaction must become a boundary the adapter
   understands: record the compacted prefix as a new native artifact, treat the
   points before it as reachable only through their own recorded artifacts, and
   let a continuation that no longer qualifies fall back to a plain fresh
   session with the information in its prompt, which is the fallback Dan already
   chose for lost or failed reused contexts.
2. **The policy table.** Either every role allows compaction, or the table keeps
   `forbidden` for roles whose output must be a single uncompacted account
   (reviewer, failure-analyst, context-selector) and lets engineers and
   architects compact. The budget return then either disappears or stays as a
   bound well above the compaction threshold that never fires in normal work.
3. **The run.** The engineer's budget-return path (`budgetReturnsPerIteration`,
   fresh successor, `limit-exceeded`), the contract and architect handling, and
   the review attempt classification lose their trigger or keep it as a rare
   failure. `partial` remains the engineer's own handover.
4. **The projections and documents.** Plan 4's `context-limits/1` keeps
   counting compactions; budget-return metrics go to zero or go away. The
   architecture section "Context budgets and compaction", the engineer and
   contract procedures, the adapter README and the Plan 4 table must say what
   the harness now does.

pi's own thresholds (`reserveTokens`, `keepRecentTokens`) become the knobs,
with per-model overrides; the harness's `context-observed` events and
compaction `started`/`ended` events already exist to record what happened.

## Smaller defects worth fixing whichever way the decision goes

- The recorded threshold is the absolute figure, not the effective budget
  (`run/port-events.ts:140`, the outcome's `budget.threshold`, the transcript
  note). Record the effective budget and its source.
- The adapter ends the loop without the final report the design and the
  procedures promise. If the budget return stays, ask the model for a short
  report within the reserve before ending.
- The pi README is the only place that says `allowed` is inert. Any policy
  that an implementation cannot honor should be reported through the port's
  support description, where `compaction: { available: true }` currently
  claims the opposite.

## Decisions for Dan

1. Restore autocompaction for all roles, or for the roles whose policy already
   says `allowed`?
2. Drop the budget return, or keep it as a last-resort bound above the
   compaction threshold?
3. Is the preservation fallback after a compaction a plain fresh session, as
   for a failed reuse, or should preservation learn compaction boundaries
   first?

My recommendation: all roles compact; the budget return goes; preservation
treats a compaction like a failed reuse until a later plan teaches it
boundaries. That matches the stated design, removes the metrics that measured
a mechanism nobody wanted, and costs one summary call where today a whole
iteration is lost.
