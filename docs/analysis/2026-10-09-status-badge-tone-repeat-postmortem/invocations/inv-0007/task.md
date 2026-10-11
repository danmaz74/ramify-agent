Briefing revision: cc8bb1e1c8d6973d6e17df1eb81a031dd7425f45d84a34db26eb42555ad4a922; based on: none (full)

# Goal
Implement the registered toned-status-badge capability and bind both acceptance scenarios in shared-ui.

# Requirements
- A focused diff shows the optional four-value tone contract, neutral default, and data-tone output without caller or semantic regressions; focused type checking/tests and the bound Cucumber scenarios pass, followed by the required project gate including type-check, Vitest, Cucumber, and structural audit.

## Approach the architect asked for

Update StatusBadgeProps with an optional exact tone union and make StatusBadge resolve an omitted tone to neutral before rendering data-tone alongside the unchanged data-status. Keep the primitive dependent only on its props and retain existing label/default-label behavior. Extend the existing static-markup Vitest suite to prove explicit tone propagation, neutral omission, and unchanged wording. Add shared-ui-local TypeScript/TSX Cucumber steps under src/tests/steps that bind the exact generated phrases, render the real StatusBadge with react-dom/server, keep state scenario-local, and use no fakes. Do not edit the generated feature file or require changes from feature callers.


## What the plan asks of this iteration

The elements your assignment cites, whole, with the plan deviations in force when it was assigned. The captured documents are not yours to read: what these elements do not settle is a finding.


Your starting module is `collection-review/workspace/shared-ui`. Your working directory is `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src`. Relative tool paths and shell commands start there.


## What you may write (project-relative paths)

- `subs/workspace/subs/shared-ui/` and everything beneath it

Nothing else. Beneath these roots, child modules, nested projects and guarded files stay excluded unless this list names them. A write outside this scope is refused before it happens; report the need instead of working around it.


## What you may import

Imports from other modules are answered by the API view of the module that imports, not by other modules' source:

- `collection-review/workspace/shared-ui` (src): `subs/workspace/subs/shared-ui/src/.ramify/` (project-relative; open `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/.ramify/` from this cwd); revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:4`; coverage limits: 1, so absence is not proof.
- `collection-review/workspace/shared-ui` (src/tests): `subs/workspace/subs/shared-ui/src/tests/.ramify/` (project-relative; open `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/` from this cwd); revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:4`; coverage limits: 2, so absence is not proof.

A symbol you need that is not there is reported with `capability-needed`, with the actual calling code and missing behavior; it is never imported anyway.


## Completion evidence


The gate commits a candidate and asks for the project's committed audit of it at the `iteration` checkpoint:
the project's own configured checks, its tests and scenarios among them, selected by the audit provider.
The harness runs no test selection of its own and names no test to run.

The tests this assignment owns are those of collection-review/workspace/shared-ui, in:
- `subs/workspace/subs/shared-ui/src/tests/` (`collection-review/workspace/shared-ui`)

To see how particular tests run before you propose completion, name their files to the project's runner from `shell`,
Inspect the project's declared audit and package scripts for its focused test command.
A whole-suite run is refused there: the gate's audit runs it.


## Obligations to bind

The architect assigned these to this iteration:

- `sc-001`: scenario "A badge given a tone carries that tone in its markup"
- `sc-002`: scenario "A badge given no tone carries neutral"

Your completion proposal's `bindings` names each of them exactly once, as `{ id, fakes }`: a binding declares that
the step definitions or test for it exist. `fakes` lists the fake class or export names the binding relies on,
each carrying `Fake`; leave it empty where it runs against the real provider. A proposal that leaves one out is
refused with the missing IDs; report `partial` with what is unfinished instead. A binding is your report of work,
never the architect's judgment that the obligation is done.


## Scenarios to bind

The architect expects this iteration to bind these:

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


## Binding a scenario

