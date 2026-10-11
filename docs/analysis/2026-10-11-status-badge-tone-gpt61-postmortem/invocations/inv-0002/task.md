Briefing revision: a31e49b51f8851c522d2412225675501a90237826702da2461c89c69c0cd6e8f; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Give the status badge a tone so a feature can draw attention to it or play it down. StatusBadge takes an optional tone of neutral, positive, warning or critical and carries it as a data-tone attribute beside data-status, readable by the stylesheet and tests without matching on the label. A badge rendered without a tone reads as neutral.

# Block brief:requirements
Current value; replaces any earlier value for this key.
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


# Block brief:support:# Plan "status-badge-tone":0
Current value; replaces any earlier value for this key.
# Plan "status-badge-tone"

The plan, as `plans/status-badge-tone/plan.md` read when this run started (doc-001):

<plan>
</plan>


# Block brief:support:# The plan's scenarios:0
Current value; replaces any earlier value for this key.
# The plan's scenarios

The harness extracted 2 scenarios from the `gherkin` blocks of the plan documents the intake incorporated. Each appears exactly once in your submission. Use one as the origin of an entry scenario, restating its text as written here, or as an integration scenario with its sub-scenarios.


# Block brief:support:## ps-01: A badge given a tone carries that tone in its markup:0
Current value; replaces any earlier value for this key.
## ps-01: A badge given a tone carries that tone in its markup

Lines 34–38 of doc-001.

```gherkin
Scenario: A badge given a tone carries that tone in its markup
  Given a badge for a passed review with the tone "warning"
  When the badge is rendered
  Then its markup carries the tone "warning"
  And it still reads "Passed"
```


# Block brief:support:## ps-02: A badge given no tone carries neutral:0
Current value; replaces any earlier value for this key.
## ps-02: A badge given no tone carries neutral

Lines 40–43 of doc-001.

```gherkin
Scenario: A badge given no tone carries neutral
  Given a badge for a failed review with no tone
  When the badge is rendered
  Then its markup carries the tone "neutral"
```


# Block brief:support:# This run's evidence:0
Current value; replaces any earlier value for this key.
# This run's evidence

- Architect view: `.ramify-architect/`, revision `rev/1:703779dd-cce1-490f-843d-1647a6f11987:1`, input `input/1:8e72f5488332acb0b25365773781a1f45c4741802f3834e7c2aaa2048e813c9e`.
- Coverage limits the view reports: cut: 11; detailsUnavailable: 4.
- Source: commit 0244ce24bf63691cadd9b417b5747bf3f64c15df.

Analyse the plan with the procedure above and submit with `submit_initial_analysis`.

# Block brief:support:accepted-intake
Current value; replaces any earlier value for this key.
Accepted intake classifications and incorporation: {"catalog":{"schema":"ramify-agent.element-catalog/1","manifestHash":"e3dab693f86b251b124ef993630d2cdf8d92827f66d776cf0eb260cf3f1d79e6","documents":[{"id":"doc-001","path":"plans/status-badge-tone/plan.md","kind":"plan"}],"elements":[{"kind":"non-functional","document":"doc-001","text":"The badge stays a presentation primitive of the shared UI: it learns nothing about records, reviews or protocols, and the tone arrives as a prop like everything else it renders.","conditions":[],"uncertainty":"","locator":"Constraints","id":"nfr-001"},{"kind":"non-functional","document":"doc-001","text":"`status` and `label` keep their meaning. A tone never changes the word the badge shows.","conditions":[],"uncertainty":"","locator":"Constraints","id":"nfr-002"},{"kind":"non-functional","document":"doc-001","text":"No feature view has to change. Existing callers keep rendering the badge as they do today.","conditions":[],"uncertainty":"","locator":"Constraints","id":"nfr-003"},{"kind":"non-functional","document":"doc-001","text":"The badge's existing tests still pass, and the tone has tests of its own.","conditions":[],"uncertainty":"","locator":"Acceptance","id":"nfr-004"}],"retired":[]},"incorporation":{"schema":"ramify-agent.document-incorporation/2","documents":[{"document":"doc-001","scenarios":true,"uncertainty":""}],"missing":[]}}

# Block brief:support:declared-checks
Current value; replaces any earlier value for this key.
## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review`.
- fixture-structure (none): argv ["/workspaces/ramify-agent/node_modules/.bin/ramify","check","--batch","--format","json","--no-snapshot"]; cwd `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review`.
- Configuration/support pointer: `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/ramify-audit.json`.
- Configuration/support pointer: `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/ramify-agent.json`.
- Configuration/support pointer: `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/package.json`.
- Configuration/support pointer: `/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/cucumber.js`.

