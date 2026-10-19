# Prompt Optimization Principles

**Status:** Proposed, except for the normative commitments identified below.

The agent-efficiency, guidance and bounded-context principles clarified on
2026-10-15 are normative; runtime alignment remains pending.
The audit-report delivery rule adopted on 2026-10-14 is normative;
its runtime delivery change is implemented.

## Purpose

Define the existing principles for optimizing prompts, context and instruction
delivery across all harness roles. Moving these commitments from the harness
principles preserves their adoption and implementation status.

Role-specific commitments supplement these shared principles in the
[engineer](prompt-optimization-engineer.principles.md),
[plan architect](prompt-optimization-plan-architect.principles.md) and
[module architect](prompt-optimization-module-architect.principles.md) principles.
Execution, authority and acceptance remain governed by the
[harness principles](harness.principles.md); interruption and fresh-session
continuation follow the [harness recovery principles](harness-recovery.principles.md).

## Principles

### The Harness Makes Agents More Efficient Through Context and Guidance

ramify-agent makes Pi and other sub-agents more efficient by optimizing their
context and working environment. Before and during action, it supplies relevant
knowledge, clear goals and useful tools. During action, it guides, nudges and
warns. After action, it assesses results and supports correction when needed.

Agents receive all standard tools by default. Only specialized tools are
selected for a particular task. Denying a standard tool requires a specific
reason; making it available requires no justification of anticipated need.

The harness trusts agents to judge what their task needs. It does not prevent
actions or withhold tools because it distrusts their judgment. When insufficient
guidance or drift from excessive context causes systematic problems, improve
the guidance and context: reduce or restructure excessive context and restore
relevant knowledge. Removing tools agents may need is not a remedy for those
failures.

### Bounded Context Is What Makes Agents Efficient

The harness trusts an agent's judgment when its context is clear and manageable.
Excessive context undermines that judgment even with good instructions and
tools. Limit context growth while preserving the agent's ability to act.
The current context ceiling is 300,000 tokens; earlier native compaction
thresholds remain effective. This ceiling concerns current context occupancy,
never cumulative run tokens or permission to continue work.

Use simple context management: efficient prompts, focused iterations for
complex tasks, and forks when separate exploration would otherwise burden the
continuing context. Keep Pi's native compaction enabled throughout, allowing it
to compact whenever its threshold requires it. Configure an earlier native
threshold only when needed to respect the ceiling; do not add a competing
context controller. Context reduction preserves the task and useful knowledge.

Here, search space means the information available for an invocation to
investigate, including selected source and generated views. Its declared byte
size differs from the whole-project source-line baseline used in token-cost
comparisons. Model context usage is the tokens currently occupying the model
context. Bounded reasoning is a strategy intended to improve efficiency;
its benefit must be measured from elapsed time, run token cost and delivered
work. A smaller context alone does not establish an improvement.

Each agent invocation should have a manageable reasoning burden. Work can be
bounded in two ways:

- **A broader change goal within a narrow search space:** an agent may
  implement several related changes within one module or a small, coherent
  subtree.
- **A narrow change goal within a broader search space:** an agent may inspect
  several modules to establish one contract, integrate it in a consumer, or
  resolve one composition issue.

**The broader the search space, the narrower the change goal must be.** An
invocation should not combine broad architectural reach with a broad
implementation responsibility.

When work requires a broad search space, split it into individual iterations,
each with one focused goal, explicit write boundaries and a clear completion
check. Each invocation retrieves only the information needed for that goal.

A focused goal may require coordinated changes to several artifacts. A fresh
capability architect may read relevant consumer and provider source and evidence
for one bounded task without inheriting either module architect's full history.
It continues within the task and returns a concise brief after verification.

The division of work should also facilitate integration and maintain a clean
architecture. Every other principle serves this divide-and-conquer
strategy.

In some cases, special views can facilitate this approach. Architecture planning
requires reasoning on the whole application, and the architect view creates a smaller
search space for that.

Semantic specifications such as principles and engineering best practices need the same
context management. Every requirement in a context is applied more weakly as the context
grows, until it is ignored, so including all of them in every prompt dilutes each of them.
Bound the task's requirements and additional exploration while preserving
useful knowledge already acquired.

### A Module Carries Its Own Onboarding

Bounded context covers knowledge as well as code. A module's purpose,
invariants, conventions, entry points and testing guidance live with the
module, beside the contracts it receives from its children.

An agent scoped to a module is competent from that material and the module's
generated API view, without reading the rest of the project. Knowledge that
governs several modules lives at their lowest common ancestor.

Detail is retrieved when needed, never preloaded.

### Results Are Need-to-Know Too

Completed work returns only what matters to whoever delegated it: changed
contracts, changed assumptions and required follow-ups. How the work was done
stays with the agent that did it.

A delegating agent's context does not grow with the detail of the work it
delegates. When nothing relevant changed, the result is the completion alone.

### Additional Instructions May Be Supplied in User Messages

Task procedures, data submission requirements, response formats, schemas and
other instructions may be supplied in user messages. They do not need to be
in the system prompt. Including instructions in the system prompt is a
convenience when they are already known to be relevant, never a prerequisite
for supplying them later.

For continuing work, retain general role instructions and supply each task's
procedure and submission requirements with that task. A change of task does
not by itself require replacing the system prompt. The task's submission
interface may be expressed in its message without registering a new tool.

A fork preserves the complete inherited context through its selected point,
including system instructions, tool definitions, messages and results.
Everything new is appended; nothing in the inherited prefix is changed.

### An Oriented Context Is Reused, Never Required

Moved to [harness-recovery.principles.md](harness-recovery.principles.md#an-oriented-context-is-reused-never-required).

### Reuse Context to Reduce Repeated Exploration

Orientation costs elapsed time as well as tokens. Searching, reading and
understanding a project can dominate the time before an agent can act. Avoid
repeating that exploration when relevant knowledge can be reused or
transferred.

Prefer continuation for ongoing work and forks for related independent tasks.
A summary handoff requires a specific justification that accounts for summary
generation, fresh ingestion and possible repeated exploration. Evaluate total
time to an informed result and total token charges across the whole process.
A shorter prompt or lower token bill alone does not establish an improvement.

Cached input tokens cost several times less than new input tokens. Compare
them at the model's respective rates rather than treating all input tokens
as equally expensive. Reusing a larger cached context can cost less than
reconstructing a smaller context through new exploration.

Apply these optimizations within the
[recovery principle that context is optional](harness-recovery.principles.md#an-oriented-context-is-reused-never-required).

### Retrieve Audit Reports When Needed

Full audit reports remain separate evidence artifacts and are never attached to
prompts, messages or tool responses. Supply a usable report location only when
analysis of that report helps the current task. Agents retrieve relevant details
as needed.
