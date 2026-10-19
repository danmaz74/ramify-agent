---
name: ramify-agent-coordinate
description: Implement or resume a plan with Codex Astra coordinating Sol workers and ramify-agent assessing committed iterations through MCP. Use for assisted implementation, not a harness-run plan or retrospective analysis.
---

# Coordinate an assisted execution

Use Astra for implementation coordination and native Sol subagents for engineering. Ramify-agent (RA) runs audit, protection comparison, Pi review and finding reconciliation. Keep detailed review work in RA; retrieve the compact result before deciding the next implementation action. Honor explicit user choices of models or delegation.

## Start or resume

Read the target project's instructions and the user's plan. RA reads `plans/<plan-id>/plan.md`; if the agreed plan lives elsewhere, prepare that input from it without changing its requirements. A plain plan with outcomes, constraints and acceptance is sufficient; no harness assignment decomposition or Gherkin conversion is required.

When the plan needs module-impact analysis or a useful iteration breakdown, use the [assisted planning skill](../ramify-agent-assisted-plan/SKILL.md) before registration. Use an existing adequate breakdown directly. During execution, start from its module focus, dependencies and integration obligations, and adapt the sequence when discoveries change the reasons for those boundaries. Preserve captured requirements and the original baseline while revising execution notes.

Use the target project's connected RA MCP tools. For first setup or unfamiliar arguments, read [assistance usage](../../../docs/agent-assistance.md). The server needs an implementation checkout with its dependencies, Pi credentials and the intended target project. If tools are unavailable, identify the missing connection and help set it up; do not claim an assessment or silently substitute a full harness run. One live harness owner holds the project lock.

Before implementation edits, inspect Git HEAD, existing changes and relevant protected inputs. When a host supplies a target root, plan ID and job ID, call `job_detail` for that exact registration first. Verify the returned project root and both IDs, read its captured plan and original baseline, and reuse it. Report an identity mismatch rather than registering another execution. Do not call `plan_start` for a supplied registration or substitute the checkout's current HEAD for its original baseline.

Without a supplied registration, call `plan_executions` to find an existing assisted execution before starting another. For a new execution, call `plan_start` with `plan_id`, `execution: "assisted"` and a unique `command_id`. Reuse that command ID and arguments if its response is lost. A deliberate new execution needs a new ID.

Read `job_detail` for the captured plan, original baseline, protection rules and setup gaps. Registration captures the plan once and does not commit source. Resolve unavailable or dirty protected baseline inputs before relying on protection. On continuation, use the captured plan; editing its original file does not update the registered input. Do not start another execution merely to discard findings or reset protection.

Retain the target root, `planId`, `jobId`, original baseline, open iteration IDs and latest assessment/candidate IDs in ordinary progress notes. Include the next outcome, active workers and material decisions when needed for continuation. This is a short restart note, not a second findings database. Tool arguments use snake_case; results in `structuredContent.result` use camelCase.

## Choose and delegate an iteration

Read the shared [module orientation](../ramify-agent-module-work/references/module-orientation.md) before choosing module focus or briefing workers. Use module purposes and the project-wide architect view for discovery; check the consuming module's ordinary or testing API catalog before assuming it can import an interface. A TypeScript export or a symbol in the architect view alone does not establish that availability. Keep these distinctions in worker briefs; delegate deeper exposure analysis when needed.

Choose a coherent behavior and its verification, rather than treating every worker turn as an iteration. Use module focus when one owner's internals dominate the reasoning and external contracts are stable. Keep an assignment broader when interfaces must be discovered together, integration dominates debugging, or a small mechanical change spans several owners. Do not calculate a score or require a worker per module.

Give workers the [module-work skill](../ramify-agent-module-work/SKILL.md), including its resolved path when it is not discoverable in their session. It also supports broader assignments. A useful short brief contains:

- Outcome and acceptance, with plan references.
- Focus module, if useful, and why; source/API/test starting points.
- Applicable principles and specifications, preserving status and source references; relevant protected paths.
- Known consumer/provider obligations, overlapping writers and who verifies integration.

For a module-focused worker, supply the absolute target worktree root, module root and `<module-root>/src` working directory, all in the intended worktree. Set the worker's launch CWD there when supported. If the native launcher has no CWD option, explicitly instruct the worker to use that directory for its shell calls and resolve file-tool paths against it; do not assume a shell `cd` persists across calls. The worker skill requires the same shared module orientation. Project-wide commands use the project root explicitly. For a broader assignment, choose the project root or a useful common starting directory; an absent module `src/` uses the module root until implementation requires source there.

For example: “Implement parser validation in the evidence module because its internals dominate this change and the caller contract is stable. Preserve blob compatibility; add regression cases for malformed records and verify the protection consumer. Edit that consumer if necessary.”

Sol may edit other modules without scope expansion or permission based on module ownership. Use another worker when the work is substantial and separable; keep interacting provider and consumer changes together when that reduces repeated discovery. Reconsider the split if workers wait on each other or repeatedly relearn shared behavior. Coordinate overlapping writers through ordinary messages or separate worktrees.

Immediately before implementation of the chosen outcome begins, call `iteration` with `action: "start"`, the registered `plan_id` and `job_id`, a unique retryable `command_id`, the outcome in `brief` and `focus_module` as a project-relative module path or explicit `null` for a broader assignment. Omit `base` to capture checkout HEAD, or name an explicit revision when needed. Retain the returned `id` as `iteration_id`, along with its start time, resolved base and Git provenance in continuation notes. Dirty starts are allowed but qualify attribution; unavailable cleanliness remains unknown. Start launches no assessor or implementation. Multiple open iterations are allowed; always identify the intended one.

## Assess and act

