# Independent prompt review: intake

Covered every observed intake instance assigned to this reviewer: **inv-0001**, role `catalog-extractor`, run `20261009T181051Z-4c5bfc`, operation `inv-0001`, harness session `ses-0001`, pi session `d5333aae-b95d-4cb4-8de8-32f5f180a49e`. Requested and actual start were fresh; turn 0 checkpoint `ba991e63-7f1b-405b-b490-4f75d027f8fc` supplies no inherited task history. No previous postmortem was read.

The task was adequately specified at delivery and completed with one source read and one accepted submission. No task-blocking omission, conflicting authority, inaccessible required input, tool error, or rejected submission was found. The main opportunity is removal of intake-irrelevant environment detail and the plan copy that the required source read repeats. Their observed impact is additional delivered bytes; there is no evidence that they caused misunderstanding or failure.

## Evidence and exact delivery

Paths below use evidence root `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/`:

- `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/invocations/inv-0001/{invocation.json,submission.json,outcome.json}`.
- `.harness/session-operations/correlations/operations/3f25b893b1a633c9ae8c9f7cb91d4291df019875245dcd694c02a1b05bff059b.json`: `packet.roleInstructions`, `packet.message`, `packet.additions`, `declarations`, `policy.validator`.
- `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/transcripts/ses-0001.jsonl`, records n=1–9. Record n=1's system body references blob `d1d4861e7d1803af94a26c135e473e6996fd2936ef05eebf0a67354b02d65690`; the correlation retains the full matching role text.
- Captured `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/input/plan.md`, 44 lines including the final blank line, 1,544 UTF-8 bytes. Transcript n=4 returns the whole captured plan.
- Native provider request `.harness/session-operations/store/payloads/adbc814e3bc6d2577ed28b53805edfdd1795898a079ef747e1122db42b789ec6`: initial request, exactly one user input whose text equals `packet.message`; `instructions` equals `packet.roleInstructions`. Follow-up request payload `6640c7b311297c076ebe9a2dd40b3bb1ccbf24cb6642b6f2ae53e0fa1321eea3` retains the same task as its only user message and appends the read call/result and reasoning. Thus later inherited copies from other invocations were excluded.

Initial captured role instructions are **3,499 bytes**, current message **6,294 bytes**, and retained submission-tool declaration **2,346 bytes**. Addition records are provenance fragments of those delivery surfaces; they must not be counted again as separately pasted messages. Native requests confirm tool order `read`, `grep`, `ls`, `submit_intake`, with read-only capabilities and no shell/write tool. The provider-facing `submit_intake.parameters` is a generic object with empty properties; the complete submission schema is in its description and the retained validator schema. This is an observed design, not an observed failure: both schema descriptions match, and submission succeeded.

## Required information at the delivery point

| Need | Delivery assessment |
| --- | --- |
| Objective | Direct: read the captured status-badge-tone plan and extract its goal, non-functional constraints and recommendations, and incorporation judgments. |
| Plan constraints | Direct in `# Requirements`, and independently obtainable through the explicitly required absolute captured-file read. Optional four-value tone, `data-tone`, neutral default, compatibility, presentation scope and tests are all present. |
| Authority and write scope | Direct system text: “You change nothing”; only read/search/list and submission tools are available. `policy.authority.writer=false` agrees. |
| Current state and dependencies | Fresh intake, one captured plan `doc-001`, no principles documents assigned, scenario blocks at lines 34–38 and 40–43, and “Missing references to judge: none.” No implementation state is required for this extraction. |
| Execution location | Absolute `projectRoot`, `workingDirectory` and captured-file path are correct and the source read succeeds. No source checkout discovery is required. |
| Verification expectation | Human/model faithful reading of source; harness validates structure/documents/citations and explicitly does not compare text with source. Tests and audits are not this task's verification. |
| Submission | Direct `submit_intake` tool, complete schema in declaration, unique element keys, uncertainty/conditions fields and document/missing-reference judgments. “Only an accepted submission completes this task.” |

The general role describes functional, fixed and context elements because it is reused across catalog procedures. The current intake procedure explicitly says “Do not submit functional or context elements: the architect reads those.” That instruction is specific and unambiguous; the broader taxonomy is not a conflicting request to submit those kinds. The source contains no recommendations, and submission correctly contains none.

## Findings and correction directions

### Low: intake receives implementation and architecture environment detail it cannot use

