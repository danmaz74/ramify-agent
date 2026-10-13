# Extract the harness query and projection module

## Problem and intended result

The harness owns both execution coordination and the implementation of its
queries. Its `src/projections/` directory decodes committed records, builds
execution and progress views, answers session queries, handles pagination and
caches, and translates recorded evidence into client responses. These reading
responsibilities can be understood independently of scheduling and durable writes.

Create a direct child named `projections` at `subs/harness/subs/projections/`
that owns this query implementation. The real HTTP and CLI consumers must use
the extracted provider. The harness remains the coordinating owner, the only
writer of durable run state and the authority for its public protocol.

This is the executable plan for self-dogfooding on ramify-agent. The harness's
architects choose assignments, scopes, delegations and iterations. An existing
working query endpoint does not satisfy the required ownership change.

## Required behavior and ownership

- Move the run, session, consultation and repair query implementations into the
  new child, with its own `module.ramify`, `README.md`, ordinary `src/` and owned
  `src/tests/`. Its parent is `harness`; its ordinary module header has no tags.
  Remove the old production `harness/src/projections/` directory after migrating
  consumers. Leave no forwarding implementations or duplicate projectors there.
- Integrate the provider with the HTTP adapter and both current CLI consumers:
  consultation inspection and repair export. Preserve their supported inputs,
  response values, ordering, limits, errors, rendered text and exit statuses.
  Preserve public HTTP schemas, names, versions, browser tags and root
  re-exposures. Existing clients and retained records require no migration.
- Keep `RunQueries`, `SessionQueries`, `currentModuleTree`, their translated
  error contracts and necessary signature companions available to the harness.
  Keep the consumer-defined reading port with the child: `RunSource`,
  `CommittedRun` and `CommittedLine`. It receives committed inputs and the
  existing reading dependencies, never a writable run service, ledger or command
  executor. The architects choose the additional consultation and repair reading
  entry points needed by the current consumers.
- The child owns record decoding for queries, response mapping, execution maps,
  progress/scenario presentation, session query caches, bounded pages, cursors
  and version-error handling. Preserve repeated reads, polling, reconnection,
  reopening, finished-session caching and supported historical standalone-session
  formats. Retain provenance, unavailable quantities and partial evidence.
- Queries must not append events, write or repair records, modify project
  content, invoke an agent or audit, or run commands to manufacture evidence.
  Preserve existing injected candidate/Git reading through its owning port.
  A view may present a recorded architect judgment; it cannot infer semantic
  completion from a passing check or erase a judgment after a failed check.

### Repair history is also used before effects

The repair exporter currently calls `automaticRepairsOf(runView(...))` to
authenticate retained history before recovering record copies or invoking its
external exporter. This is a shared domain rule as well as query input checking.

Give the shared repair-history validation one harness-owned implementation
outside the projections child. Both the repair command and the child's reader
must consume that implementation through explicit contracts. The command must
not depend on a response projector to decide whether effects are permitted.
The child translates validated facts into its public response and preserves
query error behavior. Internal function names and result shapes are design
choices; do not duplicate the validation algorithm.

Preserve the existing rules from `docs/architecture/automatic-project-repair.spec.md`:
record/event identity and paths agree; incident revisions are consecutive;
transitions and admission agree; original incident evidence is immutable;
export revisions change only export metadata; invocation/session identities
agree; and a continued repair has the required verified handback. Retain the
existing single-invocation rule and interrupted display of unfinished repairs.

An inconsistent retained history must still be refused before record-copy
recovery and external export. A valid export retains its existing payload,
identity, retry and result behavior and preserves terminal run state. Querying
the same history performs no export and writes nothing. Refactoring does not
change repair admission, lifecycle or tracker policy.

## Constraints and scope

- The harness retains HTTP serving, commands, scheduling, execution, recovery,
  durable writes and public protocol authority. Existing children retain their
  responsibilities. KPI acquisition/calculation, transcript persistence/paging
  and durable reducers remain with their current owners; the new child receives
  the selected contracts it needs. Reader-only historical compatibility decoding
  may live in the child; actively written durable formats retain their existing
  authority.
