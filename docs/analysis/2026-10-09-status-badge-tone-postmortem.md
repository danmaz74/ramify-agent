# Status-badge-tone postmortem — 9 October 2026

The run delivered the requested optional tone and neutral default without changing
the badge's status/label behavior or feature callers. The local architect accepted
completion, both scenarios were declared done, and the final configured full audit
passed. No submission was rejected and no session start degraded. The clearest
improvements concern incomplete exploration metrics, avoidable discovery output,
misleading evidence and file pointers, and repeated or inconsistent instructions. The
retained native requests demonstrate preserved prefixes at the examined session
boundaries; low first-call cache hits do not establish a restoration failure.

This postmortem applies the [ramify-agent-postmortem skill](../../.claude/skills/ramify-agent-postmortem/SKILL.md).
It analyzes retained evidence; it does not modify the implementation or rerun pi,
tests or audits. Recommendations below remain potential improvements until measured.

## Run, authority and evidence

| Item | Recorded value |
| --- | --- |
| Result | [result.json](/home/app/ramify-trial-evidence/status-badge-tone-20261009/result.json) |
| Plan / run | `status-badge-tone` / `20261009T132856Z-07ccc4` |
| Harness source | `390eef60abbfb9772969b1fd466204588adef138`, verified against the clean retained source worktree |
| Source worktree | `/home/app/ramify-status-badge-trial-20261009` |
| Model / pi | `openai-codex/gpt-5.6-sol:high` / `0.87.1`, from native request evidence |
| Fixture baseline / final | `32eba857aa43a67d04da164cb6745985d1db49fd` / `afef5487213d7c2729e95e4e5956e6bb30059390` |
| Run wall interval | 15:28:56–15:37:21 Europe/Rome; 505.137 seconds |
| CLI wall interval | 515.170 seconds, including startup/shutdown around the run |
| Work | One work item, one engineer iteration, two scenarios, four gate attempts |
| LLM activity | 13 invocations, 12 prompt kinds, 11 sessions, 55 model requests |

The [captured plan](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/input/plan.md)
requires four optional tone values, `data-tone` beside `data-status`, omitted tone
defaulting to neutral, unchanged label/status semantics, and no feature migration.
The [candidate patch](/home/app/ramify-trial-evidence/status-badge-tone-20261009/candidate.patch)
implements that contract, adds focused Vitest assertions and real-component
Cucumber bindings, and includes the harness-generated feature and scratch-ignore
setup. The retained verifier reports no defects and a clean final fixture.

Semantic acceptance belongs to the local architect and nonfunctional assessor;
the audit establishes configured suite health. The result's `review: not-reviewed`
does not mean the recorded automated agent reviews were absent. This analysis
does not claim an additional human approval or a new qualification run.

| Stage | Recorded evidence |
| --- | --- |
| Capture, intake, initial analysis, catalog check | `inv-0001`–`inv-0003`; ten catalog elements accepted |
| Readiness | `ga-0001`: full audit of baseline, pass |
| Module orientation, NFR selection, assignment | `inv-0004`–`inv-0006`; one scoped shared-ui iteration |
| Engineering | `inv-0007`; four focused check commands and first accepted submission |
| Iteration gate | `ga-0002`: partial audit, pass; both scenarios bound |
| Reviews and architect completion | Code/scope reviews run concurrently with completion inspection; design orientation/review follow; no concerns |
| Work-item gate | `ga-0003`: partial audit reused the accepted candidate evidence, pass |
| NFR assessment / final gate | `inv-0013`, then `ga-0004`: full audit of final candidate, pass |

The four [gate records](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/gates)
retain mode, revision and result. None was a failed repair attempt. Acceptance
and stage ordering are also retained in [events.jsonl](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/events.jsonl).

## Prompt coverage

Three subagents reviewed the twelve kinds sequentially in separate assignments.
All thirteen instances were covered, including both assignment-phase variants,
actual native instructions/input/tools and inherited context at each applicable
point. Reviews distinguish required information supplied directly, inherited or
obtainable through actionable pointers from task-irrelevant material. Required
information was sufficient for the observed tasks; latent contradictions and
failed pointers below still merit correction.

