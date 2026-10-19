# Decompose the harness through assisted implementation

**Status:** proposed for native assisted implementation; execution has not started.
**Source baseline:** `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`.
**Execution:** Astra coordinates native Sol engineering; ramify-agent (RA) assesses
committed candidates through Pi and the configured audit.

## Outcome

Give assisted assessment, autonomous implementation, session persistence and task
execution coherent owners. Within autonomous implementation, separate planning,
work coordination and acceptance. Preserve supported behavior and durable history
while reducing the unrelated implementation knowledge needed for ordinary changes.

Implement the full responsibility separation in the
[reviewed proposal](../../docs/architecture/harness-decomposition.proposal.md).
The proposal's whole-file allocation is a measurement experiment, not a file-move
instruction. Completion includes resolving its autonomous remainder and mixed
facade and execution files. Extracting assistance alone or relocating the existing
`RunService` without separating its decisions does not complete this plan.

The retained [baseline](../../docs/analysis/2026-10-19-harness-decomposition/baseline.json)
and [collector](../../docs/analysis/2026-10-19-harness-decomposition/collect.py)
support comparison. Deliver an architectural result, behavior-preservation
evidence and an honest evaluation; a measured productivity improvement is a
hypothesis to evaluate, not a result that implementation may invent.

## Governing commitments

Follow [repository instructions](../../AGENTS.md),
[harness principles](../../docs/harness.principles.md),
[recovery principles](../../docs/harness-recovery.principles.md),
[measurement principles](../../docs/metrics/measurement-principles.md),
[test boundaries](../../docs/testing.spec.md), and the existing
[assisted service contract](../../docs/architecture/agent-assistance/service.spec.md).
Preserve each document's status and adopted commitments. The
[current autonomous design](../../docs/architecture/autonomous-implementation-loop.md)
explains the behavioral responsibilities; this refactor does not restore older
execution restrictions or supersede adopted recovery rules.

The [assisted planning](../../.agents/skills/ramify-agent-assisted-plan/SKILL.md),
[coordination](../../.agents/skills/ramify-agent-coordinate/SKILL.md) and
[module-work](../../.agents/skills/ramify-agent-module-work/SKILL.md) skills govern
native execution. Module focus is advisory. Workers may make necessary changes
to consumers, providers, declarations, tests and documentation without approval
based on module ownership. Use native agents for implementation and RA for
assessment; do not launch a full harness-managed implementation run.

This is an ownership refactor, not a new workflow, permission system, provider
release or recovery redesign. No principle changes are required. Existing explicit
constraints and protected inputs remain effective. Corrected ordinary issues need
no separate approval. Local commits and audits have standing authorization;
pushing and tracker synchronization do not.

## Required architecture and behavior

| Responsibility | Intended owner and acceptance |
| --- | --- |
| Application composition and public facade | Harness parent constructs workflows and providers and serves supported entry points. Shared project exclusion, common configuration and command mechanisms retain explicit owners. Browser-safe public contracts remain available to the root and web. |
| Assisted workflow | An `assistance` child owns registration, iteration records, assessment admission/stages, finding follow-up, protection acceptance, recovery and its thin MCP adapter. Its store and assessor remain together initially. |
| Session persistence | A `session-store` child owns durable session records and immutable payloads through the ledger, implementing the agent's existing store contract. It does not decide workflow completion. |
| Task execution | A `task-execution` child owns shared invocation mechanics, equipment binding, submission handling, recording, cancellation/settlement and session reuse/fallback. It consumes prepared tasks and explicit authority without importing autonomous scheduler internals. |
| Autonomous lifecycle | An `autonomous` child owns run admission, stop/resume, activity ordering and authoritative commits of accepted run transitions. Its implementation is orchestration rather than retained planning, coordination and acceptance algorithms. |
| Planning | An autonomous child owns plan intake, extraction, validation and accepted initial analysis, including the hypothesis, registry and initial scenarios. |
| Work coordination | An autonomous child owns placement, frontier scheduling, assignments, contract obligations, capability delegation and consumer/provider handback. Keep capability coordination here initially. |
| Acceptance | An autonomous child owns candidate qualification, review settlement, reconciliation, obligation satisfaction and completion eligibility. Reconciliation and completion use one coherent candidate/evidence basis. |

