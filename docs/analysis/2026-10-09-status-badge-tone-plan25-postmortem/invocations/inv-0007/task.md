Briefing revision: 248550fe58fbdf2bdb3948bf93c3dbddd233b8ddca182bc87e13dd17f65f9b39; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Implement optional StatusBadge tone markup with a neutral default, preserve all existing wording and caller behavior, and bind both status-badge-tone acceptance scenarios.

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- The focused shared-ui unit tests demonstrate the allowed explicit tone in data-tone, neutral on omission, and unchanged status/custom-label wording; both supplied Cucumber scenarios are bound to the real StatusBadge static markup with no fakes and pass; project type-check, tests, scenarios, and structural audit remain green.

# Block brief:support:## Approach the architect asked for:0
Current value; replaces any earlier value for this key.
## Approach the architect asked for

In `status-badge.tsx`, add an optional tone prop constrained to exactly neutral/positive/warning/critical and emit `data-tone` using neutral when omitted, while leaving data-status and label/default-label selection intact. Extend the existing static-markup Vitest suite to cover an explicit tone, the neutral default, and wording preservation. Add TypeScript/TSX Cucumber steps under this module’s `src/tests/steps/` that render StatusBadge to static markup and bind both supplied scenarios; keep scenario state isolated and declare no fake dependency because the real pure presentation primitive is exercised. Do not edit the generated feature file or require changes from existing feature-view callers.


# Block brief:support:## What the plan asks of this iteration:0
Current value; replaces any earlier value for this key.
## What the plan asks of this iteration

The elements your assignment cites, whole, with the plan deviations in force when it was assigned. The captured documents are not yours to read: what these elements do not settle is a finding.


Your starting module is `collection-review/workspace/shared-ui`. Your working directory is `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src`. Relative tool paths and shell commands start there.


# Block brief:support:## What you may write (project-relative paths):0
Current value; replaces any earlier value for this key.
## What you may write (project-relative paths)

- `subs/workspace/subs/shared-ui/` and everything beneath it

Nothing else. Beneath these roots, child modules, nested projects and guarded files stay excluded unless this list names them. A write outside this scope is refused before it happens; report the need instead of working around it.


# Block brief:support:## What you may import:0
Current value; replaces any earlier value for this key.
## What you may import

Imports from other modules are answered by the API view of the module that imports, not by other modules' source:

- `collection-review/workspace/shared-ui` (src): `subs/workspace/subs/shared-ui/src/.ramify/` (project-relative; open `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/.ramify/` from this cwd); revision `rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:4`; coverage limits: 1, so absence is not proof.
- `collection-review/workspace/shared-ui` (src/tests): `subs/workspace/subs/shared-ui/src/tests/.ramify/` (project-relative; open `/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/.ramify/` from this cwd); revision `rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:4`; coverage limits: 2, so absence is not proof.

A symbol you need that is not there is reported with `capability-needed`, with the actual calling code and missing behavior; it is never imported anyway.


# Block brief:support:## Completion evidence:0
Current value; replaces any earlier value for this key.
## Completion evidence


The gate commits a candidate and asks for the project's committed audit of it at the `iteration` checkpoint:
the project's own configured checks, its tests and scenarios among them, selected by the audit provider.
The harness runs no test selection of its own and names no test to run.

The tests this assignment owns are those of collection-review/workspace/shared-ui, in:
- `subs/workspace/subs/shared-ui/src/tests/` (`collection-review/workspace/shared-ui`)

To see how particular tests run before you propose completion, name their files to the project's runner from `shell`,
Inspect the project's declared audit and package scripts for its focused test command.
A whole-suite run is refused there: the gate's audit runs it.


# Block brief:support:## Obligations to bind:0
Current value; replaces any earlier value for this key.
## Obligations to bind

The architect assigned these to this iteration:

- `sc-001`: scenario "A badge given a tone carries that tone in its markup"
- `sc-002`: scenario "A badge given no tone carries neutral"

