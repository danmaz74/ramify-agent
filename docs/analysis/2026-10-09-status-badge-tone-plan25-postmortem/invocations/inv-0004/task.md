Briefing revision: 2de52d64e3054d5f1eeac0f2b43617071703df0e4db978e6f2aa8fab304c010f; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Render a status badge with an optional presentation tone exposed in markup, defaulting to neutral while preserving the displayed status wording.

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- # Plan context package

Catalog: 9420af41d23a7174a0f0f89f54ed02753e391e8cee5939dea0fbf75cb6191f43
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

Conditions:
- stated: No tone is provided when the badge is rendered.

Uncertainty: none recorded.

### fr-004: functional requirement from plans/status-badge-tone/plan.md

> A badge given a tone carries that tone in its markup.

Conditions:
- stated: A tone is given to the badge.

Uncertainty: none recorded.

### fr-005: functional requirement from plans/status-badge-tone/plan.md

> A badge given no tone carries `neutral`.

Conditions:
- stated: No tone is given to the badge.

Uncertainty: none recorded.


# Block brief:support:## What the plan asks:0
Current value; replaces any earlier value for this key.
## What the plan asks

- Requirement: fr-001, fr-002, fr-003
- Acceptance: fr-004, fr-005
- Context: ctx-001

The requirement, acceptance and context elements are supplied with this task. Non-functional, fixed and recommendation elements are selected after orientation.

Tests that state the acceptance are part of the work.


# Block brief:support:## The scenarios of this work item:0
Current value; replaces any earlier value for this key.
## The scenarios of this work item

Its entry has 2 scenarios. The harness wrote each into its feature file,
and no agent edits a feature file. The work item completes only when you have reported every one `done`.

### sc-001 (pending): A badge given a tone carries that tone in its markup

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"
```

### sc-002 (pending): A badge given no tone carries neutral

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.

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


# Block brief:support:## Your module:0
Current value; replaces any earlier value for this key.
## Your module

- Declared name: `collection-review/workspace/shared-ui`.
- Working directory: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src`.
- This is the assigned module's source directory.
- Any project-relative path in this briefing resolves from the project root; structured submissions keep their project-relative paths.
- Assigned module declaration: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/module.ramify` (read it if present).
- Assigned module source: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/` (read it if present).
- Test area (collection-review/workspace/shared-ui): `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/`.
- Onboarding (`/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/README.md`): Shared UI owns the presentation primitives that more than one feature view needs, beginning with the status badge that both the catalog card and the review result render. It exists as a separate owner because two vertical feature UIs must use those primitives while their core siblings must not.
- API view (src): `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/.ramify/`, revision `rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:2`; coverage limits: 1, so absence is not proof of unavailability.
- API view (src/tests): `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/`, revision `rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:2`; coverage limits: 2, so absence is not proof of unavailability.
- The architect view is at `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/.ramify-architect/`.


# Block brief:support:## Declared project checks:0
Current value; replaces any earlier value for this key.
## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review`.
- fixture-structure (none): argv ["/home/app/ramify-status-badge-20261009-latest/ramify-agent/node_modules/.bin/ramify","check","--batch","--format","json","--no-snapshot"]; cwd `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review`.
- Configuration/support pointer: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/ramify-audit.json`.
- Configuration/support pointer: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/ramify-agent.json`.
- Configuration/support pointer: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/package.json`.
- Configuration/support pointer: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/cucumber.js`.

These are declared checks, not a focused command. Inspect their configuration for how to run particular tests. The gate runs the audit; shell refuses whole suites and watch mode.



# Block brief:support:## Default write scope:0
Current value; replaces any earlier value for this key.
## Default write scope

- `collection-review/workspace/shared-ui`: the base gives its engineer `subs/workspace/subs/shared-ui/` whole — `module.ramify`, `README.md`, all of `src/` with `src/tests/` and `src/interfaces/`, other documentation and auxiliary source — except the directories below.
  - Immediate child modules: none.
  - Owned nested-project roots: none.
  - Guarded files, writable only with an authorization: none.

Those child and nested-project directories are the only valid `included` values, and `included` is `[]` unless the iteration needs one of them whole. An included child brings its whole subtree, every module beneath it included.


# Block brief:support:## Hypotheses you received:0
Current value; replaces any earlier value for this key.
## Hypotheses you received

None. The initial analysis forecast nothing that involves your module.


# Block brief:support:## The capability registry:0
Current value; replaces any earlier value for this key.
## The capability registry

