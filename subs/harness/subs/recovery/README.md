# recovery

Shared task re-entry policy for hosted runs and standalone execution. The owner
supplies current authority, stop state, actual attempt settlement, an accepted
result when present, and particular unresolved consequential operations.
`decideTaskReentry` returns execution, result delivery or a concrete reason to wait.
`taskInterruption` classifies an interrupted attempt. `mayRetryTask` and
`taskRetryDelay` supply the common bounded retry policy; standalone callers use
`waitForTaskRetry` to cancel a pending delay.

Session history and runtime hashes are not prerequisites. A pending task uses its
ordinary constructor and current project state, including a fresh agent session.
See the [recovery principles](../../../../docs/harness-recovery.principles.md).

This module owns no durable state, scheduler, provider session or effect executor.
The harness owns assignments and accepted workflow changes. The ledger supplies
durability; the agent and process owners establish cancellation and settlement;
Git and other operation owners inspect consequential effects. Callers enforce
these boundaries before dispatch and use their ordinary acceptance afterward.
