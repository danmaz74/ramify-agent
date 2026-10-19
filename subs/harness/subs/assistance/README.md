# Assistance

Owns the complete assisted workflow: service admission, durable job/iteration/assessment records, command replay, protection and approval, audit composition, exact candidate evidence, assessor findings and reconciliation, Pi lifetime and MCP transport. The root executable receives only `startAssistanceServer` and its options/lifetime contracts through harness's facade.

The service keeps the existing job and assessment identities, original plan baseline, record schemas, idempotent commands and interruption/resume behavior. MCP forwards validated requests to that service. Queries remain read-only. Pi review and reconciliation run until submission, explicit cancellation/shutdown or actual failure; observation waits have their own bounded lifetime.

Shared review judgment validation, concern binding, factual reconciliation rendering and the reader queue belong to the reviews provider. Each workflow supplies its actual authority, provenance and lifecycle policy. Assistance does not import the autonomous run service. Common job/command, lock/state-directory, finding transaction and audit-workspace mechanisms remain explicit parent contracts. Sibling agent, session-store, ledger, evidence, audit, check-findings, plan-evidence and reviews contracts are re-exposed by harness.

Owner-local tests use real service/store/assessor logic with scripted external answers. The MCP tests use the official client over linked in-memory transport. Shared provider and autonomous wrapper tests remain with their respective behavior.
