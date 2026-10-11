# Declared task blocks

**Date:** 2026-10-09. **Status:** analysis and proposed direction; no code
changed. Code references are to `474ffa58` (Plan 25 merged). Run evidence is
from status-badge-tone run `20261009T193340Z-51f42e`, reviewed in the
[Plan 25 postmortem](2026-10-09-status-badge-tone-plan25-postmortem.md).

## Summary

A task prompt is built from blocks. The intended rule has two parts:

1. The prompt of a task declares which blocks it requires.
2. When the prompt is sent, the harness sends the required blocks that the
   session does not already hold, including blocks inherited at a
   continuation or fork point.

Plan 25 implemented the second part for blocks whose key and exact bytes
recur. The first part does not exist. No task declares its blocks, so every
task requires everything its builder produces, and every session in the run
held all nine environment blocks, whether its tasks could use them or not.
The second part also misses identical content in three observed ways: the
same body under another key, the same text with different whitespace, and
blocks that combine stable content with one changing value.

## How blocks are produced and skipped today

A task message is assembled in `buildTaskPacket`
([prompts/tasks.ts](../../subs/harness/src/prompts/tasks.ts)) from three
families of blocks, each with its own skip rule.

| Family | Produced by | Skipped when |
| --- | --- | --- |
| Role instructions and the submission tool declaration | the role package and task definition | the session already holds the same role or the same declaration text |
| Procedure and environment | `buildTaskPacket`, one block per environment field (`environmentFields`) | `resolveBlockAdditions` ([prompts/blocks.ts](../../subs/harness/src/prompts/blocks.ts)) finds the same key with the same rendered hash among the session's effective blocks |
| Briefing sections | the task-kind renderer in `run/service.ts`, split into sections at headings by `taskSupportSections` ([work/task-support.ts](../../subs/harness/src/work/task-support.ts)) | `buildBriefingDelivery` ([prompts/briefings.ts](../../subs/harness/src/prompts/briefings.ts)) finds the same key and exact text in the inherited briefing revision |

What a task receives is therefore decided by its producers, not by the task:

- The environment always has nine fields: `projectRoot`, `workingDirectory`,
  `candidate`, `snapshot`, `limits`, `availableTools`, `views`, `supportPaths`
  and `cucumberConfiguration`. `buildTaskPacket` rejects a task that lacks any
  of them, and the run service fills all nine from the same expressions for
  every task. A null value is still rendered, because Plan 25 uses a null
  block to clear an earlier value.
- A briefing section's key is its heading text plus an occurrence count, and
  its bytes are the lines from that heading up to the next one. Its identity
  depends on how the renderer worded the heading, and its bytes include the
  blank lines left by its neighbors.

### How it got this way

