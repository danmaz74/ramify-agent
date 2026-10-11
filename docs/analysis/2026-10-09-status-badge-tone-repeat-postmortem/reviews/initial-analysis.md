# Initial-analysis prompt review

The initial architect submitted an accepted analysis on its first attempt. The delivered prompt supplied the goal, constraints, accepted intake, plan scenario text, read-only authority, prepared view identity, working directory and complete submission declaration. Historical tool results establish successful view-based owner discovery without reading implementation source. The main observed friction was two failed reads after the agent replaced supplied absolute skill-reference paths with project-relative paths. There is no evidence of an inaccessible supplied absolute reference.

## Coverage and exact delivery

| Kind / variant | Invocation | Session | Operation | Start | Result |
| --- | --- | --- | --- | --- | --- |
| initial-analysis / initial-architect/3 | inv-0002 | ses-0002; a506d611-8ede-4a8a-903a-f22a9b265534 | inv-0002 | requested fresh, actual fresh; turn 1 | submitted, applied; 0 rejected submissions |

Run: `20261009T181051Z-4c5bfc`. Project and execution cwd: `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`. Base source: `32eba857aa43a67d04da164cb6745985d1db49fd`. Briefing revision: `6dee30dfe0b3e209a0b1c5fe029792bee15016db233eda2340ef4830d4895867`. No inherited messages or parent turn were delivered on this fresh invocation.

Evidence abbreviations below:

