---
name: ramify-agent-coordinate
description: Coordinate native implementation of a real Ramify plan through ramify-agent's assisted MCP assessments. Use for an assisted execution; do not use for a full harness implementation run.
---

# Coordinate an assisted execution

Keep implementation sequencing and worker assignments in the native Codex session. Ramify-agent owns the assessment, findings and gate. Read the target project's instructions and the captured plan at `plans/<plan-id>/plan.md` before assigning work.

Connect the ramify-agent MCP service for the target project as described in [assistance usage](../../../docs/agent-assistance.md). Before edits, inspect Git HEAD, protected source, local status and existing materialized Ramify views, then use `plan_executions` to find an existing assisted job when continuing. Start a new execution with `plan_start` once, using a unique `command_id`; retain its returned `planId` and `jobId`, passed as `plan_id` and `job_id` in subsequent calls. Retry a lost response with the same command ID. Start a deliberate second execution with a new command ID. Use `job_detail` to inspect the captured plan and fixed protection baseline, rules and setup gaps. Resolve protected input gaps before relying on the baseline; registration does not commit source.

Give native Sol workers bounded implementation outcomes and relevant project context. Module focus is an efficiency choice, never a write boundary. Workers may change any modules required for a coherent implementation. They report actual edits, checks and integration needs. Keep candidate commits under the target project's ordinary Git authorization and instructions; assessment itself never commits.

Tool results are in `structuredContent.result` and use camelCase fields; tool arguments use snake_case. Retain the returned `assessmentId` as subsequent calls' `assessment_id`.

For each completed iteration, call `iteration_assess` with the registered IDs, the base and exact candidate commits, a concise outcome brief, and applicable acceptance references. Use a new `command_id` for each new assessment, retaining it for retries. For a repair or later iteration, pass `previous_assessment` when applicable. Final cumulative assessment uses `kind: final` and `plan_baseline` equal to the original execution baseline. The result concerns the submitted candidate even if the checkout advances.

Use `assessment_status` for quiet observation at a useful interval. Polling starts no work. Read `assessment_result` after completion and `assessment_detail` only when the concise result lacks evidence needed for a decision. Resume an interrupted assessment explicitly with `assessment_resume`; cancel only the named assessment when instructed or when its work is no longer wanted.

Act on the gate: delegate evidence-backed repairs to native workers and submit a new committed candidate; resolve only remaining material decisions with the user when authority is needed; investigate `incomplete` gaps before claiming success. Correctly repaired issues need no separate user approval. Use `finding_list` and `finding_answer` only to record an already-authorized user's offered choice, with that user's actual name and governing authority. A failed required audit or unresolved protected change cannot be waived by reviewer prose. Preserve the earlier candidate and assessment identities. Do not create tracker issues or publish/merge as a consequence of a gate result alone.
