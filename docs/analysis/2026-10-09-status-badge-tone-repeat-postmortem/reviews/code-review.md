# Prompt review: code-review

The sole observed code reviewer received an actionable frozen-candidate task, complete changes and plan constraints, read all four changed files, and submitted a complete review with no concerns or missing paths. No consequential prompt defect was found. Exact snapshot boundaries, explicit attribution of harness feature-tag changes and the supplied complete diff prevented ambiguity about candidate identity, unavailable assignment records and generated-file ownership. The available tools supported the task without granting source-edit or command authority.

## Coverage and provenance

| Kind/variant | Invocation / request / work | Start and session | Prompt coverage |
| --- | --- | --- | --- |
| code-review; reviewer/4, procedure `code` | inv-0008 / rq-0001 / wi-001.i01 | fresh requested/actual; ses-0007; native session 82153cc9-e09c-4dce-ae0d-95372665ed4a | Exact packet, native requests, transcript bodies, all subsequent calls/results, submission and outcome |

Run `20261009T181051Z-4c5bfc` implements status-badge-tone in collection-review. Review candidate is commit `40155157c0af1fa686ec5b8579755c17a6364613`, tree `36c77a3a474e60064bbb3efabdd5c0547a92133a`, with diff base `564534ea8e482a1d65b77a247f80577ff5d540d8` and passed gate ga-0002. These are review-candidate identities, distinct from the run's original source commit. No inherited dialogue is present.

Evidence prefixes:

- **J** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc`.
- **O** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/.harness/session-operations`.
- **P** = `O/correlations/operations/ff152676063aa78b15ef336018dd18fc53073ef3411d9d7dfcc3d8e7438012a8.json`.
- **N-first** = `O/store/payloads/b0fd949daef9eb4da4c8cb45796d3ad1d6130f244a94266657cf8aed710a40f2`.
- **N-last** = `O/store/payloads/94e51298b26720f83151041e2acd55f9ad6c8ac7206c18ad56f5113254cfe3cb`.

P mode is fresh with source null. N-first contains exactly P's 2,546-byte reviewer instructions, one user message equal to P's 17,671-byte task, and ordered declarations snapshot_list, snapshot_read, snapshot_search, snapshot_diff and submit_review. Transcript `J/transcripts/ses-0007.jsonl` and referenced blobs retain the actual calls/results. The reviewer system/body hashes are `235e45760253afafde654cdcc2f8c38be2e5e906a44896f0a067c1115626ad49` and `3cf12c7052f5060ad532e6e1387efd8235f3ebc93495448b248da1ba5f69134b` for the current message; use the manifest rather than assuming a template hash identifies actual delivery.

The request, attempt and submission are separately retained at J/reviews/rq-0001/request.json, J/reviews/rq-0001/attempts/01/attempt.json and submission.json. The task states the candidate/base/tree, four changed paths and complete patches (5,792 collected patch bytes; 6,081-byte delivered diff section including context/formatting). The attribution identifies inv-0007 and accepted submission `92b9f97afe954f368d576461af3c32a9e479c41cdb82fc5955b2459797147ca4` as producer for each of sc-001 and sc-002, naming the exact candidate feature hash `de0eb6508736e7c2c2cb91744467c7801cbf261cde45bb37bb7a71293860f197`.

## Required information and instruction usability

| Need | Delivery/assessment |
| --- | --- |
| Objective and candidate | Direct goal, review kind, request/work/iteration identities, immutable commit/tree and base. |
| Plan and assignment intent | Complete ten catalog elements, with optional union/default/markup, labels/callers/presentation/test constraints; detailed iteration goal/approach/completion evidence. |
| Scope/current changes | Canonical four-path list and complete patches, including harness-owned pending-tag removals, plus candidate source access. |
| Authority | Explicit read-only snapshot review: no edits, commands, scheduling or issue resolution; local architect later assesses findings. |
| Environment | Every tool path is candidate-root-relative, despite a physical workspace path in the environment; system says cwd inaccessible, no absolute/climbing/generated paths. Tools match those instructions. |
| Dependencies/verification | Declared project checks and candidate configuration pointers allow inspection of runner/binding semantics; passed ga-0002 reported. Reviewer cannot execute tests and is not required to. |
| Submission | Complete schema names inspected/missing/concerns, coverage requires every changed path once, concern definition requires an actionable consequence and grounded evidence. |

The task explicitly says the assignment path is a harness record, not a candidate file: “Use the assignment intent below; that record is not a candidate file readable with snapshot tools.” This resolves a common distinction between plan record provenance and accessible candidate artifacts. The assignment forbids engineers editing generated features; the supplied diff then clearly identifies harness-produced tag changes and requires review of the actual patch. These instructions are compatible, not a defect or permission contradiction.

All constraints are present. The empty heading “What the plan asks of it” is followed later by the complete Plan context package, so no assignment requirement is actually missing. Submission ground paths must be files snapshot_read returned; potential findings based only on delivered plan material could need a candidate plan/feature/test read for grounding. Here the feature and tests were read and no concern needed an inaccessible harness artifact.

## Findings and potential improvements

### Low: environment supplies run-wide limits and inaccessible provenance pointers

