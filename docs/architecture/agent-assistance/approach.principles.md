# Agent assistance: reasons, goals and principles

**Date:** 2026-10-18. **Status:** proposed direction for exploration.

These commitments describe an alternative way to use ramify-agent. They do
not change the current harness's contracts or establish an implementation.

## Reasons

ramify-agent has developed from principles into an orchestration harness,
customized Pi sessions and tests. In the user's experience, implementation
runs have been consistently slow and have repeatedly become stuck. The
benefits of modular work have not yet justified the effort needed to conduct
and recover those runs.

The approach has accumulated detailed execution rules around principles
whose original purpose was to help agents. Each additional role, submission,
handoff and recovery condition can create work before useful implementation
can continue. Testing these mechanisms does not establish that the resulting
workflow is effective on real tasks.

One possible explanation is a mismatch between this workflow and the habits
of the models and agent environments used to execute it. A particular
explanation involving reinforcement learning or the Pi/Sol combination
remains a hypothesis. We can test a simpler working arrangement without
settling that explanation first.

Existing coding agents provide a practical starting point. Let an ordinary
agent, initially Codex, conduct the work, and give it facilities that make
module ownership, interfaces, coordination and verification easier to
understand and use. Discover the useful structure through real work, then
build on demonstrated improvements.

The initial working arrangement is the user's existing workflow: a Codex
Astra session coordinates Sol subagents implementing a plan. Assistance adds
iteration audits, selective module focus, lightweight cross-module decisions,
post-iteration assessment and gating delegated to ramify-agent using Pi, and
explicit handling of sealed files and principles. Astra receives compact
results and handles issues that remain after that assessment.

## Goals

- Complete useful work with less human intervention and less elapsed time.
- Help agents preserve module ownership, explicit interfaces, consumer needs
  and behavioral guarantees throughout implementation.
- Make ramify-agent facilities independently useful through CLI commands or
  MCP tools, without requiring a harness-managed execution.
- Reuse existing implementations where their contracts fit, allowing the
  current harness and ordinary agents to consume the same facilities.
- Keep experimentation inexpensive enough to remove an unhelpful feature.
  Retain one project while that helps; separate it if coexistence dominates
  the cost of learning.

## Principles

### Start from an effective agent workflow

The host agent owns implementation coordination, tools, context and
continuation. It can delegate complete assessment tasks to independent
facilities without adopting their internal workflow.

### Protect the coordinator's context

Keep detailed check output, reviewer conversations and routine reconciliation
with the assessment facility. Return candidate-specific outcomes and only
remaining actions or decisions, with deeper evidence available on demand.

### Make modular work easier

Show ownership, available interfaces, affected consumers and relevant
evidence at the point where they inform a decision.

### Guide decisions; enforce actual contracts

Recommended working practices remain advice. Explicit user constraints,
project rules and required verification retain their authority.

### Treat context as a starting point

Offer focused context and make its limits visible. The agent can inspect
further evidence whenever its authorized task requires it.

### Let coordination follow the work

Use delegation when it helps separate responsibilities. A module boundary
alone does not require a new agent or a prescribed sequence of handoffs.

### Module specialization does not restrict writes

A module-specialized agent can edit other modules as its task requires.
Crossing a module boundary requires no scope expansion or approval. Coordinate
for design and concurrent work; preserve project rules and sealed commitments.

### Check structural correctness independently of agent focus

Ramify checks the resulting project's structural rules. Hooks can provide
early feedback; an agent's chosen module does not determine where it may edit.

### Preserve the need across boundaries

A request for another module's behavior retains the consumer's need,
constraints and examples. Completion includes verification with the real
provider and affected consumers.

### Choose module focus for its expected benefit

Focus an assignment when reduced context and clearer responsibility outweigh
handoffs, repeated orientation and integration cost. Reconsider the choice
when discoveries change that balance.

### Close iterations with candidate-specific verification

Run the project's ramify-audit at each iteration boundary. Audit evidence
establishes configured check results; delegated agentic assessment addresses
the intended behavior and applicable principles. Preserve those distinctions
in the result returned to the coordinator.

### Give principles an explicit place in decisions

Applicable principles guide assignments and review throughout the work.
Preserve their status and provenance; a filename does not establish approval.

### Preserve sealed commitments

Make sealed files visible before work and detect changes against a retained
baseline. Assess exceptions under the governing authority; a justification
alone does not authorize changing a commitment.

### Make each facility independently useful

A facility accepts the facts it needs and returns an understandable result.
Using it does not require adopting unrelated workflow machinery.

### Keep semantic decisions with agents

Tools provide evidence and validate structured contracts. Agents interpret
requirements, choose responsibilities and assess whether the work meets
the intended outcome.

### Reuse one implementation of a rule

The harness and external agents share facility behavior. Client adapters
translate inputs and results without duplicating domain rules.

### Keep durable state proportionate to the task

Preserve work, decisions and evidence needed to continue. Avoid requiring a
conversation or reconstructing its exact execution merely to resume work.

### Make evidence honest and actionable

Distinguish findings, advice and unavailable verification. Identify the
source and candidate to which evidence applies; missing evidence is not a pass.

### Preserve independent review and its limits

Schedule independent assessment of implementation, acceptance and relevant
design commitments. Tie review to its candidate and distinguish supplied
evidence, reported inspection and missing coverage.

### Observations do not automatically become backlog

Assess concerns in proportion to their consequences, evidence and cost.
Track active repairs and unresolved decisions; create deferred issues only
for work deliberately selected as worth pursuing.

### Learn before adding machinery

Add facilities in response to observed friction. Judge them by completed
work, preserved quality, human attention and measured cost.
