Briefing revision: 79e9c72d38a22bd3b168a5b36722bb56c3edcf9d9bbf423e22404ecbc43d5eae; based on: cfdc8bba07084fa90f6ca08e3239fa0169cd855015d5892410afcd4d87a97c2b (delta)

# Block brief:support:## The scenarios of this work item:0
Current value; replaces any earlier value for this key.
## The scenarios of this work item

Its entry has 2 scenarios. The harness wrote each into its feature file,
and no agent edits a feature file. The work item completes only when you have reported every one `done`.

### sc-001 (bound): A badge given a tone carries that tone in its markup

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"
```

### sc-002 (bound): A badge given no tone carries neutral

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.

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


# Block brief:support:## The bounds of an engineer:0
Current value; replaces any earlier value for this key.
## The bounds of an engineer

Unless an assignment raises them, one shell command may run 600000 ms, a session may go 300000 ms without a sign of activity, and one invocation may run 3600000 ms.
`assignment.bounds` raises them for one iteration, each with its reason, up to 1800000, 1800000 and 10800000 ms.


# Block brief:support:## The iteration you last assigned:0
Current value; replaces any earlier value for this key.
## The iteration you last assigned

`wi-001.i01` ended `accepted`, committed as b999ea9a913557a04d3e2309247093027ad6b9f8.
Its engineers ran under a command maximum of 600000 ms, an idle bound of 300000 ms and an absolute bound of 3600000 ms.

The scenarios its gate passed, and the step definition that bound each step:

- `sc-001` "A badge given a tone carries that tone in its markup" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:11`, bound by:
  - `a badge for a passed review with the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:27`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:41`
  - `its markup carries the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:45`
  - `it still reads "Passed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:55`
- `sc-002` "A badge given no tone carries neutral" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:18`, bound by:
  - `a badge for a failed review with no tone` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:36`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:41`
  - `its markup carries the tone "neutral"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:45`

Step locations identify loaded definitions; they do not establish import or exposure provenance. Retain unknown locations as unknown.

Assign the next iteration, or request completion and let the work item's gate answer.


# Block brief:support:## Earlier outlines:0
Current value; replaces any earlier value for this key.
## Earlier outlines

This work item already has 1 outline revision(s).



# Block brief:support:# Registered obligations:0
Current value; replaces any earlier value for this key.
# Registered obligations

You are the responsible architect for these. Report one with `reports: [{ id, judgment: "done", basedOnRevision, where? }]` when, in your judgment, it is correctly implemented and passing; `basedOnRevision` is the revision shown. An engineer's accepted binding makes an obligation `bound` and names the fakes it relies on; a gate or audit result is execution evidence beside the status. Neither is your report, and neither changes one; your report is accepted whatever the fakes list says. Revise an earlier `done` with judgment "bound". Name the obligations an iteration binds in `assignment.obligations`. `where` is an optional short navigation hint; the harness stores it and never reads it.

- sc-001 (scenario): bound, revision 0; bound by inv-0007 with no fakes; no report yet
- sc-002 (scenario): bound, revision 0; bound by inv-0007 with no fakes; no report yet

# Block brief:support:starting-points
Current value; replaces any earlier value for this key.
## Recorded starting points

Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.
Paths below resolve from the project root; structured submissions keep project-relative paths.

- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"StatusBadge tone contract, neutral default, and data-tone rendering.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Static-markup coverage for tones and wording preservation.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx","note":"Real-provider Cucumber bindings with per-scenario World state.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}

# Current task: assignment
This selection supersedes every prior task selection.
Active role: local-architect
Selected procedure: procedure:local-architect:main; SHA-256: 4e2cfd79fbf8625ba91d88351836112ca6680fc2393e25f1ed40e0c1c20ebef3
Perform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_work_item_result`. Only an accepted submission completes this task.