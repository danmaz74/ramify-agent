# Prompt review: nonfunctional-coordinator assessment (inv-0013, ses-0011, nfa-001)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, model `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, harness
ramify-agent 5169117. Candidate cand-001: head e6356f5, tree 6074e7d4, base
0244ce2.

## Summary

The one assessment prompt gave the coordinator what it needed. It carried the
four NFRs verbatim, the read-only authority, the candidate and its named
comparisons with changed paths, the evidence rule that source analysis is
enough, and a usable submission tool. The coordinator submitted four
`satisfied` results. They were accepted on the first attempt, and round 1
closed satisfied. I compared each result with the candidate source
(`git show e6356f5:…` in the evidence copy). All four verdicts are correct,
each is grounded in files the agent read, and the line ranges cited in
`inspectedScope` match the files. The result for nfr-001 records its one
interpretive step, the pre-existing `ReviewStatus` type import, under
uncertainty. The results for nfr-003 and nfr-004 cover the two points an
earlier run's assessment left out: the new `data-tone="neutral"` attribute on
unchanged callers, which the stylesheet does not select, and whether the
existing tests were kept unchanged.

The exploration fits the task. There were 21 tool calls in three parallel
batches, 4 model requests and 59.4 s of wall time. The calls returned 37,305 B,
and 20 of the 21 back a cited `inspectedScope` entry. The 19 reads in the
metrics include 5 `snapshot_diff` calls. Three of those were per-path diffs of
unchanged caller and stylesheet files. The harness answers such a diff with an
error, and the prompt's `changedPaths` had already given the agent the same
fact. These are the run's only tool errors. The other weaknesses are low
severity and mostly recur from the 2026-10-09 run:

- About 3.3 KB of the message is environment material this snapshot-only role
  cannot use.
- The assessment procedure carries an action paragraph.
- The instruction to preserve wording has no field in the submission schema.
  The agent therefore restated each requirement as its first `evidence` item.
- The submission tool declares `parameters: {type: object}`. The model noticed
  this in its reasoning, but no rejection followed.

None of these weaknesses caused a clarification, a rejection or a wrong
verdict.

## Coverage

This is the run's only instance of this kind. There is no continuation, fork,
investigation, repair or reassessment variant: round 1 has
`investigation`, `repair` and `reassessment` all `null`.

| Item | IDs | Artifacts read |
| --- | --- | --- |
| Invocation | inv-0013 (operation inv-0013, attempt 1), fresh requested and actual | `J/invocations/inv-0013/{invocation,outcome,submission}.json`, `observations.jsonl` |
| Session | ses-0011, pi session `bcb77af8-ef63-4ae7-a6dd-52e4574853b8`, source checkpoint `c2becd37…` turn 0, end point turn 1 `1006253b…` | `J/transcripts/ses-0011.jsonl` (31 entries, 85,568 B) |
| Delivered prompt | request hash `0b6438ef…`, message blob `8b63bb9b…` (13,207 B), role instructions `3fdc182d…` (1,044 B), procedure source `200e4528…` (862 B), selected procedure hash `52d191a9…` | [packet.json](../invocations/inv-0013/packet.json), [task.md](../invocations/inv-0013/task.md); correlation `O/correlations/operations/8700b719….json` |
| Native requests | 4 (first `227fd8ba…`, last `ec1653c9…`) | [native-first.json](../invocations/inv-0013/native-first.json), last payload in `P/`, [inventory.json](../inventory.json) |
| Tool calls | 14 `snapshot_read`, 5 `snapshot_diff`, 1 `snapshot_search`, 1 `snapshot_list`, 1 submission | transcript entries n3, n8, n18, n27; observations |
| Records produced | nfa-001 (round 1, phase initial), cand-001, round 1 `outcome: satisfied` | `J/nonfunctional/{assessments,candidates,rounds}/` |
| Later context | gate ga-0004 (final, 4 configured commands, `overall: pass` on e6356f5); events 113–131 | `J/gates/ga-0004/`, `J/events.jsonl` |
| Ground truth | captured plan `J/input/plan.md`; candidate source via `git show e6356f5:` and `git diff 0244ce2 e6356f5` | project copy `E/collection-review` |

Abbreviations: `E` = `/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`;
`J` = `E/collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`;
`O` = `E/collection-review/plans/.harness/session-operations/`;
`P` = `O/store/payloads/`.

