---
name: ramify-agent-assisted-plan
description: Create or revise a plan for native Astra/Sol implementation with ramify-agent assessments, optimizing iterations around useful module specialization. Use for assisted planning and module-impact analysis, not full-harness plan authoring or execution.
---

# Plan assisted implementation

Produce a practical implementation plan whose iteration boundaries reduce repeated orientation, context load, waiting and integration rework. Preserve the requested behavior and architectural commitments. Module-specialized iterations are useful when they reduce total effort; their number is not a success metric.

This skill prepares the plan for the [coordinator skill](../ramify-agent-coordinate/SKILL.md). Astra owns the proposed decomposition and can use native Sol investigation when useful. Planning needs ordinary repository inspection and the installed Ramify tools; no RA MCP connection or registered job is required. Planning alone does not launch implementation or call `plan_start`.

## Understand the module structure before decomposing work

Read the shared [module orientation](../ramify-agent-module-work/references/module-orientation.md). It describes the module tree, declarations and exposures, generated ordinary/testing API catalogs, refresh commands and deeper toolkit documentation. Apply it to the target worktree rather than assuming this harness repository's module names or layout.

For planning, distinguish three questions: where relevant behavior already exists, whether each intended consumer can import it, and which owner should implement any missing behavior. A module's `src/` contains its own implementation; child modules live beside it under `subs/` and have their own responsibilities and declarations. Grouping a directory subtree into one iteration does not make it one owner. Read module purposes and relevant `module.ramify` declarations before proposing responsibility or exposure changes.

Use `.ramify-architect/README.md` at the project root for discovery, then narrow to relevant modules' `module.json`, `behavior.jsonl` and `tests.jsonl` records. Inspect defining source and consumers to confirm behavior and integration obligations. Refresh with the installed toolkit from the target project root, for example `node_modules/.bin/ramify materialize --view architect --view api --from <consumer-module-path>/src`. Check generated metadata for revision and coverage. These views describe the inspected worktree; a later source change can invalidate an earlier conclusion.

For access analysis, name the consuming module and source area. Its `src/.ramify/` catalog establishes ordinary-source availability; `src/tests/.ramify/` establishes testing availability. Neither the project-wide architect map, an existing import nor a TypeScript export alone establishes a permitted dependency. If a symbol is missing, check coverage before concluding it is unavailable. For an unavailable interface, inspect the defining owner, the requester and the ancestor declarations between them, including relevant tags and re-exposures. Record which definitions would need to change separately from what is available today. Avoid inventing exposure syntax: consult the linked declaration specification when proposing exact lines.

Prefer existing behavior where it satisfies the outcome. When existing functionality needs to serve different callers and a thin wrapper does not fit, consider extracting a shared implementation with adapters at the callers. Choose ownership by responsibility and the knowledge that should stay together, rather than placing code wherever it is easiest to import. An exposure change alone does not justify a new module or a separate iteration. Include provider, consumer, declaration and integration-test changes in the impact analysis, then choose boundaries that minimize repeated discovery and handoffs.

For deeper questions, consult the toolkit's [access analysis](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/.claude/skills/module-architect/references/access.md) and [responsibility placement](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/.claude/skills/module-architect/references/placement.md) guidance. Preserve adopted principles and sealed inputs when comparing designs; module ownership itself is not an editing restriction.

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

## Brief Sol planning investigators

When delegating an investigation, give Sol the bounded question, intended outcome, target worktree root, likely owners and consumers, applicable principles/specifications and protected inputs, and relevant source or test starting points. Include resolved absolute paths to this skill and the shared module-orientation reference, and explicitly ask the investigator to read the orientation and this skill's module-structure and impact-analysis sections before investigating. Do not assume parent context or skill discovery supplies them. The assignment is investigation; it does not start implementation, register an RA execution or require further delegation.

For a module-focused investigation, use that module's `src/` as the initial CWD, retaining the absolute project and module roots. If the launcher cannot set CWD, instruct Sol to set the working directory on each shell call and resolve file-tool paths explicitly; use the module root if `src/` is absent. Broad investigations can start at the project root. Toolkit materialization and project-wide commands run from the project root. Sol may inspect other owners as needed.

Ask for a concise answer with source references: reusable behavior, current consumer availability versus proposed exposure changes, affected owners and contracts, integration evidence, uncertainties, and the implications for iteration boundaries. Include only items relevant to the assigned question. The investigator should carry view-coverage limitations into its answer instead of interpreting missing search results as proof of absence.

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