- Write step definitions in `src/tests/steps/` of a module within your write scope (a testing module's `src/steps/`). Candidate step locations are `subs/workspace/subs/shared-ui/src/tests/steps/`. Effective project configuration determines which support files are actually loaded; these directories alone establish no import provenance.
- Never edit a feature file. The harness writes them, and a write to one is refused.
- Bind each assigned scenario in `bindings` of your completion proposal once its step definitions bind its steps, naming the fakes they rely on. Binding removes its pending tag, so the next gate's audit runs it through the project's configured scenario check; a pending scenario is not run.
- Import another owner's step file by name, as `import { reviewSteps } from '…'`, never with a symbol-free
  `import '…'`: a symbol-free import loads the file without Ramify verifying that its owner exposes it.


## The tree you start from

The last accepted boundary is commit `564534ea8e482a1d65b77a247f80577ff5d540d8`. The harness tracks work since that boundary, including this iteration. Inspect the current files; you never run Git.
Uncommitted changes are that work; the gate commits a candidate before checking it. A candidate commit is not acceptance.

Work within the scope above and end your turn with `submit_iteration_result`.


# Exact focused scenario command

cd '/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review' && '/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/node_modules/.bin/cucumber-js' '--config' 'subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-6872601f6cc0af75.json' '--profile' 'ramify-focused'
Support/world/loader: {"import":["subs/integration-tests/src/support/*.ts","subs/integration-tests/src/steps/**/*.{ts,tsx}","src/tests/steps/**/*.{ts,tsx}","subs/**/src/tests/steps/**/*.{ts,tsx}"],"require":[],"requireModule":[],"loader":[],"worldParameters":{}}
Environment names: HOME, LANG, LC_ALL, LC_CTYPE, LOGNAME, NODE_ENV, NODE_OPTIONS, NODE_VERSION, PATH, SHELL, TERM, npm_config_cache, npm_config_global_prefix, npm_config_globalconfig, npm_config_init_module, npm_config_legacy_peer_deps, npm_config_local_prefix, npm_config_node_gyp, npm_config_noproxy, npm_config_npm_version, npm_config_prefix, npm_config_registry, npm_config_user_agent, npm_config_userconfig. Config SHA-256 6872601f6cc0af757d432d7d8e0c2138a75fa4b5d260376692c703d19ecedb09; current generated and source bytes are revalidated at dispatch.
The default profile's tag filter excludes `@ramify-pending` scenarios, so a plain `cucumber-js <feature>` would run none of your assigned scenarios; the generated profile enables them.

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
Implement the assigned work and run relevant checks. If blocked by another
owner's behavior, submit the original need with the source paths that would
use it and example tests. Report what you already changed in `summary`. A
`capability-needed` result suspends the assignment; it does not assert that
the provider API is absent or that the original goal is complete. A completion
proposal binds, in `bindings`, every obligation the assignment names, each
once as `{ id, fakes }` with the fake names the binding relies on; one that
leaves an assigned obligation out is refused, naming it. Your results report
your work; whether an obligation is done is the responsible architect's own
judgment and report.

## Tests, and what the gate guards

Adding and updating tests is part of the work: state the assigned behavior in
them. Revise a test whose expectation the request explicitly supersedes, and
say so in `summary`. Every other guarantee the project states stays binding.

What you may not do is weaken what the checks cover. The harness captured the
hashes of the committed audit definition (`ramify-audit.json`), the
test-runner and compiler configuration, the package manifests and lockfiles
and the contract artifacts in force before this iteration started, and
compares them at the gate. `edit` and `write` refuse those files unless your
assignment authorizes them, and a change made another way is found at the
gate. Narrowing what the test discovery selects, disabling a suite or deleting
one of those files is a change no record authorizes: the attempt's cause is
`guarded-change`, the verdict is never `passed`, and the iteration goes back
to its architect. Only the architect records an authorization, and only on an
assignment; a guarded file it authorized is listed among the files you may
write. If the work seems to need one, report it with `partial`, naming the
file and why, rather than making the change.

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
    "edit",
    "write",
    "shell",
    "submit_iteration_result"
  ],
  "views": [
    {
      "path": "subs/workspace/subs/shared-ui/src/.ramify",
      "revision": "rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:4",
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "coverage": [
        "1 coverage limits"
      ]
    },
    {
      "path": "subs/workspace/subs/shared-ui/src/tests/.ramify",
      "revision": "rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:4",
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "coverage": [
        "2 coverage limits"
      ]
    }
  ],
  "supportPaths": [
    "subs/harness/src/prompts/engineer-capability.system.md",
    "subs/harness/src/prompts/engineer-capability.procedure.md"
  ],
  "cucumberConfiguration": "{\"kind\":\"available\",\"cwd\":\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review\",\"configPath\":\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-6872601f6cc0af75.json\",\"sourceIdentity\":\"8494e00c3cad0c84baac519c4e7b704b8860ec0b534c84d9d054878bac7f6d61\",\"sourceFiles\":{\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/package.json\":\"8a5adf849dd8634b31bdafac16a278ae3c35683486740bae28ddf3181d89fcfb\",\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/cucumber.js\":\"3157070a8b6effa75a5d4c868f3db3065e0749e8f5226e0dbccd58c2f7856013\"},\"configurationIdentity\":\"6872601f6cc0af757d432d7d8e0c2138a75fa4b5d260376692c703d19ecedb09\",\"argv\":[\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/node_modules/.bin/cucumber-js\",\"--config\",\"subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-6872601f6cc0af75.json\",\"--profile\",\"ramify-focused\"],\"selection\":{\"cwd\":\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review\",\"config\":\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-6872601f6cc0af75.json\",\"profile\":\"ramify-focused\",\"paths\":[\"/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature\"],\"configurationIdentity\":\"6872601f6cc0af757d432d7d8e0c2138a75fa4b5d260376692c703d19ecedb09\"},\"support\":{\"import\":[\"subs/integration-tests/src/support/*.ts\",\"subs/integration-tests/src/steps/**/*.{ts,tsx}\",\"src/tests/steps/**/*.{ts,tsx}\",\"subs/**/src/tests/steps/**/*.{ts,tsx}\"],\"require\":[],\"requireModule\":[],\"loader\":[],\"worldParameters\":{}},\"environmentNames\":[\"HOME\",\"LANG\",\"LC_ALL\",\"LC_CTYPE\",\"LOGNAME\",\"NODE_ENV\",\"NODE_OPTIONS\",\"NODE_VERSION\",\"PATH\",\"SHELL\",\"TERM\",\"npm_config_cache\",\"npm_config_global_prefix\",\"npm_config_globalconfig\",\"npm_config_init_module\",\"npm_config_legacy_peer_deps\",\"npm_config_local_prefix\",\"npm_config_node_gyp\",\"npm_config_noproxy\",\"npm_config_npm_version\",\"npm_config_prefix\",\"npm_config_registry\",\"npm_config_user_agent\",\"npm_config_userconfig\"]}"
}

# Current task: engineering
Perform engineering for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_iteration_result`. Only an accepted submission completes this task.