The delivered bytes were captured. The message in `packet.json`, the blob and
the first native request's `input[0]` text are identical (13,207 B). The
native `instructions` equal the role text (1,044 B). The first and last
native requests have identical instructions, tool declarations, first input
item and `prompt_cache_key`. I did not open the two middle native requests.
The current harness source at 5169117 was read only to locate the `for {}`
template ([task-brief.ts](../../../../subs/harness/src/run/task-brief.ts),
line 72) and the unchanged-path diff error
([snapshot.ts](../../../../subs/harness/subs/reviews/src/snapshot.ts),
line 307). The source hashes of `coordinator.system.md` and
`assessment.procedure.md` at 5169117 match the delivered manifest.

## Required information

| Need | Status | Where / note |
| --- | --- | --- |
| Objective | Met directly | `brief:goal` ("Assess the complete NFR catalog for 6074e7d4…"), `brief:support:context:0`, procedure block, task block |
| NFR wording and IDs | Met directly | `brief:requirements`: nfr-001…004 verbatim, "Conditions: none recorded", "Deviations: none". No `fix-` elements exist, so "every fixed requirement" is empty and caused no confusion. |
| Plan intent beyond the NFRs | Reachable through a pointer | Each NFR header names `plans/status-badge-tone/plan.md`. That file is inside `readScope ["."]`, and the agent read it (n18). It cited the plan's `data-tone` request when arguing nfr-003, so the pointer was enough. |
| Authority and write scope | Met directly | "Do not edit source", four read-only snapshot tools, `policy.authority.writer: false` |
| Current state | Met directly | `brief:support:nonfunctional-source`: head, tree, `run-start` comparison with 6 changed paths, empty `accepted-boundary` |
| Dependencies (badge callers) | Reachable with an available tool | The starting points list only the badge module and `cucumber.js`, not the callers. One pathless `snapshot_search "StatusBadge\|status-badge"` (n3) found both callers and the stylesheet. That matches `git grep` on e6356f5. |
| Execution location | Met, with unusable extras | The snapshot tools take candidate-relative paths, and the agent used them. The absolute `projectRoot`/`workingDirectory` cannot be used with these tools. |
| Verification expectations | Met directly | "Analysis of the source is sufficient evidence, including for requirements about tests or behavior…", plus "green audits do not establish fixed/NFR satisfaction" |
| Evidence exclusions | Met, with one inconsistency | Git metadata, generated views and run records are excluded. `environment:views` still advertises `.ramify-architect`, which `excludedDirectories` and the tools refuse (F3). |
| Expected submission | Met | `submit_nonfunctional_assessment`. The schema is in the tool description, while the provider `parameters` is `{type: object}` (F5). It was accepted first time with 0 rejections. |
| Stale or contradictory | None material | The starting-point notes come from inv-0006 at 9792902 and still describe the candidate. One note is addressed to the engineer: "no configuration write needed". |

## Findings

### Verified: the assessment's conclusions are supported (no issue)

This covers inv-0013 and nfa-001, results 0–3 in
`J/invocations/inv-0013/submission.json`.

- **nfr-001 (satisfied).** The agent read all of `status-badge.tsx` (39
  lines), `module.ramify` and `vocabulary.ts:62-64`. The badge takes `tone` as
  a prop, renders only a `<span>`, and has a single type-only import,
  `ReviewStatus = z.infer<typeof reviewStatusSchema>`, which predates the run.
  The uncertainty field reads: "Interpreting 'learns nothing' as absence of
  domain/runtime coupling, rather than forbidding the pre-existing status
  vocabulary, is an inferred interpretation". That interpretation is
  appropriate, and recording it is correct.
- **nfr-002 (satisfied).** The text expression `label ?? defaultLabels[status]`
  is unchanged in the run-start diff, and `tone` reaches only `data-tone`.
  The agent's account of the tests is accurate: four tones × two statuses,
  custom, empty and escaped labels, `undefined` tone, and a `null` label under
  `@ts-expect-error`.
- **nfr-003 (satisfied).** The agent's two production callers match
  `git grep`: `CatalogCard` with a custom label and `ReviewResult` with status
  only. The callers and `styles.css` are absent from `changedPaths`. The
  stylesheet selects only `.status-badge` and `[data-status=…]` (lines 42–57),
  so the added attribute changes nothing visible. The result also says that
  the plan asks for `data-tone`, so "as they do today" is not taken to mean
  byte-identical markup. The caller tests
  (`catalog-card.test.tsx` and `review-result.test.tsx`, which assert
  `toContain('data-status="…"')`) were not read. They were not needed: the
  source argument settles the requirement.
