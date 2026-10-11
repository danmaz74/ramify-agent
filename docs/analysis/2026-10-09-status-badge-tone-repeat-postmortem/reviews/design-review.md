# Independent prompt review: design review

Covered **inv-0012**, role `reviewer`, task `design`, request `rq-0003`, work item `wi-001`, iteration `wi-001.i01`, run `20261009T181051Z-4c5bfc`. Harness session `ses-0010`, pi session `10f1e05d-3faf-42f6-a53f-5be3ba67d0ad`. Requested and actual mode are fork from **inv-0011 design orientation through turn 1 only**, source session `15c94a7f-b6d4-45e8-97b9-28db4f29b2ea`, checkpoint `640e3f68-075e-4db9-9fe8-43ccf44eb285`. No parent turns beyond that point or prior postmortems were read to assess inherited context.

The design-review task was adequately delivered and completed on its first submission, with all four changed paths inspected and no missing evidence or concerns reported. Snapshot tools and the exact submission contract were usable. The observed opportunity is that the reviewer reread all three unchanged guidance documents despite explicit known-identity reuse, adding 13,369 returned bytes. This is a potential efficiency improvement, not a semantic or submission failure.

## Raw evidence and exact delivery

P = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/`; J = P + `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.

- P `.harness/session-operations/correlations/operations/bd2849042370f02dacdca2626240e00b0f4b374c1d87a3c9d2b460cb9ab7fa73.json`: current source point, packet, additions, policy and declarations.
- P `.harness/session-operations/store/payloads/5826d8a2afb5453e7afd8eb240d73a54c7ff9c993a96bb131b84dd052af297f4`: first native child request; P payload `73e050042f9294852ad7da861701d8ec6c72eaf02adfb46fbc8a17d33bafc404`: final native request.
- J `transcripts/ses-0010.jsonl`, records n=1–15 filtered to `inv-0012`; J `invocations/inv-0012/{invocation.json,submission.json,outcome.json,observations.jsonl}`.
- Parent `invocations/inv-0011/submission.json` and its retained correlation/task show the complete supplied guidance, its three hashes and accepted reading/summary.
- J `blobs/c5ebbecb3ca6d403646b74c469fddd3c4109b9d594066b46e55491d437df47b1`: current root README snapshot return; smaller guidance and source results are inline in current transcript.

Native first request has seven ordered items: inherited orientation user message, its reasoning, `submit_orientation` call, accepted output, new snapshot `additional_tools` developer item, active-tool developer statement, and current design user task. The **2,546-byte reviewer system instructions** remain unchanged; top-level native tools preserve the historical `submit_orientation` prefix while ordered input explicitly declares and activates `snapshot_list`, `snapshot_read`, `snapshot_search`, `snapshot_diff`, `submit_review`. Native item 5 says “Inactive historical tools must not be called.” There is no missing reviewer-role transition: the parent and child already share the reviewer role. Current task is **14,711 UTF-8 bytes**, submission declaration **2,230 bytes**; inherited orientation task **16,392 bytes**, including a **12,256-byte** full design-guidance fragment. Addition fragments are delivery provenance, not separately pasted duplicates to add to totals.

All three current guidance identities match the captured guidance. Removing snapshot line-number prefixes, joining with newlines and restoring the terminal newline produces exactly these full hashes:

| Guidance | Raw reconstructed bytes | Exact SHA-256 | Snapshot returned bytes |
| --- | ---: | --- | ---: |
| README.md | 10,669 | b72856422e9dd390beb6eb5448ddfb30260ac90cbc8b91e014541c97821e2c95 | 12,019 |
| subs/workspace/README.md | 674 | f5cdda73289e0ff31f3b1d2d5942640a78a4224497474462fc26eef5d7546e56 | 757 |
| subs/workspace/subs/shared-ui/README.md | 524 | 8cec99d7e15b169c49a10f3982e551a081e0da714105120442118184bf573435 | 593 |

