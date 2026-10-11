# Non-functional assessment prompt review

The coordinator assessed every supplied element and submitted four `satisfied` judgments, accepted without rejection. It inspected the prepared source and stated the limits of static evidence and of the empty accepted-boundary diff. The prompt explicitly permits source analysis for behavioral/test requirements, so lack of an execution tool is not itself a defect. The main improvements supported here are clearer snapshot-specific tool descriptions and navigation pointers that avoid an initial root/backend survey.

## Coverage and exact delivery

Kind `assessment`, role nonfunctional-coordinator, invocation `inv-0013`, run `20261009T181051Z-4c5bfc`, session `ses-0011` / `3af67f7c-8b17-47a1-b9f4-1a4674d9f45a`, turn 1. Requested/actual start fresh; no inherited engineer, audit or local-architect history.

Prepared source tree `36c77a3a474e60064bbb3efabdd5c0547a92133a`; current accepted boundary/base/head `40155157c0af1fa686ec5b8579755c17a6364613`. Project cwd is `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.

Evidence abbreviations:

- `J`: project-relative `plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.
- `T`: `J/transcripts/ses-0011.jsonl`, cited by JSONL line.
- `S`: `J/blobs/e37efed48850181da631fe6e2efc103298376e84db54dc308076941231d87e6a`, 795-byte coordinator system instructions.
- `M`: delivered 7,079-byte task in `T:1–2`, also captured in this postmortem's `invocations/inv-0013/task.md`.
- `P`: project-relative `plans/.harness/session-operations/correlations/operations/ad0050ad10716ec68547a926616cbf11245bc4cf0c0123b81cedd874f722c5e8.json`.
- `N`: project-relative `plans/.harness/session-operations/store/payloads/370410083bb9a55879c3a2377880034b74900101d80c3e9b390baab079eaddba`, first native request, also copied to `invocations/inv-0013/native-first.json`.

`N.instructions` equals the packet role instructions/system blob; its sole user input text equals the packet/current task. Five ordered tools are snapshot_list, snapshot_read, snapshot_search, snapshot_diff, submit_nonfunctional_assessment. Compact JSON of their native declaration array is 2,984 UTF-8 bytes. The schema requires one result per element with result enum, inspectedScope, evidence and uncertainty. The agent uses those exact tools/schema; no placeholder prevents submission. There are nine model requests.

## Required information and usable instructions

| Need | Assessment |
| --- | --- |
| Whole NFR/fixed catalog and conditions | Direct `M:6–45`: catalog 20fb9f16cb3fc364d18e53e7664b6fab2b404eeb2617d7e8846b3aacd4e0135d, nfr-001 through nfr-004, complete wording, no recorded conditions/uncertainty/deviations. No fixed element is present. |
| Candidate identity and comparison | Direct `M:48–58`: round 1 initial, exact tree, accepted boundary, empty changedPaths and explicit comparisonLimit. No historical implementation diff is available through snapshot_diff. |
| Authority and expected result | Read-only coordinator; exactly one judgment per ID, preserve wording/conditions, state source scope/evidence/uncertainty. No source edits or functional-progress substitution. |
| Accessible evidence | Fixed prepared source scope `.`; .git, node_modules, .ramify, .ramify-architect and harness outputs excluded. Snapshot tools can read/search/list source and configured runner files, with line numbers. |
| Test/behavior assessment policy | `M:51`: “Analysis of the source is sufficient evidence, including for requirements about tests or behavior.” `undetermined` is reserved for a condition source cannot settle. This is a semantic assessment policy, not an automated-test claim. |
| Navigation to the relevant owner | NFR wording says shared UI/status badge, but no exact owner/source/caller pointers are supplied. They are obtainable by source discovery; the complete role goal is still actionable. |
| Actual schema/tools | Native declaration supports all calls made and exact submitted assessment. No rejected calls, path errors, submission repair or missing field. |

The task contains the generic sentence `Perform assessment for {}` (`M:143`), but the candidate goal/catalog and procedure give the actual task. Complete functional plan reading is optional corroboration here, not necessary to recover omitted NFR requirements.

## Result-by-result evidence and remaining limits

All four requirement texts are reproduced unchanged inside submission evidence; each has “Conditions: none recorded.” The scope and uncertainty fields distinguish actual source evidence from run verification.

