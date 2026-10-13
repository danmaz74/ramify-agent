# Small corrections to prompt delivery after the Plan 42 interim review

**Date:** 2026-10-13. **Status:** reviewed and implemented; qualification recorded below.
The proposal below retains its historical evidence baseline;
implementation qualification is recorded at the end.

Four bounded changes would make delivered instructions more accurate and
reduce unnecessary context: correct repair guidance, supply promised Cucumber
configuration, expose command policy to architects assigning work, and summarize
view coverage details. Implement the first three together, then qualify coverage
summarization separately. The expected improvements are clearer decisions and
less avoidable discovery; lower cost or faster execution needs a later comparison.

The [Plan 42 interim postmortem](2026-10-13-plan42-interim-postmortem.md)
reviews 101 invocations through 13 October 2026 at 08:13 Europe/Rome. Its
retained packets and transcripts establish the observed mismatches. The source
pointers below were inspected at main revision
`f7cbcf56631f5113a16718aa71b578ce9d2dcbbd`; recheck the implementation baseline
before applying these proposals. The historical execution used several runtime
and dependency revisions, so current source alone does not establish historical
delivery.

## Proposed scope and order

| Order | Correction | Observed problem | Estimated scope |
| --- | --- | --- | --- |
| 1 | Make repair instructions match audit behavior and write authority | An unchanged proposal reused a failed audit despite promised execution; parent failures required partial handoff | Small prose change across repair delivery and engineer role variants |
| 2 | Supply promised Cucumber discovery facts | Eight scenario-writing packets omitted the configuration their prose promised | Small delivery correction with a composed packet regression |
| 3 | Supply the command baseline to assigning architects | One assignment tried to lower an undisclosed command bound and was rejected | Small environment-selection correction |
| 4 | Bound coverage enumeration and provide detail access | Approximately 87 KB of symbol-limit listings appeared in each of five architect packets | Bounded formatter and pointer delivery change |

These estimates describe likely change scope, not elapsed implementation time.
The proposals preserve validation, role authority, audit selection and semantic
acceptance. They do not change existing run records or edit generated views.

## Correct repair guidance

The [repair review](2026-10-13-plan42-interim-postmortem/review-repair.json)
records an engineer told that the next gate would run the complete required
set. Its focused reproduction passed and it proposed completion without source
changes. The gate reused the preceding failed audit. A second continuation
exposed that reuse and the engineer returned partial instead of changing source
merely to invalidate the audit cache.

The same review records repair instructions to child-scoped engineers whose
diagnosed failures belonged to the parent harness. Inherited procedures and
consultation preserved the boundary; the generic imperative still required
reconciliation.

Current delivery repeats these claims in
[the engineer briefing](../../subs/harness/src/work/engineer.ts),
[ordinary engineer instructions](../../subs/harness/src/prompts/engineer.system.md)
and [capability engineer instructions](../../subs/harness/src/prompts/engineer-capability.system.md).
The accepted-completion tool response in the engineer implementation repeats
the same promise and must agree with the briefing. Both role variants also
need to describe the candidate commit before audit, rather than after a passing
gate; the commit itself establishes no acceptance.
Replace promises of rerunning all checks with an accurate account of the gate:
it evaluates the configured evidence, the audit provider selects execution and
may reuse applicable evidence, and acceptance requires a qualifying verdict.

Suggested repair wording:

> Inspect the failure against your assignment. Repair within your authorized
> scope and propose completion when supported. If the correction requires
> another owner's work or a revised decision, preserve the candidate and return
> partial with the conflict and evidence. The next gate evaluates the configured
> checks and may reuse applicable audit evidence; unchanged source does not
> guarantee fresh execution.

Keep the failed candidate, original receipt, exact failed cases and evidence
limitations visible. A previously failing case passing in a focused run does
not erase its audit result or prove a flake. When fresh verification is needed,
the responsible workflow must use its supported audit contract; prose must not
authorize the engineer to run a complete audit, bypass the gate, widen scope or
make a cosmetic mutation.

