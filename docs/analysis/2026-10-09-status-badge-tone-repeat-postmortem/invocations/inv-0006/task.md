Briefing revision: 8126c1af62d77076b26417356ebd5adc7927fc1b717d234b360d7f1df0261166; based on: 01effba627d85537dec7d21a5f455d60beaa25ee627d86adc23a364db7d698ea (delta)

# Requirements
- Use the accepted work-item package d5d8a0aa721e59c52f2123797f904d72f39f3eaedf9a400daf77acae9420fd6e, with selected elements fr-001, fr-002, fr-003, fr-004, fr-005, ctx-001, nfr-001, nfr-002, nfr-003, nfr-004. Its complete context is supplied once and remains in this session.

## What the plan asks

- Requirement: fr-001, fr-002, fr-003
- Acceptance: fr-004, fr-005
- Context: ctx-001

Your work-item package `d5d8a0aa721e59c52f2123797f904d72f39f3eaedf9a400daf77acae9420fd6e`, already in your session, holds these elements whole with the non-functional, fixed and recommendation elements selected for this work item: fr-001, fr-002, fr-003, fr-004, fr-005, ctx-001, nfr-001, nfr-002, nfr-003, nfr-004. An assignment names, in `citedElements`, the elements of this package its iteration must honor; its engineer and reviewers receive exactly those.

Tests that state the acceptance are part of the work.


# Registered obligations

You are the responsible architect for these. Report one with `reports: [{ id, judgment: "done", basedOnRevision, where? }]` when, in your judgment, it is correctly implemented and passing; `basedOnRevision` is the revision shown. An engineer's accepted binding makes an obligation `bound` and names the fakes it relies on; a gate or audit result is execution evidence beside the status. Neither is your report, and neither changes one; your report is accepted whatever the fakes list says. Revise an earlier `done` with judgment "bound". Name the obligations an iteration binds in `assignment.obligations`. `where` is an optional short navigation hint; the harness stores it and never reads it.

- sc-001 (scenario): pending, revision 0; not bound; no report yet
- sc-002 (scenario): pending, revision 0; not bound; no report yet

# Current briefing update
support:# Orientation task:0 no longer applies to this task.

# Current procedure
Plan this work item's ordinary goal and review each assigned engineer result.
Build on the module reading and understanding already in this session.
Explore further as needed for the selected package and current task. If
this is a fresh session, read your module's README, declaration and relevant
source using the briefing's paths. Establish what it already does about the goal.
Search the generated API view before proposing a foreign interface. Use the
architect view to locate behavior and ownership; an API name or registry entry
does not establish that its behavior meets the caller's need.

The entry is already registered; record a local decision only for a capability
not in the registry.

`assign` gives one engineer a bounded goal and a write scope.

`assignment.scope` decides what the assigned engineer may write:

- `base.module` names the owner. The base gives the engineer that owner's
  whole own contents: `module.ramify`, `README.md`, all of `src/`, including
  `src/tests/` with its unit tests and the step definitions in
  `src/tests/steps/`, `src/interfaces/` and the scratch directory `src/tmp/`,
  and the owner's other documentation, auxiliary source and owned unwired
  trees.
- The base excludes the owner's child modules under `subs/` and its owned
  nested projects. External, repository, package, generated and configured
  output regions stay excluded everywhere, even inside an included tree.
- `base.included` is normally `[]`. Each entry adds one whole tree with its
  `reason` and `instructions`, and names exactly one immediate child module
  directory or one owned nested-project root; the briefing lists them under
  "Default write scope". An included child module brings its whole subtree:
  the child's own contents and every module beneath it, its children,
  their children and so on, so a descendant never needs an entry of its own.
  A directory inside the owner, such as its `src/tests`, is already part of
  the base and is refused, as is any directory below an immediate child. A
  nested project inside an included child still needs its own entry.
- `extra` names single files outside the base, each with its purpose. A file
  in an excluded region or in a nested project the scope does not include is
  refused.
- `read` is recorded only. It limits nothing, widens nothing, and the
  engineer does not see it.
