# Plan 38: Cucumber acceptance and delivery

**Date:** 2026-10-11. **Status:** implemented and qualified; the composed
committed default audit passed at `fefb0b0`. Beads records status.
**Target:** ramify-agent. **Execution:** ramify-agent architects derive work
items, owner assignments and iterations from this plan and the chosen base.

The requested implementation used four serial iterations, each with a separate
agent. See the [implementation receipt](implementation.md) for delivered
behavior, verification and limitations. Beads remains the status authority.

## Problem and intended result

The revision-preview run `20261011T143710Z-e572ca` exposed three connected
acceptance problems. A capability assignment required an exact pending feature
but received no usable focused command because its obligation named the
delegated outcome rather than registered scenarios. A newly written step
expression competed with a globally loaded binding. The catalog retained
source-faithful Gherkin acceptance elements while its reviewer was instructed
to reject that representation. Repeated scenario and request delivery and an
unclear division of composed acceptance were also observed; their cost
remains unmeasured.

Deliver usable focused evidence for explicitly selected features, consistent
acceptance representation, complete context without repeated delivery, and
clear responsibility for delegated acceptance. Preserve the committed
decision-correction workflow and qualify it with these changes. Consumers are
architects, engineers, catalog reviewers and people assessing run evidence.

This is one outcome-based execution input. Its sections do not prescribe an
assignment sequence or implementation ownership.

## Scope and starting state

Beads remains the implementation status authority. These findings define scope:

| Issue | Required outcome |
| --- | --- |
| `ramify-agent-bfn.14` | Exact feature evidence is usable in capability work independently of completion-obligation IDs. |
| `ramify-agent-bfn.16` | Preserve and qualify global binding discovery and correction at the responsible decision authority. |
| `ramify-agent-bfn.18` | Deliver immutable scenario, request and context material once when already available, with complete mappings and current revisions. |
| `ramify-agent-bfn.20` | Permit faithful Gherkin acceptance elements consistently across extraction and review. |
| `ramify-agent-bfn.28` | Distinguish immediate caller conformance from broader composed acceptance and identify work delivered on handback. |

The `.16` implementation is committed at `183be9d`; focused verification is
recorded in Beads and qualification of a clean committed candidate remains
pending. Plan 37 retains its ownership of that issue. Start from a candidate
containing that implementation and subsequent compatible corrections. Reuse
its existing behavior; repair a demonstrated gap rather than commissioning a
second orchestration mechanism. This plan carries its relevant guarantees
below and adds composed acceptance with focused-feature preparation.

Plan 36 excludes these findings. Preserve its delivered corrections, including
catalog scenario-origin mappings and guidance about gate-owned whole suites.
Other open findings, such as partial-source suspension policy and search
metrics, are separate work. This plan changes neither of those contracts.

## Required behavior

### Explicit feature evidence in capability assignments

An architect can expressly select exact registered features for implementation
or evidence even when the assignment's only completion obligation is a
delegated capability outcome. Carry this selection as structured task input;
do not infer it from feature filenames mentioned in free text. A background
scenario pointer alone is not an instruction to run that feature.

Resolve selected identities to the harness's current generated feature files.
The identity domain is an execution decision: generated entry feature files
and registered scenario identities are both acceptable as long as every
selection resolves to exact current files and is rejected otherwise.
Retain selection provenance and the assignment's authority. Unknown or stale
identities and selections outside applicable project authority receive an
actionable rejection or explicit unavailability. No selection broadens source
write scope or authorizes changes to generated features. Existing assignments
that select features through scenario obligations continue to work unchanged.

For a supported declared Cucumber configuration, prepare an exact focused
profile that replaces broad feature paths and enables the selected pending
scenarios. Preserve effective support imports, World configuration, loaders
and declared environment. Explain pending-tag handling and globally loaded
support beside the command. Preserve current configuration identities and
dispatch revalidation; a stale prepared command cannot execute as current
focused evidence. Unsupported declarations retain their explicit limitations.

Use the same selection meaning in live assignment preparation, captured step
inputs and standalone step rendering/execution. An assignment with no explicit
feature selection and no scenario obligation receives no guessed command.

Executing selected features does not register new completion obligations,
complete requesting-consumer scenarios or give acceptance authority to the
engineer. Exit success with zero executed cases establishes no scenario
acceptance. Ambiguous, undefined, failed and unrun results retain their actual
status and limitations through existing evidence and architect assessment.

### Preserve discovery and correction at the responsible authority

Every fresh or continued step-writing task retains actionable guidance to
inspect the effective configuration's globally loaded support and matching
expressions before introducing a competing binding. Known support evidence is
delivered; missing evidence is an explicit limitation. Repeated scenario
wording is valid and does not establish permission to duplicate a loaded step.

