# Plan 28: prepared guidance sessions for design review

**Date:** 2026-10-09. **Reviewed:** 2026-10-16 against `091ca382`.
**Status:** proposed; two self-run attempts failed before delivering the outcome.
**Target:** ramify-agent. Architects determine assignments and iterations.
This review does not start execution.

## Outcome

A design review starts from a reviewer session that already holds the
selected guidance, without any model call to prepare it. The harness creates
that session, appends the reviewer role and the full text of the selected
principles documents and READMEs with their hashes, and keeps the resulting
point. Each design review forks that point and receives its complete current
review task, including candidate identity, assignment intent, findings, changed
paths, patches, procedure and submission requirements. A concern may name a
delivered guidance file as its ground
when the candidate holds the same bytes, so the reviewer does not re-read
guidance it already holds.

New preparation has no model invocation, orientation submission or generated
summary. Historical orientation records retain those original facts.

The motivation is the [Plan 25 run postmortem](../../analysis/2026-10-09-status-badge-tone-plan25-postmortem.md),
finding 2. In run `20261009T193340Z-51f42e` the orientation (inv-0010) spent
one model call (4,975 new input tokens, 252 output tokens, 7.1 s) producing an
account of the guidance that nothing reads. The design review fork (inv-0012)
then received the guidance block as withdrawn and re-read all three READMEs
(13,824 bytes), as its rules require.

## Implementation context

The original inventory was inspected at `474ffa58`; these pointers were refreshed
against `091ca382`. Recheck them at execution. They are navigation context, not a
required implementation breakdown. Paths below are relative to `subs/harness/`.

- `src/run/after-handling.ts` selects captured guidance and calls `orientationKey`
  from `subs/reviews/src/inputs.ts`. The current key includes guidance paths/hashes,
  reviewer package, executor, model, context policy, scope (including work item)
  and execution settings.
- `src/run/service.ts`: `orientation` and `orient` still dispatch an orientation
  model task; `reviewStart` verifies its invocation-backed point. Missing reusable
  history can fall back fresh, while unavailable required evidence stays explicit.
- `src/reviews/records.ts` defines `ramify-agent.review-orientation/1`, with its
  invocation, session, reference, outcome and summary. `src/run/records.ts` defines
  both invocation- and append-based session points. Review-specific inputs in
  `src/steps/inputs.ts` still require a source invocation for a fork; reuse the
  existing point support where it fits rather than inventing another point store.
- `subs/agent/src/interfaces/session-operations.ts` already exposes model-free
  `create`, `appendContext` and `fork`. `src/run/session-operations.ts` exposes
  harness task `start` and context `append`, but no model-free harness create.
- `src/steps/reviewer.ts` already retains inherited briefing sections through
  `retainInheritedSections` in the review step constructor. Preserve that
  behavior; it does not itself implement model-free preparation or delivered
  guidance as a concern's ground. The withdrawal observed in the Plan 25 run
  is historical.
- `subs/reviews/src/submission.ts`: `validateReview` requires a current snapshot
  read for grounds. `src/run/review-finish.ts` binds that read's hash and completes
  both automatic and manual reviews. `src/steps/review-step.ts`, `inputs.ts` and
  `run.ts` also derive and execute review inputs.
- `src/prompts/reviewer.system.md`, `design-review.procedure.md` and
  `subs/reviews/src/message.ts` state the current grounding rule. Package/task
  delivery is in `src/prompts/packages.ts` and `tasks.ts`. Session projections and
  usage are owned by the existing `subs/projections/` and `subs/kpi/` children.

## Changes

### 1. Prepared guidance session

Add a harness operation that creates a session and appends context without a
task, returning a retained point. Use it in place of `orient`:

1. Create the session with the reviewer's own system prompt
   (`reviewer.system.md`) and the design reviewer's tool declarations
   (snapshot tools and `submit_review`), so a fork needs no role or tool
   change. Prepare only declarations independent of the candidate; otherwise
   declare them at the actual review. Bind tool handlers, validator, execution
   policy and submission destination to each review's own request and frozen
   candidate. A prepared session gives no execution or submission authority.
   Supply the current procedure through ordinary task-block delivery.
2. Append one guidance block: each selected file's path, sha256 and full
   text, introduced as the guidance design reviews of this project are judged
   against. It asks for nothing and has no submission.
