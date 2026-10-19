# Persistent Codex coordinator through assisted implementation

**Status:** proposed for native assisted implementation; execution has not started.
**Planning source:** `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`, plus the linked
coordinator design in this worktree.
**Prerequisite:** the [harness decomposition](../harness-decomposition/plan.md)
has landed and passed its cumulative assessment. This plan targets its resulting
module structure. The planning source is not this plan's future execution baseline.
**Execution:** Astra coordinates native Sol engineering; RA assesses committed
iterations and the cumulative final candidate through the existing assisted path.

## Outcome and scope

Implement the [app-server coordinator design](../../docs/architecture/agent-assistance/codex-coordinator-host.proposal.md).
A user or another Codex session can launch an assisted coordinator in the
devcontainer, observe it, send messages and answer requests. The coordinator,
native workers and RA assessment continue when the user's connection disappears.
Reconnection observes the same execution. Explicit continuation after process
failure preserves the original plan/job, partial source and acceptance obligations.

Deliver a dedicated Codex app-server adapter, one detached RA host per target
checkout, shared HTTP MCP assessment, CLI controls, small retained coordinator
records and updated coordinator guidance. Keep implementation choices modest:
Codex owns engineering and native worker scheduling; RA owns host lifecycle,
assisted state and independent candidate assessment.

The continuity guarantee requires a running container and provider connectivity.
Container/host failure uses recovery rather than uninterrupted execution. Agent
launch must be qualified separately from terminal launch in the supported
devcontainer execution mode. If its sandbox or tool cleanup prevents persistence,
report that specific limitation and support controlling a terminal-launched host;
do not weaken permissions or claim unsupported launch environments work.

Automatic watchdogs, restart/continuation loops, compaction policy, notifications,
active-turn steering, browser UI, remote hosting, multiple coordinators per checkout
and a generic provider/supervisor framework are outside this plan. Preserve normal
Codex context management. Keep typed provider operations and event projection
separate so later controls can be added without replacing the lifecycle.

## Governing contracts and execution preparation

Follow [repository instructions](../../AGENTS.md),
[harness principles](../../docs/harness.principles.md),
[recovery principles](../../docs/harness-recovery.principles.md),
[test boundaries](../../docs/testing.spec.md), and the
[assisted service contract](../../docs/architecture/agent-assistance/service.spec.md).
The [assistance direction](../../docs/architecture/agent-assistance/approach.principles.md)
retains its stated proposed status. No principle change is needed. Update precise
service/control specifications additively where implementation creates contracts;
preserve existing protection, assessment and authority rules.

Before registering this plan, inspect the completed decomposition and refresh
architect plus consuming modules' ordinary/testing API views. Locate the actual
assistance, agent, task-execution, persistence and public-facade owners. Capture
the actual post-decomposition execution baseline through ordinary plan registration.
Include this plan and governing design in the captured requirements. Source
locations below are planning anchors; follow moved definitions rather than
reintroducing their previous ownership. Do not execute this feature early merely
because the old source paths remain available.

Use the [coordinator skill](../../.agents/skills/ramify-agent-coordinate/SKILL.md)
and [worker skill](../../.agents/skills/ramify-agent-module-work/SKILL.md).
Continue using the established assisted MCP path to implement and assess the new
launcher. Live launch exercises use a separate disposable target checkout with
its own project lock, committed audit configuration and plan. Never start a test
coordinator competing with the owner assessing this implementation checkout.

Module focus is advisory, not a write restriction. Workers can change necessary
consumers, providers, declarations, tests and documentation in the same assignment.
Existing local commit/audit authorization applies; pushing and tracker remote
synchronization remain outside this plan.

## Required behavior

### R1 — Own execution independently of clients

The host acquires project ownership before registration/provider launch, binds and
verifies its loopback MCP/control listener before spawning Codex, and retains
independent standard streams and diagnostics. Its persistent stdio connection to
the dedicated app-server remains open with zero observers. It drains output even
when watchers are slow or absent. Closing CLI/IDE/watch connections never cancels
a turn or assessment. Concurrent starts cannot create competing coordinators.
Existing live `serve` or standalone MCP owners remain untouched.

