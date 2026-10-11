# Prompt changes proposed from the gpt-6.1-sol postmortem — before and after

For every correction in
[2026-10-11-status-badge-tone-gpt61-corrections.md](2026-10-11-status-badge-tone-gpt61-corrections.md)
that changes what an agent reads, this document shows the text the run
`20261011T104510Z-0e1b47` actually delivered and the text proposed in its
place. "Current" blocks are copied from the retained task packets under
[2026-10-11-status-badge-tone-gpt61-postmortem/invocations/](2026-10-11-status-badge-tone-gpt61-postmortem/invocations/)
or from the native request's system instructions; long paths and lists are
shortened with `…`. A line ending in `◀` is the defect. "Proposed" blocks are
the replacement wording; where the change is in message assembly rather than
a template, the proposed block shows the result the assembly would produce.

## 1. The completion request's fields

Delivered to inv-0006 as `procedure:local-architect:main`, from
`local-architect-capability.procedure.md`, and inherited by inv-0010.

Current:

```text
Name in `assignment.obligations` the obligations an iteration must bind. Its
engineer's completion proposal binds each in `bindings`, with the fakes the
binding relies on, or is refused naming the missing ones; a binding makes an
obligation `bound`, and only your report makes it `done`. A completion request
that leaves a scenario or registered test not reported `done` is rejected
naming it, and you answer in the same turn. The required gate runs against     ◀ nothing here, or anywhere in the
current source; a passing earlier check is not a verdict on a later candidate.   ◀ procedure, says what a completion
`request-completion` is refused while a capability request is pending, a       ◀ request carries; the schema
delegated task is stopped or lacks an accepted current handback, or any        ◀ requires `outline`
ordinary scenario/review/gate requirement remains. Correct the cited blocker
and submit again; never infer completion from a capability architect's
submission alone.
```

Proposed, with `outline` made optional on `request-completion` in the schema:

```text
List in `assignment.obligations` the obligations the iteration must bind. The
engineer's completion proposal names each one in `bindings`, with any fake it
relies on. A proposal that misses one is refused and told which. A binding
makes an obligation `bound`. Only your report makes it `done`.

A `request-completion` has two parts: a `summary`, and your `reports` on
every scenario and registered test of the work item. Add `outline` only if
you are changing the plan. Without it, the last committed outline stays.

The harness rejects a completion request when:

- a scenario or registered test is not reported `done`. It names the one
  missing; answer in the same turn.
- a capability request is still pending.
- a delegated task is stopped, or has no accepted handback yet.

Reviews that are still running do not block it: the work-item gate waits
for them to finish.

The gate runs against the current source. A check that passed earlier says
nothing about a later candidate. Do not treat a capability architect's
submission as proof the work is complete. When a request is refused, fix
what it names and submit again.
```

The reviews sentence also carries correction 7d: the current text says
completion is refused while a review requirement remains, and the harness
accepted inv-0010's completion during in-flight reviews. The wording keeps
`bound`, `done`, `bindings`, `reports`, `outline` and `summary`, which are
field names the architect has to write.

## 2. The design review's guidance after an orientation

Delivered to inv-0012, a fork of the orientation inv-0011. Two blocks.

Current:

```text
# Block brief:support:design-guidance
Withdrawn; this block no longer applies.                                      ◀ the orientation's guidance, read
                                                                              ◀ in this very session, is withdrawn
…
# Block brief:support:## The guidance this design is judged against:0
Current value; replaces any earlier value for this key.
## The guidance this design is judged against

Each file is part of the audited candidate. If this session has not read one  ◀ the orientation had no
of them yet, read it with `snapshot_read` before you judge.                   ◀ snapshot_read, so this is
                                                                              ◀ always true after a fork
- README.md (sha256 b72856422e9d)
- subs/workspace/README.md (sha256 f5cdda73289e)
- subs/workspace/subs/shared-ui/README.md (sha256 8cec99d7e15b)
```