3. Record the prepared point once per compatible key, including concurrent
   requests. Remove the work item from the key, as already decided. Retain the
   guidance paths/hashes, reviewer package, executor, model, context policy,
   project root, review authority and execution settings that determine reuse.
   Reuse is within one run; changed guidance requires another point.

The prepared context contains no work-item assignment, candidate patches,
findings or task-specific authority. Its originating request is provenance,
not reusable task content. Each review receives its own complete task.

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

- The design fork keeps the inherited guidance block current. Preserve existing
  inherited-section retention for design-review forks when using prepared points,
  rather than special-casing a briefing key. The inherited prefix stays intact.
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

Pass verified delivered guidance (refs and hashes) to `validateReview`
and `concernBindings`. A ground naming a delivered guidance path is accepted
when the candidate's file at that path has the delivered hash; its binding
records that hash. Establish full-text delivery for the actual attempt, directly
or through its exact retained point; paths and hashes alone are insufficient.
A missing or mismatched file is refused as a delivered-only ground with an
explanatory error. A current successful `snapshot_read` remains an independent
way to ground that path, including after an older delivered copy became stale.
Use canonical candidate paths and existing snapshot restrictions, never the
live working tree. Delivery alone does not establish changed-path inspection.
Recovery binds such grounds the same way. Credibility classification is
unchanged: it depends on the file, not on how it reached the reviewer.

### 4. Removals

Remove from ordinary active scheduling and delivery
`reviewer-orientation.system.md`, `renderOrientationPrompt`,
`orientationMessage` (replaced by the prepared block builder),
`submit_orientation`, `orientationJsonSchema`,
`orientationSubmissionDescription`, `validateOrientation`, the
`design-orientation` task kind from `prompts/tasks.ts`, and the orientation
submission schema. Retain parsing and narrowly needed compatibility code for
historical transcripts, records and supported captured step inputs. Do not
delete an enum or constructor still required by those paths.

Automatic execution, imported and manually derived review steps, rendering,
effective prompt manifests and post-submission handling must implement the same
delivery and grounding rules. Prepared points have no source invocation; update
these consumers without inventing one or weakening invocation-backed checks.
Prepared-session accounting must reach the existing KPI and projections owners
through their contracts, not parent-local replacements.

Preparation and its point/delivery bindings use the existing durable boundaries.
Recovery reuses committed review results and bindings without rerunning completed
reviews. A lost reusable session has a complete fresh fallback. Missing candidate
or guidance bytes remain unavailable review inputs, never passing coverage.
A usable legacy `/1` point retains its original source checks; supply current
procedure/tool updates and any missing guidance without rewriting its prefix.

## Settled decisions

The user settled both decisions before the October 10 self-run: keep the name
**design review**, and remove work-item identity from the prepared-session key.
Different work items in one run may share a point when its other identities
match. Keep the existing bounded guidance selection and its exclusions; this
plan does not widen selection or authorize cross-run reuse.

The two self-runs delivered no usable implementation. Their failures and these
decisions are recorded in `docs/analysis/2026-10-10-plan28-self-run.md`.
Recheck present prerequisites instead of importing that report's old workarounds.

## Implementation

Plan 29's common prompt composition is existing behavior at this reviewed
baseline. Use the current delivery mechanism rather than reimplementing it.
Prepared guidance and candidate-hash grounding remain this plan's responsibility.

Architects choose decomposition, owners and iterations. Preserve real dependency
stages and keep behavior with its verification. This plan prescribes no count.

Implement changes 1–4 and update `docs/harness.spec.md` (review inputs and
orientation), `docs/architecture/check-findings.md` (the design orientation
paragraph), the reviews module README and any metrics documentation that
names the orientation invocation. This explicitly extends the current review
contract: verified full guidance delivery becomes an alternative to a current
snapshot read for grounding. Update prompts, interface documentation and public
projections consistently. Replace obsolete tests while preserving coverage of
historical compatibility.

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
  accepted without a `snapshot_read`; a stale delivered-only ground is refused.
  A current `snapshot_read` ground still works, and recovery binds both kinds.
- Cross-work-item/concurrent reuse shares only guidance; each review binds its
  own tools, candidate and task. Changed guidance or incompatible execution or
  authority settings prevent reuse.
- Automatic and manual steps deliver equivalent guidance, validate grounds and
  complete through the shared handling. Recovery retains accepted submissions
  without another model call; lost preparation uses fresh complete inputs.

