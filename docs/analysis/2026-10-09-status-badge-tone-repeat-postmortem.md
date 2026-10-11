# Status-badge-tone repeat postmortem — 9 October 2026

The repeat run completed the optional four-value tone, neutral default and
`data-tone` markup in one shared-ui iteration. The local architect reported both
scenarios done; the nonfunctional assessor accepted all four constraints. The
final configured full audit passed 79 Vitest tests in 20 files and three Cucumber
scenarios with 21 steps. The retained scope verifier reports no defects. These
are separate observations: architect judgments establish semantic acceptance,
the audit establishes configured suite health, and the verifier establishes the
recorded change boundary.

The strongest remaining candidates concern scope and search accounting and
discovery guidance. Repeated procedure/environment delivery observed here is
already addressed by the completed Plan 25 branch, which this run did not use.
Snapshot collection and candidate-diff
delivery work in this run, and every continuation/fork preserves its parent
provider prefix. The repeat command took 25.362 seconds less than its predecessor,
but its estimated model cost increased by $0.016754. Neither difference establishes
a causal performance improvement.

This report applies the
[ramify-agent-postmortem skill](../../.claude/skills/ramify-agent-postmortem/SKILL.md).
It reviews the repeat identified by the supplied
[comparison.json](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/comparison.json),
using the earlier run only as a descriptive baseline. It preserves the earlier
postmortem and all authoritative run records. No implementation change, new trial,
test run or audit was performed during this analysis.

| Identity | Retained value |
| --- | --- |
| Target project / plan | Collection Review / `status-badge-tone` |
| Selected run | `20261009T181051Z-4c5bfc` |
| Earlier comparison run | `20261009T141941Z-768cb0` |
| Harness source | `4179fa004608baeebff2ff9d3552866d1d5183a0` |
| Harness execution checkout | `/home/app/ramify-status-badge-repeat-20261009T180737Z/ramify-agent` |
| Target execution checkout | `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review` |
| Fixture baseline / final | `32eba857aa43a67d04da164cb6745985d1db49fd` / `40155157c0af1fa686ec5b8579755c17a6364613` |
| Model / pi / toolkit | `openai-codex/gpt-5.6-sol:high` / `0.87.1` / `ramify 0.4.1` |
| Policies | `run-policy/7`, `kpi/1`, `scope-size/2`, `lineage/1` |
| Run interval, Europe/Rome | 20:10:51.198–20:17:36.614; 405.416 seconds |
| Command interval | 20:10:42.982–20:17:37.696; 414.714 seconds |
| Activity | 13 invocations, 12 observed prompt kinds, 11 sessions, 51 model calls |
| Recovery | One rejected submission repaired on the next call; no failed invocation, gate repair, degraded start, compaction or budget return |

The [manifest](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/manifest.json)
distinguishes an initially captured dirty snapshot from the clean committed source
actually used for the trial. This report attributes runtime behavior to
`4179fa00`, rather than that preliminary snapshot. The retained execution checkout
still has that HEAD and a clean status. Historical delivery is verified using run
artifacts, rather than today's templates or generated views.

Implementation status must be separated from this run's historical findings.
Plan 23 already preserves role/tool prefixes and delivers specialized submission
declarations once; Plan 24 already reuses local orientation. The completed
`feat/plan25-carry-discovery-forward` branch at `5d9e0837` adds unchanged
procedure/environment block inheritance and discovery handoffs. Its
[instruction-delivery receipt](/home/app/ramify-plan25-carry-discovery-forward/ramify-agent/docs/plans/25-carry-discovery-forward/iterations/01-results.md)
records assignment-to-completion delivery of only briefing state/current task,
and its [qualification receipt](/home/app/ramify-plan25-carry-discovery-forward/ramify-agent/docs/plans/25-carry-discovery-forward/iterations/05-results.md)
records combined delivery qualification. That branch is not an ancestor of this
run's `4179fa00` source or the current main checkout. F7's procedure/environment
duplication is therefore evidence for an implemented correction on another
branch, not a request to implement it again. Plan 25 also supplies navigation
handoffs relevant to F5/F10. This run cannot measure their live effect.

