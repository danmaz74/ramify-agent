# Initial analysis prompt review

The initial architect had enough usable goal, plan, architecture and submission information to produce an accepted analysis. The materialized architect view directly supported the correct owner and consumer identification without source inspection. The clearest prompt defect was an unusable relative skill-reference pointer, which produced an observed file-read error. Coverage investigation also returned substantial unrelated view content.

## Coverage and provenance

Reviewed every instance of this kind in this run: **1/1**, `initial-architect/initial-analysis`, `inv-0002`, operation `inv-0002`, harness session `ses-0002`, pi session `aff30c80-fcc0-4bef-b173-2a21866acbcf`, turn 1. Requested and actual start were fresh; there was no inherited point. Prompt package: `initial-architect/3`.

Run `20261009T132856Z-07ccc4` used harness source revision `390eef60abbfb9772969b1fd466204588adef138` and fixture baseline `32eba857aa43a67d04da164cb6745985d1db49fd`. This review uses delivered packet bytes and the complete `ses-0002` transcript, not the current prompt templates. No run records or implementation files were changed.

Artifact aliases below resolve to these exact retained files:

- **T**: [transcripts/ses-0002.jsonl](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0002.jsonl). Line numbers equal transcript `n` values.
- **P**: [correlation packet](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/f8f6ecacb407790fc27ea6537abc875f4490a121aab00cd58f00b6f5f73e1520.json), a single-line JSON record; locations use JSON fields.
- **S**: [delivered role instructions](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/blobs/23874a0c30141af9e96ba59f0a2c1e27b94908d78e7c1cf1ea17aad994c40f4f).
- **M**: [delivered task message](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/blobs/af53d24d0d15c47b85ae121567ea968f9f48e0f36069d4c9728d7666dfb8ac80).
- **O**: [observations.jsonl](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0002/observations.jsonl).
- **A**: [submission.json](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0002/submission.json).
- **R**: [outcome.json](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0002/outcome.json).

S and M hashes were checked against their UTF-8 bytes: **5,685** and **18,350** bytes respectively. P's `packet.roleInstructions` and `packet.message` supply those actual instructions. P's `declarations` and `packet.declaration` retain the read/search/list and submission contracts. Actual serialized provider-request evidence was also inspected, as detailed below.

The four `ramify.pi-native-request/1` payloads for this role have respectively 1, 10, 21 and 36 ordered input items, matching initial input and the three intervening tool batches. All four `request.instructions` values equal S byte-for-byte, and their first user input equals M. Ordered tools are `read`, `grep`, `ls`, `submit_initial_analysis` in every request. Raw payloads, under `collection-review/plans/.harness/session-operations/store/payloads`, are:

- [First request, e995da…](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/e995da703dfd65e4033b1f5be8d4abf808cf7d7debaaa81066f20ee05c0fa0a6).
- [Second request, 55c4a3…](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/55c4a37a97232665ac6321a9c4716d185778c9c116e200a4eea069abc4bd1103).
- [Third request, 3f2eee…](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/3f2eee89020d375d596e2d5a98eaa791152ac9fb07f03388571573b74c804cd1).
- [Fourth request, b3455f…](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/b3455f8daaec2b3c0959ced4e3443830d5f93e5df7d31e7993d90509cd6aeb6e).

## Required information assessment

| Need at delivery | Assessment | Evidence |
| --- | --- | --- |
| Objective and tone behavior | Present directly: optional four-value tone, `data-tone`, omitted neutral, preserved label | M Goal and Requirements; T n4 plan read |
| Plan constraints and accepted classifications | Present: shared presentation ownership, no domain knowledge, existing callers unchanged; four already-classified nonfunctional elements | M Requirements and accepted-intake object |
| Exact scenarios and scenario IDs | Present, with both `ps-01` and `ps-02` verbatim and assignment rules | M scenario section; A scenarios |
| Authority and write scope | Clear read-only authority; decide uncertainties and submit; no shell | S tools and boundaries; P declarations |
| Execution location and current source | Correct project root/cwd, source commit and view revision/input supplied | M evidence and Current environment |
| Architecture/current contract | Obtainable through explicit view pointer and allowed tools; successfully consulted | T n5, n9–21 |
| Skill workflow details | Relative reference ambiguously rooted and failed at runtime | S n36, n61; T n7 |
| Verification expectations | Declared project checks and support pointers supplied; architect correctly did not try executing them | M Declared project checks |
| Expected submission and validation | Complete schema and procedure; accepted on first attempt | P declaration; T n24; R n16 |
| Current dependencies or downstream work | No prerequisite implementation existed; consumer evidence and forecast rules supplied/obtainable | T n15–17; A hypothesis |

No missing task requirement was identified. The empty inline plan wrapper is misleading, but all plan content is in Requirements and the named plan file was accessible. The output contains five functional elements, one context element, one work entry in shared UI, two unchanged plan scenarios, and one advisory hypothesis. The acceptance is schema acceptance, not independent semantic completion of the whole plan.

## Findings

### IA-1 — Medium: injected skill reference resolves against the wrong directory

