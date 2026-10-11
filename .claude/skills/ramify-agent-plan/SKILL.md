---
name: ramify-agent-plan
description: Write, review or convert plans intended for execution by ramify-agent on a real Ramify project. Define outcomes, constraints and acceptance while leaving execution decomposition to the harness architects. Use instead of roadmap iteration planning when ramify-agent will execute the plan; writing the plan does not launch a run.
---

# Write a plan for ramify-agent execution

Produce a plan that the harness can turn into useful implementation. State what
must be delivered and preserved, with enough context to make good decisions.
The harness's architects derive entry capabilities, owner assignments and
iterations from the plan and current project evidence.

This skill applies to any target Ramify project, including ramify-agent itself.
It authors the input to execution; use the adjacent
[dogfooding skill](../ramify-agent-dogfooding/SKILL.md) when execution is requested.
Keep the existing roadmap/iteration-planning workflow for plans meant for that
executor. Do not generate iteration manifests, per-iteration prompts or fixed
agent schedules for this format unless the user explicitly requires them.

## Establish the intent and current state

Read the target's instructions, the request and the applicable principles and
specifications. Inspect enough current behavior and architecture to make the
request concrete. Use the target's generated architect/API views where its
instructions require them. Separate verified facts, accepted decisions and
tentative design ideas; an owner hint is not evidence that an API exists or is
available to its consumer.

Resolve contradictions with applicable specifications while authoring. Carry
relevant obligations into the plan with their source and conditions, and name
any specification change that needs a decision. Do not rely on automatic
specification discovery/review: the current harness has incomplete support, as
its [specification](../../../docs/harness.spec.md#principles-and-specifications-are-captured-and-sealed)
records. Project principles remain authoritative without being copied wholesale.

## Write the execution input

Use [the template](assets/plan.md) as a starting point, omitting sections that
add nothing. It is an authoring aid, not a mandatory schema. Prefer one readable
document; add companions only for substantial contracts or acceptance material.

- **Problem and outcome:** describe the current behavior, the requested change
  and who or what consumes the result. Name real prerequisites and the state
  the work starts from.
- **Required behavior:** state independently understandable obligations,
  including necessary failure cases. Preserve the conditions and examples that
  determine their meaning. Exact interfaces belong here when already decided
  or required for compatibility; leave implementation choices open otherwise.
- **Constraints:** state architectural boundaries, compatibility guarantees,
  authorized breaking changes and relevant nonfunctional requirements. Explain
  how important qualitative constraints can be assessed; do not invent numeric
  thresholds or performance experiments. Separate excluded deliverables from
  guarantees: “authentication is out of scope” does not mean “existing access
  checks must remain effective.” State the latter explicitly when required.
- **Acceptance:** provide observable behavioral scenarios and the evidence
  needed for other obligations. The responsible architect judges fulfillment;
  configured project audits establish automated check health.
- **Context and recommendations:** provide useful existing behavior, navigation
  pointers, likely seams and design options. Label suggestions as optional.
  A forecast must not silently become required work or a prescribed sequence.

Retain a genuine ordering constraint, such as compatibility during a migration,
as a requirement with its reason. Let the local and capability architects decide
how to achieve it. They can adapt to discoveries and coordinate real provider
and consumer integration without a prewritten iteration for every owner.

## Make acceptance usable

Write behavioral examples in fenced `gherkin` blocks. A `Scenario:` block
without a `Feature:` wrapper is supported. Use concrete Given/When/Then
conditions and results at the relevant consumer boundary. Cover meaningful
defaults, failures or compatibility behavior as the change requires. Avoid
scenarios whose only result is that a file exists or a command was run when the
real requirement is behavior. For a cross-module feature, include the composed
result seen by the consumer, not only isolated provider checks.

The harness can derive scenarios for entries lacking them, but author the
important acceptance examples now so the intended result is reviewable. Leave
run-local element/scenario IDs, entry mappings, generated feature files and step
bindings to execution. Scenario text is frozen when analysis is accepted; do
not treat it as something an engineer may weaken to obtain a passing check.

For structural or nonfunctional obligations, state the required property and
appropriate inspection or check evidence plainly. Do not manufacture a runtime
test-registration identity. See the
[catalog contract](../../../docs/architecture/plan-context-catalog.spec.md)
for the distinction between requirements, recommendations and context.

## Package and review

The current full-run entrypoint is `<target-project>/plans/<plan-id>/plan.md`.
Choose a non-hidden directory name without path separators. Respect a requested
authoring location; if it differs, report the execution placement still needed.
The plan's target project is not necessarily the harness checkout.

Keep companions and local links within that target project. The harness captures
text files throughout the plan directory and follows local links transitively;
an unlinked file is not necessarily excluded. Keep obsolete iteration packages,
working notes and unrelated material outside it. External URLs are not captured
as local requirements: include the necessary obligation in the plan with its
attribution. Label whether a linked companion is required material or background.

When converting an existing iteration plan, preserve its approved requirements,
contracts, acceptance cases and real prerequisites. Remove execution bookkeeping
and turn tentative implementation steps into recommendations. Account for work
already delivered and state the remaining outcome. Preserve the original unless
replacement was requested; do not link the entire old package as mandatory input.

Before handoff, check requirement/acceptance consistency, local links and Gherkin
parsing using the installed parser or harness extractor when available. Name any
unresolved decision that affects the intended result or authority; leave ordinary
design choices to execution. Report the plan path, material decisions and any
execution-readiness gaps. Project setup and a live run belong to execution, not
to validation of the authored document.
