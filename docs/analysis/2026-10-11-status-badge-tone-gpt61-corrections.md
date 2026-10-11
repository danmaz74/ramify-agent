# Corrections proposed from the gpt-6.1-sol postmortem — 11 October 2026

This document proposes a correction for every harness finding of the
[gpt-6.1-sol postmortem](2026-10-11-status-badge-tone-gpt61-postmortem.md).
Each correction names the principle it serves, the change, what it preserves,
and the measurement that would show it worked. None is implemented. The
findings are numbered as in the postmortem; the metric defects and the
recurring smaller gaps follow them. For each correction that changes what an
agent reads, the delivered text and the proposed text are set side by side in
[2026-10-11-status-badge-tone-gpt61-prompt-changes.md](2026-10-11-status-badge-tone-gpt61-prompt-changes.md).

Two principles order the whole set. The
[harness principles](../harness.principles.md) say that every requirement in
a context is applied more weakly as the context grows, and that a fresh
session receives every input the harness holds, so it rediscovers nothing the
harness already knows. Most findings are a breach of one of those two
sentences: either the harness sent what the role could not use, or it
withheld, or contradicted, what it already held. The model in this run made
one tool call per request in three roles, so every pointer it took as an
instruction became a model round trip. That makes these corrections worth
more for such a model, but each stands on its own.

## 1. The completion's `outline`

**Principle.** A small closed set of outcomes is the whole protocol, and
results are need-to-know: a completion request should carry what changed,
not restate what the harness already holds.

**Change.**

