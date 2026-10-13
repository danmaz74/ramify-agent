# Plan 44: execution continuity under context pressure and stalled operations

**Date:** 2026-10-13. **Status:** proposed execution input; implementation is
tracked in Beads `ramify-agent-cx0`. **Target:** ramify-agent. The harness's
architects determine decomposition, owners and assignments. Writing this plan
starts no implementation or live run.

## Problem and intended result

Implement the adopted [resource-continuity principle](../../harness.principles.md#resource-observations-preserve-run-continuity):
a run never terminates because a context-size or time threshold is reached.
Context observations optimize work through compaction or session handoff; time
observations recover potentially stalled work. Both preserve the task, accepted
work, authority and pending obligations.

The [October 13 analysis](../../analysis/2026-10-13-execution-continuity-and-resource-limits.md)
is the decision source and historical background. Its Plan 43 evidence shows
architect invocation `inv-0060` observing 205,728 context tokens against an
effective threshold of 188,000, then ending the run without a result. The
pending `cf-0003` correction and final qualification were never completed.
Increasing limits, changing the failure label or disabling only the harness
cutoff cannot satisfy this plan.

Source inspection for this plan used main
`a46aae8fe4a297d8b06ab17b971e35d295bd56cd` plus the adopted, uncommitted principle
and analysis. Recheck the execution baseline: the Plan 43 launcher repairs and
Plans 42 and 43 have separate retained work. This plan neither requires merging
their unrelated changes nor assumes those changes are present.

## Required behavior

### Pi native compaction is the default

Use Pi's native automatic compaction for every model role. This includes plan
and module architects, global forks including consultations, engineers, contract
engineers, capability architects, non-functional coordinators and repair
engineers, reviewers, catalog extractors, context selectors and failure
analysts. Apply the same rule to fresh, continued, forked and reconstructed
operations, standalone execution and debugger exchanges where they use these
execution paths.

Context means estimated current conversation occupancy, including instructions,
history and tool results. Cumulative billed tokens, cache charges and elapsed
time are separate measurements. Reuse Pi's context estimation, model-aware
compaction settings, summary generation, recent-history retention and native
context-overflow recovery through its supported integration surfaces. Do not
implement parallel harness versions of behavior Pi already supplies.

Use Pi's effective settings and model window without competing harness
role-based fractions, fixed token ceilings or extra report reserves. Remove
role-specific compaction prohibitions. Do not artificially lower the model's
usable context through an earlier harness compaction or handoff trigger.
Necessary headroom is handled by Pi's native settings; any override must address
a demonstrated model/provider requirement and be recorded with its reason,
rather than preserve a historical harness budget under a different name.
When context information is unavailable, preserve Pi's supported handling and
report the missing information instead of inventing a harness capacity limit.

Native compaction must work in the actual preserving Pi execution loop. The
adapter currently disables compaction and removes Pi's request/turn preparation
callbacks. Integrate the native lifecycle with durable persistence and request
validation; enabling a flag while bypassing that lifecycle is insufficient.
The integration must cover compaction's own model requests as well as ordinary
requests, retaining cancellation, dispatch guards and honest request/usage
evidence. Successful compaction continues the current task without requiring a
successor session or an operator resume.

Use source-backed session handoff as recovery when native compaction fails,
is unavailable or cannot make the session usable. Let Pi handle a provider
context-window rejection through its native recovery first where supported;
the harness handles the remaining obstruction without duplicating Pi's retry
loop. Record why fallback was needed. Failed compaction cannot become an
ordinary missing-result failure. If required inputs or a usable provider are
unavailable, retain an explicit recoverable obstruction.

Every continuation receives the current assignment and original need, accepted
decisions, pending findings, current candidate and configuration identities,
applicable authority, submission obligations and direct evidence pointers.
An agent-authored summary may improve the briefing, but recovery must work
without a final report from the overloaded session. Reconcile durable effects
first. A context return is neither a fabricated partial submission nor a
completion, semantic rejection or failed review.

### Time observations distinguish progress from a stall

Remove whole-run elapsed allowances from invocation, iteration, gate,
readiness, repair, resume and restart admission. Healthy work remains eligible
regardless of run or invocation age. Absolute invocation lifetime alone cannot
interrupt useful progress, including a long model stream with no completed
tool result yet.

Retain elapsed measurements and detection deadlines where they help identify a
potential stall. Evaluate relevant model streaming, tool and producer progress,
held commands, locks, settlement and explicit operator waiting. A quiet interval
initiates inspection or recovery; it supplies no semantic verdict. A periodic
timer or polling heartbeat by itself is not evidence that useful work advances.
Waiting at a debugger or environment hold does not expire task authority.

For a stalled model, command, check producer or settlement operation, stop or
fence further effects through its owner, establish settlement and reconcile
what already happened before dispatching replacement work. A stop receipt or
elapsed settlement deadline does not establish quiescence. Where settlement
or effects remain unknown, retain the pending task and an inspectable recovery
obstruction; do not authorize overlapping writers or gates.

### Resource recovery cannot exhaust a replacement run budget

Inventory every admission and recovery cap that can act as a substitute for
context or time termination. Include budget returns, session reconstructions,
fork retries, readiness recovery, model invocations, iterations, review
attempts and waiting allowances, check infrastructure retries, repair preparation
and automatic recovery groups.

Repeated context handoffs or stall recoveries must not exhaust a terminal
counter, including indirectly by consuming an invocation or iteration count.
Finite automatic attempt groups and cancellation-aware backoff remain useful
for avoiding repeated ineffective requests. After a group, choose a different
supported recovery or retain a nonterminal obstruction naming the prerequisite
or intervention needed. A count alone is neither that prerequisite nor grounds
for abandoning the run. Do not replace termination with an endless tight retry
loop or a pause at every routine context handoff.

Preserve genuinely semantic limits and decisions where independently applicable,
such as rejected submissions or assessed correction rounds. Resource attempts
must not consume a semantic allowance as though the agent had made another
decision. Record the causal distinction and retain all attempt history. Explicit
user stop remains effective and takes precedence over automatic continuation.

### Accepted work and execution authority survive recovery

Keep accepted submissions, decisions, capability handbacks, partial candidates,
commits, gates, pending findings and scenario obligations. Reuse authenticated
effects only for their actual candidate and configuration. Lost acknowledgements
must not repeat an accepted effect. Interrupted streamed arguments establish no
submission verdict. Unknown mutations are reconciled before replay; retained
dirty source is not discarded or silently treated as accepted work.

Successors preserve write scopes, guards, active submission validation,
accepted-effect deduplication and authority revocation. Stale sessions and
obsolete tools cannot regain mutation or submission authority. Resume remains
serialized and occurrence-bound: exact command retries deduplicate, stale or
conflicting commands fail, and concurrent clients admit at most one successor.
Changed source or prerequisites require the existing compatibility assessment
and responsible authority, rather than reuse of stale acceptance evidence.

Readiness and iteration, capability, work-item and final gates keep the pending
boundary through interruption. A timed-out check remains unverified until its
producer supplies qualifying evidence; it is neither an assertion failure nor
a pass. ramify-audit remains the owner of check execution facts, selection,
coverage, timing and results. The harness records and reacts to that evidence.
Review continuation retains the original frozen candidate and required review
coverage; no review kind disappears because a resource attempt ended.

### Preservation records honest context boundaries

Compaction changes the active conversation. Keep earlier request, transcript,
operation and observation artifacts immutable. Record the compacted history or
successor as a new boundary, its actual source, current task bindings and the
model observations that motivated it. Continuing after that boundary must not
claim exact native-prefix reuse across rewritten history.

A fork from an older point uses the retained evidence for that point, or an
explicitly recorded source-backed reconstruction with the correct authority.
Never silently replace its inherited history with a later compacted history.
Preserve exact prefixes where they remain valid; they cannot take priority over
needed compaction or handoff. Report actual reuse loss and cache observations
without claiming measured savings from a shorter context alone.

### Contracts, observation and migration agree

Migrate agent outcomes, role-specific handling, recovery eligibility, captured
policies, delivered instructions, session records, metrics and public
projections together. New producers and consumers must agree that a resource
return leaves work pending. Existing historical `context-budget-reached` and
time-limit outcomes stay readable with their original meaning.

Capture the effective policy for new execution. Any explicitly admitted
continuation of older work must use the adopted continuity behavior with a
recorded policy transition, while retaining its original policy evidence.
An incompatible recovery request remains explicitly refused with its
compatibility reason; it cannot quietly continue under a terminal resource
policy. Startup must not auto-resurrect terminal runs or reinterpret Plan 43
as successful. Recovery holds survive restart with pending work, reconciled
effects and resume preconditions intact; startup alone supplies no new
execution authority. Preserve the debugger's existing live-server restriction.

Inspection and the existing CLI/web views must distinguish active work,
optimization, recovery, waiting, unverified checks and actual terminal outcomes.
Expose the trigger, predecessor/successor relationship, retained task and
obligations, settlement/effect status, and any concrete resume blocker.
For context pressure, record Pi's observed or estimated usage, model window when
available, effective native compaction settings and their source, trigger/reason,
and action or fallback taken. Preserve the distinction between current occupancy
and projected request size where Pi supplies it. Historical explanation of the
Plan 43 failure uses its actual 188,000-token trigger, not the recorded 150,000
fallback; neither becomes a new execution threshold. Missing estimates or windows
remain explicit; never invent provider evidence.

## Contract migration and constraints

The following are required specification changes, authorized by the adopted
principle. Other guarantees in these sources remain binding:

- [Harness specification](../../harness.spec.md): replace ordinary terminal
  handling of context returns and execution-bound exhaustion, whole-run
  exhaustion, total-time/invocation allowances on resume, and the one-fallback
  restriction wherever they would end resource recovery. Update debugger and
  review-wait language consistently. Preserve settlement barriers, semantic
  judgment, stop authority, frozen candidates and resume deduplication.
- [Pi execution policy](../../../subs/harness/subs/agent/subs/pi/README.md#execution-policy):
  replace hard-budget failure and disabled-compaction claims with implemented
  native automatic compaction, including preservation integration and fallback
  limitations. Delivered role instructions must no longer forbid compaction.
- [Session observations](../../metrics/session-observations.md): align context
  triggers, compaction boundaries, cache qualifications and elapsed/recovery
  measurements with the runtime and projections. Historical receipts stay intact.

Do not resolve these contradictions by merely raising limits, removing useful
watchdogs or claiming that a different terminal label changes the cause.
Do not rewrite completed analyses or results as current contracts.

The harness remains the sole durable-state writer and owns behavior contracts;
the web module projects them and forwards commands. Use Ramify and ramify-audit
only through their supported package/CLI surfaces and generated files. A needed
provider change follows its independent release and exact-pin workflow; no
companion source imports, aliases or linked dependencies.

Implementations should use existing recovery, session, command and projection
contracts where sufficient. Reusing Pi's native compaction is a required design
choice; a custom compaction algorithm or parallel trigger policy is out of scope.
The plan prescribes no new scheduler or fixed agent sequence. Broader launcher
reconnection work, unrelated Plan 43 code defects and completing the historical
Plan 43 run are separate work. The pending finding in acceptance below models
an obligation that recovery must preserve; it is not an instruction to fix that
historical candidate in this plan.

## Acceptance

The scenarios below describe composed consumer behavior. All-role and all-path
coverage is additionally required as described after the scenarios.

```gherkin
Feature: Resource observations preserve the run and its pending work

  Scenario: The former Plan 43 trigger does not reduce usable context
    Given an architect has a pending review correction and final qualification
    And Pi uses a 272000 token model window and a 16384 token compaction reserve
    When it observes 205728 context tokens without a final submission
    And Pi's projected next request remains below its native compaction trigger
    Then the former 188000 token harness threshold causes no compaction, handoff or failure
    And the architect continues in its current session
    And the architect handles the pending correction before ordinary final qualification

  Scenario: Native compaction continues the task without a successor
    Given a session is executing a task with pending findings and current submission authority
    And its preserving adapter uses Pi's native automatic compaction
    When Pi determines that the next request needs compaction under its effective model settings
    Then Pi's native compaction produces the summary and retained recent history
    And the adapter records the compaction boundary and its actual model requests
    And the same task continues with its pending obligations and guards effective
    And no successor session or operator resume is required

  Scenario: Native overflow recovery handles a provider context rejection
    Given a provider rejects a request because its context window is full
    And Pi's native overflow recovery can compact the session successfully
    When native recovery continues the interrupted work
    Then the task continues through Pi without a competing harness recovery loop
    And accepted effects are not repeated and the run remains active

  Scenario: Unavailable native compaction falls back to durable evidence
    Given an engineer has partial edits and a pending capability request
    And native compaction is unavailable for the session and it cannot produce a final handoff report
    When context pressure requires a successor
    Then the successor receives the original need, partial candidate, current authority and pending request
    And no partial or completed submission is inferred from those records
    And the engineer can continue the pending task

  Scenario: Failed compaction and a provider context rejection remain recoverable
    Given a provider has rejected a request because its context window is full
    And Pi's attempted native compaction fails
    When the harness reconciles the operation
    Then the rejection and compaction failure remain available as evidence
    And a source-backed successor can continue without the old session submitting a report
    And the run does not end because either context recovery failed

  Scenario: Review coverage survives native compaction
    Given a reviewer has not finished its required review of a frozen candidate
    When Pi natively compacts its current session
    Then the reviewer continues with that candidate and the entire outstanding review obligation
    And compaction does not consume a semantic review rejection allowance
    And completion still requires the valid review evidence

  Scenario: Streaming progress outlives an absolute invocation allowance
    Given a model is providing relevant streaming progress without a completed tool call
    When controlled time advances beyond the former absolute invocation allowance
    Then the healthy invocation continues
    And invocation age produces neither an interruption nor a terminal run result

  Scenario: Run age cannot refuse a pending gate or repair
    Given a run has retained work requiring a gate and an authorized repair
    When controlled time advances beyond the former whole-run allowance
    Then the gate and repair remain eligible under their ordinary prerequisites
    And elapsed run age does not end the run

  Scenario: A stalled invocation recovers after confirmed settlement
    Given an invocation stops making relevant progress
    When its watchdog triggers recovery and its owner confirms settlement
    Then the harness reconciles recorded effects before admitting a successor
    And the successor continues the pending task with the same authority
    And the watchdog event is not a semantic failure

  Scenario: An unknown mutation blocks overlapping execution
    Given a stalled command may have changed the candidate
    And its stop receipt does not confirm settlement or the resulting effects
    When the settlement observation deadline expires
    Then the run retains an inspectable recovery obstruction and the pending task
    And no replacement writer or gate is admitted
    When settlement and the mutation effects are subsequently established
    Then supported recovery can continue from those effects without blind replay

  Scenario: Recovery reuses an accepted result after a lost acknowledgement
    Given a submission and its resulting commit were accepted before an invocation stalled
    And the invocation did not receive the acknowledgement
    When recovery reconciles the accepted records
    Then it advances from the accepted result exactly once
    And neither the submission nor the commit is repeated

  Scenario: An interrupted audit remains unverified
    Given a final gate is waiting for its audit producer
    When the producer stalls and its operation is interrupted for recovery
    Then the gate remains pending with its original candidate and configuration
    And no assertion failure or successful qualification is inferred from the timeout
    When the responsible producer supplies qualifying evidence after safe recovery
    Then the gate uses that evidence through the ordinary audit contract

  Scenario: Repeated recovery does not exhaust a replacement terminal cap
    Given a pending task has reached the former context-return, reconstruction and invocation caps through resource recovery
    When another context handoff or stalled-operation recovery is needed
    Then the task remains eligible for useful recovery
    And resource attempts do not spend semantic correction rounds
    And a finite automatic attempt group may end without terminating the run

  Scenario: An unavailable prerequisite remains an actionable obstruction
    Given context recovery needs source evidence that is currently unavailable
    When an automatic recovery group ends without restoring that evidence
    Then the run retains the task and identifies the missing prerequisite
    And it neither spins through immediate identical retries nor invents completion
    When the prerequisite is restored and a compatible resume is admitted
    Then the pending task can continue without renewing a terminal resource budget

  Scenario: Compaction preserves historical artifacts and older fork meaning
    Given a session has immutable request artifacts and a retained earlier fork point
    When its active conversation is compacted and a later operation forks from the earlier point
    Then the old artifacts remain unchanged
    And the fork uses that point's retained source or records its source-backed reconstruction
    And the compacted boundary reports actual lineage without claiming an unchanged native prefix

  Scenario: Recovery preserves fences and command deduplication
    Given a settled predecessor has been replaced under the current task authority
    When the predecessor attempts a mutation or obsolete submission
    Then its operation is refused without effects
    When two clients retry the same admitted resume command
    Then at most one successor is admitted and both observe the recorded command result

  Scenario: Restart retains a recovery hold without restoring old cutoffs
    Given a compatible run is held on a reconciled recovery obstruction under a legacy captured policy
    When the service restarts
    Then the hold and pending obligations remain visible without automatic execution
    When an explicit compatible resume is admitted
    Then it records the effective continuity policy and preserves the original policy evidence
    And old context or time cutoffs cannot terminate the resumed work

  Scenario: Historical failures remain historical
    Given a retained terminal run failed with context-budget-reached
    When the updated service reads its records
    Then the recorded failure and original policy remain unchanged
    And the service neither restarts it nor reports retroactive success

  Scenario: Operator waiting and explicit stop retain their meaning
    Given a run is waiting at an authorized debugger or environment hold
    When controlled time advances beyond former execution allowances
    Then waiting does not expire task authority or mark the run failed
    When the operator explicitly stops the run during recovery
    Then stop prevents automatic successor admission and retains actual settlement evidence
```

Qualification must include:

- A coverage inventory mapping every actual role and fresh/continue/fork/
  reconstruction entrypoint to the exercised continuation behavior. Include
  readiness, repair, standalone steps, debugger exchanges, restart and all gate
  kinds. Use small parameterized witnesses for shared behavior and composed
  regressions for distinct consumer handling, rather than only adapter tests.
- A causal inventory of former limits and every remaining timeout/counter:
  show which optimize, detect a stall, bound an attempt group or constrain a
  semantic decision, and demonstrate that none ends a run for resource reasons.
  Exercise count boundaries with the minimum inputs needed to cross them.
- Actual preserving Pi loop evidence exercising the installed native compaction
  and overflow paths with scripted external responses, including successful
  continuation, compaction failure, immutable history and source-backed fallback.
  Verify persistence, cancellation and dispatch guards for compaction requests
  too. A flag, replacement summarizer or mocked orchestrator outcome alone cannot
  establish native integration. Inspect that no harness role cutoff or duplicate
  compaction implementation remains in current execution.
- Observation/projection evidence for effective native settings and triggers,
  missing estimates, fallback reasons, recovery lineage, unknown effects and
  current resume blockers. The old Plan 43 threshold appears only as historical
  evidence or a regression boundary, never a new execution policy.
  Do not claim cache savings, real provider acceptance or kernel settlement
  from scripted evidence.

Follow [Testing ramify-agent](../../testing.spec.md): ordinary tests use scripted
external Git, command, audit and provider answers plus controlled time. Actual
provider/tool/kernel claims require exact reviewed entries in
`src/tests/test-boundaries.json`. Keep tests in their owner's `src/tests/`.
Run focused checks, type checking and `npm run check:self`; final implementation
qualification uses a clean committed candidate and
`node_modules/.bin/ramify-audit audit --cwd . --json` with default scope and every
configured project retained. The responsible architects assess semantic
completion; passing checks do not replace their judgment. No paid trial is
required to establish the retained defect or to author this plan.

## Implementation context and execution placement

Navigation, not prescribed ownership or existing-API claims:
[run policy](../../../subs/harness/src/run/policy.ts),
[agent port](../../../subs/harness/subs/agent/src/interfaces/port.ts),
[Pi session operations](../../../subs/harness/subs/agent/subs/pi/src/session-operations.ts),
[watchdogs](../../../subs/harness/src/run/port-events.ts),
[runner](../../../subs/harness/src/steps/runner.ts),
[run service](../../../subs/harness/src/run/service.ts),
[readiness](../../../subs/harness/src/run/readiness.ts) and
[review completion](../../../subs/harness/src/run/review-finish.ts).

The local specifications linked above supply the stated contracts; the analysis
supplies decisions and historical background. Their other linked plans and
historical reports are not additional deliverables for this plan.

This document is authored under the repository's `docs/plans/` convention.
Before full-run execution, prepare the supported entrypoint
`plans/44-execution-continuity/plan.md` in the chosen target checkout, preserving
this plan's requirements and correcting relative links. Include the adopted
principle and analysis in that checkout's captured input; they are uncommitted
at authoring time. Reconcile the actual baseline before execution. No unresolved
product decision is needed to begin implementation; recovery representation,
native Pi integration details and owner decomposition belong to the executing
architects. Native compaction as the default and removal of competing harness
context ceilings are user decisions, not optional design recommendations.