Root guidance is 193 lines; the requested 260-line read returns it in full. Hash verification here is an analysis check against retained candidate results, not a claim that the original reviewer recomputed hashes. The current packet carries full hashes in the review-request guidance entries and short hashes in human-readable headings; the inherited captured headings give the same identities.

## Required information at delivery

| Need | Assessment |
| --- | --- |
| Objective | Current design request, frozen iteration goal/approach and four complete patches; ask whether changes follow listed principles and module responsibilities. Correctness and scope reviews are expressly separate. |
| Applicable guidance | Inherited complete root/workspace/shared-ui READMEs, accepted summary, and current exact hash/path list. Current snapshot tools can refresh documents or establish a concern's ground. |
| Authority and write scope | Review-only, no live worktree or mutations; assess frozen candidate, report concerns for later local-architect assessment. No implementation or scheduling tool is available. |
| Candidate/base/state | Commit `40155157c0af1fa686ec5b8579755c17a6364613`, tree `36c77a3a474e60064bbb3efabdd5c0547a92133a`, base `564534ea8e482a1d65b77a247f80577ff5d540d8`, passed gate `ga-0002`; explicit assignment-record boundary. |
| Design context/dependencies | Shared UI responsibility and ui/browser isolation, workspace relay/stylesheet responsibility, conventional test/scenario areas, configured ownership/standalone boundaries in inherited guidance. Existing imported ReviewStatus is unchanged and no new project-owner API is needed. |
| Change provenance | Four-path list and complete 5,792-byte collected patch; pending-tag removals attributed to harness binding of sc-001/sc-002, producer `inv-0007`, exact file and submission hashes. |
| Verification/ground | Reuse unchanged known-identity guidance; refresh changed/unknown guidance; every concern still requires current `snapshot_read` of its guidance ground. Audit pass is existing automated evidence, not model semantic acceptance. |
| Submission | Active `submit_review`, exact `inspected`, `missing`, `concerns` schema and four-path coverage rule. Full supplied patches count as inspection; empty concerns/missing is valid. |

The child receives no local-architect assignment history. That is adequate: its own task supplies iteration intent and authoritative guidance for this design review. It need not inherit local placement deliberations or non-functional catalog selection to assess the listed design responsibilities. No mandatory information was missing or inaccessible at delivery.

## Findings and correction directions

### Low: unchanged guidance is fully reread despite known-identity reuse

Affected ID `inv-0012`, current procedure step 1, native inherited guidance, transcript n=3–6. Procedure says “Reuse earlier understanding of captured guidance with the same known identity. Refresh guidance whose identity changed or cannot be established.” The guidance list also says “If this session has not read one of them yet, read it … before you judge.” Parent orientation supplies the full text inline and its accepted submission names all three in `read`; the fork carries that exact accepted point and the identities are unchanged.

Nevertheless the reviewer requests all three READMEs again, returning **13,369 bytes**, of which the root accounts for **12,019**. It ultimately raises no concerns, so no current-ground read is required to support a concern. The seven-read batch includes guidance plus four changed files; no explicit explanation for guidance refresh is captured. Thus the observation establishes duplication, not whether the agent considered inline delivery an insufficient prior read, doubted hash identity, or proactively prepared ground for possible concerns.

Potential correction: clarify that full captured guidance delivered inline during accepted orientation counts as already read, and that unchanged known hashes should be reused until a concern needs current snapshot grounding or a specific uncertainty requires refresh. Preserve the concern-ground restriction. Do not prohibit optional focused verification; identify it separately from mandatory refresh. Validate with a later same-guidance fork by measuring guidance reread calls/bytes, complete review coverage and grounded concern fidelity. No measured cost saving or semantic harm is claimed.

### Low: inherited full guidance carries sections weakly related to the changed design