Affected kind/IDs: intake, `inv-0001`. Location: correlation `packet.message`, `# Current environment` / `additions[key=environment]`.

The environment is **2,612 UTF-8 bytes**, including a **1,076-byte** `views` field with the architect revision, 15 modules and coverage entries (`“cut: 11”`, `“detailsUnavailable: 4”`), **988 bytes** of limits, and **137 bytes** of harness-source `supportPaths`. The intake procedure only needs the captured documents and extraction/submission contract; it neither performs architecture discovery nor owns iteration scheduling, repair, publication or command execution. The scope-size record also says “the role's profile does not include the global view.” Delivering a global-view inventory to this task adds unrelated context even though a path is listed.

Observed effect: the actual trace does not consult the architect view or source support paths, and makes exactly the expected read/submission calls. Additional bytes are demonstrated; distraction or latency causation is not. Confidence is high for role irrelevance, low for any behavioral/cost effect.

Potential correction: specialize the intake environment to project/working paths, available tools and applicable rejection limits. Removing `views` and `supportPaths`, and keeping only `rejectedSubmissionsPerTurn` and `rejectedToolInputsPerTurn` in limits, produces a **499-byte** environment with identical JSON indentation: **2,113 bytes** removed. This preserves all actionable needs listed above. Keep stable reusable role instructions where cache behavior supports them; irrelevance is distinct from cache cost. Validate a later change by comparing extraction fidelity, accepted submissions and provider usage, not just prompt size.

### Low: inline plan duplicates the mandatory full captured-source read

Affected kind/IDs: intake, `inv-0001`. Location: correlation `additions[key=brief:requirements]`, procedure step 1; transcript n=3–4.

The task includes **1,561 bytes** of `# Requirements` containing the entire plan, while both the role and procedure require reading the captured file at its absolute path in full. The agent follows that instruction and receives **1,544 bytes** of plan text again before submitting. This source read is faithful compliance, not avoidable agent rediscovery.

Observed effect: two copies of plan content are present by the second model call. No clarification, repair or task failure follows; the accepted submission preserves all three Constraints bullets plus the testing constraint from Acceptance. Confidence is high for duplication and low for resulting provider cost, because byte removal does not establish cache-adjusted savings.

Potential correction: retain the goal, captured-document identity/path, scenario locator inventory, missing-reference state and procedure, while replacing the pasted plan body with the captured-source pointer. That can remove the **1,561-byte** requirements fragment (less any short pointer replacement) without withholding the source because the required `read` remains available. For a tiny plan, this is a potential efficiency change rather than an urgent defect. Measure later first/second-call usage and extraction completeness.

### Informational: generic task footer is weaker than the task-specific intake brief

Location: correlation `additions[key=task]` / message footer: “Perform intake for {}; use the current evidence and designated submission.” The `{}` is the serialized empty work identity, not a missing document ID. The preceding plan-specific heading, captured source and six-step procedure fully resolve the task; no observed error follows. Prefer a footer that names `status-badge-tone` or `doc-001`, or omit the redundant sentence while retaining the accepted-submission completion rule. No unresolved placeholder prevents completion here.

## Observed sequence and result

- 18:10:51.813Z: fresh intake started with the captured prompt (transcript n=1).
- 18:10:55.011Z: `read` requests the exact captured absolute path with offset 1 / limit 2000 (n=3); n=4 returns all 1,544 bytes without error.
- 18:11:02.795Z: `submit_intake` sends a goal covering the four tones, data attribute and neutral default, four non-functional elements, `doc-001.scenarios=true`, and an empty missing-reference list (n=5).
- 18:11:02.808Z: accepted on the first attempt (n=6), followed by “The submission was accepted and recorded.” Outcome records `ended=submitted`, `disposition=applied`, zero rejected submissions, no outside-scope writes, and 11,042 ms elapsed.

This establishes successful intake submission and source-grounded extraction within its assigned scope. It does not establish downstream implementation, test health, or architect semantic acceptance.

## Evidence gaps and limits

Native request payloads are retained, so the initial system instructions, ordered declarations and user task can be verified beyond a display transcript. Provider internal transformations and effects of shorter context on model behavior are not observable. There are no architect-discovery or foreign-capability episodes in this intake; view effectiveness is not applicable. No continuation/fork boundary occurs in this invocation. Its ordinary second request includes a cache read in the transcript, which does not prove that removing environment or plan bytes would reduce charges. No task-specific adequacy issue was found beyond the small clarity and size opportunities above.
