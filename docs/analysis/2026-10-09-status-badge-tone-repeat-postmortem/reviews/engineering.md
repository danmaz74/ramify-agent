# Engineering prompt and capability-use review

The engineer implemented the assigned prop/rendering change, preserved existing tests, added scenario-local bindings, ran checks and submitted an accepted completion proposal without rejection. The exact generated focused Cucumber command was useful: it enabled the two assigned pending scenarios while preserving configured support loading. The observed discovery friction was searching application API views for third-party/built-in APIs, followed by looking for unpromised generated metadata files and a foreign step-example search. There was no incorrect new application import or unresolved application capability request.

## Coverage and exact delivery

Only observed engineering instance: `inv-0007`, `wi-001.i01`, run `20261009T181051Z-4c5bfc`, session `ses-0006` / `3ebb8458-cf33-4b79-8e7c-b4b9f50cb18b`, turn 1. Requested and actual start are fresh; no local-architect/orientation history is inherited. Base accepted boundary: `564534ea8e482a1d65b77a247f80577ff5d540d8`.

Evidence abbreviations:

- `J`: project-relative `plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/` under `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review`.
- `T`: `J/transcripts/ses-0006.jsonl`, cited by JSONL line.
- `S`: `J/blobs/c5c9b67a6e266110f5fbe6b75ee0665da9f7539e1a2258c9f96d88897b217e32`, 9,543-byte delivered engineer instructions.
- `M`: `J/blobs/e2ed335300dc198c7787eb3e815df54af27e8598a7b6df13a50ec33fa71cd9cb`, 21,351-byte task. Line references also match derived `invocations/inv-0007/task.md` in this postmortem.
- `P`: project-relative `plans/.harness/session-operations/correlations/operations/aec4abedc954cbfd35d144cc08465252381d1fe5f13bb89b265a442136bb9582.json`.
- `N`: project-relative `plans/.harness/session-operations/store/payloads/dc659be56995abb958c1fd27955a40bde83a0641ada1929d9b6f8a02ee5cfb8b`, first native request.

`N.instructions` equals `P.packet.roleInstructions` and the transcript system blob; its sole user input equals the current task message exactly. Seven native tools are `read`, `grep`, `ls`, `edit`, `write`, `shell`, `submit_iteration_result`; their compact-JSON UTF-8 array is 8,909 bytes. The submission declaration description is 3,439 bytes and carries the full result schema. There are nine model requests. These are captured effective request facts, not current-template reconstruction.

## Required-information assessment

