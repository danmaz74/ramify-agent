# Module Architect Prompt Optimization Principles

**Status:** Proposed, except for the normative commitments identified below.

The architect progress-checkpoint principle adopted on 2026-10-14 is
normative. Assignment guidance addresses reconsideration; automatic repetition
checkpoints remain pending.
The five iteration sizing and organization principles adopted on 2026-10-16,
from "Size the Complete Engineering Cycle" through "Preserve Real Dependency
Stages", are normative and delivered by the module and capability architect
assignment procedures. Their effect on live iteration quality has not been
measured.
"Pass Relevant File Pointers with the Assignment", adopted on 2026-10-16, is
normative and implemented in the module and capability architect assignment
procedures.

## Purpose

Define the commitments for the module architect's work decomposition
and progress judgment, in addition to the
[shared prompt optimization principles](prompt-optimization.principles.md).
Reconsideration applies to the responsible assigning architect, including a
capability architect when it holds that responsibility.

## Principles

### Repetition Triggers Architect Reconsideration

Count-based checkpoints prevent indefinite correctness loops and improvement
loops with diminishing returns. Repetition thresholds trigger reconsideration
within an engineer's work and across assignments. The responsible architect
assesses whether further work is likely to resolve an unmet requirement or
provide sufficient additional value for its cost. It decides whether to continue,
change the approach, seek a missing decision or prerequisite, or end further
refinement when requirements are satisfied and additional improvement is not
worthwhile. Continuation explains the expected contribution of further work;
repeating an unsuccessful approach requires a reason.

Counts trigger reconsideration, never establish progress, failure or completion.
There is no fixed limit on implementation iterations or checkpoints. Checkpoints
follow the [harness recovery principles](harness-recovery.principles.md#state-lives-in-the-repository).
Existing architect turns serve checkpoints where possible. Acceptance requirements and
explicit operator stop remain effective.

### Vertical Work Is Not Split Artificially

When a change touches a module and its descendants, one agent can work at
all of those levels if the descendant changes are simple or the local cognitive
complexity of reasoning about the subtree is manageable.

The agent's scope is one subtree. The choice is which module is its root: a
higher root gives fewer hand-offs but a broader declared search space, and a
lower root gives the reverse. Local cognitive complexity means the knowledge
that must be understood together at that abstraction level; it is assessed
qualitatively rather than computed from source size. That assessment guides
the choice. Work decomposition is not 1:1 with module decomposition.

### Size the Complete Engineering Cycle

Size an iteration for the knowledge needed to understand, implement, test,
debug and revise its assigned outcome. Leave room for discoveries and
correction; fitting the initial prompt is insufficient. Context fit guides
assignment sizing and never establishes a runtime stopping limit.

### Every Iteration Boundary Needs a Reason

Split related work when the separation meaningfully reduces the knowledge an
engineer must hold together, or preserves a necessary dependency stage.
Separate helpers, files, error cases or independently testable pieces do not
alone justify separate iterations. When demanding work cannot be divided
safely, reconsider the approach or investigate the coupling.

### Keep Behavior and Its Verification Together

An iteration includes the tests and integration evidence needed to establish
its assigned outcome. Introduce supporting types and interfaces with the
behavior they describe. A separate contract or verification iteration requires
a concrete context or dependency reason. The harness's required gates remain
binding.

### Review Related Work Together Before Dividing It

Assess related work against the module's complete assigned outcome. Prefer
combining work that comfortably shares source knowledge, invariants and
fixtures. Count repeated orientation, handoffs and verification among the
costs of splitting. Combining work preserves every requirement, write boundary
and verification obligation.

### Preserve Real Dependency Stages

Separate stages when intervening work must establish a prerequisite before an
owner can continue. Adding a contract, migrating its consumers and removing
the old contract may require distinct iterations. Ordinary coding order within
one coherent assignment does not establish such a boundary.

### Pass Relevant File Pointers with the Assignment

When the module architect has already analyzed files relevant to an assignment,
it supplies their project-relative paths with brief notes explaining their
relevance and useful findings. Select source, tests, fixtures, callers and API
views that help the engineer begin informed work without repeating discovery.

Carry forward useful starting points, not the entire exploration history.
This handoff requires no separate discovery phase. Pointers do not widen write
authority or replace the engineer's inspection of current source.
