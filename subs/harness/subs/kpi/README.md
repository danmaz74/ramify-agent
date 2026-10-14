# kpi

Measurement and attribution rules. This ordinary, untagged direct harness child
owns pure exact setup-line verification and delivered-change attribution.

## Contracts and invariants

- `src/setup-attribution.ts`: `verifySetupLineIdentities` accepts authenticated
  ordered Git facts, recorded setup deltas and complete direct-diff partitions.
  It returns revision-bound `HarnessLineIdentities`. No lineage guessing,
  same-text alignment, path exemption or count subtraction is permitted.
  Unknown (`null`) is distinct from verified absence (`[]`). Invalid candidate
  identity or missing direct-diff partitions throws the original errors.
- `src/delivered.ts`: `deliveredChange` reads evidence-owned `ChangeHistory` and
  harness-owned recorded `LineEventSummary` facts. It compares BASE with accepted
  FINAL, counts only surviving change, splits shared commits by recorded per-path
  additions/deletions, and preserves binary paths, unattributed reasons, ordering,
  partial subtotals, unavailable and not-applicable outcomes.
- `cachedChangeHistory` keeps argument-keyed promises, evicts oldest entries past
  its bound (default 512), and discards rejected answers. Hits do not refresh FIFO.

The harness remains composition owner and the sole durable writer. The child
receives reading contracts only, never a run/ledger service, prompt, assignment,
process launcher or measurement acquisition implementation. Git stays evidence-owned.
There is no browser KPI API. The declaration exposes selected behavior and every
owner-local named signature companion to the parent; foreign companions are
already received by that parent from their governing owners.

## Tests

Follow the root [testing rules](../../../../docs/testing.spec.md). Tests in
`src/tests/` script only external Git answers and exercise the real provider.
Run from the project root:

```
npm run test:quick -- subs/harness/subs/kpi/src/tests/setup-attribution.test.ts subs/harness/subs/kpi/src/tests/delivered-change.test.ts
```

The process guard, configured discovery and exact native registrations are
unchanged. Scratch-cwd and lineEvents collection coordination remain harness-owned.
See [transition inventory](transition.md) for retained baseline duplicates,
comparison evidence, access limitations and subsequent owner-scoped migration.
This bootstrap does not establish consumer composition or cap-001 completion.
