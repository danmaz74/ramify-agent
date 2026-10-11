Briefing revision: 7d9ba4e139f2c915862327bfdda84b55e9df0bf7863cd45b79f5336b58363fc1; based on: 8126c1af62d77076b26417356ebd5adc7927fc1b717d234b360d7f1df0261166 (delta)

## The scenarios of this work item

Its entry has 2 scenarios. The harness wrote each into its feature file,
and no agent edits a feature file. The work item completes only when you have reported every one `done`.

### sc-001 (bound): A badge given a tone carries that tone in its markup

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature`.

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"
```

### sc-002 (bound): A badge given no tone carries neutral

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


## The bounds of an engineer

Unless an assignment raises them, one shell command may run 600000 ms, a session may go 300000 ms without a sign of activity, and one invocation may run 3600000 ms.
`assignment.bounds` raises them for one iteration, each with its reason, up to 1800000, 1800000 and 10800000 ms.


## The iteration you last assigned

`wi-001.i01` ended `accepted`, committed as 40155157c0af1fa686ec5b8579755c17a6364613.
Its engineers ran under a command maximum of 600000 ms, an idle bound of 300000 ms and an absolute bound of 3600000 ms.
- Finding: Focused TypeScript type-check passed.
- Finding: Focused StatusBadge Vitest suite passed: 4 tests.
- Finding: Focused generated Cucumber profile passed: 2 scenarios and 9 steps.
- Recommendation: Run the required project gate.
  A recommendation is advice. It never widens a scope and never discharges an obligation; you decide.

The scenarios its gate passed, and the step definition that bound each step:

- `sc-001` "A badge given a tone carries that tone in its markup" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature:12`, bound by:
  - `a badge for a passed review with the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:31`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:45`
  - `its markup carries the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `it still reads "Passed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:60`
- `sc-002` "A badge given no tone carries neutral" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature:19`, bound by:
  - `a badge for a failed review with no tone` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:41`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:45`
  - `its markup carries the tone "neutral"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`

Step locations identify loaded definitions; they do not establish import or exposure provenance. Retain unknown locations as unknown.

Assign the next iteration, or request completion and let the work item's gate answer.


## Earlier outlines

This work item already has 1 outline revision(s).



# Registered obligations

You are the responsible architect for these. Report one with `reports: [{ id, judgment: "done", basedOnRevision, where? }]` when, in your judgment, it is correctly implemented and passing; `basedOnRevision` is the revision shown. An engineer's accepted binding makes an obligation `bound` and names the fakes it relies on; a gate or audit result is execution evidence beside the status. Neither is your report, and neither changes one; your report is accepted whatever the fakes list says. Revise an earlier `done` with judgment "bound". Name the obligations an iteration binds in `assignment.obligations`. `where` is an optional short navigation hint; the harness stores it and never reads it.

- sc-001 (scenario): bound, revision 0; bound by inv-0007 with no fakes; no report yet
- sc-002 (scenario): bound, revision 0; bound by inv-0007 with no fakes; no report yet

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