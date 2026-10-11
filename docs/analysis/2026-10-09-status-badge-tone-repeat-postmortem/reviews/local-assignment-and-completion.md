# Local assignment and completion prompt review

Both observed `assignment` instances completed with accepted submissions. The first assigned a cohesive shared-ui implementation after repairing one schema mistake; the second inspected the accepted change and reported both scenarios done before requesting completion. Required behavior, constraints and current tools were present in the delivered native histories. No new ownership/API discovery was needed during either invocation.

## Coverage and evidence

Run `20261009T181051Z-4c5bfc`; project `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`; work item `wi-001`, registered entry `render-toned-status-badge`, owner `collection-review/workspace/shared-ui`.

| Kind / phase | Invocation | Session and turn | Source point | Result |
| --- | --- | --- | --- | --- |
| assignment / first implementation assignment | inv-0006 | ses-0004; 70485831-d2c2-4d02-a701-ec3aaaa80da1; turn 2 | checkpoint turn 1, 4d99ce9e-d716-4e95-ba3c-ac356a5905f4; orientation inv-0004 | continued, applied; one rejection then accepted |
| assignment / post-iteration completion | inv-0010 | same session; turn 3 | checkpoint turn 2, 9d7d355d-beb0-4a93-ac47-5d4f0e86e0e7; inv-0006 | continued, applied; accepted first attempt |

Raw evidence abbreviations:

