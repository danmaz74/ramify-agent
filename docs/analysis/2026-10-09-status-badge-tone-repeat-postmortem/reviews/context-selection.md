# Prompt review: context-selection

The only observed context-selection invocation selected all four relevant non-functional requirements, explained each choice, and completed its designated submission without a read, rejection or tool error. Its inherited work goal, module evidence and orientation result plus the current catalog elements provided enough information to make the selection. Retained native requests confirm that the selector role and new submission declaration were appended to the inherited architect prefix, rather than replacing it. This preserved the first-call cache while the active-tools message successfully distinguished current and historical submissions.

## Coverage and exact delivery

| Kind/variant | Invocation and work | Session lineage | Coverage |
| --- | --- | --- | --- |
| context-selection; context-selector/2, procedure `selection` | inv-0005; wi-001 | ses-0005 / native session 32209bb1-96a1-412c-a20c-61697de5b472, fork from inv-0004 / ses-0004 at native parent 70485831-d2c2-4d02-a701-ec3aaaa80da1 turn 1 checkpoint d4a547c1-afef-42e8-a1cb-cdba634d61d3 | Exact packet, native first request, inherited history, transcript, submission, outcome |

Run `20261009T181051Z-4c5bfc` implements plan status-badge-tone in collection-review. Source/base commit is `32eba857aa43a67d04da164cb6745985d1db49fd`. The captured plan and document manifest are retained in the run's input directory. The plan asks for the optional four-valued tone, neutral default and data-tone while preserving status/label, callers and presentation-only responsibility, with existing/new tests.

Evidence prefixes:

- **J** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc`.
- **O** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/.harness/session-operations`.
- **P** = `O/correlations/operations/08f42ce86d5b7b7019c0bf93bb5ef1a4be59a10c7f10f025b29ce17afbe5ed3e.json`.
- **N** = `O/store/payloads/30f871afcccf45b2d181d20194f88d39c138614ad7bd34496aaddba625d57227` (the sole selector request).
- **Parent-last** = `O/store/payloads/89432d9c66b437db610f412d85e03d18fcc793ff9b0d3ccfb2781673a11301c9` (inv-0004's final model request).

Derived copies `invocations/inv-0005/{packet.json,task.md,native-first.json}` and inventory.json in this postmortem directory point to the raw evidence above. Analysis uses raw retained content, not present-day templates.

N retains 3,796-byte local-architect instructions and ordered top-level tools read, grep, ls, submit_work_orientation. Its first 74 input objects exactly match Parent-last, and its instructions/tools also match exactly. Parent completion is appended as inherited input objects 74–76: final reasoning, submit_work_orientation and its accepted result. Objects 77–79 then append the 469-byte selector developer role, developer additional_tools containing submit_context_selection with its complete schema in the description, and `Active tools: read, grep, ls, submit_context_selection. Inactive historical tools must not be called.` Object 80 is the current 5,312-byte selection message.

The apparent difference between the transcript's selector systemPrompt label and N's inherited architect instructions is resolved by the appended developer role. Similarly, submit_context_selection is absent from N's historical top-level tools array but present in the appended native additional_tools declaration, and its call is observed accepted. Reporting it as unavailable would contradict the request and execution. No assignment or completion after inv-0004's orientation point was inherited.

## Required information and usable instructions

| Need | Delivery and assessment |
| --- | --- |
| Work objective and module | Inherited orientation briefing names optional tone/data-tone/defaulting and shared-ui ownership; final orientation submission consolidates those facts. |
| Existing behavior/current state | Inherited README, module declaration, StatusBadge and its tests, generated scenarios, runner configuration and orientation result establish label/status regression expectations and local test shape. |
| Constraints to select | Current message directly supplies nfr-001 through nfr-004 in full, with identity, conditions and uncertainty. No principles or recommendation elements exist in this captured catalog. |
| Authority | Appended selector role: “You do not waive requirements, assign work, or edit files.” Current procedure repeats that omitting an element does not waive final assessment. |
| Location and tools | Current selector workspace cwd is explicit; projectRoot allows absolute paths. Read/grep/ls and designated submission are active. Relative paths in old tool calls describe historical module cwd and must not be reused blindly in current cwd. |
| Submission and completion | Current role/schema require selected IDs, reasons, conditions and uncertainty. Procedure says submit_context_selection. Accepted submission is observed. |
| Optional original-document access | The prompt permits a captured-document read to settle doubt, but does not give the captured file path; see low finding below. No doubt arose here. |

The inherited architect role directs the agent to follow the current procedure and designated submission, which limits conflict with the appended selector task. The phrase “IDs only” is explicitly contrasted with passages/headings/ranges and paired with a schema requiring reasons, conditions and uncertainty; the agent correctly interprets it as the selection identity format, not a prohibition on explanations. No unresolved placeholders or contradictory catalog constraints were found.

## Findings and potential improvements

### Low: optional captured-document lookup has no exact captured pointer

**Affected:** inv-0005; P current task/procedure and N object 80.

**Excerpt:** `You may read a captured document to settle a doubt`, while each element attributes itself to `plans/status-badge-tone/plan.md`.

**Expected goal:** If original wording must resolve doubt, the selector should read the bytes this run captured, rather than an editable plan copy. The current projectRoot makes the source plan obtainable, but neither the current task nor inherited orientation briefing supplies J/input/plan.md or doc-001's storedAt mapping.

**Mismatch/impact:** Optional evidence discovery lacks a precise captured pointer. This did not block selection: all required elements were direct, local context was inherited, the agent recorded no uncertainty and made no read. Confidence in missing pointer is high; no observed wrong-document effect is claimed.

**Correction direction:** Add an absolute captured-document mapping keyed by doc-001 or a clear retained manifest pointer. Keep the permitted original-read exception explicit when it is offered. Verify a selector with a genuine wording doubt opens captured bytes under the changed selector cwd.

### Low: run-wide environment information is repeated for a narrow selection task

**Affected:** inv-0005; P environment addition, N object 80.

**Excerpt:** Current message repeats an architect-view module list and run-wide repair/placement limits.

The 2,727-byte current environment contains a 1,077-byte views field and a 989-byte limits field, measured from the exact UTF-8 field lines. Inherited orientation already supplies project/view identities and evidence. Selecting these four constraints does not require every module name or repair policy for other roles. No reads or wrong actions resulted. Potentially omit the module enumeration and keep current cwd, projectRoot, active tools, appropriate invocation/rejection controls and the captured-document map. The field should remain available when a selection truly requires further architectural evidence; this recommendation targets irrelevant enumeration, not a rule against view access.

### Potential: large inherited lookup results can be reduced only with cache tradeoffs measured

**Affected:** inv-0005; N inherited objects 48–49 and earlier orientation history.

Inherited ordinary/testing API grep outputs total 19,087 raw UTF-8 bytes (9,627 and 9,460). They enumerate many unrelated contracts and testing fixtures. The orientation submission already records the useful conclusion about ReviewStatus, existing presentation ownership and no coverage-based absence inference. The selector's four choices depend on those module/behavior facts, not the complete two catalogs. Inherited outputs also include 2,877 bytes of ramify-audit.json, exploratory package/tooling searches and four prior path-not-found results; these were orientation work, not selector errors.

Across inherited function_call_output text, 39,781 UTF-8 bytes are retained. The parent user briefing is 15,968 bytes and includes check policy, orientation-only procedure and scheduling material alongside necessary work/owner/scenario facts. Some historical instructions, metadata and failed searches do not support this selection, but inherited history is a useful cached evidence record rather than a newly paid replay of all original calls.

**Correction direction:** If compact/fresh selection is considered, compare a packet carrying work goal, owner, relevant current behavior/test facts, complete final orientation summary and complete selectable catalog against the preserved fork. Do not silently replace the preserved fork or claim savings: first-call cache evidence below favors retaining its unchanged prefix. Relevance trimming and lower provider cost are different questions.

## Observed effects and first-post-fork cache

The task starts at 18:13:10.077Z. The only model request returns submit_context_selection at 18:13:17.261Z; transcript ses-0005.jsonl lines 3–5 records the four choices and accepted verdict. No reads, searches, clarification or repair occur. Outcome ends submitted/applied with zero rejections, no outsideScope writes or late writes, and 7,257 ms elapsed.

The selected reasons apply inherited facts: nfr-001 is tied to presentation-only responsibility; nfr-002 to existing default/custom labels and the explicit scenario; nfr-003 to current feature consumers and optional source compatibility; nfr-004 to existing regression tests and dedicated tone/scenario coverage. This is evidence that inherited orientation aided the selection, beyond a mere view-read count. The accepted tool checks submission validity; the four constraint relevance judgments belong to the selector.

| Boundary | First child request | New input | Cache read/write | Output | Input cache share | Estimated recorded charge |
| --- | --- | --- | --- | --- | --- | --- |
| inv-0004 orientation → inv-0005 selector; actual fork | N; sole model request, before any selector tool turn | 2,547 | 16,256 / 0 | 258 | 86.45% = 16,256 / (16,256 + 2,547) | USD 0.0218504 |

Model/provider is openai-codex/gpt-5.6-sol high; native package 0.87.1, SSE. The retained request uses the parent prompt_cache_key and unchanged instructions, ordered top-level tools and parent input prefix, then appends the parent final answer and selector messages. This establishes eligibility and a measured hit; it does not prove every matching byte was cached or attribute all uncached input solely to the selector append. Whole-invocation totals equal first-call usage because only one selector model request exists.

The selector performs no new architecture-discovery or foreign capability lookup. Its relevant owner/API information is supplied through inherited context and orientation conclusions. Attribute the parent read/search calls to inv-0004, not as additional selector calls or additional charges.

## Evidence limits

All observed selection instances in this repeat run are covered: inv-0005 only. The native request captures the ordered effective instructions/tools/input before provider handling; provider-internal transformations are unknown. Historical relative source paths should not be judged against the later selector cwd. No behavior after the source orientation checkpoint is assumed available. The optional captured pointer issue was not exercised. No reduced-context comparison or new paid trial was performed, so trimming suggestions remain potential improvements with measured cache tradeoffs unresolved.