- `J`: project-relative `plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.
- `T`: `J/transcripts/ses-0002.jsonl`; references are JSONL line numbers.
- `S`: `J/blobs/43e073cc1e166e5ee561b412d22dd3cf973eb902ad4b7338c0a338be8349f765`, delivered system instructions, 6,149 UTF-8 bytes.
- `M`: `J/blobs/49fb88a09f2d39587f162fb442204ee00a827cc3ae38497cb6212ff427d53c39`, delivered user task, 18,456 UTF-8 bytes.
- `P`: project-relative `plans/.harness/session-operations/correlations/operations/0e7de4d40efd657156befe889c3f3cd51f31ebbc3a74535c76bb7f2e80c57ce9.json`, packet and declarations.
- `N`: project-relative `plans/.harness/session-operations/store/payloads/2402441174abf960b43e909026c533aa0e34bfd598b0e146a2677df62628cdcb`, first native request (`ramify.pi-native-request/1`, pi packageVersion 0.87.1).

`N.instructions` equals `S` exactly, and the sole first-request input message text equals `M` exactly. Ordered native tools are `read`, `grep`, `ls`, `submit_initial_analysis`; compact JSON serialization of the native tool array is 8,094 UTF-8 bytes. This is stronger delivery evidence than template reconstruction. The invocation manifest records 5,861 bytes for the submission declaration alone; that quantity is not the total native tool array. Six distinct native request payloads contain this fresh task. The provider request uses `gpt-5.6-sol`; the transcript reports `openai-codex/gpt-5.6-sol:high`.

## Required-information assessment

| Need at delivery | Assessment and evidence |
| --- | --- |
| Objective and behavior | Direct: `M:3–50` states optional four-value tone, data-tone, neutral default, unchanged status/label/callers and test expectations. |
| Historical plan | Plan content appears in requirements; exact document is also obtainable at `plans/status-badge-tone/plan.md`. `T:3–4` records reading its 1,544-byte content. `M:55–58` misleadingly introduces an empty `<plan>` block, but the text elsewhere plus actionable pointer met the need. |
| Accepted classifications and decisions | Direct: `M:99` includes accepted non-functional classifications and incorporation. `M:119–128` says not to classify these again. Submission complies. |
| Scope and authority | Direct: `S:8–24` permits only reading and submission; no writes, shell, clarification or execution. `M:268–269` gives project root and cwd. |
| Current architecture and dependencies | Direct identities and limits in `M:91–95,308–333`; obtainable prepared architect view. `T:5` returns metadata matching the delivered revision/input. No current generated files were used to establish historical availability. |
| Verification expectation | This role submits architecture analysis, not running checks. `M:101–112` lists project checks and config pointers; skill and procedure retain coverage limits. |
| Submission shape and semantic duties | Complete actual tool declaration in `P.declarations` and `N.tools`; procedure in `M:115–264` provides ID, scenarios, citations and reference rules. No schema/tool incompatibility was observed. |
| Outcome and acceptance authority | `S:24` makes accepted submission the result. `T:25–28` records first submission accepted. This proves protocol acceptance, not implementation completion or responsible architect semantic acceptance. |

No necessary plan behavior, relevant authority, execution location or submission schema was missing. The literal task description `Perform initial-analysis for {}` (`M:344`) has little semantic content, but the preceding goal and procedure made the task identifiable.

## Findings and correction directions

### Low: supplied reference paths were replaced with unusable project-relative paths

Affected kind/ID: initial-analysis, inv-0002. `S:60–64` supplies absolute discovery and access links under `/home/app/ramify-status-badge-repeat-20261009T180737Z/ramify-agent/skills/module-architect/references/`. `S:14–15` states relative paths resolve against the execution project.

Observed mismatch: `T:7` calls `read` on `skills/module-architect/references/discovery.md` and `skills/module-architect/references/access.md`. `T:8–9` returns ENOENT under the collection-review project. The agent does not retry the supplied absolute paths. It proceeds with the embedded skill and successfully discovers the owner. The failed results contribute 363 returned bytes and two tool calls. Correct causality: the relative rewrites caused these failures; this evidence cannot show whether the supplied absolute files were available.

Correction direction: strengthen the skill embedding with “Read reference links using their literal absolute targets; they are outside project cwd,” and keep support references clearly distinguished from project paths. Consider omitting the unused `access.md` route from role-specific context where this task only locates existing behavior/owners and no consumer importability question arises. Validate by observing literal target reads in an equivalent invocation, not by declaring current filesystem success proves the historical links worked.

### Low: empty plan block and generic task label obscure an otherwise complete briefing

Affected kind/ID: initial-analysis, inv-0002. `M:55–58`: “The plan, as ... read when this run started (doc-001):” immediately followed by `<plan>\n</plan>`. `M:158–159` asks to read “the plan in the message below, in full,” although full plan-equivalent requirements appear above and the plan block is empty. `M:344` names `{}` instead of a meaningful subject.

Impact: the agent reads the exact plan path successfully in `T:3–4`. Reading the plan is independently required by the procedure, so this is not evidence that the empty block caused an otherwise avoidable read. No missing requirements or rejection results. Delivery clarity is the concern, not task failure.

Correction direction: replace the empty block with an explicit captured-document pointer and describe where complete text is delivered. Replace `{}` with plan/run identity or remove the generic sentence. Preserve source-document identity and the exact plan-scenario mapping.

### Low: metadata exploration continues after summary limits are already known

Affected kind/ID: initial-analysis, inv-0002. `S:111–113` says “do not search for missing metadata.” `M:239–241` requires retaining every coverage statement. `T:5` already returns `cut:11`, `detailsUnavailable:4` and production dependency scope. Nevertheless, `T:18–19` searches the whole view for `detailsUnavailable|unknownShapes|cut|unavailable|coverage`; `T:23–24` repeats a narrower details/unavailable search that returns only the already read metadata line.

Impact: two additional view searches return 7,907 bytes; the latter adds no new limitation. No direct-source fallback or task failure occurs. The broad first search does find records with truncated declarations; documenting such cuts can be useful, so it should not all be classified as waste. The narrower second lookup is evidenced repetition. Instructions to retain all limits and not search for missing metadata would benefit from clearer differentiation.

Correction direction: explicitly permit targeted inspection of reported cuts when relevant and state that `detailsUnavailable` without detail records is a retained unknown, not a request to search for unavailable metadata. This preserves uncertainty without encouraging exhaustive limit rediscovery.

### Potential semantic concern: a forecast repeats part of the entry's required behavior

Affected kind/ID: initial-analysis, inv-0002. `M:116` says “Record no hypothesis that restates an entry”; `M:145–150` scopes forecasts to deeper-tree needs. The submission entry `render-toned-status-badge` already requires “using neutral when tone is omitted,” with the default requirement in `requirementRefs`. The sole hypothesis, `default-omitted-badge-tone`, has `capability:"render-toned-status-badge"` and forecasts local omitted-tone resolution in the same owner, explicitly described as an implementation detail.

This can reasonably be read as a subordinate detail rather than a complete duplicate, so it is a semantic review concern rather than an established protocol defect. The accepted schema permits it; no later harm was examined in this delegated kind. A local owner implementing the required default does not obviously require a separate deeper-tree forecast.

Correction direction: explain that same-owner local mechanics already required by an entry can produce `hypotheses:[]`; require a distinct deeper need when choosing to forecast one. Let the responsible architect assess this distinction. Do not convert this judgment into harness completion logic.

## Extraneous context and byte estimates

All sizes below are UTF-8 bytes measured from captured `M` line slices including their retained line endings; they are not provider tokens or savings estimates.

| Candidate for narrower delivery | Bytes | Why removal/narrowing can preserve required information |
| --- | ---: | --- |
| Full global `limits` object, `M:272–301` | 989 | Most limits govern later engineering/recovery work unavailable to this read-only role. Keep rejected-submission/tool-input limits and relevant time/budget information if the agent can act on it. |
| Declared-check block, `M:101–112` | 1,527 | Role cannot run shell or audit. Keep the test-preservation expectation and configuration pointer; omit command argv and whole-suite/watch advice for a role with no shell. The acceptance context remains useful. |
| Support-path list plus null cucumberConfiguration, `M:335–340` | 218 | Lists project-relative template/skill paths that are not demonstrated to exist in project cwd. The current role/procedure are delivered already, and supplied absolute skill links are clearer. |
| Empty plan introduction/block, `M:53–58` | 129 | Replace with an honest captured-document pointer; no substantive plan content is removed. |

The full 1,561-byte requirements block repeats scenario text later in the 597-byte plan-scenario section, but removing it wholesale would remove constraints and context. A focused scenario-only deduplication is a candidate, provided the exact numbered scenarios remain authoritative. General integration/new-module instructions were not reached in this simple task; retention is still useful for a stable general procedure, so non-use alone does not prove they are harmful or cost-inefficient. No inherited-history excess exists on this fresh invocation. No causal effect of these byte candidates on runtime or cost is demonstrated.

## Historical view availability and architecture discovery

Prepared view identity is established by the delivered task and actual metadata response: revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:1`, input `input/1:abde10727c92bf5d401f1e7f289cc96cbb87464226972be6bf861a99063cd816`, 15 modules, production dependency scope, cut 11 and detailsUnavailable 4. Actual result bodies retain historical map, module, signature, supporting-contract, test-title and behavioral-consumer information. No inference from today's materialized view was needed.