- **nfr-004 (satisfied).** `git diff 0244ce2 e6356f5 -- …/status-badge.test.tsx`
  shows an added import and added tests only, so "retains both original tests
  and assertions unchanged" is accurate. The agent read `vitest.config.ts`
  (`include: ['**/src/tests/**/*.test.ts?(x)']`) and `cucumber.js` (globs
  `subs/**/src/tests/{features,steps}`, `tags: 'not @ramify-pending'`), which
  support its claim about how the tests are found and run. The uncertainty
  field correctly says "No execution result was available or claimed". The
  later gate ga-0004 ran the fixture tests and scenarios and passed on the
  same commit. That agrees with the verdict, but the gate result was not
  available to the agent when it assessed.

Confidence is high: every claim was compared with the candidate's git objects.

### F1: per-path `snapshot_diff` of an unchanged file returns an error (low)

This affects inv-0013, transcript n18 (calls) and n24–n26 (results).

The agent requested `snapshot_diff` for `catalog-card.tsx`, `review-result.tsx`
and `styles.css`. Each result came back with `isError: true` and the text:
"The candidate did not change "subs/workspace/subs/catalog/subs/ui/src/catalog-card.tsx"; snapshot_diff without a path lists what it changed".
The text comes from `subs/harness/subs/reviews/src/snapshot.ts:307`
(`denial: 'missing'`).

Expected: a request asking whether a named file changed gets a normal "no
change in run-start" answer, or the tool description tells the agent that
only changed paths have patches. Observed: the description says "List
changed paths or read a per-path patch for a captured named comparison" and
does not mention the error case. The three paths were already absent from the
prompt's `changedPaths`. The agent still checked them, perhaps because of the
brief's "Make your own semantic judgment for every element, including
unchanged callers" and "An empty diff establishes no historical
preservation". That link is a reading of the prompt, not something the
transcript shows.

Impact: 404 B returned, inside a parallel batch, so no extra model turn. The
error text confirmed what the agent wanted to know, and the nfr-003 result
cites "run-start comparisons for … catalog-card.tsx, review-result.tsx and
styles.css". The observations record these calls as three failed reads, so the
invocation's metrics show tool failures that were not task failures.
Confidence: high for the mechanism, low for the claim that the prompt caused
the calls.

Correction: return a non-error "unchanged in <comparison>" result for a path
inside the read scope, or say in the tool description that unchanged paths
have no patch. Separately, the observation classifier could count a
`snapshot_diff` with no change as completed rather than failed.

### F2: submission tool declares an empty parameter schema (low)

This affects inv-0013. The artifact is the native request
`tools[4].parameters = {"type":"object"}`, with the full 2020-12 schema
(about 700 B) only in `description`.

The agent's reasoning summary at n18 reads: "I need to submit a tool schema,
but it seems like there are oddities since no arguments are defined, yet it
probably expects a JSON payload. I'm thinking I can call it with the actual
JSON as per its description."

Expected: the provider-facing parameters carry the schema, so the model and
any strict-mode validation see the contract directly. Observed: the model
noticed the mismatch and reasoned around it. The submission matched the
described schema and was accepted (`rejectedSubmissions: 0`).

Impact: a short reasoning detour and no rejection. The same declaration
pattern appears in other kinds in the earlier run's reviews, so it probably
recurs across roles. Confidence: high that the mismatch was noticed, low for
any cost beyond that.

Correction: declare the validator schema as `parameters`, keeping the
description short.

### F3: environment blocks a snapshot-only assessor cannot use (low; recurrence)

This affects inv-0013, in [task.md](../invocations/inv-0013/task.md). Sizes
are UTF-8 bytes of each delivered addition in `packet.additions`:

| Block | Bytes | Why it does not support this task |
| --- | --- | --- |
| `environment:views` | 1,190 | Advertises `…/collection-review/.ramify-architect`. `excludedDirectories` lists it, the snapshot tools refuse it, and the brief excludes generated views from evidence. |
| `environment:limits` | 1,074 | Run-wide limits such as `maxWorkItems`, `forkRetriesPerRequest` and `writerSettleMs`. Only `rejectedSubmissionsPerTurn` bears on this task. |
| `environment:projectRoot` + `workingDirectory` | 472 | Absolute host paths. The agent has no filesystem or shell tool. |
| `environment:candidate` + `snapshot` | 292 | Repeat the tree hash already given in `brief:goal` and the source block |
| `environment:supportPaths` | 237 | `subs/harness/src/nonfunctional/*.md`: harness files outside the target project and outside snapshot scope, whose content is delivered anyway |
| `environment:cucumberConfiguration` | 133 | `null` |