The [captured plan](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/input/plan.md)
is 1,544 bytes, hash `c9e33f718a224c83166577fca6286d407db782e5581697ae7499236f9a896a96`.
Its document manifest records one plan, no missing documents and an empty principles
scan. Ten catalog elements were accepted: five functional, four nonfunctional and
one contextual. The plan requires neutral/positive/warning/critical as optional
tones, an emitted tone beside `data-status`, unchanged status/label behavior and
source-compatible callers. No extra user clarification or later design decision
was needed to establish these goals.

| Stage | Recorded outcome |
| --- | --- |
| Intake and initial analysis, `inv-0001`–`inv-0003` | Catalog and shared-ui placement accepted. Architect view supplies owner, contract and consumers. |
| Readiness, `ga-0001` | Full audit pass reused from the exact fixture baseline; it was not a new baseline test execution. |
| Orientation, selection, assignment, `inv-0004`–`inv-0006` | One shared-ui iteration assigned. Assignment's first `localDecisions` shape was rejected and corrected. |
| Engineering, `inv-0007` | Three commands passed: project type check, four focused badge tests, and two bound scenarios with nine steps. Engineer proposed completion; this was not semantic acceptance. |
| Iteration gate, `ga-0002` | Partial audit ran and passed at `40155157…`: 17 tests in six files and both new scenarios. |
| Reviews and completion, `inv-0008`–`inv-0012` | Code/scope/design reviews returned no concerns. Local architect inspected the current diff/source and reported both scenarios done. Reviews overlapped with completion inspection. |
| Work-item gate, `ga-0003` | Passed by reusing `ga-0002` evidence for the same candidate. |
| NFR assessment, `inv-0013` | Four requirements assessed satisfied from current snapshot source and tests. |
| Final gate, `ga-0004` | Full audit ran and passed: four configured checks, 79 tests/20 files, three scenarios/21 steps; job completed. |

The [gate records](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/gates)
retain executed modes, reuse and evidence references. The
[completion submission](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/invocations/inv-0010/submission.json)
and [scope verification](/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/verification.json)
record the separate acceptance and boundary evidence. Four gate attempts do not
mean four independent suite executions.

Prompt coverage is based on observed procedure additions and task packets, not
the job's unused template catalog. Three delegated reviewers reviewed one kind at
a time, with assignment and completion treated as variants of the same procedure.
All thirteen instances are included; inherited history is restricted to the
recorded source point. The
[inventory](2026-10-09-status-badge-tone-repeat-postmortem/inventory.json)
links each invocation to its raw correlation, source point, first/last native
request, usage, result and exact UTF-8 current-message size.

| Observed kind | Covered IDs | Current task bytes | Delegated assessment |
| --- | --- | ---: | --- |
| Intake | `inv-0001` | 6,294 | [Intake](2026-10-09-status-badge-tone-repeat-postmortem/reviews/intake.md) |
| Initial analysis | `inv-0002` | 18,456 | [Initial analysis](2026-10-09-status-badge-tone-repeat-postmortem/reviews/initial-analysis.md) |
| Catalog check | `inv-0003` | 10,466 | [Catalog check](2026-10-09-status-badge-tone-repeat-postmortem/reviews/catalog-check.md) |
| Local orientation | `inv-0004` | 15,968 | [Orientation](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-orientation.md) |
| Context selection | `inv-0005` | 5,312 | [Selection](2026-10-09-status-badge-tone-repeat-postmortem/reviews/context-selection.md) |
| Assignment / completion | `inv-0006`, `inv-0010` | 11,110 / 14,373 | [Both variants](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-assignment-and-completion.md) |
| Engineering | `inv-0007` | 21,351 | [Engineering](2026-10-09-status-badge-tone-repeat-postmortem/reviews/engineering.md) |
| Code review | `inv-0008` | 17,671 | [Code review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/code-review.md) |
| Scope review | `inv-0009` | 20,136 | [Scope review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/scope-review.md) |
| Design orientation | `inv-0011` | 16,392 | [Design orientation](2026-10-09-status-badge-tone-repeat-postmortem/reviews/design-orientation.md) |
| Design review | `inv-0012` | 14,711 | [Design review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/design-review.md) |
| NFR assessment | `inv-0013` | 7,079 | [NFR assessment](2026-10-09-status-badge-tone-repeat-postmortem/reviews/nonfunctional-assessment.md) |