- `J`: project-relative `plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.
- `T`: `J/transcripts/ses-0004.jsonl`, cited by JSONL line.
- `P6`: project-relative `plans/.harness/session-operations/correlations/operations/93e9c46287cbe85a063e83ee38559429bec7e290d66f77e14bf71d5eaa45fc3b.json`.
- `N6`: project-relative `plans/.harness/session-operations/store/payloads/51e766c3f9552bab59bc28992d79b18a95cc19af404109c224305f80aef5767d`.
- `M6`: `J/blobs/9f2627db6221ec1bf0a9c552a41f1285e5cf61436da643e45c0d071e44835280` (11,110-byte current task).
- `M10`: `J/blobs/0fdfb590e07842dbced4bc8462b77e485f8ea1470b8462c3213e9d3a61ecd785` (14,373-byte current task).
- `S`: `J/blobs/9ef890ea9f242c020c157571f92e68e4933ea189b772718dcb1a285a69aa637e`, 3,796-byte local-architect system instructions.

Derived readable copies under this postmortem's `invocations/inv-0006/` and `invocations/inv-0010/` contain `packet.json`, `task.md`, `native-first.json`. The postmortem `inventory.json` records raw correlation and native request pointers for both, including inv-0010's raw payload. Findings use captured delivery and responses rather than current templates or generated views.

## Exact native delivery and inherited points

Each `native-first.json` has the same 3,796-byte instructions as `S` and has its final user input exactly equal to the corresponding `task.md`/current-message blob. Inv-0006 has 81 ordered native input records; its current task is input[80]. Inv-0010 has 88; its current task is input[87]. The first 81 records of inv-0010 equal inv-0006's first request exactly, followed by inv-0006's two submissions and rejection/acceptance responses. This directly demonstrates history retained only through the recorded earlier turn. Engineer and review sessions are not inherited; their results enter inv-0010 through the new briefing.

Both retain orientation's original `tools` array: `read`, `grep`, `ls`, `submit_work_orientation` (2,770 compact-JSON UTF-8 bytes). Native input[78] is a developer `additional_tools` record defining `inspect_git` and `submit_work_item_result`, including its complete current schema (20,525 compact-JSON UTF-8 bytes for the record). Input[79] says `Active tools: read, grep, ls, inspect_git, submit_work_item_result. Inactive historical tools must not be called.` The actual designated result tool exists and works. Looking only at top-level `tools` would incorrectly diagnose missing current tools. The inactive orientation declaration remains as retained historical context and is never called in these two tasks.

The selected plan package is input[77], 2,798 visible UTF-8 text bytes, containing all ten selected elements: ctx-001, fr-001 through fr-005, nfr-001 through nfr-004. It is delivered before inv-0006's first request, rather than merely promised. Inv-0006 has inherited orientation's module source, tests, Cucumber/Vitest config, API metadata and reference reads. Inv-0010 inherits those plus the accepted assignment; later implementation is explicitly refreshed by current tools and the iteration result briefing.

## Required-information assessment

| Need | inv-0006 | inv-0010 |
| --- | --- | --- |
| Task goal and behavior | Complete goal and functional/context package inherited; selected non-functional package delivered before current task. | Same complete package inherited; current task summarizes accepted iteration and bound scenario behavior. |
| Constraints and preservation | Package nfr-001 through nfr-004 preserves presentation ownership, status/label, callers and existing/new tests. | Same inherited package; current source/diff can establish preservation. |
| Authority and location | `S` says read-only architect; current cwd is module `src/`; submission paths remain project-relative. | Same, with `inspect_git` read-only permission and current accepted commit pointer. |
| Scope and dependencies | Own module declaration/onboarding and no children/nested roots inherited; procedure defines base/extra/guarded rules. Entry registry already present. | Accepted assignment scope inherited; no capability request or dependency handback is present. |
| Submission schema | Complete `submit_work_item_result` declaration in input[78]. Current active-tool marker overrides historical orientation-only tool selection. | Same declaration/marker inherited; `request-completion` branch exists. |
| Obligations and revisions | Current task names sc-001/sc-002 pending revision 0 and requires assignment.obligations. | Current task names both bound revision 0, no fakes, no report; passing fixture-scenarios step locations are supplied. |
| Verification and semantic judgment | Procedure separates engineer binding, gate evidence and architect reports. Assignment may specify focused checks plus gate. | Iteration findings report passing type-check, four unit tests and two scenarios; current task also supplies gate-passed scenario locations. Architect has source/diff tools to assess these. |

No essential information was inaccessible or omitted. Relative cwd instructions and project-relative submission semantics were consistent, and the agent used each correctly. Inherited orientation contains two erroneous root-config reads and corrected reads, but these are history, not new inv-0006 or inv-0010 tool failures. No current tool/path failure occurs in either reviewed instance.

## Findings

### Low: assignment submission violates an available array schema and attempts to re-register the existing entry

Affected kind/ID: assignment, inv-0006. The exact delivered result schema in `N6.input[78]` defines `assign.properties.localDecisions.type` as `array`. `M6:37–38` says “The entry is already registered; record a local decision only for a capability not in the registry.” The inherited registry names `render-toned-status-badge` already.

Observed mismatch: first submission (`T:49`) sends `localDecisions:{"decision":[],"registry":[{"capability":"render-toned-status-badge",...}]}`. `T:50–51` rejects it with `localDecisions: Invalid input: expected array, received object`. The response supplies the expected type and remaining attempts. Next call (`T:52`) changes this to `localDecisions:[]`, removes redundant registration and is accepted (`T:53–55`). The otherwise coherent goal, bounded own-module scope, ten cited elements and both obligation IDs are retained.

Impact/confidence: high-confidence observed format error with one extra model/submission cycle; inv-0006 finishes successfully in 32,573 ms. First submission occurs at 18:13:39.327Z and acceptance at 18:13:49.911Z; this interval is approximately 10.6 seconds, including model correction and tool/validation time. It is not evidence that prompt length caused the mistake. Schema and substantive registry guidance were present, so this is not a missing-declaration defect.

Correction direction: place a concise role-specific shape example adjacent to the assignment procedure: `localDecisions: []` when the registered entry is the whole work, and `[ { decision: ..., registry: ... } ]` only for a new local decision. This makes the current semantic rule easier to apply without changing architect authority or replacing schema validation. Verify recurrence and correction rates over comparable tasks; this single repaired case cannot demonstrate an improvement.

### No completion prompt defect found

Affected kind/ID: assignment/completion, inv-0010. `M10` clearly supplies the accepted commit `40155157c0af1fa686ec5b8579755c17a6364613`, engineer findings, passing gate scenario/step mappings and current bound revision-zero obligations. The current task says the next choice is assignment or completion, while the procedure requires responsible architect reports.

Observed action: `T:59` uses `inspect_git show` with exact commit and project-relative paths, reads current production/test/step files relative to cwd, and requests status. `T:60–64` supplies the committed implementation diff, complete three files and clean status. These show the exact four-value optional prop, neutral default, data-tone and preserved label/status handling; both scenario definitions render the real StatusBadge and use scenario-local WeakMap state. The result (`T:65`) reports sc-001 and sc-002 `done`, basedOnRevision 0, then requests completion; `T:66–68` accepts it.

Adequacy is supported by accessible evidence and the correctly formed reports, not merely the acceptance verdict. The historical briefing contains configured passing gate scenario evidence and engineer claims; this reviewer does not rerun tests. Responsible semantic judgment remains the local architect's report, distinct from the passing gate and engineer completion proposal.

## Extraneous context and concrete narrowing candidates

Measurements below are UTF-8 bytes, from captured task text slices or compact JSON schema serialization. They are not provider tokens, costs or savings. Stable inherited/cacheable material can remain useful even when not consulted again.

| Candidate | Bytes | Assessment |
| --- | ---: | --- |
| Unchanged assignment procedure appended again in completion task | 6,616 | `M6` and `M10` have byte-identical `# Current procedure` sections. In inv-0010 the entire earlier section is inherited. A delta could name unchanged procedure/version and preserve the new obligation/result state. Keep explicit current completion requirements if necessary. |
| Scope-construction detail within completion task | 2,484 | `M10:95–135` restates existing-entry and scope rules despite no new assignment. It remains applicable if verification finds a need for further work, so this is a candidate for reference to inherited policy, not evidence the rule is irrelevant. This slice overlaps the 6,616-byte procedure and must not be added to it. |
| Capability handoff and placement detail within completion task | 2,742 | `M10:136–178` concerns no observed active capability request or uncertain owner. Retain a compact pointer/trigger while the full earlier procedure remains inherited; preserve blocker and authority rules. Also overlaps procedure total. |
| Engineer bound reminder at completion | 309 | `M10:39–43` is already in orientation; no bound increase or new assignment is proposed. A pointer to current bounds would suffice. |
| Broad current-result union schema | 16,784 | `assign` branch 10,311 bytes, `request-placement` 2,535, `request-completion` 2,781, `unresolved` 1,085. Every branch is a legitimate possible local result, so non-use is not automatically excess. A concise selected-branch example may reduce mistakes without removing valid alternatives. |

