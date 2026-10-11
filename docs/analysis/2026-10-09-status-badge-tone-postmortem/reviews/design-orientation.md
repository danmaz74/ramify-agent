# Reviewer: design orientation

The orientation prompt was adequate: all three captured guidance documents were
supplied inline, and the sole available tool was the required submission tool.
The reviewer accurately named those three paths and summarized the project's
design responsibilities. It completed in one model request without rejection.
The clearest excess is environment information the reviewer cannot act on.

## Coverage and exact evidence

- Kind/variant `reviewer / design-orientation`, package `reviewer/4`.
- Covered invocation/operation `inv-0011`, display transcript `ses-0009`,
  provider session `bcfbcc72-b344-4baf-b7a2-557b6c6ea023`, turn 1.
- Requested/actual mode fresh, no inherited history, work `wi-001`, iteration
  `wi-001.i01`, base `afef5487213d7c2729e95e4e5956e6bb30059390`.
- Run `20261009T132856Z-07ccc4`, historical harness commit
  `390eef60abbfb9772969b1fd466204588adef138` from result provenance.
- R =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4`.
- S =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations`.
- Actual packet P:
  `S/correlations/operations/f6f916d09d7d46411a09529f42b17ff52e0a319ff9b803227c3195c7e026ecdb.json`.
- Actual native provider request N:
  `S/store/payloads/3361161a8c654b96ee5c15d55e1f188cb27b531cae693bbedfc126ce7d09ac88`.
- Inspected P/N instructions, message, current procedure, actual tools/schema;
  all `R/transcripts/ses-0009.jsonl` records for `inv-0011`;
  `R/invocations/inv-0011/{invocation.json,submission.json,outcome.json}`.
  All readable delivered guidance was assessed directly; no current template
  was substituted for delivery evidence.
- Subsequent-effect evidence: first design-review native request
  `S/store/payloads/95e1aace435fdede6c27037597a78eb8177c5b0417778ea0f100558060262162`,
  `R/transcripts/ses-0010.jsonl` record 10, and
  `R/invocations/inv-0012/{submission.json,outcome.json}`. These assess how the
  orientation was carried forward, not full coverage of design review's kind.

N's instructions and first user input exactly match P. Native tools contain
only `submit_orientation`; there is no snapshot/file-reading tool in this turn.
P's 12,256-byte `brief:support:design-guidance` directly supplies complete text
under the headings:

- `README.md (sha256 b72856422e9d)`;
- `subs/workspace/README.md (sha256 f5cdda73289e)`;
- `subs/workspace/subs/shared-ui/README.md (sha256 8cec99d7e15b)`.

Thus listing a path in the submitted `read` field is acknowledgment of its
inline text, not a claim to have called a nonexistent `read` tool.

## Required-information assessment

| Need for this task | Assessment |
| --- | --- |
| Objective | “Read the captured design guidance for wi-001” and “You review nothing yet” clearly distinguish preparation from candidate review. |
| Guidance bytes/identity | All three documents are complete inline, with exact paths and truncated hash labels. Root prose states ownership, profiles, configured tooling and independence; workspace/shared-ui prose establishes the relevant responsibility boundaries. |
| Authority | Read-only and no decisions; current procedure restricts action to the designated submission. No implementation, test or candidate judgment is requested. |
| Current state | Fresh orientation with no candidate or snapshot is explicit. Candidate diff/source is not needed yet; later review receives frozen evidence. |
| Tools/submission | Actual `submit_orientation` declaration requires nonempty `read` paths and brief `summary`, maximum 4,000 characters. All required inputs are available directly. |
| Future grounding | Generic reviewer system explains that later concerns must be grounded in files read with snapshot_read during that review. This does not require snapshot reads during orientation. |

No necessary guidance, path, tool, plan goal or submission field was missing.
No stale guidance assertion was detected from retained evidence. The generic
system describes snapshot tools for future reviews while the task-specific
procedure says only the submission tool is available now. The procedure is an
explicit phase restriction and actual tool declarations agree; it does not
prevent the requested orientation. Full plan and code are intentionally absent
because this turn is project-guidance preparation, not implementation review.