After implementation and relevant local verification, prepare the intended candidate commit under existing user authorization. Keep unrelated edits out. RA assesses commits; uncommitted repairs do not change its result. Let RA run the configured audit with default provider selection; do not duplicate a full audit merely to submit an assessment.

Call `iteration` with `action: "end"`, the registered IDs, retained `iteration_id`, exact `candidate` commit, applicable `acceptance` references and a new `command_id`. It inherits the stored initial commit, brief and focus; do not repeat or replace them. Supply pinned `requirement_documents` when needed, and optional `additional_context` to supplement the original outcome. Retain the returned `assessmentId` as `assessment_id` for observation. End submits a candidate for checking and does not assert acceptance.

For a repair, call end again with the same iteration ID, a new candidate and command ID, and `previous_assessment` pointing to the prior assessment. Preserve that iteration's original start and base; repairs are assessment attempts within it. Retry a lost start or end response with exactly the same command ID and arguments. Recover iteration records and linked assessments with `job_detail`; an iteration with no submission remains started and unassessed.

Use `assessment_wait` with `timeout_ms: 900000`, then `assessment_result` when completed. Omit `after_revision` during ordinary waiting so routine stage checkpoints do not wake the model. The wait returns early for completion, interruption or cancellation. On timeout, inspect the returned status and any concrete health concern, then wait again if work remains healthy; elapsed time alone does not justify cancellation or resubmission. Use `assessment_status` for an immediate observation and `assessment_detail` only for evidence needed to resolve a concrete issue. Prepare independent work while waiting, without accepting dependent work ahead of the result.

When waiting for native workers, use `wait_agent` with `timeout_ms: 900000` where supported; it returns early for messages or completion. Do not substitute repeated sleeps, status requests or filesystem inspection of workers. For commands, use the longest supported interruptible process wait up to 15 minutes; a shorter tool limit is a fallback, not a reason to poll every second. Report meaningful changes, blockers, decisions and completion rather than repeated unchanged status. Keep ordinary engineering work with the workers and assessment observation with the coordinator. Read the [passive-wait setup](../../../docs/agent-assistance.md#passive-waiting) when configuring host instructions and transport timeouts; skill text alone cannot override a higher-priority periodic-commentary requirement.

| Result | Next action |
| --- | --- |
| `clear` | Continue from this assessed candidate. |
| `action-required` | Give native workers the concise repair brief; resolve only remaining decisions that need authority. Assess the repaired candidate. |
| `incomplete` | Investigate the missing evidence or failed stage, while also handling established repairs. It is not an acceptance. |

Correctly repaired issues need no separate approval or historical-incident notification. Pi investigates and reconciles; do not manually repeat its reviews in Astra. If an unavailable diagnostic blocks Pi, arrange the needed investigation with a native worker and provide concrete evidence references on reassessment. Preserve genuine evidence gaps.

Use `finding_list` for pending choices. `finding_answer` records an actual authorized user choice; `protection_accept` records explicit acceptance of one exact protected change from a completed assessment. Read the usage guide for their arguments when needed. Neither command edits source or authorizes itself. Required audit failures cannot be waived. Complete the applicable assessment, including the cumulative final assessment when the plan is ready, before asking the user to approve, or while they consider the exact proposed diff shown inline. Make approval the final ordinary step. On an unchanged candidate with retained readiness evidence, `protection_accept` atomically derives its effective result from the verified stages and typed authority dependencies without rerunning audit or Pi. Read `assessment_result` for the effective gate and `assessment_detail` for the original outcome and derived provenance. Every protected difference needs exact authorization; unrelated failures, repairs and gaps remain blocking. Historical assessments without readiness evidence or typed dependencies require an ordinary fresh assessment; do not interpret arbitrary review prose as an authority dependency. A changed candidate always requires fresh assessment. Avoid turning optional observations into tracker tickets.

## Continue or finish

On reconnect, recover the same job and assessment IDs. An interrupted assessment can use `assessment_resume` to reuse retained stages. A completed `incomplete` result needs its gap addressed and a new assessment. Cancel only work no longer wanted or explicitly requested to stop; do not edit RA's durable records manually.

When all plan outcomes are implemented, separately call `iteration_assess` with `kind: "final"`, the registered IDs, exact `base` and `candidate`, a whole-plan `brief`, `acceptance` and a fresh `command_id` and `plan_baseline` equal to the original registered baseline. Keep this cumulative assessment separate from the native iteration record; its comparison uses the original registered plan baseline. A local iteration pass does not replace cumulative review. Report the final gate, candidate and remaining limitations. Publishing, merging and tracker synchronization retain their own authorization requirements.

### Useful review decisions

Default to one broad review of a coherent iteration. Repairs keep its iteration
ID and previous assessment. RA verifies selected repairs and relevant surrounding
behavior; do not request another broad pass merely because a candidate changed.
Supply `review_reason` only for a concrete useful reason, such as substantial new
behavior. Read `review-policy` stage evidence when the distinction matters.

Use `finding_decide` with `action: "fix"`, `"leave"` or `"defer"` and a short
`rationale` for discretionary concerns. This records coordinator judgment rather
than user approval. Read the effective result afterward; unmet requirements and
required checks still need repair. A failed configured audit returns diagnostics
directly without semantic review; send those diagnostics to the engineer.

An unavailable advisory review calls for ordinary judgment. Investigate useful
missing evidence or record `review_continue` with a rationale when continuing is
appropriate. Never use it to stop a running review. Keep the unavailable stage
visible and preserve concrete unmet requirements and other gaps.

When the only remaining conditions are exact protected-document authorizations
intentionally held for final approval, continue independent and dependent planned
engineering using the completed substantive assessment. Protection remains open:
finish the plan assessment, show the concrete cumulative protected diffs, and seek
actual user authority as the final step. Never fabricate a user answer to advance
ordinary work.