- Contracts follow responsibility. Expose selected parent symbols to descendants
  and re-expose received child behavior through the harness for sibling access.
  Include necessary type/signature companions. Review the visibility across the
  entire harness subtree, not just the intended reader. Keep implementation-only
  projectors private and the new Node implementation unavailable to the web.
- The reading surface must hide implementation knowledge. Do not move query
  bodies into parent callbacks, blanket-expose implementation files, introduce
  a neutral definitions module, copy contracts, or change the tag registry to
  make imports pass. Refresh ordinary/testing API views and use explicit
  declarations; never edit or import generated views.
- Preserve the selected baseline's delivered behavior, including recovery and
  restart provenance when present. Update current module documentation and
  affected navigation references. Historical results and receipts retain their
  original paths and claims.
- Keep dependency pins, public wire/durable formats, query cache policy, audit
  policy, model settings, UI behavior and unrelated orchestration unchanged.
  Do not bundle another submodule extraction, provider upgrade or new refactoring
  workflow. An extraction-induced defect belongs in this work; unrelated
  baseline failures require separate treatment.
- Follow `docs/testing.spec.md`: ordinary tests use scripted external Git,
  command, CLI and audit answers under the root process guard. Preserve configured
  discovery and exact native-boundary registrations if files move. This refactor
  authorizes no new process exemptions, weakened checks or fixture exclusions.

## Acceptance

```gherkin
Feature: A child implements the harness reading responsibilities

  Scenario: Existing consumers use the extracted provider
    Given a project has recorded runs, sessions and consultations
    When HTTP answers run and session queries and the CLI inspects consultations
    Then those answers use the projections child's implementation
    And the existing schemas, values, text, ordering and exit statuses are preserved
    And the old harness production projection directory is absent

  Scenario: Querying recorded evidence leaves the project unchanged
    Given a completed run with session transcripts and repair incidents
    And its project files, durable files and event sequence have been captured
    When its supported queries are repeated in process and through HTTP
    Then those files and the event sequence are unchanged
    And no query invokes an agent, audit or external exporter

  Scenario: Paging and polling preserve their boundaries
    Given recorded execution data and sessions with transcript cursors
    When a client requests bounded pages and polls from its previous version
    Then ordering, byte limits, cursors and changed-session selection match the baseline
    And stale versions and invalid cursors retain their existing refusals
    And finished-session caching preserves the same answers

  Scenario: Reopening preserves compatibility and explicit failures
    Given supported run and historical standalone-session records
    And records with unsupported versions or malformed required content
    When the harness reopens and the extracted readers answer queries
    Then supported records yield the baseline answers
    And unsupported or unreadable records retain their errors and evidence
    And no record is rewritten to make a query succeed

  Scenario: Progress retains authority and provenance
    Given recorded architect judgments, failed and passing audits, and partial metric evidence
    And retained source-run references where the baseline supports imported history
    When the extracted readers answer progress, scenario and metric queries
    Then architect-reported status remains distinct from automated check outcomes
    And unavailable quantities, coverage and original source identities remain explicit
    And the query creates no new completion judgment

  Scenario: Valid repair history is shared by reading and export
    Given a terminal run with valid repair history and a retained export payload
    When its repair history is queried and its incident is exported through the command
    Then both consumers use the same harness-owned history validation
    And the query performs no writes or export
    And the command preserves export identity, payload, retry behavior and exit status
    And the run's terminal state is preserved

  Scenario Outline: Invalid repair history is refused before effects
    Given retained repair history with <inconsistency>
    When its repair history is queried and the repair export command is requested
    Then the query reports unreadable history with its evidence
    And the command refuses before record-copy recovery or external export
    And both refusals use the shared history validation

    Examples:
      | inconsistency                         |
      | a record and event identity mismatch  |
      | a gap in incident revisions           |
      | an invalid lifecycle transition       |
      | changed original incident evidence    |
      | export changing non-export evidence   |
      | conflicting invocation identity       |
      | continuation without verified handback|

  Scenario: The child has a reading-only production surface
    Given the extracted module and its ordinary and testing API views
    When its real consumers and tests import the contracts they need
    Then each imported symbol and signature companion has explicit valid exposure
    And the child receives no writable run service or ledger interface
    And private projectors and Node implementation are unavailable to web production code
    And focused child tests and parent integration tests remain in configured discovery
```

