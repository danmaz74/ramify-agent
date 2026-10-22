# Remove readers for retired continuation, policy and limit forms

## Problem and intended result

The harness still reads, adopts or tolerates seven record forms that no
current code produces: copied successor runs, inline assisted documents and
`git-exact-text/1` reviews, `run-policy/7` runs, count-forced non-functional
exhaustion, ignored rejection bounds, run snapshots without breakpoint and
repair state, and write scopes without a captured assignment boundary.
Together they are about 1,300 lines of production code and tests. The
verified inventory is
[Removable compatibility layers](../../docs/analysis/2026-10-22-removable-compatibility-layers.md)
(background) with its
[ramify-agent report](../../docs/analysis/2026-10-22-removable-compatibility-layers/ramify-agent.md)
(background, exact paths and commits); this plan covers its findings 2, 3, 5,
6, 9, 10 and 11, together with the `recovery resume` command fields the
executor ignores.

The repository rule in
[Run state and compatibility](../../AGENTS.md#run-state-and-compatibility)
(required) makes run state disposable: a finished run stays finished, an
unfinished run restarts from its plan on current code, and nothing keeps
reading an older run-state form. This plan applies that rule to the seven
layers. The result is one current form per durable record kind, same-run
continuation only, and no policy adoption. Fresh runs, steps, debugger
exchanges, assisted assessments and projections keep their current behavior.
Records in a retired form stop being readable.

The inventory's other five layers, the earlier session layout, `/1` delivery
manifests and intents, inline-body session-store transactions, `scope-size/1`
and Pi `0.87.1`, are removed by the separate plan
`plans/compatibility-layer-removal-records/plan.md`, which runs first. This
plan does not depend on it.

The beneficiaries are the harness maintainers and the architects and engineers
the harness runs on this project: fewer formats to understand, fewer branches
to keep correct, and smaller prompts and views. No long-lived committed file
changes shape, so no conversion script is needed.

**Execution:** assisted. A native coordinator and Sol workers implement the
iterations below, and ramify-agent assesses each committed candidate and the
cumulative result. The requirements and acceptance are the assessed input; the
iteration breakdown is a proposal the coordinator adapts to evidence.

## Required behavior

### One current form per durable record kind

Each record kind below has exactly one accepted form, the one current code
writes. Readers, schemas, protocol types and projections accept that form only.
Optional members that exist solely because an earlier form omitted them become
required. Defaults that filled in earlier records are removed.

| Record kind | Only accepted form |
| --- | --- |
| Run policy | `run-policy/8` with captured continuity and recovery members |
| Write scope | the current captured assignment boundary with `nestedDeclarations` |
| Run snapshot response | includes `automaticRepairs`, `breakpoint` and `recovery`, empty or null when absent |
| Assisted document capture | `storage: 'git-references'` |
| Assisted review verification | `candidate-inspection/1` |

### Continuation stays within the run

`restart prepare` continues a failed or interrupted run by appending
`job-continued` to the same run, as it does today. The successor-import path
is removed: `restart-prepared` events, import decoding, provenance
authentication, imported workflow installation, negative-sequence handling,
restart initialization events and successor-only projection provenance. A run
log is read as a single run's own events.

### Policies are captured, never adopted

A run executes under the policy captured at its start. Admission accepts only
the current policy version, with its continuity and recovery members present.
Adoption events, effective-policy overlays and adoption hooks in automatic
runs, manual steps and debugger exchanges are removed. A debugger message or
resume no longer records policy adoption.

### Rounds and judges carry no retired limits

A repaired, unresolved non-functional round continues, including when it is
the last round of the captured maximum. Exhaustion solely because a repaired
round reached the maximum is no longer recognized on replay. The
`forcedLegacyExhaustion` and `legacyCountClosure` paths and their maximum
plumbing are removed. Ordinary exhaustion without a repair, external candidate
invalidation and semantic round validation remain.

Submission and tool-input judges take no rejection bound and expose no
exhaustion accessor. Engineer equipment and manual sessions construct them
without bounds; dead callbacks that depended on exhaustion are removed. Other
`invalid-submission` outcomes are unaffected.

### Assistance reads current captures only

Assessment resumes from checkpoints whose documents are git references and
whose reviews are `candidate-inspection/1`. The inline-document qualifier, the
saved-inline-document branch, historical discovery regeneration under an
earlier capture policy and the old-marker review verification branches are
removed. Current candidate-source verification and reconciliation of a current
run's findings remain.

### Recovery commands carry only fields the executor reads

The `recovery resume` executor ignores occurrence, revision and repair
declarations. The CLI client and argument parser stop constructing and
accepting `--occurrence`, `--expected-revision` and `--repair-file` for that
command, and the command keeps `--command-id`. The debugger commands keep their
own pause and revision arguments, which the executor does read.

### A retired form is refused, not converted

When the harness opens a record in a retired form while executing, projecting
or continuing a run, it fails that operation with a diagnostic naming the
record and the expected form. It does not convert, default or skip the record,
and it does not need to recognize which retired version it met.

## Constraints and scope

- Run state from earlier harness versions is not a compatibility target, per
  [Run state and compatibility](../../AGENTS.md#run-state-and-compatibility).
  Long-lived files this plan must keep readable: `ramify-agent.json`,
  `ramify-audit.json`, `src/tests/test-boundaries.json` and retained evidence
  under `docs/`. None of them changes shape here.
- This is a removal. Do not relocate a retired reader, keep it behind a flag,
  or replace it with a generic multi-version decoder. The current form's
  reader, schema and tests remain and are the only ones left.
- The following remain effective and are not in scope: stored role spellings
  `global-fork`, `contract-engineer` and `nonfunctional-repair-engineer`, which
  current code still writes; `restart prepare` and `restart inspect` as same-run
  continuation; the optional `settlementConfirmed` member, which current code
  still omits; review-orientation records and their optional
  `transportInvocations`; optional `assignment.obligations`; review
  `inspected`, `missing` and `coverageGap` declarations; same-run crash
  recovery, effect deduplication, fresh-session reconstruction and retries.
- The descriptive-identifier contract that the merged Plan 42 work introduced
  is current behavior, not a retired form. Its records, schemas and prompts are
  not touched by this plan beyond what a removal above requires.
- Keep the toolkit dependency direction, the single durable writer, module
  contracts and the test boundaries. Do not import companion source or edit
  generated views.
- Tests that exist only to protect a retired form are deleted with it. Tests
  of current behavior that used an old-form constructor are rewritten against
  the current form, not deleted.
- Documentation changes required with the implementation:
  - `docs/harness.spec.md`: the sentence that a debugger message or resume
    records continuity policy adoption; any remaining statement that an
    earlier form stays readable.
  - `README.md`: the `recovery resume` usage.
  - `docs/plans/45-architect-progress-checkpoints/main-plan.md`: add a note
    that its policy-adoption, legacy-reader and historical-successor
    requirements are superseded by this plan; do not rewrite the proposal.
- Net effect assessable by inspection: the identifiers `restart-import`,
  `restart-prepared`, `qualifyLegacyDocuments`, `forcedLegacyExhaustion`,
  `legacyCountClosure`, `missingHistoricalAuthority`, `run-policy/7` and
  `git-exact-text/1` appear nowhere in `src/` or `subs/` after the change.
  Historical analyses, implementation results and receipts under `docs/` are
  not rewritten.
- `npm run type-check`, `npm run check:self` and the configured audit must
  pass. Authoring this document starts no run.

## Acceptance

```gherkin
Feature: Retired continuation, policy and limit forms are no longer read

  Scenario Outline: A retired record form is refused with a diagnostic
    Given a run whose <record> is recorded in the retired form <retired>
    When the harness opens that run to <operation>
    Then the operation fails with a diagnostic naming the record and the expected form <current>
    And no adoption, conversion or default fills in the record

    Examples:
      | record                     | retired                               | operation                 | current                               |
      | run policy                 | run-policy/7 without continuity       | continue the pending task | run-policy/8 with continuity          |
      | write scope                | no captured assignment boundary       | admit an ownership repair | the current captured boundary         |
      | assisted review            | git-exact-text/1                      | resume the assessment     | candidate-inspection/1                |
      | run log                    | beginning with restart-prepared       | load the run              | a single run's own events             |

  Scenario: A fresh run captures its policy without an adoption event
    Given a project configured for an ordinary autonomous run
    When the run starts and executes its first task
    Then its captured policy is run-policy/8 with continuity and recovery members
    And its run log contains no policy adoption event

  Scenario: A debugger resume does not record policy adoption
    Given a run paused at an execution breakpoint
    When the operator resumes it through the debugger
    Then the exchange is recorded with its original captured policy
    And no adoption record accompanies the resume

  Scenario: Restart continues within the same run
    Given a run that failed after accepting two assignments
    When the operator runs restart prepare with a stable command identity
    Then the same run receives a job-continued event and resumes its pending tasks
    And the run contains no restart-prepared event and no imported inventory

  Scenario: A repaired last round continues
    Given a non-functional phase with a captured maximum of three rounds
    And the third round produced an unresolved finding that was repaired
    When the phase decides the next action
    Then the phase continues rather than reporting exhaustion
    And an unrepaired exhausted round is still reported as exhausted

  Scenario: Run snapshots always carry breakpoint and repair state
    Given a run with no breakpoint selected and no automatic repair
    When a CLI or web client reads the run snapshot
    Then the response includes automaticRepairs, breakpoint and recovery with empty or null values
    And a response that omits any of them fails protocol validation

  Scenario: Recovery resume accepts only the fields the executor reads
    Given an interrupted run with a pending task
    When the operator runs recovery resume with --command-id
    Then the pending task continues under ordinary execution
    And the command rejects --occurrence, --expected-revision and --repair-file as unknown
```

Evidence for the structural obligations: the identifier list in the
constraints yields no matches outside `docs/`; `src/tests/test-boundaries.json`
is unchanged; type check, self check and the configured audit pass.

## Module impact and existing facilities

The removals sit in eight owners under `subs/harness`, the harness root and
the CLI. The inventory report lists exact paths per finding; this overview
groups them by owner and names the contracts that change jointly. Line
references in the report predate the descriptive-identifier merge, so locate
each finding by identifier rather than by line.

| Owner | Retired reader or tolerance | Contracts that change with it |
| --- | --- | --- |
| `autonomous` | `run/restart-import.ts`, `restart-prepared` in `run/log.ts`, `records.ts` and `service.ts`; `run-policy/7` admission and adoption in `records.ts` and `service.ts` | the `restart-import` exposure to parent; adoption hooks called from `task-workflow` |
| `projections` | successor provenance in `inputs.ts`, `snapshot.ts`, `events.ts`; snapshot defaults | `validateRestartImport` and `restartImportSchema` exposed by `autonomous` |
| harness root (`subs/harness/src`) | snapshot defaults in `interfaces/protocol/runs.ts`; `missingHistoricalAuthority` in `work/scope.ts` | CLI and web protocol readers of the run snapshot |
| `work-coordination` | continuity adoption in `capability/policy.ts`; ignored judge bounds in `work/engineer-equipment.ts`; boundary check in `work/inherited-scope.ts` | judge construction contract with `task-execution` |
| `task-workflow` | any remaining `adoptContinuity` and `effectivePolicy` in `steps/manual.ts` and `steps/runner.ts`; judge bounds in `steps/run.ts` and `sessions/single.ts` | policy contract with `autonomous` |
| `task-execution` | judge options and the `exhausted` accessor in `submissions.ts` | judge construction consumed by `work-coordination` and `task-workflow` |
| `nonfunctional` and `acceptance` | `forcedLegacyExhaustion` and `legacyCountClosure` in `rounds.ts`; their plumbing in `nonfunctional-phase.ts` | round decision contract between the two owners |
| `assistance` | `qualifyLegacyDocuments`, inline-document members and old review markers in `documents.ts` and `assessment.ts` | none outside the owner |
| CLI (`src/`) | `--occurrence`, `--expected-revision`, `--repair-file` on `recovery resume` in `cli.ts` and `recovery-client.ts` | none; the executor already ignores them |

Stable contracts: the current forms in the required-behavior table, same-run
`job-continued` continuation, the current policy, the descriptive-identifier
contract, and every protected input. Joint discovery is needed only where a
removed exposure has a consumer in another owner: the successor provenance
between `autonomous` and `projections`, and the judge contract between
`task-execution`, `work-coordination` and `task-workflow`.

Existing facilities to use: the exact-schema decoders that already exist
beside each dual reader; the current builders in tests, which replace old-form
constructors. The generated architect and API views under `.ramify-architect/`
and each owner's `src/.ramify/` establish which exposures a consumer may still
import after a removal; refresh them from the project root after changing a
`module.ramify`.

Constraining inputs: [Run state and compatibility](../../AGENTS.md#run-state-and-compatibility),
the harness recovery principles, the test boundaries in
[docs/testing.spec.md](../../docs/testing.spec.md), and the listed
`docs/harness.spec.md` contracts that must be updated with the code.

## Proposed iterations

Four iterations. Iteration 2 is owner-local and can run in parallel with
anything. Iteration 4 comes last because it carries the documentation that
describes the finished state. Module focus never restricts writes; expected
touched modules are forecasts.

### 1. Same-run continuation and captured policy

**Outcome and acceptance.** Run logs are a single run's own events; policies
are captured, never adopted. Scenarios "Restart continues within the same
run", "A fresh run captures its policy without an adoption event", "A debugger
resume does not record policy adoption", and the `run policy` and `run log`
rows of the outline.

**Focus and rationale.** `autonomous`, because the run log, records and
service hold both removals and the import exposure. The adoption hooks in
`work-coordination` and `task-workflow` and the successor provenance in
`projections` are small consumers of the same contract, so they belong to the
same assignment rather than to separate workers.

**Interactions.** Delete the `restart-import` exposure to parent and its
consumers in `projections`; remove whatever remains of `adoptContinuity`,
`effectivePolicy` and `continuity-policy-adopted` across `autonomous`,
`task-workflow`, `work-coordination` and `projections`; narrow the policy
schema to `run-policy/8` with required continuity and recovery members. Keep
`prepareRestart` appending `job-continued`.

**Dependencies and verification.** None. Type check, the node test project,
self check, and an RA assessment.

### 2. Assistance reads current captures only

**Outcome and acceptance.** The `assisted review` row of the outline; current
candidate-source verification and current-run finding reconciliation remain.

**Focus and rationale.** `assistance`, owner-local; nothing outside the owner
consumes the removed members.

**Dependencies and verification.** Independent; parallel with any iteration.
Type check, the owner's tests, self check, and an RA assessment.

### 3. Rounds and judges without retired limits

**Outcome and acceptance.** Scenario "A repaired last round continues"; judges
take no bound and expose no exhaustion; engineer equipment and manual sessions
construct them without bounds.

**Focus and rationale.** `nonfunctional` with `acceptance` for the rounds, and
`task-execution` with `work-coordination` and `task-workflow` for the judges.
These are two small contracts, each shared by two or three owners; one worker
holding both avoids two separate handoffs over a few dozen lines each.

**Interactions.** Round decision contract between `nonfunctional` and
`acceptance`; judge construction between `task-execution` and its two callers.
Remove dead `endedAs` callbacks that depended on exhaustion.

**Dependencies and verification.** Independent of 1 and 2. Type check, the
node test project, self check, and an RA assessment.

### 4. Protocol, scope, CLI and documentation

**Outcome and acceptance.** Scenarios "Run snapshots always carry breakpoint
and repair state" and "Recovery resume accepts only the fields the executor
reads"; the `write scope` row of the outline; the required documentation
changes; the structural evidence in the constraints.

**Focus and rationale.** Harness root, where the protocol schemas,
`work/scope.ts` and the CLI live, plus `projections` for `snapshot.ts` and
`work-coordination` for `inherited-scope.ts`. Grouping the finishing edits with
the documentation lets one worker verify the identifier list and write the
spec, README and Plan 45 notes against the final state.

**Interactions.** The snapshot defaults in `interfaces/protocol/runs.ts`; the
inherited-scope consumer of the assignment boundary; `cli.ts` and
`recovery-client.ts` for the recovery fields.

**Dependencies and verification.** After 1 to 3. Type check, full `npm test`,
self check, the configured audit, the identifier grep, and the final
cumulative RA assessment against the whole plan.

## Verification and completion

Each iteration ends with the worker's own verification named above and an RA
assessment of its committed candidate; findings are decided before the next
dependent iteration starts. Completion is the final cumulative assessment of
the whole plan against the required behavior and acceptance, with the full
test suite, self check and configured audit passing and the identifier list
yielding no matches outside `docs/`. Documentation under `docs/` that records
history is not rewritten.

## Context and recommendations

Verified current producers, from the inventory report at checkout `44a8811f`:

- `prepareRestart` appends `job-continued` to the existing run; commit
  `4b1a2c5d` removed the import producers.
- `defaultRunPolicy` writes `run-policy/8` with continuity and recovery
  (`subs/harness/src/run/policy.ts`); admission still accepted `/7`
  (`subs/harness/subs/autonomous/src/run/records.ts`).
- Assessment writes `candidate-inspection/1` and `git-references`.
- The descriptive-identifier work removed the `adoptContinuity` hook and the
  effective-policy overlay from the manual step and the runner, and the policy
  transition from the restart importer, while leaving the service's
  `adoptContinuityPolicy`, the `continuity-policy-adopted` event schema and
  the projection case in place. Expect a partially removed adoption path.

Optional suggestions, not requirements:

- Where a test only needed an old-form constructor to reach a current
  behavior, replace the constructor with the current builder rather than
  hand-written JSON.
- Plans 44 and 45 were written before the compatibility rule; the note added
  to Plan 45 keeps its checkpoint design intact while dropping the adoption
  path.

## Prerequisites and unresolved decisions

- The descriptive-identifier work (plan `42-descriptive-identifiers`, branch
  `feat/plan42-assisted-20261021`) is merged into `main` before this plan is
  registered. It edits the run records, service, log, projections, assistance
  assessment, judge and task-workflow files this plan removes from; running
  both at once would make one of them conflict throughout.
- Before removing a finding, re-verify it against the checkout at start. The
  inventory predates that merge, and line references in the report have moved.
