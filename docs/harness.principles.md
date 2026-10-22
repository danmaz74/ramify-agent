# Harness Principles

**Status:** Proposed

The agent-efficiency, guidance and bounded-context principles clarified on
2026-10-15 are normative; runtime alignment remains pending.
The whole-tree scope and verification rules adopted on 2026-10-01 are
normative design decisions; their implementation remains pending.
Recovery and execution-continuity commitments now live in
[harness-recovery.principles.md](harness-recovery.principles.md), including
the KISS clarification adopted on 2026-10-18; implementation alignment remains pending.
The architect tracking-authority and external-tracker independence principles
adopted on 2026-10-13 are normative; their runtime migration remains pending.
The architect progress-checkpoint principle adopted on 2026-10-14 is
normative; its implementation remains pending.
The audit-report delivery rule adopted on 2026-10-14 is normative;
its runtime delivery change is implemented.
The audit-sufficiency principle adopted on 2026-10-22 is normative; the
plan skill and reviewer briefing alignment remain pending.
The scenario non-duplication principle adopted on 2026-10-22 is normative;
the removal of duplicating Vitest integration tests remains pending.

## Purpose

Define the principles of a harness that helps agents implement features in a
Ramify project efficiently while respecting its modularity model. They are
listed in decreasing order of importance.

Prompt and context commitments now live in the
[shared](prompt-optimization.principles.md),
[engineer](prompt-optimization-engineer.principles.md),
[plan architect](prompt-optimization-plan-architect.principles.md) and
[module architect](prompt-optimization-module-architect.principles.md)
prompt optimization principles. Their original headings below retain links
for existing references; the commitments themselves have moved.

Recovery commitments live in the [harness recovery principles](harness-recovery.principles.md).
Their original headings below also retain links for existing references.

The toolkit's
[importability principles](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/model/cross-module-importability.principles.md)
define what a module may import, and its
[module architect principles](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/agents/module-architect.principles.md)
define the evidence Ramify supplies to an agent with a global view. This
document redefines neither.

## Premise

A coding agent is a semantic statistical machine. It reads what is requested
and what the code and documents already say, and applies the patterns it has
learned to move the solution in the requested direction. Test cycles verify
the solution against executable specifications; they do not make it the
intended solution.

Principles documents, specifications and acceptance scenarios are all
semantic specifications: they conceptually constrain the solution space so
that only solutions conforming to them are accepted. The mapping between a
semantic specification and the solutions that satisfy it is not unique, it
is full of grey areas, and is subject to interpretation.

ramify-agent's purpose is to help make that mapping practical and efficient
from an ROI point of view, evaluating costs in terms of human attention first,
and agent time and tokens second.

## Principles

### The Harness Makes Agents More Efficient Through Context and Guidance

