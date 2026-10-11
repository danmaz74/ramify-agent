Briefing revision: 4b1a4cfb67ab19214ced94ea242beb4f6f71a2b7d6560bf5e573f510eb82e655; based on: a957da0ab02eb45597e8ecf66621641ab3cd46fcdb644190a5519d49804743b4 (delta)

# Block brief:support:## The scenarios of this work item:0
Current value; replaces any earlier value for this key.
## The scenarios of this work item

Its entry has 3 scenarios. The harness wrote each into its feature file,
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

### sc-003 (bound): Every supported tone is readable independently of the label

- Feature file: `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature`.

```gherkin
Scenario Outline: Every supported tone is readable independently of the label
  Given a badge with status "failed", label "Needs attention" and tone "<tone>"
  When the badge is rendered
  Then the badge's data-tone attribute is "<tone>"
  And the same badge's data-status attribute is "failed"
  And it still reads "Needs attention"
  Examples:
    | tone     |
    | neutral  |
    | positive |
    | warning  |
    | critical |
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

`wi-001.i01` ended `accepted`, committed as e6356f5d329a6fac66cb412f8688128789b1ca08.
Its engineers ran under a command maximum of 600000 ms, an idle bound of 300000 ms and an absolute bound of 3600000 ms.
- Finding: Focused Vitest run: npm test -- subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx passed all 26 tests, including the two existing tests.
- Finding: Supplied focused Cucumber profile passed 6 scenarios and 33 steps: sc-001, sc-002 and all four sc-003 examples. No fakes or replacement World were used.
- Finding: Bindings reside in tests/steps/status-badge-tone.steps.tsx: sc-001 uses the passed-review/tone Given, render When, markup-tone Then and rendered-label Then; sc-002 uses the failed-review/no-tone Given, render When and markup-tone Then; sc-003 uses the status/label/tone Given, render When, data-tone Then, same-badge data-status Then and rendered-label Then.
- Finding: Attribute and label assertions inspect one rendered span via tests/badge-markup.ts. State is isolated by scenario World using a WeakMap.
- Finding: No consumers, feature files, root configuration or module declarations were changed. Root-wide audit checks remain the gate's responsibility.

The scenarios its gate passed, and the step definition that bound each step:

- `sc-001` "A badge given a tone carries that tone in its markup" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:12`, bound by:
  - `a badge for a passed review with the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:36`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `its markup carries the tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:59`
  - `it still reads "Passed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:71`
- `sc-002` "A badge given no tone carries neutral" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:19`, bound by:
  - `a badge for a failed review with no tone` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:41`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `its markup carries the tone "neutral"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:59`
- `sc-003` "Every supported tone is readable independently of the label" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:33`, bound by:
  - `a badge with status "failed", label "Needs attention" and tone "neutral"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:46`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `the badge's data-tone attribute is "neutral"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:63`
  - `the same badge's data-status attribute is "failed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:67`
  - `it still reads "Needs attention"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:71`
- `sc-003` "Every supported tone is readable independently of the label" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:34`, bound by:
  - `a badge with status "failed", label "Needs attention" and tone "positive"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:46`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `the badge's data-tone attribute is "positive"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:63`
  - `the same badge's data-status attribute is "failed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:67`
  - `it still reads "Needs attention"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:71`
- `sc-003` "Every supported tone is readable independently of the label" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:35`, bound by:
  - `a badge with status "failed", label "Needs attention" and tone "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:46`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `the badge's data-tone attribute is "warning"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:63`
  - `the same badge's data-status attribute is "failed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:67`
  - `it still reads "Needs attention"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:71`
- `sc-003` "Every supported tone is readable independently of the label" passed in `fixture-scenarios`, at `subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature:36`, bound by:
  - `a badge with status "failed", label "Needs attention" and tone "critical"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:46`
  - `the badge is rendered` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:53`
  - `the badge's data-tone attribute is "critical"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:63`
  - `the same badge's data-status attribute is "failed"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:67`
  - `it still reads "Needs attention"` → `subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx:71`

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
- sc-003 (scenario): bound, revision 0; bound by inv-0007 with no fakes; no report yet

Consultation context: global-fork, session ses-0002, point {"session":"ses-0002","invocation":"inv-0002"}. Inherited observations may be stale; current files and generated views can differ.

# Current task: assignment
This selection supersedes every prior task selection.
Active role: local-architect
Selected procedure: procedure:local-architect:main; SHA-256: 4e2cfd79fbf8625ba91d88351836112ca6680fc2393e25f1ed40e0c1c20ebef3
Perform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.

Submit only through `submit_work_item_result`. Only an accepted submission completes this task.