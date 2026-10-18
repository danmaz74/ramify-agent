# Astra coordination with optional module focus

**Date:** 2026-10-18. **Status:** proposal; no skills, commands or live trials
are implemented by this document.

## Starting arrangement

Use the user's established workflow: create a plan, then ask a Codex Astra
session to coordinate Sol subagents implementing it. Astra owns decomposition,
assignment, cross-module decisions and implementation follow-up. Sol performs
engineering with its ordinary tools. ramify-agent owns post-iteration analysis
and gating, using Pi for agentic assessment and returning compact results.
Astra judges issues remaining after that process rather than conducting each
review and reconciliation itself.

It follows the [assistance principles](approach.principles.md) and refines the
[initial analysis](analysis-and-proposal.md). The
[review and findings proposal](review-and-findings.proposal.md) adds routine
independent review, honest inspection coverage and selective follow-up inside
that delegated facility. The first deliverable should be coordinator and worker
skills plus a candidate-assessment entry point composing Pi reviews, audit,
protection comparison and finding reconciliation. A context convenience
operation can follow if assembling assignments proves repetitive.

## The ordinary iteration

1. Astra chooses an outcome with its implementation and verification, and
   decides whether module focus helps. It gives Sol a short assignment with
   acceptance, starting points, applicable principles and protected files.
2. Sol implements, tests and investigates with normal tools, including edits
   in other modules whenever its task requires them. It consults Astra when
   design uncertainty or coordination needs help, without treating the
   question as a terminal partial result.
3. Astra resolves implementation discoveries and gives the workers the real
   integration requirements. A small outcome may use one Sol; a separable
   outcome may use several. Prepare the authorized candidate commit and hand
   it, the iteration brief and relevant decision references to ramify-agent.
4. ramify-agent compares protected files, runs ramify-audit, schedules Pi
   code/scope/design analysis, records coverage and reconciles concerns. It
   retains detailed evidence and returns a compact candidate-specific result.
5. With a clear result, Astra continues. For leftover issues, it judges the
   concise repair or decision brief and assigns native Sol work as needed;
   reassess the resulting candidate. Retain only the outcome, evidence reference
   and material decisions in the coordinator's ordinary progress notes.

An iteration is a coherent outcome and its verification, not a subagent
turn, consultation or every small edit. Work still in progress does not
become a completed iteration because a subagent stops. Astra can continue
that agent or give its unfinished work to another with the current files
and relevant decisions.

### Audit at every iteration boundary

Use the installed project provider from a clean candidate checkout:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

The installed CLI resolves `HEAD` and reads its committed configuration;
uncommitted edits are not the candidate it verifies. Iteration commits must
therefore be covered by the execution authorization. Where repository rules
require explicit commit authorization, obtain it for the intended execution
workflow once; do not silently create commits or ask again each iteration
when authorization already exists. This proposal itself authorizes no commit.

Astra gathers only the intended iteration changes into the candidate.
Parallel workers must finish contributing to that candidate before it is
captured; unrelated dirty work must not be swept into it. Separate worktrees
are an option for conflicting writers, not a prerequisite for every subagent.

Use default audit selection. The provider decides partial selection, baseline
requirements and reuse. A reason for broader verification must be concrete;
module focus is not a reason to manually exclude affected consumers. A final
project requirement for full verification still applies.

Passing audit results describe the exact candidate and configured checks.
Failures or unavailable results remain unresolved; another edit needs evidence
applicable to its new candidate. Audit does not establish semantic principle
compliance, and does not check sealed files unless such a check is actually
configured. The assessment facility performs the protection check alongside
the audit and records the two outcomes distinctly.

## When module focus is a good idea

Astra estimates whether the reduction in knowledge Sol must hold together
outweighs briefing, waiting, repeated orientation and integration work. This
is semantic judgment, not a score calculated from file count or module size.
The existing [iteration-sizing guidance](../../prompt-optimization-module-architect.principles.md)
provides useful reasoning without requiring its harness execution protocol.

| Prefer module focus when… | Prefer a broader assignment when… |
| --- | --- |
| Most implementation and debugging knowledge belongs to one owner. | The important reasoning concerns behavior across several owners. |
| External interfaces are stable enough to treat as contracts. | Consumer and provider interfaces are still being discovered together. |
| A worker can verify a meaningful outcome with few outside edits. | A local result would be mostly scaffolding awaiting real integration. |
| The module contains substantial internals irrelevant to other workers. | The work is a small mechanical migration across several modules. |
| Another owner has substantial separable work or an already-oriented worker. | Splitting would make several agents learn the same fixtures and invariants. |

Examples: implementing a parser behind an agreed API is a strong candidate
for module focus. Renaming an API and updating a handful of callers often
fits one broader assignment. Discovering a new interaction between a cache
and its consumer may need one Sol to understand both until the contract settles.