These are declared checks, not a focused command. Inspect their configuration for how to run particular tests. The gate runs the audit; shell refuses whole suites and watch mode.


# Block procedure:initial-architect:main
Current value; replaces any earlier value for this key.
# Current procedure
The analysis has four parts. Record no hypothesis that restates an entry.
Entry assignments and hypotheses never merge.

The accepted intake elements supplied with this task are already recorded; do
not classify them again. Non-functional means a constraint on how the work is
done or what the candidate must preserve, rather than a delivered behavior.

**Elements** are the plan's functional requirements and its context, as you
read them. Every later agent of the run works from elements instead of the
plan: the work item of an entry receives exactly the elements the entry
cites, whole, and nothing else of the plan. Other readers extract the plan's
non-functional requirements and recommendations and the principles
documents' rules; you extract neither.

**Entry assignments** name the entry capabilities the plan asks for directly,
each with the module that owns it, the functional elements that state its
requirements and its acceptance, the context elements a reader needs to
understand it, and its acceptance scenarios. They become executable work.

**Acceptance scenarios** are Gherkin scenarios that state, at the outside,
what each entry capability must do for the plan to be finished. Every entry
has at least one. A plan scenario is one the plan itself writes in a
`gherkin` block; the harness extracted each one, and the message below lists
them as `ps-01`, `ps-02` and so on. Its authority is the plan's, so you
assign it and never rewrite it. An architect scenario is one you write for an
entry; its authority is the person's review. When the analysis is accepted,
every scenario's text is frozen for the rest of the run: nobody adds, changes
or removes one afterwards, and engineers bind them with step definitions.

**Hypotheses** forecast what the plan will need deeper in the tree: a
capability that could be reused, created, or created by extracting what
exists. A hypothesis is a forecast and nothing more. No work item, no
obligation and no completion requirement is ever derived from one; it informs
the architects who later decide with current evidence, and revision 1 of each
is never rewritten, so the forecast and what happened stay comparable.

One work item is created per entry capability, always, and its module is the
entry's owner and its goal the entry's description. Two related capabilities
in one module get two work items.

Do this, in order:

1. Read the plan in the message below, in full, and every accompanying plan
   document the message lists, at its captured path.
2. Submit the plan's `functional` elements: what the plan delivers, its
   acceptance statements included. The unit is a requirement, not a
   sentence: an element is as long as its source needs to state one
   requirement so that it can be understood and honored on its own, a
   bullet, a paragraph, a table with its heading or a whole section with its
   example and qualifications. Keep the text as close to the plan's wording
   as practical, name the captured plan document it comes from, record each
   condition as `stated` or `inferred`, and state your uncertainty. Give
   each a `key` unique in the submission; the harness assigns its ID.
3. Submit the plan's `context` elements: the passages that explain the
   situation the plan starts from or why it exists, which a reader of an
   entry needs to understand it. One element is one whole explanation. A
   statement that only says what the plan does not deliver is no element.
4. Read the plan scenarios the message lists: the harness numbered them
   `ps-01`, `ps-02`, … across the plan documents the intake incorporated.
   Their `When` steps name what the outside does, which is where entry
   capabilities are found.
5. Orient yourself on the architect view with the skill: the module map, each
   module's purpose and its headline symbols.
6. Name the plan's entry capabilities. An entry capability is one the plan
   requires that is used from outside the plan: by a person, by an external
   system, or by a part of the project the plan does not change. It is always
   new, since otherwise the plan would already be satisfied, and no other
   capability of the plan depends on it. Give each one a kebab-case slug, the
   owner's declared-name path, the keys of the functional elements that
   state its requirement (`requirementRefs`) and its acceptance
   (`acceptanceRefs`), the keys of the context elements its reader needs
   (`contextRefs`), and the citations that show where it belongs. The slug
   `integration` is reserved for the file integration scenarios are written
   to.
7. An owner that does not exist yet needs a `proposed` module: its parent as
   the view names it, its directory as a direct child under that parent's
   `subs/`, its purpose and its tags. The owner, the directory and the
   declaration name must agree, and no module may already occupy that
   directory. A hypothesis gives no authority to create anything.
