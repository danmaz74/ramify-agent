# Design-review prompt review

The design reviewer received the three actual guidance documents through its
orientation fork, then a precise frozen-candidate task. It inspected every
changed patch and full file, read all three guidance files from the candidate,
and submitted a complete review with no concerns. The prompt was adequate.
Improvements are to align changed-path discovery wording, clarify supplied
guidance versus current snapshot grounding, and narrow unrelated environment
details. The current guidance reads are not evidence of a failed orientation
reuse contract.

## Instance coverage and primary evidence

Covered prompt kind **reviewer / design**, only instance `inv-0012`, operation
`inv-0012`, request `rq-0003`, work item `wi-001`, iteration `wi-001.i01`, display
session `ses-0010`, provider session
`3a5d8c48-0845-4e97-abb0-a45aaa70a74b`. Actual/requested start was fork from
design-orientation `inv-0011`, display session `ses-0009`, provider session
`bcfbcc72-b344-4baf-b7a2-557b6c6ea023`, turn 1, checkpoint
`03205fb1-36a7-4c9b-bc14-1903c907a548`. The orientation key was
`a0a8ebf59cb6711f71b3d33c93c8ae044e414ed27e9a0d5739bf55d1c3ed95ef`.

- **C:** [current operation packet](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/c8f7ef0864f8827dbb3ccde7bcdb1da73044fb16ba2b2049e4403ddacfe47a35.json), including context, additions, declarations and policy.
- **T:** [ses-0010 transcript](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0010.jsonl), references use its `n` field; blob bodies were resolved.
- **P:** [parent orientation transcript](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0009.jsonl).
- **N:** [first native child request](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/95e1aace435fdede6c27037597a78eb8177c5b0417778ea0f100558060262162), correlated at [session-ledger.jsonl:559](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/session-ledger.jsonl:559).
- **M:** [measurements.json](/ramify/ramify-agent/docs/analysis/2026-10-09-status-badge-tone-postmortem/measurements.json), inventory inv-0012 indexes all four native requests, and inv-0011 indexes the raw parent request used for exact prefix comparison.
- **S:** [submission](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0012/submission.json).
- **O:** [outcome](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0012/outcome.json).
- **OBS:** [observations](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0012/observations.jsonl).

Candidate `afef5487213d7c2729e95e4e5956e6bb30059390`, tree
`2a89ca2d463c9ed79ef5d1e5898111d18d807d14`, diff base
`44a1f25d246a9ca2609654ca274002acdbbd90ad`, gate `ga-0002` are explicit in C.
The user task is 8,392 UTF-8 bytes, role instructions 2,546 bytes.

## Actual inherited and current delivery

N starts with seven provider input items. Its first user item exactly equals
the sole parent native request input: a 16,347-byte orientation message containing
the full README.md, workspace README and shared-ui README, each labeled with
its captured identity. Next come parent reasoning, submit_orientation and its
accepted result. The summary describes preserving module ownership/tags/exposure,
workspace shell/relay responsibilities and shared-ui browser presentation
ownership. This is a useful bounded summary, not an invented replacement standard.

The child's remaining items add the current snapshot tools, active-tool note and
design-review user task. The final user text exactly equals C's message. All
four raw native requests retain the parent's baseline instructions and global
tools, which list only submit_orientation. The additional-tools developer item
and current active note make snapshot_list/read/search/diff and submit_review
active. C's declarations/policy agree: the reviewer writes nothing and submits
through submit_review. The historical orientation submission tool is inactive;
no call to it occurs in the design review.

The parent submission's `read` array contains README.md,
subs/workspace/README.md and subs/workspace/subs/shared-ui/README.md. P shows no
snapshot_read call: orientation had only submit_orientation and read **supplied
text**. Those entries prove text receipt/declared understanding, not snapshot
tool access or current concern-grounding evidence. The child's current task
lists the same guidance identities, permits reuse of that known understanding,
and requires a current snapshot_read for the ground of every reported concern.
The child does read all three candidate guidance files (T n=11-13), so actual
current evidence is available even though it ultimately reports no concerns.

## Required information and usability

| Need | Assessment |
| --- | --- |
| Design standard | Met: exact three supplied guidance documents and parent summary, current guidance paths/hashes and candidate snapshot tools. Only listed guidance is authoritative for this review. |
| Iteration goal/constraints | Met: optional constrained tone/default/markup, unchanged labels/callers, shared presentation owner, real static-markup tests and scenario-local steps. The iteration goal/approach/evidence are pasted. Design review intentionally differs from scope and correctness reviews. |
| Frozen state | Met: commit/tree/base, passed audit identity, four canonical changed paths, harness attribution of feature pending-tag changes. |
| Authority/scope | Met: reviewer cannot change files/execute commands/schedule work; it reports design concerns for architect assessment, never assumes assignment changes. |
| Grounding | Met: current guidance files available through snapshot_read; inherited guidance understanding is distinct from the per-review grounding requirement. |
| Submission and completeness | Met: submit_review schema, every changed path inspected/missing once, concerns actionable against listed guidance. All four files covered and first submission accepted. |
| Execution paths/tools | Met operationally: snapshot paths resolve from candidate root; current explicit active tools override historical tool use. No inaccessible needed file or tool error occurred. |

No essential information was omitted. The design task omits the full catalog
package supplied to code/scope review, but it supplies the iteration constraints
and the exact design guidance it asks the reviewer to apply. That is appropriate
selection for this kind rather than evidence of a missing standard.

