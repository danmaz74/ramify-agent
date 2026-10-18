---
name: ramify-agent-assisted-plan
description: Create or revise a plan for native Astra/Sol implementation with ramify-agent assessments, optimizing iterations around useful module specialization. Use for assisted planning and module-impact analysis, not full-harness plan authoring or execution.
---

# Plan assisted implementation

Produce a practical implementation plan whose iteration boundaries reduce repeated orientation, context load, waiting and integration rework. Preserve the requested behavior and architectural commitments. Module-specialized iterations are useful when they reduce total effort; their number is not a success metric.

This skill prepares the plan for the [coordinator skill](../ramify-agent-coordinate/SKILL.md). Astra owns the proposed decomposition and can use native Sol investigation when useful. Planning needs ordinary repository inspection and the installed Ramify tools; no RA MCP connection or registered job is required. Planning alone does not launch implementation or call `plan_start`.

## Establish requirements and module impact

Read the target project's instructions, the request or existing plan, and applicable principles and specifications. Preserve approved outcomes, acceptance, compatibility and genuine ordering constraints. Distinguish these commitments from suggested implementation choices. Preserve document status and source references; a principles filename does not establish adoption. Identify protected commitments a proposed design would need to change, without editing them to fit the plan.

Map each meaningful outcome to likely affected owners and existing behavior to reuse. Start with module purposes, generated architect/API views and declared tests, using the project's installed toolkit commands. Inspect relevant source and consumers to resolve questions the views cannot answer. An ownership hint does not establish that an interface exists or is available to a consumer. Record important evidence locations and unknowns; do not survey every module or load unrelated internals.

The impact overview should explain:

- Where the implementation knowledge is concentrated and which existing facilities can serve the outcome.
- Which interfaces, module responsibilities or dependency relationships may change, and which consumers are affected.
- Which contracts are stable and which need joint discovery.
- Which principles, specifications and protected inputs constrain the choices.
- How composed behavior will be verified, including obligations spanning iterations.

Keep this overview brief and proportionate to the change. For substantial investigation, delegate bounded questions to native Sol when available and useful: affected contracts, reuse options, integration evidence and plausible iteration boundaries. Request a concise synthesis with source references and uncertainties, not source dumps. Astra reconciles the conclusions; independent investigations are worthwhile only when they avoid duplicated orientation. Honor the user's model and delegation preferences.

## Choose useful iteration boundaries

Group work around a coherent outcome and its verification. Prefer module focus when one owner's internals dominate reasoning and the external contract is sufficiently understood. Keep interacting changes together when interfaces must evolve jointly, debugging depends on both sides, or a small mechanical migration spans several owners. Do not derive a worker or iteration for every touched module.

Compare the benefit of focused context with briefing, handoff, waiting and integration costs. Reuse an already-oriented worker where that helps. Explain a non-obvious boundary in a sentence; avoid scores, file-count thresholds or mandatory compliance tables.

For example, a provider implementation and a small consumer adaptation can form one provider-focused iteration, including both edits and their integration test. If both owners require substantial independent work behind an understood contract, separate assignments may help. If the contract is uncertain, first propose a bounded investigation or a broader implementation iteration that establishes it. An investigation's result is a resolved question or supported recommendation; it does not count as delivery of the feature.

Module focus never restricts writes or reads. Expected touched modules are forecasts. A worker can make necessary cross-module changes without scope expansion, approval based on ownership, or a new task record. A protected change or revised requirement still follows the target project's authority rules.

## Sequence outcomes and integration

Order iterations by real behavioral dependencies and compatibility needs. Mark useful parallel work only when assumptions are stable enough and overlapping writes can be coordinated. Avoid parallelism that makes several workers rediscover the same contracts or fixtures.

Assign consumer/provider integration to an explicit iteration or assignment. A local implementation or mock-based test is not evidence that the composed outcome works. Preserve incremental compatibility where required and identify verification that must occur after dependent changes are combined.

Expose assumptions that could change the breakdown. Say what discovery would justify combining, splitting or reordering iterations. Keep uncertainty local; do not turn every possible concern into a preliminary investigation. Each implementation iteration ends with relevant worker verification and RA assessment of the committed candidate. Include cumulative assessment against the original plan at completion; the coordinator handles the MCP mechanics.

## Write and hand off the plan

Use one ordinary Markdown document in the requested or established project location. For a new execution-ready input with no specified location, use `plans/<plan-id>/plan.md`. Preserve an existing plan's requirements when optimizing its breakdown. Include outcomes and acceptance, a concise module-impact overview, the proposed iterations, and material uncertainties; adapt the format rather than imposing a schema.

For each iteration, provide the useful details:

| Item | Content |
| --- | --- |
| Outcome and acceptance | Behavior or bounded investigation result that becomes complete, with requirement references. |
| Focus and rationale | Principal module or broader grouping, and why the boundary should save effort. |
| Interactions | Expected interface/consumer changes, relevant commitments and integration responsibility. |
| Dependencies and verification | Necessary predecessors, useful parallel work and evidence needed to demonstrate completion. |

Check that every required outcome has implementation and verification coverage, including cross-module behavior. Keep tentative interface designs and iteration choices distinguishable from requirements. Do not introduce a new acceptance database, harness assignment format or task tracker.

Hand off the plan path, key decomposition choices and unresolved decisions. The coordinator starts from this breakdown and adapts it to evidence. If an assisted execution already exists, preserve its captured requirements and original baseline: execution sequencing may change in ordinary progress notes, but editing the source plan does not replace RA's captured input. Identify material requirement changes explicitly instead of silently registering a fresh execution.