| Element / judgment | Actual inspected evidence | Assessment of support and gaps |
| --- | --- | --- |
| nfr-001 / satisfied | Shared-ui production file, declaration, README (`T:26,30–31`); contracts vocabulary (`T:35`) | Current component takes tone through props, defaults it locally and emits an attribute. It has no record/review/protocol runtime access; existing neutral ReviewStatus dependency is type-only. Owner declaration/purpose fit the presentation primitive requirement. “Pre-existing” is not independently proven from this snapshot alone, but present architecture is directly inspectable. |
| nfr-002 / satisfied | Component label map/render expression (`T:26`), all four unit tests (`T:27`), scenario binding assertions (`T:28`) | Tone only affects data-tone; displayed text remains label ?? defaultLabels[status]. Existing-word/custom-label expectations and explicit tone/default tests agree with source. Current semantics are supported. Historical byte identity or executed test results are not claimed as inspected evidence. |
| nfr-003 / satisfied | Component prop/default (`T:26`); CatalogCard and ReviewResult (`T:32–33`); workspace searches (`T:23,38`); accepted-boundary diff (`T:9`) | Both production callers found in workspace omit tone and remain compatible with optional prop/default. Submission explicitly says empty diff does not prove preservation of earlier accepted implementation and retains exact historical identity as unknown. The practical no-required-feature-change condition is supported by current signatures/calls. |
| nfr-004 / satisfied | Complete four-test unit file, two non-pending scenario definitions and complete bindings (`T:27–29`); Vitest/Cucumber config and package (`T:13,36–37`) | Tests remain present with old expectations, implementation satisfies those expressions and added tone tests/bindings are configured for discovery. Submission explicitly states no test-run record is exposed and judgment rests on permitted static analysis. This is not independently measured runtime suite health. |

The submission does not merely count completed functional scenarios. It cites implementation/ownership/callers/runner configuration and provides a distinct argument per NFR. The coordinator does not force an undetermined result merely because audit records are unavailable, consistent with the delivered policy. No inferred condition is invented. Exactly four results are sent in `T:40`; `T:41–43` accepts them.

## Findings and correction directions

### Low: snapshot_diff declaration describes a different baseline than the current task

Affected kind/ID: assessment, inv-0013. `N.tools[snapshot_diff].description` says it shows changes “from the iteration's base.” `M:56–58` explicitly names the current accepted boundary and says the comparison excludes earlier accepted implementation. This assessment is a plan-level prepared-source round, not an engineering iteration comparison.

Observed effect: `T:5,9` calls snapshot_diff and receives “The candidate changed nothing.” The result's generic text alone would be easy to misread, but the supplied task limitation works: nfr-003 evidence/uncertainty explicitly refuses to treat this as historical preservation proof. No incorrect done judgment follows from that empty diff.

Correction direction: generate snapshot_diff's description and result wording from the actual comparison contract: “prepared source versus current accepted boundary; earlier accepted implementation is outside this diff.” Keep base/head/tree identity explicit. This makes the actionable task and tool declaration agree without giving the harness semantic completion authority.

### Low: environment advertises a generated architect view excluded from all available snapshot tools