| Need | Delivery and usability |
| --- | --- |
| Objective and concrete approach | `M:3–13` states four-value optional prop, neutral default, data-tone, preserved status/label/callers, static-markup tests and real-component scenario bindings. |
| Accepted plan constraints | `M:120–212` supplies all ten cited elements, including shared presentation ownership, unchanged callers/semantics and test expectations. Captured full documents are intentionally not for engineer reading; selected package is complete for this task. |
| Execution location | `M:19` gives exact module `src/` cwd. Relative tool paths and root paths are distinguished; the engineer correctly reads local files and uses root cwd for checks. |
| Write authority | `M:22–27` gives only shared-ui subtree; no child/nested/guarded permission. Feature files are explicitly harness-owned. Three production/test/step writes stay within the assigned owner. |
| Import authority and historical API identity | Ordinary/testing view paths and revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:4`, with one/two coverage limits, are direct in `M:29–36`. Consuming areas are correctly separated in instructions. Relevant historical results are retained, but complete metadata/pages are not read. |
| Starting state | Accepted boundary pointer and instruction to inspect current files in `M:105–111`; `T:11–13` supplies source, two existing tests and both pending feature scenarios. No inherited orientation is required. |
| Checks and runner configuration | Declared checks/config pointers in `M:215–227`; exact focused scenario command/config identity in `M:113–119`. Root package and Cucumber config are successfully read in `T:8–9`. |
| Completion contract | `M:54–65` names both obligation IDs and fake arrays; binding is distinct from architect done judgment. Exact tool schema supports completion-proposed, partial and capability-needed. `T:44` binds both IDs with no fakes and recommends the gate. |

No required task constraint, location, scope or submission schema was missing. No unresolved placeholder, current tool mismatch or rejected submission occurred. The ordinary/testing/API instructions would benefit from an explicit external-package scope sentence, described below.

## Actual work and verification

`T:28–36` records edits adding the exact optional tone union, destructuring default `tone = 'neutral'`, `data-tone`, two additive unit tests and one 65-line local TSX step file. Existing status/label logic and the original unit tests remain. The step file imports `StatusBadge` from its own owner, renders it via react-dom/server and uses a WeakMap keyed by Cucumber's scenario World object. It does not import foreign application code or change feature files/configuration. Post-write boundary checks pass for all three writes; at-completion complete-scope check passes in `T:45`.

`T:37,41–43` records three executed checks:

- `npm test -- subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx`: one Vitest file, four tests passed, exit 0.
- `npm run type-check`: project script `tsc --noEmit -p tsconfig.json`, exit 0.
- Exact supplied generated `cucumber-js --config ... --profile ramify-focused`: two scenarios, nine steps and two hooks passed, exit 0.

`T:44–48` accepts the completion proposal with both no-fake bindings. The response explicitly says the iteration gate owns the verdict and a commit alone is not acceptance. This review establishes engineer work/check evidence and accepted handback proposal; later gate verdict and local architect semantic acceptance are separate run events.

## Foreign application capability inventory

Define a need by consumer source area and foreign application interface actually required/considered. Count unchanged foreign dependencies as retained needs, separately from newly introduced foreign needs. External npm packages, built-ins and same-owner calls are outside this application denominator.

New foreign application behavior/interface needs: **0**. Retained foreign application interface needs: **1**, the production `ReviewStatus` type from contracts. No failed/unresolved application capability request is hidden by this distinction.

| Need | Supplied | Consulted | Applied | Verified / outcome |
| --- | --- | --- | --- | --- |
| Production shared-ui `StatusBadgeProps.status` and default label map use contracts `ReviewStatus` | Ordinary API path/revision/limits supplied; existing exact import visible in `T:11` | `T:10,16` searches ordinary `.ramify` for `React`, yielding no relevant information. `T:23,26` finds ReviewStatus's type-only entry/signature in **testing** view. No relevant ordinary API page is read. | Existing `import type { ReviewStatus } from '../../contracts/src/interfaces/vocabulary.js'` is preserved by the edit; no new application import is added. | Mutation/complete Ramify boundary checks and TypeScript check pass. Ordinary-view informational provenance remains unknown; testing-view entry cannot establish ordinary importability. |

For the one retained need: ordinary-view-supported use 0; additional provider-source discovery 0; evidenced incorrect use 0; unresolved need 0; unknown relevant ordinary-view provenance 1. Existing applied use 1 and automated verification 1 overlap with the unknown provenance category, rather than partitioning it. Counterpart testing-view information consulted 1. Do not turn this into a 0% successful-view rating for new API work: the new-need denominator is zero and the foreign import already existed.

The actual testing view response `T:26` identifies `subs/workspace/subs/contracts/src/interfaces/vocabulary.ts.md`, `ReviewStatus [type-only]`, `type ReviewStatus = z.infer<typeof reviewStatusSchema>`. It gives a usable type name and real source-file provenance, but the supporting schema detail/literal domain is not included in that excerpt. The engineer did not need to alter the status type. There is no guessed foreign API, value use of a type-only symbol or capability request for existing behavior.

`StatusBadge` calls from unit tests and new steps are same-owner calls and are not foreign needs. The lookup of `StatusBadge` in testing-view search text returns only ReviewStatus; that result is not evidence the local symbol is unavailable. The grep of integration-tests source is example inspection, described below, and leads to no application import or application capability delegation.

## Package/built-in inquiries and view friction

Separate inquiry inventory, including attempts not adopted:

| Inquiry | Observed lookup and outcome |
| --- | --- |
| React/ReactElement for component and steps | Ordinary `.ramify` search for `React`, `T:10,16`, no matches. Existing local production code supplies established ReactElement import; root package declares react and its types. Preserved/additional package type use passes checks. |
| react-dom/server `renderToStaticMarkup` | Testing `.ramify` search alongside step/assert names, then testing external-view package-name query, `T:10,15,17,20`, no matches. Existing local unit file and package manifest establish installed/used package pattern; new steps import it directly and render successfully. |
| @cucumber/cucumber Given/When/Then and scenario state | Same failed testing-view searches. Config/package reads identify real runner/loading; foreign integration source grep `T:23,27` returns registered-step examples. Engineer imports package functions and uses local WeakMap state, with two scenario/hook checks passing. |
| node:assert/assert, considered but not adopted | Testing view queries include `assert` and `node:assert` with no results. New steps use local explicit Error checks instead; there is no unresolved missing package capability. |

These dependencies are outside materialized **application** API-view scope. Their zero matches do not mean a view is incomplete or a required owner failed to expose them. Package availability is established from the root package and existing code, not the architect view. Package signatures were not obtained from retained package documentation; successful compile/runtime checks support the actual uses, and the record does not show any corresponding wrong-call error.

### Low: external dependency scope is implicit, coinciding with repeated out-of-scope searches

Affected kind/ID: engineering, inv-0007. `S:80` requires “Search your module's API view before opening foreign source or proposing a new cross-module interface.” `M:36` says “A symbol you need that is not there is reported with capability-needed ... it is never imported anyway.” In context these instructions concern other Ramify modules, but no direct sentence says npm packages/built-ins are outside the view catalog.

Observed sequence: three zero-match API searches look for package/runner/built-in names (`T:10,15–16`, `T:17,20`); the engineer then lists deeper generated directories, probes absent metadata/children, and reads foreign integration step examples before implementing. Correlation supports clearer routing, not proof that the instruction caused every lookup. No mistaken capability-needed submission or incorrect package import results.

Correction direction: add “These views cover foreign application modules; use package configuration/documentation or an established local usage for npm packages and built-ins. Missing package entries are expected and do not require capability-needed.” Keep the strict application import/exposure rules. Give a focused step-pattern pointer only when configuration-specific World behavior is needed; a broad foreign scenario survey is unnecessary for these standalone component scenarios.

### Low: probing unpromised API metadata paths produces avoidable errors

`T:17,19,21` probes `tests/.ramify/children` (164-byte path-not-found) and `tests/.ramify/README.md` (193-byte ENOENT). No README was promised; the later `T:24` listing confirms `_meta.json` and `external/`, while no children exist. The role explicitly instructs preserving unavailable evidence instead of searching missing metadata. A separate `tests/steps` lookup returns path-not-found (153 bytes), consistent with the task's stated “observed files: (none)” and a directory that needs creation; that is normal starting-state inspection rather than a materialized-view defect.

Correction direction: when no children exist, permit skipping the children lookup, and identify `_meta.json` as the actual metadata entrypoint. A single initial view-directory listing can avoid invented README reads. Historical ordinary/testing coverage-limit content was not inspected here; current metadata must not be used to fill that gap.

### Low: the TypeScript check is inaccurately labeled focused

The engineer's `T:44` finding says “Focused TypeScript type-check passed.” Actual `T:37,42` executes `npm run type-check`, whose script in `T:8` is `tsc --noEmit -p tsconfig.json`, with no file selection. The command succeeds, so this is evidence-labeling inaccuracy, not failed verification. Correction: label it the project TypeScript check; reserve focused for the file-selected Vitest and generated Cucumber profile.

## Prompt excess candidates and byte measurements

Sizes are captured UTF-8 bytes, including line endings; no characters-to-tokens conversion or cost/speed improvement is inferred.

| Candidate | Bytes | Proposed narrower selection |
| --- | ---: | --- |
| Duplicate serialized cucumberConfiguration, `M:347` | 2,643 | The executable command, support patterns and config identity are already supplied in the 1,410-byte `M:113–119` block. Retain details agents need to execute/reason, with a config pointer for the complete provenance/source hashes. The full internal JSON is not needed for this engineer's product decision. |
| Repeated module/test/scenario pointers, `M:229–241` | 1,683 | Much duplicates earlier cwd/write/import/scenario pointers. Preserve exact cwd and source-area separation plus feature prohibition; replace repeated absolute paths with one clearly rooted module pointer. |
| Global environment limits, approximately `M:281–310` | 1,004 | Most concern future run orchestration unavailable to this engineer. Keep relevant command/idle/absolute and rejection limits rather than the global object. This measured slice includes a few surrounding environment fields, so it is an upper candidate slice rather than pure limit bytes. |

Declared project checks (1,528 bytes, `M:215–227`) were relevant because the fresh engineer inspected scripts/config before checks; no wholesale removal is recommended. The exact scenario command and pending-filter explanation should be retained: the engineer follows that command successfully and avoids the zero-scenario default-profile trap. General import/schema/guard authority remains required even when no violation occurs. No inherited-history excess exists in this fresh invocation.

## Discovery classifications and metric limits

This engineer performs local implementation onboarding and package/runner example inspection, not an architect owner-placement investigation. No architect architecture-discovery episode denominator applies to this role. For the application's retained dependency, ordinary and testing API consultations are distinguished above.

Actual API-target exploration: 10 calls, nine testing-view targets and one ordinary-view target, 2,190 returned bytes. These include directory listing and failed metadata probes as well as four grep queries; they are not ten successful capability consultations. Foreign source example search: one grep, 5,136 returned bytes. No architect-view call occurs. The projection records eight reads (seven unique successfully read files), 13 search operations including listings, one outside-scope search, and 14,787 returned exploration bytes. The transcript resolves API/direct-source paths even where coarse observations lack matched-file identities. Returned bytes are not scanned bytes; truncated/semantic zero matches do not prove absence.

Recorded elapsed 75,912 ms; first engineering mutation milestone approximately 31,630 ms after invocation start. Recorded usage: new input 17,934, output 2,923, cacheRead 99,712, cacheWrite 0, total 120,569. This fresh invocation has no continuation/fork first-call boundary; subsequent tool-turn cache reads are separate. Model and tool subtotals overlap/concurrency and must not be added as wall time. Shell exploration observations flag missing scanned-byte/file identities and broad mutation coverage limits; the actual three shell calls here are verifiable test/compiler commands, not source-edit commands.

All observed foreign application needs and attempted package inquiries are covered. Historical full API metadata/content was not read by this invocation and is not reconstructed from today's generated files. No new trial, test rerun, implementation edit or run-record change was performed for this review. Later gate acceptance and responsible semantic completion remain outside this delegated engineer analysis.
