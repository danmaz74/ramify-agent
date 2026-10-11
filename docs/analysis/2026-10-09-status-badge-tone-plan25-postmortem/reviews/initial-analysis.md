# Prompt review: initial-architect initial-analysis (inv-0002)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
`openai-codex/gpt-5.6-sol:high`, pi 0.87.1, ramify-agent 474ffa58.

## Summary

The single initial-analysis prompt (inv-0002, session ses-0002, fresh) gave the
architect what it needed: the plan text, the two extracted plan scenarios, the
accepted intake NFRs, a usable architect-view pointer with revision and coverage,
a read-only authority statement and a complete submission schema. The agent
spent 48 s and four model requests, found the owner and the existing symbol
entirely through the architect view, and submitted once; the analysis was
accepted with no warnings and the downstream work item passed every gate. The
prompt nevertheless has small defects. The dedicated plan block arrived empty
(`<plan>` followed directly by `</plan>`) because the harness passes the plan as a
requirement and then strips duplicated text from the message. About 3.4 KB of
gate and runtime fields have no use for a shell-less, read-only role, and they
coincide with three configuration-file reads that left no trace in the
submission. The view's coverage limits come only as aggregate counts, which led
to one noisy 9.6 KB grep that failed to find them. Entries that extend an
existing, consumed symbol have no structured break signal. None of these caused
a rejection, a retry or a wrong result. All 11 architecture-discovery calls
targeted the architect view, with no source, test or API-view reads.

## Coverage

| Kind | Variant | Invocation | Session | Start | Packet correlation | Native requests | Outcome |
|---|---|---|---|---|---|---|---|
| initial-architect `initial-analysis` | `procedure:initial-architect:main`, revision `initial-architect/3`, procedure SHA-256 `76bb97e1…` | inv-0002 | ses-0002 (`f8dffe0a-…`), requested fresh, actual fresh | 19:33:54.272Z | `O/correlations/operations/d503e333….json` | 4 (first `b74b5488…`, last `85bb04bb…`) | submitted, accepted first time, 0 rejected, disposition applied, session kept |