`M:58` excludes `.ramify-architect` and `.ramify`, while `M:108–134` lists the architect path/revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:1`, 15 modules and cut/unavailable summaries under `views`. Every inspection declaration says only fixed source scope is available. The current assessment tools offer no separate generated-view reader.

Observed effect: the coordinator does not attempt a forbidden view read; there is no tool failure. It discovers source directly, as the source-only task contract permits. Therefore this is an availability-description mismatch and unnecessary context, not evidence that the agent ignored an accessible view or that the historical architect view itself was inadequate.

Correction direction: omit this generated-view block for the fixed source snapshot role, or state explicitly that it is unavailable under snapshot inspection. If generated evidence is later offered, retain its candidate identity and provide a permitted reader rather than advertising a working-tree view as candidate evidence.

### Potential navigation improvement: source location must be rediscovered from the project root

`M` gives all requirements but no shared-ui owner/file/caller pointers. `T:3–24` starts with root listings, a `src` search for `Badge|badge|tone|status|label`, then root plan/package/declaration/README and descendant listings. The initial `src` search (`T:8`, 817 bytes) returns server/assembly status hits, because the root source area does not contain the shared UI component. The root README read (`T:15`, 12,019 returned bytes) provides a project-wide explanation before the coordinator finds shared-ui.

Impact/confidence: discovery is justified by the missing navigation pointer and succeeds without errors; no requirement is missed. The later shared-ui/caller/config reads are necessary semantic verification and should not be counted as redundant architecture rediscovery. The initial backend search and most root onboarding are plausible narrowing candidates; causality to total elapsed/cost is unproven.

Correction direction: include existing accepted entry/module navigation and relevant source paths as nonbinding evidence pointers, while preserving the coordinator's full source read scope and independent responsibility for the complete catalog. Do not have the harness infer NFR ownership/completion or substitute the functional work item's done status for assessment. A focused comparison would measure root-orientation calls/bytes and whether all four arguments remain adequately grounded.

## Discovery versus semantic inspection

There is one preliminary source-discovery episode locating the badge, its owner and callers. Its five **content read/search** calls are: root src search; root module declaration and README reads; workspace StatusBadge search; shared-ui semantic search. Directory-navigation listings are tracked separately from this content-call denominator.

| Content discovery target | Calls | Share of five |
| --- | ---: | ---: |
| Architect view | 0 | 0% |
| Consumer API view | 0 | 0% |
| Direct source/tests only | 1 | 20% |
| Other documentation/declaration | 2 | 40% |
| Mixed source/tests and documentation/declaration targets | 2 | 40% |
| Unknown | 0 | 0% |

Mixed workspace/shared-ui searches are kept mixed because results include README/module declarations alongside source/tests; they are not entirely direct-code calls. Source-first episode 1, view-first 0, source fallback after view lookup 0. Generated views were excluded, so this is not an adverse view-usage verdict. Eight navigation listings accompany this episode. Content discovery returns 24,158 bytes; navigation 397 bytes. Separate plan/package reads return 3,210 bytes and diff 29 bytes.

Once the owner and callers are known, eleven focused file reads plus two final semantic searches (`T:25–39`) return 20,121 bytes, establishing production behavior, test assertions/bindings, vocabulary and configured runner discovery. This detail inspection is distinct from architecture discovery. Complete vocabulary reading includes more than the relevant ReviewStatus definition; snapshot_search plus a bounded snapshot_read could narrow that follow-up while preserving neutral-vocabulary evidence.

All 29 non-submission inspection calls return 47,915 bytes: 15 unique reads, eight listings, five searches and one diff. Projection metrics count 14 search operations because listings and the diff join searches; that is not 14 grep/content searches. Two calls are flagged broad in the run policy. Search observations lack scanned bytes/matched identities/outside-scope attribution, but retained arguments/results allow this manual classification. Returned bytes include line-number presentation and are not original file size or scanned bytes.

## Excess bytes and timing

Candidate narrowing, measured from captured UTF-8 line slices:

- Advertised unavailable view block `M:108–134`: 1,077 bytes. Removing it does not remove source snapshot authority or candidate identity.
- Global limits block `M:71–100`: 989 bytes. Keep current relevant rejection/time bounds; most engineering/capability/reconciliation limits are unavailable to this assessment turn.
- Generic task tail `M:142–145`: 210 bytes; retain the designated submission requirement, replace `{}` with the candidate/catalog subject if keeping the sentence.

Whole NFR wording, conditions and uncertainty must remain. The explicit static-evidence policy and comparisonLimit are demonstrably useful and should remain despite overlap with generic procedure instructions. No inherited-context excess exists because this is a fresh start.

Recorded elapsed 69,427 ms; first designated submission approximately 69,309 ms after start. Usage: new input 18,381, output 3,172, cacheRead 54,528, cacheWrite 0, total 76,081. Model/tool subtotals are not additive run wall time. No continuation/fork boundary applies, and none of the byte candidates proves a provider-token/cost/speed improvement. All inspection calls succeed; no submission correction, source edit or investigation/repair batch is requested.

Evidence gaps remain exact pre-accepted historical identity and runtime test execution for this role. They are disclosed in the submitted results; the role's permitted source assessment still settles its four recorded judgments. This review does not rematerialize views, rerun tests, change source/run records or replace the coordinator's semantic authority with harness logic.
