# Plan 37: Correction at the responsible decision authority

**Date:** 2026-10-11. **Status:** implemented and qualified; the composed
committed default audit passed at `fefb0b0` with Plan 38. Beads records status.
**Target:** ramify-agent. **Execution:** ramify-agent architects derive work
items, owner assignments and iterations from this plan and the chosen base.

## Problem and intended result

The revision-preview run `20261011T143710Z-e572ca` exposed a conflict between
accepted scenario wording, globally loaded Cucumber bindings and available
testing contracts. Engineer `inv-0020`, implementing capability assignment
`cap-001.i02`, added a binding for `the review passes with no findings` that
Integration Tests already defined. The focused run reported an ambiguous step.
The scenario wording came from the input plan: registered scenario `sc-006`,
plan origin `ps-06`, preserved existing stored-record review behavior.

The engineer consulted its capability architect. Reusing the existing binding
required updating shared World state through a testing contract that was not
exposed. The engineer requested a helper from Integration Tests. That was one
possible resolution; the observation does not establish that introducing a
helper was the only appropriate correction. Discovering the binding earlier
would have avoided duplication but would not itself supply that interface.

Deliver guidance and evidence that let the responsible agent assess the
conflicting choice before committing to a workaround. The user established
this principle during review: a contradiction returns to the authority
responsible for the choice that caused it, which revises that choice or
delegates the correction. Responsibility follows the decision's current
authority; recovery does not require the original model session.

Architects should apply KISS when handling any issue: prefer the simplest
sufficient correction, including revision of an earlier choice when that
avoids unnecessary interfaces, dependencies or coordination. The intended
flow is engineer report, assigning architect assessment, plan architect
decision when needed, and a corrected assignment that continues the work.

## Scope

This plan owns `ramify-agent-bfn.16`, moved from Plan 36, including global
binding discovery, shared-state constraints and the decision-correction
workflow developed during its review. Beads owns implementation status.

Plan 36 retains the independent caller-module validation correction `.5` and
its other 20 findings. The fatal citation-validation correction `.1` and
focused-feature configuration investigation `.14` remain separate. This plan
does not require Plan 36 to finish first, launch a paid run, redesign scenario
representation or create a new general orchestration mechanism.

## Required behavior

### Prefer the simplest sufficient correction

Add a short durable commitment to the existing `docs/harness.principles.md`:
prefer the simplest sufficient correction while preserving required behavior
and module boundaries. Deliver actionable guidance to all architect roles,
including advisory consultations, local and capability coordination, and the
global architect responsible for plan decisions.

When handling an issue, compare correcting the underlying assumption or
decision with accommodating it through additional implementation. Consider
complexity across the whole project: interfaces, dependencies, state and
coordination, as well as the size of the immediate edit. A small local patch
is not necessarily the simplest overall solution. Assess behavioral equivalence
and evidence before choosing; fewer components never justify weaker acceptance
or private-state access.

Correct choices within the architect's authority. When a potentially simpler
correction requires another authority, present the conflict, evidence and
proposed alternative to that authority for assessment. For consequential
choices, briefly record why the selected correction is sufficient and why a
plausible simpler alternative was rejected. This is ordinary architectural
judgment, without a mandatory extra tool call, report schema or scoring system.

### Discover bindings before introducing a competing implementation

Every fresh or continued step-writing task, including capability-assigned work,
retains guidance to inspect the effective configuration's globally loaded
support and existing expressions before adding a matching binding. Supply
actionable configuration/support pointers where known and explicit limitations
where unavailable. Repeated wording in different scenarios is valid; multiple
loaded definitions matching one step create ambiguity.

Identify whether the existing binding can express the intended behavior and
which state or contracts it consumes. Do not equate discovering a binding with
establishing that the assigned engineer can integrate it. Ambiguity and zero
executed scenarios remain distinct from passing acceptance.

### Return a contradiction to the authority that can correct it

When an engineer cannot reconcile an assignment with existing bindings or
available contracts within its authority, its report identifies the relevant
scenario, assignment or design decision, the observed conflict, and the
behavior that must be preserved. Include known binding and state-provider
locations and available evidence. Distinguish verified facts from suspected
causes. This is guidance for agent judgment, not a new mandatory report schema
or a deterministic classification of prose.

Use existing advisory consultation when clarification can resolve the work.
Advice changes no assignment, scope, source or architectural decision. When a
decision needs revision, return the findings through the existing partial
result or other applicable accepted outcome so the assigning architect can
act. Do not force an inappropriate `unsuitable` reason or invent a submission
kind absent from the current tools.

The assigning local or capability architect assesses which choice caused the
conflict and who can revise it. It corrects its own plan or assignments within
existing authority, delegates implementation to an authorized owner, or
escalates through the existing placement or `unresolved` path. An engineer's
suspected cause is evidence for that assessment, not a verdict by the harness.
Do not automatically convert every contradiction into a missing-capability
request or send it to the original author when that author lacks current
authority over the decision.