Proposed, when the request's guidance hashes equal the orientation's (the
`design-guidance` block is left in place, not withdrawn):

```text
## The guidance this design is judged against

This session read these files in its orientation, at the identities below;
they count as already read. Read one again with `snapshot_read` only where its
identity here differs from the one you read, or when a concern cites it as
its ground.

- README.md (sha256 b72856422e9d), read in orientation
- subs/workspace/README.md (sha256 f5cdda73289e), read in orientation
- subs/workspace/subs/shared-ui/README.md (sha256 8cec99d7e15b), read in orientation
```

When a hash differs, that entry reads `(sha256 …), changed since orientation:
read it before you judge`. A fresh design review with no orientation keeps the
current sentence.

## 3. The plan, delivered once

Delivered to inv-0002. Three places.

Current:

```text
# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- # A tone for the status badge                                               ◀ the whole 1,544-byte plan,
                                                                              ◀ as one requirements bullet
The status badge says whether a review passed or failed, but a feature that
wants to draw attention to a badge, or to play one down, has no way to say so.
Give the badge a tone.
…
# Block brief:support:# Plan "status-badge-tone":0
Current value; replaces any earlier value for this key.
# Plan "status-badge-tone"

The plan, as `plans/status-badge-tone/plan.md` read when this run started (doc-001):

<plan>                                                                        ◀ empty: the duplicate was stripped;
</plan>                                                                       ◀ no captured path is given
…
# Current task: initial-analysis
…
Perform initial-analysis for {}; use the current evidence and designated submission.   ◀ `for {}`
```

Proposed:

```text
# Block brief:requirements
# Requirements
- Implement the plan "status-badge-tone", delivered whole in the plan block
  below.
…
# Block brief:support:# Plan "status-badge-tone":0
# Plan "status-badge-tone"

The plan, frozen when this run started. The live file
`plans/status-badge-tone/plan.md` may have changed since and is not this
run's input; if you need the frozen file itself, it is at
`plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/input/plan.md`.

<plan>
# A tone for the status badge

The status badge says whether a review passed or failed, but a feature that
wants to draw attention to a badge, or to play one down, has no way to say so.
Give the badge a tone.
…
</plan>
…
# Current task: initial-analysis
…
Perform initial-analysis; use the current evidence and designated submission.
```

The intake and check tasks (inv-0001, inv-0003) receive the same plan block,
and their procedures' "read the captured plan" step is satisfied by it.

## 4a. Declared checks and test pointers as information

Two variants. The non-snapshot one went to inv-0002 (and the engineer); the
snapshot one to inv-0008 and inv-0009.

Current, inv-0002:

```text
## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `/tmp/…/collection-review`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `/tmp/…/collection-review`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `/tmp/…/collection-review`.
- fixture-structure (none): argv ["/workspaces/ramify-agent/node_modules/.bin/ramify","check",…]; cwd `/tmp/…/collection-review`.
- Configuration/support pointer: `/tmp/…/collection-review/ramify-audit.json`.
- Configuration/support pointer: `/tmp/…/collection-review/ramify-agent.json`.
- Configuration/support pointer: `/tmp/…/collection-review/package.json`.
- Configuration/support pointer: `/tmp/…/collection-review/cucumber.js`.

These are declared checks, not a focused command. Inspect their configuration  ◀ read as an instruction by a
for how to run particular tests. The gate runs the audit; shell refuses whole  ◀ role with no shell and nothing
suites and watch mode.                                                        ◀ to run
```

Current, inv-0008:

```text
## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `.`.
…
- Configuration/support pointer: `ramify-audit.json`.
- Configuration/support pointer: `ramify-agent.json`.
- Configuration/support pointer: `package.json`.
- Configuration/support pointer: `cucumber.js`.

Read these project-relative references with snapshot_read/snapshot_list in    ◀ "Read these": four reads
the audited candidate. Commands describe the declared setup; this reader does  ◀ followed, in this order, in
not execute them.                                                             ◀ both reviewers
…
## Candidate test pointers

- `subs/workspace/subs/shared-ui/src/tests/`: inspect with snapshot_list;     ◀ "inspect": one listing
  read named files with snapshot_read.                                        ◀ followed
```