- `render-status-badge-with-tone` → `collection-review/workspace/shared-ui` (entry): Render a status badge with an optional presentation tone exposed in markup, defaulting to neutral while preserving the displayed status wording.


# Block brief:support:## Placement decided for this work item:0
Current value; replaces any earlier value for this key.
## Placement decided for this work item

None yet. Placement that is yours to decide is recorded with your assignment; placement that is not is asked for.


# Block brief:support:## The bounds of an engineer:0
Current value; replaces any earlier value for this key.
## The bounds of an engineer

Unless an assignment raises them, one shell command may run 600000 ms, a session may go 300000 ms without a sign of activity, and one invocation may run 3600000 ms.
`assignment.bounds` raises them for one iteration, each with its reason, up to 1800000, 1800000 and 10800000 ms.



# Block brief:support:# Orientation task:0
Current value; replaces any earlier value for this key.
# Orientation task

Read the supplied elements and explore your module before organizing this work item. Submit only your orientation: your focus, current understanding and open questions. Do not assign an iteration or decide that a source suggestion is binding. Submit your orientation using `submit_work_orientation`.

# Block brief:support:module-pointers
Current value; replaces any earlier value for this key.
## Module and test pointers

- `collection-review/workspace/shared-ui`: README `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/README.md`; declaration `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/module.ramify`; source `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/`.
  - Test area: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/`.
  - Observed API view: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/.ramify/`. Read its metadata for revision and coverage limits; absence under coverage limits is not proof.
  - Observed API view: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/`. Read its metadata for revision and coverage limits; absence under coverage limits is not proof.


# Block brief:support:scenario-files
Current value; replaces any earlier value for this key.
## Scenario file pointers

- Feature: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.
- Step directory: `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/steps`; observed files: (none).
Observed files do not establish what the runner loads. Inspect its declared configuration.


# Block procedure:local-architect:orientation
Current value; replaces any earlier value for this key.
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

Optionally include `startingPoints` for a few useful source, test, support,
caller or API-view locations encountered while orienting, each with a short
note about what to inspect. Paths are literal and project-relative. These
hints authorize no writes and establish no completion or obligation. Omit
them when there are none to share; no extra discovery turn is required.

# Block environment:projectRoot
Current value; replaces any earlier value for this key.
{
  "projectRoot": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review"
}

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src"
}

# Block environment:candidate
Current value; replaces any earlier value for this key.
{
  "candidate": null
}

# Block environment:snapshot
Current value; replaces any earlier value for this key.
{
  "snapshot": null
}

# Block environment:limits
Current value; replaces any earlier value for this key.
{
  "limits": {
    "budgetReturnsPerIteration": 6,
    "commandTimeoutMs": 600000,
    "cycleReplansPerWorkItem": 1,
    "forkRetriesPerRequest": 2,
    "infrastructureRetriesPerGate": 2,
    "invocationAbsoluteMs": 3600000,
    "invocationIdleMs": 300000,
    "laterRoundMinimumRisk": "medium",
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationsPerRun": 400,
    "maxIterationsPerCapabilityTask": 24,
    "maxIterationsPerWorkItem": 12,
    "maxPlacementRequests": 32,
    "maxPlanDeviations": 5,
    "maxWorkItems": 64,
    "nonfunctionalRoundsPerPlan": 3,
    "readinessRecoveries": 2,
    "reconciliationRoundsPerWorkItem": 3,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "runAbsoluteMs": 28800000,
    "sessionReconstructionsPerWork": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000
  }
}

# Block environment:availableTools
Current value; replaces any earlier value for this key.
{
  "availableTools": [
    "read",
    "grep",
    "ls",
    "submit_work_orientation"
  ]
}

# Block environment:views
Current value; replaces any earlier value for this key.
{
  "views": [
    {
      "coverage": [
        "cut: 11",
        "detailsUnavailable: 4"
      ],
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
      "path": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/.ramify-architect",
      "revision": "rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:1"
    }
  ]
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/prompts/local-architect.system.md",
    "subs/harness/src/context-selection/orientation.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": null
}

# Current task: orientation
This selection supersedes every prior task selection.
Active role: local-architect
Selected procedure: procedure:local-architect:orientation; SHA-256: cdfff59dae3d61f8e00de771e217454f51fc35424ed642df11b06a795fe24744
Perform orientation for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_work_orientation`. Only an accepted submission completes this task.