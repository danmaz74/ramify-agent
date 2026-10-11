# Independent prompt review: local orientation

Covered **inv-0004**, the single assigned local orientation instance in run `20261009T181051Z-4c5bfc`, role `local-architect`, work item `wi-001`, operation `inv-0004`, harness session `ses-0004`, pi session `70485831-d2c2-4d02-a701-ec3aaaa80da1`. Requested and actual mode were fresh; correlation source is null and the first native request contains exactly one user task. No prior postmortem was consulted.

The prompt provided the information and tools needed for orientation and the first submission was accepted. The agent correctly established existing component behavior, its owner/exposure, the relevant foreign type, configured scenario loading, and the distinction between readable tone markup and optional styling work. Four tool errors and two zero-match package lookups were recoverable exploration inefficiencies. The main prompt opportunity is more explicit guidance about absent API directories and package scope, plus deferral of assignment-only context.

## Raw evidence and exact delivery

Evidence root P is `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/`; job J is P + `status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/`.

- P `.harness/session-operations/correlations/operations/c1838f43bb02199e6cfadc357be858b80b291e2384c77eb07f3557a2c06713e7.json`: delivered role, message, additions, declarations and policy.
- P `.harness/session-operations/store/payloads/28524cfecc4ebf8d602976dbba1ba441f846fdf2075fe336e4f734eb8afe1fdd`: first provider request; exact current task, matching system text, ordered tools `read`, `grep`, `ls`, `submit_work_orientation`. Last request P `.harness/session-operations/store/payloads/89432d9c66b437db610f412d85e03d18fcc793ff9b0d3ccfb2781673a11301c9` contains this invocation's accumulated history. No later continuation was used to assess delivery.
- J `transcripts/ses-0004.jsonl`, invocation-filtered records n=1–46; later records in that same session belong to other kinds and are excluded.
- J `invocations/inv-0004/{invocation.json,submission.json,outcome.json,observations.jsonl}`.
- J `blobs/b40dda9b2e1fbb25ab1f4d3f6bffccbe3f328eef808cee654acc23819ab0f4d2` and `blobs/b1afbac2fd7c33f1b49f01e0ede7b73b118aaf9888d84d491592a264982430fe`: full returned ordinary/testing API grep outputs, respectively.
- J `input/plan.md`: captured goals/constraints. The orientation prompt explicitly defers non-functional/fixed/recommendation selection until the next turn; their absence at this point is intentional, not a missing prerequisite for assignment (assignment is forbidden here).

Delivered role text is **3,796 UTF-8 bytes**, current message **15,968 bytes**, and retained submission declaration **537 bytes**. These are measured string bytes; addition fragments describe existing delivery surfaces and are not another copy to add to totals. Native submission parameters are generic object fields, with the exact schema in the description; the validator requires `focus`, `currentUnderstanding`, and `questions` and matches the described contract. No schema mismatch was observed.

## Required information at delivery

| Need | Assessment |
| --- | --- |
| Objective | Direct tone goal, three functional requirements, two acceptance elements, context and both complete scenarios; extract focus/understanding/questions only. |
| Authority/scope | Read-only role, no shell/write tools; current procedure explicitly forbids organization/assignment. Later engineer scope is supplied for context, without making this role a writer. |
| Current state/dependencies | Known shared-ui owner, onboarding, supplied tentative hypothesis, capability registry, feature/step pointers, scenario pending state, and correct absolute declaration/source/test locations. Existing implementation/test details are intentionally obtainable with `read`. |
| Execution location | Exact module `src/` cwd and project root; structured paths remain project-relative. Relative README/declaration instructions work; root-config absolute paths are supplied. |
| Foreign/global discovery | Independent ordinary and testing API paths, revision, limits, and conditional global architect lookup. `read`/`grep`/`ls` can access these paths; no denied access is observed. |
| Verification expectations | Declared runner/config pointers and scenario semantics; passing audit is evidence and local architect reports completion. Orientation itself runs no tests and needs no implementation acceptance. |
| Submission | Named available tool; three-field schema; accepted submission is the completion condition. First submission satisfies it. |

## Discovery inventory and effectiveness

Denominator **34** exploratory tool calls, excluding the one submission call. Classify by actual target; this is a full exploration-target inventory, not a claim that every call is architecture discovery. `module.ramify` is declaration/documentation, not an API view despite its suffix. The root TypeScript grep targets runner configuration and is classified other/configuration; it returns many source test import lines incidentally, not an architecture survey. Source calls are two own-component/test reads, foreign runner-world grep/read, and stylesheet grep. No mixed-target call or unresolvable call exists.