Proposed, one text for every role, with the project root stated once at the
top of the message and paths relative to it:

```text
## Declared project checks

The gate runs these; nothing here is a command for you to run.

- fixture-type-check: `npm run type-check`
- fixture-tests (vitest): `npm test`
- fixture-scenarios (cucumber): `npm run test:cucumber`
- fixture-structure: `ramify check --batch --format json --no-snapshot`

They are configured in `ramify-audit.json`, `ramify-agent.json`,
`package.json` and `cucumber.js`. Open one only when a concern, or a focused
command you need, depends on it.
```

For the engineer, the paragraph that follows keeps the focused Cucumber
command, stated once. For reviewers:

```text
## Candidate test pointers

The candidate's test area for this module is
`subs/workspace/subs/shared-ui/src/tests/`. Read a file there when a concern
needs it; the complete patches above already show the changed tests.
```

## 4b. Environment blocks selected per role

Delivered to inv-0013, the non-functional coordinator, which has only
snapshot tools. The same nine blocks reach every fresh role.

Current:

```text
# Block environment:projectRoot
Current value; replaces any earlier value for this key.                       ◀ banner on a fresh session,
{                                                                             ◀ repeated on all 9 blocks
  "projectRoot": "/tmp/…/collection-review"
}

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/…/collection-review"                              ◀ absolute host path the
}                                                                             ◀ snapshot tools refuse

# Block environment:candidate
…  "candidate": "6074e7d43cb52ab75f2ceee049677c1a831e47f6"
# Block environment:snapshot
…  "snapshot": "6074e7d43cb52ab75f2ceee049677c1a831e47f6"                     ◀ same value twice

# Block environment:limits
…  { "limits": { "budgetReturnsPerIteration": 6, "commandTimeoutMs": 600000,  ◀ 29 run-policy values;
     "cycleReplansPerWorkItem": 1, … "runAbsoluteMs": 28800000, … } }        ◀ two concern this invocation

# Block environment:availableTools
…  [ "snapshot_read", "snapshot_list", "snapshot_search", "snapshot_diff", "submit_nonfunctional_assessment" ]

# Block environment:views
…  { "views": [ { "coverage": [ "cut: 11", "detailsUnavailable: 4" ],          ◀ an architect view this role's
       "modules": [ …15 module ids… ],                                        ◀ tools cannot open; counts
       "path": "/tmp/…/collection-review/.ramify-architect", … } ] }         ◀ with no record names

# Block environment:supportPaths
…  { "supportPaths": [ "subs/harness/src/nonfunctional/coordinator.system.md", ◀ harness-repository paths;
       "subs/harness/src/nonfunctional/assessment.procedure.md" ] }           ◀ not in the project

# Block environment:cucumberConfiguration
…  { "cucumberConfiguration": null }                                          ◀ null block
```

Proposed for this role (fresh session, so no banners; blocks the role cannot
use are not sent):

```text
# Block environment:candidate
{
  "candidate": "6074e7d43cb52ab75f2ceee049677c1a831e47f6",
  "paths": "project-relative; the snapshot tools read this candidate"
}

# Block environment:limits
{
  "limits": { "invocationAbsoluteMs": 599952, "invocationIdleMs": 300000,
              "rejectedSubmissionsPerTurn": 3 }
}

# Block environment:availableTools
{
  "availableTools": [ "snapshot_read", "snapshot_list", "snapshot_search",
                      "snapshot_diff", "submit_nonfunctional_assessment" ]
}
```

An engineer, which has a shell and reads views, would additionally receive
`projectRoot` once, `workingDirectory`, `views` (API views only, with the
coverage records named as in 5b), `cucumberConfiguration` when it exists, and
`commandTimeoutMs` and `budgetReturnsPerIteration` in `limits`. The
`supportPaths` block is sent to no role.