These bytes exclude role instructions and inherited context and are not provider
tokens. For forked/continued calls, native requests preserve base instructions and
ordered tools while current role/tool switches arrive through retained developer
messages and `additional_tools`. Looking only at the base tool array would
incorrectly suggest the current submission tool was unavailable. Actual accepted
calls, tool-switch records and appended full schemas establish usability.

The findings below separate observed mismatches from optional reductions. Severity
reflects the consequence in this evidence: medium affects measurement reliability;
low caused bounded wasted work or suggests clearer context. No high-severity
delivery defect was found. Delegated reports retain exact excerpts, JSONL locations,
native request hashes and the full required-information assessments.

| Finding | Severity; role/task/IDs and evidence | Expected versus observed; impact/confidence | Correction direction and focused validation |
| --- | --- | --- | --- |
| F1: View scope measured as zero despite actual access | Medium; local architect `inv-0004`; [orientation review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-orientation.md), invocation scope components and transcript view calls | Scope components say “no API-view area is declared” and “role's profile does not include the global view,” both measured zero. Delivered instructions permit the global view; one architect lookup and fourteen API-view calls succeed or probe those areas. The unavailable total is correctly marked partial, but zero components cannot describe actual available/consulted view scope. High-confidence accounting mismatch, not failed access. | Derive declared components from the role's actual area/view contract, or label zeros as undeclared rather than measured absence. Reconcile the same packet, recorded view identities and scope components without inventing missing byte totals. |
| F2: Search aggregate conceals known misses and unknown scope | Medium; orientation/engineering `inv-0004`, `inv-0007`; [summary no-match IDs](2026-10-09-status-badge-tone-repeat-postmortem/summary.json), transcript `ses-0004` lines 40–41 and `ses-0006` lines 15–16, 20 | Every projected `zeroMatchSearches` is zero, but five successful results explicitly say “No matches found.” Matched-file identities are already documented unknown, and 42 search-category outside-scope flags are null. The zeros cannot establish absence of failed discovery or outside-scope work. High confidence in raw/projection distinction. | Retain structured match count/outcome and returned identities when the tool knows them; show partial/unknown aggregates where coverage is incomplete. Reconcile a no-match, missing-path and successful-match call without treating error output as scanned bytes. |
| F3: Application API views used as package catalogs | Low; local orientation/engineering `inv-0004`, `inv-0007`; [engineering review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/engineering.md) | Searches for React, Cucumber, `react-dom/server` and `node:assert` produce five no-match results across the two roles. Those packages/built-ins are outside application view scope. A foreign step-example source search then returns 5,136 bytes; no foreign behavior import or wrong handback follows. Sequence is established; the scope misunderstanding is a supported explanation, not proof of every lookup's motive. | State the view's application-source boundary beside lookup instructions. Use existing imports and package/runner configuration for package provenance. Narrow application lookups to the consuming source area's actual need; preserve normal package discovery. Validate with the same task's lookup outcomes and import correctness. |
| F4: Correct pointers bypassed; missing view paths assumed | Low; initial analysis/orientation/engineering `inv-0002`, `inv-0004`, `inv-0007`; [initial](2026-10-09-status-badge-tone-repeat-postmortem/reviews/initial-analysis.md), [orientation](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-orientation.md), [engineering](2026-10-09-status-badge-tone-repeat-postmortem/reviews/engineering.md) | Initial architect replaces supplied absolute skill links with `skills/...` under project cwd, causing two ENOENTs. Orientation climbs one level too far for package/config twice, then corrects. Both roles probe missing children directories; engineer also assumes an unpromised view README. The failed lookup for a steps directory before creation is expected. All recover; no invocation failure. | Use literal supplied absolute targets for external references/root configuration. List a view before probing optional catalogs and explain that an absent children catalog may be normal. Do not prescribe a README that is not part of the format. Validate delivered path resolution from each actual cwd; historical absolute-link success is unknown because it was never attempted. |
| F5: Broad view dumps add mostly unrelated context | Low; local orientation `inv-0004`, inherited selection/scope `inv-0005`, `inv-0009`; [orientation](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-orientation.md), [selection](2026-10-09-status-badge-tone-repeat-postmortem/reviews/context-selection.md), [scope](2026-10-09-status-badge-tone-repeat-postmortem/reviews/scope-review.md) | Two `grep '.'` API dumps hit 100-match limits and return 19,087 bytes, including unrelated contracts/test helpers. `ReviewStatus` information is useful, so these reads are not wholly waste. The selector and scope reviewer inherit the dumps despite narrow current tasks. High-confidence excess candidates; no measured cache-adjusted savings. | Search existing import/symbol names first, then read selected records fully. Preserve relevant contracts/limits in orientation. Compare narrower discovery output and complete submissions with identical models and cache-boundary measurements; do not erase cached history merely to reduce bytes. |
| F6: One rejected assignment despite complete schema | Low; assignment `inv-0006`; [assignment review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/local-assignment-and-completion.md), observations rejection row | First submission sends `localDecisions` as an object with an already-registered capability. Validator says “expected array, received object”; the next call sends `[]` and succeeds. Complete current schema and tool were delivered, so this is an agent submission error, not missing-tool evidence. Cost of the repair call is included in invocation usage. | Put a concise `localDecisions: []` example beside the phase where no decision is needed, and distinguish existing registrations from new decisions. Confirm array use and existing-entry preservation on an assignment case. |
| F7: Repeated or unusable generic environment content | Low; historical duplication addressed by Plan 25, with role relevance still a potential refinement; intake/check/selection/assignment/review roles | Assignment and completion append the same roughly 6.6 KB procedure; scope review repeats 2,798 bytes of inherited catalog context. Completed Plan 25 deduplicates unchanged reusable blocks; this run excludes that implementation. Separately, intake/check/selector environments contain broad limits/view metadata and snapshot roles receive inaccessible provenance/view pointers. No observed blocker follows. | Validate the already implemented Plan 25 delivery in a run that includes its source; do not implement block deduplication again. Assess role/phase relevance separately while preserving current task, tools, schema, constraints and authority. Measure cache effects before claiming a benefit from narrower context. |
| F8: Briefing labels and verification scope are imprecise | Low; initial analysis `inv-0002`, engineering `inv-0007`; initial/engineering reviews | Initial task presents an empty `<plan>` block while full requirements and a working plan pointer exist; generic tasks name `{}`. Engineer calls a successful whole-project `npm run type-check` “focused.” Task and check succeeded; wording could mislead later readers. | Use explicit captured-document pointers and plan/work identity; label each command by its configured scope. Validate the rendered task and handback against actual argv/configuration, not filename assumptions. |
| F9: Unchanged inherited design guidance is read again | Low; design `inv-0012`; [design review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/design-review.md) | Three snapshot README contents match their inherited guidance hashes, yet all three are reread, returning 13,369 of the task's 20,288 exploration bytes. Current procedure permits unchanged-identity reuse. The reads succeed; motivation could include precautionary grounding, so avoid claiming a cause from length alone. | Clarify that unchanged inline guidance satisfies orientation reuse, while any concern's `ground` must still name a file read through the required current snapshot tool. Compare read calls/output and complete concern grounding on a matched candidate. |
| F10: NFR snapshot navigation and tool description lack phase specificity | Low; assessment `inv-0013`; [NFR review](2026-10-09-status-badge-tone-repeat-postmortem/reviews/nonfunctional-assessment.md) | Task correctly says the diff is against the current accepted boundary; generic tool description still says iteration base. Candidate `readScope` is root with no owner pointer. Preliminary root listings, a backend status search and large root README precede shared-ui evidence. The assessor understands the actual comparison and preserves uncertainty about historical identities; no false preservation claim results. | Give the tool its phase-specific comparison description and offer accepted owner/current source paths as navigation hints. Keep complete NFR authority and unrestricted snapshot inspection; compare preliminary discovery calls without substituting scope hints for semantic evidence. |