- Make `outline` optional on `request-completion` in
  `subs/harness/src/work/submission.ts`, meaning "the current outline revision
  stands". The harness holds the last revision; a completion that changes
  nothing in it has nothing to send. Keep it required only when the work item
  has no outline yet, which the validator can check against the records. This
  matches what the model reasoned ("no need for an outline or to keep the
  original") and removes the rejection class rather than relying on prose.
- State the request's fields anyway in
  `subs/harness/src/prompts/local-architect-capability.procedure.md`, in the
  paragraph that begins "A completion request that leaves a scenario…": the
  obligation reports, and the outline only where it changed. The
  non-capability procedure already does this; the two should say the same.
- Pass the call ID to the judge in `subs/harness/src/steps/runner.ts:791`.
  `recorder.callId(request.toolName)` is computed on the next line, so the
  rejection observation can carry it and gain a deduplication key.

**Preserves.** The validator's whole-input check and every-error-at-once
answer.

**Parameters schema.** Every submission tool reaches the provider as
`{"type":"object","properties":{}}` with the schema in its description
(`subs/harness/subs/agent/subs/pi/src/session-operations.ts`). That is
deliberate, so the harness can report every error at once. A middle ground
would declare only the required top-level keys with `additionalProperties:
true`, so the provider enforces presence and the harness still validates the
rest. Plan 25's model never omitted a field under the current shape, so this
is a design question rather than a correction; decide it on the rejection
counts of the next runs.

**Measure.** Rejected submissions by field, per role, on the next run.

## 2. The design orientation and its fork

**Principle.** An oriented context is reused, never required; a fork
preserves the complete inherited context, and everything new is appended.
The fork's message currently withdraws what the orientation read and tells
the reviewer to read it again.

**Change.**

- In `subs/harness/subs/reviews/src/message.ts:104`, when the review forks
  from an orientation whose guidance hashes equal the request's, say so:
  "This session read these files in its orientation, at the identities
  listed; they count as read. Read one again only where its identity
  differs." Keep the procedure's rule that a reported concern needs current
  `snapshot_read` evidence for its ground; a reviewer with no concern then
  reads nothing twice, and one with a concern reads the one file it cites.
- Do not mark the orientation's guidance block "Withdrawn" in the fork. It is
  inherited history, which a fork preserves by definition.
- Let the orientation run outside the review slots. It reads no candidate
  and has no snapshot tools, so it is not a reader in the sense of
  `policy.reviews.concurrency`. With two slots and three requests recorded
  as code, scope, design, the design chain, the longest of the three, now
  waits for a slot. Starting the orientation as soon as the requests are
  recorded, and only the design fork in a slot, takes the chain off the
  critical path in the common case.

**Preserves.** The grounding rule and the orientation's reuse across several
design reviews of one work item.

**Measure.** Guidance re-reads per design review, and the review phase's wall
time from the iteration gate to the work-item gate. Validate on a plan with
two iterations in one work item, where one orientation serves two reviews.

## 3. The plan delivered twice, and read live

**Principle.** Trust follows provenance: the captured plan is the
human-reviewed artifact, and a run's analysis must come from it. Agent
invocations are idempotent, so an invocation reads captured inputs, not live
state.

**Change.** In `subs/harness/src/run/service.ts` (`taskBrief`, line 4288
on), `requirements` defaults to the captured plan's text, and
`taskSupportSections` then strips the identical `<plan>` block. Invert it:
deliver the plan once, in the plan block, headed by its captured path
(`plans/<plan>/.harness/jobs/<run>/input/plan.md`) and hash, and make
`brief:requirements` a one-line pointer to that block. For the catalog
extractor, whose procedures require reading the captured file, state that the
block is that file verbatim, so the read is not needed. Drop the `for {}`
clause from the objective line in `subs/harness/src/run/task-brief.ts:72`
when the work object is empty.

**Preserves.** The extractor's rule of working from the captured plan.

**Measure.** Plan-file reads by the intake, analysis and check roles (should
be zero), and the first model call's duration in each.

## 4. Pointer blocks and environment blocks

**Principle.** Bounded context: detail is retrieved when needed, never
preloaded, and every requirement in a context dilutes the others. A pointer
is information; it is not an instruction to read.

**Change.**

- Reword `subs/harness/src/work/starting-inputs.ts:62-64`. The snapshot
  variant says "Read these project-relative references with
  snapshot_read/snapshot_list"; the other says "Inspect their configuration".
  Replace both with a statement: "The gate runs these declared checks. Their
  configuration is at the paths below; open one only when a concern or a
  focused command depends on it." Apply the same to the test-pointer block in
  `subs/harness/subs/reviews/src/message.ts:121` ("inspect with
  snapshot_list" becomes "the candidate's test areas; read a file there when
  a concern needs it"). This block already stays out of design reviews; keep
  that.
- Select environment blocks per role and tool set at
  `subs/harness/src/run/service.ts:4317-4322`:
  - `views` only for roles whose tools can read them, so not for snapshot-only
    reviewers and not for the non-functional coordinator;
  - `supportPaths` dropped. They are harness-repository paths no target
    project agent can resolve; the package name and hash are already in the
    manifest for provenance;
  - `limits` reduced to the invocation's own bounds (absolute and idle time,
    command timeout, rejected submissions per turn, budget returns for
    engineers), not the run's whole policy;
  - `candidate`, `snapshot` and `cucumberConfiguration` omitted when null;
  - the "Current value; replaces any earlier value for this key" banner only
    on a continuation where an earlier value exists, never in a fresh session;
  - the absolute project root stated once, with project-relative paths
    elsewhere (it appears 27–35 times in the architect and engineer
    messages).
- In the engineer's message, deliver the focused Cucumber command once; the
  configuration block repeats it.

**Preserves.** Every pointer the roles used, the declared checks, and the
cacheable role instructions, which are unchanged.

**Measure.** First-request bytes per kind, and configuration-file reads per
kind, on a repeat. The scope review's model requests are the sharpest signal:
seven here, one in Plan 25.

**Open design question.** The scope review forks from the assignment, so the
assignment's author reviews its own scope with 134 KB of inherited architect
history, of which about 5 KB bears on scope. The inherited prefix is cached
and cheap per request, so the cost is small until the fork makes extra
requests. Whether scope should be reviewed by a fresh session with the
assignment's outline and write scope, or stay a fork, is a question for the
operator; the data here favors neither strongly.

## 5. View navigation

**Principle.** A module carries its own onboarding, and the harness sends
what it knows: it holds the module index, so it knows which view directories
exist and which records the coverage limits touch.

**Change.**

- `subs/harness/src/prompts/local-architect.system.md:40-41` names
  `.ramify/children` for every module. Move the concrete view paths into the
  task's `environment:views` block and list only directories that exist for
  the module; keep the system prompt generic. For `shared-ui`, which has no
  children, no `children` path is listed and the two failed greps do not
  happen.
- `coverageLimitsOf` in `subs/harness/subs/evidence/src/views.ts:40` returns
  counts (`cut: 11`, `detailsUnavailable: 4`). The index can name the records
  that carry those markers. Deliver the names, or the statement that none
  touches the work item's modules, in the views block. This also removes the
  initial architect's whole-view grep for the markers (15.5 KB) and the
  engineer's two `_meta.json` reads, which Plan 25 recorded.
- Add two sentences of layout to the views block: the pages mirror source
  paths with `.md` added, and reading a page answers more than grepping the
  view. The orientation's `grep "."` dumps and its `support` search (8.7 KB
  of "supporting" count lines) are the cost of not saying this.