When a collision or state-contract conflict prevents correct implementation,
the engineer reports progress, the blocker and evidence to its assigning
architect. The architect assesses reuse, an exposed testing contract, and
correction of the conflicting earlier decision. A proposed amendment to
accepted scenario wording reaches the plan architect through the existing
unresolved/deviation workflow. Compare the simplest sufficient alternatives
while preserving the behavioral assertion. A helper is not predetermined.

Advisory consultation changes no decision, write scope or acceptance text.
Only the existing recorded global plan-deviation process can reword a pending
scenario. Bound or completed scenarios remain protected. Captured source and
the frozen catalog keep their original text and provenance.

After a partial result and accepted correction, preserve candidate edits and
the durable report. A corrected assignment to a fresh engineer includes
completed work, remaining work, the blocker, accepted correction, source/test
pointers, current scope and acceptance. Exercise both local and capability
coordination. Preserve existing same-session capability-handback continuation
without extending it to closed partial assignments.

### Faithful acceptance elements may contain Gherkin

Adopt the minimal representation correction: a functional acceptance element
may retain a complete source-faithful Gherkin scenario when that text states
one acceptance requirement with its necessary conditions and examples. Align
initial extraction, catalog review, role guidance and relevant documentation.
Remove the blanket instruction that forbids copying Gherkin into an element.
No new catalog kind or scenario-reference expansion mechanism is required.
The rejected alternative, keeping the prohibition and requiring reviewers to
replace copied scenarios with registered references, was declined because it
would correct faithful readings for representation alone and separate an
acceptance requirement from the conditions that define it.

Review faithfulness, classification and requirement boundaries as usual. A
copied block is neither automatically faithful nor automatically invalid.
Retain the catalog's agent judgment; do not introduce byte matching or keyword
rules to judge semantic faithfulness. Correct real omissions, strengthening,
weakening, wrong conditions or wrong classification using existing correction
operations before the catalog freezes.

Keep registered plan origins, architect scenario keys, entry citations and
scenario references distinct and usable. Correction fields continue to use
their existing identity domain. Rewriting or replacing an element preserves
all acceptance behavior and updates affected citation lists; every acceptance
element remains covered by a scenario. Catalog correction never rewrites
registered scenario wording.

Qualify the six retained source-faithful copied acceptance elements
consistently: their representation alone warrants no correction. A similar
element that omits a stated condition must still receive a faithful
correction. The exact scenario registry and complete cited elements remain
available to consumers.

### Deliver complete material once when retained context is usable

Within a task, avoid rendering the same immutable plan scenario, capability
request, example set or context package in multiple blocks. Deliver each full
body once and supply the identities and mappings needed to relate its uses.
Do not deduplicate distinct requirements merely because their wording matches.

Across continued or forked turns, omit an unchanged body only when the exact
required material is known to be present in effective inherited context.
Identify what is retained and where it was delivered. Fresh sessions and
unusable inheritance receive complete current task inputs. A locator or
summary cannot substitute for a cited catalog element missing from context.

Preserve necessary comparison inputs: a catalog reviewer still receives the
captured source and the complete reading being compared, even where they share
wording. Sharing a body among uses within a task must retain all constraints,
scope exceptions, examples, identity mappings, provenance, revision and
coverage facts. Deduplication cannot omit support discovery or the fresh
engineer handoff required above.

Use existing effective block identity, replacement and withdrawal behavior.
Changed input is delivered as current input, superseded authority is made
explicit, and earlier admitted packets remain historical evidence. Retaining
an original immutable example never makes an obsolete design current.

### Distinguish delegated acceptance from the consumer's remaining goal

The responsible architect assesses whether an example defines immediate
provider/caller conformance, required composed acceptance within the delegated
task, or broader consumer acceptance outside that task. Record the division
and its reason in existing plan/decision material. Ask the requesting engineer
when the use is unclear. File location, text size and example designation alone
do not decide responsibility or whether behavior is optional.

Keep original example identities, behavioral meaning and applicable constraints
through plan revisions. Deferring broader consumer verification states who
retains responsibility and what remains; it never silently narrows the
requested capability or declares a required composed outcome satisfied. If
necessary verification of the delegated outcome is blocked, use the existing
partial or unresolved result rather than a successful handback.

For a delegated composed implementation, handback identifies actual caller
work delivered, source/test pointers, real-provider integration evidence,
limitations and remaining consumer work. For a narrower task, handback states
the boundary and the broader behavior still owed. Resume the requesting
engineer with this distinction so it inspects and reuses delivered work rather
than being instructed to recreate it blindly.