The review covers every instance of this kind in the run. I reviewed it directly from:
- The packet (`D/invocations/inv-0002/packet.json`).
- The delivered user message (`D/invocations/inv-0002/task.md`, 20,664 B, identical to the native request's input text).
- The system instructions: the native `instructions` field (6,467 chars), byte-identical to `packet.roleInstructions`.
- The four tool declarations in the native request.
- The transcript `J/transcripts/ses-0002.jsonl` with blob-resolved tool results.
- `J/invocations/inv-0002/{observations.jsonl,submission.json,outcome.json}`.
- Event 18 (`analysis-accepted`) in `J/events.jsonl`.

I compared the last native request (`85bb04bb…`) and found the same instructions, with only the session's own turns appended. It carries no inherited history and no harness-appended messages. No later invocation inherits ses-0002: no placement request occurred.

## Required information

| Need | Status | Evidence |
|---|---|---|
| Objective and task | Met directly | `# Current task: initial-analysis`, `brief:goal`, procedure block, system prompt "Your one turn is the run's initial analysis". |
| Plan text | Met directly, but confusingly placed | Full plan is inside `brief:requirements` as a list item (`- # A tone for the status badge …`). The block that announces the plan, `brief:support:# Plan "status-badge-tone":0`, is empty (Finding 1). |
| Plan scenarios with IDs and lines | Met directly | `ps-01` (lines 34–38) and `ps-02` (lines 40–43) blocks with exact Gherkin. |
| Plan constraints (NFRs) | Met directly | `brief:support:accepted-intake` lists nfr-001…nfr-004 as already recorded; procedure says not to reclassify them. |
| Authority and write scope | Met directly | "You change nothing", tools `read`, `grep`, `ls`, `submit_initial_analysis`; packet policy `writer: false`. |
| Current state (architecture) | Met by pointer | `environment:views` and "This run's evidence": `.ramify-architect/`, revision `rev/1:…:1`, input hash, coverage `cut: 11; detailsUnavailable: 4`, source commit `58ffecde…`. Coverage is aggregate only (Finding 3). |
| Discovery method | Met by pointer | Embedded module-architect skill with absolute links to its references; agent read `references/discovery.md`. Reference text assumes a shell (Finding 5). |
| Dependencies on earlier work | Not applicable | First architect invocation; intake results supplied. |
| Execution location | Met directly | `projectRoot`, `workingDirectory` and "Relative paths in your tool calls resolve against it". `supportPaths` are harness-checkout-relative and do not resolve from there (Finding 2). |
| Verification expectations | Partly extraneous for this role | Gate checks are declared, but this role runs nothing. Scenario-form rules and warning rules are stated precisely and were sufficient. |
| Expected submission | Met directly | Tool `submit_initial_analysis` with its full schema in the description; procedure lists the rejection order. Minor schema/procedure mismatches (Finding 6). |
| Guidance for an entry that extends an existing consumed symbol | Missing | Steps 12–13 apply `changesExistingSymbols` only to hypotheses. Entries have no such field (Finding 4). |

The prompt has no unresolved placeholders, no wrong cwd and no unavailable
submission tool. The agent identified the task and completed its submission
with its actual tools.

## Discovery classification

All targets are resolved from the recorded tool arguments: `requestedScope`, `resolvedScope` and `files` in the exploration observations. The cwd is the project root
`/tmp/claude-1000/-ramify/669eae14-…/scratchpad/trial/collection-review`, and every relative path resolves against it.
Both greps name `.ramify-architect` explicitly as their path, so the grep tool's
.gitignore handling did not hide the generated view: both returned view hits.

| # | Turn | Tool | Target | Class | Returned B | Tool ms |
|---|---|---|---|---|---|---|
| 1 | 1 | read | `plans/status-badge-tone/plan.md` | task input (plan), not discovery | 1,544 | 77 |
| 2 | 1 | read | `.ramify-architect/_meta.json` | architect view | 329 | 81 |
| 3 | 1 | ls | `.ramify-architect` | architect view | 106 | 85 |
| 4 | 1 | read | `/home/app/ramify-status-badge-20261009-latest/ramify-agent/skills/module-architect/references/discovery.md` (outside project root) | instructions (skill reference), not discovery | 1,855 | 90 |
| 5 | 2 | read | `.ramify-architect/README.md` | architect view | 7,983 | 111 |
| 6 | 2 | grep | `StatusBadge\|status badge\|data-status\|badge` in `.ramify-architect` | architect view | 2,794 | 117 |
| 7 | 2 | read | `.ramify-architect/workspace/shared-ui/module.json` | architect view | 1,862 | 123 |
| 8 | 2 | read | `…/shared-ui/behavior.jsonl` | architect view | 703 | 130 |
| 9 | 2 | read | `…/shared-ui/tests.jsonl` | architect view | 344 | 137 |
| 10 | 2 | read | `…/shared-ui/supporting.jsonl` | architect view | 433 | 143 |
| 11 | 3 | grep | `detailsUnavailable\|"state":"cut"\|"state": "cut"\|unknown` in `.ramify-architect` | architect view (coverage metadata) | 9,579 | 157 |
| 12 | 3 | read | `…/catalog/ui/behavior.jsonl` | architect view | 646 | 168 |
| 13 | 3 | read | `…/reviews/ui/pure-ui/behavior.jsonl` | architect view | 1,070 | 197 |
| 14 | 3 | read | `package.json` | project configuration, not discovery | 1,108 | 215 |
| 15 | 3 | read | `ramify-audit.json` | project configuration, not discovery | 2,878 | 229 |
| 16 | 3 | read | `cucumber.js` | project configuration, not discovery | 1,823 | 239 |

| Architecture-discovery class | Calls | Share of 11 discovery calls | Returned B |
|---|---|---|---|
| Architect view | 11 (9 reads, 1 ls, 2 greps; 10 unique files plus the view directory) | 100% | 25,849 |
| Consumer API view | 0 | 0% | 0 |
| Direct source/tests | 0 | 0% | 0 |
| Other documentation | 0 | 0% | 0 |
| Mixed | 0 | 0% | 0 |
| Unknown | 0 | 0% | 0 |

The invocation made 16 non-submission tool calls (13 reads, 3 searches: 2 grep, 1 ls), matching the recorded exploration metrics. They returned 35,057 B in total and took 2,299 ms of summed tool time. Calls within a turn ran concurrently. The 16 calls split as follows:
- Architect view: 11 calls, 68.8% of calls and 73.7% of returned bytes, 1,449 ms summed.
- Task input (the plan): 1 call.
- Skill reference: 1 call.
- Project configuration: 3 calls, 5,809 B.

There were no repeated reads. The coverage grep alone returned 9,579 B, which is 37% of the view bytes and 27% of all returned bytes.

| Episode | Question | Order | Result |
|---|---|---|---|
| E1 (calls 2–3, 5–10) | Does a status badge exist, who owns it, what is its signature and tests | View-first, view-only | The view answered completely. Owner `collection-review/workspace/shared-ui`, purpose naming the status badge, `StatusBadge(…)` with `data-status` doc, `StatusBadgeProps {status; label?}`, two test titles. |
| E2 (calls 12–13, from `usedBy` in call 7) | Who renders the badge, so that existing callers need not change | View-first, view-only | The view answered: `CatalogCard` (catalog/ui) and `ReviewResult` (reviews/ui/pure-ui) records. |
| E3 (call 11) | Which records are cut or have unavailable details | View-only, unresolved | The pattern did not match the view's marker; the result is mostly hits on the word "unknown" (Finding 3). |

There were 3 view-first episodes, 0 direct-source-first episodes and 0 source fallbacks after a view lookup.

The views could answer, and did answer, every architecture question this plan
raised. The agent applied the view information directly. Its entry owner is
`collection-review/workspace/shared-ui`, its citations name
`subs/workspace/subs/shared-ui/src/status-badge.tsx` with symbol `StatusBadge`
and the README path from `module.json.purpose.path`, and its citation note
mentions the "two feature UI consumers" taken from `usedBy`. The view therefore
supplied, was consulted for, and was applied to the owner decision, and the
accepted analysis and passing gates are consistent with it. E3 is the one
question left open. The post-run view marks such records per record as
`"cut":["sig"]` (9 occurrences), `"cut":["sig"` and `"cut":["doc"]`, in root, integration-tests,
workspace, contracts, reviews/ui, catalog/core and reviews/validation. None of
those modules is shared-ui, catalog/ui or pure-ui. That evidence comes from the
post-run view (revision `…:11`, input `d15dd10e…`), not the run-time view
(`…:1`, input `774561ec…`). The run-time marker shape is therefore inferred,
although the StatusBadge records the agent read at run time carried no cut
marker.

## Findings

### Finding 1: The plan block is delivered empty

Severity: low. Affects inv-0002.

The block is at `D/invocations/inv-0002/task.md`, `# Block brief:support:# Plan "status-badge-tone":0`:

```text
The plan, as `plans/status-badge-tone/plan.md` read when this run started (doc-001):

<plan>
</plan>
```

The plan text instead appears under `# Requirements` as `- # A tone for the status badge …`.
The cause is in `subs/harness/src/run/service.ts`, lines 4874–4886. `analysisMessage` embeds the plan, and `task.requirements: [plan]` delivers it separately. `taskSupportSections` (`subs/harness/src/work/task-support.ts`) then removes every separately delivered text from the message.

Expected goal: procedure step 1, "Read the plan in the message below, in full", should point at exactly one unambiguous copy of the captured plan.

Observed mismatch: the announced plan container is empty. The plan arrives as a bulleted item under a block named Requirements, with its own headings nested beneath.

Impact and confidence: the agent's first call read `plans/status-badge-tone/plan.md` from disk (1,544 B, 77 ms). That file is the live plan path, not the captured `J/input/plan.md`; the two are byte-identical in this run. Attributing this read to the empty block is likely but not proven. Step 1 also says "at its captured path", and the thinking summary ("Inspecting plan and module references") does not explain the choice. The cost was negligible here. A plan edited after the run started would let the agent analyze text other than what the harness captured. Confidence that the block is empty and why: high. Confidence that it caused the read: medium.

Correction direction: for initial-analysis, keep the plan in exactly one place.
- Either do not pass it as `requirements` (the goal already summarizes it), or exempt the `<plan>` body from deduplication.
- Alternatively, replace the empty container with "The plan is the Requirements block above".
- Where a file pointer is given, name the captured run copy, not the live plan path.

### Finding 2: Gate and runtime fields have no use for this role

Severity: low. Affects inv-0002.

Location: the `brief:support:declared-checks` block (1,664 B), which includes "the shell refuses whole suites and watch mode". The role has no shell.

Other blocks with the same problem:
- `environment:limits` (1,076 B): `budgetReturnsPerIteration`, `repairRoundsPerIteration` and similar fields.
- `environment:supportPaths` (279 B): `subs/harness/src/prompts/initial-architect.system.md` and similar paths, which are relative to the harness checkout and do not resolve from the stated working directory.
- Null `environment:candidate`, `snapshot` and `cucumberConfiguration` blocks (355 B together).

The total is about 3,374 B. That is roughly 780 provider tokens, using the ratio measured on this run's first request: 8,174 input tokens for about 35.3 KB of instructions, message and tool JSON, or about 4.3 B per token.

Expected goal: give a read-only, one-turn analyst only what it can act on.

Observed mismatch: in turn 3 the agent read `package.json`, `ramify-audit.json` and `cucumber.js` (5,809 B returned, about 0.68 s of summed tool time). These are the "Configuration/support pointer" files of the declared-checks block, apart from `ramify-agent.json`. Nothing from them appears in the submission: the scenarios are the plan's verbatim, and there are no test-related coverage limits or citations.

Impact and confidence: the reads followed directly from the pointers, so the correlation is strong, but the reasoning is only summarized and causation is unproven. The cost was small. Relevance is separate from cache cost. The session was kept as the run's architect context but never reused in this run, so these blocks bought nothing later either.

Correction direction: omit declared-checks and runtime limits from initial-analysis, or reduce them to a single line ("checks run at gates; you run nothing"). Drop `supportPaths` or make the paths absolute provenance that is clearly not a reading list. Drop the null environment blocks.

### Finding 3: Coverage limits come as counts the agent cannot locate

Severity: low. Affects inv-0002.

The delivered evidence is in the `brief:support:# This run's evidence` and `environment:views` blocks:

```text
Coverage limits the view reports: cut: 11; detailsUnavailable: 4.
```

The system prompt says: "Retain unavailable or incomplete details explicitly; do not search for missing metadata."

Expected goal: the agent should know whether the limits affect its candidate modules, since the discovery reference says "For a class or object whose signature is cut, inspect the defining source before a negative answer".

Observed mismatch: call 11 grepped the whole view for `detailsUnavailable|"state":"cut"|"state": "cut"|unknown`. The guessed marker shape does not match the view's record field: the post-run view uses `"cut":["sig"]`, so the run-time shape is inferred. The added alternative `unknown` returned 9,579 B of irrelevant hits, mostly test titles containing "unknown record" and `"unknown": 0` symbol counts. The submission's `coverageLimits` then restates the two aggregate counts generically.

Impact and confidence: there was no effect on correctness. Judging from the post-run view, no cut record was in the modules the plan touches. The grep added about 2,200 tokens to the last two requests, by the same byte-per-token approximation, and slightly contradicted the "do not search" instruction. Confidence: high on the mismatch, medium on the run-time marker shape.

Correction direction: deliver coverage per module in `environment:views` (for example `cut: 11 in root, workspace, contracts, …`), or document the per-record `cut` field in the view README. Then replace "do not search for missing metadata" with "check whether your candidate modules' records carry `cut`", so the agent can scope the limit instead of reciting it.

### Finding 4: An entry that extends an existing consumed symbol has no structured break signal

Severity: low. Affects inv-0002.

The procedure says, in step 12: "A need that extends existing behavior is a new capability … forecast it as `"create"` … Set `changesExistingSymbols` …".
Step 13 says: "Set `changesExistingSymbols` where implementing the forecast capability would change symbols that already have consumers. It is what break analysis reads later."

In the tool schema, `hypotheses[].changesExistingSymbols` is required, but `entries[]` has no equivalent field.

Expected goal: the run's later readers should learn that the entry changes `StatusBadge` and `StatusBadgeProps`, which `catalog/ui` and `reviews/ui/pure-ui` consume. nfr-003 makes this the plan's main risk.

Observed mismatch: the agent recorded no hypothesis, which is correct because there is no deeper need. The consumer fact therefore survives only as free text in a citation note: "already renders status markup for the two feature UI consumers".

Impact and confidence: no observed effect. The engineer kept the prop optional, and reviews and NFR round 1 found no concern. This is a forward risk for plans whose entry is itself an extension. Confidence: high that the gap exists, low that it mattered here.

Correction direction: let entries carry `changesExistingSymbols` (or cited changed symbols), and state in the procedure that an entry extending an existing exposed symbol records it there.

### Finding 5: Skill reference text assumes a shell, and skill links point outside the project root

Severity: low, with no observed effect. Affects inv-0002.

The adapted SKILL body says "There is no shell", but `references/discovery.md` (read in call 4) still says "Use `rg -l` or `rg -c` over `*.jsonl`" and "repeat the bounded search with shell `rg`". The skill links are absolute paths into `/home/app/ramify-status-badge-20261009-latest/ramify-agent/skills/…`, which the observation recorded as `../../../../../../../home/app/…`, outside the project root. Smaller wording issue: the template substitution reads "The project root is the project root named in the current task, your working directory" and "the designated submission tool named in the current task submits the analysis". These are usable but stilted.

Observed: the agent used the `grep` tool in place of `rg` without error, and the outside-root read succeeded.

Correction direction: adapt the reference text for read-only roles ("search with the `grep` tool"). Deliver the needed reference inline, or from a path under the project root, so the prompt does not depend on reading the harness checkout.

### Finding 6: Minor mismatches between the submission schema and the procedure

Severity: informational, with no observed effect. Affects inv-0002.

The native tool `submit_initial_analysis` declares `parameters: {"type":"object","properties":{}}` and carries the 5,763-character JSON schema only in its description. `elements[].kind` allows `non-functional`, `fixed` and `recommendation`, while the procedure says "you extract neither". `entries[].nonBehavioralAcceptance` exists in the schema but the procedure never mentions it.

Observed: the submission was accepted on the first call.

Correction direction: declare the real schema as the tool parameters if pi permits it. Narrow `elements.kind` to `functional` and `context` for this tool, or state why the others are allowed. Document `nonBehavioralAcceptance` or remove it from this schema.

### No issue found

No issue was found in these areas:
- The task identity and authority statement.
- The plan-scenario restatement rules: both scenarios were restated verbatim and accepted.
- The intake-element handoff: nfr-004, the "existing tests still pass" acceptance bullet, was correctly left out of the functional elements.
- The architect-view pointer and its revision: it resolved and was used as given, with no refresh attempt.
- The skill's reference selection: the agent loaded only `discovery.md` and correctly skipped placement and access.
- The submission contract: one call, accepted, `warnings: []`.

## Observed effects

The timeline was:
1. 19:33:54: start.
2. Turn 1 (4.1 s model time): plan, `_meta.json`, view listing and discovery reference, read in parallel.
3. Turn 2 (2.8 s): the view README, grep and the four shared-ui records.
4. Turn 3 (12.8 s): the coverage grep, two consumer behavior records and three configuration files.
5. Turn 4 (27.1 s): one `submit_initial_analysis` call, accepted at 19:34:42.

There were no clarifications, tool errors, rejected submissions or repairs. Event 18 records 1 entry, 0 hypotheses, 1 work item, 2 scenarios, no warnings and no findings.

| Prompt defect | Effect | Strength |
|---|---|---|
| Empty plan block (Finding 1) | Redundant read of the live plan file | Likely causal |
| Declared-checks pointers (Finding 2) | Three unused configuration reads | Strong correlation; thinking is summarized only |
| Aggregate-only coverage (Finding 3) | One unproductive grep and generic coverage limits | Correlated with the prompt's lack of locations and the view's undocumented marker shape |
| Findings 4–6 | None observed | — |

Total cost of all three effects:
- Returned bytes: about 16.9 KB of the 35.1 KB returned (48%).
- Tool time: well under 1 s of wall time.
- Model time: unknown. The share of the 12.8 s and 27.1 s model turns spent processing this content cannot be separated.

Usage: first request 8,174 uncached input tokens, which is expected for a fresh session. Later requests read 8,064, 9,216 and 12,672 cached tokens. Totals: input 18,230, cache read 29,952, output 2,822.

## Correction suggestions

1. Deliver the plan once for initial-analysis. Stop deduplicating it into an empty `<plan>` container, and point to the captured `input/plan.md` rather than the live path.
2. Trim role-irrelevant blocks from the initial-architect message: declared-checks, runtime limits, harness-relative `supportPaths`, and null environment fields.
3. Make view coverage actionable. Give per-module coverage locations in `environment:views` or the view README, document the `cut` field, and say to check only the candidate modules.
4. Add a structured changed-symbols signal for entries that extend an existing exposed symbol, and mention it in the procedure.
5. Adapt the module-architect references for shell-less roles, and avoid absolute links into the harness checkout.
6. Align the submission tool's declared parameters and enums with the procedure.

None of these suggestions targets view usage share. Discovery in this invocation was already view-first and view-sufficient.

## Evidence gaps

- Reasoning appears only as short summaries ("Inspecting plan and module references", "Planning owner citation additions" and similar). The reason for the configuration reads and the coverage grep is inferred, not observed.
- The run-time architect view (`rev/1:…:1`, input `774561ec…`) is not retained as files. Its content for the records the agent read is recoverable from the transcript's tool results, but the per-record `cut` marker shape and the locations of all 11 cut and 4 details-unavailable records come from the post-run view (`rev/1:…:11`, input `d15dd10e…`). That view reflects the source after the tone change.
- `detailsUnavailable` has no per-record marker in the post-run view: a grep for "unavailable" matches only `_meta.json`. Which 4 details were unavailable cannot be established from retained evidence.
- Provider tokens per block were not measured. Token figures above use the byte-per-token ratio from this invocation's first request and are approximations.
- The harness source at 474ffa58 explains the empty plan block, but the explanation is reconstruction. The delivered bytes themselves are captured (`task.md`, native request).