Potential semantic concern, separate from established defects: the initial
architect's `default-omitted-badge-tone` hypothesis repeats a same-owner detail
already required by the toned-badge entry. It may be useful decomposition, but
the prompt asks for distinct deeper needs. No later wrong placement or handback
is demonstrated. Clarify when an empty hypothesis list is appropriate and leave
the semantic distinction to the responsible architect.

Historical view availability can be established at the points actually used.
Initial architect metadata reports `ramify.architect-view/3`, revision
`rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:1`, input
`input/1:abde10727c92bf5d401f1e7f289cc96cbb87464226972be6bf861a99063cd816`,
15 modules, production dependency scope, measured test references, eleven cuts
and four unavailable details. The local orientation reads both independent
consumer metadata files: ordinary/tests revision `…:2`, with one/two coverage
limits respectively. Engineering's delivered packet records both areas at `…:4`
and the same coverage counts. No materialization failure is retained; limited
coverage and truncated grep output remain explicit unknowns, not proof of absence.

Architect discovery is distinct from own-module detail inspection and later
semantic verification. The initial architect has one owner/contract/consumer
discovery episode. Its thirteen discovery calls include eleven architect-view
calls and two failed skill-reference reads. Its plan read and three metadata
inspection calls are outside that denominator. The local architect already has
an assigned owner: its strict global relationship/exposure episode is one
successful `StatusBadge` search of the architect view. Its code/test/configuration
inspection supports orientation and implementation detail rather than a new
global owner search. Assignment adds no discovery; completion's three source/test
reads are semantic verification.

