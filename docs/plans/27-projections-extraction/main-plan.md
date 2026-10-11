# Plan 27: Extract the harness query and projection module

**Date:** 2026-10-09. **Status:** proposed; implementation has not started.
**Execution:** ramify-agent operates on a separate checkout of ramify-agent.

## Request

Extract the existing run and session query layer into a direct child of the
harness, preserving the application's behavior and public contracts. The new
module turns committed harness records and recorded evidence into bounded,
versioned answers for clients. The harness remains the coordinating owner and
the only writer of durable run state.

This plan states the required outcome, constraints and acceptance examples.
It has no authored iterations, iteration manifest or predetermined assignments.
The executing ramify-agent architects choose work items, scopes, delegations and
their internal execution steps through the existing workflow. Implementing a
new refactoring workflow or plan kind is outside this request.

The required outcome is the extracted provider and its real use by the harness
HTTP adapter. Discovering that the current application already answers queries
does not satisfy the structural requirement.

## Why this boundary

The inspected working tree contains 20 production files, 5,459 physical lines
and 307,731 bytes in `subs/harness/src/projections/`. Its ordinary production
consumer outside that directory is `src/http/app.ts`. `RunQueries` and
`SessionQueries` already read through the consumer-defined `RunSource` port.
These are observations of the 2026-10-09 working tree, including the reviews
child extraction in progress, rather than promised measurements of a future
implementation base.

The child hides record decoding, event-to-response mapping, execution maps,
progress and scenario views, session caches, pagination, metric presentation
and version-error handling. The parent supplies committed inputs and composes
the reader with HTTP commands. Run execution should not require understanding
those transformations.

Keeping these files together in the parent avoids a new boundary but retains
that implementation knowledge in its local context. Moving `work/` wholesale
would mix assignment, scope, obligations, equipment and scheduling. Moving
`run/service.ts` wholesale would preserve its combined recovery, session,
review, contract and gate responsibilities. Neither is part of this extraction.

Apply [Local Engineering, Global Architecture and Contracts Follow
Responsibility](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/agents/module-architect.principles.md), the
[importability principles](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/model/cross-module-importability.principles.md)
and the [module description specification](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/model/module-description.spec.md).

## Required ownership

Create `subs/harness/subs/projections/` with its own `module.ramify`, `README.md`,
ordinary `src/` and owned `src/tests/`. Its declared name is `projections`, its
parent is `harness`, and its ordinary module header has no tags. It is Node
implementation source, with tests using the standard testing classification.

Move every existing `subs/harness/src/projections/*.ts` implementation into the
new child's `src/`. At authoring time the inventory is:

```text
analysis.ts                 capability-tasks.ts
check-findings.ts           events.ts
execution-map.ts            execution-modules.ts
execution-pages.ts          inputs.ts
lineage.ts                  merge-readiness.ts
metrics.ts                  module-capabilities.ts
progress.ts                 queries.ts
scenarios.ts                session-queries.ts
sessions.ts                 snapshot.ts
tree.ts                     work.ts
```

Reinventory the selected implementation base before moving files. If adjacent
work changes this inventory, preserve its delivered behavior and record how the
same responsibility maps to the new base. Remove the old production projection
directory after migrating consumers; do not leave forwarding implementations
or duplicate projectors there.

The harness retains HTTP serving, command admission, run execution, scheduling,
recovery, durable writes, protocol files and their authority. Existing children
retain their responsibilities. KPI acquisition/calculation, transcript storage
and paging, and durable reducers remain with their current owners; the new child
consumes the selected behavior it already needs.

Update current module documentation to explain this ownership. Completed plan
receipts and historical evidence remain historical documents.

## Contracts and integration

The child's parent-facing production surface includes:

| Contract | Responsibility |
| --- | --- |
| `RunQueries` | Answers existing run queries from committed inputs. |
| `SessionQueries` | Answers existing session, transcript and polling queries. |
| `currentModuleTree` | Supplies the module-tree answer also consumed directly by HTTP. |
| `ProjectionError`, `ExecutionPageError` | Preserve the errors translated by the HTTP adapter. |
| `RunSource`, `CommittedRun`, `CommittedLine` | Define the read-only inputs expected by this consumer. |

Keep the consumer-defined input port with the projections child. Expose every
signature companion required by these entry points, including parent-owned and
received types where applicable. Internal view builders, caches, cursor codecs
and individual projectors are not production APIs merely because tests exercise
them. Do not copy types to evade exposure requirements.

`src/http/app.ts` must construct the child's readers from the existing run
service and call the child's exposed functions. Preserve route-level response
validation and error translation. Its command path continues to call the run
service. The child receives no `RunService`, writable ledger, writer ownership
or command-execution interface; `RunSource` stays a reading port.

The protocol in `harness/src/interfaces/protocol/` remains the harness's public
agreement with clients. Preserve its export names, schemas, signatures, browser
tags, versioning and root re-exposures to the web. The new Node implementation
and its internal input vocabulary must not become available to the web or root
production consumers.

Replace implicit same-owner access with reviewed, named parent exposures to
descendants. Inventory all imports after the move and account for their types
and signature companions. The expected input families include:

- Public protocol schemas, types and limits.
- Durable run, work, assignment, scenario, contract, review, deviation,
  nonfunctional and observation records and their existing read/replay helpers.
- Existing KPI functions and evidence types used by metric projections.
- Standalone session records and existing transcript readers.
- Evidence-child APIs for module trees and injected candidate/change-history
  facts, plus existing scenario, plan-evidence and CheckFinding APIs.

Re-expose received child behavior through the harness as required for sibling
access. Refresh the new child's ordinary API view and use it to determine what
it may import. Do not solve access errors with blanket exposure of harness
implementation files, a neutral definitions module, a changed tag registry or
imports from generated views. Exposure to descendants covers the entire
harness subtree; review the additional visibility this creates even when only
projections currently consumes a name.

The executing architect must keep the input surface understandable. A selected
record vocabulary and existing reducers are legitimate reading dependencies;
a port that delegates every projection back to parent callbacks would defeat
the extraction. No new runtime indirection is required when existing exposed
functions and types express the needed agreement.

## Behavioral constraints

For the same committed records, evidence and query inputs, preserve response
values, ordering, limits, cursors, unknown/unavailable quantities and errors.
Preserve the existing supported/unsupported durable-version behavior and
reconnection/reopening behavior. A query may retain its existing in-memory
caches but must not append events, write records, repair files, mutate project
content or invoke an agent, audit or external command to manufacture evidence.
Existing injected Git/candidate reading remains reading, through its owning port.

Projection describes recorded facts and trusted judgments. It does not award
scenario satisfaction from passing tests, retract architect judgments after a
failed audit, or infer semantic completion. Keep reported obligation status
separate from automated test results and retain uncertainty and provenance.

This is a source ownership refactor. Do not change the HTTP or durable format,
session lifecycle, audit policy, provider/model settings, metrics policy,
review concurrency, query cache strategy, client UI or dependency pins as part
of making the extraction pass. Fix an extraction-induced defect within scope;
record unrelated baseline defects separately.

## Tests and evidence

Use [Testing ramify-agent](../../testing.spec.md). Ordinary tests script external
Git, candidate, CLI, audit and command answers and retain the root process guard.
The committed runner's discovery, rather than filename assumptions, determines
which files must execute. Preserve exact native-boundary registrations and their
claims if an affected file moves; this refactor does not warrant new exemptions.

Move focused tests of the child's algorithms and queries into its `src/tests/`.
Keep HTTP, full-run, reopen/recovery and other cross-owner integration tests with
their coordinating owner. Mixed files can be split by responsibility while
preserving their cases. Use the child's testing API view for access to parent
fixtures or scripted helpers; expose only the selected testing contracts and
their required companions. Do not expose all projectors to the parent merely
to preserve old same-owner test imports.