These names and the proposed tree are the starting design. Refine exact contracts,
names and child grouping when implementation evidence improves the boundary;
record the reasoning and preserve every responsibility and acceptance requirement.
Do not use an adjusted grouping to leave a broad, unexplained remainder.

**State and authority.** Workflow owners receive observations and assessments and
commit accepted transitions through the existing ledger. Keep atomic transitions
atomic. Children use narrow reading and execution/commit contracts rather than
receiving the entire mutable `Run`, `RunLog`, mutex collection or live-session map.
The harness subtree remains the durable-state owner. Preserve project exclusion,
writer settlement and prevention of late submissions or writes from replaced
attempts. Share existing job identity, command replay and lock mechanisms where
their invariants are common; workflow-specific lifecycle behavior follows its
owner. Do not create a general contracts/utilities module to absorb the remainder.

**Execution.** Preserve managed runs, manual steps and standalone sessions through
the same applicable invocation, gate and after-handling behavior. Role-specific
prompt prose, task construction, semantic validators and acceptance policy stay
with their workflow. Generic delivery and recording mechanics may move to task
execution. Preserve emitted task content, tools, authority, provenance and outcome
meaning; moving source must not silently change prompt delivery or add model calls.
An interrupted task remains pending and can restart through ordinary execution
from repository state, including a fresh session. Reuse is an optimization.

**Assessment and history.** Preserve original plan baselines, iteration and
assessment identities, command retry behavior, protected-input decisions, exact
candidate evidence and historical record readers. Keep public CLI/MCP/HTTP shapes
compatible. Move code without rewriting old logs, payloads or captured evidence.
Retain unsupported/corrupt-record diagnostics. Query operations remain read-only.
Assisted assessment and autonomous acceptance retain their different policies
while sharing providers where their contracts fit.

**Providers and access.** Preserve evidence, ledger, agent/Pi, audit, reviews,
check-findings, projections, KPI, scenarios, plan-evidence, nonfunctional and
recovery responsibilities. The agent receives a session store; it does not acquire
harness persistence. Recovery stays a small re-entry policy. Toolkit dependencies
remain pinned package consumers, with no source imports or companion checkout
aliases. Existing type exports or same-owner imports do not establish future
child access: verify ordinary/testing catalogs and expose or re-expose only the
supported contracts. Tests move with their behavioral owner; cross-owner
integration retains an explicit owner and the real implementations.

## Current evidence and module impact

The source baseline still matches the proposal's measured source. The generated
architect/API views cover the current module tree, with recorded coverage limits
and truncation. Refresh them when the execution checkout differs or source moves.
Use the consuming module's catalog to verify access; missing entries under
incomplete coverage are not proof of absence.