The app-server adapter handles initialization, request correlation, provider
errors/events and server-initiated requests. Select the configured Astra and Sol
models and preserve applicable user instructions, tools and permissions. Check
required methods and equipment before implementation input. Record the qualified
CLI version; diagnose actual incompatibility rather than rejecting any changed
version or modifying the user's shared daemon.

### R2 — Share assessment and configure MCP correctly

Use one assistance service and project lock, with separate official SDK HTTP MCP
connections sharing that service. Reuse existing tool registration, assessor,
ledger, command receipts and Pi runtime. Client closure releases connection or
observation resources without closing the service or cancelling assessment work.
Preserve standalone stdio MCP compatibility.

The Node/Express-to-Fetch bridge is an implementation deliverable: handle request
bodies once, response headers, streamed bodies/SSE, flushing, backpressure and
abort propagation. All applicable observation/transport deadlines must accommodate
the 15-minute assessment wait with margin. Use a private local bearer credential,
loopback binding and host/origin validation as specified in the design.

Use launch-time `-c` overrides to disable explicitly identified global stdio RA
entries (`--replace-mcp <name>`, repeatable) and add a separate collision-free HTTP
entry. Never merge `url` into a table retaining `command`. Preserve unrelated MCP
configuration and the global file. Keep credentials out of prompts and retained
progress. Verify the effective configuration, native worker inheritance and the
required tool set. Resume refreshes endpoint/credential settings and cannot revive
an old stdio owner. The HTTP entry is required and has a tool timeout above the
server wait; startup timeout does not substitute for listener readiness.

### R3 — Bind a persistent coordinator to one execution

Discover/select the intended assisted job; register new work through ordinary
service admission with a retained command ID. Ambiguous existing jobs require
selection rather than a fresh baseline. Retain registration even if provider
startup later fails. Repeated start for the same live target returns its identity;
another active target is reported without replacement.

Start all coordinator threads with `ephemeral: false`, verify the returned flag
and persist their identity before implementation input. This includes fresh-thread
recovery fallbacks. Use persistent Codex history and preserve its ownership of
conversation storage. Registration, thread persistence and successful turn
submission are distinct facts; lost replies report uncertainty rather than restart.

Revise the coordinator skill in the first usable host slice: supplied plan/job
identities are verified through `job_detail` and reused. A mismatch is an error,
not a new registration. Without supplied identities, retain the existing ordinary
discovery/registration behavior. Pass the target, exact execution identities and
skill reference in the initial input. Iteration and final assessments remain the
coordinator's responsibility.

### R4 — Provide useful CLI control and observation

Implement `coordinate start`, `status`, `watch`, `send`, `respond`, `interrupt`,
`stop` and `resume` with the semantics and identity arguments in the design.
Provide readable output and structured JSON for agents. `watch` is the reconnect
interface; no embedded Codex TUI is needed. `send` starts an idle turn and reports
a busy turn without silently queuing or steering it.

Expose independent host, turn and assessment state, pending questions/approvals,
last observation time and actual errors. Unreachable hosts expose stale observations
honestly. A final assistant message, finished turn or process exit never substitutes
for candidate-bound final-plan assessment.

Handle actual provider user-input and approval requests with validated responses.
Scope pending request identity to host generation and thread/turn; reject stale
responses and prevent double settlement. Unsupported requests remain visible.
Disconnected users do not implicitly approve anything. Plain-text questions ending
a turn remain visible and can receive a follow-up through `send`.

Keep a bounded progress stream with cursors; indicate retention gaps and provide
a current snapshot. Slow observers cannot block provider reading. Do not copy
hidden reasoning or full tool payloads into a second conversation store.

### R5 — Retain minimal state and continue safely

The assistance owner retains coordinator identity, target and plan/job references,
thread/model/version, host generation/process start identities, turn/pending-request
observations, command receipts and bounded progress under the ignored harness
state directory. Reuse appropriate ledger/atomic-write facilities. Do not invent
a second acceptance database or move Codex history into RA's session store.