Starting evidence includes `projections-pure.test.ts`, `run-projections.test.ts`,
`session-queries.test.ts`, `scenario-projections.test.ts`,
`check-findings-projection.test.ts`, `capability-tasks-projection.test.ts`,
`progress.test.ts`, the execution-map tests and HTTP/protocol tests in
`subs/harness/src/tests/`. Inspect these files rather than treating the list as
a mandatory move list. Add or adapt meaningful checks where existing tests do
not establish the new boundary or a preserved behavioral guarantee.

Retain a baseline/post-change architectural comparison: exact owner and subtree
source inventories, production entry points, input exposures, consumers, and
unchanged public wire exports/tags. The generated architect/API views supply
ownership and access evidence, not judgments of cognitive simplicity. The
responsible architect explains what knowledge the parent no longer needs and
whether the new contracts accomplish that reduction.

## Acceptance examples

These fenced scenarios are inputs to the existing plan scenario extractor.
Architects may bind them to suitable structural and behavioral checks; the
harness does not infer those bindings or semantic completion from audit results.

```gherkin
Feature: A child owns the harness query and projection implementation

  Scenario: QP01 The parent uses the extracted provider
    Given the harness serves a project with recorded runs and sessions
    When its HTTP adapter answers run, session and module-tree queries
    Then the answers are implemented by the projections child
    And the old harness production projection directory is absent
    And the generated module model validates every cross-owner import

  Scenario: QP02 Existing clients receive compatible answers
    Given representative committed records and query inputs from the baseline
    When the extracted readers and HTTP routes answer those queries
    Then the response schemas, values, ordering and limits match the baseline
    And the public protocol exports and browser tags are unchanged
    And the web build consumes only the existing public harness contracts

  Scenario: QP03 Reading does not change durable state
    Given a completed run and a recorded snapshot of its project and durable files
    When run and session queries are repeated in process and over HTTP
    Then the run event sequence and recorded file contents are unchanged
    And no query invokes an agent, an audit or an external command

  Scenario: QP04 Reopening preserves recorded answers and version errors
    Given recorded runs that the baseline supports and records it refuses
    When the harness reopens and the extracted readers answer their queries
    Then supported records produce the same answers as before reopening
    And unsupported or invalid records retain their documented errors and evidence
    And records are not rewritten to make a query succeed

  Scenario: QP05 Paging and polling retain their boundaries
    Given a recorded execution map and sessions with transcript cursors
    When a client requests bounded pages and session updates
    Then ordering, byte limits, cursors and cached finished-session behavior are preserved
    And stale run versions and invalid cursors retain their existing refusals

  Scenario: QP06 Projections preserve authority and uncertainty
    Given recorded architect reports, obligation bindings and audit outcomes
    And metric or module evidence that contains unavailable quantities
    When the extracted readers project progress, scenarios and evaluations
    Then architect-reported status remains distinct from automated test outcomes
    And unavailable quantities and their provenance remain explicit
    And reading creates no new semantic completion judgment

  Scenario: QP07 The child is understood through selected contracts
    Given the new module and its ordinary and testing API views
    When its consumers and tests import the behavior they require
    Then every imported symbol and signature companion is available through explicit exposure
    And the child receives no writable run service or ledger interface
    And private projectors do not become root or web production APIs
    And focused child tests and parent integration tests remain in configured discovery

  Scenario: QP08 Delivery is established on the exact candidate
    Given ramify-agent has performed the extraction in the target checkout
    When the final committed candidate is checked by its configured full nested audit
    Then every configured check and discovered test is accounted for with its actual outcome
    And the responsible architect reports each requirement's semantic disposition
    And the delivery receipt identifies the self-execution run and candidate commit
```

## Execution through ramify-agent