For a plan-level correction, use the existing sequence: the engineer returns
`partial`; the assigning module or capability architect submits `unresolved`;
the global architect, acting as plan architect, answers through its current
decision or deviation mechanism; the assigning architect receives that answer
and issues the corrected implementation assignment. Escalation requests an
assessment and does not presume that the proposed amendment will be accepted.
An advisory architect that identifies this need tells the engineer to return
the conflict to its assigning architect; consultation itself changes no decision.

### Keep the available resolutions explicit

For the retained Cucumber case, the responsible architect assesses reuse of
the existing binding, a supported shared-state contract, and correction of
scenario wording through the authority that owns acceptance. Preserve the
behavioral assertion whichever resolution is selected. Neither a new helper
nor a renamed step is prescribed in advance.

Specifically consider whether authorized rewording would let a local binding
assert the same stored-record review behavior without adding a shared-state
helper. Verify that the revised expression avoids competing global bindings
and that its assertion preserves the original meaning. If this appears to be
the simpler sufficient correction, the assigning architect asks the plan
architect to evaluate it before commissioning a helper. The retained run
demonstrates consultation and helper delegation; it does not demonstrate this
comparison or a plan-level escalation, nor establish that a helper was wrong.

If the existing design is retained and a helper is needed, use exposed testing
contracts or an explicit capability handoff. Getter assignment, private-shape
casts, copied provider logic and unauthorized cross-module edits are not
substitutes. Provider and consumer integration must be verified before handback.

If accepted scenario wording needs correction, use the existing global
architect's plan-deviation process. It records the reason, amended elements,
alternatives, loss and old/new scenario text; the harness writes the revised
feature. The original captured plan and frozen catalog remain unchanged.
Existing user-review findings, continuation limits and decision behavior apply.
An advisory answer does not authorize a scenario edit.

The plan architect already has this pending-scenario revision ability. Make it
discoverable in architect guidance and verify its use in the composed workflow.
The plan architect evaluates the evidence and alternatives under existing
deviation rules; a collision alone does not prove that an amendment is justified.

The current validator permits rewording only while a scenario is pending.
Bound or completed scenarios remain protected. Report that limitation through
the existing conflict handling rather than resetting their state, editing a
generated file or claiming that the scenario was corrected. This plan neither
introduces a special wording-only amendment nor broadens rewording authority.
Any later proposal to do so needs a separate explicit decision.

After an accepted correction, the coordinating architect receives its result
and supplies the current basis for subsequent assignments. Partial work and
original decisions retain their provenance; successful correction does not
retroactively change what an earlier invocation received or did.

Use a fresh engineer on a new assignment after a partial result and accepted
correction. The current partial-result path closes the earlier engineer's
session; its candidate files and durable report preserve the work. The new
assignment supplies what was completed, what remains, the conflict and accepted
correction, relevant source/test pointers, and current acceptance and scope.
The new engineer inspects the retained work and continues from it. Preserve
the earlier report and assignment as historical evidence. This plan does not
extend same-session suspension beyond its existing capability-handback use.

## Constraints and qualification

The relevant obligations of `docs/harness.principles.md`,
`docs/harness.spec.md`, `docs/architecture/plan-context-catalog.spec.md` and
`docs/testing.spec.md` are carried here:

- Agents interpret contradictions and decide their resolution. Structured
  validation enforces identities, state and authority; keyword heuristics do
  not determine blame, behavioral equivalence or whether a new API is needed.
- Keep existing module responsibilities, dependency direction and engineer
  scopes. The harness remains the only durable-state and generated-feature
  writer. Ramify supplies architectural evidence; ramify-audit owns check
  execution evidence. No provider release or new module is required.
- Preserve behavioral acceptance, complete cited catalog elements and explicit
  deviation provenance. Ordinary frozen-text protection and the implemented
  pending-scenario deviation exception must be explained together; describing
  the latter does not authorize engineers to rewrite acceptance directly.
- Retain exact admitted packets, declarations and historical evidence. Fresh
  tasks receive complete current inputs; continued tasks use existing effective
  block replacement and withdrawal. Guidance must fit the active tools.
- Exercise real workflow logic with scripted agents and external answers under
  the ordinary process guard. Extend the existing focused workflow tests with
  a composed engineer partial result, assigning architect escalation, plan
  architect correction and fresh engineer assignment. Cover both local and
  capability coordinators, retained candidate edits, correction delivery and
  continued implementation against current acceptance;
  distinguish that evidence from merely delivering guidance to an LLM.