Retrying the same admitted command in a live host cannot redeliver it. Conflicting
arguments under that identity fail. A crash between provider acceptance and durable
acknowledgement may remain uncertain: inspect provider history where useful and
never blindly replay messages or approvals or claim exactly-once external effects.

`interrupt` reports actual parent, worker and assessment effects. `stop` settles
owned processes and closes the service, retaining interrupted assessments. Parent
turn interruption or closing stdin alone does not establish descendant settlement.
Do not stop unrelated sessions. Missing sockets or old timestamps are insufficient
evidence to replace a potentially live writer.

`resume` requires settlement of the previous owner, preserves the job/baseline and
partial source, and uses ordinary current-state inspection. Reuse an available
thread or start a persistent fresh coordinator with the same task and authority.
Interrupted assessments retain explicit resume semantics. Provider exit leaves
the host available for inspection and continuation; v1 never automatically restarts
or launches a new turn merely because one finished or failed.

## Module impact and reuse

The current declarations and generated views describe the pre-decomposition tree.
They establish existing behavior, not future child importability. The harness's
ordinary API catalog exposes the current agent session operations, Pi construction
and ledger atomic helpers. Assistance service/runtime/tool registration currently
belong to the harness itself. Its root-facing exposure is `startAssistanceServer`.
Generated views report coverage limits; missing entries are not proof of absence.

| Intended owner after decomposition | Work and reuse | Required consumer integration |
| --- | --- | --- |
| `agent/codex`, exposed through `agent` | Own app-server process/protocol interaction behind a small typed adapter. The existing agent/Pi boundary is the placement precedent, not a requirement to copy Pi's serializer or submission loop. | The harness composes the provider into assistance using prepared inputs and provider observations. Expose the factory and signature companions through the agent parent. |
| `assistance` | Own coordinator lifecycle policy, job association, controls, records, progress and shared HTTP MCP. Reuse service admission, tool registration, assessor, retries and assessment recovery. | Consume the provider contract and completed decomposition's shared facilities; keep semantic acceptance in the existing assessment path. |
| Harness parent and root CLI | Compose ownership, services and listener; detach the host; expose supported control/result contracts and implement CLI presentation. | Root consumes the harness facade, not assistance/provider internals. Add declaration/re-exposure changes and composition tests together. |
| `task-execution`, persistence and ledger | Reuse matching cancellation/settlement, observations and durable-write mechanics. RA's session store continues serving RA-managed sessions. | Inspect actual extracted APIs before deciding reuse. Avoid broad mutable service exposure or a new generic framework solely to fit Codex. |
| Skills, usage/specification and devcontainer guidance | Revise supplied-registration handling, command examples, transport setup and supported launch conditions. | Keep normal assisted usage working and document the qualified runtime/configuration. No tmux dependency or web feature is required. |

Planning source anchors are the existing
[assistance runtime](../../subs/harness/src/assistance/runtime.ts),
[service](../../subs/harness/src/assistance/service.ts),
[MCP registration](../../subs/harness/src/assistance/mcp.ts),
[project lock](../../subs/harness/src/store/lock.ts),
[agent declaration](../../subs/harness/subs/agent/module.ramify),
[session operations](../../subs/harness/subs/agent/src/interfaces/session-operations.ts),
[ledger atomic helpers](../../subs/harness/subs/ledger/src/atomic.ts), and
[CLI composition](../../src/main.ts). These anchors may move in the prerequisite.
Extend the behavioral coverage now found in
[assistance service tests](../../subs/harness/src/tests/assistance-service.test.ts)
and [official MCP client tests](../../subs/harness/src/tests/assistance-mcp.test.ts)
at their resulting owner, especially command replay, shared service lifetime and
observation cancellation. Provider and process witnesses belong to their own owners.

The provider contract is new and needs joint discovery with its assistance
consumer. Keep raw protocol objects within Codex, including pending-request
decoding. Preserve enough typed information for actual approvals and diagnostics;
do not hide provider capabilities behind an inadequate Pi-oriented interface.
After extraction, inspect each ordinary/testing catalog and defining declaration
before claiming an import is available. Changes to missing exposures belong with
the provider and consumer implementation, not a separate permission iteration.

