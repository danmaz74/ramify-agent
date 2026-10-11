# Prompt review: local-architect continuations of ses-0004 (inv-0006, inv-0010)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, harness ramify-agent
5169117 (prompt package `local-architect/11`). Outcome: completed, 1 work
item, 13 invocations, 4 gates passed.

## Summary

Both continuations gave the architect what it needed to finish its task.
inv-0006 assigned `wi-001.i01` in a single model request, with no new
exploration. Its assignment was accepted the first time, and the engineer
and the iteration gate succeeded against it. inv-0010 checked the accepted
commit with `inspect_git` and requested completion. Its first submission was
rejected because it left out `outline`; the agent added a full outline,
written in the past tense, 12 s later and that submission was accepted.

The rejection has a clear cause. The tool schema requires `outline` on
`request-completion`. The procedure the agent actually received, the
capability-workflow `local-architect-capability.procedure.md`, never
describes `request-completion`'s fields. It only mentions the outline as the
place to record guarded-file authorizations and breaking changes. The schema
itself makes `outline` optional on `assign`. The agent's recorded reasoning
says "There's no need for an outline or to keep the original". The task text
and the schema do not contradict each other: the prose is silent and only the
schema states the requirement. The non-capability procedure
`local-architect.procedure.md` documents the requirement, but this run did
not deliver it.

The rejection observation's empty `callId` is a recording gap. The transcript
holds the call ID. The harness call site does not pass it to the judge.

The other findings are low severity: redundant re-sent blocks in inv-0010,
view and support-path blocks in inv-0006 that do not resolve from the agent's
working directory, and procedure wording about refused completion that does
not match how in-flight reviews were handled.

## Coverage

| Kind / variant | IDs | Start | Source point | Native requests |
| --- | --- | --- | --- | --- |
| local-architect `main`: assignment after context selection | inv-0006 | continued, reason `context-selected` (event 45), after `context-package-appended` (event 44) | ses-0004 turn 1 checkpoint `9c0cd2f0-02db-4fae-a14e-92771541d02b` (end of inv-0004) | 1 |
| local-architect `main` inherited: task header "assignment" at the iteration-closed point | inv-0010 | continued, reason `iteration-closed` (event 84) | ses-0004 turn 2 checkpoint `defda554-29f4-4d20-b29a-a99333e3dd4a` (end of inv-0006) | 4 |

inv-0004 (orientation) was read only as inherited history up to the
checkpoint `9c0cd2f0…`: its 20202-byte first message, its tool calls and its
`submit_work_orientation` call, which are native input items 0–53 of both
continuations.

Artifacts read:

- Derived extracts `invocations/inv-0006/` and `invocations/inv-0010/`
  (`packet.json`, `task.md`, `native-first.json`), plus `inventory.json` and
  `summary.json` in this postmortem directory.
- Run records under
  `/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`:
  `events.jsonl` (sequences 35–112), `transcripts/ses-0004.jsonl` (entries
  n=37–57), the blob `b2a85143…` (the `inspect_git show` result),
  `invocations/inv-0006|inv-0010/observations.jsonl` and outcomes, outline
  revisions 1 and 2 as recorded in events 49 and 106, `input/plan.md`, and
  `job.json` `manifest.architectView`.
- Harness source at 5169117 (the checkout is clean at that revision):
  [submission.ts](../../../../subs/harness/src/work/submission.ts),
  [submissions.ts](../../../../subs/harness/src/run/submissions.ts),
  [runner.ts](../../../../subs/harness/src/steps/runner.ts),
  [observations.ts](../../../../subs/harness/src/run/observations.ts),
  [packages.ts](../../../../subs/harness/src/prompts/packages.ts),
  [local-architect-capability.procedure.md](../../../../subs/harness/src/prompts/local-architect-capability.procedure.md),
  [local-architect.procedure.md](../../../../subs/harness/src/prompts/local-architect.procedure.md)
  and the review-settlement code in
  [service.ts](../../../../subs/harness/src/run/service.ts) around line 5840.

Generated views were not needed. Neither continuation read a view, so
nothing here depends on reconstructing them.

## Required information

How the measurements were made: byte counts are UTF-8 bytes of packet
`additions[].text` and `packet.message`, and compact JSON serializations of
native items, measured with Python. Provider tokens come only from recorded
usage.