| Role/task and denominator | Architect view | Consumer API view | Direct source/tests | Other documentation | Mixed / unknown |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial architecture discovery: 13 calls | 11; 84.6% | 0 | 0 | 2; 15.4% | 0 / 0 |
| Local global relationship discovery: 1 call | 1; 100% | 0 | 0 | 0 | 0 / 0 |
| Initial all exploration: 17 calls | 14; 82.4% | 0 | 0 | 3; 17.6% | 0 / 0 |
| Local all exploration: 34 calls | 1; 2.9% | 14; 41.2% | 5; 14.7% | 14; 41.2% | 0 / 0 |
| Assignment/completion new architecture discovery: 0 calls | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable |

Strict global episodes are view-first two of two, direct-source-first zero and
source fallback after view lookup zero. These counts do not classify all source
reads as architecture discovery. Local consumer-API access is reported separately
from global relationship discovery; both ordinary and testing areas are visited.
There is no shell command whose implicit hidden-directory search must be assumed:
actual `grep`/`ls`/`read` paths explicitly identify every view target.

NFR assessment has a different contract: generated views are excluded from its
snapshot tools. Its one preliminary owner/caller discovery episode is source-first
by necessity. Of five content read/search calls, one targets source alone (20%),
two documentation/declarations (40%) and two mixed source/documentation (40%);
architect/API/unknown are zero. Eight navigation listings accompany them. This
episode returns 24,158 content bytes and 397 navigation bytes. Eleven subsequent
file reads and two semantic searches return 20,121 bytes for requirement
verification. This source-first episode is not evidence that an agent ignored
an available architect view.

Initial discovery returns 20,896 bytes, of which 20,533 are architect data and
363 failed-reference output; initial all-exploration returns 30,676 bytes. It
uses nine distinct architect files plus the root directory in discovery and adds
metadata separately. No file path is reread within the episode; directory
searches repeat with different queries, including two metadata-oriented searches
returning 7,907 bytes. The last returns already-known metadata rather than new
limit detail. Local exploration returns 39,740 bytes: 1,517 architect, 19,846 API,
7,517 source and 10,860 other. Its per-task observed exploration duration is
4,867 ms; the initial task's is 1,481 ms. Exact per-episode model/wall duration
is not separately collected, and concurrent tool durations cannot establish it.

The views were useful beyond being read. The initial view identifies shared-ui
as the presentation owner, exposes `StatusBadge({status,label})` and its props,
and names catalog/review consumers; the accepted placement follows that evidence.
The local API results identify the existing `ReviewStatus` type/import contract,
which the architect retains in its understanding. Looking at current source for
the component's implementation and tests is a focused follow-up; it does not
show failed architecture discovery. Package searches and indiscriminate API
dumps are the observed discovery improvements, rather than a target usage quota.

