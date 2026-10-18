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

Before implementation edits, inspect Git HEAD, existing changes and relevant protected inputs. Call `plan_executions` to find an existing assisted execution before starting another. For a new execution, call `plan_start` with `plan_id`, `execution: "assisted"` and a unique `command_id`. Reuse that command ID and arguments if its response is lost. A deliberate new execution needs a new ID.

Read `job_detail` for the captured plan, original baseline, protection rules and setup gaps. Registration captures the plan once and does not commit source. Resolve unavailable or dirty protected baseline inputs before relying on protection. On continuation, use the captured plan; editing its original file does not update the registered input. Do not start another execution merely to discard findings or reset protection.

Retain the target root, `planId`, `jobId`, original baseline and latest assessment/candidate IDs in ordinary progress notes. Include the next outcome, active workers and material decisions when needed for continuation. This is a short restart note, not a second findings database. Tool arguments use snake_case; results in `structuredContent.result` use camelCase.

## Choose and delegate an iteration

Choose a coherent behavior and its verification, rather than treating every worker turn as an iteration. Use module focus when one owner's internals dominate the reasoning and external contracts are stable. Keep an assignment broader when interfaces must be discovered together, integration dominates debugging, or a small mechanical change spans several owners. Do not calculate a score or require a worker per module.

Give workers the [module-work skill](../ramify-agent-module-work/SKILL.md), including its resolved path when it is not discoverable in their session. It also supports broader assignments. A useful short brief contains:

- Outcome and acceptance, with plan references.
- Focus module, if useful, and why; source/API/test starting points.
- Applicable principles and specifications, preserving status and source references; relevant protected paths.
- Known consumer/provider obligations, overlapping writers and who verifies integration.

For example: “Implement parser validation in the evidence module because its internals dominate this change and the caller contract is stable. Preserve blob compatibility; add regression cases for malformed records and verify the protection consumer. Edit that consumer if necessary.”

Sol may edit other modules without scope expansion or permission based on module ownership. Use another worker when the work is substantial and separable; keep interacting provider and consumer changes together when that reduces repeated discovery. Reconsider the split if workers wait on each other or repeatedly relearn shared behavior. Coordinate overlapping writers through ordinary messages or separate worktrees.

## Assess and act

After implementation and relevant local verification, prepare the intended candidate commit under existing user authorization. Keep unrelated edits out. RA assesses commits; uncommitted repairs do not change its result. Let RA run the configured audit with default provider selection; do not duplicate a full audit merely to submit an assessment.

Call `iteration_assess` with the registered IDs, exact `base` and `candidate` commits, intended outcome in `brief`, applicable `acceptance` references and a new `command_id`. Use the iteration's starting commit as `base`; after a repair, preserve enough comparison scope to cover the original outcome. Link the prior assessment with `previous_assessment`. Supply pinned `requirement_documents` when needed. Retain the returned `assessmentId` as `assessment_id` for observation.

Use `assessment_status` for quiet polling, then `assessment_result` when completed. Audit can take several minutes; elapsed time alone is not a reason to cancel. Prepare independent work while waiting, without accepting dependent work ahead of the result. Read `assessment_detail` only for evidence needed to resolve a concrete issue.

| Result | Next action |
| --- | --- |
| `clear` | Continue from this assessed candidate. |
| `action-required` | Give native workers the concise repair brief; resolve only remaining decisions that need authority. Assess the repaired candidate. |
| `incomplete` | Investigate the missing evidence or failed stage, while also handling established repairs. It is not an acceptance. |

Correctly repaired issues need no separate approval or historical-incident notification. Pi investigates and reconciles; do not manually repeat its reviews in Astra. If an unavailable diagnostic blocks Pi, arrange the needed investigation with a native worker and provide concrete evidence references on reassessment. Preserve genuine evidence gaps.

Use `finding_list` for pending choices. `finding_answer` records an actual authorized user choice; `protection_accept` records explicit acceptance of one exact protected change from a completed assessment. Read the usage guide for their arguments when needed. Neither command edits source or authorizes itself. Required audit failures cannot be waived. After an accepted protected exception, submit a fresh assessment; the old result is not rewritten. Avoid turning optional observations into tracker tickets.

## Continue or finish

On reconnect, recover the same job and assessment IDs. An interrupted assessment can use `assessment_resume` to reuse retained stages. A completed `incomplete` result needs its gap addressed and a new assessment. Cancel only work no longer wanted or explicitly requested to stop; do not edit RA's durable records manually.

When all plan outcomes are implemented, submit `kind: "final"` with `plan_baseline` equal to the original registered baseline, the current candidate and the whole plan's acceptance question. A local iteration pass does not replace cumulative review. Report the final gate, candidate and remaining limitations. Publishing, merging and tracker synchronization retain their own authorization requirements.