Affected ID `inv-0012`, inherited orientation user message, root README. Relevant responsibility/ownership, no-barrel, testing profiles, scenario configuration and standalone package requirements are supplied and correctly usable. Other portions describe application record/protocol demonstrations, dev-server commands, a NODE_ENV-dependent build-size caveat and old standalone trial results. For this prop/markup/test-step change, those details provide background but are not needed to judge new dependency placement or presentation ownership.

The inherited root's historical standalone-result passage plus its explicit non-qualification caveat is **551 UTF-8 bytes**; a potential future reader could use a short pointer for this background while retaining actual independence obligations. Full root guidance is **10,669 raw bytes**, but not all of it is removable: current policy lists the whole file as the standard. Selecting narrower guidance must preserve all applicable commitments and remain an author/architect choice; the harness should not make semantic decisions about which rules matter.

Observed effect: this inherited background is repeated again in the full current root read. No unrelated concern, expansion of scope or failure follows. The preserved history can be cacheable. First-child usage records **5,203 new input**, **4,480 cacheRead**, **405 output**; those values are provider usage, not byte estimates. A smaller fresh prompt is not proven cheaper than this fork. Potential correction is authoritative role-specific guidance selection or selective refresh while retaining immutable complete guidance elsewhere and actionable snapshot pointers.

### Low: environment and repeated producer facts can be narrowed

Current environment is **1,773 bytes** and retains implementation repair/reconstruction/work-item/command limits and harness source support paths; snapshot review has no shell or writing authority. Inherited orientation also carries **2,682 bytes** of environment, including a generated architect-view inventory despite having only a submission tool. That older inventory does not make the view accessible to the child; the reviewer system explicitly rejects generated-view reads and current `views=[]` agrees.

Potential correction: retain current candidate/tree, snapshot-relative paths, active tools, applicable submission limits and time/budget information, while deferring unrelated orchestration limits and retaining inaccessible support information outside model text. Current changed-path support repeats producer path/hash/submission facts twice for sc-001/sc-002. Group shared producer facts with both IDs, preserving exact attribution and the complete visible pending-tag patch. These are relevance/duplication opportunities, with no observed tool-switch or provenance failure.

### No submission-contract or current-evidence defect found

Current snapshot arguments are project-relative, even though normalized transcript action paths are absolute. All seven reads succeed. The reviewer does not call historical `submit_orientation`, reacquire delivered patches, search unavailable generated views, or report concerns based only on earlier guidance. Reading full new steps despite their complete patch is optional verification/grounding; it is not automatically an instruction violation. The new shared-ui-local scenario state is implemented without importing the foreign integration World; the guidance's isolation obligations can be judged from supplied/current source without a new cross-module API lookup.

## Observed result and discovery scope

Start at 18:15:56.428Z. At n=3 / 18:16:02.594Z, one batch reads three current guidance files and four changed candidate files. Returned bytes are guidance **13,369**, production component **1,669**, unit tests **1,810**, steps **2,357**, feature **1,083**; total **20,288**, seven unique targets. No searches, listings, patch reacquisition or errors. At 18:16:11.868Z, the reviewer submits all four changed paths with `missing=[]`, `concerns=[]`; accepted at 18:16:11.887Z. Outcome is `submitted`, `applied`, zero rejected submissions, no outside-scope writes, **15,524 ms** elapsed.

These are design-responsibility and current-candidate inspection calls, not project-wide module discovery. Architect/API/source-first discovery episode counts are not applicable; there is no capability lookup or global/API view access in this review. The relevant ownership relationships are inherited authoritative prose, and current source is read to assess the implementation against them. The no-concern review is model judgment; it does not independently execute the gate or replace final architect semantic acceptance.

## Evidence limits

Native request records verify inherited guidance, exact source boundary and snapshot/schema activation beyond the display transcript. Opaque encrypted reasoning is not readable extra prose and is not assigned an invented token count. The trace does not explain why unchanged guidance was refreshed, so the cause remains uncertain. No later comparison proves a prompt-selection or refresh change improves behavior or charge. All assigned instances of this kind were covered; no task-blocking adequacy or submission failure was found.