| Prompt kind | Instances | Task message bytes | Review |
| --- | --- | ---: | --- |
| Catalog intake | `inv-0001` | 6,234 | [Intake](2026-10-09-status-badge-tone-postmortem/reviews/intake.md) |
| Initial architecture analysis | `inv-0002` | 18,350 | [Initial analysis](2026-10-09-status-badge-tone-postmortem/reviews/initial-analysis.md) |
| Catalog check | `inv-0003` | 10,538 | [Catalog check](2026-10-09-status-badge-tone-postmortem/reviews/catalog-check.md) |
| Local orientation | `inv-0004` | 15,947 | [Local orientation](2026-10-09-status-badge-tone-postmortem/reviews/local-orientation.md) |
| Context selection | `inv-0005` | 5,267 | [Context selection](2026-10-09-status-badge-tone-postmortem/reviews/context-selection.md) |
| Assignment / completion variants | `inv-0006`, `inv-0010` | 11,080 / 14,498 | [Assignment and completion](2026-10-09-status-badge-tone-postmortem/reviews/local-assignment-and-completion.md) |
| Engineering | `inv-0007` | 21,275 | [Engineering](2026-10-09-status-badge-tone-postmortem/reviews/engineering.md) |
| Code review | `inv-0008` | 11,462 | [Code review](2026-10-09-status-badge-tone-postmortem/reviews/code-review.md) |
| Scope review | `inv-0009` | 13,915 | [Scope review](2026-10-09-status-badge-tone-postmortem/reviews/scope-review.md) |
| Design orientation | `inv-0011` | 16,347 | [Design orientation](2026-10-09-status-badge-tone-postmortem/reviews/design-orientation.md) |
| Design review | `inv-0012` | 8,392 | [Design review](2026-10-09-status-badge-tone-postmortem/reviews/design-review.md) |
| Nonfunctional assessment | `inv-0013` | 6,597 | [NFR assessment](2026-10-09-status-badge-tone-postmortem/reviews/nonfunctional-assessment.md) |

Bytes describe current UTF-8 task messages, excluding role instructions and
inherited history. They are not provider token counts. Native request identity
was matched to the last exact task message in ordered input, avoiding attribution
of later local-session requests to the initial orientation.

## Findings and correction direction

Severity describes postmortem impact: medium findings affect evidence reliability
or operational guidance; low findings produced bounded wasted work or represent
unmeasured simplification opportunities. None establishes a failed implementation.