## Actual activity and result

T n=3 calls pathless snapshot_diff; n=4 returns the four supplied changed paths.
T n=5 batches all four per-path diffs; n=6-9 answer them. T n=10 batches seven
snapshot_read calls: the three guidance files plus all four changed files;
n=11-17 answer all. The final model turn submits inspected coverage for all four
files with no missing paths or concerns (T n=18-20; S). There are four model
calls, five diff calls, seven successful unique-file reads and one accepted
submission. No repair, rejection, unavailable tool or metadata-path error occurs.

Resolved tool-result bodies total 26,742 UTF-8 bytes. Seven snapshot-read results
account for 20,460 bytes; guidance reads account for 13,369, including 12,019 for
root README.md. Counts include line-number formatting; they are returned output,
not scanned bytes or provider tokens. Existing guidance was supplied in history,
while this fresh snapshot output establishes candidate evidence. Do not
deduplicate the new model/tool calls as inherited billing just because their
document text overlaps.

M's exploration projection remains all zero despite the seven snapshot reads
and five diff calls. This is the same reviewer snapshot measurement limitation
identified in the code-review report. It does not establish absent inspection.
Generated materialized views are refused for this role and none are read; the
calls are frozen design verification, not architecture-discovery avoidance.

The first post-fork call has 3,597 new input tokens and 4,352 cache-read tokens,
**54.749%** of new-plus-cached input, with 99 output tokens (OBS n=2). O totals
19,857 new input, 22,016 cache reads and 909 output across 27,464 ms. Native
prefix preservation and measured hits are separate facts; the totals do not
describe first-call reuse, and unchanged identities do not guarantee a hit.

## Findings

### DR-01 — Low: generic discovery wording prompts a redundant pathless diff

**Affected:** inv-0012, C generic briefing/current procedure, T n=3-4.
**Expected:** use the supplied canonical changed list and batch its four patches.
**Observed:** the generic briefing says “Read snapshot_diff first” while the
procedure says “Use the supplied canonical changed-path list; if unavailable,
list paths once.” The first child call lists exactly the already supplied paths,
then the next call batches their patches.

**Impact/confidence:** high confidence in one redundant model/tool turn;
no missing coverage or wrong review followed. **Correction:** align generic
wording with the current procedure and preserve the canonical list/harness
attribution. The same small redundancy occurs in scope review; code review
correctly skips it. Measure whether the corrected packet removes that first
turn without weakening inspection.

### DR-02 — Low: distinguish known supplied guidance from current snapshot grounding more explicitly

**Affected:** inv-0012, C's guidance section versus current procedure.
**Expected:** make it clear when known guidance can be reused and when a candidate
read is mandatory. **Observed:** the generic section says “If this session has
not read one of them yet, read it with `snapshot_read` before you judge.” The
procedure says “Reuse earlier understanding of captured guidance with the same
known identity” and reserves current snapshot_read for reported concerns.
Orientation's `read` array names documents received as text rather than through
snapshot tools. This leaves the word “read” carrying two meanings.

**Impact/confidence:** high confidence in the ambiguity, no proven faulty
behavior. The child reads all three current files and returns no concerns;
those reads obey the generic guidance and secure usable ground evidence. They
must not be called automatically wasteful or a failure to reuse orientation.
**Correction:** explicitly distinguish “guidance text supplied with verified
identity” from “candidate file read in this review.” State that understanding
may be reused when identities match, while any concern's ground must be read
through current snapshot_read. If mandatory full candidate refresh is intended,
state it consistently instead. A comparison should measure reads/charges and
retain truthful grounding rather than crediting orientation's `read` array as
current snapshot evidence.

### DR-03 — Low: unrelated runtime details remain in the current and inherited packet

**Affected:** inv-0012 current environment and inherited orientation environment.
**Expected:** deliver review-specific candidate/grounding/tool information.
**Observed:** the current environment addition is 1,743 UTF-8 bytes, including a
live workspace path, orchestrator-wide placement/iteration/reconciliation limits
and source prompt supportPaths not readable in this candidate. Earlier
orientation guidance includes broad operational README material about native
protocol surfaces, installation, historical standalone runs and server lifecycle.
That content is project guidance deliberately captured, and its root README
snapshot read is 12,019 bytes; length alone does not make it removable.

**Impact/confidence:** high confidence that unrelated harness runtime fields add
bytes; moderate confidence about any broader guidance selection. No observed
misbehavior or measured saving. **Correction:** use a reviewer-specific environment
and consider a separate concise authoritative design guide only if the project
chooses to maintain one. Do not silently omit parts of the selected guidance or
replace project authority with the summary. Retain self-contained package,
ownership, static-markup testing and shared-ui responsibility rules, and compare
first-fork cache/total charges before claiming context reduction improves cost.

## No-issue conclusions and evidence limits

The task has a usable role transition, truthful exact candidate identity,
accessible actual guidance, complete patch/content coverage and valid first
submission. The reviewer reports design conformity without making changes or
claiming architect completion authority. No concern was raised, so rejection of
stale/inherited-only grounding was not exercised; the read history is nonetheless
current and complete for the three candidate guides.

All four native requests were checked for stable instructions/tools and the
first request for exact inherited parent/input equality. Provider-internal
processing/cache causes remain outside the retained evidence. Proposed wording
or packet reductions require a focused comparison; this retrospective ran no
tests/providers and changed no runtime or authoritative trial record.