| Surface | Existing behavior to reuse and changes to integrate |
| --- | --- |
| [Session store](../../subs/harness/src/run/session-store.ts), [lock](../../subs/harness/src/store/lock.ts), agent and ledger | One 406-line store already has four production consumers. Its only outbound pair within the proposed groups is the lock; its other dependency files are agent/ledger. Extract the store with narrow lock access, preserving all callers and persistence tests. |
| [Assistance](../../subs/harness/src/assistance/service.ts) and [runtime](../../subs/harness/src/assistance/runtime.ts) | The only production consumer outside this group is root `src/main.ts`, using the existing `startAssistanceServer` exposure. Preserve that facade. The group still imports 89 external original identities, requiring deliberate provider and shared-helper access. |
| [Invocation runner](../../subs/harness/src/steps/runner.ts), [session operations](../../subs/harness/src/run/session-operations.ts), transcripts and prompt delivery | Reuse the shared executor. Separate workflow facts/policy from reusable mechanics before moving the mixed session-operations file. Include managed, manual, standalone and consultation callers, their equipment and recording. |
| [Run service](../../subs/harness/src/run/service.ts), analysis, architecture, work, capability and contracts | Move actual decisions and records, not just directory names. Resolve the broad [committed-record view](../../subs/harness/src/work/committed.ts) into supported reading contracts and owner-specific selectors. |
| [Committing gates](../../subs/harness/src/run/committing-gate.ts), [after-handling](../../subs/harness/src/run/after-handling.ts), reviews, findings and nonfunctional phase | Preserve shared automated/manual gate behavior and candidate-bound reconciliation. Keep existing pure providers and audit execution responsibilities. |
| Root CLI, HTTP, projections, web and KPI | Adapt imports and reading contracts with each provider move. Keep browser-safe contracts and retained-record interpretation stable. Projections receives no writable service surface. |
| Jobs, store and public protocol | The facade seed has 148 external consumer files and mixes command/job/lock behavior with protocol. Give each mechanism an explicit owner; the 1,719-line `interfaces/protocol/runs.ts` is not automatically the correct home for every domain definition. |
| Test setup, configuration, native boundary registry and documentation | Move owner-local tests/helpers, update import paths and configured discovery, and preserve process guarding and exact native claims. Update module purposes and current links without rewriting historical evidence. |

The history sample supports assistance's cohesion: seven of 13 commits changed no
other measured production group/owner. Planning is unobserved, coordination has
five multi-group commits and acceptance has ten. They need interface discovery
within implementation rather than assumed independent workers. The move-only
allocation leaves 28,503 lines in the autonomous remainder and seven groups
mutually dependent. Those counts establish migration work, not target limits.

## Proposed implementation iterations

Execute the six outcomes in order initially. Their shared declarations, lifecycle
contracts and test helpers make parallel extraction likely to duplicate discovery
and collide on writes. Reuse an oriented Sol worker across related outcomes when
useful. Independent investigation can run alongside implementation, but concurrent
production edits need stable contracts and an explicit integration owner.

Each iteration includes its provider, callers, declarations, tests and relevant
documentation. The assigned worker owns their integration; the coordinator owns
committed-candidate assessment. Temporary compatibility adapters may support an
intermediate candidate, but remove obsolete internal forwarders by completion.
The supported public facade is intentional and remains.

### Iteration 1 — Share durable session persistence through its own owner

**Outcome:** assisted, autonomous, administrative and qualification callers use a
real session-store child backed by the existing ledger. Preserve detached values,
immutable payloads, compare-and-swap, close/reopen, corruption behavior and writer
exclusion. Keep the existing lock invariant through a narrow supported contract.

**Focus and interactions:** session-store implementation dominates this change;
its parent, agent interface, ledger and all four consumer files are part of the
same assignment. Establish only the shared support needed for this extraction.
Do not first build a general persistence or dependency framework.

**Verification:** migrate the existing session-store persistence and cache tests;
verify real callers still bind the same store contract. Update the workflow
in-memory store adapter and its setup so ordinary workflow tests still avoid bulk
disk persistence. Preserve exact native lock claims and their registrations.
Capture the pre-change inventory and available session-persistence task evidence
before editing, then record the resulting owner/API metrics.

**Dependency:** prepared execution baseline and captured plan; no preceding
implementation iteration.

### Iteration 2 — Isolate the complete assisted workflow

**Outcome:** an assistance child owns the complete service, store, assessor,
protection/finding adapters and MCP transport. Root CLI startup still calls the
supported `startAssistanceServer` facade. Other callers do not need assisted
internals to use it.

**Focus and interactions:** keep service admission and assessment lifecycle
together. Resolve sibling-provider access and currently parent-owned job,
command, document, audit-workspace and reconciliation helpers by responsibility.
Move genuinely shared behavior to its proper owner or provide a narrow adapter;
do not make assistance depend on the autonomous service or copy its algorithms.
Integrate the session-store child from iteration 1 and the actual root caller.