Use two distinct checkouts: a fixed, prepared bootstrap checkout that runs the
already-working ramify-agent, and a target checkout that receives the refactor.
The served project root is the target checkout's root. Keep the bootstrap process and its loaded code
stable while the target implementation changes.

Select a clean implementation base that includes the adjacent changes intended
for this delivery. Preserve current staged, unstaged and untracked user work;
do not use a blanket commit or reset to obtain that base. Record the selected
bootstrap and target revisions and refresh target architect/API evidence before
assigning work. The bootstrap must support existing module creation, local
architect work, gates and reviews; no new scheduling feature is a prerequisite.

The authored plan's canonical location is
`docs/plans/27-projections-extraction/main-plan.md` in the agent project. Include
it in the prepared target and place an exact copy at
`plans/projections-extraction/plan.md`, which is the existing discovery path.
Resolve any linked read-first documents against that canonical source, since
relocation does not preserve relative links.
Record the source path and hash with the run's retained input provenance. The
copy is execution input, not an independently maintained plan or status tree.

From the bootstrap checkout's root, serve the target through the
existing command, substituting the prepared target's absolute path and an
available port:

```sh
npm run serve -- --project /absolute/target --port 4302 --agent pi
```

Use the existing client to select `projections-extraction` and start the run,
or submit the existing `start-run` command through its HTTP protocol. Keep the
normal analysis review and architect authority rules. Retain the run ID,
captured plan, observations, gates, review records and final candidate identity.
This document does not start a run or certify its implementation.

## Completion

The child's ownership, parent-facing surface, selected inputs and test access
are valid under a completed `npm run check:self` from the target agent project.
Focused ordinary checks use `npm run test:quick -- <exact file filters>` with
the post-move paths obtained from configured discovery. Native checks, when
affected, use the existing registered boundary project. Do not run a direct
whole suite in place of the audit.

The final candidate must be clean and committed. From the target checkout's
root, use its installed audit CLI and committed configuration:

```sh
node_modules/.bin/ramify-audit audit --cwd . --full --nested --json
```

The configured checks include patch integrity, type checks, the complete test
configuration, Cucumber scenarios, structural validation and the web build.
Retain failures, skips, unavailable evidence and unrun checks as those outcomes;
do not convert them into passing claims. Passing audit evidence establishes
configured execution health. Responsible architects judge the extraction and
behavioral compatibility against this plan.

Write the delivery report beside the canonical plan as `results.md`. It must
identify the bootstrap revision, target baseline, run ID, final candidate,
actual ownership/API changes, moved and retained tests, verification evidence,
each acceptance example's disposition and remaining limitations. Include the
architect's explanation of the reduced parent context and the costs of the new
input exposures. A report is created during delivery, not as a planning receipt.

Planning completion consists only of a reviewable plan, valid document links
and parsable acceptance scenarios. It establishes no implementation, test-suite
health, live self-execution result or performance improvement.

## Read first in the selected target

All source paths below are relative to the target checkout's root.

- `AGENTS.md`, `docs/harness.principles.md` and `docs/testing.spec.md`.
- `subs/harness/README.md`, `subs/harness/module.ramify` and the root
  `module.ramify`, especially their existing protocol exposures.
- `.ramify-architect/_meta.json`, the harness module records and the new
  child's generated ordinary/testing API views once it is declared.
- `subs/harness/src/projections/queries.ts`, `inputs.ts`, `session-queries.ts`
  and `tree.ts`, plus the selected projector under investigation.
- `subs/harness/src/http/app.ts`, the committed-input methods in
  `subs/harness/src/run/service.ts`, and the focused tests named above.
- `vitest.config.ts`, `src/tests/test-boundaries.json`, `ramify-audit.json`
  and the installed project's current compiler configuration.

The model and architect documents linked above live in the containing Ramify
toolkit checkout at `docs/model/` and `docs/agents/`. They are governing design
references, not toolkit source dependencies. Use the target's installed Ramify
CLI and generated files for evidence and access decisions.
