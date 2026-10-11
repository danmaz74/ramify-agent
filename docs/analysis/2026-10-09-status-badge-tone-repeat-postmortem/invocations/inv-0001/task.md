Briefing revision: 5dcf87c729ead0c5c4e21e9a745a0d479eb9e167e0914256a899b18c2c46213f; based on: none (full)

# Goal
Read the captured plan for status-badge-tone and perform the current intake task.

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


# Intake of plan "status-badge-tone"

Read each captured plan document in full at its captured file:

- doc-001 (plan): plans/status-badge-tone/plan.md; captured file /home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/input/plan.md

Scenario blocks the harness found in each plan document:

- doc-001: A badge given a tone carries that tone in its markup (lines 34–38); A badge given no tone carries neutral (lines 40–43)

Missing references to judge: none.

Submit with `submit_intake`.

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

# Current environment
{
  "projectRoot": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
  "workingDirectory": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
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
    "submit_intake"
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
    "subs/harness/src/analysis/catalog-extractor.system.md",
    "subs/harness/src/analysis/intake.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: intake
Perform intake for {}; use the current evidence and designated submission.

Submit only through `submit_intake`. Only an accepted submission completes this task.