**Verification:** real service plus official MCP client tests cover registration,
iteration start/end, repair attempts, reconnect/retrieval, idempotent requests,
assessment interruption/resume, exact protection approval, final baseline and
legacy calls/records. Exercise the real composed assessor with scripted external
answers. Preserve read-only inspection and exact candidate-source verification.

**Dependency:** iteration 1. The existing narrow external consumer interface
makes this a useful next boundary; it does not eliminate its provider work.

### Iteration 3 — Execute prepared tasks through a shared runtime

**Outcome:** task execution is a real child used by managed runs, manual steps
and standalone sessions. Its ordinary source has no dependency on autonomous
scheduling internals. Workflow-specific task construction and policy are supplied
through narrow inputs/callbacks; they are not hidden behind a renamed full `Run`.

**Focus and interactions:** runner, session operations, delivery, transcripts,
equipment and their callers require joint discovery. Split mixed files as needed.
Integrate agent/Pi, session store, ledger, recovery and KPI through supported
contracts. Rebind current validators, authority and destinations on every
operation while preserving existing prompt and observation provenance.

**Verification:** shared lifecycle tests exercise managed/manual/standalone
execution, accepted and rejected submissions, actual fresh/continue/fork modes,
unavailable-context fallback, stop/settlement and restart without retained session
history. Compare task delivery, tools and recording for representative unchanged
inputs. Preserve consultation and administrative callers and existing process
guards. This iteration owns integration across every runtime caller it changes.

**Dependency:** iterations 1–2 establish persistence and remove assisted policy
from the runtime extraction's source neighborhood.

### Iteration 4 — Establish autonomous lifecycle ownership and planning

**Outcome:** autonomous execution has its own lifecycle owner, with a planning
child that performs intake, extraction, validation and accepted initial analysis.
The harness parent becomes application composition for that workflow. Root CLI,
HTTP and projections continue to observe the same run behavior.

**Focus and interactions:** move the service orchestration with its lifecycle
records, then extract real planning decisions and the corresponding service
methods. Establish narrow committed-reading and transition contracts needed by
the next extractions. Separate owner-specific selectors from the universal
committed-record projection. Keep unresolved coordination and acceptance code
explicitly local to autonomous until iterations 5–6; this intermediate state is
not final completion.

**Verification:** accepted analysis, scenario/registry creation, analysis rejection,
ordinary approval/stop behavior, lifecycle reopening and real HTTP/query consumers.
Exercise start → captured plan → accepted analysis → initial work/scenario records,
including restart immediately after the accepted analysis transition. Keep that
transition atomic even when its records describe several responsibilities.
Verify legacy records remain readable and queries do not rewrite state. Integrate
planning with the task runtime and existing plan-evidence/scenario providers.

**Dependency:** iteration 3. Pair the lifecycle move with a complete planning
outcome so this iteration delivers a working boundary rather than scaffolding.

### Iteration 5 — Own work coordination and delegated handback

**Outcome:** placement, frontier scheduling, assignments, contract obligations and
capability delegation live in work coordination. The autonomous parent asks for
the next authorized activity and commits accepted transitions through its narrow
contract. It no longer implements those decisions itself.

**Focus and interactions:** keep work/capability/contract behavior together while
their interfaces are discovered. Preserve depth-first capability work, partial
candidates, unfinished obligations and real consumer integration on return.
Connect planning output, the task runtime, existing acceptance behavior and
read-only projections within this assignment. Include source lineage, affected
KPI inputs and historical selectors rather than moving a second copy of state.

**Verification:** real planning-to-assignment composition, placement revisions,
capability request/qualification, nested delegation, contract obligations,
consumer/provider handback and resumption of the original goal. Cover interrupted
coordination with retained partial work and atomic transitions. Existing capability
acceptance/recovery and work-item integration tests are starting points.