Total: 3,398 B. That is 19.5% of the first request's 17,455 B
(1,044 B instructions, 3,204 B tool JSON and 13,207 B message). The first call
reported 4,074 uncached input tokens. A byte-proportional estimate puts these
blocks near 790 tokens. That is an estimate, not a tokenizer measurement:
hashes and JSON can tokenize differently. At the recorded rate of $2 per
million new-input tokens this is under $0.002 per uncached call, and calls 3
and 4 read most of the prefix from cache.

Relevance is the problem, not cost: the views block contradicts the evidence
rule. No call targeted views, support paths or absolute paths, so there was no
observed effect. The template is unchanged since the 2026-10-09 run, where the
same finding was made ([earlier review](../../2026-10-09-status-badge-tone-plan25-postmortem/reviews/nonfunctional-assessment.md),
F3). Confidence is high.

Correction: select environment blocks by role and tool set. For the snapshot
assessor, drop views, supportPaths, cucumberConfiguration and the absolute
roots, fold candidate and snapshot into the source block, and keep only
the limits that apply to this task.

### F4: action instructions inside the assessment procedure (low; recurrence)

This affects inv-0013, in `procedure:nonfunctional-coordinator:assessment`,
paragraph 2, about 330 B: "When asked for an action, use the named action tool
to request a sequential investigation, one repair batch, or closure…".

No action tool is declared for this task, and nothing asks for an action. The
role text also carries a 392-byte investigation and repair paragraph. That
text is shared by every coordinator task and is a reasonable cacheable prefix,
so only the paragraph in the procedure is out of place. No observed effect.
Confidence is high.

Correction: move the paragraph into the action procedure.

### F5: wording-preservation instructions without a schema field (low; recurrence)

This affects inv-0013 and nfa-001. Three instructions ask for the wording to
be kept:

- Role text: "Preserve their wording and the difference between stated and
  inferred conditions".
- `brief:support:context:0`: "Carry their wording and stated/inferred
  conditions forward unchanged".
- Procedure: "Preserve the element wording".

The schema has only `nfr`, `result`, `inspectedScope`, `evidence` and
`uncertainty`, with `additionalProperties: false`. The agent complied by
making the first `evidence` item of every result a restatement, for example
"Requirement: The badge stays a presentation primitive of the shared UI: …
Conditions: none recorded." Across the four results this is 587 B of the
6,385-byte submission. The restatement is not evidence, and it mixes into the
field that later readers use for grounding.

Impact: small. The record carries no wrong content, but the evidence lists are
less clean. Confidence: high that the instructions and schema do not match;
moderate that the instructions caused the restatement, because the restated
text matches their phrasing.

Correction: either add an optional field for restated wording and conditions,
or tell the agent that the harness keeps the package wording and that results
carry only judgment, scope, evidence and uncertainty.

### F6: starting points omit the callers and repeat origin metadata (low)

This affects inv-0013, in `brief:support:starting-points` (3,220 B).

The eight entries share one origin (`inv-0006`, boundary 9792902), repeated
in each entry's `origins` array. That repetition takes 1,444 B. The notes
were written for the engineer, for example "to retain and extend with
tone-specific coverage" and "no configuration write needed". The two callers
that nfr-003 depends on are not listed.

The agent found the callers with one search (4,626 B returned), so nothing was
inaccessible. The pointer list is still incomplete for the one NFR about
dependents. No observed effect beyond that search. Confidence is moderate:
search-based discovery is legitimate under "explore the whole allowed tree".

Correction: state the shared origin once, and when an NFR concerns callers
or dependents, add the badge's known importers. These are available from the
architect view's observed-use records at preparation time.

### F7: empty work identity in the task line (informational)

The task line reads "Perform assessment for {}; use the current evidence and
designated submission." It comes from
`` `Perform ${kind} for ${JSON.stringify(facts.work)}…` `` in `task-brief.ts:72`,
and `work` is `{}` for this plan-level role. The agent showed no confusion.
Correction: omit the `for …` clause when there is no work identity.

## Observed effects

Timeline (transcript and observations):

| Model call | At | Usage (input / cacheRead / output) | Model ms | Tool batch that followed |
| --- | --- | --- | --- | --- |
| 1 (obs n2) | 10:53:07.1 | 4,074 / 0 / 124 | 4,726 | n3: read badge, read test, diff badge, search callers |
| 2 (obs n22) | 10:53:14.4 | 7,448 / 0 / 255 | 6,905 | n8: read 2 callers, styles, helper, steps, feature, vocabulary; diff test; list root |
| 3 (obs n62) | 10:53:21.7 | 5,769 / 7,296 / 239 | 6,733 | n18: read vitest, package, cucumber, module.ramify, plan; 3 unchanged-path diffs (errors) |
| 4 (obs n101) | 10:54:01.5 | 2,536 / 12,928 / 1,384 | 39,138 | n27: submission, accepted (n28) |