## Proposed implementation iterations

### Iteration 1 — Drive a persistent Codex conversation through a provider adapter

**Outcome:** a real consumer can initialize the dedicated provider, start a
persistent thread, exchange messages and pending-request responses, observe outcomes,
interrupt and settle owned execution. Protocol failure and process exit remain
explicit. Deliver the R1/R3/R4/R5 provider responsibilities without pretending the
operator host is already complete.

**Focus:** `agent/codex` and its `agent` parent. Protocol version details, event
decoding, persistence and process ownership are concentrated here. Include a small
harness composition consumer/witness so the interface is verified through actual
exposure, not only provider-local mocks. Agree the narrow assistance-facing contract
with its consumer in this iteration; no full generic provider redesign.

**Dependencies:** completed decomposition and refreshed views. Reuse one Sol worker
for adapter and consumer contract work. Do not parallelize against a guessed API.

**Verification:** scripted protocol cases cover correlation, unsolicited requests,
errors, non-ephemeral start and explicit settlement outcomes. Registered native
witnesses establish process behavior. A bounded live app-server exercise verifies
the qualified version, persistent-thread read/resume and native Sol equipment,
without implementing a real feature in the implementation checkout. Record
unexercised provider behavior honestly. RA assesses the committed iteration.

### Iteration 2 — Launch and interact with the detached assisted host

**Outcome:** deliver the first usable vertical slice: R1–R4 and R5's live-host
records/retries/stop behavior, with start/status/watch/send/respond/interrupt/stop.
One host owns assessment, serves HTTP MCP, launches configured Codex and keeps
working through observer disconnect. Include the coordinator skill revision and
usage/contracts in this same candidate. Crash continuation remains iteration 3.

**Focus:** `assistance`, with harness composition, root CLI and the Node/Fetch bridge
in the same assignment. Registration, ownership, HTTP lifetime and provider input
depend on one another. Keeping them together avoids several workers inventing
different startup/readiness and cancellation contracts.

**Interactions:** integrate iteration 1's provider with the real assessment service.
Include loopback credentials, listener-before-spawn ordering, explicit global MCP
disable/new-entry configuration and worker inheritance. Resolve appropriate
task-execution/persistence reuse with their actual owners. Root consumes only the
public facade. This iteration owns CLI-to-provider-to-MCP-to-assessor integration.

**Verification:** scripted service/CLI cases cover launch races, failed readiness,
duplicate messages, request identity, bounded observers and independent statuses.
Official MCP client integration covers shared ownership and cancellation. Native
HTTP tests establish streaming/abort behavior and the long wait. In a disposable
target, run a small real assisted task with a native worker and configured assessment;
disconnect/reconnect during each. Separately qualify agent-shell launch and capture
any sandbox limitation. A required behavior failure requires repair; a documented
unsupported launch environment is not evidence that agent launch worked. RA
assesses the committed candidate after relevant qualification.

### Iteration 3 — Continue interrupted work and qualify the complete workflow

**Outcome:** complete R5 through `resume`, including provider exit with a live host,
host/process failure, uncertain delivery and persisted/fresh-thread continuation.
Retain original job/baseline, partial source and pending assessments. Complete all
acceptance evidence and operator guidance; preserve the earlier usable slice.

**Focus:** assistance continuation and composed process settlement. Prefer the
already-oriented host worker; necessary provider fixes remain in the assignment.
Reuse the ordinary recovery policy and records. Do not create a replay engine,
automatic supervisor or new approval requirement for restarting authorized work.

**Dependencies and integration:** follows iteration 2. Reconcile surviving writers
before replacement, rebind current MCP settings, and verify ordinary standalone
assisted clients still work. This iteration owns cumulative integration and the
final evidence report, including remaining limitations and exact runtime conditions.

**Verification:** scripted crash windows distinguish proven delivery from uncertainty.
Native process and live-provider cases establish stopped descendants, resumable
history, fresh-context continuation and interrupted-assessment reuse. Finish a real
small plan after an interruption and obtain its final assessment for the exact
candidate. Assess this implementation iteration, then request the separate cumulative
final-plan assessment against this plan's original registered execution baseline.