Validate emitted repair packets for ordinary and capability engineers, including
a continuation that inherits older role instructions. Keep those instructions
pinned: supply the correction through the current repair briefing, without
rewriting the inherited prefix or bypassing prompt-package compatibility.
Existing scripted gate
and repair witnesses should cover unchanged evidence reuse and a correction
outside the engineer's scope. Both must remain truthful without changing the
audit provider's selection policy or converting a partial result into success.

## Supply Cucumber discovery facts

The [engineering review](2026-10-13-plan42-interim-postmortem/review-engineering.json)
finds that all eight scenario-writing deliveries promise effective configuration,
source configuration bytes and globally loaded support, World and loader
pointers through `cucumberConfiguration`. Their effective packets omit that
environment block. Engineers can still inspect project configuration and the
prepared command, so the omission does not make discovery impossible; it makes
the delivery claim inaccurate.

[Engineer step preparation](../../subs/harness/src/steps/engineer.ts) already
supplies `focusedScenarioFacts(prepared)` to the task environment.
[Environment selection](../../subs/harness/src/prompts/tasks.ts) deliberately
omits available Cucumber configuration because it treats it as a duplicate of
the focused command. The [fact producer](../../subs/harness/src/work/session.ts)
and prepared command must be compared field by field: a command and a short
support summary do not necessarily replace the promised source evidence.
At the inspected baseline, the fact producer supplies source paths and hashes,
configuration identity, selection and support metadata; it does not inline
source configuration bytes. Distinguish delivered facts from files the engineer
must read, and name the actual prepared/source paths for the latter.

Deliver the available discovery facts to the engineers who need them. Keep the
prepared command in one authoritative location and avoid repeating command or
environment data unnecessarily. Preserve the distinction between configuration
that is available, unavailable and inapplicable. If a fact cannot be delivered,
the support prose must identify the missing evidence and an actionable source
pointer instead of promising an absent field.

Use the existing environment and briefing delivery contracts where sufficient.
This correction should not create another independently maintained Cucumber
configuration or regenerate facts from guessed paths.

Validate the physical additions and effective packet through the real engineer
step constructor. Cover a fresh task, a continued repair, an available-to-
unavailable transition and a task with no relevant scenario work. Available
configuration must reach the consumer with its current source identity;
withdrawals must prevent stale facts remaining effective. The declared
configuration, loaded support and prepared command must agree. These tests can
use scripted project/configuration evidence; no paid model trial is needed.

This proposal does not fix the separate scenario-selection issue where a focused
command includes unassigned undefined cases. Preserve that command's observed
aggregate exit and per-scenario results until selection is corrected through
its own supported contract.

## Expose command policy to assigning architects

The [capability review](2026-10-13-plan42-interim-postmortem/review-capability.json)
records one architect proposing `commandTimeoutMs: 600000` under a policy whose
baseline was `1800000`. Validation correctly refused a lowered bound. The
effective packet supplied invocation idle and absolute limits but omitted the
command baseline. The architect corrected the next submission.

[Environment selection](../../subs/harness/src/prompts/tasks.ts) exposes the
command limit only to roles holding a shell. Architects that author assignments
also need the applicable command policy even though they cannot execute shell
commands. Select this information according to assignment authority and the
actual submission schema, rather than shell access alone. Do not broaden tool
authority or paste command settings into unrelated prose tasks.

Supply the current effective default and, where the assignment contract permits
raising it, the ceiling. Derive both from the run's captured/effective policy,
not a literal from this historical rejection. Explain that an optional override
is omitted unless the assignment needs and permits a change. Missing policy
evidence must remain explicit; it must not become a guessed default.

Validate local and capability architect assignment packets, including an
architect with no shell. A scripted assignment should be able to identify the
actual baseline before submission; existing validation must still refuse an
invalid lowering. Check inherited block updates when policy delivery changes.