Your completion proposal's `bindings` names each of them exactly once, as `{ id, fakes }`: a binding declares that
the step definitions or test for it exist. `fakes` lists the fake class or export names the binding relies on,
each carrying `Fake`; leave it empty where it runs against the real provider. A proposal that leaves one out is
refused with the missing IDs; report `partial` with what is unfinished instead. A binding is your report of work,
never the architect's judgment that the obligation is done.


# Block brief:support:## Scenarios to bind:0
Current value; replaces any earlier value for this key.
## Scenarios to bind

The architect expects this iteration to bind these:

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


# Block brief:support:## Binding a scenario:0
Current value; replaces any earlier value for this key.
## Binding a scenario

- Write step definitions in `src/tests/steps/` of a module within your write scope (a testing module's `src/steps/`). Candidate step locations are `subs/workspace/subs/shared-ui/src/tests/steps/`. Effective project configuration determines which support files are actually loaded; these directories alone establish no import provenance.
- Never edit a feature file. The harness writes them, and a write to one is refused.
- Bind each assigned scenario in `bindings` of your completion proposal once its step definitions bind its steps, naming the fakes they rely on. Binding removes its pending tag, so the next gate's audit runs it through the project's configured scenario check; a pending scenario is not run.
- Import another owner's step file by name, as `import { reviewSteps } from '…'`, never with a symbol-free
  `import '…'`: a symbol-free import loads the file without Ramify verifying that its owner exposes it.


# Block brief:support:## The tree you start from:0
Current value; replaces any earlier value for this key.
## The tree you start from

The last accepted boundary is commit `c76c24eee5847debd467199431e3aa504a90b288`. The harness tracks work since that boundary, including this iteration. Inspect the current files; you never run Git.
Uncommitted changes are that work; the gate commits a candidate before checking it. A candidate commit is not acceptance.

Work within the scope above and end your turn with `submit_iteration_result`.


# Block brief:support:# Exact focused scenario command:0
Current value; replaces any earlier value for this key.
# Exact focused scenario command

cd '/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review' && '/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/node_modules/.bin/cucumber-js' '--config' 'subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-531adc40b48e5fbc.json' '--profile' 'ramify-focused'
Support/world/loader: {"import":["subs/integration-tests/src/support/*.ts","subs/integration-tests/src/steps/**/*.{ts,tsx}","src/tests/steps/**/*.{ts,tsx}","subs/**/src/tests/steps/**/*.{ts,tsx}"],"require":[],"requireModule":[],"loader":[],"worldParameters":{}}
Environment names: HOME, LOGNAME, NODE_ENV, NODE_OPTIONS, NODE_VERSION, PATH, SHELL, TERM, npm_config_cache, npm_config_global_prefix, npm_config_globalconfig, npm_config_init_module, npm_config_legacy_peer_deps, npm_config_local_prefix, npm_config_node_gyp, npm_config_noproxy, npm_config_npm_version, npm_config_prefix, npm_config_registry, npm_config_user_agent, npm_config_userconfig. Config SHA-256 531adc40b48e5fbc16a996e0865f363aceeec2b1ef17074e53c11ed984cfcbdd; current generated and source bytes are revalidated at dispatch.
The default profile's tag filter excludes `@ramify-pending` scenarios, so a plain `cucumber-js <feature>` would run none of your assigned scenarios; the generated profile enables them.

# Block brief:support:assignment-package
Current value; replaces any earlier value for this key.
# Plan context package

Catalog: 9420af41d23a7174a0f0f89f54ed02753e391e8cee5939dea0fbf75cb6191f43
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


# Block brief:support:starting-points
Current value; replaces any earlier value for this key.
## Recorded starting points

Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.
Paths below resolve from the project root; structured submissions keep project-relative paths.

- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"Extend the current props and span markup while preserving defaultLabels and label semantics.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Existing renderToStaticMarkup tests establish the regression style and current guarantees.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature","note":"Read-only harness-owned scenarios whose exact steps must be bound from src/tests/steps/.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}

# Block brief:support:declared-checks
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


# Block procedure:engineer:main
Current value; replaces any earlier value for this key.
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

In `completion-proposed` or `partial`, optionally include `startingPoints`
for a few useful source, test, support, caller or API-view locations you
already encountered, each with a short note about what to inspect. Paths
are literal and project-relative. These hints authorize no writes and
establish no completion or obligation. No extra discovery turn is required;
you may omit them.

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
    "edit",
    "write",
    "shell",
    "submit_iteration_result"
  ]
}

