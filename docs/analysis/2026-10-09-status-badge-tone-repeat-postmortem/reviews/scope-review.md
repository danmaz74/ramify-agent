# Independent prompt review: scope review

Covered **inv-0009**, role `reviewer`, task `scope`, work item `wi-001`, iteration `wi-001.i01`, request `rq-0002`, run `20261009T181051Z-4c5bfc`. Harness session `ses-0008`, pi session `59fbb984-bf35-4860-bdbf-2202b379116c`. Requested and actual start are fork, from local-architect session `70485831-d2c2-4d02-a701-ec3aaaa80da1` through **turn 2** checkpoint `9d7d355d-beb0-4a93-ac47-5d4f0e86e0e7`. The source contains orientation `inv-0004` and accepted assignment `inv-0006`, including assignment's rejected first submission followed by correction. Later local completion `inv-0010` and engineer/review turns are excluded from inherited context. No prior postmortem was consulted.

The scope-review prompt was adequate at delivery. Exact provider request evidence verifies the reviewer instruction/tool transition, frozen candidate intent, complete four-path diff and applicable plan context. The reviewer uses only snapshot tools, grounds its judgment in current candidate reads, and submits all four inspected paths with no concerns or missing files; accepted on its first attempt. No unavailable-tool error, scope-contract confusion, inherited-source reliance in place of current candidate inspection, or rejected review submission was observed.

## Raw evidence and exact provider delivery

P = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/`; J = P + `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.

- P `.harness/session-operations/correlations/operations/68346b8adc5a1f385c04b25faac55c9f1dbda635b5020239a8e70e1454743c16.json`: source checkpoint, exact review role/task/declarations/manifest.
- P `.harness/session-operations/store/payloads/ea6dafd8a79e8c1c0e7135911d4d04fbff8dc55a68d845686ee0bef16d370b34`: first child native request, 91 ordered input items; P payload `0215669dc69f826186d1856f81d1f4df360be28841c963c48253998018593d74`: last native request.
- J `transcripts/ses-0008.jsonl`, current invocation n=1–17, plus parent `transcripts/ses-0004.jsonl` filtered to `inv-0004` and `inv-0006` only.
- J `invocations/inv-0009/{invocation.json,submission.json,outcome.json,observations.jsonl}`; parent accepted `invocations/inv-0006/submission.json` agrees with inherited assignment arguments.
- Current snapshot tool results contain candidate `plans/status-badge-tone/plan.md`, production component, unit tests, generated feature and new step definitions; the captured plan is also J `input/plan.md`.

The native first request preserves the **3,796-byte local-architect system prefix** and original `read`, `grep`, `ls`, `submit_work_orientation` top-level tool prefix. It does **not** replace the provider system field with the displayed reviewer system text. Instead, ordered input item 87 appends **2,546 bytes** of reviewer instructions as a developer message, item 88 supplies additional declarations for `snapshot_list`, `snapshot_read`, `snapshot_search`, `snapshot_diff`, `submit_review`, item 89 says “Active tools: snapshot_list, snapshot_read, snapshot_search, snapshot_diff, submit_review. Inactive historical tools must not be called.” Item 90 is the exact **20,136-byte** current scope task. Earlier item 78/79 contains the assignment-tool declaration switch; it is historical, not currently active.

This is an intentional preserved-prefix transition; inspecting only top-level native tools or display `systemPrompt` would misdescribe the actual delivery. Current role instructions forbid live cwd, absolute/climbing paths and generated views. Despite inherited local advice to read `.ramify` and local files, the newest developer active-tool statement and snapshot declarations make the current action interface usable. The agent actually calls `snapshot_read` with project-relative inputs; normalized transcript action paths are absolute resolved paths and must not be mistaken for absolute arguments submitted by the model.

## Required information at delivery

| Need | Delivered or available |
| --- | --- |
| Objective | Current scope review request `rq-0002` and procedure: candidate must do what assignment asked, no less/more; correctness defects unrelated to scope are outside this review. |
| Frozen identity/current state | Candidate `40155157c0af1fa686ec5b8579755c17a6364613`, tree `36c77a3a474e60064bbb3efabdd5c0547a92133a`, base `564534ea8e482a1d65b77a247f80577ff5d540d8`, passed gate `ga-0002`; all explicit. A gate pass is evidence, not semantic acceptance. |
| Intent/constraints | Current goal, approach, completion evidence, rationale, ten whole catalog elements, no deviations, and candidate plan path. Accepted inherited assignment matches current goal/approach. |
| Write-scope contract | Current rationale confines work to shared-ui source/tests and forbids external/runner/guarded modifications. Exact inherited accepted scope has base shared-ui, `included=[]`, `extra=[]`, read contracts, no authorizations, obligations `sc-001/sc-002`. The task explicitly says the harness assignment record is not a snapshot file and to use supplied intent. |
| Changes/provenance | Canonical four-path list and all complete patches including harness-produced pending-tag removal; both binding attributions name exact candidate feature hash, producer `inv-0007` and submission hash. |
| Authority/tools/location | Review-only judgment, no editing/scheduling/resolution; candidate-root snapshot tools and current tool switch. Review cwd appears in environment, but explicit role says it is inaccessible and paths are candidate-relative. |
| Verification/ground | Snapshot evidence required; concern ground must name a file read with `snapshot_read` in this review. Declared checks/config pointers are inspection context and cannot be run. |
| Submission | Named available `submit_review`; `inspected`, `missing`, `concerns` schema; every changed path once, delivered full patches count as inspection. Empty concerns/missing is expressly a valid review. |

The inherited selected plan package is **byte-identical** to the current `assignment-package` addition, but current packet deliberately reasserts the frozen intent. The prior failed assignment attempt is historical; the accepted second submission is the definitive assignment. No evidence after that source checkpoint was inherited.

