# Prompt review: catalog-check

The sole observed catalog-check invocation completed its designated submission on the first attempt, with no rejected submissions or tool errors. Its task information was adequate at delivery time: the captured plan, all ten extracted elements, their identities, dependent entry/scenario citations, correction procedure, document pointer, and submission schema were available. No consequential omission or contradiction was found. The strongest improvement opportunity is to trim unrelated environment information while preserving the document comparison and correction contract.

## Coverage and evidence

| Kind/variant | Invocation | Session/operation | Start | Coverage |
| --- | --- | --- | --- | --- |
| catalog-check; catalog-extractor/1, procedure `check` | inv-0003 | ses-0003; native session 121412a0-7965-428f-a31e-5d726cb12c63; operation inv-0003 | requested/actual fresh | Exact packet, transcript bodies, ordered native requests, subsequent tool results, submission, outcome |

Run: `20261009T181051Z-4c5bfc`, plan `status-badge-tone`, target collection-review, execution root `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`. Invocation base/source commit: `32eba857aa43a67d04da164cb6745985d1db49fd`. The captured plan is 1,544 UTF-8 bytes and its document manifest reports one plan document, no missing documents, and an empty principles scan. The model is `openai-codex/gpt-5.6-sol`, high reasoning, with retained native request package version `0.87.1`.

Use these evidence prefixes below:

- **J** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc`.
- **O** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/.harness/session-operations`.
- **P** = `O/correlations/operations/bd47409d2fe14071e8f126b77eac0cfaabbe40201b3ab072ab8fbd1dc3eda1c4.json`.
- **N1** = `O/store/payloads/37ba4f11dbb37ee812330a36379d8cf5ff97557eb9c12a929250501b100c913d`.
- **N2** = `O/store/payloads/775a19dd00718e79ddab06bac057f58c0a4ee3944c5e311e842210d069b91441`.

P has mode `fresh` and source `null`; the invocation manifest has inheritedPoint `null`. Its `context.inherited` list records delivered addition entries, not parent dialogue. N1 independently confirms one user input, exact packet role instructions, exact packet message, and ordered tools `read`, `grep`, `ls`, `submit_catalog_check`. N2 preserves that task and adds the model read call and its result. No inherited dialogue was delivered.

The transcript references resolve to `J/blobs/d1d4861e7d1803af94a26c135e473e6996fd2936ef05eebf0a67354b02d65690` (3,499-byte instructions) and `J/blobs/e72b507ef4eeb977d4545997644e14505769ab8a6c6251994264af2aff8edfc3` (10,466-byte task message). Native requests corroborate the instruction and task content; no template-only reconstruction is used here.

## Required information and usability

| Need | Delivery and assessment |
| --- | --- |
| Objective and comparison baseline | Direct: “Check the reading of doc-001,” full original plan, ten catalog elements and catalog identity. |
| Constraints and dependencies | Direct: all four non-functional elements, five functional elements, context element, dependent entry and two scenario citation lists. |
| Authority and write scope | Direct role instruction “You change nothing”; procedure limits correction to faithful document reading. Actual tools allow file reads and submission, with no write/command tool. |
| Location and document access | Exact absolute captured path, working directory, and available `read`. The read succeeded and returned the full 1,544-byte plan. |
| Verification expectations | Semantic source comparison with explicit add/rewrite/replace rules, preservation of kinds, IDs and complete references. No audit or source implementation check is needed for this task. |
| Submission | Direct `submit_catalog_check` tool declaration and clear empty-list contract. Actual tool was available and accepted `{"corrections":[],"entries":[],"scenarios":[]}`. |

The optional tone values, neutral default, `data-tone` alongside `data-status`, presentation-only ownership, unchanged labels/callers and existing/new tests were all represented. The requirement and acceptance pairs overlap because they repeat separate source statements; this is not evidence of unfaithful extraction. Gherkin remains in the original plan and registered scenarios rather than being copied into catalog elements. The role instruction’s admonition that downstream agents depend on the catalog explains why source comparison matters.

## Findings and potential improvements

### Low: environment includes information outside this task

**Affected:** inv-0003, P `packet.additions[key=environment]` and N1 user input, environment section.

**Excerpt:** `"views": [{"path": "…/.ramify-architect", … "modules": […]}]`, with run-wide limits such as `maxPlacementRequests`, `nonfunctionalRoundsPerPlan` and `repairRoundsPerWorkItemGate`.

**Expected goal:** Compare one captured document with catalog elements using read-only tools and submit corrections. Architecture discovery and implementation scheduling are outside its authority and unnecessary to assess fidelity.

