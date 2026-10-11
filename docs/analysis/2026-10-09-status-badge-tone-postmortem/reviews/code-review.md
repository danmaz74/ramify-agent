# Code-review prompt review

The code reviewer inspected every changed file, its full surrounding content,
the plan, existing callers and relevant runner/compiler configuration, then
submitted a valid review with no concerns. Its prompt supplied the necessary
objective, candidate, authority and submission information. One advertised
assignment path was not accessible through snapshot tools and caused an
unnecessary failed read. The metrics projection's zero exploration totals conceal
the substantial snapshot inspection that actually occurred.

## Complete instance coverage and retained sources

Covered kind **reviewer / code**, invocation and operation `inv-0008`, display
session `ses-0007`, provider session
`4db1f70a-67fc-4be3-b422-2613b94b76aa`, review request `rq-0001`, work item
`wi-001`, iteration `wi-001.i01`. Requested/actual mode was fresh and there was
no inherited parent history. The audited candidate was
`afef5487213d7c2729e95e4e5956e6bb30059390`, tree
`2a89ca2d463c9ed79ef5d1e5898111d18d807d14`; the review diff base was
`44a1f25d246a9ca2609654ca274002acdbbd90ad`, and the supplied gate was `ga-0002`.

Primary evidence:

- **C:** [operation packet](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/6354b95d64325a5e901824f8889a66fb5b3b546ab49c86dc4a31c87d5b34bebd.json), `packet.roleInstructions`, `packet.message`, `packet.additions`, and `declarations`.
- **T:** [transcript ses-0007](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0007.jsonl). References `n=N` identify transcript records; blob references were resolved using the run's `blobs/<hash>`.
- **I:** [invocation](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0008/invocation.json).
- **S:** [submission](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0008/submission.json).
- **O:** [outcome](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0008/outcome.json).
- **N:** [first native provider request](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/d08f15c7aacd0e5ab3859f2f7519680449923c26166c18cdd21b5111c45a2635), correlated at [session-ledger.jsonl:373](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/session-ledger.jsonl:373).
- **A:** [observations](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0008/observations.jsonl).
- **M:** [derived measurements](/ramify/ramify-agent/docs/analysis/2026-10-09-status-badge-tone-postmortem/measurements.json), `inventory[invocation=inv-0008]`, useful for finding all four native request payloads; conclusions below use their raw contents.

The actual system instructions measure 2,546 UTF-8 bytes and current user message
11,462 bytes (I; C). N's `instructions` exactly match C's role instructions;
its initial single user `input_text` exactly matches C's message. Native tools
are precisely snapshot_list, snapshot_read, snapshot_search, snapshot_diff and
submit_review. All four native requests retain identical instructions. The
actual task goal and available context are established at the provider boundary,
without relying on today's templates.

## Required-information assessment

| Requirement | Assessment and observed use |
| --- | --- |
| Review objective | Met: code review of the exact frozen audited candidate, with concrete iteration goal/approach/evidence and every cited plan requirement. |
| Current state and comparison | Met: candidate commit/tree, passed gate, diff base and canonical four-path changed list are explicit. Both feature pending-tag changes have harness attribution. |
| Constraints and caller compatibility | Met: optional four-value tone, default neutral, unchanged status/label, presentation-only primitive and unchanged feature callers. T n=19 reads the actual candidate plan; n=25-26 reads both callers. |
| Authority and write scope | Met: reviewer has only snapshot readers and submit_review, changes nothing, reports concerns for later local architect judgment. No forbidden command/write or generated-view request occurred. |
| Execution location | Met operationally: role explicitly makes every snapshot path relative to candidate root. The environment's absolute workspace is unnecessary, but the reviewer did not mistake it for a readable path. |
| Evidence and verification | Met: changed patches, full candidate source, test/runner/compiler pointers and passed-audit identity. Review requires inspection rather than rerunning checks. Grounding rule requires a file read with snapshot_read for any grounded concern; the plan and tests are accessible and read. |
| Submission and completeness | Met: schema-bearing submit_review, inspected/missing/concerns, one occurrence per changed path. All four files are inspected; first submission is accepted with zero concerns/missing. |
| Assignment record pointer | Unusable as a snapshot path: see CR-01. It is redundant with the pasted goal/approach/evidence, so it did not deprive this review of essential assignment information. |

No missing plan requirement, unresolved placeholder, necessary unavailable tool,
wrong candidate or rejected submission was observed. The current code procedure
explicitly instructs use of the supplied canonical changed list; it takes
precedence in operation over generic wording to “Read snapshot_diff first.” The
reviewer starts with the four per-path diffs and does not redundantly list all
paths. This is a correct use of the procedure, not a failure to inventory changes.

## Actual inspection and completeness

| Tool activity | Attempts | Successful answers | Evidence |
| --- | ---: | ---: | --- |
| snapshot_diff | 4 | 4 | T n=3 calls; n=4-7 answers, one patch for every changed file. |
| snapshot_read | 15 | 14 | T n=3, 13, 23 calls; n=8-11, 14-19, 24-28 answers. Only the assignment record is absent. |
| snapshot_list | 4 | 4 | T n=12, 20-21, 29 answers. |
| snapshot_search | 1 | 1 | T n=22, project-wide symbols/step phrases. |
| submit_review | 1 | 1 | T n=30-32; accepted first time. |

There are fourteen successful unique snapshot file reads: four changed files,
four initial project/audit/package/Cucumber configurations, the plan, the module
declaration, both existing callers, tsconfig and Vitest configuration. Every
changed file has both a patch and a full-content read. The latter permits
surrounding-code assessment and grounding, so these pairs are not automatically
wasteful repeated reads. The project-wide search identifies both callers and
checks the step phrases before focused follow-up reads; it is proportionate to
caller compatibility and duplicate registration concerns in this small fixture.

