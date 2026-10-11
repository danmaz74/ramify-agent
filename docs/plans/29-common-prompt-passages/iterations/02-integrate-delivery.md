# Iteration 2: integrate composed prompts and existing delivery

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 1's committed helpers, inspected examples and receipt. Recheck any
intervening Plans 27/28 changes. Owner: harness packet, briefing, session-operation
and run callers; review child retains its input/message ownership. Read the
main plan's delivery contract, Plans 25/28, existing operation-intent schemas
and relevant focused tests.

## Goal

All task families compose useful shared prose and current facts, with correct
inheritance and without newly emitted JSON environment blocks.

## Deliverables

- Wire the helpers into current architect, engineering, context-selection,
  review, catalog, capability, contract, standalone, consultation, failure and
  NFR call paths. Remove both `environmentFields` JSON delivery in `tasks.ts`
  and `# Current environment` JSON rendering in `packages.ts`.
- Keep runtime `TaskEnvironment`/operation data and independent validation where
  needed. No JSON-to-prose conversion of machine schemas, quoted user content or
  internal evidence records.
- Route migrated common sections directly into named briefing inputs. Remove
  their duplicate copies from monolithic renderers and duplicate-stripping
  inputs. Canonical goal/requirement validation must continue to validate the
  real current content without requiring two physical copies.
- Use existing resolution and withdrawals. Restate desired shared inputs at
  their producers; inherit their current bytes at the selected point. Supply
  changed states and current-task facts directly. Handle old environment keys
  with one explicit removal per effective value; preserve historical evidence.
- Preserve fixed admitted-operation replay, role/package pins, active-tool
  changes, fresh fallback, selected procedure, authority and effective bound
  merging. No session-topology or package-hot-upgrade feature.
- Render review/NFR task inputs as useful prose with their existing identity,
  scope and uncertainty semantics. Do not add Plan 28's grounding exception.
- Update package source/provenance capture for shared fragments; prevent
  neighbor spacing or alternate producer headings from defining their identity.

## Verification

Own D01–D10 and retain C01–C06. Use scripted process boundaries. Run affected
composition tests and the focused delivery surfaces from the repository root:

```sh
npm run test:quick -- subs/harness/src/tests/plan25-task-packets.test.ts subs/harness/src/tests/plan25-blocks.test.ts subs/harness/src/tests/plan25-block-sessions.test.ts subs/harness/src/tests/plan25-discovery-delivery.test.ts subs/harness/src/tests/review-diff-delivery.test.ts subs/harness/src/tests/plan25-nfr-context.test.ts
```

Add affected rare-role tests from configured discovery. Check full role/task
construction coverage using the existing supported-pair tests, with small
representative branch fixtures rather than an exhaustive combinatorial sweep.
Update obsolete assertions demanding all nine environment entries; preserve
tests of execution state and `/1`/`/2` readers. Render the iteration 1 examples
again through the actual production path and inspect differences.

## Exit and handoff

New-format prompts satisfy both JSON-renderer removals and common-passage reuse.
Retries remain exact; current facts and authority remain correct on fresh,
continued and forked tasks. Commit and write `02-results.md` with per-case
evidence, actual rendered examples and remaining qualification work.
