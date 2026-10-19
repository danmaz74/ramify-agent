# Iteration 2 — complete assistance owner

Base: `8ad6fe1d381f3d33665be701a37a12df472035f7`. Implemented under the user-approved native coordination/review cadence recorded in [execution notes](../execution-notes.md). Historical RA outcomes are unchanged. The parked inspection experiment is excluded.

The real assistance service, durable store, assessor, protection/approval/finding adapters, Pi and evidence tools, audit composition, runtime and MCP transport now live in `subs/harness/subs/assistance`. Root startup imports the real child implementation and receives only the three supported facade bindings through harness: `startAssistanceServer`, `AssistanceServerOptions`, `AssistanceServer`. No old assistance forwarders remain.

Shared concern binding and candidate ownership signals, reconciliation schema/validator/factual rendering and the reader queue belong to reviews. Autonomous wrappers retain work-item authority, basis/assessment records, completion and finding-commit policy. Shared finding transaction construction is an explicit parent contract without RunLog or autonomous service dependencies. Jobs, commands, project locks, state-directory and audit-workspace mechanisms remain parent-owned. Existing sibling providers retain their responsibilities. The agent exports a distinct `AgentSessionLineage` binding beside the unrelated browser projection's `SessionLineage`.

Service/MCP shapes, durable schemas, command replay, captured baselines, protection decisions, interrupted stages/resume and exact candidate text verification remain unchanged. Reviews retain the qualified no-time-limit behavior. Ordinary tests retain process guarding; no native registrations/configuration changed.

## Actual structural observations

Counts use the base Git tree versus current source, excluding generated views. Named-relative-import counts identify the target file and imported export spelling; they are source descriptors, not provider-generated identity proofs.

| Descriptor | Before | After |
| --- | ---: | ---: |
| Assistance production files / lines | 13 / 2,212 in parent | 13 / 2,212 in child |
| Assistance local tests / lines | 10 / 2,115 in parent | 10 / 2,116 in child |
| Parent production files | 222 | 208 |
| Parent testing files | 421 | 410 |
| Assistance direct external named import bindings | 88 | 88 |
| Assistance direct external target files | 37 | 37 |
| Assistance parent-facing API bindings | same startup facade | 3 |

The new child directly consumes nine owners: parent common mechanisms plus agent, audit, check-findings, evidence, ledger, plan-evidence, reviews and session-store. Shared queue tests moved to reviews; mixed autonomous/provider integration tests retain parent ownership. Ordinary and testing API catalogs were refreshed and checked at the assistance, harness and root consumers, including the actual root facade. Generated coverage remains partial.

## Verification

- Focused guarded Node checks: 20 files, 180 tests passed, including all 94 moved assistance cases, official MCP client integration, composed real assessor with scripted external answers, review providers, autonomous reconciliation/review consumers and composition inventory.
- `npm run type-check`: passed.
- `npm run check:self`: passed, 18 owners, zero errors/warnings; 468 analysis limits remain explicit.
- `git diff --check`: passed.
- No duplicate full audit; final configured audit and whole-plan native review remain scheduled by the coordinator.

No protected requirements, manifests, lockfiles or test/runner configuration changed. No comparative productivity, latency or token benefit was measured. Existing immutable baseline artifacts were preserved; no large producer evidence was duplicated.