| Target class | Calls/share | Returned bytes | Tool-duration sum | Errors |
| --- | ---: | ---: | ---: | ---: |
| Architect view | 1 / 2.9% | 1,517 | 177 ms | 0 |
| Consumer API views | 14 / 41.2% | 19,846 | 1,992 ms | 2 |
| Direct source/tests/styles | 5 / 14.7% | 7,517 | 681 ms | 0 |
| Other onboarding/declarations/configuration/listing | 14 / 41.2% | 10,860 | 2,017 ms | 2 |
| Mixed / unknown | 0 / 0% | 0 | 0 | 0 |
| Total | 34 / 100% | 39,740 | 4,867 ms | 4 |

Tool-duration sums are observation subtotals, not elapsed wall time. Calls occur in batches and these sums must not be added to model time as though serial. There are 29 unique requested target strings after resolving relative-path identity (the incorrect root reads are separate attempted targets); ten grep calls; no exact repeated `(resolved path, pattern, glob)` query. Repeated target use reflects listing/searching the ordinary external directory twice, testing external directory four times, and the project root twice for different globs. Returned bytes include error text and limits, not scanned bytes.

For the stricter **project-wide architecture-discovery** denominator, there is **one** explicit episode/call: n=31/36 searches `StatusBadge` in the supplied architect directory to confirm exposure, re-exposure and consumers. That denominator is architect **1/1 (100%)**, API/source/other/mixed/unknown **0/1**. It is view-first, with no foreign-source fallback. Local README/declaration/source orientation is not counted as global rediscovery because this task starts with an assigned owner and explicitly requires those reads. Later world/style inspection addresses concrete test/runtime and presentation details, not module placement. Do not use 2.9% from the all-exploration table as the architecture view-use percentage.

Separately, consumer-interface discovery has four episodes: ordinary existing `ReviewStatus`, testing application interfaces, and two third-party dependency questions. Including navigation and metadata yields the 14 API calls above; considering just content queries yields six API grep calls (two broad application dumps, two nonexistent children queries, two package queries). The application capability relevant to the component is confirmed in the ordinary area, and the submission applies that information: “The ordinary API view confirms the existing ReviewStatus interface is available from contracts.” No new foreign API import or capability request occurs in orientation; successful implementation use is therefore unverified at this point.

Actual view availability is established by prompt and tool results, not `scope.size`: ordinary and testing `_meta.json` reads report revision `rev/1:4355a82f-aea4-4c86-8563-04c0548fa97b:2` and limits 1 and 2. Architect prompt declares revision `...:1` and `cut: 11`, `detailsUnavailable: 4`; architect grep succeeds. Listing reveals only `_meta.json` and `external/`, so no `children/` directory is available. API absence does not prove missing capability under these limits. The architect result exposes `StatusBadge`, `StatusBadgeProps`, re-exposure via workspace and two feature consumers. Its long behavior line is truncated to 500 chars, but these facts are visible and sufficient for the observed cross-owner relationship check; exact placement correctness still belongs to the architect's judgment.

## Findings and improvements

### Medium: scope-size metadata does not describe the views this local architect actually receives

Affected ID `inv-0004`, J `invocation.json.scope.size.components`. Metadata reports API views as measured 0 with “no API-view area is declared” and architect view as measured 0 with “the role's profile does not include the global view.” Delivery explicitly provides ordinary/testing paths, conditional global access and view identities, and actual API and global reads succeed.

Observed mismatch concerns metric interpretation, not denied tool access. API reads return 19,846 bytes and global lookup returns 1,517 bytes. Those values are returned-output bytes, so they are not replacement scope-size measurements. Correction direction: align local-architect scope attribution with actually delivered/permitted views, or mark them unmeasured/unknown rather than asserting measured-zero availability. Confidence high. Validate against a local-architect run with known retained view snapshots; preserve separate size and exploration metrics.

### Low: view instructions omit directory-presence and dependency-scope guidance

Affected ID `inv-0004`, delivered role “search `.ramify/external` and `.ramify/children` … tests …”, transcript n=24–28 and n=37–41. Role also says “Use those paths only” and preserve unavailable/incomplete details, but the brief names the base views without child-directory availability. The agent first lists both views and sees only `external/`, yet then probes both `children/` paths and receives two “Path not found” errors (**322 returned bytes total**). This was avoidable based on already returned listings; the prompt did not demand nonexistent paths be queried.