## Findings and potential improvements

### No functional adequacy defect found

The procedure says “Fetch patches with snapshot_diff only for paths whose complete patches were not supplied.” No `snapshot_diff` is called. The five `snapshot_read` calls inspect the plan and current complete production/unit/step/feature files. This supplies unchanged label/status context and candidate-bound evidence, rather than treating historical local reads as the candidate. The new step file is also complete in the delivered patch; its reread is optional additional grounding, not a contract violation. Its **2,357 returned bytes** should not automatically be labeled waste when the reviewer is allowed to inspect whole candidate files and needs snapshot-ground reads for any concern it might raise.

The feature patch could appear to contradict “Do not edit the generated feature file.” The current task explicitly warns “The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden” and supplies producer/binding provenance. The scope reviewer sees the exact audited removal and reports no concern. Provenance avoids confusing the harness's permitted mutation with an engineer edit; no causal comparison is available to prove the attribution text changed the judgment.

### Low: heavy inherited local exploration is weakly relevant to this frozen scope review

Affected ID `inv-0009`, first native input items 0–86. Inherited user messages contain **15,968 bytes** of orientation task, **2,798 bytes** of selected plan elements and **11,110 bytes** of assignment task. Historical tool outputs total **40,108 UTF-8 bytes** measured from native `function_call_output.output` strings. This includes view dumps/metadata/listings, corrected path errors, runner configuration and world inspection, orientation acceptance and assignment error/acceptance. Relevant accepted assignment/source constraints must remain available, but most raw discovery history is not evidence of the frozen candidate and current role explicitly says so.

Observed effect: no confusion, reuse of historical live tools or wrong snapshot path occurs. The full history is present and may contribute to cache reuse; its cost is not equivalent to fresh uncached input. First child usage actually records cacheRead **25,984**, new input **7,473**, output **214**. Therefore a shorter fresh reviewer prompt cannot be claimed cheaper without a measured cache-adjusted comparison.

Potential improvement: compare the preserved parent-history fork against a review-specific retained context containing accepted assignment, complete source requirements/constraints, snapshot identity, diff and relevant deliberation. Do this as an explicit later experiment rather than silently changing the selected run or starting a new paid trial. Measure first-post-fork provider prefix, cache reads/new input/charge and review fidelity. Removing old error/search/config output might help relevance but could damage prefix reuse, so severity is low and no realized saving is claimed.

### Low: current task adds duplicated package and numerous generic briefing removals

Affected ID `inv-0009`, correlation `packet.additions`. Current selected-element package is **2,798 bytes**, equal to inherited user input item 77. Twelve “Current briefing update … no longer applies” fragments total **1,090 bytes**. Current role/schema/snapshot-task already supersede earlier work-item/module/placement/assignment support; individually named removals are useful provenance but their internal support keys are less readable than a single current-state statement.

Potential correction: retain current complete frozen intent unless byte-identical inheritance is explicitly and reliably referenced, and condense support-key removals into one clear statement that the current scope-review intent, candidate and snapshot tool scope govern this turn. Keep provenance in the manifest outside model text. This must preserve source-point availability and source-authority semantics; an earlier conversation after assignment cannot alter review intent. No observed error is attributable to these markers or duplication; estimate is removal ceiling, not demonstrated cost.

### Low: repeated producer metadata can be grouped without hiding the feature patch

Affected ID `inv-0009`, `brief:support:## Candidate test pointers:0`, **953 bytes**. Two separate attribution lines repeat the same feature path, 64-byte candidate hash, invocation and 64-byte producer submission hash for `sc-001` and `sc-002`. Both scenarios share those facts. A single producer record listing both scenario IDs would retain provenance and the complete supplied patch while avoiding duplication. It should preserve the distinction between harness-generated tag binding and architect completion reporting.

### Low: generic environment contains unrelated orchestration limits

Affected ID `inv-0009`, `environment`, **1,772 bytes**. Full repair/fork/reconstruction/work-item/deviation/command limits and harness source support paths do not help a snapshot-only scope reviewer. Retain candidate/tree, project-relative convention, active tools, relevant submission/error limits and time/budget information; no shell command exists here. The current limits are not a task blocker, and cache behavior should be measured before treating trimming as a cost correction.

## Observed sequence and outcome

Scope review begins 18:15:31.202Z. It reads candidate plan (n=3–4, **1,851 bytes**), component (n=5–6, **1,669 bytes**), unit tests (n=7–8, **1,810 bytes**), steps (n=9–10, **2,357 bytes**), and generated feature (n=11–12, **1,083 bytes**). Total snapshot output is **8,770 bytes**, five unique source files; no search/list/diff reacquisition, no tool errors. At 18:16:00.713Z it submits the four changed paths with `missing=[]`, `concerns=[]`; accepted at 18:16:00.730Z. Outcome is `submitted`, `applied`, zero rejected submissions, no outside-scope writes, **29,619 ms** elapsed.

This is a scope review with no reported concern. It neither independently executes the gate nor establishes the later local architect's semantic completion. No generated-view discovery or foreign-interface lookup happens in the reviewer turn; inherited local view reads are not new reviewer discovery calls.

## Evidence limits

The native first request confirms effective preserved system/tool prefix and appended reviewer/tool transition, so display-transcript omission of additional declarations does not leave tool availability unknown. Historical reasoning contains retained summaries plus opaque encrypted content; it should not be classified as readable irrelevant prose or approximated with character-based token estimates. Provider internal cache decisions and a counterfactual shorter-context result remain unknown. All expected scope instances assigned here were covered; no blocking prompt issue or observed submission/tool contract failure was found.