**Mismatch/impact:** The 2,618-byte environment section includes a 1,077-byte architect-view field and a 989-byte limits field. Many limits concern work that this role cannot perform. This is demonstrated prompt excess, with no demonstrated error, clarification, delay or wrong submission attributable to it. Confidence in irrelevance is high; confidence in a cost or latency benefit from removal is unmeasured.

**Correction direction:** Omit architect module lists for catalog checks. Retain projectRoot/workingDirectory, tool names, captured document pointer and applicable submission rejection/budget controls. Reduce limits to the controls that bound this invocation. Preserve actual available tools and the full semantic correction schema. A focused comparison should measure first-request input and check rejection/fidelity outcomes before claiming a run improvement.

### Low: inline original plan repeats a required file read

**Affected:** inv-0003, P addition `brief:requirements`; J/transcripts/ses-0003.jsonl lines 3–4.

**Excerpt:** The task pastes the entire plan under `# Requirements`; procedure step 1 nevertheless says “Read the document in full, then each element.” The agent then calls `read` at the exact captured path.

**Expected goal:** Compare authoritative captured bytes with the catalog; both originals and extracted elements are necessary, but duplicate originals need not be sent twice.

**Mismatch/impact:** The 1,561-byte `brief:requirements` addition contains the 1,544-byte source plus formatting. The read returns the same source again, consuming a tool turn and 1,544 returned bytes. The read is explicitly instructed and is appropriate authoritative discovery, not agent confusion. No harmful effect is observed. The second request has 4,480 cached input tokens, so repeated bytes are not equivalent to wholly uncached input cost.

**Correction direction:** Potentially retain the captured absolute pointer and require one full read, omitting the inline duplicate; alternatively keep exact inline source with identity and make another read optional. Do not remove the original evidence itself or the complete extracted elements. Cache-aware measurement is required to compare those options.

### Informational: generic closing task line is recoverable from the briefing

**Affected:** inv-0003, P addition `task`.

**Excerpt:** `Perform check for {}; use the current evidence and designated submission.`

The empty object adds no identity or scope, but the preceding goal, named document, correction procedure and submission tool resolve the task completely. No unresolved placeholder prevented completion. Replace this line with `Check doc-001 against the displayed catalog elements and submit_catalog_check` for clarity. This is a potential improvement, not an observed failure.

The `supportPaths` field points to `subs/harness/src/analysis/*.md` relative to collection-review even though the relevant instructions are delivered directly. The role does not direct the agent to open those support paths, and it did not try them. Prefer explicit provenance labels or execution-checkout paths when exposing these fields; no failure or missing required information is established here.

## Observed sequence and effects

At 18:12:05.788Z the fresh task starts. The first model request (N1) produces a read of the designated captured plan at 18:12:09.315Z; the tool completes successfully in 15 ms. At 18:12:12.843Z the agent submits empty correction, entry and scenario arrays. Transcript line 6 records acceptance and outcome reports `submitted`, `applied`, zero rejected submissions, no outside-scope changes, no late writes, and 7,108 ms elapsed. The agent declaration that the reading is faithful is its semantic judgment; tool acceptance establishes contract acceptance, not an independent harness comparison of source meaning.

Two model requests are retained. Per-call usage is 4,615 new input / 0 cache-read / 82 output for N1 and 590 new input / 4,480 cache-read / 134 output for N2. Outcome aggregates reconcile to 5,205 new input, 4,480 cache-read, 216 output and 9,901 total. Recorded estimated charges sum to USD 0.026932. There is no continuation or fork boundary for this kind. Second-call reuse is ordinary within-invocation reuse, not first-post-fork evidence.

No architecture-discovery episode or foreign capability need occurred: one captured-plan read and one submission are the entire tool sequence. Materialized architect/API view effectiveness is not applicable to this role. The advertised view being present does not mean it was consulted or needed.

## Evidence limits

- Findings cover every observed catalog-check instance in the assigned repeat run: inv-0003 only. The recorded `attempt: 2` does not make this a retry of a rejected catalog-check; no earlier history is delivered and no prior failure is inferred from that field.
- Native request snapshots establish effective delivered instructions, ordered tools and user input before provider handling. Provider-internal transformations and causal explanations for cache behavior remain outside the evidence.
- The captured document manifest has no recorded commit identity for the plan itself, but its exact hash/bytes, retained captured file, prompt and successful full read agree.
- No prompt alternatives were tried in this review. Byte trimming suggestions establish relevance and duplication, not a measured performance improvement.