The agent later searches testing application API docs for `@cucumber/cucumber` and `react-dom/server`; both return “No matches found” (**32 bytes total**). These third-party packages are outside the application API catalog's scope, so the misses cannot establish dependency unavailability. The component's existing test and package configuration already supply React server-rendering evidence.

Potential correction: state that external/children directories should be searched only when supplied or present, and that API external docs cover foreign project owners, not package or built-in dependencies. Supply exact available category paths at briefing time when cheap. Observed impact is four unnecessary calls, two errors and two misses; no ensuing failure. This is a modest prompt improvement plus an agent discovery choice, not a blocked task.

### Low: blanket API dumps overwhelm a focused foreign-interface question

Affected ID `inv-0004`, transcript n=24–26 and the two API blobs. Agent uses `pattern="."`, limit 100 in both independent API areas; outputs are **9,627 and 9,460 bytes**, both capped at 100 matches. Ordinary output includes many unrelated Finding/Record/Revision details and testing output includes catalog fixture details. Each output contains the relevant `ReviewStatus` four-line signature fragment, measured at **360 bytes** including grep path prefixes; the submitted understanding correctly uses ordinary-area evidence and preserves the two coverage limits. The separate testing area was not combined to establish ordinary importability.

Observed impact: 19,087 returned bytes, truncation and general interface-survey overhead. A narrower `ReviewStatus|reviewStatusSchema` query followed by matching-page reads would retain the relevant type and companion definition; 18,367 bytes outside the two 360-byte fragments is an upper-bound excess relative to those fragments, not a measured removable amount because companion documentation and a testing survey can still help. Do not remove all API discovery. The procedure already says “for needed foreign interfaces,” so this finding primarily concerns query selection, with a potential prompt example improving it. No wrong type/value use or capability request follows.

### Low: correct absolute root pointers were bypassed by brittle relative traversal

Affected ID `inv-0004`, transcript n=3,10,11,13,20,21. Although project-root package/cucumber absolute pointers are supplied, the agent initially reads `../../../../../../package.json` and `.../cucumber.js`, escaping one directory beyond `collection-review`. Both fail ENOENT (**259 error bytes**). It recognizes the depth error, removes one `../`, and both corrected reads succeed. Correct project/cwd information was available at delivery; the omission is not the cause. Prefer supplied absolute paths for project-level config, retaining short `../README.md` and same-owner source paths where naturally correct. Two errors add recovery work, but no rejected submission or wrong configuration claim follows.

### Low: orientation includes context reserved for later assignment

The task says “Submit only your orientation … Do not assign an iteration,” and the procedure states non-functional/fixed/recommendation elements “will be selected next.” Nevertheless, message fragments include **662 bytes** of full engineer default write-scope/inclusion rules, **309 bytes** of engineer limit-raising rules, and **155 bytes** of undecided placement context. These support later assignment; orientation can retain a short owner/write-boundary summary instead. The whole current environment is **2,667 bytes** and repeats many global run/repair/assignment limits irrelevant to this read-only turn. Module/test pointers repeat paths already given in the **2,117-byte** module section, with another **1,173-byte** module-pointer section.

Potential correction: preserve objective, complete elements/scenarios, tentative hypothesis, owner and source/test/API pointers, runner configuration and orientation submission, while deferring engineer bounds/inclusion mechanics until organization/assignment. The removable mechanics upper-bound is **1,126 bytes**, less the owner-boundary summary replacement. Avoid dropping check configuration: it helped identify Cucumber/Vitest behavior. Cache retention may make a shared role prefix useful; raw bytes alone do not establish provider cost. No observed orientation-to-assignment authority breach occurred.

## Outcome and limits

At 18:12:24.689Z orientation starts. Five exploration batches run at n=3,13,24,31,37; the final n=42 submission is accepted at 18:13:09.984Z. Outcome is `submitted`, `applied`, zero rejected submissions, no outside-scope writes, and **45,370 ms** elapsed. The submission names the proposed minimal optional literal-union prop/default/attribute, existing static-markup tests, configured pending-scenario exclusion and required bindings, and keeps `questions=[]`. This verifies the orientation handback and its use of source/API evidence; it does not verify tests, final plan completion or the causal value of a shorter prompt.

The observation stream retains tool durations and returned bytes but search scanned bytes/matched file identities are unknown. The exact source pages are captured through read results and API output blobs; full historical view snapshots are not required to verify the listed accesses, but limits prevent absence claims. There is no continuation/fork boundary in this invocation. No blocking adequacy issue was found; observed exploration mistakes have been separated from prompt omissions and from metadata defects.