Engineer foreign-capability outcomes require narrower attribution than global
passing checks. There are zero newly introduced foreign application capabilities
and one retained need: the ordinary component's existing `ReviewStatus` type.
The targeted lookup is in the testing view; the ordinary view is searched for
React. Therefore full ordinary-area view support for that type in this invocation
cannot be inferred from the testing lookup. The import already exists and stays
unchanged. Same-owner test use of `StatusBadge` does not count as foreign.

| Foreign application need denominator: one retained, zero new | Count / outcome |
| --- | --- |
| Relevant view information found | 1 in the testing view; ordinary-area consulted provenance unknown |
| Application dependency applied | 1 existing ordinary import retained; no new foreign value selected |
| Automated verification | 1 retained use type/boundary checked; focused badge/scenario checks and final suite pass independently |
| New foreign source fallback / guessed unavailable API / unresolved need | 0 / 0 / 0 |
| Complete ordinary-area view-to-new-call success chain | Not applicable; no new foreign application call |

These stages overlap and must not be added into a larger need count. The engineer
uses ten API exploration calls, nine testing and one ordinary, returning 2,190
bytes including error output. One foreign example-source grep returns 5,136 bytes.
Four external-library inquiries are separate: React element typing, static markup
rendering, Cucumber steps/state and `node:assert` considered but not used. The
implemented steps use package imports plus local WeakMap state rather than a
foreign application World capability. No unavailable/type-only symbol is wrongly
used as a value, and no capability request is made for behavior already present.

Collected metrics reconcile against all underlying usage observations: input
153,410, cache-read 593,408, cache-write zero and output 17,735. The sum of those
categories is 764,553. Pi's recorded charges explicitly label `input` as new input
and `cacheRead` as cached input; therefore the cache share denominator is
`input + cacheRead`, not `input` alone. Run-wide cache share is 79.46%.

| Invocation / task | Elapsed seconds | Calls | New input | Cache-read | Output | Estimated USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `0001` intake | 11.042 | 2 | 3,926 | 3,072 | 609 | 0.029113 |
| `0002` initial analysis | 62.907 | 6 | 17,465 | 55,168 | 3,698 | 0.165887 |
| `0003` catalog check | 7.108 | 2 | 5,205 | 4,480 | 216 | 0.026932 |
| `0004` local orientation | 45.370 | 6 | 30,972 | 34,176 | 1,929 | 0.176138 |
| `0005` selection | 7.257 | 1 | 2,547 | 16,256 | 258 | 0.021850 |
| `0006` assignment | 32.573 | 2 | 10,001 | 40,960 | 1,794 | 0.092268 |
| `0007` engineering | 75.912 | 9 | 17,934 | 99,712 | 2,923 | 0.170081 |
| `0008` code review | 20.040 | 3 | 12,573 | 16,128 | 847 | 0.073683 |
| `0009` scope review | 29.619 | 6 | 11,246 | 198,784 | 639 | 0.137278 |
| `0010` completion | 12.297 | 2 | 7,352 | 56,064 | 628 | 0.064394 |
| `0011` design orientation | 5.147 | 1 | 4,572 | 0 | 237 | 0.023028 |
| `0012` design review | 15.524 | 2 | 11,236 | 14,080 | 785 | 0.066276 |
| `0013` NFR assessment | 69.427 | 9 | 18,381 | 54,528 | 3,172 | 0.158775 |

Estimates total $1.2057032, using the historical recorded rates of $4/million new
input, $0.40/million cached input and $20/million output. Their provenance is
`estimated-from-recorded-rates`, `pi-ai@0.87.1:model-runtime:tier=-1:cacheWrite1h=0`;
they are not provider invoices or current pricing claims. Per-call usage sums
exactly to the invocation totals; the analysis does not add both sets together.

Engineering is the longest invocation at 75.912 seconds. NFR assessment follows
at 69.427 seconds and returns 47,915 exploration bytes, the largest task subtotal.
Local orientation has the largest new-input usage, 30,972 tokens, and the largest
estimated invocation charge, $0.176138. Scope review accounts for 198,784 cached
tokens, 33.50% of run cache reads, over six calls with inherited architect context.
These are contributors, not measures of difficulty or implementation quality.