| Finding | Severity and affected location | Expected versus observed / impact | Correction and validation |
| --- | --- | --- | --- |
| F1: Snapshot inspection missing from exploration metrics | Medium; code/scope/design review and NFR assessment | `reads`, `searches` and returned bytes are zero despite 70 snapshot operations returning 125,109 bytes. No exploration coverage warning marks this excluded tool family. | Record snapshot operations with existing call identities, or explicitly show those measures as partial. Reconcile one retained snapshot session against its transcript and verify replay does not double-count. |
| F2: Relative injected skill reference is unusable | Medium; initial architect, `inv-0002` | `skills/module-architect/references/discovery.md` resolves under the fixture root and fails with `ENOENT`; analysis proceeds without that reference. | Resolve referenced resources against the injected skill's actual directory or deliver the required reference. Verify the delivered pointer works from the actual task cwd. |
| F3: Conflicting engineer handback/control wording | Medium for missing-capability response; low for generic controls; `inv-0007` | Role/procedure say `capability-needed`; brief says missing foreign symbols use `unsuitable`, reason `scope`. Other prose suggests `git diff` while role forbids Git, and states one repair round while environment exposes three. No relevant handback/retry failure occurred. | Render one phase-appropriate handback/control contract, preserving architect authority and current procedure priority. Review a missing-capability case and an actual repair case against the supplied tool/schema. |
| F4: Record pointer presented as candidate file | Low; code review, `inv-0008` | Serialized request advertises `work-items/wi-001/iterations/01/assignment.json`; `snapshot_read` cannot find it in the committed candidate. Assignment content is already supplied, so review succeeds. | Separate harness record identifiers from snapshot-readable paths; retain fixed assignment content. Verify no inaccessible pointer is presented as a readable candidate resource. |
| F5: API-view scope and empty directories are unclear | Low; local orientation and engineering | Package/same-owner symbol searches in foreign application API views return no matches; two orientation child searches and one engineer child listing target nonexistent directories. | State catalog scope once, name existing directories, and keep ordinary/testing areas independent. Check application-API and package-discovery examples separately. |
| F6: Coverage searches collect largely irrelevant records | Low; initial architect, `inv-0002` | Three view-wide limit searches return 21,143 bytes; bare `unknown` returns 20,429 bytes, including unrelated tests/types and `unknown:0`. No ownership error follows. | Read structured metadata and relevant record markers; investigate a concrete limitation instead of searching generic prose. Compare returned output and decision quality for the same question. |
| F7: Repeated or phase-irrelevant prompt material | Low; multiple read-only tasks and engineering | Read-only tasks repeatedly receive about 2 KB of limits/view inventory; completion repeats 8,818 bytes of unchanged procedure/environment; full captured plan is both pasted and reread; engineer receives duplicated Cucumber machine detail. No task failure is attributable. | Keep one authoritative pointer/representation and relevant execution limits. Preserve stable cached role context and current submission/schema. Measure actual new input and charge after changing appended content. |
| F8: Supplied global view identity does not track observed content | Low; local orientation | Task advertises the initial architect revision, but later lookup contains newly materialized scenario records absent from initial analysis. Exact live global metadata was not read. | Capture the publication identity addressed by the task and retain identity with returned records. Do not label the actual view stale on this evidence alone. |
| F9: Empty prepared-candidate diff used as historical evidence | Medium; NFR assessment, `inv-0013`, `nfr-003` | Supplied base and head are the same final commit. `The candidate changed nothing` is cited as additional evidence that feature views were not changed. It cannot establish preservation across the implementation. Independent current source still supports compatibility. | Label prepared-source versus run-start comparisons explicitly, supplying a historical comparison when needed. Validate evidence identities; leave semantic satisfaction with the assessor. |
| F10: Fresh NFR assessment rediscovers known source | Low; `inv-0013` | Known badge/owner/caller paths are omitted. A root-src search has no match, followed by a root-wide search returning 10,207 bytes and root README read returning 12,019 bytes. Useful inspection follows. | Supply known paths as non-binding starting pointers, confirm them in the current snapshot, and permit wider investigation. Compare inspection coverage and discovery cost. |
| F11: Completion summary asserts an unnamed foreign definition | Low; `inv-0010` | Brief says an outside step definition reached the run through an import verified by Ramify. All seven named non-hook locations are owner-local; hook origins are unknown. The architect does not repeat the claim. | Emit such a statement only with matching named definition/import evidence; otherwise preserve the actual owner-local locations and uncertainty. |
| F12: Review brief and procedure disagree about listing changed paths | Low; scope/design review | Brief says read `snapshot_diff` first; current procedure says use the supplied canonical changed list. An extra pathless diff is performed despite that list. | Align the brief with the task-specific procedure; retain per-file audited patch reads, which remain necessary. |

The detailed reviews contain exact excerpts and raw artifact links for F2–F12.
For F1, [tool-calls.json](2026-10-09-status-badge-tone-postmortem/tool-calls.json)
retains every decoded call and original transcript line; [metrics.json](/home/app/ramify-trial-evidence/status-badge-tone-20261009/metrics.json)
contains the contradictory zero-valued exploration summaries. F3 is a latent
contract problem; the successful current procedure supplied a workable resolution.
F6, F7 and F10 are potential efficiency improvements, with no demonstrated savings.
F9 corrects an evidence inference, without rejecting the assessor's independently
supported compatibility judgment or inventing a harness semantic rule.

The strongest measured duplication is the completion continuation: the unchanged
6,614-byte assignment procedure and 2,204-byte environment are already inherited
and then appended again, forming 60.8% of the new 14,498-byte message. Keeping the
inherited policy while appending changed candidate/gate/obligation facts is a
specific candidate for improvement. The current low first-call cache share is
not proven to be caused by this duplication.

Source-path mistakes were also bounded: local orientation guessed two incorrect
ancestor-relative config paths despite correct absolute pointers already supplied,
then recovered. Across all roles there were eight tool-result errors, no rejected
submissions and no repair iteration. Missing `tests/steps` before creation was a
legitimate existence probe; it is not a prompt defect.