- Two items belong to the toolkit, not the harness: the view README's
  `<module>/module.json` path does not match the directory layout, which
  drops the root module's name, and `ReviewStatus` is shown only as
  `z.infer<typeof reviewStatusSchema>` with its values in a separate entry.
  Report both to the toolkit; until then the layout sentence above covers the
  first.

**Measure.** Tool errors per architect invocation, and returned bytes per
view search.

## 6. `snapshot_diff` on an unchanged file

**Change.** Answer "unchanged in the candidate" with the file's status
instead of an error. The three refused diffs were the non-functional
coordinator checking paths the message already listed as unchanged; an
answer, not an error, is the right response to a correct question.

**Measure.** Tool errors per reviewer and coordinator invocation.

## 7. The smaller recurring gaps

- **Context selection.** The selector's reasons, conditions and uncertainty
  are recorded but not delivered; the package shows "Conditions: none
  recorded" from the catalog. Rationale that is recorded is meant to be
  used: render the selection's reason, conditions and uncertainty beside the
  catalog element's own, under separate labels, so a narrowing condition
  reaches the engineer and the plan's own qualifications are never displaced
  by the selector's reading. Give "You may read a captured document" a
  path the selector's empty workspace can resolve, or state that the
  elements are quoted whole and no read is needed.
- **Continuations.** The completion task re-sent 6.5 KB of unchanged
  material: the bounds block, every scenario's text, and sc-003's bindings
  four times. A continuation carries deltas; reference an unchanged block by
  key and send only what changed. "Earlier outlines: 2" is a count; the
  outline revision is in the session, so say "revision 1 stands" or nothing.
- **Completion wording.** The procedure says `request-completion` is refused
  while a review requirement remains; the harness accepted it during
  in-flight reviews and settled them before the gate. The behavior is right;
  make the text describe it.
- **Non-functional assessment.** Remove the action paragraph when no action
  tool is offered. Either add a `requirement` field to the assessment schema
  or drop the instruction to preserve the requirement's wording. List the
  changed module's callers in the starting points; the architect view's
  `usedBy` holds them.

## Metric defects

**Principle.** Missing evidence is not zero, and a metric publishes its
coverage.

- **`outsideScopeSearches`.** Nineteen of twenty-one searches have a null
  outside-scope status, and the metric reports 0. Two corrections, in order
  of value: fill the status at observation time, since the `tool-start`
  observation records `requestedScope` and the invocation's scope is known;
  and, where it stays null, report the metric as `partial` with the known
  count and coverage, as `degraded-starts` already does.
- **`evaluation.invocations[].request`.** It is null for every invocation,
  including the four reviewers. `review-attempt-started` records the request
  and the invocation; join them in `subs/harness/src/projections/metrics.ts`
  (lines 373 and 526 read `invocation.work.request`), or set `work.request`
  when a review attempt starts.
- **Lineage.** `lineage/1` measures forks of the global architect's context
  generation only; the three local forks of this run are in no lineage
  metric. Add a `fork.local` group for forks whose source is a local
  architect or orientation session, with the same five measures, so the next
  postmortem reads first-call reuse from the policy rather than from raw
  observations.
- **Searches.** Count a failed search ("Path not found") separately from a
  search, and count pi's `grep` "No matches found" as a zero-match search
  (Plan 25's recommendation; not exercised in this run).
- **Evidence retention.** Retain the run-time view revision listing with the
  job, so a postmortem need not reason from post-run views.

## The model's serial tool calls

The initial architect, the scope reviewer and the design reviewer made one
tool call per request although every request allowed parallel calls. That is
model behavior, and the harness cannot force batching. It can reduce the
number of things worth fetching, which findings 3–5 do, and it can say in the
role instructions that independent reads belong in one turn. That sentence is
a hypothesis with a cheap test: tool calls per request, by role, on the next
run of each model.

## Validation

One repeat of `status-badge-tone` on each model at the corrected revision
answers every measurement above but one. The pairs to compare are first-request
bytes and configuration reads per kind (findings 3–4), rejected submissions by
field (1), guidance re-reads and review-phase wall time (2), tool errors per
invocation (5–6), and the metric states (`partial` where coverage is short,
`request` filled, local forks measured). The exception is finding 2's reuse of
one orientation across two design reviews: `status-badge-tone` has one work
item with one iteration, so it produces one design review and cannot show the
reuse. That needs a second case, a plan with two iterations in one work item,
run once at the corrected revision; it answers guidance re-reads per design
review for the second review and nothing else. A repeat on `gpt-5.6-sol:high`
at the current revision, before the corrections, would separate the model's
share of the 145 s increase from the harness's; it costs one paid run.
