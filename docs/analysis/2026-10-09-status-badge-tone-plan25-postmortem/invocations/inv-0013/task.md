Briefing revision: 8558e3ca8420a6c107629ae45073bc08889d65f63caca4a1ae171b1e625ade38; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Assess the complete NFR catalog for 4e706c2d97f1d5e4973e905e4331132a30e8e5ec

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- # Plan context package

Catalog: 9420af41d23a7174a0f0f89f54ed02753e391e8cee5939dea0fbf75cb6191f43
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


# Block brief:support:context:0
Current value; replaces any earlier value for this key.
Assess the prepared source tree 4e706c2d97f1d5e4973e905e4331132a30e8e5ec in round 1 (initial).
The package below holds every non-functional requirement of the plan and every fixed requirement, with the plan deviations recorded in this run. Carry their wording and stated/inferred conditions forward unchanged.
Submit exactly one result for every element ID of the package.
For each result, name inspected scope, evidence, and uncertainty. Analysis of the source is sufficient evidence, including for requirements about tests or behavior; choose undetermined only when the source cannot settle a requirement or its stated conditions.
Start from supplied implementation locations and inspect the prepared candidate using snapshot_list/read/search/diff. Use a relevant named comparison when needed; no pathless diff is required before inspection. Explore beyond stale or unhelpful hints across the whole allowed tree.
Prepared candidate source is authoritative. Pointer notes, earlier completion claims and green audits do not establish fixed/NFR satisfaction. Make your own semantic judgment for every element, including unchanged callers. Git metadata, generated views and run records are excluded from source evidence.
Do not use capability progress or scenario coverage as a substitute for this assessment. Do not edit source.
Submit your assessment using `submit_nonfunctional_assessment`.


# Block brief:support:nonfunctional-source
Current value; replaces any earlier value for this key.
{"head":"b999ea9a913557a04d3e2309247093027ad6b9f8","tree":"4e706c2d97f1d5e4973e905e4331132a30e8e5ec","defaultComparison":"run-start","comparisons":[{"name":"run-start","base":"58ffecdea0e2376e7cf163ca8932676463923174","target":"4e706c2d97f1d5e4973e905e4331132a30e8e5ec","changedPaths":[{"status":"M","path":".gitignore"},{"status":"M","path":"subs/workspace/subs/shared-ui/src/status-badge.tsx"},{"status":"A","path":"subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature"},{"status":"M","path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx"},{"status":"A","path":"subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx"}]},{"name":"accepted-boundary","base":"b999ea9a913557a04d3e2309247093027ad6b9f8","target":"4e706c2d97f1d5e4973e905e4331132a30e8e5ec","changedPaths":[]}],"originalSource":{"commit":"58ffecdea0e2376e7cf163ca8932676463923174","dirty":false},"comparisonLimit":"Named comparisons cover net changes at their recorded Git boundaries, not every intermediate edit or affected caller. An empty diff establishes no historical preservation. Dirty original capture excludes uncommitted starting bytes from the starting commit comparison.","readScope":["."],"excludedDirectories":[".git","node_modules",".ramify",".ramify-architect"],"excludedRunOutputs":["plans/.harness","plans/<plan>/.harness"],"authority":"Prepared candidate source is authoritative. Starting points, prior completion claims and green audits do not establish satisfaction. Assess all supplied fixed/NFR obligations independently and explore the whole allowed tree as needed."}

# Block brief:support:starting-points
Current value; replaces any earlier value for this key.
## Recorded starting points

Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.
Paths are relative to the pinned candidate 4e706c2d97f1d5e4973e905e4331132a30e8e5ec (tree 4e706c2d97f1d5e4973e905e4331132a30e8e5ec); use snapshot tools.

- {"path":"subs/workspace/subs/shared-ui/README.md","note":"Assigned module collection-review/workspace/shared-ui purpose","origins":[{"producer":"assigned module/source/test locations","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/module.ramify","note":"Assigned module collection-review/workspace/shared-ui declaration","origins":[{"producer":"assigned module/source/test locations","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src","note":"Assigned module collection-review/workspace/shared-ui source","origins":[{"producer":"assigned module/source/test locations","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests","note":"Assigned module collection-review/workspace/shared-ui owned tests","origins":[{"producer":"assigned module/source/test locations","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"Extend the current props and span markup while preserving defaultLabels and label semantics.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Existing renderToStaticMarkup tests establish the regression style and current guarantees.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature","note":"Read-only harness-owned scenarios whose exact steps must be bound from src/tests/steps/.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"StatusBadge tone contract, neutral default, and data-tone rendering.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Static-markup coverage for tones and wording preservation.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx","note":"Real-provider Cucumber bindings with per-scenario World state.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}

# Block procedure:nonfunctional-coordinator:assessment
Current value; replaces any earlier value for this key.
# Current procedure
Inspect the prepared tree and the assessment package in the message: every non-functional requirement of the plan and every fixed requirement, whole. Use the read-only tools when evidence is needed. Submit one result for every element ID of the package through `submit_nonfunctional_assessment`. Use `undetermined` when the available evidence cannot establish an intermediate or final condition. Preserve the element wording and state inspected scope, evidence, and remaining uncertainty for each result.

When asked for an action, use the named action tool to request a sequential investigation, one repair batch, or closure. An investigation reports evidence only for its named element IDs, which it receives whole. The harness assigns all identities and permits repair only after required investigation. Never edit source in this role.

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
  "candidate": "4e706c2d97f1d5e4973e905e4331132a30e8e5ec"
}

# Block environment:snapshot
Current value; replaces any earlier value for this key.
{
  "snapshot": "4e706c2d97f1d5e4973e905e4331132a30e8e5ec"
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
    "snapshot_list",
    "snapshot_read",
    "snapshot_search",
    "snapshot_diff",
    "submit_nonfunctional_assessment"
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
    "subs/harness/src/nonfunctional/coordinator.system.md",
    "subs/harness/src/nonfunctional/assessment.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": null
}

# Current task: assessment
This selection supersedes every prior task selection.
Active role: nonfunctional-coordinator
Selected procedure: procedure:nonfunctional-coordinator:assessment; SHA-256: 52d191a933160b44e464959fabc48510c531c2a7c9fafc91e5b67725646fd525
Perform assessment for {}; use the current evidence and designated submission.

Submit only through `submit_nonfunctional_assessment`. Only an accepted submission completes this task.