Moved to [prompt-optimization.principles.md](prompt-optimization.principles.md#the-harness-makes-agents-more-efficient-through-context-and-guidance).

### Resource Observations Preserve Run Continuity

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#resource-observations-preserve-run-continuity).

### Repetition Triggers Architect Reconsideration

Moved to [prompt-optimization-module-architect.principles.md](prompt-optimization-module-architect.principles.md#repetition-triggers-architect-reconsideration).

### An Executable Specification Is a Translation

"A specification in natural language is a semantic specification: applying it
takes interpretation. To verify a solution against it, an agent
translates it into an executable specification: step definitions bind a
scenario, a test checks a requirement, a declaration lets `ramify check`
verify an ownership decision. The translation may cover part of the
specification, carries its author's interpretation, and the semantic
specification stays authoritative over it. A verdict is about the executable
specification, never about the semantic one; the gap between them is the
interpretation. A judgment applied to the semantic specification itself gives
a signal.

[Trust Follows Provenance](#trust-follows-provenance) applies to both
authors. A scenario a person approved, translated by an agent, is a person's
requirement verified through an agent's reading of it.

### Free-Text Judgment Requires an Agent or LLM

Whenever the harness must interpret free text and make a judgment, it uses an
agent or at least an LLM. Regexes, keyword matching and similar heuristics
cannot decide the meaning of free text or substitute for that judgment.
Deterministic parsing remains appropriate for explicitly structured inputs.

### ramify-audit Owns Check Execution Evidence

The harness always uses ramify-audit's public integration for the check data
and execution capabilities it provides. Results, individual failures,
selection, coverage, timing and provenance come from that producer. The
harness preserves the evidence and its qualifications; it does not build a
parallel runner, parser, failure tally or verdict for information ramify-audit
already supplies. Missing provider information is an explicit integration gap,
not permission to invent a replacement fact.

Audit-report delivery follows
[Retrieve Audit Reports When Needed](prompt-optimization.principles.md#retrieve-audit-reports-when-needed).

The agent doing the work receives the relevant failures and their complete
diagnostics, investigates them and makes the repairs. It asks its architect
when it needs a scope or architectural decision. The harness does not infer
repair responsibility from test locations, failure counts or comparison with
a second test run. It records audit results and enforces execution and write boundaries. The module architect reads those results and the implementation and tests, assesses whether the requirement is satisfied, and reports its judgment to the harness, which trusts and records it.

### A Plan Asks for the Audit and Nothing More

The configured audit is the only execution evidence a plan may require. A
plan states what must be true of the result: its scenarios and its
structural or nonfunctional properties. It never names suites, commands,
modes or extra runs, such as a full `npm test`, a self check or a repeated
run on the final candidate. ramify-audit decides what to execute for a
candidate, and its passed report is the whole of that evidence. The harness
and the reviewer trust it. A plan clause that asks for more is a plan
defect, reported as such, never an evidence gap of the candidate. Anyone who
needs a different audit scope changes the audit configuration or the
harness, not the plan.

### Bounded Context Is What Makes Agents Efficient

Moved to [prompt-optimization.principles.md](prompt-optimization.principles.md#bounded-context-is-what-makes-agents-efficient).

### Principles Guide Implementation; Specifications Constrain the Plan

Principles apply throughout implementation. Relevant principles guide each
assignment and are assessed against the resulting candidate.

Specifications are checked against the plan at the beginning for compatibility,
missing obligations and required specification changes. The relevant obligations
enter the reviewed plan and its acceptance requirements. Implementation follows
that plan; there is no separate recurring review against the specification set.

When implementation materially changes the plan, revisit only the affected
specifications. Both document kinds remain authoritative and may be consulted
when needed. A compatible plan does not prove that its implementation conforms.

### Plans Are Incomplete; the System Adapts

Agents work on a need-to-know basis, and the system is based on the
inevitablity of unknown unknowns. The assumption is that no plan made in
advance is fully complete or correct.

Discovering during work that a task needs something beyond its scope is a
normal outcome. How the harness handles discoveries matters more than how
thoroughly it plans.

### Prefer the Simplest Sufficient Correction

Prefer the simplest sufficient correction while preserving required behavior
and module boundaries. Return a contradiction to the decision's current
authority, which revises that choice or delegates the correction.

### Forecast Early; Decide with Current Evidence

Moved to [prompt-optimization-plan-architect.principles.md](prompt-optimization-plan-architect.principles.md#forecast-early-decide-with-current-evidence).

### Distinguish Breaking from Non-Breaking Changes

A non-breaking change adds capabilities while preserving every existing
contract and behavioral guarantee. Existing consumers can continue to use
them unchanged.

A breaking change intentionally revises or removes an existing contract or
behavioral guarantee. Existing consumers may therefore need to adapt.

These are different kinds of work and may require different implementation
and verification strategies. The distinction comes from the requested
behavior: a preference for a cleaner interface does not, by itself, make a
breaking change necessary.

### Every Agent Scope Is a Cut on the Module Tree

An architect's read and design context can span several modules. Each module engineer
has a separate module write scope. A capability architect's authority to
coordinate several owners does not combine their write scopes or change their
module responsibilities. Ramify supplies the evidence for choosing each scope
and enforces the model within it.

The tree states who has authority over an interface. A parent owns the
boundaries of its children. An interface between two branches belongs to
neither side.

### Architects Can Update Plans and Tracking Without Writing Code

Architects do not write implementation code; module engineers implement it.
Architects may update plans, decisions and progress tracking within their
assigned authority through harness-controlled operations. The harness validates
and persists durable run state. A restriction on code writes does not prohibit
authorized planning or administrative updates.

### Ordinary Execution Is Independent of External Trackers

The harness owns the planning, progress and acceptance state needed to execute,
resume and complete a plan. External issue records may supply background;
they are never the authority for execution state. External bookkeeping and
optional exports cannot control plan execution or completion.

### A Module Carries Its Own Onboarding

Moved to [prompt-optimization.principles.md](prompt-optimization.principles.md#a-module-carries-its-own-onboarding).

### Architecture Planning Produces an Implementation Map

Moved to [prompt-optimization-plan-architect.principles.md](prompt-optimization-plan-architect.principles.md#architecture-planning-produces-an-implementation-map).

### Vertical Work Is Not Split Artificially

Moved to [prompt-optimization-module-architect.principles.md](prompt-optimization-module-architect.principles.md#vertical-work-is-not-split-artificially).

<a id="every-engineer-uses-the-same-iteration-lifecycle"></a>

### Every Module Engineer Uses the Same Iteration Lifecycle

The issuing architect's context differs; assignment preparation, module engineer tools,
API views, gates, candidate commits, reviews and repair do not.
[Recovery uses ordinary execution](harness-recovery.principles.md#kiss-governs-all-recovery)
for every role. A capability architect knows both consumer and provider and returns a verified
bounded result to its caller. It uses the ordinary executor and result records.
Architects inspect source, Git and targeted result artifacts; a parallel history
replay tool does not replace those existing inspection surfaces.

### Horizontal Work Uses Separate Agents Joined by a Contract

Implementation in different branches uses separate scoped module engineers. A fresh
capability architect coordinates the interface, provider implementation,
affected consumers and requesting consumer under one durable task. It reads
the relevant source and evidence, revises the design as findings develop, and
handles the task's decisions through verified handback. A separate contract
iteration or fake integration before provider work is not required.

Existing consumer contracts and behavioral guarantees remain binding. Recorded
run state is not such a guarantee unless the plan names it. The architect seeks
a compatible design first. A change that must break a
guarantee needs the existing explicit breaking-change authority and migration
work in affected owners. Passing checks against a revised API cannot silently
remove an earlier guarantee.

### Fakes and Tests Guide Delegation

A module engineer's capability request records required behavior, actual or
prospective usage, known constraints and examples. Pseudocode and proposed
signatures remain provisional. The original need survives plan and API
revisions. Executable evidence develops with the design, and real provider
and requesting-consumer verification precede handback.

A fake can help implement or test a seam, but is optional. Passing a fake does
not complete the task. When a test signature changes with an API revision, or
an expected value proves wrong, the architect records why and preserves the
case's behavioral requirement. Changing tests alone cannot erase it.

### Fakes Are Explicitly Named

Explicit names make fakes recognizable in source and generated architectural
evidence. A contract and fake can establish a capability's intended placement;
their presence does not establish that its real implementation is ready.

### A Fake Is Exactly As Importable As What It Stands For

A fake is placed and used at the seam where the real provider will act, and
exactly the modules that will receive the real export receive the fake. A
fake that reaches further is wired where the real provider never acts, and
retiring it means re-plumbing its consumer. The agreement names the real
export each fake stands for, and the implementing assignments and their gates
verify exposure parity while it is used. Every source change remains within
the assigned module scope; a fake file does not create an exception allowing
a module engineer to write in another owner's internals.

Retiring a fake is the harness's and its agents' concern: verification
replaces it with the real provider and removes its exposure with it. Ramify,
the build and the audit stay out of it.

### A Plan's Acceptance Is Its Scenarios

A plan's acceptance is a set of Gherkin scenarios: the plan's own, and those
the plan architect writes for each entry capability. Their text is frozen
when the analysis is accepted. Agents bind them late, with step definitions.
Only the plan architect's recorded plan-deviation process may reword a
pending scenario; bound or completed scenarios remain protected. The captured
plan and frozen catalog retain their original text. Only the harness writes a
feature file or moves a scenario's state.

A scenario that passes against a fake is bound, not done; real integration
and its current gate remain required.
A plan is finished when every responsible architect has reported its
registered scenarios implemented and passing, and the full audit of the
configured suite passes at the final gate. A completed automated run may
still await a person's decision on a non-functional plan deviation. Merge readiness requires that decision on the
exact assessed candidate; it never changes the final gate's result.

### Scenarios Are Never Duplicated in Integration Tests

A Cucumber scenario is the complete statement of a behavior: its text is
frozen, its steps bind the real seams, and its gate requires real
integration. A Vitest integration test that drives the same workflow to the
same assertions is a less complete copy of that scenario, and the copy costs
a full run on every audit. A behavior that has a scenario is verified by that
scenario alone; a Vitest test exists for the same subject only when it tests
something the scenario cannot, such as a module's own function on fakes or a
native boundary registered in the test boundary registry. Retire the copy,
never the scenario.

### Trust Follows Provenance

Most tests, documentation and requirements in a run are written by agents and
never read by a person, and agents invent requirements together with the
tests that verify them. The harness is built for that reality: it cannot have
everything reviewed, so it weighs an artifact by its provenance, never by its
kind or its wording.

Principles documents, approved specifications and the original plan count as
human-reviewed. Moving an approved requirement from principles to a specification
preserves its review provenance. What a
person approved, such as the accepted analysis and its frozen scenarios, and
what is derived directly from human-reviewed material weigh more than what an
agent derived on its own. Scarce human and agent attention goes where the
weight and the risk are highest. Weight orders attention; it never turns a
required gate into an option.

### Work Starts at the Consumer; Integration Happens on the Return

Work begins at the highest consumer of the feature. A module engineer records a
capability request when required behavior is outside its scope, preserving its
partial candidate and original examples. The qualified task coordinates
provider work, compatibility repairs and real consumer integration. A nested
request suspends its parent task and runs depth-first. Unrelated frontier work,
including a provider's separate entry, stays deferred until handback.

The capability architect verifies the requesting consumer against the real
provider before handback. The parent then resumes its broader goal; the
handback does not complete that goal or the provider's separate entry.

The implementation map says which modules carry the work. This order says where
the work starts and how it reaches them.

### Need-to-Know Does Not Forbid Asking

Moved to [prompt-optimization-engineer.principles.md](prompt-optimization-engineer.principles.md#need-to-know-does-not-forbid-asking).

### Results Are Need-to-Know Too

Moved to [prompt-optimization.principles.md](prompt-optimization.principles.md#results-are-need-to-know-too).

### Discoveries Are Priced by Kind

A need discovered during work costs what its kind requires:

| Discovery | Cost |
| --- | --- |
| Exists and is available | None; the module engineer uses it. |
| Exists but is not available | The exposure declarations along the path, proposed by the architect. |
| Missing; its owner is within the agent's scope | None; the module engineer implements it. |
| Missing; its owner is elsewhere | An architect decision, then a new seam or a changed scope. |
| The planned ownership is wrong | A person's decision. |

The harness never treats every discovery as a reason to pause the run.

### State Lives in the Repository

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#state-lives-in-the-repository).

### What Integration on the Return Leaves Is Resolved at the Common Ancestor

Most integration happens on the return, one delegation at a time. Each
replacement verifies one consumer with one provider; it does not verify the
composition of several modules.

What remains is work of its own: wiring, lifecycle, configuration and
behavior that emerges only when several modules run together. An integration
agent resolves it, scoped to the subtree of the lowest common ancestor of the
modules involved. It owns the composition and may make bounded corrections in
descendants, avoiding a long sequence of delegations.

Substantial composition work is split into focused iterations. Each invocation
addresses one composition issue with explicit write boundaries and a clear
completion check, even when it needs to search the whole common subtree.

The integration agent honors each seam's currently accepted interface,
behavioral guarantees and evidence. If composition calls for a revision, the
capability task reopens, coordinates affected owners and verifies the new
candidate. Editing tests alone does not remove a guarantee.
Feature-level tests at the common ancestor decide completion.

### A Small Closed Set of Outcomes Is the Whole Protocol

An agent resolves ordinary failures itself: compile errors, failing tests and
violations reported by Ramify's checks.

A request that cannot be satisfied because of how the gate or the harness runs
is an environment problem: it is reported to the operator, never answered as a
placement or a deviation.

### The Harness Stays Small; Ramify Stays Outside Its Control Loop

The harness chooses agent scopes, orders seams and handles discoveries.
Agents make every semantic decision.

Ramify's generated views and post-write checks belong to the agent's project
environment. A violation reaches the agent as an ordinary error.

Runtime failure follows the [harness recovery principles](harness-recovery.principles.md#a-module-engineers-failure-is-its-architects-decision).

<a id="an-engineers-failure-is-its-architects-decision"></a>

### A Module Engineer's Failure Is Its Architect's Decision

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#a-module-engineers-failure-is-its-architects-decision).

### Agent Invocations Should Be Considered Idempotent

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#agent-invocations-should-be-considered-idempotent).

### Additional Instructions May Be Supplied in User Messages

Moved to [prompt-optimization.principles.md](prompt-optimization.principles.md#additional-instructions-may-be-supplied-in-user-messages).

### An Oriented Context Is Reused, Never Required

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#an-oriented-context-is-reused-never-required).