For each assignment, one sentence is enough: “Focus on X because its internals
dominate the work and the consumer contract is already stable.” A broader
assignment can say: “Keep X and Y together because the behavior must be designed
and debugged across both.” Do not require a preliminary scoring exercise.

Reconsider when a concrete discovery changes the estimate: repeated outside
dependencies, incompatible contracts, shared fixtures, or a worker spending
more time waiting than implementing. No fixed count forces a handoff or stop.

### What module optimization means for Sol

Start with the module's purpose, local source and tests, ordinary/testing API
views, and relevant principles. Prefer available interfaces over exploring
other modules' internals without a reason. Broaden inspection whenever needed
to understand behavior or diagnose a failure; focused context is not a read
restriction. Preserve ownership and importability while completing behavior
and its verification together.

Module specialization imposes no write boundary. Sol can make changes in
other modules whenever the assigned outcome needs them, without permission
from Astra, scope expansion, or a size-based exception. The skill, tools and
hooks must not refuse an edit because its owner differs from the focus module.
The focus tells Sol where to concentrate its understanding, not where it may
write. Project correctness rules and sealed-file treatment still apply.

Consult Astra when a design decision needs help, work overlaps another
worker, or changing the division of work would improve efficiency. Crossing a
module boundary alone is not a reason to ask or stop.

## Cross-module discoveries: continue or coordinate as useful

Sol handles understood cross-module changes directly. When coordination would
help, it sends Astra the needed behavior, evidence, affected owner and
recommended next action. A normal agent message is sufficient. Do not require
a capability identifier, registered scenario set, new architect or fresh
engineer session.

The worker and coordinator choose the smallest useful response:

| Situation | Response |
| --- | --- |
| Required behavior already exists and is available | Point to the interface and continue. |
| A provider or exposure change is understood | Sol makes it directly; no module-based approval is needed. |
| Provider work is substantial and separable | Consider another Sol when that improves efficiency; the current Sol can also complete it. |
| Provider and consumer design need to evolve together | Let one worker reason about and edit both; combine existing assignments if that helps. |
| A change would revise a user-controlled commitment | Present the specific proposed change under the existing authority rules; continue independent work. |

The contract can be a few lines in the assignment or plan notes: behavior,
examples, compatibility constraints and who verifies integration. A provider
worker returns changed interfaces, checks and remaining work. Astra ensures
the consumer is verified with the real provider before claiming the outcome.

Shared files have one active writer at a time, or changes are integrated from
separate worktrees. Astra coordinates this through ordinary assignments and
messages; the helper does not need a new lease or scheduling service.

### Optional observation of writes outside the focus module

Measuring these edits could help evaluate specialization, but is not required
for the first version. If changed paths and an existing ownership answer make
it inexpensive, report which owners a focused assignment actually touched.
Do not add instrumentation, mandatory reporting or extra per-edit lookups just
for this metric. A shared-worktree diff cannot reliably attribute concurrent
edits to individual agents; leave attribution unknown when evidence is absent.
These observations inform future assignments and never deny writes or establish
that an agent did something wrong.

### Hooks for Ramify correctness

Use hooks, where practical, to run Ramify's own checks after mutations and
return structural diagnostics to the agent doing the work. Check the edited
project regardless of which module that agent specializes in. Importability
and exposure rules constrain the resulting code, not the editor's identity.

Keep feedback inexpensive and allow coherent edits to settle rather than
adding a full audit to every write. A temporary structural violation is a
repairable diagnostic, not a reason to roll back the edit or end the session.
Timeouts or unavailable checks remain explicit gaps, never a pass. Closing
iteration audits retain their verification role. Native hook coverage needs
qualification; the first version need not depend on complete interception.
The [observed hook costs](../../analysis/2026-10-18-ramify-hook-timing.md)
make responsiveness worth checking before enabling a hook on every mutation.

## Sealed files and the special role of principles

These are related but distinct concerns: sealing controls changes to a file;
principles guide the meaning of implementation and review.

### Sealing