# Block environment:views
Current value; replaces any earlier value for this key.
{
  "views": [
    {
      "coverage": [
        "1 coverage limits"
      ],
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "path": "subs/workspace/subs/shared-ui/src/.ramify",
      "revision": "rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:4"
    },
    {
      "coverage": [
        "2 coverage limits"
      ],
      "modules": [
        "collection-review/workspace/shared-ui"
      ],
      "path": "subs/workspace/subs/shared-ui/src/tests/.ramify",
      "revision": "rev/1:a4552a91-486a-40bb-bbb9-21d19892fe49:4"
    }
  ]
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/prompts/engineer-capability.system.md",
    "subs/harness/src/prompts/engineer-capability.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": "{\"kind\":\"available\",\"cwd\":\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review\",\"configPath\":\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-531adc40b48e5fbc.json\",\"sourceIdentity\":\"0da4c89151b5a08b68607831344d4486ab7d037f0c4bb74a2cf3e20b00676991\",\"sourceFiles\":{\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/package.json\":\"8a5adf849dd8634b31bdafac16a278ae3c35683486740bae28ddf3181d89fcfb\",\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/cucumber.js\":\"3157070a8b6effa75a5d4c868f3db3065e0749e8f5226e0dbccd58c2f7856013\"},\"configurationIdentity\":\"531adc40b48e5fbc16a996e0865f363aceeec2b1ef17074e53c11ed984cfcbdd\",\"argv\":[\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/node_modules/.bin/cucumber-js\",\"--config\",\"subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-531adc40b48e5fbc.json\",\"--profile\",\"ramify-focused\"],\"selection\":{\"cwd\":\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review\",\"config\":\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tmp/ramify-focused/wi-001.i01/cucumber-focused-531adc40b48e5fbc.json\",\"profile\":\"ramify-focused\",\"paths\":[\"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature\"],\"configurationIdentity\":\"531adc40b48e5fbc16a996e0865f363aceeec2b1ef17074e53c11ed984cfcbdd\"},\"support\":{\"import\":[\"subs/integration-tests/src/support/*.ts\",\"subs/integration-tests/src/steps/**/*.{ts,tsx}\",\"src/tests/steps/**/*.{ts,tsx}\",\"subs/**/src/tests/steps/**/*.{ts,tsx}\"],\"require\":[],\"requireModule\":[],\"loader\":[],\"worldParameters\":{}},\"environmentNames\":[\"HOME\",\"LOGNAME\",\"NODE_ENV\",\"NODE_OPTIONS\",\"NODE_VERSION\",\"PATH\",\"SHELL\",\"TERM\",\"npm_config_cache\",\"npm_config_global_prefix\",\"npm_config_globalconfig\",\"npm_config_init_module\",\"npm_config_legacy_peer_deps\",\"npm_config_local_prefix\",\"npm_config_node_gyp\",\"npm_config_noproxy\",\"npm_config_npm_version\",\"npm_config_prefix\",\"npm_config_registry\",\"npm_config_user_agent\",\"npm_config_userconfig\"]}"
}

# Current task: engineering
This selection supersedes every prior task selection.
Active role: engineer
Selected procedure: procedure:engineer:main; SHA-256: 0d4cb9c33bba836d49debfdebcd19779d3d852021f53d76f7ceb36dbec288655
Perform engineering for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_iteration_result`. Only an accepted submission completes this task.