Preserve current obligation semantics: examples are immutable request context,
not automatically registered tests or independent obligations. Required
provider and requesting-consumer integration precede successful handback;
registered delegated obligations still require the responsible architect's
reports. A handback never reports the requesting consumer's own obligations
done. Do not claim repeated implementation without observed evidence.

## Constraints and qualification

Relevant obligations from `docs/harness.principles.md`,
`docs/architecture/plan-context-catalog.spec.md`,
`docs/architecture/acceptance-scenarios.md` and `docs/testing.spec.md` are
carried into this plan:

- Keep module responsibilities, provider dependency direction and engineer
  write scopes. The harness alone writes durable state and generated features.
  No provider release or new module is required by this plan.
- Agents judge meaning, faithfulness, behavioral equivalence and delegation
  responsibility. Structured validation verifies identities, authority and
  state; it does not interpret free text to choose responsibility.
- Preserve complete cited catalog elements, frozen acceptance, existing
  pending-scenario deviation authority, and exact historical packets. Document
  the permitted Gherkin representation explicitly without weakening fidelity.
- Ramify-audit supplies check execution evidence. Reuse its public contracts;
  do not add a parallel Cucumber parser, failure tally or verdict. Gate-owned
  whole-suite execution remains separate from focused engineer evidence.
- Preserve existing assignment, step-input and session compatibility. Any
  necessary additive selection contract has defined omission behavior;
  historical inputs remain readable with their original meaning.
- Qualify real workflow logic with scripted agents and external answers under
  the ordinary process guard. Native Cucumber/support/configuration claims
  require an exact reviewed entry in `src/tests/test-boundaries.json`; reuse
  existing applicable witnesses or extend them through that contract.
- Inspect retained `.18` cases for complete constraint delivery and correct
  selection/review inputs. Report comparable first-call new/cache token evidence
  only where available. Byte reduction alone proves no token, cost or accuracy
  gain; unmeasured model effects remain explicit limitations. This plan imposes
  no paid trial or arbitrary performance threshold.
- Run focused checks appropriate to changed behavior and `npm run check:self`.
  Qualify a clean committed candidate with
  `node_modules/.bin/ramify-audit audit --cwd . --json`, letting the auditor
  determine scope and retaining all configured projects. Plan 37's historical
  scope-override command is not adopted here. Repository audit instructions
  govern any independently justified override.

Authoring this plan authorizes no implementation run, paid model execution,
repository commit, push or remote synchronization. Implementation qualification
requires the ordinary execution authority and prepared committed candidate.

## Acceptance examples