The invocation totals are input 19,827, cacheRead 20,224, output 2,002 and
cacheWrite 0. Wall time was 59.4 s, of which model time was 57.5 s; tool time
sums to 6.4 s across concurrent calls. The estimated charge is $0.0617, from
the recorded rates, not a provider bill.

- **Proportionality.** I grouped the 37,305 returned bytes by the
  requirement each call supports:

  | Purpose | Calls | Bytes |
  | --- | --- | --- |
  | Changed badge, tests, helper, steps and feature (nfr-002, nfr-004) | 7 | 16,097 |
  | Callers and stylesheet (nfr-003) | 3, plus 3 failed diffs | 5,752 + 404 |
  | Caller discovery (search and root list) | 2 | 4,803 |
  | Coupling (vocabulary, `module.ramify`; nfr-001) | 2 | 4,146 |
  | Test wiring (vitest, package, cucumber; nfr-004) | 3 | 4,252 |
  | Plan | 1 | 1,851 |

  Every read except the 177-byte root listing appears in a cited
  `inspectedScope`. For a one-file presentational change with four NFRs and
  two callers, this is proportionate. Reading the test wiring is more than
  strictly necessary, but it is reasonable given the brief's rule that green
  audits do not count.
- **No clarification, rejection, repair or retry.** `rejectedSubmissions: 0`,
  `disposition: applied`, `lateWrites: []`.
- **Repeated discovery.** Two kinds. The badge and its test were each read and
  then diffed, which returned different content each time (two
  `repeatedReads`, by design). The three unchanged-path diffs (F1) repeated
  what `changedPaths` had already said. The prompt was adequate when it was
  delivered: `changedPaths` was correct, and the agent's checking was a
  choice, not caused by missing information.
- **Errors.** The only tool errors are the three F1 diffs. The model's
  reasoning noticed the F2 schema mismatch. Neither changed the outcome.
- **Excess material.** No call targeted the F3 blocks. Their effect is
  limited to uncached input on calls 1 and 2.
- **Cache.** This is noted for the parent's cache analysis, not as a prompt
  finding. Call 2 reports `cacheRead: 0` even though its prefix (instructions,
  tools and first user item) is the same as call 1's; I verified this for the
  first and last payloads. Call 3 is the first call to show reuse. The reason
  for the call-2 miss is unknown from this evidence.

## Suggested corrections

1. Make an unchanged-path `snapshot_diff` a non-error answer, or document it
   in the tool description, and stop classifying it as a failed read (F1).
   Validate with a repeat run: the assessment should show zero tool errors.
2. Declare the submission schema in the provider `parameters` (F2). Check for
   reasoning that mentions missing arguments, and for rejection counts,
   across all submit tools.
3. Select environment blocks for the snapshot-only assessor (F3). Measure the
   first-request bytes for this kind; about 3.4 KB less is expected.
4. Move the action paragraph out of the assessment procedure (F4).
5. Resolve the wording-preservation instructions against the schema (F5).
   Check that each result's `evidence[0]` is no longer a restatement.
6. Deduplicate starting-point origins, and add known importers when an NFR
   concerns callers (F6).
7. Drop the empty `for {}` clause (F7).

Items 3–5 repeat the 2026-10-09 recommendations against an unchanged template.
The procedure and role hashes are identical in both runs.

## Evidence gaps

- The reasoning is mostly unavailable. Call 4's thinking block is empty
  (`bytes: 0`), and the requests ask for `reasoning.encrypted_content`. Why the
  agent diffed unchanged files, or read the test wiring, can only be inferred
  from the call sequence and the submission.
- I did not open the two middle native requests. Prefix identity was checked
  only between the first and last payloads.
- Search observations do not report scanned bytes, matched-file identities or
  outside-scope status (the `coverage` notes in the inventory). The caller
  discovery count rests on the transcript's search output, which I compared
  with `git grep`.
- The tool-call `action.path` values in the transcript are absolute paths on
  the original host
  (`/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-…/scratchpad/badge-run-61/collection-review/…`),
  which do not exist in the evidence copy. I compared contents with the
  copy's git objects at e6356f5, not with the run host's filesystem.
- The cause of the cache miss on call 2 is unknown. Provider cache behavior is
  not recorded beyond the usage fields.
- Gate ga-0004 confirms by execution that the tests and scenarios pass, but
  only after the assessment was submitted. It cannot show that the agent's
  source-only judgment for nfr-004 was adequate when it was made, only that
  the judgment was not contradicted.