### inv-0006 (assignment)

The native first request is the inherited items 0–53, then four new items:

- the context package as a user message (2972 B),
- `additional_tools` with `inspect_git` and `submit_work_item_result`
  (21178 B),
- a developer note activating the new tools and retiring
  `submit_work_orientation` (132 B),
- the task message (11341 B).

The instructions and the top-level tools are unchanged, so the earlier
prefix is preserved (`summary.json`).

| Need | Status |
| --- | --- |
| Objective | Met. The inherited `brief:goal` and the task line "Perform assignment for {"workItem":"wi-001"}". |
| Plan constraints | Met. The appended package adds nfr-001..004 to the inherited ctx-001 and fr-001..005. `brief:requirements` points to it as "supplied once and remains in this session". |
| Authority and write scope | Met. The delivered procedure covers scope, inclusions and guarded files (7143 B), and the inherited "Default write scope" says there are no children, no nested projects and no guarded files. |
| Current state | Met by inheritance: the agent's own orientation reads (status-badge.tsx, its tests, cucumber.js, world.ts, the API view metadata), its orientation submission, scenarios sc-001..003 (pending) and the new "Registered obligations" block. |
| Dependencies | Met. The inherited capability registry entry, "Hypotheses: None" and "Placement: None yet". |
| Execution location | Inherited. `environment:projectRoot` and `environment:workingDirectory` from inv-0004 were not replaced. See F6 for the replaced `views` block. |
| Verification expectations | Met. The inherited "Declared project checks" and engineer bounds, plus the procedure's gate and binding rules. |
| Expected submission | Met. The task names `submit_work_item_result`, the developer note activates it, and the schema is in its description. |

Assignment field guidance (`goal`, `approach`, `completionEvidence`,
`citedElements`, `stage`, `kind`) appears only in the schema, because the
delivered procedure omits the per-kind sections of
`local-architect.procedure.md`. The agent filled every field correctly, so
this gap was not exercised here. It is the same gap as F1.

### inv-0010 (iteration closed)

The native first request is inv-0006's 58 items, then inv-0006's reasoning,
its `submit_work_item_result` call and output, and the 11468-byte task
message. No tools or procedure were re-sent; the procedure is inherited by
key and hash `4e2cfd79…`.

| Need | Status |
| --- | --- |
| Objective | Met. "Assign the next iteration, or request completion and let the work item's gate answer." The header still says "assignment", but the brief disambiguates it. |
| Current state | Met directly: `wi-001.i01` accepted at commit `e6356f5d…`, the engineer's findings, the gate's per-step bindings, and sc-001..003 `bound` with no fakes. The in-flight reviews rq-0001..0003 were not mentioned (F7). |
| Verification | Reachable. `inspect_git` was available; the agent ran `show e6356f5d…` (11445 B diff) and `status` (empty). |
| Previous outline | Inherited, as inv-0006's tool-call arguments. The "Earlier outlines" block gives only a count (F4). |
| Expected submission | Partially met. The schema in the description requires `summary`, `outline`, `registrations` and `reports` for `request-completion`. Neither the delivered prose nor the brief says that `outline` is required (F1). |
| Obligation revisions | Met. Revision 0 is shown, and the agent reported `basedOnRevision: 0`. |

## Findings

### F1: Medium. `request-completion`'s required `outline` is stated only in the schema; the delivered procedure implies it is optional (inv-0010; also affects inv-0006's assignment fields)

