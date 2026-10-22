# Remove readers for retired run-state forms

## Problem and intended result

The harness still reads, adopts or tolerates twelve record forms that no
current code produces: an earlier standalone-session layout, copied successor
runs, inline assisted documents and `git-exact-text/1` reviews, `/1` delivery
manifests and operation intents, `run-policy/7` runs, count-forced
non-functional exhaustion, inline-body session-store transactions,
`scope-size/1` measurements and manifest-less scope estimates, ignored
rejection bounds, run snapshots without breakpoint and repair state, write
scopes without a captured assignment boundary, and Pi `0.87.1` identities.
Together they are about 7,200 lines of production code, tests and fixtures. The
verified inventory is
[Removable compatibility layers](../../docs/analysis/2026-10-22-removable-compatibility-layers.md)
(background) with its
[ramify-agent report](../../docs/analysis/2026-10-22-removable-compatibility-layers/ramify-agent.md)
(background, exact paths and commits).

The repository rule in
[Run state and compatibility](../../AGENTS.md#run-state-and-compatibility)
(required) makes run state disposable: a finished run stays finished, an
unfinished run restarts from its plan on current code, and nothing keeps
reading an older run-state form. This plan applies that rule to the twelve
layers. The result is one current form per durable record kind, one session
layout, same-run continuation only, and no policy adoption. Fresh runs,
sessions, steps, debugger exchanges, assisted assessments and projections keep
their current behavior. Records in a retired form stop being readable.

The beneficiaries are the harness maintainers and the architects and engineers
the harness runs on this project: fewer formats to understand, fewer branches
to keep correct, and smaller prompts and views. No long-lived committed file
changes shape, so no conversion script is needed.

## Required behavior

### One current form per durable record kind

Each record kind below has exactly one accepted form, the one current code
writes. Readers, schemas, protocol types and projections accept that form only.
Optional members that exist solely because an earlier form omitted them become
required. Defaults that filled in earlier records are removed.

| Record kind | Only accepted form |
| --- | --- |
| Delivered manifest | `ramify-agent.delivered-inputs/2` |
| Harness operation intent | `ramify-agent.harness-operation/2`, with its captured request hash |
| Run policy | `run-policy/8` with captured continuity and recovery members |
| Session-store transaction | `session-store-commit/2` with content-addressed bodies; the unversioned `session-store-commit` event with inline bodies is retired |
| Run measurement scope | `scope-size/2` |
| Write scope | the current captured assignment boundary with `nestedDeclarations` |
| Pi transcript and observation identity | package `1.3.0`, observation source `pi@1.3.0:SettingsManager` |
| Run snapshot response | includes `automaticRepairs`, `breakpoint` and `recovery`, empty or null when absent |
| Assisted document capture | `storage: 'git-references'` |
| Assisted review verification | `candidate-inspection/1` |

The manifest builder has no `/1` default; every caller names the current
schema or the builder has a single implied one. Effective-block reconciliation
for replaced, withdrawn or incompletely inherited blocks remains: those are
current runtime cases, not earlier forms. Append replay for a crash between
engine completion and harness recording remains.

### Sessions are read from the manual-run layout only

The session browser, the HTTP session endpoints, the protocol session types and
the web session pages read sessions recorded as manual runs under
`plans/sessions/.harness/jobs/<id>/`. The reader for the earlier
`plans/.harness/sessions/<id>/` layout, its record schemas, directory scanner,
cache, standalone endpoints, protocol variants and web branches are removed. A
directory in the earlier layout is not scanned and does not appear in session
listings. Transcript paging and the shared body and file readers stay.

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

### Measurement requires the delivered manifest

Run measurements are read and compared under `scope-size/2` only. Invocation
scope is computed from the delivered manifest; the package-file, plan-ID and
brief-size fallback arguments are removed. Revision mismatch and unavailable
measurement handling remain.

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
and it does not need to recognize which retired version it met. Records the
harness never opens, such as directories in the earlier session layout, are
simply not read.

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
- Keep the toolkit dependency direction, the single durable writer, module
  contracts and the test boundaries. Do not import companion source or edit
  generated views.
- Tests that exist only to protect a retired form are deleted with it,
  including the `legacy-sessions` fixture trees under
  `subs/harness/src/tests/helpers/` and
  `subs/harness/subs/projections/src/tests/helpers/`, and the
  `projection-compatibility` helper. Tests of current behavior that used an
  old-form constructor are rewritten against the current form, not deleted.
- Documentation changes required with the implementation:
  - `docs/harness.spec.md`: the sentence that a debugger message or resume
    records continuity policy adoption; any remaining statement that an
    earlier form stays readable.
  - `README.md`: the statement that `plans/.harness/sessions/` is retired
    becomes a statement that it is not read; the `recovery resume` usage.
  - `docs/metrics/session-observations.md`: the `/1` operation and legacy
    invocation notes.
  - `docs/plans/45-architect-progress-checkpoints/main-plan.md`: add a note
    that its policy-adoption, legacy-reader and historical-successor
    requirements are superseded by this plan; do not rewrite the proposal.
- Net effect assessable by inspection: the identifiers `standalone-records`,
  `restart-import`, `restart-prepared`, `qualifyLegacyDocuments`,
  `forcedLegacyExhaustion`, `legacyCountClosure`, `missingHistoricalAuthority`,
  `delivered-inputs/1`, `harness-operation/1`, `run-policy/7`, `scope-size/1`,
  `git-exact-text/1` and `0.87.1` appear nowhere in `src/` or `subs/` after the
  change, and the session-store event union has the `/2` member only. Historical analyses,
  implementation results and receipts under `docs/` are not rewritten.
- `npm run type-check`, `npm run check:self` and the configured audit must
  pass. Authoring this document starts no run.

## Acceptance

```gherkin
Feature: Retired run-state forms are no longer read

  Scenario Outline: A retired record form is refused with a diagnostic
    Given a run whose <record> is recorded in the retired form <retired>
    When the harness opens that run to <operation>
    Then the operation fails with a diagnostic naming the record and the expected form <current>
    And no adoption, conversion or default fills in the record

    Examples:
      | record                     | retired                               | operation                 | current                               |
      | run policy                 | run-policy/7 without continuity       | continue the pending task | run-policy/8 with continuity          |
      | delivered manifest         | ramify-agent.delivered-inputs/1       | retry the operation       | ramify-agent.delivered-inputs/2       |
      | harness operation intent   | ramify-agent.harness-operation/1      | retry the operation       | ramify-agent.harness-operation/2      |
      | session-store transaction  | unversioned session-store-commit      | open the session store    | session-store-commit/2                |
      | run measurement            | scope-size/1                          | project its KPIs          | scope-size/2                          |
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

  Scenario: The session browser lists manual-run sessions only
    Given a project with two sessions recorded under plans/sessions/.harness/jobs/
    And a leftover directory under plans/.harness/sessions/ in the earlier layout
    When a client lists sessions through the HTTP session endpoint
    Then the two manual-run sessions are listed with their transcript pages
    And the leftover directory is neither listed nor reported

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

  Scenario: Invocation scope comes from the delivered manifest
    Given a task invocation with a delivered manifest
    When its scope measurement is captured
    Then the measurement is recorded as scope-size/2 from the manifest entries
    And no package inventory or brief size is consulted
```

Evidence for the structural obligations: the identifier list in the
constraints yields no matches outside `docs/`; the two `legacy-sessions`
fixture trees and the `projection-compatibility` helper no longer exist;
`src/tests/test-boundaries.json` is unchanged; type check, self check and the
configured audit pass.

## Context and recommendations

Verified current producers, from the inventory report:

- Sessions run on the invocation runner and record a manual run in the run's
  own layout; the standalone-records header says nothing writes the earlier
  layout (`subs/harness/subs/projections/src/standalone-records.ts`).
- `prepareRestart` appends `job-continued` to the existing run; commit
  `4b1a2c5d` removed the import producers.
- `defaultRunPolicy` writes `run-policy/8` with continuity and recovery
  (`subs/harness/src/run/policy.ts`); admission still accepts `/7`
  (`subs/harness/subs/autonomous/src/run/records.ts`).
- Both production manifest call sites pass `/2` explicitly; only the helper
  default and tests use `/1` (`delivery/delivered-manifest.ts`,
  `delivery/packet.ts`, `session-operations.ts`).
- Session-store commits write `session-store-commit/2`; Pi writes `1.3.0`;
  KPI capture defines `scope-size/2`; assessment writes
  `candidate-inspection/1` and `git-references`.

Optional suggestions, not requirements:

- Order the work by size. The standalone-session reader and its fixtures are
  three quarters of the total and touch projections, HTTP, protocol and web
  together; a capability architect across those owners fits it.
- The manifest helper can take the schema from a single constant rather than a
  parameter once `/1` is gone.
- Where a test only needed an old-form constructor to reach a current
  behavior, replace the constructor with the current builder rather than
  hand-written JSON.
- Plans 44 and 45 were written before the compatibility rule; the note added
  to Plan 45 keeps its checkpoint design intact while dropping the adoption
  path.

## Prerequisites and unresolved decisions

None. The inventory was verified against checkout `44a8811f`; re-verify a
finding against the current source before removing it if the area changed
since.