**Location/IDs:** S lines 14–15, 36 and 61; P `packet.roleInstructions`; T n3 and n7; `inv-0002`.

**Expected:** The embedded discovery workflow must be available through the permitted read tool, using paths whose base is explicit. S says relative calls resolve against the target project root, but the embedded skill links `[references/discovery.md](references/discovery.md)` while its wrapper names an absolute skill directory in a different source checkout. M's `supportPaths` additionally lists `skills/module-architect/SKILL.md` without qualifying its different root.

**Observed:** The architect tried `read {"path":"skills/module-architect/references/discovery.md"}`. T n7 returned:

> ENOENT: no such file or directory, access '/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/skills/module-architect/references/discovery.md'

The actual source checkout's skill directory is a symlink to `../../.claude/skills/module-architect`. The reference exists under that skill root, and the recorded source revision contains `.claude/skills/module-architect/references/discovery.md`. Its workflow discourages searching a module identifier across the whole view and suggests bounded candidate reads. However, the role never successfully read this reference during the invocation.

**Impact/confidence:** One failed read, 168 returned bytes, 84 ms observed tool duration, then continued analysis without the detailed workflow. Confidence high for path ambiguity and observed error; whether losing the workflow caused subsequent broad discovery is unknown. No rejected submission or blocked outcome followed.

**Correction:** Render reference links as absolute actionable paths under the retained skill root, or deliver the required reference content in the packet. Explicitly distinguish target-project paths from harness-support paths. If that reference is delivered, adapt its `rg` examples to the role's actual `grep`/`read` tools; this role has no shell. Validate pointers in the same cwd/tool environment before delivery.

### IA-2 — Low: coverage investigation collected unrelated records after ownership was established

**Location/IDs:** M lines 239–241; T n14, n19–21; O n72, n74, n76; `inv-0002`. Full unknown search output is [blob 724696…](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/blobs/724696849405c6190a94fbc992226ae7676556d06cff5e86837677f384746b69).

**Expected:** Retain reported coverage limits and investigate additional limits relevant to the selected owner/symbol without loading unrelated module/test records.

**Observed:** The initial `_meta.json` already reported `cut:11`, `detailsUnavailable:4`, and measured dependencies/test references. After discovering shared UI, the architect searched the entire view for `detailsUnavailable`, `unavailable`, and bare `unknown`, each with one context line. The first two returned the same metadata fact (357 bytes each). The last returned **20,429 bytes**, including unrelated unknown-record tests, `"unknown":0` counters across modules, and TypeScript `ReactElement<unknown,...>` signatures. None of those matches establishes unknown shapes. It also reprinted the relevant StatusBadge record already read in full.

**Impact/confidence:** These three calls returned **21,143 bytes**, **45.5%** of the 46,433 bytes returned by view-targeted calls. The bare unknown search alone was **42.4%** of all 48,145 exploration-return bytes. They added three calls and 657 ms summed tool durations; those durations overlap and are not additional invocation wall time. Relevant ownership and props evidence had already been obtained. The final coverage statement retained the summary counters and implementation-body limit, rather than identifying a task-specific issue from this large search. Confidence high for excess returned content; causal attribution to procedure wording or the missing reference is a hypothesis.

**Correction:** In the initial-analysis procedure, distinguish carrying global summary limits from investigating task-specific record limits. Use structured metadata and exact coverage-field names, then selected module records. Avoid bare `unknown` across arbitrary signatures/test prose. Preserve uncertainty instead of expanding searches merely to repeat supplied counters. Compare retained output bytes and decision quality in a later run.

### IA-3 — Low: empty plan wrapper contradicts the message's plan-reading instruction

**Location/IDs:** M lines 53–58 and 158–159; T n3–4; `inv-0002`.

**Expected:** A section claiming to show the plan as read at run start should either contain the captured bytes or clearly identify a pointer-only delivery.

**Observed:** M says `The plan, as plans/status-badge-tone/plan.md read when this run started (doc-001):` and then supplies `<plan>\n</plan>`, while the procedure says `Read the plan in the message below, in full`. The full text is separately present in Requirements. The architect also read the named plan file successfully (1,544 returned bytes).

**Impact/confidence:** Misleading presentation, with no missing goal information or observed failed behavior in this run. The plan read was explicitly required by the procedure, so it cannot be attributed solely to the empty wrapper. Confidence high for contradiction, low for any avoidable execution cost.

**Correction:** Remove the empty wrapper and say that the full captured plan is supplied in Requirements, or populate the wrapper and avoid duplicating the same plan text. Retain document identity and exact scenario IDs. Do not merely insert another full copy.

### IA-4 — Low, potential improvement: tailor operational limits to this read-only task

**Location/IDs:** M Current environment `limits`, lines 272–304; `inv-0002`.

**Expected:** Current-task context should make actionable budget/submission constraints clear.