- **Location and excerpt.** inv-0006 packet addition
  `procedure:local-architect:main` has
  `source: subs/harness/src/prompts/local-architect-capability.procedure.md`.
  It is inherited by inv-0010. The only outline references are:
  - "a local architect's submission also carries an `outline` revision that
    records why" (in the guarded-files bullet)
  - "Record a breaking change and its affected consumers in the outline when
    the request requires one."
  - "`request-completion` is refused while a capability request is pending…"

  The tool description schema, `oneOf[2]` (`request-completion`), has
  `"required":["kind","summary","outline","registrations","reports"]`, while
  `oneOf[0]` (`assign`) does not require `outline`.
  [submission.ts](../../../../subs/harness/src/work/submission.ts) has
  `outline: outlineBodySchema.optional()` on `assign` and `outline:
  outlineBodySchema` on `request-completion`. The procedure that documents
  it, [local-architect.procedure.md](../../../../subs/harness/src/prompts/local-architect.procedure.md)
  ("## `request-completion` … Its outline says what you established:" and
  "On a later assignment, include it to revise the plan or leave it out to
  keep the last committed revision"), is selected only when
  `capabilityWorkflow === false` ([packages.ts](../../../../subs/harness/src/prompts/packages.ts)
  line 288). It was not delivered.
- **Expected vs observed.** The prose should either state that a completion
  request carries a full outline revision, or the schema should treat it like
  `assign`. Observed: the transcript at n=50 records the reasoning "There's no
  need for an outline or to keep the original", and the call
  `call_d33d48d6…` omits `outline`. The verdict at n=51 is "path: outline,
  Invalid input: expected object, received undefined", with
  `remainingAttempts: 2`.
- **Impact and confidence.** One rejected submission and one extra model
  request (11.9 s; 561 new input, 33280 cached and 488 output tokens; $0.00933
  estimated from recorded rates, about 25% of inv-0010's $0.0375). The
  recovery was clean. Confidence in the cause is high: the omission was
  explicit and deliberate. The wording "keep the original" suggests the agent
  expected assign-like "keep the last revision" semantics, but that reading
  is a hypothesis. The task text and the schema agree in the sense that they
  do not contradict each other: the system prompt says "Its declaration
  carries the complete schema". But the prose cues all frame the outline as
  something written when something changes.
- **Correction direction.** Restore the per-kind field guidance, at least
  `request-completion`'s `summary` and outline fields and `revisionReason`,
  in the capability-workflow procedure. Or decide whether a completion with
  an unchanged plan should be able to keep the last revision, matching
  `assign`. Either way, say it in the iteration-closed brief ("request
  completion with `summary`, an `outline` revision and `reports`").

### F2: Low. The provider-facing submission tool has an empty parameter schema and no field descriptions (inv-0006 delivery, inherited by inv-0010)

- **Location and excerpt.** In inv-0006 `native-first.json` `input[55]`, the
  `submit_work_item_result` entry has
  `"parameters": {"type":"object","properties":{}}`, and `strict` is unset.
  The full union is a 17459-byte JSON string in `description`, beginning
  "Submit this task using exactly this JSON schema: …". The zod comments
  ("A new outline revision, where this assignment revises the plan…", "Why
  this revision differs from the last; empty on the first") are not carried
  into the schema; the only field description is on `startingPoints`.
- **Expected vs observed.** Required fields should be easy to see at the
  point of the call. Here the requirement sits inside a serialized string
  with no explanation of what each field is for.
- **Impact and confidence.** Contributory to F1 only; medium confidence. The
  model filled the large `assign` variant correctly in inv-0006, so the
  format alone does not stop the agent from following the schema.
- **Correction direction.** Export the field descriptions into the schema,
  including "required on request-completion: the plan as established". If
  provider constraints allow it, give a structured `parameters` schema for
  the discriminator and the top-level required fields. That is a measured
  change and should be validated on a later run.

### F3: Low (recording). The rejection observation has an empty `callId` (inv-0010)

- **Location and excerpt.** `observations.jsonl` n=21 is
  `{"type":"rejection","data":{"callId":"","target":"submit_work_item_result","attempt":1,…}}`,
  with no `sourceId`. The transcript verdict at n=51 and the observation
  `tool-start` n=18 both carry
  `call_d33d48d6ff934e67bf88b3ac2878121d|fc_020af87c6a62bbee016acb6a5c35fc87d29eb03eae93fdb8ae`.
- **Cause.** In [runner.ts](../../../../subs/harness/src/steps/runner.ts)
  line 791, the call is `await judge.judge(input)`, and the next line uses
  `recorder.callId(request.toolName)` only for the transcript note.
  `SubmissionJudge.judge(input, callId = '')` in
  [submissions.ts](../../../../subs/harness/src/run/submissions.ts) records
  that default. The shell judge passes a call ID; the submission path does
  not.
- **Impact.** This is a recording gap, not a delivery defect. The rejection
  cannot be joined to its call by ID; here it can be joined by time (18.424
  to 18.487 s) and `attempt`. Because `keyOf` in
  [observations.ts](../../../../subs/harness/src/run/observations.ts) returns
  no key when `callId` is empty and there is no `sourceId`, a replayed
  rejection would not be deduplicated. That last point is inferred from the
  code and was not observed. The outcome's `rejectedSubmissions: 1` is
  correct.
- **Correction direction.** Pass `recorder.callId(request.toolName)` to
  `judge.judge`, and consider making `rejection.callId` non-empty when the
  rejection belongs to a tool call.

### F4: Low. "Earlier outlines" states a count without content or purpose (inv-0010)

- **Location and excerpt.** inv-0010 `brief:support:## Earlier outlines:0`
  reads "This work item already has 1 outline revision(s)."
- **Expected vs observed.** It should say what to do with the earlier outline
  (for example, "a completion request carries a new revision; the last is
  revision 1, recorded at …"). Observed: the agent had the content only
  through its own inherited call. It may have read "already has" as "nothing
  to resend". That is correlation, not established cause.
- **Correction direction.** Merge this into the F1 fix: state the
  requirement, and point to revision 1 or summarize it.

### F5: Low. Re-sent and repetitive blocks in inv-0010 (relevance, not cache)

Measured from the 11468-byte message:

- `## The bounds of an engineer` (417 B) is identical to inv-0004's block,
  which is still in force.
- `## The scenarios of this work item` (2460 B) re-sends all the Gherkin to
  change three words from `(pending)` to `(bound)`. The Registered
  obligations block already carries those statuses.
- In `## The iteration you last assigned` (6532 B), the gate-binding list
  (4958 B) repeats the same five step locations for each of sc-003's four
  examples (about 900 B each).
- `# Registered obligations` repeats about 1016 B of boilerplate already
  delivered in inv-0006.

About 6.5 KB of the 11.5 KB adds nothing new. This material arrives as new
uncached input on the first request (4108 uncached tokens), so it costs
something, but it did not mislead the agent. The `where` values the agent
reported come from this list, so one entry per scenario, with the example
lines collapsed, would keep the useful part. The inherited inv-0004 history
(about 80 KB of native items 0–53) was all relevant orientation and was
served from cache.

### F6: Low, unexercised. Environment pointers in inv-0006 do not resolve from the agent's working directory

- **Views.** `environment:views` replaces inv-0004's block, which held the
  absolute architect-view path. The new value lists only
  `"path": "subs/workspace/subs/shared-ui/src/.ramify"` and
  `".../src/tests/.ramify"`, with coverage "1 coverage limits". The system
  prompt says "Relative paths in your tool calls resolve against [the working
  directory]", which is `…/shared-ui/src`, so these project-relative paths
  would resolve to a non-existent `src/subs/…`. The block also drops the
  architect view, although the procedure says "Use the architect view to
  locate behavior and ownership". It stays reachable through the inherited
  "Your module" brief and the system prompt's `.ramify-architect/` pointer.
- **Support paths.** `environment:supportPaths` names
  `subs/harness/src/prompts/local-architect.system.md` and similar files.
  These are harness checkout files; `subs/harness` does not exist in the
  collection-review project, so they are dead pointers for this agent
  (302 B).
- **Impact.** None observed: neither continuation used these paths.
- **Correction direction.** Deliver view paths in the same absolute form used
  at orientation, or label them project-relative. Keep the architect view in
  the replacement value. Do not deliver harness source paths to project
  agents, or mark them as provenance.

### F7: Low or informational. The procedure says completion is refused while reviews remain; the harness accepted it during in-flight reviews (inv-0010)

- **Location and excerpt.** The procedure says "`request-completion` is
  refused while … any ordinary scenario/review/gate requirement remains."
  Events 74–101 show rq-0001..0003 running concurrently. inv-0010's
  completion was accepted at 10:52:30.565 while rq-0003 (design) was still
  open; it finished at 10:52:58. [service.ts](../../../../subs/harness/src/run/service.ts)
  around line 5840 settles and reconciles reviews before the work-item gate,
  and ga-0003 ran at 10:53:00.
- **Impact.** No harm was observed. The procedure's wording does not match
  this behavior, and the brief did not tell the architect that reviews were
  in flight or that they would be reconciled before the gate. Its `done`
  reports were therefore made without review findings, which this design
  allows.
- **Correction direction.** Reword the procedure to say that completion is
  accepted and the gate waits for reviews to settle, which may reopen
  reconciliation. Optionally list in-flight reviews in the iteration-closed
  brief.

### F8: No issue found in inv-0006's information adequacy or instructions

Everything needed to assign was inherited or appended, the tool activation
was explicit, and the submission was accepted on the first call. The
assignment's scope, obligations, `citedElements` (all ten elements) and
starting points match the plan. No placeholders, unavailable tools or
inherited/current conflicts affected it.

Inherited material that did not support this task:

- The capability-handback paragraphs, about 1.5 KB of the 7143-byte
  procedure. They are conditionally relevant (they apply if an engineer
  reports `capability-needed`) and cacheable for later turns.
- The retired `submit_work_orientation` top-level tool (1287 B), kept for
  prefix stability and covered by the developer note.

## Observed effects

- **inv-0006.** One request (30.3 s model time; 12410 new input, 13824
  cached and 1086 output tokens), with no exploration (0 reads and 0
  searches recorded). It led to an accepted assignment (events 48–50),
  outline revision 1, an engineer run that bound all scenarios without fakes
  (events 60–62) and a passing ga-0002 (event 68). This is consistent with
  adequate delivery but does not prove it on its own.
- **First-call cache, inv-0006.** The prefix is preserved (instructions,
  tools, input and `prompt_cache_key` all equal), but only 13824 of the
  parent's 17526-token last prompt was read from cache, 38 s after inv-0004's
  last request. The cause of the shortfall is unknown from the retained
  evidence.
- **First-call cache, inv-0010.** 26112 of 30220 prompt tokens were cached
  (86.4%), against the parent's 26234-token prompt, after 2 min 59 s. Reuse
  was essentially complete.
- **inv-0010 sequence.**
  1. `inspect_git show` and `status` (n=46–49).
  2. Submission without `outline` (n=50), rejected (n=51; observation n=21).
  3. Resubmission with a full outline and a shortened summary (n=53),
     accepted (n=54).
  4. Outline revision 2 and three `done` reports (events 103–106).
  5. Reviews settled, and ga-0003 passed (events 108–110).

  The F1 omission caused the rejection; the evidence is the explicit
  reasoning plus an error naming exactly that field. The repair cost one
  request. No clarification or `consult_architect` call was made, and no
  information was rediscovered.
- None of F5–F7 coincided with any observed error.

## Suggested corrections

1. (F1, F4) In the capability-workflow procedure, or in a shared submission
   section both procedures include, describe `request-completion`: `summary`,
   a required outline revision with its fields, `revisionReason` and
   `reports`. Alternatively, make completion's outline optional with
   "keep last revision" semantics, as `assign` has. Mirror the requirement
   in the iteration-closed brief. To validate, rerun the same fixture and
   check that the first completion submission is accepted.
2. (F3) Pass the call ID into `SubmissionJudge.judge` at
   [runner.ts](../../../../subs/harness/src/steps/runner.ts) line 791, and
   add a test that a rejected submission's observation carries the
   transcript's `callId`.
3. (F2) Carry the zod field descriptions into the delivered JSON schema, and
   evaluate a structured `parameters` schema for the discriminator and the
   required top-level fields.
4. (F5) Send only the changed status lines for scenarios, do not re-send
   blocks that have not changed, and collapse Scenario Outline example
   bindings into one entry per scenario.
5. (F6, F7) Deliver view paths absolutely, or clearly marked as
   project-relative; keep the architect view in the `views` value; drop the
   harness `supportPaths` from agent-facing blocks; and reword the
   completion-refusal sentence to match how in-flight reviews are settled.

## Evidence gaps

- **Reasoning.** The visible reasoning is a provider summary (n=50, 430 B);
  inv-0006's thinking is empty, and the encrypted reasoning items cannot be
  read. The F1 cause rests on that summary plus the error.
- **Native requests.** Only the first native request of each invocation was
  examined in detail. inv-0010's later requests (`nativeLast` `1f705e64…`)
  were not compared item by item; the transcript and usage were used
  instead.
- **Cache shortfall.** Why only 13824 tokens were cached on inv-0006's first
  call, despite a preserved prefix, cannot be determined; the provider's
  cache behavior is not recorded.
- **Rejection join.** The rejection observation's call is joined by
  timestamp and attempt only (F3); it is unambiguous in this run.
- **Template source.** Source files were read at 5169117, the recorded
  revision. Delivery was verified from packets and native payloads, not
  inferred from templates.
