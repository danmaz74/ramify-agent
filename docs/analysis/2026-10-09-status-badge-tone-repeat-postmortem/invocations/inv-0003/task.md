Briefing revision: 3efcae7fae4921d680e815d5b00f39137e661c9182c0c1b2cc091772d2897d10; based on: none (full)

# Goal
Read the captured plan for status-badge-tone and perform the current check task.

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


# Check the reading of doc-001

Read the document in full at its captured file:

- doc-001 (plan): plans/status-badge-tone/plan.md; captured file /home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/input/plan.md

The 10 elements read from it, as every later reader receives them:


# Plan context package

Catalog: 20fb9f16cb3fc364d18e53e7664b6fab2b404eeb2617d7e8846b3aacd4e0135d
Elements: ctx-001, fr-001, fr-002, fr-003, fr-004, fr-005, nfr-001, nfr-002, nfr-003, nfr-004
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


## Non-functional requirements of the plan

### nfr-001: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge stays a presentation primitive of the shared UI: it learns nothing about records, reviews or protocols, and the tone arrives as a prop like everything else it renders.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-002: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> `status` and `label` keep their meaning. A tone never changes the word the badge shows.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-003: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> No feature view has to change. Existing callers keep rendering the badge as they do today.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-004: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge's existing tests still pass, and the tone has tests of its own.

Conditions: none recorded.

Uncertainty: none recorded.



# The entries and scenarios that cite them

- Entry render-toned-status-badge: Render a status badge with an optional neutral, positive, warning, or critical tone exposed through `data-tone`, using neutral when tone is omitted. Requirements: fr-001, fr-002, fr-003; acceptance: fr-004, fr-005; context: ctx-001.
- Scenario explicit-tone-markup of render-toned-status-badge: cites fr-004.
- Scenario omitted-tone-neutral of render-toned-status-badge: cites fr-005.

Submit with `submit_catalog_check`; an empty `corrections` list says the reading is faithful.

# Current procedure
The message names one captured document, every element read from it and,
for a plan document, the entries and scenarios that cite them. You check
whether the elements are a faithful reading of the document and correct
them where they are not. You change nothing else.

1. Read the document in full, then each element.
2. Correct only where the reading is unfaithful, each correction with its
   `reason`:
   - `add` a requirement, recommendation or context passage the reading
     omitted, such as a Constraints section with no non-functional element;
   - `rewrite` an element made stronger or weaker than its source, or whose
     conditions or text are wrong; it keeps its ID, kind and document;
   - `replace` elements whose cuts separate a rule from its conditions or
     fuse unrelated requirements, and an element of the wrong kind: name the
     IDs it `retire`s and the elements that take their place.
   A replacement may retire elements without adding any: use an empty additions
   list when the source contains no replacement requirement. Never copy Gherkin
   into an element; cite registered scenario identities.
   Every element you add names this document. Keep the kinds' document
   rules: functional, non-functional and context elements come from plan
   documents, fixed ones from principles documents.
3. Where you retired an element that an entry or a scenario cites, re-cite
   it: list the entry in `entries` with its complete new
   `requirementRefs`, `acceptanceRefs` and `contextRefs`, and the scenario
   in `scenarios` with its complete new `refs`. Cite a new element by its
   key and an existing one by its ID. Every acceptance element of an entry
   stays cited by one of its scenarios.
4. Submit with `submit_catalog_check`; an empty `corrections` list, with no
   entries and no scenarios, says the reading is faithful.

Reference lists retain their kind rules: requirementRefs names functional
requirements; acceptanceRefs names functional acceptance; contextRefs names
context. Submitted additions use local keys;
rejections name those submitted keys before any durable IDs are allocated.

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
    "submit_catalog_check"
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
    "subs/harness/src/analysis/check.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: check
Perform check for {}; use the current evidence and designated submission.

Submit only through `submit_catalog_check`. Only an accepted submission completes this task.