Invocation elapsed sums to 394.223 seconds, model durations to 365.652 and all
tool durations to 41.104. Each is an activity sum; the wall interval is 405.416
seconds. Tool/model overlap, parallel tool batches and concurrent reviews prevent
addition of these values into a run duration. The exploration-only tool sum,
22.742 seconds, excludes editing, commands and non-exploration tools. Three
engineer shell commands and two architect `inspect_git` calls sit outside
read/search exploration, although all 154 tool starts are retained.

| Exploration/accounting observation | Value and interpretation |
| --- | --- |
| Read calls | 77, including five failed reads; 72 successful file reads. |
| Search-category calls | 55: 18 `grep`, 18 `ls`, eight `snapshot_search`, ten `snapshot_list` and one `snapshot_diff`. Only 26 are text searches. |
| Successful distinct paths | 33 across the run, compared with 72 summed per-invocation unique files. Repeated reads is recorded as zero within individual invocations. Cross-role/revision reinspection is not necessarily redundant. |
| Returned bytes | 190,516, including retained error output; this is not scanned source size. |
| Broad/outside-scope searches | Five broad, one known outside-scope; 42 search-category observations have unknown outside-scope status. One is a known count, not a complete run-wide total. |
| Failed exploration | Nine attempts: two initial-reference reads, two orientation root reads, two orientation children-directory searches, and engineer children/README/steps lookups. Missing future steps are expected before creation. |
| Zero-match coverage | Projection records zero, while five successful `grep` result bodies explicitly say `No matches found`; retain the measured raw results and the collector's missing-match-identity coverage. |
| Snapshot reconciliation | 55 operations; every original call appears exactly once as exploration. Two settled metrics captures are identical. |
| Scope measures | Engineer declared size 40,617 bytes versus 682,443-byte baseline: ratio 0.059517, reduction factor 16.802. Change-weighted mean is 40,617 bytes over 90 engineer-attributed lines; another 23 lines are harness-attributed. These are declared scope/change measures, not actual token savings. |
| Session-weighted scope | Unavailable, known subtotal 868,598 bytes; only two of eleven sessions have complete components. It cannot be reported as a full run scope total. |

The derived [summary](2026-10-09-status-badge-tone-repeat-postmortem/summary.json)
retains original IDs and the five no-match transcript locations. The
[analysis script](2026-10-09-status-badge-tone-repeat-postmortem/analyze.py)
reads source evidence and writes only this postmortem's derived artifacts. It
matches native requests by the last exact task message, so inherited earlier
tasks do not become additional billable calls.

Every boundary has a dedicated first model request and per-call usage. All
cache writes are zero. The table below measures the first request separately
from invocation totals; a later tool turn cannot warm these observations.

| Boundary / parent point | Actual start | First-call new input | First-call cache-read | Output | First post-fork call | Cache share | Estimated USD |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| `inv-0005` selection / `0004` turn 1 | Fork | 2,547 | 16,256 | 258 | Measured first child request | 86.45% | 0.0218504 |
| `inv-0006` assignment / `0004` turn 1 | Continued | 8,641 | 16,256 | 1,082 | Not applicable; first continuation measured | 65.29% | 0.0627064 |
| `inv-0009` scope / `0006` turn 2 | Fork | 7,473 | 25,984 | 214 | Measured first child request | 77.66% | 0.0445656 |
| `inv-0010` completion / `0006` turn 2 | Continued | 4,254 | 25,984 | 206 | Not applicable; first continuation measured | 85.93% | 0.0315296 |
| `inv-0012` design / `0011` turn 1 | Fork | 5,203 | 4,480 | 405 | Measured first child request | 46.27% | 0.0307040 |

Coverage is three of three forks and two of two continuations. Native
`request.instructions`, ordered `request.tools`, model and `prompt_cache_key`
remain equal to the last relevant parent request. Its complete ordered input
survives as the child's initial prefix in all five cases. Additional task,
role/tool switch and parent response records follow that prefix. No replacement,
fresh fallback, compaction or duplicated/replayed usage is required to explain
these starts.

