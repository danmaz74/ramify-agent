# Plan 28: prepared guidance sessions for design review

**Date:** 2026-10-09. **Status:** proposed, not started. The source inventory
below was inspected at `474ffa58` (Plan 25 merged).

## Outcome

A design review starts from a reviewer session that already holds the
selected guidance, without any model call to prepare it. The harness creates
that session, appends the reviewer role and the full text of the selected
principles documents and READMEs with their hashes, and keeps the resulting
point. Each design review forks that point and receives only its review task:
the changed paths, the patches and the instruction to judge them against the
guidance above. A concern may name a delivered guidance file as its ground
when the candidate holds the same bytes, so the reviewer does not re-read
guidance it already holds.

There is no orientation invocation, no orientation submission and no summary.

The motivation is the [Plan 25 run postmortem](../../analysis/2026-10-09-status-badge-tone-plan25-postmortem.md),
finding 2. In run `20261009T193340Z-51f42e` the orientation (inv-0010) spent
one model call (4,975 new input tokens, 252 output tokens, 7.1 s) producing an
account of the guidance that nothing reads. The design review fork (inv-0012)
then received the guidance block as withdrawn and re-read all three READMEs
(13,824 bytes), as its rules require.

## Current implementation to build on

- `RunService.reviewRequest` (`service.ts` ~1099–1115) selects guidance with
  `guidancePaths` and keys the orientation with `orientationKey`
  (`subs/reviews/src/inputs.ts`): guidance refs and hashes, reviewer package
  hash, agent, model, reviewer context policy, scope (project root, work item,
  read-only authority) and execution settings.
- `RunService.reviewStart` (~1458–1502) forks the orientation's point. It
  requires the point to come from an accepted invocation: the source session
  must list the invocation, the invocation's outcome must carry the same ref,
  and `hasPoint` must find it. Otherwise it degrades to a fresh review.
- `RunService.orientation` and `orient` (~1510–1583) make one orientation
  per key with `runInvocation`: system prompt `reviewer-orientation.system.md`,
  first message `orientationMessage(guidance)`, tool `submit_orientation`,
  validator `validateOrientation`. The record
  (`ramify-agent.review-orientation/1`, `reviews/records.ts` ~170–190) keeps
  `invocation`, `session`, `ref`, `outcome` and `summary`; the summary has no
  reader.
- The agent port already supports a model-free start: `SessionOperations`
  (`subs/agent/src/interfaces/session-operations.ts`) has `create`
  (instructions and tool declarations, no task), `appendContext` and `fork`
  from a `turn` or `checkpoint` point. `HarnessSessionOperations` exposes
  `start` (which runs a task) and `append`, but no harness-level create
  without a task. Context-package appends already produce checkpoint points
  that later invocations continue from (inv-0006 in the run above).
- Fork briefings withdraw every inherited briefing section the new brief does
  not restate, except for context-selector forks that set
  `retainInheritedSections` (`run/session-operations.ts` ~207–211). This is
  why the design fork received `brief:support:design-guidance` as withdrawn.
- `validateReviewSubmission` (`subs/reviews/src/submission.ts` ~86–96) refuses
  a concern whose ground was not answered by `snapshot_read` in the attempt.
  `concernBindings` (`service.ts` ~1424–1445) binds the ground's hash from the
  same read map. Recovery (~1390–1404) rebuilds that map from the candidate.