[Plan 23](../plans/23-session-reuse-and-run-efficiency/contracts.md#c3-prompt-and-workflow-inputs)
made the environment explicit and complete, so that no task could start with
a missing cwd, candidate or limit; its iteration 2 receipt records the
nine required fields. The
[fresh-session inputs analysis](2026-10-09-fresh-session-inputs.md) proposed
a per-role table, but as a completeness check, and that direction was
superseded by Plan 24. [Plan 25](../plans/25-carry-discovery-forward/main-plan.md)
split the environment into one replaceable block per field and skipped
unchanged blocks, explicitly leaving unrelated prompt slimming out of scope.
None of these plans asked what each task requires.

## Evidence from the run

### Blocks not required by the task

Environment blocks were 35,373 of the 246,321 bytes appended across the 13
invocations (14.4%). All 11 sessions held all nine: eight received them at
their fresh start, and the three forks inherited them from their parent.

Only some prompts use `limits` at all, according to the prompt templates:

| Role and task | `limits` values the prompts use |
| --- | --- |
| engineer: engineering, repair | `commandTimeoutMs`, `invocationAbsoluteMs`, `invocationIdleMs`; repair also uses its round limits |
| local architect: assignment | the same three values and their `max…` ceilings, to set `assignment.bounds` |
| local architect: orientation, completion | none |
| reviewer (all tasks), catalog extractor, context selector, initial architect, non-functional coordinator | none |

The block carries 28 values. Six of them (`maxWorkItems`,
`maxPlacementRequests`, `cycleReplansPerWorkItem`, `laterRoundMinimumRisk`,
`stopSettleMs`, `writerSettleMs`) are harness settings that no prompt
mentions. The block was transmitted 10 times, 10,736 bytes in total. In this
run only inv-0006 (assignment) and inv-0007 (engineer) could use it.

Other environment blocks show the same pattern:

- `supportPaths` lists the harness prompt files that produced the task, for
  example `subs/harness/src/prompts/reviewer.system.md`. They exist in the
  harness, not in the target project, and no agent can open them.
- `views` advertises `.ramify-architect` to the design orientation and the
  non-functional coordinator, whose tools refuse it.
- `candidate` and `snapshot` matter only to tasks with snapshot tools. The
  design orientation is a reviewer task, but it has only its submission
  tool.
- The engineer's `cucumberConfiguration` (2,755 bytes) repeats the focused
  scenario command block (1,507 bytes) in the same message.

The requirement half matters most on fresh sessions, where nothing is held
yet. Forks then carry the parent's blocks into the child. The scope reviewer
inherited the local architect's environment, including its support paths
and limits.

### Blocks already held but sent again

The skip rule worked where a block recurred with the same key and bytes. The
completion continuation (inv-0011) received no environment block and no
procedure. Its 7,143-byte procedure was already in the session from the
assignment. Its message was 7,737 bytes, against 14,373 bytes for the same
task in the run before Plan 25.

It missed four cases:

1. **The same body under another key.** The scope-review fork (inv-0009)
   inherited the work-item package as `brief:support:work-item-package`
   (2,988 bytes). Its task withdrew that block and set
   `brief:support:assignment-package` (2,989 bytes). The two bodies are
   identical apart from trailing whitespace. Two producers name the same
   content differently, so a key-based skip cannot see it.
2. **The same text with different whitespace.** inv-0011 re-sent "The bounds
   of an engineer" (418 → 417 bytes). The sentences are identical; in
   inv-0004 the section was followed by an extra blank line. Section bytes
   come from splitting a rendered prompt, so a neighbor's spacing changes
   them.
3. **Stable content combined with a changing value.** Both reviewer forks
   re-sent all 28 `limits` values because `invocationAbsoluteMs` alone
   differed (3,600,000 inherited against 599,943 in inv-0009, and 600,000
   against 599,965 in inv-0012). inv-0011 re-sent the 1.8 KB scenarios
   section to change two states from pending to bound.
4. **A duplicate inside one prompt.** The captured plan reached the initial
   architect as a requirement bullet. The duplicate-stripping in
   `taskSupportSections` then removed it from the plan block, which arrived
   as an empty `<plan></plan>`. The agent re-read the plan file. The
   engineer's Cucumber configuration and the local orientation's module
   pointers also repeat other blocks of the same message.

## Proposed model

1. **One identity per block, defined by its content.** A block is named by
   what it holds, not by its producer or its heading: for example `plan`,
   `work-item-package`, `procedure:<family>`, `env:workingDirectory`,
   `limits:command`. Every producer of the same content uses the same
   identity. Its bytes are rendered by one function and do not depend on the
   blocks around it.
2. **A declaration per role and task kind.** Next to `procedureFamilies` in
   `prompts/tasks.ts`, each role and task kind lists the block identities its
   prompt requires. Role alone is not enough: the local architect's
   assignment needs limits and its orientation does not. Task kind alone is
   not enough either: `repair` exists for three roles with different needs.
3. **Send what is required and not held.** At send time the harness renders
   the declared blocks and subtracts the session's effective blocks,
   including everything inherited up to a fork or continuation point. A
   block whose value changed is sent again; an unchanged block is not.
4. **Stable content apart from changing values.** The run policy limits are
   one block. The per-invocation timing (`invocationAbsoluteMs`) is its own
   block. Scenario text is apart from scenario state.
5. **A fresh session receives exactly its declaration.** A fresh code
   reviewer would receive the candidate, snapshot, tools, changed paths and
   diff, and no limits, support paths or Cucumber configuration.

`supportPaths` would stop being a block. It remains in the delivered
manifest as provenance of which prompt sources a task used.

The declaration selects blocks; it is not a completeness gate. Plan 24's
direction stands: useful known facts and pointers are supplied, and agents
explore for anything else. A block missing from a declaration shows up as
exploration in the next run, which the existing session observations record.

## Consequences and limits

A child session still holds the blocks it inherited, whether or not its own
task declares them. Removing them means rebuilding the context instead of
preserving the parent's prefix. In this run every fork's first call read
98–99% of the parent's last prompt from cache, so the current trade-off
favors keeping inherited blocks. The declarations only govern what is
added.

Withdrawals remain. A fork that inherits a block whose value is no longer
current still needs an explicit removal, as the scope reviewer's 12
withdrawal notices (1,066 bytes) did for the architect's briefing.

The savings in this run would be modest. Each fresh session pays the
unrequired blocks once, uncached, at roughly 2–3.5 KB per invocation, and
continuations already skip unchanged blocks. The larger benefits are
prompts that contain only what the task uses, and block identities that
make the skip rule reliable as more roles share sessions.

## Validation

A repeat of the status-badge-tone run would show the effect directly:

- Bytes appended per task kind on a fresh start, compared with this run.
- Environment blocks transmitted per invocation, expected to match each
  declaration.
- Blocks re-sent with content already held by the session, expected to be
  zero apart from changed values.
- Exploration of facts that a removed block used to supply, expected to be
  unchanged.

## Open questions

- Should a block's identity be explicit, as in step 1, or the hash of its
  normalized body? A hash also catches duplicates across producers, but
  makes the same content under two meanings indistinguishable.
- Should a fork that changes role ever rebuild its context to drop the
  parent's undeclared blocks, for example when the parent's prompt is large
  and the child's task is short?
