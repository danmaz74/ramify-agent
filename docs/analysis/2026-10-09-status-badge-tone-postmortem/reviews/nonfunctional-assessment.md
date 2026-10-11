# Non-functional coordinator: assessment

The coordinator received all four non-functional elements unchanged and usable
read-only tools for the prepared candidate. It inspected source, callers, tests
and runner configuration and submitted one satisfied judgment per element,
without rejection. Improvements concern evidence provenance and rediscovery:
the supplied diff compares the final source with itself, and the fresh packet
omits known owner/file pointers. The resulting empty diff was used as historical
evidence, and the coordinator rediscovered the badge through broad source search.

## Coverage and exact evidence

- Kind/variant `nonfunctional-coordinator / assessment`, package
  `nonfunctional-coordinator/2`; invocation/operation `inv-0013`, transcript
  `ses-0011`, provider session `28069183-788d-4829-b923-3c1a5a576614`, turn 1.
- Requested/actual start fresh, no inherited context. Run
  `20261009T132856Z-07ccc4`; prepared tree
  `2a89ca2d463c9ed79ef5d1e5898111d18d807d14`; source baseline and head both
  `afef5487213d7c2729e95e4e5956e6bb30059390`.
- Historical harness commit `390eef60abbfb9772969b1fd466204588adef138`
  from `/home/app/ramify-trial-evidence/status-badge-tone-20261009/result.json`.
- R =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4`.
- S =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations`.
- Actual packet P:
  `S/correlations/operations/b7b6b638b65904c5c47e9b28d0d44f10c1887b3eec76da44aede4571ff1bcbf3.json`.
- Actual native requests, under `S/store/payloads/`, in order:
  `f89abae800040c24f3b52f6e97b681ad68383159d6229af41f5dbd8e689f0f23`,
  `b098079187f59a1b375e84384bf557da1e0fde9baa18ba8bd78e1659807c9c90`,
  `9805f84a7678a62ffa9e5d7779ad95f43cdd7e45b33cd682a5dc40bda5a784b2`,
  `d62347771903ddf7b67f32b5d7a7723a748a0397060ae04ec215537cd275a174`,
  `143f94a94693ccf8afb6883eb30df6f4541ab3f2ac6eeacb87bb12ed10752591`,
  `03de550c9803bdcb71fcf575a744dea283d1f9b9eef1441a36b1e7d127cabd38`,
  `3170283ad6ee84d6284832da03754029e117135a2f67592d182c555667153734`.
  All retain instructions and initial user text exactly matching P. Native
  tools are snapshot_list/read/search/diff and submit_nonfunctional_assessment.
- Inspected all actual calls/results in `R/transcripts/ses-0011.jsonl`, resolving
  blob bodies, P's complete role/task/procedure/schema, invocation/submission/
  outcome under `R/invocations/inv-0013/`, and the captured plan/catalog.
  Original catalog:
  `R/analysis/catalog/0a993ffc4dd5fbfea041e03156c91b60207e7c454d87a9082da623d23a86b21a.json`.

## Required-information assessment

| Need at delivery | Assessment |
| --- | --- |
| Complete NFR/fixed catalog | All four `nfr` elements match retained catalog text, conditions and uncertainty; there are no fixed elements omitted. None is selected away. |
| Goal and authority | One result per ID; read-only, no edit; source analysis is explicitly sufficient, including tests/behavior. Unsettled conditions must be undetermined. No functional/scenario progress is substituted for evidence. |
| Current candidate | Prepared tree, base/head, full read scope and excluded directories/run outputs are supplied; tools actually read that snapshot. |
| Source discovery | Snapshot listing/search permits discovery. Known owner/source/test/caller pointers are absent despite being available earlier in the run; discoverability prevents a hard information block but causes avoidable work. |
| Historical comparison | Diff is current final baseline to the same final head. It cannot establish changes since implementation began; this distinction is not explained. |
| Verification evidence | No audit/run records are accessible. Prompt expressly allows source judgments; actual nfr-004 judgment declares its source-only basis. This is semantic assessment, not automated-test execution proof. |
| Submission | Actual tool/schema accepts assessment plus result/scope/evidence/uncertainty per ID. No identity generation or action is required in this round. |

No necessary requirement or tool was absent. The same-baseline comparison and
missing source pointers impair evidence interpretation/efficiency, rather than
making source assessment impossible. Current-task `assessment for {}` is
uninformative, but tree/catalog identity and procedure elsewhere compensate.

## Findings

### Medium: final-to-final diff becomes unsupported historical evidence

- Affected role/IDs: coordinator `inv-0013`, assessment of `nfr-003`.
- Location/excerpts: P `nonfunctional-source` states
  `"base":"afef548...","head":"afef548...","changedPaths":[]`.
  Transcript record 3 calls snapshot_diff first; record 4 returns “The candidate
  changed nothing.” Submission nfr-003 says: “The candidate diff reports no
  changed paths relative to the stated baseline, providing additional evidence
  that feature views were not changed.”
- Expected goal: distinguish inspected present compatibility from evidence that
  implementation preserved previously existing feature sources.
- Observed mismatch: diff of identical final commits cannot support a claim
  about whether the implementation changed feature views. The submission
  makes this inference while quoting the baseline accurately.
- Impact/confidence: assessment includes unsupported additional evidence. High
  confidence from supplied identities and result. Optional tone/default and
  inspected callers independently support compatibility, so this finding does
  not reject the semantic satisfaction judgment or identify an implementation
  defect. Result verification outside this invocation does report actual
  implementation paths, but those records were excluded from this task.