Follow `docs/testing.spec.md`: ordinary tests script external Git, CLI, audit and
command answers. Actual provider/kernel claims need exact reviewed registration
in `src/tests/test-boundaries.json`. Run focused checks, `npm run type-check` and
`npm run check:self`. Baseline and iteration audits follow default committed
audit policy. Final verification requires a full audit of the configured suite,
including required nested projects, under `docs/harness.spec.md`; state that
reason before requesting scope overrides. Preserve configured checks/projects.
Audit health and the architect's semantic completion judgment remain separate.

## Acceptance and boundaries

- No model call prepares a new design review session, and new preparation has
  no orientation submission or summary. Historical facts remain readable.
- A design review fork receives the guidance as current inherited context and
  can ground concerns in it without re-reading.
- Grounds stay verified: a delivered guidance ground binds only when the
  candidate holds the delivered bytes.
- Code and scope reviews are unchanged.
- Tests use the scripted agent and never call a model. A real trial on the
  status-badge-tone plan, or on a plan with several iterations in one work
  item, is a development check for Dan to request, not an acceptance gate.

```gherkin
Scenario: Design review starts with complete guidance and no preparation call
  Given an audited candidate and available selected guidance
  When its design review is scheduled
  Then guidance preparation dispatches no model task
  And the reviewer receives the complete guidance and its current review task
  And its recorded start forks a prepared point without an invented source invocation
  And preparation appears as a session with no invocation usage

Scenario: Matching work items share guidance without sharing task evidence
  Given two work items in one run have the same guidance and compatible review settings
  When their design reviews request preparation concurrently
  Then one prepared point serves both reviews
  And the shared context contains neither work item's task evidence
  And each review uses its own candidate tools, assignment and findings

Scenario: Changed guidance prevents reuse of an older prepared point
  Given a prepared point contains one guidance selection and its hashes
  When another review selects different guidance paths or bytes
  Then that review does not reuse the older point for the changed guidance
  And it receives the complete selected guidance with the current hashes

Scenario: Unavailable preparation has a complete fresh fallback
  Given a review's candidate and selected guidance are readable
  And preparation fails or its retained point is unavailable
  When the design review starts
  Then a fresh reviewer receives the same complete guidance and current task
  And the actual start and reason are recorded
  And no orientation model task is required

Scenario: Verified delivery grounds a concern without another read
  Given a reviewer received a guidance file's complete text and hash
  And the file in the frozen candidate has that hash
  When it submits a concern grounded in that file without reading it again
  Then validation accepts that grounding and binds its candidate hash
  And the existing changed-path inspection rules still apply

Scenario: A current snapshot read can replace stale delivered evidence
  Given a review attempt has an older delivered copy of a guidance file
  And its hash differs from the file in the frozen candidate
  When a concern cites that file with no current snapshot read
  Then validation refuses that grounding with a mismatch explanation
  When the reviewer reads that file through the current candidate's snapshot tool
  And resubmits its concern
  Then that current snapshot read can establish the ground

Scenario: Recovery retains completed review judgments
  Given a review has committed its accepted submission and ground bindings
  When the run recovers with the prepared session unavailable
  Then that submission and its bindings remain without rerunning the review
  And a later review can fall back to complete fresh inputs

Scenario: Historical orientation remains usable without rewriting its prefix
  Given a version one orientation has a usable invocation-backed point
  When a supported design review starts from that point
  Then the legacy invocation and usage remain historical facts
  And the fork retains its original source checks and inherited prefix
  And current delivery supplies any missing procedure and guidance
  And grounding uses the current candidate evidence rules

Scenario: Manual and automatic reviews apply equivalent grounding rules
  Given equivalent design-review inputs in automatic execution and a supported manual step
  When their effective tasks are rendered and grounded concerns are submitted
  Then both receive complete selected guidance with matching delivery provenance
  And both validate and bind grounds against their own frozen candidate
  And neither requires an orientation model task
```

Also verify that unavailable candidate/guidance inputs stay uncovered, invalid
snapshot paths remain refused, and current reads can ground nonguidance files.
Preparation alone and shorter prompts establish no measured cache, token or
elapsed-time savings.

## Execution placement

This remains the reviewed design plan. Before a full harness run, package its
self-contained execution input at
`plans/28-design-review-guidance-sessions/plan.md`, keeping historical reports
and authoring notes outside the captured input directory. No naming or
reuse-breadth decision remains open.
