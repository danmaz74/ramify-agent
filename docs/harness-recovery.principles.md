# Harness Recovery Principles

**Status:** Adopted on 2026-10-18. Consolidates existing recovery commitments
and makes KISS the governing principle.

## Purpose

Define how the harness continues unfinished work after an interruption.
These principles apply to every role and execution entrypoint. They are listed
in decreasing order of importance.

## Principles

### KISS Governs All Recovery

Keep recovery simple. Recovery is rare and must not materially complicate
ordinary execution. Reuse ordinary task construction, execution and acceptance.
Add exceptional machinery only for a concrete fact that the restarted agent
cannot establish through ordinary inspection. Prefer removing recovery-specific
states, protocols and restrictions to adding exceptions to them.

### Agent Invocations Should Be Considered Idempotent

An interrupted task can restart from the beginning, including in a completely
fresh session. Agents inspect current files and results, assess what remains,
and continue without redoing or undoing completed work. Supply a short
interruption note when useful; reconstructing the previous conversation or
tool-call sequence is unnecessary.

### State Lives in the Repository

The assignment, requirements, decisions, accepted results and pending obligations
remain available in the repository. Preserve partial work, including failing
tests, stubs, staged edits and untracked source. Capture the current candidate
and its attribution after the writer settles; never infer completion from an
interruption or discard the candidate to restart a task.

Only the next iteration's goal is fixed; later iterations follow the state
reached. An interrupted assessment remains pending.

### An Oriented Context Is Reused, Never Required

A reused context is a cache, never the sole authority for decisions or progress.
Every task must be executable from a fresh session and repository state.
Supply the relevant inputs the harness already holds or can derive; the agent
explores for the rest. Reuse useful context when available and refresh or discard
it when its observations are stale. Session resumption is an optimization,
never a requirement for correctness.

### Resource Observations Preserve Run Continuity

A run never terminates because a context-size or time threshold is reached.
Context-size checks serve only to optimize work through compaction or handoff
to a new session. Time-limit checks serve only to recover a session that may
be stuck. Compaction, handoff and recovery preserve the run's task, accepted
work, authority and pending obligations.

### A Module Engineer's Failure Is Its Architect's Decision

A runtime failure, such as a crashed session or malformed output, is never a
semantic outcome. An interruption leaves the assigned task pending. When an
engineer cannot complete its task, the responsible architect decides what comes
next; the failed attempt does not by itself end the run.

### Keep Recovery Bookkeeping Minimal

The harness retains the task and its accepted results, settles the previous
execution, and prevents old attempts from writing or submitting after replacement.
It applies accepted workflow transitions once. Reconcile a particular external
operation only when repeating it has consequences that current inspection cannot
resolve. Reads, checks and inspectable partial edits do not require exact replay.

### Compatibility Follows the Task

Use the installed runtime and current task procedures to execute retained work.
A changed source, dependency or prompt hash does not establish incompatibility.
Handle a concrete unreadable task record or unavailable required operation where
it occurs. Preserve the user's requirements and accepted decisions independently
of the previous session's representation.

### Continuation Uses Ordinary Authority and Acceptance

Restart already authorized work without a new approval solely because execution
was interrupted or a session was lost. Existing scope, acceptance requirements,
pending user decisions and explicit stops remain effective. Let the agent assess
current changes and verify the resulting candidate through ordinary acceptance;
retain earlier results with the source they describe.