**Dependency:** iteration 4's lifecycle and reading/transition contracts. Retain
one oriented implementation owner for coordination and its consumer adaptations.
If this outcome is too broad, split ordinary work/contract execution from capability
return only after their shared contract is understood and each slice can complete
a real vertical behavior. If coordination and acceptance contracts require joint
discovery, combine the affected vertical work with iteration 6 instead of forcing
an unstable interface between workers.

### Iteration 6 — Own acceptance and finish the decomposition

**Outcome:** candidate qualification, review settlement, reconciliation, obligation
satisfaction and completion eligibility live in acceptance. The autonomous parent
orchestrates the resulting owners. Every file left in the proposal's autonomous
remainder, execution seed and facade has a documented responsibility and home;
there is no unassigned residual domain engine in the parent.

**Focus and interactions:** integrate acceptance with work coordination, managed
execution and manual gate/after-handling entry points. Resolve remaining domain
records, public protocol definitions, lock/job/command support and query contracts
by authority. Keep browser-safe public contracts available through the harness
facade. Retire obsolete internal implementations/forwarders, update module purposes
and current documentation, and migrate remaining owner-local tests and helpers.
Manual entry points consume supported shared gate/after-handling contracts; they
must not reach into autonomous private state or duplicate those mechanics.

**Verification:** candidate drift, failed gates, findings and reconciliation,
obligation completion, nonfunctional assessment, final acceptance and interruption
retain their existing outcomes and candidate identities. Exercise real consumers
through managed runs, manual steps, assistance and read-only HTTP projections.
Complete the acceptance matrix below, refresh the full module/API evidence and
write the before/after evaluation with explicit remaining limitations.
Preserve the autonomous final gate's existing full/nested verification behavior;
this is distinct from the default audit selection used to qualify this refactor.

**Dependency:** iteration 5. This assignment owns final integration, including
evidence spanning earlier iterations. If it needs splitting, separate a completed
acceptance outcome from a concrete remaining integration outcome; do not create
one iteration per touched module or defer the unresolved remainder outside the plan.

## Acceptance and qualification

| Required result | Evidence |
| --- | --- |
| Ownership separation | Materialized module tree, purposes and consumer API views show actual owners and supported contracts. Review moved decisions, broad host inputs and all residual source, not just directory names or line-count reduction. |
| Shared session persistence | Persistence/compatibility/lock witnesses and real assisted/autonomous callers use one implementation through the agent contract. |
| Shared task runtime | Managed, manual and standalone callers exercise one implementation; no autonomous scheduler imports in the runtime; preserved tools, prompt delivery and provenance for equivalent inputs. |
| Assisted compatibility | Service/MCP integration preserves identities, retries, original baselines, protection decisions, retained stages and historical records; root startup uses its supported facade. |
| Autonomous composition | Real planning, coordination and acceptance implementations complete representative work and delegated consumer/provider handback with the same obligations and candidate evidence. |
| Durable and recovery behavior | Accepted transitions remain atomic, reopening retains history, interrupted work remains pending, fresh-session reconstruction works and replaced attempts cannot submit or write as current. |
| Consumers and queries | CLI/HTTP/web schemas remain compatible; projections/KPI read supported records; repeated queries leave durable bytes unchanged. |
| Testing integrity | Owner-local tests and helpers move with behavior; configured discovery and exact native registrations still cover their claims; ordinary process guarding and scripted external boundaries remain effective. |
| Evaluation | Original baseline preserved, actual new ownership measured, boundary changes explained and available task observations reported with coverage. Unknown operational benefit is reported honestly. |