## 5a. View paths that exist

Delivered to inv-0004 in the local architect's system instructions.

Current:

```text
Start with your module's goal, onboarding, source and received interfaces.
For a session in the module's `src/`, search `.ramify/external` and
`.ramify/children` for ordinary-source interfaces; use                        ◀ shared-ui has no children:
`tests/.ramify/external` and `tests/.ramify/children` for its testing source. ◀ both greps failed
Name the hidden directory explicitly in `grep`'s `path`, then read the
matching pages. Broad searches can skip these ignored directories.
```

Proposed system text, with the concrete directories moved to the task's
`environment:views` block:

```text
Start with your module's goal, onboarding, source and received interfaces.
The task's views block lists the API view directories your module has; search
them for received interfaces, naming the hidden directory explicitly in
`grep`'s `path`, then read the matching pages. Broad searches skip these
ignored directories. Each page mirrors one source file, with `.md` added, and
lists the symbols that file receives; reading a page answers more than
grepping the view.
```

and, for `shared-ui`, the views block:

```text
# Block environment:views
{
  "views": [
    { "area": "src", "path": "subs/workspace/subs/shared-ui/src/.ramify/external",
      "revision": "rev/1:703779dd-…:4" },
    { "area": "src/tests", "path": "subs/workspace/subs/shared-ui/src/tests/.ramify/external",
      "revision": "rev/1:703779dd-…:4" }
  ],
  "note": "This module has no children, so no children view exists."
}
```

## 5b. Coverage limits by name

Delivered to inv-0002 (evidence block) and inv-0007 (views section).

Current, inv-0002:

```text
# This run's evidence

- Architect view: `.ramify-architect/`, revision `rev/1:703779dd-…:1`, input `input/1:8e72f548…`.
- Coverage limits the view reports: cut: 11; detailsUnavailable: 4.          ◀ counts only; the architect
- Source: commit 0244ce24bf63691cadd9b417b5747bf3f64c15df.                     ◀ grepped the whole view for them
```

Current, inv-0007:

```text
- `collection-review/workspace/shared-ui` (src): `subs/workspace/subs/shared-ui/src/.ramify/`
  (`/tmp/…/shared-ui/src/.ramify/` from this cwd); revision `rev/1:703779dd-…:4`;
  coverage limits: 1, so absence is not proof.                                ◀ "1" what?
```

Proposed, inv-0002:

```text
# This run's evidence

- Architect view: `.ramify-architect/`, revision `rev/1:703779dd-…:1`, input `input/1:8e72f548…`.
- Coverage limits the view reports: 11 records are cut (their signatures
  truncated): `integration-tests/src/support/world.ts#CollectionReviewWorld`,
  …; 4 records have no details: …. None is in `workspace/shared-ui`.
- Source: commit 0244ce24bf63691cadd9b417b5747bf3f64c15df.
```

Proposed, inv-0007:

```text
- `collection-review/workspace/shared-ui` (src): `subs/workspace/subs/shared-ui/src/.ramify/`;
  revision `rev/1:703779dd-…:4`. One received symbol is listed without
  details: `<name>`; its absence of a signature is a view limit, not proof
  that it is unavailable.
```

The record names come from the architect index the harness already loads;
the exact lists for this run are not reconstructed here.

## 7a. The selector's "captured document"

Delivered to inv-0005, whose working directory is an empty
`selector-workspace`.

Current:

```text
Select, by ID, the elements an engineer working this work item must keep in
view, each with your reason, conditions and uncertainty. Omitting an element
never waives it: every non-functional and fixed element is assessed against
the final candidate. You may read a captured document to settle a doubt;      ◀ no path; a relative read
answer with IDs only.                                                         ◀ lands in the empty workspace
```

Proposed:

```text
Select, by ID, the elements an engineer working this work item must keep in
view, each with your reason, conditions and uncertainty. Omitting an element
never waives it: every non-functional and fixed element is assessed against
the final candidate. The elements above are quoted whole from the captured
plan; the captured file is `/tmp/…/collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/input/plan.md`
if you need its surrounding text. Answer with IDs only.
```

## 7b. The selector's reasons reach the engineer

Delivered to inv-0006 and inv-0007 in the work-item package. The selector
recorded a reason for each element; the package was built from the catalog.

Current (inv-0007, nfr-001):

```text
> The status badge says whether a review passed or failed, but a feature that
> wants to draw attention to a badge, or to play one down, has no way to say so.
> Give the badge a tone.