- The reviewer role (`reviewer.system.md` lines 39–47), the design procedure
  (`design-review.procedure.md` steps 1 and "What a concern is") and the
  design message (`subs/reviews/src/message.ts` ~95–99, "If this session has
  not read one of them yet, read it with `snapshot_read`") all state the
  read-in-this-review rule.

## Changes

### 1. Prepared guidance session

Add a harness operation that creates a session and appends context without a
task, returning a retained point. Use it in place of `orient`:

1. Create the session with the reviewer's own system prompt
   (`reviewer.system.md`) and the design reviewer's tool declarations
   (snapshot tools and `submit_review`), so a fork needs no role or tool
   change. Iteration 1 confirms that these declarations do not depend on the
   candidate; if they do, declare them at the fork as today.
2. Append one guidance block: each selected file's path, sha256 and full
   text, introduced as the guidance design reviews of this project are judged
   against. It asks for nothing and has no submission.
3. Record the prepared point under the existing key, once per key, with the
   same concurrency guard (`run.orienting`).

The record becomes `ramify-agent.review-orientation/2`: key, guidance refs
and hashes, request, session, ref, outcome (`prepared` or `failed`) and
reason. `invocation` and `summary` are removed. A `/1` record from a run that
started before this change remains readable and forkable through its ref.

Record the prepared session so transcripts, session lineage and metrics show
it: a session-opened event marked as prepared, a transcript holding its
instructions and appended block, and no invocation. Session counts include
it, as every session counts; it has no usage.

`reviewStart` forks the prepared point directly. The invocation checks it
applies to accepted invocation points do not apply to a prepared point; it
checks the recorded ref and `hasPoint` instead. A fork relation names the
prepared session with no invocation. A missing or failed preparation
degrades to the fresh design review described below, as today.

### 2. Design review task without withdrawal or re-reading

- The design fork keeps the inherited guidance block current. Extend the
  inherited-section retention used by context-selector forks to design-review
  forks of a prepared session, rather than special-casing the key.
- The design task section lists the guidance refs and hashes as the
  guidance above, and drops the instruction to read them with `snapshot_read`.
- The fresh fallback includes the same guidance block (paths, hashes, full
  text) in its message, so forked and fresh design reviews follow one rule.
- `design-review.procedure.md` step 1 and "What a concern is" say that a
  concern's ground is a guidance file delivered above or a file read with
  `snapshot_read` in this review. `reviewer.system.md` states the same general
  rule: a file read with `snapshot_read`, or guidance the harness delivered
  with its hash.

### 3. Delivered guidance as a ground

Pass the delivered guidance (refs and hashes) to `validateReviewSubmission`
and `concernBindings`. A ground naming a delivered guidance path is accepted
when the candidate's file at that path has the delivered hash; its binding
records that hash. A path whose candidate bytes differ is refused with an
error that says so. Recovery binds such grounds the same way. Grounds read
with `snapshot_read` behave as today. Credibility classification is
unchanged: it depends on the file, not on how it reached the reviewer.

### 4. Removals

Remove `reviewer-orientation.system.md`, `renderOrientationPrompt`,
`orientationMessage` (replaced by the prepared block builder),
`submit_orientation`, `orientationJsonSchema`,
`orientationSubmissionDescription`, `validateOrientation`, the
`design-orientation` task kind from `prompts/tasks.ts`, and the orientation
submission schema. Keep enum values that historical transcripts and records
use readable where protocol schemas parse retained runs
(`interfaces/protocol/transcripts.ts`, `run/records.ts`).

## Decisions for Dan

1. **Name.** "Design review" judges conformance to the principles documents
   and module READMEs. Renaming it (for example to "architecture review")
   touches the review kind, prompts, records, protocol and docs. Suggestion:
   decide separately; this plan keeps the current name.
2. **Reuse breadth.** The key includes the work item and the exact guidance
   selection derived from each iteration's changed paths, so a prepared
   session is reused only by later iterations of one work item that touch the
   same directories. The prepared session holds no work-item content, and the
   guidance hashes already pin its bytes. Suggestion: remove the work item
   from the key, so work items whose changes select the same guidance share
   one prepared session. Widening the selection itself is not proposed.

## Implementation

Related work: [Plan 29: common prompt passages](../29-common-prompt-passages/main-plan.md)
revises task composition and replaces environment JSON using the existing delivery
mechanism. It preserves this plan's separate ownership of prepared guidance and
candidate-hash grounding. Neither plan requires the other's implementation;
serialize shared prompt/session/service edits and verify their combined behavior
when integrating both.

One change, with the configured full audit through ramify-audit at the start
(base) and at the end (final gate).

Implement changes 1–4 and update `docs/harness.spec.md` (review inputs and
orientation), `docs/architecture/check-findings.md` (the design orientation
paragraph), the reviews module README and any metrics documentation that
names the orientation invocation. Remove obsolete tests.

Focused tests use the scripted agent:

- One design review prepares a session with no model call and forks it. A
  second review of the same key forks the same point without preparing again,
  and concurrent attempts of one key prepare once.
- A failed preparation degrades to a fresh review that carries the guidance
  block. A `/1` record remains forkable.
- Session records and metrics show the prepared session without usage.
- The fork's delivered inputs show the guidance block inherited and not
  withdrawn.
- A concern grounded in delivered guidance with a matching candidate hash is
  accepted without a `snapshot_read`, and one whose candidate file changed is
  refused. A `snapshot_read` ground still works, and recovery binds both
  kinds.

Before the final audit, run `npm run type-check` and `npm run check:self`.

## Acceptance and boundaries

- No model call prepares a design review session, and no orientation
  submission or summary exists.
- A design review fork receives the guidance as current inherited context and
  can ground concerns in it without re-reading.
- Grounds stay verified: a delivered guidance ground binds only when the
  candidate holds the delivered bytes.
- Code and scope reviews are unchanged.
- Tests use the scripted agent and never call a model. A real trial on the
  status-badge-tone plan, or on a plan with several iterations in one work
  item, is a development check for Dan to request, not an acceptance gate.