Reuse the project's declared seal policy where it exists. The current
[harness design](../../harness.spec.md#principles-and-specifications-are-captured-and-sealed)
specifies sealing `.principles.md` and `.spec.md`; it explicitly records that
general sealing remains implementation work. For this experiment, propose
those project-owned files as the default seal set, plus explicitly selected
files. Preserve stricter existing project rules. Do not automatically seal
every test, README or generated file.

At execution start, retain the seal selection and baseline identities in a
small artifact referenced from the existing plan record. Show relevant sealed
paths in each assignment. At every iteration boundary, compare the candidate
with that baseline, including content changes, additions, deletions, renames
and changes to the seal selection itself. A rename or removal must not make
an existing obligation disappear from the comparison. Report unavailable
inspection explicitly.

Sol treats sealed files as preserved inputs. If a sealed edit is needed, send
the proposed diff and reason to Astra; do other authorized work meanwhile.
An accidental edit remains visible for correction or assessment, without
automatic destructive restoration. Astra may resolve an exception when the
project policy and the user's authorization give it that authority. Otherwise
it presents the concrete change to the governing authority. An agent's reason
alone is not approval, and neither is a passing audit.

Record any accepted exception against the exact before/after content and its
decision source in the ordinary plan record. Subsequent edits require their
own assessment. Retain the original baseline and accepted differences across
iterations so starting a new iteration cannot silently legitimize an edit.
This needs a small comparison facility, not the harness's full finding lifecycle.

Skills and MCP calls alone cannot prevent arbitrary native filesystem writes.
The initial promise is visible constraints and candidate-time detection.
Optional native hooks could provide earlier feedback later; documented Codex
hooks have coverage exceptions and are not a complete enforcement boundary.
Installed-client behavior would need qualification before claiming protection.
[Official hooks documentation](https://learn.chatgpt.com/docs/hooks#tool-coverage)

### Principles

Treat applicable adopted principles as durable design commitments. Astra reads
the project-wide principles during planning and selects relevant local ones
for each assignment, with their exact wording or direct source references.
Sol explains material design choices against those principles. At iteration
completion, Pi reviews the actual diff against the relevant commitments;
Astra receives unresolved tensions rather than repeating that review.

The `.principles.md` suffix triggers discovery and special attention, not an
assumption of human approval. Preserve document status, scope and provenance;
proposed principles remain proposals. Applicable `.spec.md` obligations enter
the plan and acceptance, and are revisited when the design changes them.
This preserves the existing distinction between principles guiding ongoing
work and specifications constraining the plan.

Keep review proportionate: note a material tension or significant design
choice; do not demand a ceremonial compliance matrix each iteration. A
principle conflict may need a different implementation or a deliberate
requirement decision. Editing the principle to fit the implementation does
not resolve that conflict automatically.

## Minimal product surface

The division between reusable skill instructions and MCP operations follows
the [official skills guidance](https://developers.openai.com/plugins/concepts/skills).
The following names are illustrative, not implemented commands or schemas.

| Surface | Responsibility |
| --- | --- |
| `ramify-coordinate` skill for Astra | Use the plan, choose focus, prepare Sol assignments, coordinate implementation, submit candidates for assessment and judge remaining issues from compact results. |
| `ramify-module-work` skill for Sol | Work efficiently from module context, preserve sealed inputs and applicable principles, ask concise cross-module questions, and return changes, evidence and remaining work. |
| Pi review and reconciliation tasks | Assess code, scope and design; investigate worthwhile uncertainties; record inspection evidence and settle routine concerns within delegated authority. |
| Iteration assessment operation | Own post-iteration audit, protection comparison, Pi analysis and reconciliation. Return a compact result with status/result retrieval and cancellation. |
| Existing `ramify-audit` CLI | Execute the configured audit and supply evidence for the candidate. No new audit runner or iteration state machine. |
| Optional Ramify correctness hooks | Return provider structural diagnostics after edits, across all touched modules. Never enforce the agent's focus as a write scope. |
| Constraint capture/compare CLI operations | Discover the configured sealed set and principle sources, retain baseline identities, compare a candidate and report exact differences. Semantic authority decisions remain with Astra and the user. |
| Optional module-context CLI/MCP operation | Assemble ownership, available interfaces, consumers, tests, relevant document locations and coverage limits using the existing evidence module. |
| MCP adapters when useful | Expose the same assessment, context and constraint operations. The assessment facility owns Pi calls and records; the adapter adds no parallel workflow. |

Baseline capture is a small local write, not a stateless query. Its ownership
must remain with the harness-owned assistance entry point under current
repository rules. The host's ordinary plan notes are not harness run records.
The assessment uses Pi but should not require `RunService`, accepted engineering
assignments or the host's native conversation history. Context and constraint
queries remain model-free. Share concise guidance where useful without importing
the existing engineering role prompts wholesale.

## First trial and what to learn

Start with coordinator and worker skills and one delegated assessment composing
audit, protection comparison and Pi review/reconciliation. Measure how much
evidence and how many decisions reach Astra, alongside total assessment cost.
Use existing generated views manually; add context assembly only
where it saves repeated effort. Choose a real plan with both a locally coherent
module change and a modest cross-module discovery. This document proposes the
trial but does not launch it.

Use the ordinary Astra/Sol workflow as the baseline. Record the focus decision,
handoff/waiting cost, reorientation, corrective work, audit time and human
interventions alongside completed behavior. Observe writes outside the focus
module only when the evidence is cheaply available. A successful
trial preserves the required behavior, structural rules and protected
commitments while reducing total effort or improving quality at acceptable cost.
Do not judge success by the proportion of module-focused assignments.

The first learning target is the focus heuristic: which assignments benefited
from reduced context, and which should have stayed broader? Adjust the skill
from that evidence. Add persistent coordination or more tooling only for an
observed problem that ordinary Astra decisions and messages cannot handle well.
