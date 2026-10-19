# Work coordination

Owns the actual placement and work loop, source/context selection, hypothesis
and frontier delivery, iteration/outline/assignment decisions, contract
registration and revisions, provider obligations, and depth-first capability
qualification, delegation, consultation and consumer/provider handback.

`WorkCoordination` receives captured run inputs and detached, versioned committed
observations. It owns its prepared-scope cache. Its ports execute prepared tasks,
read retained evidence, qualify exact candidates, publish proposed transitions
and perform named idempotent effects. No mutable run, log, ledger, mutex or live
session map crosses that interface. Lifecycle serializes accepted writes and
revalidates capability transitions against the current stack and record bodies.

Acceptance still lives in the autonomous parent during iteration 5. It returns
candidate-bound gate, immutable record reference, tree, review and reconciliation
evidence for handback. Lifecycle rechecks that evidence under handback
serialization; coordination records the returned capability and resumes the
original consumer goal. Recovery retains the authenticated accepted action and
completed gate, including historical records without optional later context.

The domain selectors, immutable publication builders and historical delivery
helpers are shared with managed/manual execution and read-only projections.
Planning, task execution, evidence, agent/Pi, ledger, KPI and the other existing
providers remain composed through their declared APIs. Iteration 6 extracts
qualification, review/reconciliation and completion eligibility and resolves the
remaining acceptance/lifecycle mixed files.
