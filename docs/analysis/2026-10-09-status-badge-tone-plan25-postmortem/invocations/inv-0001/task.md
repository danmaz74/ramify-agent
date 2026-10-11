Briefing revision: 258b623712d6b3aef0033734828fd3f7a81f12d6295da75ae9cc6ea7c89a8f64; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Read the captured plan for status-badge-tone and perform the current intake task.

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- # A tone for the status badge

The status badge says whether a review passed or failed, but a feature that
wants to draw attention to a badge, or to play one down, has no way to say so.
Give the badge a tone.

## Request

- `StatusBadge` takes an optional `tone`: `neutral`, `positive`, `warning` or
  `critical`.
- The badge carries its tone as a `data-tone` attribute beside `data-status`,
  so the stylesheet and a test can read it without matching on the label.
- A badge rendered without a tone reads as `neutral`.

## Constraints

- The badge stays a presentation primitive of the shared UI: it learns nothing
  about records, reviews or protocols, and the tone arrives as a prop like
  everything else it renders.
- `status` and `label` keep their meaning. A tone never changes the word the
  badge shows.
- No feature view has to change. Existing callers keep rendering the badge as
  they do today.

## Acceptance

- A badge given a tone carries that tone in its markup.
- A badge given no tone carries `neutral`.
- The badge's existing tests still pass, and the tone has tests of its own.

The first two, as scenarios:

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"

Scenario: A badge given no tone carries neutral
  Given a badge for a failed review with no tone
  When the badge is rendered
  Then its markup carries the tone "neutral"
```


# Block brief:support:# Intake of plan "status-badge-tone":0
Current value; replaces any earlier value for this key.
# Intake of plan "status-badge-tone"

Read each captured plan document in full at its captured file:

- doc-001 (plan): plans/status-badge-tone/plan.md; captured file /tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/plans/status-badge-tone/.harness/jobs/20261009T193340Z-51f42e/input/plan.md

Scenario blocks the harness found in each plan document:

- doc-001: A badge given a tone carries that tone in its markup (lines 34–38); A badge given no tone carries neutral (lines 40–43)

Missing references to judge: none.

Submit with `submit_intake`.

# Block procedure:catalog-extractor:intake
Current value; replaces any earlier value for this key.
# Current procedure
1. Read every captured plan document in the message in full.
2. Write the plan's `goal`: a few sentences, close to the plan's own words,
   that say what the plan delivers and why. The readers of the principles
   documents use it to judge which of their rules bear on this plan.
3. Submit the plan's `non-functional` elements and its `recommendation`
   elements, each from the plan document that states it. Do not submit
   functional or context elements: the architect reads those. Submit an
   empty list only when the plan states no constraint and no suggestion.
4. Judge each captured plan document once in `incorporation.documents`:
   `scenarios` is true when its `gherkin` blocks are binding acceptance
   scenarios of this plan, with your uncertainty. A linked example can stay
   unincorporated.
5. Judge every missing reference of the message once in
   `incorporation.missing` as `required`, `unclear` or `advisory`, from the
   surrounding source text, with your reason. A required missing document
   cannot be accepted; report it so the run stops before implementation.
6. Submit with `submit_intake`.

# Block environment:projectRoot
Current value; replaces any earlier value for this key.
{
  "projectRoot": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review"
}

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review"
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
    "submit_intake"
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
    "subs/harness/src/analysis/catalog-extractor.system.md",
    "subs/harness/src/analysis/intake.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": null
}

# Current task: intake
This selection supersedes every prior task selection.
Active role: catalog-extractor
Selected procedure: procedure:catalog-extractor:intake; SHA-256: 6c5393fb0e1e5ddd1864a58367726246333bd569624c0d1f8ce5eac01c49dc2e
Perform intake for {}; use the current evidence and designated submission.

Submit only through `submit_intake`. Only an accepted submission completes this task.