## Materialized views: use and usefulness

### Architects

The initial architect used generated records to find shared-ui ownership,
`StatusBadgeProps`, and both existing consumers. The local architect confirmed
the type-only `ReviewStatus` contract through its ordinary API view and explicitly
preserved coverage limits. It inspected owned source/tests for implementation
details and configured discovery, rather than searching foreign provider source.
These are positive view-to-decision chains, not merely read counts.

| Phase | Architect-view calls | API-view calls | Owned source/scenario reads | Other exploration | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial analysis, `inv-0002` | 14 | 0 | 0 | 2 | 16 |
| Local orientation, `inv-0004` | 1 | 17 | 3 | 12 | 33 |
| Assignment, `inv-0006` | 0 | 0 | 0 | 0 | 0 |
| Completion inspection, `inv-0010` | 0 | 0 | 3 | 0 | 3 |
| Total | 15 | 17 | 6 | 14 | 52 |

This broad denominator includes reads, searches and listings, including failures.
Other exploration includes onboarding, configuration, owner-directory listings
and a failed skill read. View calls are 32/52 (61.5%); direct source/scenario reads
are 6/52 (11.5%). **That is activity distribution, not a score for architectural
discovery:** the completion's three reads verify changed local files and are not
discovery. Initial analysis's eleven strict owner/behavior-discovery calls all
targeted the architect view; its three additional view calls investigated limits.
Local cross-module discovery used seventeen API calls and one architect lookup,
with zero foreign-source fallback. No mixed/unknown call targets occur in these
classified role groups.

Episodes: initial architecture discovery and its coverage follow-up were
view-first; local received-interface discovery and its focused owner/consumer
recheck were also view-first, with no foreign-source fallback. Local implementation
orientation was source-first as explicitly instructed. Configuration discovery
and completion verification remain separate. This run provides no example of
architects bypassing a sufficient view to search the broader codebase.

Initial view calls returned 46,433 bytes; local orientation's API/architect calls
returned 8,089/2,515 bytes. The latter included catalog enumeration and nonexistent
child-directory probes, so more view activity would not necessarily improve the
task. Returned bytes include formatting/errors and are not scanned bytes or tokens.

Freshness evidence is bounded. Initial architect metadata was read; local ordinary
and testing API metadata both identified revision suffix `:2`, with coverage
1/2. The ordinary `ReviewStatus` page was read and applied. F8 concerns supplied
global identity versus observed changing records, not a proven stale publication.

### Engineer

The engineer performed seven API-view calls among eighteen read/search/list calls
(38.9%). It read the testing view's contracts vocabulary. The existing ordinary
`ReviewStatus` import remained unchanged and the ordinary view was not opened.
New Cucumber bindings used package APIs (`IWorld`, Given/When/Then, React rendering,
Node assertions) and module-local state, which are outside foreign application
API-view scope.

| Capability need | Supplied / consulted / applied / verified |
| --- | --- |
| Existing `ReviewStatus` dependency | View pointers supplied; testing catalog/page consulted; existing production type import preserved; no demonstrated new import/call decision from that page |
| New foreign application capability | None; assignment `externalCapabilities` is empty and candidate adds no foreign application import. Adoption success rate is not applicable, denominator zero. |
| Cucumber/rendering/package support | Package configuration/examples supplied; package names unsuccessfully searched in the application view, then local/support source inspected; package APIs correctly used and recorded checks passed |

Two support-discovery searches returned 26,542 bytes. They helped check whether
a custom World/support existed, but their necessity and savings from narrower
discovery are unmeasured. The run supports useful interface orientation by the
architect; it does **not** establish broad engineer success at adopting foreign
capabilities through API views. A task needing a new exposed application API
would be needed to assess that stage.

Reviewers and the NFR coordinator were deliberately given committed snapshot
tools that exclude generated views. Their source inspection is verification
under that task contract, not evidence of choosing source over an accessible
materialized view. F10 concerns missing useful source pointers in this separate
source-only workflow.

## Collected metrics

Policies are `kpi/1`, `scope-size/2` and `lineage/1`. All 55 per-call usage rows
reconcile exactly with invocation outcomes, the result summary and projected
usage categories. All 55 native payload content hashes validate. Charges below
are estimates from **recorded rates**, not a provider invoice or today's prices.

