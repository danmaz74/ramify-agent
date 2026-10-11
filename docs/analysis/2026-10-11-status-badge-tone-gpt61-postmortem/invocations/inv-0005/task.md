Briefing revision: d477aea97251a8626f2e651c529c75bdb7c9cb66e01180b4cea1a7bb9f0cb57c; based on: 37bc5695adb331b5225a80eef8c4947c75e690eaccffbbda3e998f39c02f84d3 (post-fork)

# Block brief:support:# Plan context package:0
Current value; replaces any earlier value for this key.
# Plan context package

Catalog: 8b8dc5c51c661b4f4e9ef0bec962c0c61cb80a18ee3e55561754b62ca9617691
Elements: nfr-001, nfr-002, nfr-003, nfr-004
Deviations: none


# Block brief:support:## Non-functional requirements of the plan:0
Current value; replaces any earlier value for this key.
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

# Block procedure:context-selector:main
Current value; replaces any earlier value for this key.
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

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/work/wi-001/selector-workspace"
}

# Block environment:availableTools
Current value; replaces any earlier value for this key.
{
  "availableTools": [
    "read",
    "grep",
    "ls",
    "submit_context_selection"
  ]
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/context-selection/selector.system.md",
    "subs/harness/src/context-selection/selector.procedure.md"
  ]
}

# Current task: selection
This selection supersedes every prior task selection.
Active role: context-selector
Selected procedure: procedure:context-selector:main; SHA-256: 5bce0525280af27077e08fc4150ca6e53b89ede183c4cd261b68f636488a32d1
Perform selection for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_context_selection`. Only an accepted submission completes this task.