## Findings

### Low: unusable architect-view metadata and unrelated lifecycle limits

- Affected role/IDs: reviewer orientation `inv-0011`, `ses-0009`.
- Location/excerpt: P `environment.views` advertises an absolute
  `.ramify-architect` path and all 15 modules. System says generated views and
  absolute paths are refused, while current procedure gives “no tool but the
  designated submission tool.” Environment limits include capability-task
  iterations, repair rounds, placement counts and non-functional coordination.
- Expected goal: read supplied project guidance and submit paths/summary,
  without discovering architecture or managing a run.
- Observed mismatch: this metadata is inaccessible and irrelevant for this
  role's current actions. Advertising it supplies no actionable information.
- Size/method: UTF-8 substring measurements on P's actual environment give
  987 bytes for limits and 1,061 for views, 2,048 total (12.5% of the
  16,347-byte user message). Applicable submission/rejection or invocation
  limits may remain; the entire limits block is a narrowing target, not an
  assertion that every field is irrelevant. No provider tokens are inferred.
- Observed impact/confidence: no attempted view/file access, wrong submission
  or retry. High confidence in unusable view metadata; unmeasured prompt-cost
  benefit. This is excess, not a demonstrated task failure.
- Correction: omit view inventories and unrelated stage settings from this
  orientation. Retain supplied guidance identities/text, procedure, schema and
  current phase/tool constraints. An orientation with only submission access
  does not need workspace paths for action.

### Potential improvement: simplify generic reviewer instructions for orientation

- Location/excerpt: P/N reviewer system's `Risk and ground` section explains
  review concern risk and snapshot-only grounding; `Your tools` explains four
  snapshot inspection tools absent from this turn. Orientation's only schema
  fields are `read` and `summary`.
- Expected goal/mismatch: future review contracts are useful stable session
  context but are not needed to perform the present summary. They add a
  phase distinction the current procedure must resolve.
- Impact/confidence: no observed confusion; actual single-call completion
  demonstrates usable instructions in this instance. This is a potential
  prompt simplification, not a required correction. The full generic role is
  2,546 bytes; it is not all classified as removable.
- Correction direction: if simplifying, retain the stable reviewer system for
  cache-compatible forks and make current-only tool access prominent, or
  compare an orientation-specific instruction set. Measure both orientation
  and first design-review request cost/quality before replacing a reused prefix.

## Explicit no-issue findings and successor evidence

The summary correctly preserves self-contained packaging, ownership/tree and
tag rules, protocol surfaces, tests and independence. It preserves workspace
as browser shell and declaration relay, and shared-ui as presentation owner
whose symbols reach feature UIs while core modules lack UI classification.
It does not fabricate a new responsibility, elevate historical test totals
into present passing proof or decide the tone implementation.

Submission names exactly the three captured guidance paths. Transcript record
3 submits, record 4 accepts, record 6 ends submitted/fresh. Outcome applied,
zero rejected submissions, 5,854 ms. One request: new input 4,557, output 183,
cache read/write zero. There is no continuation or fork boundary in this kind.

The next design reviewer (`inv-0012`) forks with the full orientation user
guidance, orientation reasoning/submission and accepted result retained as its
first four input items. Current tools are then dynamically added. It reads
README, workspace README, shared-ui README and the four changed source/test
files in `ses-0010` record 10; its accepted result reports those four files
inspected, no missing files and no concerns. Those later guidance reads do not
invalidate the earlier inline reading; current-snapshot inspection/grounding is
a separate review responsibility. No observed omission or repair points back
to inadequate orientation. Successor acceptance alone does not prove the
orientation exhaustive or implementation semantically correct.

## Evidence limits

Provider-native request N proves actual supplied guidance/instructions and
sole tool declaration. It does not reveal server-side transformations or
counterfactual cost/quality. There is no wire gap for inline guidance and no
missing read-tool event: no such read was required or possible. No extra
provider calls, tests, runtime changes or evidence mutation were performed.