**Affected:** inv-0008; P environment addition / N-first current message.

**Excerpt:** The environment contains repairRoundsPerWorkItemGate, forkRetriesPerRequest, maxPlacementRequests and nonfunctionalRoundsPerPlan, plus `supportPaths` naming `subs/harness/src/prompts/reviewer.system.md` and `code-review.procedure.md`.

**Expected goal:** Inspect one immutable candidate and submit actionable code findings. Scope-repair policy for other roles does not guide this review, and harness template source is already delivered as instructions; these paths are not collection-review candidate files.

**Mismatch/impact:** The 1,771-byte environment contains 988 bytes of run-wide limits and 132 bytes of support-path lines. Many limits are irrelevant to the reviewer's actions. The provenance paths could be mistaken for snapshot-accessible support documents, although current instructions do not direct their reading and no such call occurred. No observed failure, wasted read or delayed submission is attributed to these fields.

**Correction direction:** Keep candidate/tree, candidate-relative tool semantics and applicable time/budget/rejection controls; omit unrelated repair/placement policies and label support paths as source provenance, or omit them from runtime task text when instructions are already direct. Measure first-request input and review completeness to validate a reduced environment. The relevance assessment does not establish a latency or cost gain.

### Potential: clarify which configuration reads the code review needs

**Affected:** inv-0008; P Declared project checks and candidate support pointers; transcript line 3 and results 4–7.

The prompt says “Read these project-relative references,” naming ramify-audit.json, ramify-agent.json, package.json and cucumber.js. The reviewer follows that instruction and receives 7,288 line-numbered bytes across these four reads (3,716 + 104 + 1,359 + 2,109). Cucumber imports/tags, package dependencies and declared checks are relevant to the new scenario bindings. The tiny ramify-agent.json describes a type-check output parser, which does not explain component behavior or step registration for this change.

Potentially make nonessential configuration reads conditional on an unresolved question and retain explicit Cucumber/package pointers for this scenario-writing change. This is a context-selection refinement, not an agent discovery failure: the calls were authorized and instructed, and source-grounded inspection can legitimately go beyond a patch. No failure is attributed to those reads. Four complete patches remain appropriate required information; their length alone is not excess.

## Observed effects and candidate use

The first model request returns eight snapshot_read calls and one snapshot_list at 18:15:35.135–.137Z. Reads cover declared support configuration, component, unit tests, new step implementation and generated feature. No snapshot_diff is requested because the full path list and patches are already supplied. This shows the supplied-diff procedure was usable and followed.

The second request checks possible ambiguous step phrases across the candidate, reads tsconfig.json, lists shared-ui, searches StatusBadge locally and searches status-badge across workspace. Those searches return the new step definitions, scenario texts, callers/styles and declarations. The root phrase search is broad but asks a concrete registration question. Snapshot tools intentionally exclude generated architect/API views, so these are candidate behavioral/regression checks within this role's available evidence, not missed generated-view discovery. There is no engineering foreign-capability need.

The final request submits all four changed paths as inspected, with missing [] and concerns []; transcript line 20 records acceptance. No rejected submission, tool error, clarification or repair occurs. Outcome is submitted/applied at 18:15:51.142Z, elapsed 20,040 ms, with no outsideScope or late writes. This is a code review judgment that nothing actionable was found; it is neither an independent test execution nor the responsible architect's completion judgment.

All returned source is from the frozen candidate rather than the mutable current workspace. The feature read confirms the two pending tags were removed while scenario wording remains. The component/test/step reads support the optional tone union, neutral resolution, unchanged default/custom-label path and real-component scenario binding. The final reviewed scope matches the supplied complete change list.

## Metrics and boundaries

Three model requests are observed:

| Request | New input | Cache read/write | Output |
| --- | --- | --- | --- |
| Fresh first | 5,954 | 0 / 0 | 275 |
| After first snapshot batch | 4,689 | 5,760 / 0 | 166 |
| Before review submission | 1,930 | 10,368 / 0 | 406 |

Outcome reconciles to 12,573 new input, 16,128 cache-read, 847 output and 29,548 total. Recorded-rate estimated charge is USD 0.0736832. This kind has no continuation/fork boundary; later request cache hits are within-invocation reuse.

Exploration records count nine reads, nine unique files, no repeated reads, five searches (including two snapshot_list calls classified as search), one broad search and 20,428 returned bytes. The returned bytes are line-numbered output, not scanned source bytes. Tool duration subtotal 3,611 ms sums overlapping calls and is not review wall time. Search observations have unknown matched-file identities and outside-scope status; aggregate outsideScopeSearches 0 does not prove all searches were within scope. Actual transcript arguments/results identify the searches used here.

## Evidence limits

Every observed code-review instance in the assigned repeat run is covered: inv-0008 only. Retained native requests establish effective delivery before provider handling; provider-internal transformations are unknown. Passed ga-0002 is a recorded gate result, not proof the reviewer executed checks or independently accepted plan completion. Review acceptance validates coverage/shape rather than the absence of semantic defects. No alternative prompt or reduced configuration packet was tried, so potential reductions remain unvalidated. Current source/generated views are not used as historical evidence.