Relevant anchors include [session-store tests](../../subs/harness/src/tests/plan23-session-store.test.ts),
[workflow-store tests](../../subs/harness/src/tests/workflow-session-store.test.ts),
[assisted service](../../subs/harness/src/tests/assistance-service.test.ts),
[MCP integration](../../subs/harness/src/tests/assistance-mcp.test.ts),
[shared gate and after-handling](../../subs/harness/src/tests/steps-gate-after.test.ts),
[manual steps](../../subs/harness/src/tests/steps-run.test.ts),
[run recovery](../../subs/harness/src/tests/run-recovery.test.ts),
[composed recovery](../../subs/harness/src/tests/composition-recovery.test.ts),
[capability acceptance](../../subs/harness/src/tests/capability-acceptance.integration.test.ts)
and [HTTP query sources](../../subs/harness/src/tests/http-query-source.test.ts).
These are source-baseline paths; retain traceability when tests move.

Run relevant focused checks, `npm run type-check` and `npm run check:self` for each
implemented candidate. Follow the test contract for process mocks, store adapters,
native witnesses and configured discovery. Do not add documentation-wording tests
or duplicate implementation-only tests to meet a count. Actual tool/kernel claims
require an applicable reviewed boundary registration.

Each iteration ends in a local candidate commit and RA assessment using the
existing assisted start/end workflow. Let RA perform the configured audit in
default mode; do not run a duplicate full audit just to submit an assessment or
force scope narrowing. Retain the iteration ID across repair candidates and the
registered plan's original baseline. A failed/incomplete assessment remains
unresolved until corrected and reassessed.

Because this plan changes the assessment service itself, use a stable qualified
assessor checkout while editing the target checkout. Preserve the single live
harness owner of the target project. Qualify the candidate's own MCP/service
composition through isolated integration witnesses; do not restart the live
assessor on unqualified moving source or rewrite its registered records.

After all outcomes pass their iteration assessments, RA performs a separate
cumulative final-plan assessment against the original baseline. Report the exact
candidate and final gate. An iteration pass does not establish whole-plan
completion. A limitation in an optional performance observation does not excuse
missing implementation or behavior qualification.

## Evaluation and handoff

Preserve the proposal's baseline and mapping unchanged. At execution start,
record any source difference from its baseline and capture a separate execution
baseline. Before each affected boundary changes, retain available comparable task
observations. Do not fabricate defects or perform unrelated feature work solely
to manufacture a benchmark.

For each extraction and the final result, gather Ramify source/resource/document
and API-view sizes, actual consumer/provider dependencies and supported contracts,
test distribution, and affected-selection results with coverage/widening reasons.
Adapt a separate comparison collector to actual module ownership; the historical
collector assumes the original tree and must not be run unchanged to claim a
post-extraction comparison. Keep producer versions, source identities, commands,
units and missing evidence alongside the output. No new runtime telemetry system
is required.

Use existing [session observations](../../docs/metrics/session-observations.md)
and accessible native-agent records to report actual exploration, delivered input,
provider usage, elapsed time, handoffs/repairs and qualification effort where
available. Include coordinator and assessment work. Assisted iteration intervals
are elapsed time, not exclusive active effort; native engineering activity is not
automatically covered by Pi metrics. Compare similar accepted tasks with model,
configuration and coverage differences visible. Keep structural descriptors
separate from operational benefit, and historical move counts separate from new
task-locality observations. Source moves do not enlarge delivered-work credit or
the frozen project search-space denominator.

The original affected probe selected all 16 test modules because coverage was
partial. Recheck actual selection after extraction, retaining that explanation
if it persists. Do not claim an audit saving from smaller modules or use it to
omit required verification. No target file count, cycle count, token saving or
speedup is an acceptance substitute.

Handoff includes the actual owner tree and responsibility map, source/API and
dependency comparisons, iteration/final assessment references, compatibility and
recovery evidence, and an evaluation explaining which boundaries helped or still
require shared knowledge. Place implementation results and comparison artifacts
beside this plan, linking the immutable original baseline. Record justified
grouping changes in execution notes while preserving captured requirements.

Authoring this plan does not register an execution, launch workers to implement
it, run Pi assessment or alter service behavior.
