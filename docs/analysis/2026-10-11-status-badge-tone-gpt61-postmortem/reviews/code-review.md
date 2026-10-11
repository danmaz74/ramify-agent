# Prompt review: reviewer code (inv-0008, ses-0007, rq-0001.a01)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, harness ramify-agent
5169117. Evidence root:
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`
(paths below without a prefix are relative to its
`collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`).

## Summary

The code-review prompt was adequate for its task. It delivered the objective,
the plan elements, the assignment's goal and approach, the canonical
changed-path list and complete patches, which match `git diff 9792902 e6356f5`
byte for byte. It also delivered a usable procedure and coverage rule, plus a
schema-bearing submission tool. The reviewer read the context it needed with
the four snapshot tools, submitted once and was accepted with zero concerns
in 23.6 s across 4 model requests. Having read the diff and the surrounding
candidate source myself, I find the no-concern verdict supported.

The findings are all low severity. Some blocks give the reviewer pointers it
cannot or need not use: absolute project and working-directory paths, which
the system prompt says are refused, harness `supportPaths` and run limits.
The section "What the plan asks of it" is delivered empty, and its content
arrives in a separate block further down. The "Declared project checks"
block tells the reviewer to read four configuration files, which it did
first (7,255 returned bytes). About 5.3 KB of the 27,961-byte message
(19%) is boilerplate, repetition or engineer-only material. None of this
coincided with errors, clarification or a rejected submission.

The reviewer's exploration was proportionate, with a small amount of
over-reading. It returned 28,157 bytes. Of those, 4,226 bytes re-read new
files whose full content was already in the patch, and 5,146 bytes were
configuration reads of little value to the review. Its World and hooks
check and its search for step-text collisions were well aimed at a stated
assignment constraint.

## Coverage

- Kind: `reviewer:code`, prompt package `reviewer/4`, procedure
  `procedure:reviewer:code` (SHA-256 `52b1322812d3428064537ef709a0f6f9018e500e206045ecdd693072f80bd0dd`).
  One variant, one instance. Fresh start, no inherited history
  (`manifest.inheritedPoint: null`, source point turn 0).
- IDs: invocation inv-0008, harness session ses-0007, pi session
  `2bdc0406-30aa-45ca-84b9-5dcf6e14d19b`, operation inv-0008, review request
  rq-0001, attempt rq-0001.a01, iteration wi-001.i01, gate ga-0002, candidate
  `e6356f5d329a6fac66cb412f8688128789b1ca08` (tree `6074e7d4…`), base
  `9792902f…` (the harness's "Scenarios of status-badge-tone" commit, after
  fixture `0244ce2` and `aaf6f18`).
- Artifacts read:
  - Delivered inputs: [task.md](../invocations/inv-0008/task.md) (equal to
    `packet.message`), [packet.json](../invocations/inv-0008/packet.json),
    [native-first.json](../invocations/inv-0008/native-first.json), and all
    four retained native requests (`store/payloads/bee257ce…`, `4f3def3d…`,
    `a66affbc…`, `6a99ca17…`).
  - Invocation records: `invocations/inv-0008/{invocation,inputs,submission,outcome}.json`
    and `observations.jsonl` (through [inventory.json](../inventory.json)).
  - Transcript `transcripts/ses-0007.jsonl`, all 24 entries.
  - Review records: `reviews/rq-0001/{request.json,attempts/01/attempt.json,attempts/01/submission.json}`,
    plus the sibling rq-0002 and rq-0003 submissions for comparison.
  - Gate records: `gates/ga-0002/*` and the audit report commit `5bf6fda`.
  - `work-items/wi-001/iterations/01/assignment.json`, `events.jsonl`
    sequences 70–88, and the inv-0008 entry of `metrics.json`.
  - In the evidence repository: the candidate's `plan.md`, the feature file,
    `cucumber.js`, `tsconfig.json`, `styles.css`, both callers and
    `subs/integration-tests/src/support/world.ts`.
  - Harness source at 5169117: [reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts).

## Required information

| Need | Status | Where |
| --- | --- | --- |
| Objective | Met directly | `brief:goal` ("Review e6356f5…"), `support:context:0`, `# Current task: code` |
| Plan constraints | Met directly | `support:assignment-package` (ctx-001, fr-001…005, nfr-001…004, verbatim); the plan path `plans/status-badge-tone/plan.md` is named and readable |
| Iteration intent | Met directly | `support:## The iteration:0` (goal, approach, completion evidence) |
| Authority and write scope | Met directly | System prompt: "You change nothing and decide nothing…" |
| Current state | Met directly | Candidate, tree, base, "gate ga-0002 passed", changed paths, complete patches (10,442 bytes, identical to the git diff) |
| Dependencies | Not applicable | First review of the iteration; `guidance: []`, no check findings |
| Execution location | Met, with a conflict | System prompt: paths are relative to the candidate root and absolute paths are refused. `environment:projectRoot` and `workingDirectory` nonetheless give absolute host paths (F1) |
| Surrounding source | Reachable | Starting points, test pointers and snapshot tools; callers can be found with `snapshot_search` |
| Verification expectations | Met directly | Procedure steps 1–4, the definition of a concern, ground rules, and the coverage rule for `inspected` and `missing` |
| Expected submission | Met directly | `submit_review` description carries the full JSON schema; the system prompt and task name the tool |

Nothing the task needed was missing or inaccessible. The `assignment` path in
the request JSON (`work-items/…/assignment.json`) is not readable with snapshot
tools. The context block states this explicitly and supplies the intent instead,
which is a good correction of a potential trap.

## Findings

### F1. Absolute host paths conflict with the snapshot-only rule (low)

- IDs: inv-0008. Location: [task.md](../invocations/inv-0008/task.md) lines
  485–495; system prompt, `native-first.json.instructions`.
- Excerpt: `"projectRoot": "/tmp/claude-1000/…/badge-run-61/collection-review"`;
  `"workingDirectory": "…/reviews/rq-0001/attempts/01/workspace"` versus "You
  have no access to the working directory. Every path is relative to the
  candidate's root; an absolute path … [is] refused."
- Expected: a reviewer that works only through snapshot tools gets the
  candidate root as its only location. Observed: two absolute host paths
  (576 bytes) that no tool accepts. The declared checks' "cwd `.`" adds a
  third notion of location.
- Impact/confidence: no observed effect, since every call used a relative path
  (transcript n=3, 10, 17). This is a latent risk of absolute-path tool
  errors. Confidence high that the fields are unusable for this role.
- Correction: omit `projectRoot` and `workingDirectory` from the reviewer
  environment, or replace them with "candidate root: `.`".

### F2. `supportPaths` names harness files that the reviewer cannot read (low)

- IDs: inv-0008. Location: task.md lines 562–568.
- Excerpt: `"supportPaths": ["subs/harness/src/prompts/reviewer.system.md",
  "subs/harness/src/prompts/code-review.procedure.md"]`.
- Expected: environment entries are things the agent can use. Observed: these
  are provenance paths in the ramify-agent checkout. In the candidate, which
  is the only tree reachable by snapshot tools, they do not exist. The
  procedure tells the reviewer to ground concerns in files read with
  `snapshot_read`, which makes paths presented as "support" misleading.
- Impact: none observed, since the reviewer did not try them. 225 bytes.
- Correction: keep provenance in the manifest, which already records the
  sources, and drop the field from the delivered reviewer environment.

### F3. The "What the plan asks of it" section is empty, and its body is delivered elsewhere (low)

- IDs: inv-0008. Location: task.md lines 31–37 and 85 onward;
  [reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts) lines 66–74
  (`omit: [briefing.package, …]` plus
  `literalSections: [{ key: 'support:assignment-package', … }]`).
- Excerpt: "## What the plan asks of it / The elements the assignment cites,
  whole, as its engineer received them." The section ends there. The elements
  then appear about 50 lines later under `# Plan context package`, after the
  changed paths, the checks and the test pointers.
- Expected: the introduction and the elements are delivered together. Observed:
  the package is omitted from the prompt section and re-delivered as a
  separately keyed literal block, which leaves an introduction with nothing
  under it.
- Impact: none observed. A careful reader can join the two parts, but the
  phrase "as its engineer received them" points at text that does not follow.
  Confidence high for the structure, low for any effect on behavior.
- Correction: emit the package inside the same block, or drop the orphaned
  heading and move its sentence into the package block.

### F4. The configuration-pointer instruction induced reads of marginal value (low)

- IDs: inv-0008. Location: task.md lines 52–67; transcript n=3.
- Excerpt: "- Configuration/support pointer: `ramify-audit.json`. … Read these
  project-relative references with snapshot_read/snapshot_list in the audited
  candidate."
- Expected: a code reviewer reads configuration only when a change depends on
  it. In this change, only `cucumber.js` (step globs, the pending-tag filter)
  bears on whether the new steps are collected. Observed: the first model
  turn read exactly the four listed files, in the listed order, alongside the
  test-directory listing and the feature file. Together they returned 7,255
  bytes, of which `ramify-audit.json` was 3,683.
- Impact: plausibly caused by the instruction, given the matching order and
  immediacy, but cheap: one parallel batch of about 0.2 s of tool time. The
  returned bytes became uncached input on request 2 (see Observed effects).
  None of these reads led to a concern.
- Correction: phrase the instruction conditionally, for example "read one
  when a change's behavior depends on its configuration". For code reviews,
  consider supplying only the runner configuration that collects the changed
  tests.

### F5. Extraneous or duplicated material, about 5.3 KB (low)

Sizes are UTF-8 bytes of [task.md](../invocations/inv-0008/task.md), split on
block headers. The provider reported 8,642 input tokens for the whole first
request, which was 36,156 bytes of JSON (instructions 2,795, tools 3,981,
message 27,961). Bytes are not converted to tokens here.

| Material | Bytes | Relevance |
| --- | --- | --- |
| "Current value; replaces any earlier value for this key." ×21 | 1,176 | None in a fresh session that has no earlier values (`based on: none (full)`) |
| `environment:limits` | 1,075 | Run, placement, NFR and repair budgets; nothing actionable for a read-only reviewer |
| Three "Harness pending-tag binding" paragraphs | 1,230 | They repeat path, sha, producer and submission three times; one line would carry the same provenance, and the text itself says "review the actual audited patch" |
| `brief:requirements` raw request JSON | 739 | Duplicates base, tree, gate and candidate from `support:context:0`, and adds `policy`, `source.hash` and `forkPoint`, which the reviewer cannot use |
| `supportPaths`, `projectRoot`, `workingDirectory` | 801 | See F1 and F2 |
| Engineer-facing "Completion evidence" ("Provide a focused passing run…") | about 330 of 2,161 | Partly useful as a statement of promises; it is phrased as an instruction the reviewer cannot carry out |

Relevant even though duplicated: the changed-path list (the canonical
list required by procedure step 1), starting points (architect notes such as
"preserve label fallback" double as review criteria; 3 of the 4 paths are
changed paths), and the shared role prompt's design-guidance sentence. In a
fresh session the cache cost falls on the first request regardless. Later
requests reused the prefix when the provider cache hit (requests 3 and 4).
Removing the material would shrink the uncached first and second requests;
I do not claim it would have changed the outcome.

### F6. The submission tool's provider-facing parameters are empty (low, informational)

- Location: `native-first.json.tools[4]`: `"parameters": {"type":"object",
  "properties":{}}`; the full schema (2,142 bytes) is in `description`.
- Expected: the provider enforces the structure. Observed: the provider
  enforces nothing structural, and the harness validates afterwards. The
  model produced a valid payload first time (transcript n=20, verdict
  `accepted` at n=21, `rejectedSubmissions: 0`).
- Impact: none in this instance. Larger submissions with concerns would rely on
  the harness's rejection loop. This is shared by every role that uses the
  same declaration mechanism, and it belongs to the parent's cross-kind
  reconciliation.

### F7. The procedure refers to a CheckFinding list that is absent (low, informational)

- Location: task.md line 469: "`suggests` may name a CheckFinding the message
  below lists … and is otherwise null."
- Observed: the message contains no check-finding section, and the attempt
  records `checkFindings: []`. Saying "no check findings" explicitly would
  remove the dangling reference. No effect, since there were no concerns.

### No issue found

- Task identification, tool availability and submission contract. The
  declared tools (`snapshot_list/read/search/diff`, `submit_review`) match
  `environment:availableTools`, the system prompt and the procedure. There is
  no `inspect_git` tool and none is needed, because `snapshot_diff` covers it.
- The patch is complete and correct. The supplied diff equals
  `git diff 9792902 e6356f5`, and the statement "no feature or pending-tag
  patch is hidden" holds: the feature file was added in base 9792902, and the
  candidate patch shows only the tag removals.
- The request's `assignment` path trap is disarmed by the context block.
- Inherited context: none, because the start was fresh, so there is no stale
  or conflicting guidance.

## Observed effects

Timeline from `transcripts/ses-0007.jsonl` and `events.jsonl`:

1. 10:51:53.9: the request is recorded (event 70) and the invocation starts
   fresh (75–82).
2. Request 1, n=3, 8,642 input tokens and 0 cached. Six parallel calls: the
   four configuration files, the listing of `shared-ui/src/tests/` and the
   whole feature file. The feature read was needed because the patch shows
   only tag hunks.
3. Request 2, n=10, 11,483 input tokens and 0 cached. Reads all four changed
   source and test files, lists `subs/integration-tests/src/support`, and
   runs one repository-wide search for step texts and `setWorldConstructor`,
   `Before(` and `After(`. The thinking summary says it wanted to "ensure
   that the global hooks won't conflict". This matches the assignment's
   "coexist with the runner's registered World" constraint and the global
   step registration in `cucumber.js`.
4. Request 3, n=17, 6,574 new and 8,448 cached tokens. Reads `hooks.ts` and
   `world.ts` (7,234 bytes).
5. Request 4, n=20, 2,290 new and 14,848 cached tokens. `submit_review` lists
   all five paths as inspected, with no missing paths and no concerns. It is
   accepted at n=21 and the invocation ends `submitted` at 10:52:17.5.

Totals: 28,989 uncached input, 23,296 cached and 565 output tokens, an
estimated USD 0.066, 22.2 s model time and 2.5 s tool time. There was no
clarification, no tool error, no rejected input or submission and no repair.

Exploration proportionality. There were 15 tool calls: 11 reads, 2 lists
and 1 search. Metrics count the lists as searches, giving the reported
"searches: 3". They returned 28,157 bytes, against a 10,442-byte diff. Every
read was unique, and every target was a changed path, a pointer named in the
prompt, or the World and hooks support that a stated constraint concerns.

Avoidable portions:
- `badge-markup.ts` and `status-badge-tone.steps.tsx` are new files that the
  patch already showed in full (4,226 bytes). The procedure says to read
  surrounding source only "where a patch alone does not show what the change
  does", and the coverage rule credits delivered patches.
- `ramify-audit.json`, `ramify-agent.json` and `package.json` (5,146 bytes,
  see F4).

The reviewer did not open the callers (`catalog-card.tsx`,
`review-result.tsx`) or `styles.css`. For nfr-003 the optional prop with a
default and the passing type-check gate make that defensible.

Whether the verdict is supported. I read the diff and the candidate source.

- `tone?: 'neutral' | 'positive' | 'warning' | 'critical'` with default
  `'neutral'` and `data-tone` on the same span meets fr-001 to fr-005.
- `label ?? defaultLabels[status]`, `data-status` and `className` are
  unchanged (nfr-002).
- Both callers compile unchanged. `catalog-card.tsx` passes only `status`
  and `label`, and `review-result.tsx` passes only `status` (nfr-003).
- The unit tests cover every tone, omission, an explicit `undefined`, custom,
  empty and entity-bearing labels, and the nullish JavaScript fallback
  (nfr-004).
- The steps bind sc-001 to sc-003 through a `WeakMap` keyed by the World,
  without replacing `CollectionReviewWorld`.
- The audit report at `5bf6fda` shows "6 scenarios (6 passed)": the existing
  scenario, sc-001, sc-002 and sc-003's four examples. It also shows the
  status-badge suite with 26 tests passing.

I found no actionable defect. One judgment call: `styles.css` still styles
only `[data-status]`, so a tone has no visual effect yet, although ctx-001's
motive is to draw attention to a badge. The plan's requirement is only the
attribute ("so the stylesheet … can read it"), and the stylesheet is outside
this iteration's files. At most this is a scope or design question, not a
code-review defect. The independent scope (rq-0002) and design (rq-0003)
reviews also returned no concerns. The no-concern verdict is supported.

Cache observation (correlation only). Request 2's input began with exactly
request 1's input (verified prefix equality, identical instructions, tools
and `prompt_cache_key`). It was sent about 0.3 s after request 1's response,
yet it read 0 cached tokens. Requests 3 and 4 did hit the cache. The prompt
cannot explain the miss, which is most likely the provider cache not yet
being populated. It cost about 8.6k uncached tokens.

## Suggested corrections

1. Reviewer environment: drop `projectRoot`, `workingDirectory`,
   `supportPaths` and `limits`, or reduce `limits` to the invocation's own
   idle and absolute bounds. State "candidate root" as the only location (F1,
   F2, F5).
2. Merge the plan-elements introduction with the package block, or remove the
   orphaned "What the plan asks of it" section, in
   [reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts) or the
   message builder it calls (F3).
3. Make configuration pointers conditional for code reviews, and suggest the
   runner configuration only when changed tests depend on it (F4).
4. Collapse repeated pending-tag provenance into one line covering all
   scenarios of one file. In a fresh session, omit the per-block
   "Current value…" sentence. Replace the raw request JSON with the fields the
   context block does not already state (F5).
5. State "no check findings" when the list is empty (F7).
6. Optionally, add a note to the procedure that new files shown in full in a
   patch need no re-read (an observed 4.2 KB of redundant reads).

## Evidence gaps

- Reasoning is encrypted. Only short thinking summaries are retained (n=10
  has 403 bytes; n=17 is empty), so the motive for each read is inferred from
  ordering and those summaries.
- Search observations do not report matched files or scanned bytes
  (`coverage` notes in `observations.jsonl`). The one broad search's 2,436
  returned bytes are retained in the transcript, so its matches could be
  reconstructed here.
- The cause of the request-2 cache miss is not observable: there are no
  provider-side cache diagnostics.
- In `metrics.json`, `evaluation.invocations[].request` is `null` for inv-0008
  (and for every invocation). The rq-0001 link exists only in
  `reviews/rq-0001/attempts/01/attempt.json` and was joined by hand.
- The reviewer's view of the gate was only "gate ga-0002 passed". The pass
  counts cited above come from the audit report commit, which the reviewer
  never saw. I used them only to assess the verdict, not the prompt.
