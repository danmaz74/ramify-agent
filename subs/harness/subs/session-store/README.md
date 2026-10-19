# Session persistence

Owns durable session records, immutable content-addressed payloads, ledger replay,
record validation, detached reads and atomic compare-and-swap. The agent owns the
`SessionStore` contract. Workflow owners compose `openSessionStore` and retain
completion policy.

The harness parent exposes the existing ledger operations and the narrow
`SessionStoreLock` acquisition/check/release contract. Writer domains remain shared
within this implementation; separate processes still use the existing project
lock under each store directory. Record formats and persisted paths are unchanged.

`src/tests/` owns disk persistence/cache witnesses and the directory-scoped memory
adapter. The harness retains composed session-operation tests. Its test setup
substitutes this adapter for ordinary workflows; persistence witnesses explicitly
unmock the real implementation. Opt-in stress files remain outside audit discovery.