[Plan 44](../plans/44-execution-continuity/main-plan.md) changes the meaning and
effect of resource observations. If it lands first, adapt this proposal to its
remaining command/stall policy and supported assignment fields. Do not restore
removed terminal limits, retain obsolete fields just to match an old packet,
or describe elapsed time as semantic task failure.

## Summarize coverage details

The [orientation review](2026-10-13-plan42-interim-postmortem/review-orientation.json)
and [consultation review](2026-10-13-plan42-interim-postmortem/review-architect-consultation.json)
identify 86,840–87,945 UTF-8 bytes of exhaustive harness symbol-limit listings
in each affected packet. Five deliveries repeat about 435 KB of enumeration,
before replacement-pointer overhead. These are measured text bytes, not provider
tokens or demonstrated monetary savings.

[Coverage formatting](../../subs/harness/subs/evidence/src/views.ts) already
caps named records in its general summary at 12. Its module-specific
`In <module>` statement instead joins every matching record, producing the
large local enumeration. [View input preparation](../../subs/harness/src/run/service.ts)
then carries that result into module orientation and some consultations.

Bound the module-specific enumeration with the existing 12-record cap as well.
Preserve revision/input identity,
overall coverage counts, the count relevant to the named module, a short
selection of named limits and an explicit indication that more detail exists.
Supply an accessible pointer to the corresponding detailed evidence. Prefer
existing readable generated record files when they expose the required limits;
do not invent a file or use a directory pointer as proof that the complete
enumeration is recoverable. If a retained detail artifact is necessary, the
harness must prepare it and give the role a readable pointer.

Record the actual generated filenames while reading the index; module names
must not be used to guess their layout. Generated views can refresh after an
index is captured. Verify the current metadata against the index before
advertising detail access, and keep aggregate counts bound to the same identity
as the records they summarize. A stale or unreadable view must state that the
corresponding details are unavailable.

The summary must distinguish truncated signatures, truncated documentation,
unavailable details and title/source-analysis limits. A short list is not
complete coverage. The architect view does not establish ordinary or testing
consumer importability; those API views remain independent. Preserve the rule
that absence under coverage limits does not prove unavailability. Looking up
a relevant limited symbol may still require focused defining-source inspection.

Validate a module with hundreds of limited records, small and empty cases,
unavailable detail access and both ordinary/testing view references. Check the
actual delivered packet and resolve its detail pointer with the role's available
read tools. Retain counts and named-record meaning while bounding newly appended
enumeration. Do not strip inherited history or alter toolkit-generated records.
Use the smallest ordinary regression that crosses the enumeration cap. Keep
the hundreds-of-records size comparison in a separate captured-input measurement
or stress probe, following the project's test boundaries.

Compare exact UTF-8 delivery bytes before and after the correction using the
same captured inputs. That establishes payload reduction. Cost or latency claims
need actual provider usage with comparable tasks, models and cache states;
a shorter fresh prompt is not necessarily cheaper than cached inherited context.

## Qualification and relation to other work

The first three changes can share one focused qualification of engineer and
architect task delivery. Coverage summarization should follow separately so its
size reduction and preserved evidence access are easy to inspect. Tests belong
with their owners and follow [Testing ramify-agent](../testing.spec.md), using
scripted external responses. Qualify implementation with focused owner tests,
type checking and `npm run check:self`; any committed candidate audit uses the
configured default scope and retains every configured project. Automated health
and the responsible architect's semantic acceptance remain distinct.

[Plan 43](../../plans/43-prompt-guidance-and-review-evidence/plan.md) covers
provider-version prose, independent review-read batching and direct coordinator
review evidence. These four proposals add separate delivery corrections; they
should not silently enlarge its historical acceptance or rewrite its run.
Plan 44 owns broader context, compaction, time and recovery migration. Coordinate
shared prompt/environment edits against its actual implementation baseline.