```gherkin
Scenario: Capability work executes an explicitly selected pending feature
  Given a capability assignment whose only completion obligation is its delegated outcome
  And the architect explicitly selected the registered preview feature for evidence
  And the declared Cucumber profile excludes pending scenarios and loads shared support
  When the engineer uses the prepared focused command
  Then the selected preview cases execute with the configured shared support
  And unrelated features do not execute
  And no new completion obligation is registered by that execution

Scenario: Background feature pointers do not select execution
  Given a capability assignment with a background feature pointer
  And no explicit feature selection or scenario obligation
  When the engineer receives the assignment
  Then no guessed focused command is supplied
  And the absence of selected feature evidence is explicit

Scenario: Unknown feature selection cannot produce a broad fallback
  Given an architect selecting a feature identity absent from the current registry
  When the assignment is prepared
  Then the invalid selection is explained
  And no broad Cucumber fallback is supplied
  And the assignment gains no additional write authority

Scenario: Step rendering and live work preserve the same selection
  Given a capability assignment explicitly selecting the registered preview feature
  When its captured inputs are rendered as a standalone engineer step
  Then the step selects the same feature and support as live assignment preparation
  And a changed prepared configuration cannot execute as current focused evidence

Scenario: Zero executed cases do not satisfy selected acceptance
  Given focused evidence whose successful command exit reports zero executed cases
  When the architect assesses the required preview acceptance
  Then the evidence does not establish passing scenario acceptance
  And the missing execution remains explicit

Scenario: A binding contradiction returns to the responsible authority
  Given explicitly selected feature work with a globally loaded competing step expression
  And an engineer who has completed other edits before reporting the conflict
  When the assigning architect obtains an authorized pending-scenario correction
  And assigns continuation to a fresh engineer
  Then the completed edits and conflict evidence remain available
  And the new engineer receives the accepted correction and current acceptance
  And consultation alone has changed neither scope nor scenario text
  And the behavioral assertion remains required

Scenario: Faithful copied acceptance is valid catalog representation
  Given the six complete source-faithful preview scenarios retained as functional acceptance elements
  And registered scenario origins and entry citations for those elements
  When the catalog reading is reviewed
  Then copying Gherkin alone requires no correction
  And all six acceptance behaviors remain covered by their registered scenarios

Scenario: Permitted Gherkin representation still requires faithful conditions
  Given a functional acceptance element containing a scenario with a source condition omitted
  When the catalog reviewer corrects the reading
  Then the acceptance element preserves the omitted condition
  And affected citations remain complete
  And registered scenario wording is unchanged

Scenario: One task relates repeated uses to one complete immutable body
  Given a task using the same immutable scenario and request in several briefing sections
  When the task is delivered
  Then each full body is supplied once with mappings for all its uses
  And all constraints, examples, scope exceptions and coverage facts remain available

Scenario: Retained delivery follows effective context and current revisions
  Given a continued architect holding the complete unchanged selected package
  When the next task also needs a revised capability design
  Then the retained package is identified without repeating its body
  And the revised design is supplied with its current authority

Scenario: A fresh session receives complete current inputs
  Given a fresh architect session for the same task
  And an earlier session that held the complete selected package
  When the task is delivered
  Then the complete current package and revised design are supplied in full
  And no locator or summary stands in for a cited catalog element

Scenario: Catalog comparison retains both source and reading
  Given a captured plan and a complete catalog reading sharing acceptance wording
  When a fresh catalog reviewer receives its task
  Then both comparison inputs remain available in full
  And shared wording is not treated as permission to omit either input

Scenario: Delegated composed acceptance returns delivered caller work
  Given a capability task requiring a composed preview call with the real provider
  And its engineer delivered the caller adapter and composed tests
  When the responsible architect verifies integration and returns the handback
  Then the requesting engineer receives the delivered caller work and its evidence
  And the remaining consumer work is identified
  And the requesting consumer's own obligations remain open until its architect reports them

Scenario: Broader examples retain meaning when verification belongs to the consumer
  Given a capability request with immediate caller conformance and a broader consumer example
  When the architect records a justified division of verification responsibility
  Then the original example identity and behavioral meaning remain unchanged
  And broader verification has an explicit responsible consumer and remaining work
  And the handback does not claim that broader behavior passed
  And required delegated integration is verified before successful handback
```

Scripted acceptance verifies composed selection, delivery and coordination
behavior without claiming that a model will invariably follow guidance. Assess
binding discovery and faithful review guidance separately from workflow
execution. Retain the existing local and capability correction witnesses and
pending-only deviation protection. Native witnesses establish installed
Cucumber execution with configured support; ordinary tests script that boundary.

## Context and recommendations

These paths are navigation pointers, not additional captured requirements:

- `subs/harness/src/work/session.ts` prepares declared Cucumber configuration;
  `subs/harness/src/work/focused-scenarios.ts` builds the dedicated profile.
- `subs/harness/src/run/service.ts` and
  `subs/harness/src/steps/assigned.ts` currently derive selected feature paths
  from scenario obligations; `subs/harness/src/steps/engineer.ts` constructs
  the shared engineer input and discovery briefing.
- `subs/harness/src/prompts/initial-analysis.procedure.md` and
  `subs/harness/src/analysis/check.procedure.md` contain the representation
  disagreement. Existing scenario-origin mappings should be retained.
- `subs/harness/src/prompts/tasks.ts` and
  `subs/harness/src/prompts/blocks.ts` own current task/block delivery semantics.
- `subs/harness/src/capability/records.ts` and
  `subs/harness/src/prompts/capability-architect.procedure.md` describe current
  example, plan, obligation and handback semantics.
- Existing tests include `plan23-focused-scenarios.test.ts`,
  `plan23-cucumber.boundary.test.ts`, `catalog-extraction.test.ts`,
  `decision-correction-workflow.test.ts` and `decision-correction-guidance.test.ts`
  under `subs/harness/src/tests/`.

The retained run report and role reviews are at
`docs/analysis/2026-10-11-revision-preview-run.md` and its sibling analysis
directory. Beads records exact invocation evidence and historical revisions.
The original run is enough for initial investigation; no paid reproduction is
required. Historical reports keep their original paths and commands.

Prefer extending existing assignment selection and effective block delivery
over a separate discovery service or deduplication framework. Use existing
capability plan decisions and handback summaries for the responsibility split
where they can carry the required information. These are recommendations;
architects choose the sufficient implementation from current evidence.

## Execution placement

This document is authored under the repository's established `docs/plans/`
location. A full harness run requires placing the reviewed input at
`plans/cucumber-acceptance-and-delivery/plan.md` with only its intended captured
material. That preparation and the run are separate execution work. There is
no unresolved authoring decision requiring execution to begin.