- Guarded files are writable only when `assignment.authorizations` names each
  one with its rationale; a local architect's submission also carries an
  `outline` revision that records why. An authorization stands for that one
  iteration. Guarded files are the package manifests and lockfiles,
  `.gitignore`, `tsconfig.json`, Vite, Vitest and Cucumber configuration and
  `ramify-audit.json`, at the project root, in workspace packages and at an
  included root; the configuration files the audit's checks name; and the
  contract artifacts in force. `module.ramify` is not guarded.
- Feature files, `ramify-agent.json` and the captured plan and principles
  documents are never writable: the harness alone writes them.

The harness validates the scope when you submit. A scope it cannot capture is
rejected with each error and its path; correct it and submit again.

Record affected requirements, relevant package elements, scenarios and
existing guarantees in the assignment. A scoped engineer may report
`capability-needed` with its actual calling code, known constraints and
examples. The harness preserves its partial source and session. Qualify that
request against the current provider and consumer evidence: return usable
existing behavior to the engineer when it suffices, or delegate one durable
task to a fresh capability architect. The task's architect coordinates the
provider, compatibility owners and requesting consumer through real
verification and handback. Your ordinary work item remains suspended while
that task or a nested task is active.

An accepted handback resumes the requesting engineer on its original
assignment. It does not complete your work item, another owner's queued entry,
or the whole feature. Reassess source and unexecuted assignments after
intervening capability work. The handback is its capability architect's done
report on the delegated outcome; your scenarios are yours to assess and
report, including whether the consumer really integrates the provider. If a
result shows a wrong oracle, changed API or new caller, preserve the original
need and have its coordinator revise the task's plan. Fakes may help a scoped
implementation, but are optional; passing a fake never substitutes for real
provider and consumer checks. Do not assign a contract iteration or yield for provider obligations.

You report on the obligations you are responsible for: this work item's
scenarios and any test you registered. Any submission may carry `reports`
of `{ id, judgment: "done", basedOnRevision, where? }`, your judgment that an
obligation is correctly implemented and passing, and `registrations` of
`{ kind: "test", description }` for a required test you want tracked on its
own. Name the revision the message shows; revise an earlier `done` with
`bound`. `where` is optional navigation text the harness never reads. An
engineer's completion proposal and a gate or audit result are separate facts
you assess, never your report.

Use `request-placement` when reuse, ownership or responsibility boundaries
remain uncertain. A decision may add an owner; refresh the affected context
before assigning it. Use `unresolved` with concrete evidence when the plan
cannot be met within current authority. Do not silently weaken an existing
consumer guarantee. Record a breaking change and its affected consumers in
the outline when the request requires one.

Name in `assignment.obligations` the obligations an iteration must bind. Its
engineer's completion proposal binds each in `bindings`, with the fakes the
binding relies on, or is refused naming the missing ones; a binding makes an
obligation `bound`, and only your report makes it `done`. A completion request
that leaves a scenario or registered test not reported `done` is rejected
naming it, and you answer in the same turn. The required gate runs against current source; a passing earlier check is not a
verdict on a later candidate. `request-completion` is refused while a
capability request is pending, a delegated task is stopped or lacks an
accepted current handback, or any ordinary scenario/review/gate requirement
remains. Correct the cited blocker and submit again; never infer completion
from a capability architect's submission alone.

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
    "inspect_git",
    "submit_work_item_result"
  ],
  "views": [
    {
      "path": "subs/workspace/subs/shared-ui/src/.ramify",
      "revision": "rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:2",
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "coverage": [
        "1 coverage limits"
      ]
    },
    {
      "path": "subs/workspace/subs/shared-ui/src/tests/.ramify",
      "revision": "rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:2",
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "coverage": [
        "2 coverage limits"
      ]
    }
  ],
  "supportPaths": [
    "subs/harness/src/prompts/local-architect.system.md",
    "subs/harness/src/prompts/local-architect-capability.procedure.md",
    "subs/harness/src/prompts/write-scope.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: assignment
Perform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_work_item_result`. Only an accepted submission completes this task.