Each new environment block (`M6:132–202`, `M10:190–260`) is 2,233 bytes, including repeated global limits, view paths and tools. Current cwd and active-tool/view identity remain relevant. No evidence shows that replacing the entire block would preserve every task need, so narrower state deltas are preferable to wholesale removal.

Inherited orientation has 15,968 bytes of first-task visible text plus recorded exploration, config results and a 2,798-byte selected package. Most directly supports assignment or assessing preservation. Some failed read/search records are no longer actionable; retaining successful corrected reads can preserve relevant context if history selection is ever used. No fresh history compaction occurred. Native input JSON sizes (119,539 bytes for inv-0006 and 148,959 for inv-0010) include encrypted reasoning and structural overhead, so they must not be presented as readable prompt text, provider input tokens or removable excess.

## Discovery and view effectiveness for these instances

New architecture-discovery episodes: inv-0006 0; inv-0010 0. Discovery calls by architect/API/direct-source/other/mixed/unknown: all 0, denominator 0; shares not applicable. Inv-0006 performs only two result submissions. Inv-0010's three local source/test/step reads and two Git inspections are detail/semantic verification of the known owner, not finding behavior or placement. Their classification must not inflate direct-source-first discovery.

Actual new read results in inv-0010 total 4,824 bytes over three distinct files (`T:61–63`), and its Git show/status results are separate. The metrics projection's read/exploration subtotal excludes inspect_git: it is not total evidence returned by every tool. There are no new consumer foreign-capability needs in these architect turns. Orientation's API metadata and interface responses are genuinely retained in both ordered native histories and may inform the assignment without new reads; they are not new billable discovery events for these invocations. No current generated-view files were inspected to prove historical availability.

## Outcome and evidence limits

| Invocation | Elapsed ms | New-input usage | Cache-read usage | Output | First request new input / cache read |
| --- | ---: | ---: | ---: | ---: | --- |
| inv-0006 | 32,573 | 10,001 | 40,960 | 1,794 | 8,641 / 16,256 |
| inv-0010 | 12,297 | 7,352 | 56,064 | 628 | 4,254 / 25,984 |

These are the run's recorded usage categories; no double counting with per-call totals is intended. Both are actual continuation boundaries, not forks. First-request cache reads show measured cache reuse alongside retained history. This review does not claim the duplication candidates are cheaper than cached history or explain every cache miss.

Coverage includes every observed instance of this delegated kind and exact inherited contexts. No source or run records were changed. Tests were not rerun, and automated gate evidence was not substituted for the architect's semantic judgment. Provider-native request capture establishes effective request instructions, tools and ordered inputs; provider-internal behavior beyond those payloads remains outside the evidence. No further correction is justified by these two prompts' completion behavior alone.