The four patch results return 5,946 UTF-8 bytes; the fourteen successful full-file
results return 22,976 bytes including snapshot line-number formatting. All
twenty-five tool results, including lists/search/error/submission acknowledgement,
sum to 33,828 bytes from each resolved body reference's recorded byte count. This
is returned output, not bytes scanned or provider tokens. No file from a
generated materialized view was read. The role explicitly refuses generated
views and C's environment exposes no views, so snapshot source inspection is
legitimate frozen-candidate verification. It must not be classified as an
architect's source-first discovery or a failure to use a materialized API view.

The review finds no actionable defect and submits every changed path in
`inspected`, with empty `missing` and `concerns` (T n=30; S). This is supported
by actual answered tool calls, not just by the accepted submission or the
previous passing audit. It remains the reviewer's report about this candidate;
later local architect judgments are separate.

## Findings and corrections

### CR-01 — Low: durable assignment metadata appears as an unusable snapshot pointer

**Affected:** inv-0008; C's serialized review-request under `Requirements`.
**Expected:** pointers delivered to a snapshot-only reviewer identify candidate
files or explicitly identify already summarized durable run metadata.
**Observed:** the request says
`"assignment":"work-items/wi-001/iterations/01/assignment.json"`, while role
instructions say “Every path is relative to the candidate's root.” T n=13
attempts that exact snapshot_read. T n=18 returns:

> The audited candidate has no "work-items/wi-001/iterations/01/assignment.json"

**Impact/confidence:** high confidence in one failed, unnecessary read and the
misleading advertised path. The record lives outside candidate source; the
iteration goal/approach/evidence were already pasted. The reviewer continued,
read the plan and returned complete coverage, so no lost review requirement or
submission failure is established. **Correction:** remove this path from
reviewer-facing metadata or label it “durable run record, summarized below,
not readable with snapshot tools.” Keep the assignment content and candidate/
request identities, and expose actual candidate-relative ground pointers.

### CR-02 — Medium: exploration projection reports zeros despite snapshot inspection

**Affected:** inv-0008 metric interpretation; M's exploration projection and A's
tool-start records. **Expected:** reviewers' source inspection is either counted
or explicitly excluded from exploration coverage. **Observed:** M reports
`reads: 0`, `uniqueFilesRead: 0`, `returnedBytes: 0`, `searches: 0`,
`toolElapsedMs: 0` and no gaps, although T proves fourteen successful reads,
four patch reads, one search and four lists. A n=4 records snapshot_diff with
`"kind":"other","requestedScope":[]`; snapshot activity is present in raw
records but absent from these exploration totals.

**Impact/confidence:** high confidence in the divergence between projected fields
and actual activity. These fields cannot answer how much code reviewers
inspected or how much source output entered their context; zero is misleading
if presented as role-independent exploration. This is a collection/coverage
finding, not a claim the reviewer performed no work or a defect in the review.
**Correction:** explicitly classify snapshot_read/search/list/diff for candidate
inspection, or expose separate snapshot-inspection metrics plus declared
exclusions. Preserve candidate/base identity and distinguish full source reads
from patches; do not double-count inherited/replayed results. The fourteen
successful unique files and four patches above provide a concrete reconciliation
case. If historical policy intentionally excludes them, show that exclusion
rather than interpreting zero as lack of exploration.

### CR-03 — Low: unrelated runtime details and duplicated identity metadata increase prompt size

**Affected:** inv-0008, C's serialized request and `Current environment`.
**Expected:** frozen-candidate review receives candidate/base, changed paths,
assignment constraints, grounding and submission rules, with only useful
runtime details. **Observed:** the serialized review request occupies 637 UTF-8
bytes and repeats request/candidate/base/tree/element identifiers already stated
elsewhere. Some provenance is useful; its unusable assignment pointer is covered
by CR-01. The environment addition is 1,741 UTF-8 bytes, including the actual
workspace path, orchestrator limits for placement/work items/reconciliation/
capability iterations, and source prompt `supportPaths` outside this candidate.
These do not help a reviewer with no shell or live workspace access. Relevant
invocation/submission limits and snapshot identity should remain available.

**Impact/confidence:** high confidence in redundant/irrelevant delivery, moderate
confidence about achievable reduction; no observed harmful effect and no
provider-token reduction measured. The numbers are section sizes, not all
removable bytes. **Correction:** present a review-specific environment and one
readable request/candidate identity block. Keep exact pending-tag provenance and
all plan constraints; do not remove the helpful explanation that harness-produced
feature changes are part of the audited diff. Validate a narrower packet with
the same changed-path and grounding behavior plus measured input/cache cost.

## Evidence gaps and no-issue conclusions

There is no evidence of a materially deficient code-review prompt: it supplied
all behavioral requirements, preserved audit-versus-review authority, and enabled
a complete first-submission result. No proof that prompt verbosity caused longer
review time is retained; the duplicate metadata finding is a targeted improvement
opportunity. No concerns were submitted, so enforcement/weighting of a grounded
versus ungrounded concern was not exercised. Absence of concerns is not an
independent proof of semantic completeness or that every possible defect was
excluded.

The four retained native requests establish what pi sent, not the provider's
internal tokenization or processing. The first fresh call has 4,302 new input
tokens and zero cache reads; total invocation usage is 19,963 input, 20,736
cache-read and 1,835 output (A n=2; O), over 44,180 ms. Total cache-read usage
comes from later turns and must not be attributed to a nonexistent continuation
or fork boundary. No tests/providers/runtime changes were run for this review.