Conditions: none recorded.                                                    ◀ the selection record holds a
                                                                              ◀ reason; neither it nor the
Uncertainty: none recorded.                                                   ◀ conditions are delivered
```

Proposed, the catalog's own lines kept and the selection's added under
their own labels:

```text
> The status badge says whether a review passed or failed, but a feature that
> wants to draw attention to a badge, or to play one down, has no way to say so.
> Give the badge a tone.

Conditions: none recorded.
Uncertainty: none recorded.

Selected because: adding tone to the shared badge must retain its
presentation-only ownership and prop-driven rendering rather than introduce
domain or protocol dependencies.
```

The catalog's `Conditions:` and `Uncertainty:` lines stay as the catalog
renders them, so a qualification the plan states is never displaced by the
selector's reading. `Selection conditions:` and `Selection uncertainty:` lines
follow `Selected because:` only when the selection record has them.

## 7c. The completion continuation sends deltas

Delivered to inv-0010, continuing the session that received the same blocks
at assignment time.

Current (block keys and sizes):

```text
# Block brief:support:## The scenarios of this work item:0        (2,462 bytes) ◀ unchanged since assignment;
…                                                                              ◀ sc-003's bindings listed 4×
# Block brief:support:## The bounds of an engineer:0                (419 bytes) ◀ identical to the earlier value
…
# Block brief:support:## Earlier outlines:0
Current value; replaces any earlier value for this key.
## Earlier outlines

This work item already has 1 outline revision(s).                             ◀ a count; the outline itself
                                                                              ◀ is in this session
```

Proposed:

```text
# Block brief:support:## The scenarios of this work item:0
## The scenarios of this work item

sc-001, sc-002, sc-003: bound by wi-001.i01 (no fakes), gate ga-0002 passed.
Their text is unchanged from your assignment message. Report each one `done`
in this submission; a completion request that leaves one without a done
report is rejected.

(bounds block: not re-sent; the earlier value stands)

# Block brief:support:## Earlier outlines:0
## Outline

Revision 1, the one you assigned, stands. Include `outline` only to revise it.
```

## 7e. The assessment's action paragraph

Delivered to inv-0013, whose only submission tool is
`submit_nonfunctional_assessment`.

Current:

```text
Submit one result for every element ID of the package through
`submit_nonfunctional_assessment`. Use `undetermined` when the available
evidence cannot establish an intermediate or final condition. Preserve the
element wording and state inspected scope, evidence, and remaining           ◀ the schema has no field for
uncertainty for each result.                                                  ◀ the wording

When asked for an action, use the named action tool to request a sequential   ◀ no action tool is offered
investigation, one repair batch, or closure. An investigation reports        ◀ in this invocation
evidence only for its named element IDs, which it receives whole. …
```

Proposed, for the assessment task (the action paragraph is delivered only
with an action task, where the tool exists):

```text
Submit one result for every element ID of the package through
`submit_nonfunctional_assessment`. Use `undetermined` when the available
evidence cannot establish an intermediate or final condition. For each result
state the inspected scope, the evidence and the remaining uncertainty; the
element's wording is the package's and need not be repeated.
```

## Not shown here

Corrections that change no delivered text: the call ID on rejections (1c),
the orientation running outside review slots (2b), `snapshot_diff` answering
"unchanged" (6), the metric states, and the toolkit items (the view README's
`module.json` path and the `z.infer` display).