| Role | Invocations / model calls | New input | Cached input | Output | Recorded-rate estimate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Catalog extractor | 2 / 4 | 9,060 | 7,552 | 1,181 | $0.062881 |
| Initial architect | 1 / 4 | 27,887 | 21,120 | 4,130 | $0.202596 |
| Local architect | 3 / 10 | 51,356 | 91,648 | 4,268 | $0.327443 |
| Context selector | 1 / 1 | 7,398 | 6,656 | 278 | $0.037814 |
| Engineer | 1 / 9 | 48,975 | 119,936 | 3,829 | $0.320454 |
| Reviewer | 4 / 20 | 71,438 | 340,096 | 3,721 | $0.496210 |
| NFR coordinator | 1 / 7 | 18,322 | 34,048 | 2,928 | $0.145467 |
| Total | 13 / 55 | 234,436 | 621,056 | 20,335 | $1.592866 |

Cache writes are zero. These recorded usage categories are disjoint: every
call's total equals new input + cache read + cache write + output. The cache-read
share of input is 621,056 / 855,492 = **72.6%**. Recorded rates per million are
$4 new input, $0.40 cache read, $5 cache write and $20 output; costs are $0.937744,
$0.248422 and $0.406700 for the nonzero categories respectively.

The engineer's 101.494-second invocation, initial architect's 85.525 seconds and
NFR coordinator's 63.298 seconds are the largest individual wall intervals.
Reviewers account for 31.2% of estimated charges. Scope review alone uses eleven
model calls and 325,199 total tokens (37.1% of the run), most cached. Its ten
inspection calls were issued separately across turns. Batching independent named
patch/read requests is a potential prompt improvement; there is no matched trial
proving latency or charge savings.

The model-duration sum is 465.002 seconds and tool-duration sum is 48.873 seconds;
invocation wall intervals sum to 499.260 seconds. These overlap across sessions
and parallel tools and must not be added into a run wall-time estimate. Per-
invocation check timing is unavailable, although gate timing/modes and engineer
shell/check results are retained elsewhere.

| Measurement | What it establishes and what it misses |
| --- | --- |
| Exploration | 35 ordinary read attempts, 37 searches/listings, 119,932 returned bytes. Snapshot review/coordinator inspection is excluded despite retained tool transcripts. |
| Snapshot inspection recovered here | 42 read attempts, 4 searches, 9 listings, 15 diffs; 125,109 returned bytes. These are distinct calls, not replays or inherited-history charges. |
| `observation-coverage` = 12/13 | Invocations without a recorded top-level gap; the engineer has `unguarded-shell`. This is not 92.3% completeness of every metric or tool family. |
| Search breadth/outside-scope/unique targets | Ordinary search output often lacks matched-file identities/scanned-byte totals; detailed coverage fields retain those limits. Zero broad-search count does not establish that all returned context was relevant. |
| Scope-size ratio 0.05969 / reduction factor 16.753 | Declared engineer scope 40,661 bytes versus frozen baseline 681,195 bytes. Measures declared available scope, not consumed context, observed savings or solution quality. |
| Engineer scope components | 3,338 owned bytes, 7,218 API-view bytes, 30,105 support/brief bytes; support is 74.0% of declared scope. This locates overhead, not a proof that all support can be removed. |
| Session-weighted total | Unavailable, known subtotal 849,453 bytes; only 2/11 sessions have complete size inputs. Keep unavailable rather than normalizing the subtotal into a run efficiency claim. |
| Lineage | Two continuations, three forks, no degradation or replacements. Generation-1 fork groups are inapplicable to these nonglobal forks; their zero/N/A does not mean no forks occurred. |
| Context events | No compactions, budget returns or adaptation sessions; no overflow/recovery problem observed. Starting context is an estimate after the first exchange, not inherited-prefix token size. |

The snapshot gap is the first metrics improvement to make. The next useful
presentation change is to separate per-boundary cache results from invocation
totals, using fields already retained here. This postmortem does not require a
new general semantic collector or a metric-driven automatic completion decision.

## Cache use at continuation and fork boundaries