These iterations are a proposed sequence, not prescribed agent assignments. Keep
them sequential while provider/consumer contracts evolve. Split the HTTP bridge
only if it becomes substantial independent work behind a stable service boundary;
the host iteration retains integration responsibility. Ordinary repairs remain
repair candidates within their native iteration. New discovery can change the
breakdown without changing requirements or resetting registration.

## Acceptance evidence

| Obligation | Evidence and responsible iteration |
| --- | --- |
| Persistent provider and worker equipment | I1 scripted protocol plus live installed CLI: non-ephemeral thread, model/instruction/tool delivery, worker operation, request handling, persistence after provider restart. |
| Correct ownership and readiness | I2 launch race, existing-owner refusal, bind failure and held-readiness cases: exactly one owner; no early provider; unrelated sessions survive. |
| Correct MCP overrides | I2 global stdio fixture and live effective config: named old entries disabled, HTTP-only new entry, unrelated/global config unchanged, no worker lock contention. I3 rebinds current endpoint on resume. |
| Streaming transport and assessment wait | I2 real local HTTP/SSE bridge handles headers, backpressure and abort; a native long-wait witness covers the configured 15-minute interval/margin. Observer abort leaves assessment running. |
| Disconnect resilience | I2 terminal and separately agent-tool launch evidence, with tool return/session closure and zero observers while worker/assessment progress continues under the same identities. |
| Questions and operator controls | I1/I2 actual request response, disconnected wait, stale/competing response rejection, plain-text question follow-up and busy-send refusal; no invented approval. |
| Retried commands and bounded progress | I2 lost-reply retries return the live-host receipt without duplicate effects; cursor gaps and slow observers preserve provider progress. I3 reports uncertain crash outcomes honestly. |
| Skill and compatibility | I2 supplied registration is verified/reused, mismatch fails and unsupplied discovery remains functional; no duplicate job/baseline. I3 retains standalone stdio and existing assessment gates. |
| Settlement and recovery | I1 provider mechanics and I3 composition establish actual descendant settlement before replacement. Resume uses the same job, preserves partial work and handles available/unavailable thread history. |
| Acceptance remains independent | I2/I3 distinguish idle/failed turns from assessment state; interrupted assessments remain pending; real pilot and implementation both receive candidate-bound cumulative final assessment. |

Ordinary tests script external process, Git, CLI, audit and provider answers.
Real tool/kernel claims require exact reviewed entries in
[`src/tests/test-boundaries.json`](../../src/tests/test-boundaries.json); retain
live-model evidence separately. Use controlled clocks for routine timeout cases.
Tests follow behavioral owners; composition witnesses use real in-process components
and explicitly controlled external boundaries. A stubbed transport does not prove
client-disconnect or process-cleanup behavior.

Each iteration runs appropriate focused verification, type/structural checks
(including `npm run check:self`) and assessment of its committed candidate with
the default configured audit. Let RA run that audit; do not duplicate full suites
or add scope overrides without a concrete reason. Missing live credentials or an
unexercised claim is a qualification gap, not a passing witness. Do not intentionally
introduce a code defect just to manufacture repair evidence.

## Material uncertainties and handoff

The actual extracted APIs and app-server process-tree cleanup behavior must be
verified during implementation. Codex `0.161.0` and the installed Fetch-standard
MCP transport informed the design; qualify the execution environment's actual
versions and configuration rather than silently updating them. Retained provider
history cannot guarantee exactly-once external effects or survival of every tool.

Agent-tool launch support is conditional on its real execution environment. Retain
the exact restriction if terminal launch is the only qualified path; do not make
another sandbox's failure a universal limitation or disguise it as full acceptance.
The final handoff distinguishes delivered behavior, tested launch modes and remaining
gaps. No user decision is needed to choose routine adapters or module exposures.

Writing this plan does not start implementation, register an execution or launch
Codex/Pi. The handoff is this plan, its governing design and the post-decomposition
prerequisite; the native coordinator captures the execution baseline when work starts.