| Boundary | Last relevant parent usage timestamp | First child/continuation usage timestamp |
| --- | --- | --- |
| `0005` | 20:13:09.976 | 20:13:17.271 |
| `0006` | 20:13:09.976 | 20:13:39.328 |
| `0009` | 20:13:47.980 | 20:15:37.760 |
| `0010` | 20:13:47.980 | 20:15:42.918 |
| `0012` | 20:15:56.288 | 20:16:02.601 |

These Europe/Rome timestamps are retained usage observations after model responses,
not wire request-start times. Invocation start and model-duration records provide
the corresponding timing bounds. The source point and native parent/child hashes
are retained in the summary for each comparison.

The design fork's 46.27% ratio alone is not a restoration failure: its 4,480 cached
tokens nearly equal the parent's 4,572 input tokens, while new task/tool context
adds 5,203 uncached tokens. Exact prefix preservation and measured cache hits are
both established; provider-internal cache decisions and token identities are not.
No cache lifetime or threshold is inferred. A shorter fresh prompt would need a
matched comparison before it could be called cheaper than this cached history.

| Same-baseline descriptive comparison | Previous | Repeat | Difference |
| --- | ---: | ---: | ---: |
| Command seconds | 440.075 | 414.714 | −25.362; −5.76% |
| New input | 155,274 | 153,410 | −1,864; −1.20% |
| Cache-read | 454,784 | 593,408 | +138,624; +30.48% |
| Output | 19,297 | 17,735 | −1,562; −8.09% |
| Cache share | 74.55% | 79.46% | +4.91 percentage points |
| Estimated model USD | 1.1889496 | 1.2057032 | +0.0167536; +1.41% |
| Reads / search-category calls | 89 / 44 | 77 / 55 | −12 / +11 |
| Returned bytes | 235,696 | 190,516 | −45,180; −19.17% |
| Exploration tool ms | 28,940 | 22,742 | −6,198; −21.42% |

Both runs use the same fixture baseline, model and thirteen-invocation workflow.
Harness source changes from `90940442…` to `4179fa00…`; produced candidates and
LLM decisions differ. Snapshot counts change from 54 to 55. Both runs already
include snapshot collection, so the repeat does not establish that collection
was newly fixed. The repeat's 6,081-byte candidate diff is delivered exactly once
to each of `inv-0008`, `inv-0009`, `inv-0012`, with hash
`dc544b727e898a852c82c3d51d0d1ad56c6d6211da02aa544681c3db4bc9d5be`;
none of those reviewers calls `snapshot_diff` to reconstruct it. NFR assessment's
single `snapshot_diff` has a different comparison purpose.

Higher cache-read volume adds about $0.055450 at recorded rates, exceeding the
roughly $0.038696 saved in new input and output. This explains why a higher cache
share coexists with a slightly higher estimated charge. Two stochastic live runs
with several source changes provide descriptive evidence, not a controlled
benefit measurement.

The evidence supports focused next-run comparisons rather than further inference
from aggregate ratios. Correct F1/F2 accounting first, so later measurements can
answer the questions being asked. Review F3/F4/F5 discovery instructions and
selected records against the Plan 25 implementation before identifying remaining
work. F7's unchanged block delivery and F10's navigation handoffs are already
implemented on that branch; assess their live effect with a source-qualified run.
F9's agent rereading of unchanged guidance remains a separate behavioral observation,
alongside potential role-relevance and F6/F8 clarity refinements.
The design orientation's full three-document guidance contract was met; roughly
1.3 KB of root operational/history prose is a possible authored-guidance reduction,
not permission to silently truncate that contract. No missing-capability, repair,
context-loss or adverse-review branch ran, so their prompt adequacy is not proven
by this run's successful ordinary path.

Preserve semantic authority, source-area importability,
snapshot provenance and complete submission contracts when narrowing context.
Retrospective judgments must not become harness heuristics for declaring tasks
complete.

The explicit limits are provider-internal transformations/cache decisions,
uncollected scanned bytes, incomplete matched-file/outside-scope observations,
partial scope totals and historical generated-view files not fully archived as
standalone snapshots. Delivered excerpts and tool results do establish the
specific historical view contents consulted. There is one repeat and one
comparison baseline; neither proves a future improvement. Remaining proposals
are potential work. Plan 25 corrections identified above are already implemented
on their qualified branch, with their live effect unmeasured by this run.