One architecture-discovery episode finds the primitive, owner, existing contract and consumers. It begins with view orientation (`T:3`, architect ls, followed by `T:7`, root map/module), and proceeds to shared-ui details (`T:12–17`) and consumer/context records (`T:18,20–22`). Count `ls`, `read` and `grep` once per tool call; include failed workflow reference reads as other documentation, because they were attempted within this episode.

| Discovery call target | Calls | Share of 13-call discovery denominator |
| --- | ---: | ---: |
| Architect view | 11 | 84.6% |
| Consumer API view | 0 | 0% |
| Direct source/tests | 0 | 0% |
| Other documentation (two failed reference reads) | 2 | 15.4% |
| Mixed/unknown | 0 | 0% |

Separate from discovery: one plan read and three coverage/metadata inspection calls (`_meta.json` read plus two metadata-focused searches). Across all 17 non-submission tools, 14 target the architect view and three target other documentation. These alternative denominators are intentionally not interchangeable.

Discovery episodes: view-first 1; direct-source-first 0; source fallback after view lookup 0. Architecture-discovery tool results return 20,533 bytes from architect targets and 363 bytes from reference errors, total 20,896 bytes. Coverage/metadata inspection returns 8,236 bytes. The plan read returns 1,544 bytes. All non-submission result bodies total 30,676 bytes. No read path is repeated; the `.ramify-architect` directory is targeted repeatedly by listing and distinct searches. Unique architect discovery targets are nine files plus the root directory; all architect targets including metadata are ten files plus the root directory. Search-result truncation is visible in `T:17` and `T:19`; subsequent direct view-record reads retrieve fuller relevant records. Returned bytes are not scanned bytes.

Usefulness is supported beyond mere access: `T:13` states shared UI owns presentation primitives; `T:14` exposes `StatusBadge({status,label})` with behavioral consumers in catalog UI and review pure UI; `T:16` gives `StatusBadgeProps` without tone. The submitted entry places the change in that exact owner and cites these existing contracts/consumers. No source-first exploration or avoidable source rediscovery occurred. No engineer foreign-capability need is applicable to this role; zero API-view reads should not be treated as a failed importability investigation.

## Outcome, timing and evidence limits

`T:1` starts at 18:11:02.864Z and `T:28` ends submitted at 18:12:05.767Z; outcome elapsed is 62,907 ms. Recorded usage is input 17,465, output 3,698, cacheRead 55,168, cacheWrite 0, total 76,331. First assistant response (`T:3`) reports input 7,474, output 124 and cacheRead 0. This invocation has no continuation/fork boundary; later tool-turn cache reuse is distinct from such boundary analysis. Per-discovery-episode wall/model time is not separately attributable from these figures.

Only this kind and invocation were reviewed. Later work, implementation tests and semantic reviews were not read to infer whether this analysis ultimately completed the plan. Current absolute skill-reference availability was not used to establish historical access. Native request capture verifies effective initial instructions, tools and task messages but does not expose all provider-internal transformations. No clarification, source modification, rejected submission or invocation failure was observed. No implementation change or new trial was performed.