- Use focused tests for changed behavior and require `npm run check:self`.
  Implementation qualification uses a clean committed candidate and
  `node_modules/.bin/ramify-audit audit --cwd . --full --nested --json`, retaining
  all configured projects. Native tool claims require exact reviewed entries
  in `src/tests/test-boundaries.json`. Authoring authorizes no commit or live run.

## Acceptance examples

```gherkin
Feature: Binding conflicts return to the responsible decision authority

  Scenario: Architects consider a simpler correction before adding machinery
    Given an issue can be addressed by adding a shared testing interface
    And revising an earlier decision may preserve the behavior with less complexity
    When an architect assesses the issue
    Then its guidance calls for comparing both corrections across affected modules
    And it calls for escalation when the simpler correction exceeds its authority
    And it calls for a brief rationale for the consequential choice

  Scenario: Step-writing tasks can discover globally loaded bindings
    Given globally loaded support already binds the review-passes assertion
    When a fresh or continued capability-assigned engineer receives binding work
    Then its task supplies known support pointers and discovery guidance
    And it distinguishes reusable scenario wording from a duplicate matching binding
    And unavailable configuration evidence remains explicit

  Scenario: An engineer returns a conflict without selecting a workaround
    Given an assigned scenario matches a binding with an unavailable state contract
    When the engineer submits a partial result identifying the conflict and preserved behavior
    Then the assigning architect receives that evidence at its next coordination turn
    And no helper implementation is started solely because the engineer found the conflict
    And the engineer receives no additional write authority

  Scenario: The responsible architect corrects its assignment
    Given the engineer has returned a contradiction caused by its assignment's approach
    When the assigning architect records a compatible corrected approach within its authority
    Then subsequent work receives the corrected assignment basis
    And the original assignment and partial findings remain attributable to their authors
    And the behavioral acceptance remains required

  Scenario: An authorized wording correction reaches subsequent binding work
    Given a pending accepted scenario whose wording conflicts with existing test support
    And an engineer has returned a partial result with retained candidate edits
    And the assigning architect identifies behavior-preserving rewording as a potentially simpler correction
    And the assigning architect escalates the conflict through unresolved
    When the global architect records a deviation rewording the scenario while preserving its behavior
    Then the harness records the old and new text and regenerates the feature
    And the existing user-review finding and deviation policy apply
    And the coordinator receives the correction and creates a new binding-work assignment
    And a fresh engineer receives the earlier progress, remaining work and corrected acceptance
    And the fresh engineer continues from the retained edits and verifies the revised assertion
    And the captured plan and frozen catalog remain unchanged

  Scenario: Advice cannot bypass scenario protection
    Given an advisory consultation recommends different scenario wording
    And the scenario is already bound
    When correction is considered through the existing deviation validator
    Then rewording is refused with the pending-only restriction
    And neither the advice nor the refusal authorizes an engineer edit or a state reset

  Scenario: A retained design receives a supported testing contract
    Given the responsible architect assesses rewording and records why the existing assertion and scenario should remain
    And their integration needs a shared-state helper owned by another module
    When the architect delegates the missing testing capability
    Then provider work supplies a supported exposed contract within authorized scope
    And consumer integration uses that contract without accessing private state
    And focused execution verifies the assertion without ambiguous bindings
    And real integration is assessed before handback
```

## Evidence, navigation and execution placement

Background evidence is in `docs/analysis/2026-10-11-revision-preview-run.md`
and `docs/analysis/2026-10-11-revision-preview-run/review-engineer.md`.
The retained run used harness
revision `8d5e46840194ebca8b9dbe72ae8b37a8f9e418ac`; its native root is
`/home/app/ramify-trial-evidence/revision-preview-20261011T143639Z/collection-review/plans/revision-preview/.harness/jobs/20261011T143710Z-e572ca/`.
Keep historical evidence unchanged. If unavailable, use explicit scripted cases
and report the limitation instead of claiming a historical replay.

The feasibility investigation is recorded in Beads `ramify-agent-z56`.
Existing tests for plan deviations, fork submissions, capability assignments
and capability delegation passed 40 cases during that investigation. They
establish component behavior, not a replay of the complete historical conflict.

Optional implementation leads are `subs/harness/src/prompts/`,
`subs/harness/src/consultations/`, `subs/harness/src/work/engineer.ts`,
`subs/harness/src/capability/submission.ts`,
`subs/harness/src/architecture/submission.ts`,
`subs/harness/src/deviations/records.ts` and
`subs/harness/src/run/service.ts`. Use current generated views and actual code
to establish boundaries; these pointers do not assign work to modules.

This document is the sole execution input. Before separately authorized full
execution, place it at `plans/correction-at-decision-authority/plan.md` in the
target checkout. Plan 36 and historical reports are background navigation,
not required companions or prerequisites. No specification or authority change
is requested; guidance must accurately describe the existing deviation exception.