The selector schema mismatch and full descriptive-identifier consumer integration
remain with [Plan 42](../../plans/42-descriptive-identifiers/plan.md). Recovery
briefings, mutation attribution, mandatory-clause catalog reading and focused
scenario selection remain additional findings in the interim postmortem. They
are not bundled into these four bounded corrections.

Applying a correction changes future prepared inputs. Compatibility and supported
resume/restart admission determine whether an existing run can use a changed
runtime. Existing policies, prompts, hashes, failed receipts and acceptance
records retain their historical meaning.

## Implementation review and qualification

The review found no decision requiring another user choice. Implementation began
against `f7cbcf56631f5113a16718aa71b578ce9d2dcbbd`, using Sol subagents. Existing
unrelated working-tree changes remain separate.

The first three corrections are implemented. Repair briefings, both engineer
role variants and the completion response agree on audit evidence reuse and
candidate commit ordering. Current repair guidance corrects inherited execution
promises without rewriting pinned role instructions. Cucumber discovery carries
authenticated file pointers and hashes, with one prepared command; source bytes
are read through those pointers. Scenario metadata, focused feature selection or
assigned obligations trigger discovery delivery. Capability mode alone does not.
Assigning architects receive the captured command baseline, ceiling and override
rule without acquiring shell authority.

Focused qualification passed 154 tests across eight owner files:
`engineer-briefing`, `engineer-submission`, `gate-diagnostics`,
`engineer-failures`, `plan23-task-prompts`, `steps-from-run`, `brief-assembly`
and `plan23-real-run-corrections`. The composed transition witness uses actual
constructor briefings to verify replacement and withdrawal of discovery facts,
support prose and the focused command. Type checking passed. The first
`npm run check:self` passed with zero errors, three ignored-directory warnings
and 373 analysis limits; its coverage remains partial.

Coverage summarization is implemented separately. The formatter caps local
enumerations at 12 names and retains actual generated record-file provenance.
The [local view delivery](../../subs/harness/src/work/view-inputs.ts) verifies
current metadata against the index before advertising detail pointers. It uses
matching metadata for aggregate totals; otherwise captured aggregates and
observed index records remain separate, with detail access explicitly
unavailable. Initial analysis also avoids correlating different view identities.
Missing record files leave residual counts unclassified. Ordinary and testing
API views retain their own identities and importability meaning.

Coverage qualification passed 18 tests across `views`, `coverage-delivery` and
`consultation-tools`, plus the installed Pi read-tool witness and 14 existing
`plan25-discovery-delivery` tests. These cover emitted orientation and
consultation packets, unavailable/stale detail access, refreshed totals, and
actual JSONL reads from a module working directory. Ordinary cap regression
uses 13 records; the large comparison stays outside ordinary tests.
Four `analysis-plan-evidence` regressions also passed after the initial-analysis
identity guard. Across the correction's focused runs, 191 tests passed in 14
files. Final type checking and `npm run check:self` passed on the combined
working tree; the latter reported zero errors, three warnings and 373 analysis
limits, with partial coverage.

The [measurement script](2026-10-13-plan42-prompt-delivery-corrections/measure-coverage.ts)
uses the implemented formatter with all records from five retained exhaustive
module listings. Its [results](2026-10-13-plan42-prompt-delivery-corrections/coverage-byte-measurements.json)
record input, formatter and script hashes. Reconstructed appended messages shrink
from 675,927 to 243,462 UTF-8 bytes, a reduction of 432,465 bytes; views additions
shrink from 453,872 to 21,407 bytes. Global aggregates and inherited history remain
unchanged. Historical detail files are unavailable in those captures, so the
reconstruction explicitly reports unavailable access; it does not claim to
reproduce a new live invocation, provider cost, latency or cache savings.

No committed-candidate audit or live model trial has been performed for these
changes; no historical run has been modified or restarted. Concurrent Beads
implementation changes in the shared tree were preserved and are outside this
correction's scope.