Use real query implementations and consumer composition in focused tests, with
scripted external dependencies. Keep HTTP, CLI, full-run and recovery integration
checks with their coordinating owner; move focused query tests with their owner.
Preserve assertions across moves. The malformed repair examples need small
counterexamples, not exhaustive histories. Inspect shared implementation and
consumer imports as well as observable refusals.

Retain a baseline/candidate architectural comparison of exact-owner and subtree
inventories, production entry points, reading exposures, consumers and public
wire exports/tags. Explain the implementation knowledge the parent no longer
needs and the cost of the new input contracts. File counts alone do not establish
reduced cognitive complexity.

Run focused checks, type checks and `npm run check:self`. Final qualification
uses the committed `ramify-audit.json` and every configured project. Under the
repository's authorized commit workflow, run from a clean committed candidate:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

Use default audit mode and let the auditor determine scope. Retain the existing
harness final-gate obligations; do not weaken them to obtain a passing result.
Passing automation establishes check health. Responsible architects judge the
ownership change, preserved behavior and each scenario's fulfillment.

## Context and recommendations

The working-tree assessment on 2026-10-13 found 23 projection files, roughly
6,100 lines, and three production consumer files. This is authoring evidence,
not the identity or promised size of the execution baseline. Reinventory that
baseline before implementation; preserve adjacent delivered behavior.

Navigation pointers, relative to the target project root:

- `subs/harness/src/projections/queries.ts`, `inputs.ts`, `session-queries.ts`
  and `tree.ts`: existing query entry points and committed-input port.
- `subs/harness/src/projections/consultations.ts`, `repairs.ts` and
  `standalone-records.ts`: additions beyond the earlier extraction proposal.
- `subs/harness/src/http/app.ts`, `consultations/command.ts` and
  `run/repair-export-command.ts`: the three current production consumers.
- `subs/harness/src/run/repair-records.ts`, `run/repair-export.ts` and
  `projections/repairs.ts`: shared repair evidence and current validation.
- `subs/harness/src/tests/projections-pure.test.ts`, `run-projections.test.ts`,
  `session-queries.test.ts` and repair export tests: useful regression seams.
- `subs/harness/module.ramify`, `module.ramify`, `vitest.config.ts` and
  `src/tests/test-boundaries.json`: exposures and test discovery.

Project instructions and principles apply. Relevant obligations from
`docs/testing.spec.md` and `docs/architecture/automatic-project-repair.spec.md`
are stated above; this plan requires no specification behavior change.
These paths are navigation pointers, not linked companion plan documents.

## Execution prerequisites

Execute with a prepared bootstrap harness checkout serving a separate target
worktree of ramify-agent. The target must contain this plan at
`plans/projections-extraction/plan.md`, installed exact dependencies, committed
project/audit configuration and usable current architect/API evidence. Keep the
loaded bootstrap revision stable while the target changes. A selected model,
working Pi access and run bounds are execution setup choices.

The authoring checkout contains unrelated work. Select and record a clean target
baseline through the normal authorized workflow, preserving that work. A failed
or incomplete materialization is not complete architecture evidence. Resolve a
real setup/provider obstruction before starting dependent assignments.

This document defines the implementation outcome. Operator observations,
execution receipts and harness-repair notes belong outside this captured plan
directory; the harness owns plan progress and acceptance records.
