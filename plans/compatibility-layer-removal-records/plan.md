# Remove readers for retired session, delivery and measurement forms

## Problem and intended result

The harness still reads, adopts or tolerates five record forms that no current
code produces: an earlier standalone-session layout, `/1` delivery manifests
and operation intents, inline-body session-store transactions, `scope-size/1`
measurements and manifest-less scope estimates, and Pi `0.87.1` identities.
Together they are about 6,000 lines of production code, tests and fixtures;
the earlier session layout and its fixtures are three quarters of that. The
verified inventory is
[Removable compatibility layers](../../docs/analysis/2026-10-22-removable-compatibility-layers.md)
(background) with its
[ramify-agent report](../../docs/analysis/2026-10-22-removable-compatibility-layers/ramify-agent.md)
(background, exact paths and commits); this plan covers its findings 1, 4, 7,
8 and 12.

The repository rule in
[Run state and compatibility](../../AGENTS.md#run-state-and-compatibility)
(required) makes run state disposable: a finished run stays finished, an
unfinished run restarts from its plan on current code, and nothing keeps
reading an older run-state form. This plan applies that rule to the five
layers. The result is one current form for each of these record kinds and one
session layout. Fresh runs, sessions, steps, debugger exchanges and projections
keep their current behavior. Records in a retired form stop being readable.

The inventory's other seven layers, which share files with the
descriptive-identifier work in progress, are removed by the separate plan
`plans/compatibility-layer-removal-continuation/plan.md` once that work has
merged. They are not in scope here; the constraints name them so that no
iteration removes them early.

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
| Delivered manifest | `ramify-agent.delivered-inputs/2` |
| Harness operation intent | `ramify-agent.harness-operation/2`, with its captured request hash |
| Session-store transaction | `session-store-commit/2` with content-addressed bodies; the unversioned `session-store-commit` event with inline bodies is retired |
| Run measurement scope | `scope-size/2` |
| Pi transcript and observation identity | package `1.3.0`, observation source `pi@1.3.0:SettingsManager` |

The manifest builder has no `/1` default; every caller names the current
schema or the builder has a single implied one. Effective-block reconciliation
for replaced, withdrawn or incompletely inherited blocks remains: those are
current runtime cases, not earlier forms. Append replay for a crash between
engine completion and harness recording remains.

### Sessions from the earlier layout are no longer read

The session browser, the HTTP session endpoints, the protocol session types and
the web session pages serve the sessions of the implementation runs the
service serves. The reader for the earlier `plans/.harness/sessions/<id>/`
layout, its record schemas, directory scanner, cache, standalone endpoints,
protocol variants and web branches are removed. A directory in the earlier
layout is not scanned and does not appear in session listings. Sessions
recorded as manual runs under `plans/sessions/.harness/jobs/<id>/` need not be
listed; see the
[revision of 2026-10-22](requirements-2026-10-22.md) (required), which
replaced the original manual-run listing requirement at the user's direction.
Transcript paging and the shared body and file readers stay.

### Measurement requires the delivered manifest

Run measurements are read and compared under `scope-size/2` only. Invocation
scope is computed from the delivered manifest; the package-file, plan-ID and
brief-size fallback arguments are removed. Revision mismatch and unavailable
measurement handling remain.

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
- Reserved for the continuation plan and not in scope here, because the
  descriptive-identifier work in progress edits the same files: the
  successor-import path (`restart-import`, `restart-prepared`), `run-policy/7`
  admission and continuity adoption, `forcedLegacyExhaustion` and
  `legacyCountClosure`, judge rejection bounds and exhaustion accessors, run
  snapshot defaults for `automaticRepairs`, `breakpoint` and `recovery`, the
  `missingHistoricalAuthority` boundary check, the assistance inline-document
  qualifier and `git-exact-text/1` reviews, and the `recovery resume`
  occurrence, revision and repair fields. Leave them as they are, including in
  `subs/harness/src/interfaces/protocol/runs.ts`, where only the manifest,
  intent, observation and scope-size view schemas change under this plan
  (see [requirements-2026-10-22b.md](requirements-2026-10-22b.md)).
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
  `projection-compatibility` helper with its test and step file. Tests of
  current behavior that used an old-form constructor are rewritten against the
  current form, not deleted.
- Documentation changes required with the implementation:
  - `README.md`: the statement that `plans/.harness/sessions/` is retired
    becomes a statement that it is not read.
  - `docs/metrics/session-observations.md`: the `/1` operation and legacy
    invocation notes.
- Net effect assessable by inspection: the identifiers `standalone-records`,
  `delivered-inputs/1`, `harness-operation/1`, `scope-size/1` and `0.87.1`
  appear nowhere in `src/` or `subs/` after the change, and the session-store
  event union has the `/2` member only. Historical analyses, implementation
  results and receipts under `docs/` are not rewritten.
- `npm run type-check`, `npm run check:self` and the configured audit must
  pass. Authoring this document starts no run.

## Acceptance

```gherkin
Feature: Retired session, delivery and measurement forms are no longer read

  Scenario Outline: A retired record form is refused with a diagnostic
    Given a run whose <record> is recorded in the retired form <retired>
    When the harness opens that run to <operation>
    Then the operation fails with a diagnostic naming the record and the expected form <current>
    And no conversion or default fills in the record

    Examples:
      | record                     | retired                               | operation                 | current                               |
      | delivered manifest         | ramify-agent.delivered-inputs/1       | retry the operation       | ramify-agent.delivered-inputs/2       |
      | harness operation intent   | ramify-agent.harness-operation/1      | retry the operation       | ramify-agent.harness-operation/2      |
      | session-store transaction  | unversioned session-store-commit      | open the session store    | session-store-commit/2                |
      | run measurement            | scope-size/1                          | project its KPIs          | scope-size/2                          |

  Scenario: The session browser does not read the earlier layout
    Given a project with an implementation run the server serves
    And a leftover directory under plans/.harness/sessions/ in the earlier layout
    When a client lists sessions through the HTTP session endpoint
    Then the served run's sessions are listed with their transcript pages
    And the leftover directory is neither listed nor reported

  Scenario: Invocation scope comes from the delivered manifest
    Given a task invocation with a delivered manifest
    When its scope measurement is captured
    Then the measurement is recorded as scope-size/2 from the manifest entries
    And no package inventory or brief size is consulted

  Scenario: A Pi transcript is identified by the current package only
    Given a Pi session transcript recorded by package 1.3.0
    When the harness reads its observations
    Then the observation source is pi@1.3.0:SettingsManager
    And a transcript identified as 0.87.1 fails protocol validation
```

Evidence for the structural obligations: the identifier list in the
constraints yields no matches outside `docs/`; the two `legacy-sessions`
fixture trees and the `projection-compatibility` helper no longer exist;
`src/tests/test-boundaries.json` is unchanged; type check, self check and the
configured audit pass.

## Module impact and existing facilities

The removals sit in seven owners under `subs/harness`, the harness root and
the web module. The inventory report lists exact paths per finding; this
overview groups them by owner and names the contracts that change jointly.

| Owner | Retired reader or tolerance | Contracts that change with it |
| --- | --- | --- |
| `projections` | standalone-session records, scanner, cache and queries in `standalone-records.ts`, `session-queries.ts` and `sessions.ts` | session protocol types and HTTP endpoints at the harness root |
| harness root (`subs/harness/src`) | standalone session endpoints in `http/app.ts` and protocol types in `interfaces/protocol/sessions.ts`; `/1` manifest and intent schemas and the Pi `0.87.1` observation identity in `interfaces/protocol/runs.ts`; `legacy-sessions` and `projection-compatibility` test helpers | `standaloneSessionIdSchema` and `standaloneSessionResponseSchema` re-exposed from the root `module.ramify` to descendants; session exposures in `subs/harness/module.ramify` |
| `task-execution` | `/1` manifest default and intent readers in `delivery/delivered-manifest.ts` and `session-operations.ts`; Pi `0.87.1` in `records.ts` and `observations.ts` | manifest schema consumed by projections and metrics; observation identity consumed by `kpi` |
| `kpi` | `scope-size/1` in `run-records.ts`, `capture.ts`, `metrics.ts`; fallback inputs in `measurement/inputs.ts` | `invocationScope` signature used by `task-workflow` |
| `task-workflow` | manifest-less scope caller in `steps/runner.ts` | `invocationScope` contract with `kpi` |
| `agent/pi` | `0.87.1` in `preservation.ts`; port schema in `agent/src/interfaces/port.ts` | transcript identity read by `task-execution` |
| `session-store` | unversioned `session-store-commit` replay, `serializedRecords` cache in `session-store.ts` | none outside the owner |
| `web` | standalone branches in `session-progress.ts` and `session-page.tsx` | receives the session protocol types only |

Stable contracts: the current forms in the required-behavior table, the
manual-run session layout, and every protected input. Joint discovery is
needed only where a removed exposure has a consumer in another owner: the
session protocol between the root, `projections` and `web`, and the manifest,
identity and scope contracts between `task-execution`, `kpi`, `agent/pi` and
`task-workflow`.

Existing facilities to use: the current manual-run session reader and body
readers in `projections`; the exact-schema decoders that already exist beside
each dual reader; the current builders in tests, which replace old-form
constructors. The generated architect and API views under `.ramify-architect/`
and each owner's `src/.ramify/` establish which exposures a consumer may still
import after a removal; refresh them from the project root after changing a
`module.ramify`.

Constraining inputs: [Run state and compatibility](../../AGENTS.md#run-state-and-compatibility),
the harness recovery principles, and the test boundaries in
[docs/testing.spec.md](../../docs/testing.spec.md).

## Proposed iterations

Three iterations. Iteration 1 is three quarters of the plan's lines and runs
alone in `projections` and the root. Iterations 2 and 3 are independent of it
and of each other and can run in parallel with anything. Module focus never
restricts writes; expected touched modules are forecasts.

### 1. Sessions from the manual-run layout only

**Outcome and acceptance.** The session browser, HTTP session endpoints,
protocol session types and web session pages no longer read the earlier layout.
Scenario "The session browser does not read the earlier layout".

**Focus and rationale.** `projections`, with the harness-root HTTP and protocol
changes and the web branches in the same assignment: what a session listing is
must agree across all three, and the fixture trees are shared by root and
projections tests. A single oriented worker avoids re-learning the session
queries twice.

**Interactions.** Remove `standaloneSessionIdSchema` and
`standaloneSessionResponseSchema` from the root `module.ramify` re-exposures
and the matching exposures in `subs/harness/module.ramify`; delete the
`legacy-sessions` fixtures under both test helpers and the
`projection-compatibility` helper, test and step file. Keep transcript paging
and shared body and file readers. Update the `README.md` session statement.

**Dependencies and verification.** None. Type check, the node and web test
projects, self check, and an RA assessment of the committed candidate.

### 2. One delivery, identity and measurement form

**Outcome and acceptance.** `/2` manifests and intents only, Pi `1.3.0`
identities only, `scope-size/2` from the delivered manifest only. Scenarios
"Invocation scope comes from the delivered manifest" and "A Pi transcript is
identified by the current package only", and the `delivered manifest`,
`harness operation intent` and `run measurement` rows of the outline.

**Focus and rationale.** `task-execution`, where the manifest builder, intent
reader and observation records live, with `kpi` and `agent/pi` in the same
assignment: the identity strings and the manifest schema are one contract
seen from three sides, and the `invocationScope` caller in `task-workflow` is
a one-line consumer change.

**Interactions.** Remove the `/1` helper default and old-form constructors;
tighten the manifest, intent, observation-identity and scope-size view schemas
in `interfaces/protocol/runs.ts` and leave the rest of that file alone; drop the
package, plan-ID and brief arguments of `invocationScope`; update
`docs/metrics/session-observations.md`.

**Dependencies and verification.** Independent of 1 and 3. Type check, the
node test project, self check, and an RA assessment.

### 3. Session-store replay of the current transaction only

**Outcome and acceptance.** The `session-store transaction` row of the
outline; CAS, ownership validation and optional-context handling remain.

**Focus and rationale.** `session-store`, owner-local; nothing outside the
owner consumes the removed replay.

**Dependencies and verification.** Independent; parallel with any iteration.
Type check, the owner's tests, self check, and an RA assessment.

## Verification and completion

Each iteration ends with the worker's own verification named above and an RA
assessment of its committed candidate; findings are decided before dependent
work continues. Completion is the final cumulative assessment of the whole
plan against the required behavior and acceptance, with the full test suite
(`npm test`), self check and configured audit passing, the identifier list
yielding no matches outside `docs/`, and the two fixture trees and the
compatibility helper gone. Documentation under `docs/` that records history is
not rewritten.

## Context and recommendations

Verified current producers, from the inventory report:

- Sessions run on the invocation runner and record a manual run in the run's
  own layout; the standalone-records header says nothing writes the earlier
  layout (`subs/harness/subs/projections/src/standalone-records.ts`).
- Both production manifest call sites pass `/2` explicitly; only the helper
  default and tests use `/1` (`delivery/delivered-manifest.ts`,
  `delivery/packet.ts`, `session-operations.ts`).
- Session-store commits write `session-store-commit/2`; Pi writes `1.3.0`;
  KPI capture defines `scope-size/2`.

Optional suggestions, not requirements:

- The manifest helper can take the schema from a single constant rather than a
  parameter once `/1` is gone.
- Where a test only needed an old-form constructor to reach a current
  behavior, replace the constructor with the current builder rather than
  hand-written JSON.

## Prerequisites and unresolved decisions

None. The inventory was verified against checkout `44a8811f`; re-verify a
finding against the current source before removing it if the area changed
since.