**Observed:** The delivered limits block is **989 UTF-8 bytes**, measured by slicing the retained M bytes from `  "limits": {` up to `  "availableTools":`. It includes repair/gate rounds, fork retries, cycle replans, writer-settle settings and nonfunctional coordination limits for a fresh, read-only initial analysis. This role cannot perform those operations. The final task line also says `Perform initial-analysis for {}` rather than naming its plan.

**Impact/confidence:** About 5.4% of the task message is a mostly irrelevant limits block. No confusion, wrong action or measurable harmful outcome was observed. Confidence high that many settings are outside this task's authority; actual latency/cache/cost improvement from selection is unmeasured. Stable reused context may have cache value elsewhere.

**Correction:** Keep rejection/input and invocation budget limits that affect the task; make other run policy settings an explicit support pointer or stable shared context if reuse justifies them. Name the plan directly in the task line. Measure first-call and subsequent cached input before deciding this is cheaper.

## Materialized-view use and effectiveness

Availability is established by **run-time results**, not today's generated files: T n5 `_meta.json` reports view revision `rev/1:72adef7d-a384-4db0-8922-01f5af63b30c:1`, input `input/1:0d0e205dba6cf923f95ba792dfab83f3839da6c647f68e988b3c132634fa6094`, 15 modules, production dependency scope, measured test references, `cut:11`, `detailsUnavailable:4`. Those identities match M. T n15–18 retain full selected-owner records. No refresh or source read occurred. This supports availability and stated identity; it is not an independent rebuild of every publication input.

Two episodes were identified, with coverage investigation separately labeled:

| Episode | Calls | Targets and effect | Start/fallback classification |
| --- | ---: | --- | --- |
| Existing badge discovery, ownership, contract and consumers | 11 | Metadata/list, map/root module/workspace list, two view searches, four shared-ui record reads | View-first; no source fallback |
| Global view-limit investigation | 3 | Three full-view metadata/unknown searches | View-first; no source fallback; coverage bookkeeping rather than behavior discovery |

The first episode returned **25,290 bytes**. Its view-to-decision chain is explicit: T n16 says StatusBadge is shared-ui-owned and used by catalog UI and reviews pure UI; T n17 shows StatusBadgeProps has status and optional label without tone; A line 78 selects shared UI and A line 121 cites those facts in the hypothesis rationale. The selected view supplied enough evidence for this placement decision, while the analysis correctly left implementation-body mechanics undetermined. No new consumer importability decision was made, so an API-view lookup was not necessary for this task.

| Call classification | Count | Share of 14 view-discovery/coverage calls | Share of all 16 exploratory calls |
| --- | ---: | ---: | ---: |
| Architect view | 14 | 100% | 87.5% |
| Consumer API view | 0 | 0% | 0% |
| Direct source/tests | 0 | 0% | 0% |
| Other documentation: plan + failed skill reference | 2 | Excluded | 12.5% |
| Mixed / unknown | 0 / 0 | 0% / 0% | 0% / 0% |

For strict behavior/ownership discovery, the denominator is **11 calls**, all architect-view calls, and **one episode**, view-first. For the expanded discovery plus coverage bookkeeping denominator it is **14 calls**, still all view-targeted. Both episodes have zero source-first starts and zero view-to-source fallbacks. This avoids inflating behavior-discovery counts with the three coverage-only searches.

The 14 view calls comprise seven reads, five grep searches and two listings; they address **nine distinct requested paths**, including seven unique read files and two listed directories. Five distinct grep queries were used. There was no repeated exact read path; several grep results repeat already-read facts, notably metadata and StatusBadge. Returned view bytes total **46,433**, and summed observed tool durations are **2,090 ms**; this sum is tool service time and not serial elapsed time. Search records do not report scanned bytes or matched-file identities, so neither is inferred. Listings are counted as exploratory calls, not as file reads.

## No-issue results and evidence limits

- No unresolved objective, tone vocabulary, authority, cwd, submission tool or scenario-assignment issue was found. The apparent `{}` task target is compensated by the clear plan and Goal headings.
- The architect used materialized views for every architecture-discovery call and applied their information to its submission. This is positive evidence of usefulness, not a view-read count standing alone.
- No direct source or test inspection, implementation verification, unavailable-shell attempt, write, rejected submission, repair, or degraded start occurred in this invocation.
- T n24 records an accepted submission. R reports zero rejected submissions and **85,521 ms** elapsed. This does not prove that every semantic forecast was correct; hypotheses remain advisory.
- The discovery reference's failed result establishes that this relative path was inaccessible. It does not establish that the absolute wrapper path was denied by the read tool: no such attempt occurred.
- The current source checkout's skill symlink/reference was verified against the recorded revision for the reference content; the failed tool call, not later filesystem state, proves the historical error.
- Serialized provider requests confirm the delivered instructions, original user message and actual ordered tools across all four calls. They establish request composition before transmission; server-side processing and physical wire framing are outside this review's evidence. There is no continuation or fork boundary for this invocation, so first-post-fork analysis is not applicable here.
- The complete generated publication is not needed to prove the positive selected-owner use: the actual tool results retain those records. Global cutoff/unavailable counters cannot be attributed to specific unseen records from these results.
