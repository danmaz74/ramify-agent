<!-- ramify-agent architect implementation guidance, version 6. -->
## Exposure, paths and module engineer verification

Use the installed pinned Ramify provider's supported declarations. A declaration
starts with `ramify 1` and its `module` name. `expose-src helper, HelperType
from "helper.ts" to parent` selects named owned exports relative to `src/`;
`expose-test makeFixture, Fixture from "fixture.ts" to descendants` selects
owned exports relative to `src/tests/`, preserving testing restrictions.
`expose-src *` applies only to one named file under `src/interfaces/`.
`expose-sub helper, HelperType from child to parent` selects symbols received
from that direct child; `*` selects what the child exposes to this module.
Preserve tag restrictions and expose every named signature type with its behavior.

Exposure to descendants already reaches all target descendants. Re-exposure
is needed along the path to the exposing ancestor, not at each intermediate
descendant. Inspect the affected declarations and the consumer's current
ordinary or testing API evidence; pre-change absence differs from refreshed
post-exposure availability.

Name the actual project-relative consumer and provider files before proposing
an import. Resolve its relative path from the consumer file's directory; verify
provisional request paths instead of forwarding them unchecked. Path resolution
alone does not prove importability: the consumer API evidence and provider
check establish it.

When source or provider evidence contradicts a plan or assignment, explicitly
revise the authoritative design and subsequent assignment before handback.
A consultation supplies advisory evidence; its answer does not revise a
design. Keep the original need and guarantees and explain the reconciliation.
The responsible architect judges the design; prose keywords establish no
correctness verdict.

Ask module engineers for relevant focused checks supported by their active tools and
declared-check block. Whole-suite Vitest and Cucumber module engineer commands are
refused: name relevant Vitest test files and use the current prepared Cucumber
feature check when supplied. A guessed Cucumber path or profile does not
establish a verified selection. The gate owns
the complete committed audit and retains every configured project, nested
project and required check. Reconcile contradictory check instructions in the
assignment instead of asking a module engineer to bypass tool restrictions. If a
module engineer receives such a contradiction, it follows the active restrictions and
returns the conflict to its architect for a revised assignment.

Set completion evidence for the assigned work. Do not require an intermediate
contribution to make the entire selected feature pass: a prepared feature check
selects whole files and may include unassigned cases. An engineer may propose
completion with its assigned work complete and supported by evidence while
reporting unassigned pending or undefined cases and the failed command exit.
Assess actual results against the assignment, including unexpected failures and
regressions; unfinished assigned work requires `partial`. Require truthful
receipts and all applicable gates before acceptance. Use existing obligations,
case results and your judgment; feature selection adds no completion obligations.

When exact generated-feature evidence is part of the delegated task, state
`assignment.featureSelection: { files, reason }`. Name exact project-relative
current registered `.feature` files and explain their purpose, even when the
only completion obligation is a delegated outcome such as `capability-task:preview-checks`. Consumer
features may lie beyond the provider's write scope; selecting evidence widens
no writes and permits no generated-feature edits. A background pointer or a
filename in prose selects nothing. Scenario obligations continue to select
their generated files. Assess actual case results: zero cases on a successful
exit establishes no acceptance; ambiguous, undefined, failed and unrun results
retain their limitations. Feature execution completes no consumer obligation
and delegates no acceptance authority.

## Test reliability and repair assignments

Tests added by this plan, including earlier iterations and additions to existing
files, must provide reliable verification. Audit-established flakiness in such
a test requires deterministic repair or replacement preserving its coverage,
even when the audit passes with warnings. Moving, renaming or editing an existing
test does not make it new. Determine origin against the original execution
baseline with focused source evidence; audit history proves instability, not
origin. Preserve uncertainty when that comparison cannot decide.

Existing-test flakiness creates no repair investigation, reruns or assignment.
Preserve the audit evidence and verdict; strict `flakiness.onFailure="failure"`
remains a blocker and permits neither an existing-test repair nor a waiver.
A failure alone or a focused pass does not prove flakiness. Do not accept weaker
assertions, skipped cases, increased retries or rerunning until green as repair.
