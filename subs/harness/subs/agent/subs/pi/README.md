# pi

Implements the agent's durable session operations using Pi's native messages and
serializer. Pi owns model selection, authentication, SDK objects and opaque
provider history; the harness supplies the authoritative session store and
rebinds current tools, policy, validators and destinations for each operation.

## Supported preservation

The preserving driver supports Pi `1.3.0`, `openai-codex` models on
`openai-codex-responses` and `openai` models on `openai-responses`, with SSE and
zero provider retries. Responses stores initial instructions in the first input
item; Codex uses its separate instructions field. Installed serializer tests
cover both formats, tool turns and inherited prefixes; live experiment evidence
for the renewed `openai` login used `gpt-6.1-sol:high`. Unsupported models/transports are explicit unavailable or failed
operations without a replacement start. Initial instructions, tool definitions
and every inherited serialized input item retain their order and original
opaque fields. Later roles and tool definitions are appended to the transcript;
historical inactive tools cannot execute or submit for a current task.
Transcripts written with Pi `0.87.1` remain readable; restoration verifies their
retained native prefix before dispatch, and new state records name `1.3.0`.
Historical context observations retain their original version attribution.

`createPiAgent({ model, sessionStore })` exposes modern operations through
`AgentPort`. Continue, exact-point Fork, model-free context/tool additions,
terminal Retry, Stop and actual settlement use the generic committed operation
engine. Source-backed fresh recovery belongs to the harness; this adapter makes
no fallback decision. Known retained-history decode/compatibility losses use the
owning context-unavailable indication. Arbitrary provider or initialization
exceptions remain ordinary failures and do not license fresh retry. There are
no public provider-file references, file-history
readers or compaction/settlement-threshold options.

Opaque Pi state and original final-request artifacts are immutable payloads in
the caller-owned store. Restoration reads those original bytes, never display
events or a regenerated transcript. `readPiNativeRequestArtifact` exposes only a
validated plain final-request artifact; other provider payloads remain opaque.
Request artifacts are persisted before the final liveness fence. Artifact
presence proves neither HTTP dispatch nor full settled history: final accepted
tool outputs may follow the last request. Pi-owned qualification verifies the
complete settled messages including terminal submission outputs.

Related forks share a Pi-owned provider session identity, persisted in the
opaque transcript. Pi uses it for `session-id`, `x-client-request-id` and
`prompt_cache_key`; logical harness session IDs and branch histories remain
independent. Older transcripts and forks before the first request resolve this
identity from the original creation operation. Unrelated roots use different
identities. Compatible native prefixes can therefore reuse the parent's cache
on a fork's first request; the provider still decides whether a cache hit occurs.

## Execution policy

The driver binds fresh callable tools and the current designated submission.
Guards precede mutating effects; denied calls mutate nothing. The designated
submission's complete schema is supplied once in its declaration description;
Pi's permissive outer schema lets the harness report every validation error.
Accepted submissions terminate the task. Inactive or obsolete submissions retain
definitions but cannot reach the current validator.

Context usage is Pi's estimate of current occupancy. Every role uses Pi's
native automatic compaction, effective model window and SettingsManager reserve
and recent-history settings. Historical harness context budgets remain readable
but do not constrain new requests. Missing estimates and projected request sizes
are recorded explicitly.

Before each supported task request, the adapter appends a developer message
using public Codex's exact remaining-context wording:
`You have {tokens_left} tokens left in this context window.` Unknown occupancy,
including immediately after compaction, produces
`You have unknown tokens left in this context window.` No wrapper or additional
budget guidance is appended. The count is Pi's effective context capacity minus
its current occupancy estimate and configured compaction reserve, clamped at zero.
It precedes the notice itself and does not project the next request.