- Correction: explicitly label the baseline as the prepared current source and
  explain that an empty diff is not a run-change comparison. Supply a separate
  run-start/iteration comparison when historical preservation is needed, or
  base unchanged-call-site claims solely on an authorized historical source
  comparison. Keep present-tree semantic judgment with its responsible role;
  the harness should supply accurate evidence identities, not infer completion.

### Low: missing known source pointers causes broad rediscovery

- Affected role/IDs: `inv-0013`, all four assessments.
- Location/excerpt: P supplies requirements mentioning “shared UI” and
  “badge” but no concrete badge owner/source/test/caller paths. Its mandatory
  initial snapshot_diff is empty. In transcript records 7–10, coordinator lists
  root `src`, searches it for `StatusBadge|status badge|tone`, gets “No match”,
  and reads package/plan. Records 13–17 then list more root source areas,
  search `.` for `Badge|badge|data-status|Passed|Failed` and read root README.
- Expected goal: inspect relevant prepared source to assess full obligations,
  with wider discovery when an element requires it.
- Observed mismatch: existing relevant paths could be supplied as non-binding
  inspection pointers. Their absence plus empty diff forces new discovery from
  the project root. The root search returns relevant badge paths successfully,
  but includes plan matches, unrelated audit-command text and broad markup
  matches.
- Measured effect: root-wide search result record 16 is 10,207 UTF-8 bytes;
  root README record 17 is 12,019 bytes with line-number formatting. Initial
  root-src search returns 8-byte “No match.” Four preliminary root directory
  listings and an extra package/plan read precede focused source inspection.
  Not all returned material is useless; exact removal savings are unknown.
- Confidence/correction: high confidence in observed rediscovery; medium in
  achievable savings. Supply relevant owner and source/test/caller paths as
  starting evidence pointers, not a closed assessment scope. Require confirming
  them in the current snapshot and allow discovery across the whole tree for
  each element. Compare inspection coverage, searches and latency thereafter.

### Low: environment advertises excluded views and unrelated phase settings

- Location/excerpt: P environment advertises absolute `.ramify-architect`
  path/module inventory, but source context explicitly excludes `.ramify` and
  `.ramify-architect` and current tools are snapshot-only. Lifecycle limits
  include capability-task iterations and work-item repair settings.
- Expected goal/mismatch: coordinator assesses inspected candidate source;
  inaccessible generated-view metadata and unrelated phases cannot help its
  current decisions. It does not attempt view access.
- Size/method: limits block 988 UTF-8 bytes and view block 1,061, using actual
  pretty-printed environment substrings: 2,049 total (31.1% of the 6,597-byte
  user message). Applicable submission/invocation limits can remain.
- Impact/confidence/correction: no access errors or wrong judgments caused by
  this metadata; high confidence in inaccessibility. Omit excluded view
  inventories and narrow phase limits; use space for actionable source pointers.

## Actual inspection and no-issue judgments

| Snapshot tool | Calls | Returned text bytes |
| --- | ---: | ---: |
| snapshot_diff | 1 | 29 |
| snapshot_list | 5 | 317 |
| snapshot_search | 3 | 11,472 |
| snapshot_read | 15 | 37,423 |
| Total source-inspection calls | 24 | 49,241 |

Counts come from actual transcript tool-call blocks. Bytes sum resolved
tool-result body bytes, including line-number formatting, not scanned bytes
or original raw file sizes. Submission is one additional tool call with a
41-byte acceptance result. Ordinary read/search exploration aggregates do not
measure these snapshot tools; zero in those aggregates does not mean no review.

Source inspection records 19–31 establish optional prop/default, label/status
independence, shared-ui declaration, current callers, retained and new badge
tests, scenario feature/steps and committed Vitest/Cucumber configuration.
Record 32 searches all `<StatusBadge` occurrences below `subs/`. Assessment:

- nfr-001: prop-only UI primitive and unchanged ui/browser owner; no domain or
  protocol behavior introduced. ReviewStatus import is neutral shared vocabulary.
- nfr-002: text remains `label ?? defaultLabels[status]`; tone only sets
  data-tone. Tests/steps inspect label independently of tone.
- nfr-003: optional prop and neutral default preserve caller source/rendering
  compatibility; both inspected feature callers omit tone. Historical no-change
  support is limited as noted above.
- nfr-004: existing assertions remain and dedicated warning/default-tone tests
  exist; committed runner configuration selects unit tests and bound scenarios.
  Coordinator explicitly discloses no execution record in its permitted snapshot.
  Source-based satisfaction follows the actual task contract; this is not a
  newly established test pass or a substitute for the configured audit.

No constraint is rewritten/waived, no unsupported scope restriction is added,
no source is edited, and capability/scenario completion is not used instead of
source evidence. Every element receives inspected scope/evidence/uncertainty.
No inaccessible necessary source or submission-schema problem occurs.

Transcript record 33 submits; accepted verdict and outcome show submitted/
applied, zero rejected submissions. Seven model requests, 63,292 ms; totals
new input 18,322, cache read 34,048, output 2,928. This fresh invocation has
no fork/continuation boundary; later within-invocation cache usage is not
evidence of first-post-fork behavior.

## Limits

Native request and resolved transcript establish delivered instructions and
inspection results. Server-side transformations, counterfactual prompt savings
and effectiveness of suggested pointers remain unmeasured. This review analyzes
the coordinator's evidence and task adequacy without substituting harness rules
for the semantic assessor. No provider calls, tests, runtime changes or raw
evidence mutation were performed.