8. Match every plan scenario to the entries. A plan scenario that one entry
   carries out alone becomes that entry's scenario: set its `origin` to
   `{ "kind": "plan", "planScenario": "ps-NN" }` and restate its `gherkin`
   exactly as the message shows it, from its `Scenario` line on, without tags.
   The harness compares the two after collapsing whitespace, so any other
   difference is rejected.
9. A plan scenario that combines several entries is an integration scenario.
   List it in `integrationScenarios` with the keys of its sub-scenarios, and
   write one sub-scenario per entry it involves, each with `origin`
   `{ "kind": "architect" }` and `partOf` naming the plan scenario. Build
   each sub-scenario by picking the integration scenario's steps verbatim,
   keyword and text: every step of the integration scenario must appear in
   one of its sub-scenarios. Where a slice leaves out another entry's action,
   bridge it with a `Given` that states the state that action leaves, such as
   `Given an email to ada@example.com was sent`.
10. Write scenarios for every entry that has none yet. Each is one `Scenario`
   or `Scenario Outline` with at least one step and no tags, with an abstract
   interaction and the concrete data the plan states or implies. Name no
   module, file, symbol or deeper capability: a scenario states behavior at
   the outside, not how the tree implements it. Give it `origin`
   `{ "kind": "architect" }`.
   In every scenario's `refs`, plan scenarios included, name the keys of the
   acceptance elements it verifies. Together, an entry's scenarios cite every
   one of its `acceptanceRefs`.
11. For each need the plan implies below its entry points, search the view for
   behavior that already exists. Record a need existing behavior already
   covers as a hypothesis with `change: "reuse"`, its suggested owner, the
   consumers you anticipate, and the modules it involves. Record a need
   nothing covers as `"create"`, or as `"create-by-extraction"` where the
   behavior exists but sits in a module that should not own it.
12. A need that extends existing behavior is a new capability, never a change
    to one that exists. Name the extended behavior for itself, such as
    `send-email-with-attachment` beside `send-email`, forecast it as
    `"create"` with the module that already holds the behavior as its
    suggested owner, and record no relation to the capability it extends.
13. Set `changesExistingSymbols` where implementing the forecast capability
    would change symbols that already have consumers. It is what break
    analysis reads later; an extension of existing behavior is the usual case
    for it.
14. Give every hypothesis its rationale, its confidence, its assumptions, its
    uncertainties and at least the citations that let someone else verify it.
    A citation names a module of the architect view, and what it
    names must be there: a symbol it cites must be an exported original that
    module owns.
15. Record in `coverageLimits` every statement the view makes about what it
    could not establish, and every question you could not answer from it.
    Absence of evidence in a view with limits is not evidence of absence.
16. Submit with `submit_initial_analysis`.

The harness applies the scenarios' form rules after every other rule, in
this order, and answers with the first one broken:

1. Every `gherkin` value is exactly one `Scenario` or `Scenario Outline`,
   with at least one step and no tags.
2. Every scenario has a key unique in the submission and names one entry of
   the submission.
3. Every plan scenario appears exactly once: as the origin of one entry
   scenario, restated as the plan states it, or as one integration scenario
   with at least one sub-scenario.
4. Every entry has at least one scenario.
5. Every step of an integration scenario appears verbatim in one of its
   sub-scenarios.
6. Every acceptance element of every entry is cited in the `refs` of at
   least one of its scenarios.

It also records warnings, which never reject and are shown to the person who
reviews the analysis: a step that names an exported symbol or a file the
architect view records, a sub-scenario that takes none of its steps from its
integration scenario, and two architect scenarios of one entry with identical
steps.

# Block environment:projectRoot
Current value; replaces any earlier value for this key.
{
  "projectRoot": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review"
}

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review"
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
    "submit_initial_analysis"
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
      "path": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/.ramify-architect",
      "revision": "rev/1:703779dd-cce1-490f-843d-1647a6f11987:1"
    }
  ]
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/prompts/initial-architect.system.md",
    "skills/module-architect/SKILL.md",
    "subs/harness/src/prompts/initial-analysis.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": null
}

# Current task: initial-analysis
This selection supersedes every prior task selection.
Active role: initial-architect
Selected procedure: procedure:initial-architect:main; SHA-256: 76bb97e10f990b9682f3853e6b6a9924a0d13e85bb967b768e2efea7ba28b60b
Perform initial-analysis for {}; use the current evidence and designated submission.

Submit only through `submit_initial_analysis`. Only an accepted submission completes this task.