Notices are retained in opaque history and request artifacts, preserving earlier
prefixes on continuation and forks; compaction summary requests retain Pi's own
instructions. The wording matches [the pinned public Codex renderer](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/context/token_budget_context.rs#L176).
Delivery timing and context accounting remain Pi's. No shared-session token
allowance is introduced.

The adapter keeps Pi's request projection and turn preparation, including native
threshold compaction. An empty host control message starts the public native
session lifecycle; it carries no provider input. Only SDK prompt/loadout patches
are discarded because the durable adapter owns exact role instructions and tool
bindings. Native overflow recovery remains Pi's compact-and-retry operation.
Compaction summary requests use the same durable payload, validation and final
liveness fences as task requests, with their actual separate instructions,
routing identity, usage and disabled cache retention recorded.

Compaction appends immutable state payloads containing Pi's native entries and
rewritten active projection. Earlier request artifacts and exact-point forks
retain their original history. The new boundary does not assert inherited native
prefix equality across rewritten history. Failed native compaction or remaining
provider overflow returns `resource-pending` with causal evidence; source-backed
reconstruction belongs to the harness and requires no final report from Pi.

SDK transport retries are disabled. Stop fences new model/tool/submission work
and aborts both streaming and native compaction cooperatively, while `settled()`
waits for actual drainage under the caller's observation deadline. A receipt
alone does not establish quiescence.

## Model and login

Credentials remain Pi's own in its agent directory (`~/.pi/agent` or
`PI_CODING_AGENT_DIR`). `agentDirectory` can select that directory. `model`
selects the requested provider/model, optionally with a supported thinking level;
readiness can report absence of a configured model. Log in through Pi's own
`npx pi` and `/login`; no credential values enter durable task or metric facts.

## Qualification

Ordinary owner tests use installed serializer/parser seams with scripted
external responses; no real Git, process or network is launched. The exact
registered `plan23-transport.boundary.test.ts` observes actual local kernel HTTP
and SSE, production ledger restoration in a new process, inactive-tool refusal
and the final dispatch fence. Default native execution requires no login or
conditional skip. Its explicit original-live evidence invocation additionally
requires the same clean candidate's successful live captures and verifies full
settled inherited prefixes. Default local native controls alone do not establish
external provider acceptance.

## Experimental subagents

Role-aware tool declarations offer
`subagent` to plan, module and capability architects and to module and contract
engineers, including non-functional repair engineers. Other roles receive no delegation tool. Preview and execution use
the same declaration. Existing ambient Pi extension loading remains disabled.

Call `subagent({tasks: [{task: "..."}, ...]})` to run independent tasks concurrently
and wait for all results. Architects delegate exploration with `read`, `grep`,
`find` and `ls` where the parent has them. Engineers' workers can additionally use
the parent's `edit`, `write` and harness `shell`. Workers share the working
directory and assignment scope; the coordinator assigns disjoint files and
integrates and verifies the combined result. These file subdivisions are prompt
instructions; the enforced scope remains the parent assignment.

Every worker starts a fresh context with the parent's role instructions,
context additions and current task, plus its specific delegation. Prior model
conversation and tool results are not copied: include necessary findings in the
delegation. The worker inherits the parent's model and thinking level and has an
independent provider session identity. Workers cannot delegate, consult on behalf
of the parent, or use parent submission tools. They finish with `report_subagent`;
only the coordinator submits the assignment to the harness.

Child sessions, native requests, effects and reports use the harness-owned
session store. Tool calls retain the parent's guards and mutation checks.
Namespaced tool and usage observations are attributed to the parent invocation;
child context observations do not replace its context estimate. Worker compaction
uses native Pi behavior without initiating a parent architectural checkpoint.
Stopping the parent aborts workers and waits for their actual settlement.
Completed delegation results replay from the parent effect journal; interrupted
uncertain effects retain the ordinary unavailable outcome and are not restarted
blindly. A worker failure is returned with the other workers' results, including
its operation identity where available; worker reports never establish acceptance.

This experiment supplies synchronous batches, not persistent chat with workers or
separate worker worktrees. It is enabled for the listed roles, with no new project
configuration. Qualification uses the installed native Pi serializer and loop
with scripted provider replies; a live project trial remains separate.