Every examined boundary's first native request preserves the parent's last
request instructions, ordered top-level tools, cache key, and full ordered input
prefix. Only `input` changes, through appended messages. The comparisons cover
72, 72, 84, 84 and 1 leading input items respectively. They compare actual
serialized request JSON values, not prompt-template hashes. Source points,
request paths and first usage row links are in [measurements.json](2026-10-09-status-badge-tone-postmortem/measurements.json).

New phase instructions and dynamic tool declarations are appended in request
input; the old top-level tool list is historical, not the current active-handler
list. For example, context selection retains parent `submit_work_orientation`
at the top level while its additions declare `submit_context_selection` and the
current active-tool restriction. Do not misdiagnose that as a wrong current tool
or replaced leading system prompt from the display transcript alone.

| Boundary / parent | Actual mode | First call new input | First call cache read | First call output | First-post-fork cache share | Continuation first cache share | Whole-invocation cache share |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `inv-0005` / `inv-0004` | Fork: context selection | 7,398 | 6,656 | 278 | 47.4% | — | 47.4% |
| `inv-0006` / `inv-0004` | Continue: assignment | 8,654 | 11,520 | 1,121 | — | 57.1% | 75.9% |
| `inv-0009` / `inv-0006` | Fork: scope review | 20,569 | 6,656 | 77 | 24.4% | — | 91.7% |
| `inv-0010` / `inv-0006` | Continue: completion | 19,027 | 6,656 | 170 | — | 25.9% | 59.0% |
| `inv-0012` / `inv-0011` | Fork: design review | 3,597 | 4,352 | 99 | 54.7% | — | 52.6% |

Ratios use cache read / (new input + cache read), excluding output; cache writes
are zero. Coverage is 3/3 fork first requests and 2/2 continuation first requests.
Fresh invocations' first requests all have zero cache reads in this run.

The scope-review contrast is material: a 91.7% invocation cache share hides a
24.4% first-post-fork share. All five boundaries hit some cache, but hit size is
not determined by the preserved prefix alone. The evidence rules out the
examined prompt/tool/key replacement explanation for these requests; provider
cache placement, retention and internal processing remain unobserved. No cache
expiry, routing failure or prefix-token saving is inferred.

Keep exact inheritance. Narrow future appended task material where it is
irrelevant, then compare first-boundary new input/cache reads and recorded charges
for the same task. Do not trim or replace inherited history and call the result
an exact fork. No cache performance regression or net savings versus the earlier
trial is claimed without a controlled, comparable measurement.

## Priorities and evidence limits

1. Make snapshot exploration visible or explicitly partial; retain original call
   identities and returned-output provenance. This directly improves the validity
   of role comparisons and postmortems.
2. Fix the skill-reference and assignment-resource pointers, reconcile the
   engineer's handback/control wording, and distinguish the NFR candidate's
   final-to-final diff from historical change evidence. These have concrete
   failed-read, contradictory-contract or unsupported-inference evidence.
3. Clarify API-view scope/existing directories, restrict metadata investigation
   to the actual question, consolidate phase-irrelevant environment material,
   and pass known source pointers to the fresh NFR assessor.
4. Surface first-call boundary cache measurements and assess batching independent
   scope-review inspections. Preserve exact prefixes and architect authority.

The single small, successful UI task has no new foreign application dependency,
capability negotiation, repair, session loss or budget return. Conclusions about
those paths are limited to latent prompt contracts, not demonstrated execution
failures. Generated-file identity is only verified where retained metadata or
content was read; today's view files cannot supply missing historical identity.
No proposed change has been implemented or performance-qualified by this work.

Reproducible analysis artifacts: [collector](2026-10-09-status-badge-tone-postmortem/collect.py),
[measurements](2026-10-09-status-badge-tone-postmortem/measurements.json),
[per-call usage](2026-10-09-status-badge-tone-postmortem/per-call-usage.json),
[decoded tool calls](2026-10-09-status-badge-tone-postmortem/tool-calls.json),
and [source hashes](2026-10-09-status-badge-tone-postmortem/source-hashes.json).
The collector validates per-call totals against three retained aggregates,
native/transcript body hashes and request counts. The twelve delegated reviews
preserve detailed positive findings, excerpts, coverage and correction proposals.
