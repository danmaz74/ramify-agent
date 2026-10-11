Briefing revision: 15ec746b92d517863f288a7da568461c4d7b309f1f4a33945674b45df493d34e; based on: none (full)

# Goal
Render a status badge with an optional neutral, positive, warning, or critical tone exposed through `data-tone`, using neutral when tone is omitted.

# Requirements
- # Plan context package

Catalog: 20fb9f16cb3fc364d18e53e7664b6fab2b404eeb2617d7e8846b3aacd4e0135d
Elements: ctx-001, fr-001, fr-002, fr-003, fr-004, fr-005
Deviations: none

## Context

Context describes the situation the plan starts from and why the plan exists. It is not a requirement, and nothing assesses it.

### ctx-001: context from plans/status-badge-tone/plan.md

> The status badge says whether a review passed or failed, but a feature that wants to draw attention to a badge, or to play one down, has no way to say so. Give the badge a tone.

Conditions: none recorded.

Uncertainty: none recorded.

## Functional requirements

### fr-001: functional requirement from plans/status-badge-tone/plan.md

> `StatusBadge` takes an optional `tone`: `neutral`, `positive`, `warning` or `critical`.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-002: functional requirement from plans/status-badge-tone/plan.md

> The badge carries its tone as a `data-tone` attribute beside `data-status`, so the stylesheet and a test can read it without matching on the label.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-003: functional requirement from plans/status-badge-tone/plan.md

> A badge rendered without a tone reads as `neutral`.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-004: functional requirement from plans/status-badge-tone/plan.md

> A badge given a tone carries that tone in its markup.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-005: functional requirement from plans/status-badge-tone/plan.md

> A badge given no tone carries `neutral`.

Conditions: none recorded.

Uncertainty: none recorded.


## What the plan asks

- Requirement: fr-001, fr-002, fr-003
- Acceptance: fr-004, fr-005
- Context: ctx-001

The requirement, acceptance and context elements are supplied with this task. Non-functional, fixed and recommendation elements are selected after orientation.

Tests that state the acceptance are part of the work.


## The scenarios of this work item

Its entry has 2 scenarios. The harness wrote each into its feature file,
and no agent edits a feature file. The work item completes only when you have reported every one `done`.

### sc-001 (pending): A badge given a tone carries that tone in its markup

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature`.

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"
```

### sc-002 (pending): A badge given no tone carries neutral

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature`.

```gherkin
Scenario: A badge given no tone carries neutral
  Given a badge for a failed review with no tone
  When the badge is rendered
  Then its markup carries the tone "neutral"
```

A scenario is bound by step definitions, which an engineer writes in `src/tests/steps/` of the owner (a testing
module's `src/steps/`). Name the scenarios an iteration is to bind in `assignment.obligations`; its engineer's
accepted proposal binds each, naming the fakes the binding relies on, and the scenario is `bound` and loses its
pending tag at the next commit, so the gates' configured checks run it. A passing gate is evidence, never your
report: when, in your judgment, a scenario is correctly implemented and passing, report it `done` in `reports`,
whatever fakes its binding names. A completion request that leaves one not `done` is rejected, naming it.


## Your module

- Declared name: `collection-review/workspace/shared-ui`.
- Working directory: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src`.
- This is the assigned module's source directory.
- Any project-relative path in this briefing resolves from the project root; structured submissions keep their project-relative paths.
- Assigned module declaration: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/module.ramify` (read it if present).
- Assigned module source: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/` (read it if present).
- Test area (collection-review/workspace/shared-ui): `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/`.
- Onboarding (`/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/README.md`): Shared UI owns the presentation primitives that more than one feature view needs, beginning with the status badge that both the catalog card and the review result render. It exists as a separate owner because two vertical feature UIs must use those primitives while their core siblings must not.
- API view (src): `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/.ramify/`, revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:2`; coverage limits: 1, so absence is not proof of unavailability.
- API view (src/tests): `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/`, revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:2`; coverage limits: 2, so absence is not proof of unavailability.
- The architect view is at `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/.ramify-architect/`.


## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.
- fixture-structure (none): argv ["/home/app/ramify-status-badge-trial-20261009/ramify-agent/node_modules/.bin/ramify","check","--batch","--format","json","--no-snapshot"]; cwd `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.
- Configuration/support pointer: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/ramify-audit.json`.
- Configuration/support pointer: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/ramify-agent.json`.
- Configuration/support pointer: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/package.json`.
- Configuration/support pointer: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/cucumber.js`.

These are declared checks, not a focused command. Inspect their configuration for how to run particular tests. The gate runs the audit; shell refuses whole suites and watch mode.



## Default write scope

- `collection-review/workspace/shared-ui`: the base gives its engineer `subs/workspace/subs/shared-ui/` whole — `module.ramify`, `README.md`, all of `src/` with `src/tests/` and `src/interfaces/`, other documentation and auxiliary source — except the directories below.
  - Immediate child modules: none.
  - Owned nested-project roots: none.
  - Guarded files, writable only with an authorization: none.

Those child and nested-project directories are the only valid `included` values, and `included` is `[]` unless the iteration needs one of them whole. An included child brings its whole subtree, every module beneath it included.


## Hypotheses you received

### default-omitted-badge-tone (revision 1, tentative)
- Capability `render-toned-status-badge`, change `create`, confidence high. It is forecast to change symbols that already have consumers.
- Suggested owner: `collection-review/workspace/shared-ui`. Involves: `collection-review/workspace/shared-ui`. Anticipated consumers: `StatusBadge rendering`.
- Rationale: The entry needs a subordinate default-resolution behavior that turns an omitted tone into `neutral` before the badge exposes the value. The current exported StatusBadge signature and StatusBadgeProps contract contain only status and label, so adding this behavior is expected to extend symbols that already have feature consumers rather than reuse a recorded tone capability.
- Assumptions: Tone defaulting remains an implementation detail of the shared presentation primitive.; Existing callers omit tone and rely on the new neutral default without changing their calls.
- Uncertainties: The architect view records the public signature and documentation but not enough implementation detail to determine whether the default should be expressed in parameter destructuring or in local rendering logic.

A hypothesis is a forecast made before any work started. It is not a decision and not an instruction.


## The capability registry

- `render-toned-status-badge` → `collection-review/workspace/shared-ui` (entry): Render a status badge with an optional neutral, positive, warning, or critical tone exposed through `data-tone`, using neutral when tone is omitted.


## Placement decided for this work item

None yet. Placement that is yours to decide is recorded with your assignment; placement that is not is asked for.


## The bounds of an engineer

Unless an assignment raises them, one shell command may run 600000 ms, a session may go 300000 ms without a sign of activity, and one invocation may run 3600000 ms.
`assignment.bounds` raises them for one iteration, each with its reason, up to 1800000, 1800000 and 10800000 ms.



# Orientation task

Read the supplied elements and explore your module before organizing this work item. Submit only your orientation: your focus, current understanding and open questions. Do not assign an iteration or decide that a source suggestion is binding. Submit your orientation using `submit_work_orientation`.

## Module and test pointers

- `collection-review/workspace/shared-ui`: README `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/README.md`; declaration `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/module.ramify`; source `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/`.
  - Test area: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/`.
  - Observed API view: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/.ramify/`. Read its metadata for revision and coverage limits; absence under coverage limits is not proof.
  - Observed API view: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/`. Read its metadata for revision and coverage limits; absence under coverage limits is not proof.


## Scenario file pointers

- Feature: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature`.
- Step directory: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/steps`; observed files: (none).
Observed files do not establish what the runner loads. Inspect its declared configuration.


# Current procedure
# Work orientation

Read the supplied goal and the complete requirement, acceptance and context
elements. Explore your module's README, declaration and relevant source using
the briefing's paths. Establish what it already does about the goal. Search
its hidden API views for needed foreign interfaces; use global discovery only
for questions that local evidence cannot answer.

When you have explored enough to organize the work, submit your focus, current
understanding and open questions with `submit_work_orientation`. This turn precedes
organization and assignment; make no assignment here. Preserve uncertainty
about source force and scope. Non-functional, fixed and recommendation elements
will be selected next.

# Current environment
{
  "projectRoot": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
  "workingDirectory": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src",
  "candidate": null,
  "snapshot": null,
  "limits": {
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "infrastructureRetriesPerGate": 2,
    "forkRetriesPerRequest": 2,
    "budgetReturnsPerIteration": 6,
    "sessionReconstructionsPerWork": 2,
    "cycleReplansPerWorkItem": 1,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "readinessRecoveries": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000,
    "invocationIdleMs": 300000,
    "invocationAbsoluteMs": 3600000,
    "maxIterationsPerWorkItem": 12,
    "maxIterationsPerCapabilityTask": 24,
    "maxWorkItems": 64,
    "maxPlacementRequests": 32,
    "maxInvocationsPerRun": 400,
    "runAbsoluteMs": 28800000,
    "reconciliationRoundsPerWorkItem": 3,
    "laterRoundMinimumRisk": "medium",
    "maxPlanDeviations": 5,
    "commandTimeoutMs": 600000,
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "nonfunctionalRoundsPerPlan": 3
  },
  "availableTools": [
    "read",
    "grep",
    "ls",
    "submit_work_orientation"
  ],
  "views": [
    {
      "path": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/.ramify-architect",
      "revision": "rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:1",
      "modules": [
        "collection-review",
        "collection-review/integration-tests",
        "collection-review/workspace",
        "collection-review/workspace/catalog",
        "collection-review/workspace/catalog/core",
        "collection-review/workspace/catalog/ui",
        "collection-review/workspace/contracts",
        "collection-review/workspace/reviews",
        "collection-review/workspace/reviews/core",
        "collection-review/workspace/reviews/core/controller",
        "collection-review/workspace/reviews/core/tasks",
        "collection-review/workspace/reviews/ui",
        "collection-review/workspace/reviews/ui/pure-ui",
        "collection-review/workspace/reviews/validation",
        "collection-review/workspace/shared-ui"
      ],
      "coverage": [
        "cut: 11",
        "detailsUnavailable: 4"
      ]
    }
  ],
  "supportPaths": [
    "subs/harness/src/prompts/local-architect.system.md",
    "subs/harness/src/context-selection/orientation.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: orientation
Perform orientation for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_work_orientation`. Only an accepted submission completes this task.