# Assisted service contract

The harness owns assisted execution records under the same `plans/<plan-id>/.harness/jobs/<job-id>/` directory as implementation and manual jobs. An assisted job has kind `assisted`, the existing job schema version and job ID format, a captured `input/plan.md` with its SHA-256, the project identity, and frozen protection rules, Git baseline and setup gaps. `plan_start` reads only `plans/<plan-id>/plan.md`; it does not start the implementation driver.

The MCP stdio command is `ramify-agent mcp --project <root>`. It uses the existing project lock, so it cannot write beside another owner. The service owns all durable state; the MCP adapter validates arguments and forwards operations. Its operations are:

| Tool | Behavior |
| --- | --- |
| `plan_start(plan_id, execution, command_id, protection?)` | Registers a new assisted job. The optional policy adds explicit paths, exclusions, guarded paths and an additions rule; the default project guards remain enforced. Repeating the same command returns the original identity, while changing policy under the same ID conflicts. |
| `plan_executions(plan_id?)` | Lists implementation, manual and assisted job identities and kinds from the shared job directories. |
| `job_detail(plan_id, job_id)` | Reads the registered job, captured plan, baseline and protected-input gaps. |
| `iteration_assess(plan_id, job_id, base, candidate, brief, acceptance, command_id, ...)` | Resolves Git commit IDs and admits a background assessment, returning its ID. A final assessment also names the original plan baseline. `previous_assessment` must belong to the same job. |
| `assessment_status`, `assessment_result`, `assessment_detail` | Read an assessment without starting work. Result is absent until completion; detail includes retained stage evidence. |
| `assessment_cancel`, `assessment_resume` | Cancel only the named assessment, or explicitly continue interrupted work. Reconnection alone never continues work. |
| `finding_list` | Reads the job's current findings and pending choices. |
| `finding_answer` | Records an already-authorized user's answer to an offered option, with the actual `user_name`, governing `authority` reference and a stable `command_id`. It makes no source edit or automatic waiver. |
| `protection_accept` | Records an already-authorized user's acceptance of one exact protected change. It binds the path, before and after identities, current required protection finding and stage evidence, then persists a request and answer in one ledger transition. |

Tool arguments use snake_case. Successful responses carry the service value in `structuredContent.result` and as JSON text; service fields use camelCase (`planId`, `jobId`, `assessmentId`). `assessment_result` returns `null` until an outcome exists.

Each assessment captures the submitted base and candidate commit, brief, acceptance references, requirement document versions resolved to full Git commits and optional prior assessment ID. Requirement document paths are project-relative. Its immutable revision files are under `assessments/<id>/rev-<revision>.json`. Stage evidence is materialized at `assessments/<id>/stages/<stage>.json` in the same ledger transition. Finding reports and decisions use the existing CheckFinding domain and materialized records under `check-findings/` in that job.

The generic `events.jsonl` ledger is the commit point for registration, assessment transitions, stage evidence and finding decisions. Command hashes and receipts are reloaded from it after restart. A missing materialized record is repaired from the ledger; a queued or running assessment found on service startup becomes interrupted and waits for explicit resume. Completed stage evidence survives continuation. A stable finding operation key prevents duplicate decisions if a process stops after committing findings and before recording a later stage.

The service's assessor callback receives the captured job, assessment, plan, abort signal, durable stage checkpoint, prior assessment records and current findings. It returns `clear`, `action-required` or `incomplete` with concise repairs, decisions, gaps and evidence references. The transport never infers `clear`: absent assessment capabilities produce `incomplete`.
