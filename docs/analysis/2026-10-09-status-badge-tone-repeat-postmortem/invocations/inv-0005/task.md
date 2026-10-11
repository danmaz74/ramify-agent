Briefing revision: f30506cedf830c496ace5fe01f26ab3823ebbded06539a780dde6435e12a0316; based on: 15ec746b92d517863f288a7da568461c4d7b309f1f4a33945674b45df493d34e (post-fork)

# Plan context package

Catalog: 20fb9f16cb3fc364d18e53e7664b6fab2b404eeb2617d7e8846b3aacd4e0135d
Elements: nfr-001, nfr-002, nfr-003, nfr-004
Deviations: none


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

Select, by ID, the elements an engineer working this work item must keep in view, each with your reason, conditions and uncertainty. Omitting an element never waives it: every non-functional and fixed element is assessed against the final candidate. You may read a captured document to settle a doubt; answer with IDs only.

# Current procedure
# Select the work item's elements

Read every element in the message. Select, by its ID, each one that bears on
the work this work item asks for in this module, with your reason, the
conditions under which it applies and your uncertainty. A recommendation is
selected when it is relevant, like a requirement, and stays a
recommendation. Omitting an element never waives it: every non-functional
and fixed element is assessed against the final candidate. You may read a
captured document to settle a doubt, but answer with IDs only: no passage,
heading or line range. Submit with `submit_context_selection`.

# Current environment
{
  "projectRoot": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
  "workingDirectory": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/work/wi-001/selector-workspace",
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
    "submit_context_selection"
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
    "subs/harness/src/context-selection/selector.system.md",
    "subs/harness/src/context-selection/selector.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: selection
Perform selection for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_context_selection`. Only an accepted submission completes this task.