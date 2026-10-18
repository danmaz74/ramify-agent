# Existing capabilities and their use in agent assistance

**Date:** 2026-10-18. **Status:** source analysis of a proposed experiment;
this document implements no assistance operation and starts no run.
**Source:** `091ca382d8b514bdc6b83f0e98f00f5e395b56f1` plus the inspected working
tree. That tree already contained modified source/tests and numerous modified
or untracked design and analysis files, including the assistance proposals.
The commit alone therefore does not reproduce every document considered here.

Most of the existing harness would **not be invoked by the first assistance
workflow**. Codex Astra and Sol take responsibility for conducting the work;
the useful initial reuse is architectural evidence, project checks and selected
protection primitives. This is a consumption decision, not a proposal to remove
capabilities from the existing harness. Its existing users and recorded runs
continue to need its contracts.

**Subsequent proposal:** [Post-iteration assessment with Pi](review-and-findings.proposal.md)
delegates complete analysis and gating to ramify-agent. The inventory below
describes the earlier minimal experiment; its source assessment remains useful,
but its omission decisions for Pi, reviews, findings and audit orchestration
are superseded. Those facilities are now reuse/adaptation candidates for a
candidate-specific assessment service. Native Codex still owns implementation;
the module write guards and full plan-execution lifecycle remain unused.
Beads is considered only for selected deferred work.

## Scope and interpretation

The reference model is the [assistance principles](approach.principles.md),
[initial analysis](analysis-and-proposal.md) and
[Astra coordination proposal](astra-coordination.proposal.md): ordinary Codex
Astra coordinates Sol subagents implementing a plan; ramify-audit closes each
iteration. Module focus is optional efficiency guidance. It never limits where
Sol can write, requires permission to cross a boundary, or creates a scope
expansion procedure. Ordinary messages handle coordination when useful.
Sealed commitments and applicable principles receive explicit treatment.
Optional hooks check Ramify structural correctness independently of the worker's
focus. Native Codex owns sessions, tools, delegation and continuation.

This inventory groups implemented behavior by responsibility rather than listing
every function. It inspected root composition and CLI, harness source, child
module declarations and implementations, and web consumers. Source links below
are relative to this document. No live implementation, provider check, model
request, audit or tracker operation was performed. In particular, implementation
presence is not a claim that a capability was independently qualified here.

| Disposition | Meaning |
| --- | --- |
| **Reuse unchanged** | Use an existing operation or guidance within its present contract. This can mean invoking the installed provider directly rather than calling a harness adapter. |
| **Adapt** | Reuse selected behavior behind an assistance contract without requiring run, role, invocation or assignment records. This describes work to do, not an already available API. |
| **Not used initially** | The first experiment does not call this mechanism. The replacement responsibility is stated explicitly. Existing harness behavior remains. |
| **Defer optional** | Potentially useful after observed friction, or only when the needed observations are already cheap and trustworthy. It is not a prerequisite. |

## What would not be used

### Conducting plans and assigning responsibility

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Project plan discovery, captured inputs and run creation, readiness, run branch and autonomous phase driver: [plan discovery](../../../subs/harness/src/plans/discover.ts), [readiness](../../../subs/harness/src/run/readiness.ts), [service](../../../subs/harness/src/run/service.ts). | **Not used initially** for the run lifecycle; ordinary plan discovery may be reused later. | Assistance starts from the user's ordinary plan and working checkout. Astra chooses the next action and prepares authorized candidate commits. Project setup and verification still apply; they need no `start-run`, readiness record or harness-created branch. |
| Initial plan architect analysis, capability registry, architectural hypotheses, proposed module placement, accepted analysis and optional analysis review stop: [analysis contracts](../../../subs/harness/src/analysis/records.ts), [acceptance](../../../subs/harness/src/analysis/accept.ts), [architecture submissions](../../../subs/harness/src/architecture/submission.ts). | **Not used initially**. | Astra decomposes the actual outcome using available project facts. No compulsory model-produced registry, hypothesis revisions, placement acceptance or approval stop is needed before engineering begins. |
| Local/module architect outlines, work-item frontier, iteration assignment and completion, inherited responsibilities and integration work items: [work submissions](../../../subs/harness/src/work/submission.ts), [frontier](../../../subs/harness/src/work/frontier.ts), [assignments](../../../subs/harness/src/work/assignment.ts), [integration](../../../subs/harness/src/work/integration.ts). | **Not used initially**. | Astra gives short assignments and chooses coherent iterations. A module boundary does not require an architect or a separate work item. The local reasoning and iteration-sizing guidance can inform the new skill without adopting these records. |
| Fresh capability architect coordination, immutable consumer requests/examples, revisioned capability plans, nested tasks, provider/compatibility assignments, suspended consumer state and verified handback: [records](../../../subs/harness/src/capability/records.ts), [workflow](../../../subs/harness/src/capability/workflow.ts), [delivery](../../../subs/harness/src/capability/delivery.ts). | **Not used initially**. | A Sol can implement understood changes across modules. Astra uses messages or another worker only when that improves the work. Preserve consumer need, examples, compatibility and real integration verification in ordinary assignments/notes; omit task IDs, task stacks and terminal handback protocol. |
| Global placement forks, capability delivery to owners, dependency edges/cycle reconsideration and structural ownership decisions recorded as harness architecture: [architecture acceptance](../../../subs/harness/src/architecture/accept.ts), [architecture context](../../../subs/harness/src/architecture/context.ts), [service](../../../subs/harness/src/run/service.ts). | **Not used initially**. | Astra resolves design uncertainty directly. Ownership and dependency rules remain project contracts, checked by Ramify; architecture decisions do not need a global fork or durable placement request to become reviewable. |
| Contract engineer sessions and agreement establishment/revision: interface artifacts, conformance suites, explicitly designated fakes, provider obligations, consumer requirements, exposure parity and shared-provider scheduling: [contract records](../../../subs/harness/src/contracts/records.ts), [scheduling](../../../subs/harness/src/contracts/schedule.ts), [parity](../../../subs/harness/src/contracts/parity.ts), [verification](../../../subs/harness/src/contracts/verification.ts). | **Not used initially**. | Implement interfaces and meaningful tests when the change needs them; Astra checks provider/consumer integration. The experiment does not require every cross-module discovery to establish a harness contract, fake, conformance inventory and obligation record. Existing project requirements for these artifacts still apply. |
| Registered scenario/test/capability obligations, engineer binding with fake dependencies and architect `pending`/`bound`/`done` reports: [obligations](../../../subs/harness/src/work/obligations.ts). | **Not used initially**. | Astra assesses the plan's acceptance against the candidate and evidence. No second acceptance registry is required. Passing checks remain evidence, and a worker's completion message alone does not establish the outcome. |
| Formal plan deviation and environment-problem records, findings, user decision waits, scenario rewording and merge-readiness implications: [deviations](../../../subs/harness/src/deviations/records.ts), [current user decision](../../../subs/harness/src/deviations/readiness-decision.ts), [readiness projection](../../../subs/harness/src/run/merge-readiness.ts). | **Not used initially** as a protocol. | Astra handles ordinary problems and records material decisions in the plan. Explicit user constraints and commitment authority remain binding. A real change to a user-controlled requirement still needs the governing decision; it does not require a run-owned CheckFinding or browser command. |

### Execution equipment, scope and communications

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Frozen write scopes with module base, selected child subtrees, narrow extra files, breaking assignments, captured ownership and scope revisions: [assignment](../../../subs/harness/src/work/assignment.ts), [scope](../../../subs/harness/src/work/scope.ts), [ownership authority](../../../subs/harness/src/work/ownership-authority.ts). | **Not used initially**, including the policy itself. | Sol's focus module is advice about understanding. It can edit other modules without asking Astra or changing an assignment. Structural rules and sealed commitments remain independent obligations. Broadening work does not require a special breaking-scope form. |
| Pre-mutation path/ownership guards, logical/physical target checks, denied/guarded paths, recorded repair authority when live ownership is unavailable, post-execution outside-scope assessments: [write guard](../../../subs/harness/src/guard/write-guard.ts), [equipment](../../../subs/harness/src/work/engineer-equipment.ts). | **Not used initially** as module write enforcement. | Do not wrap native tools in a module guard or reinterpret outside-focus edits as violations. The proposed protection comparison detects sealed changes at candidate time. Native/project safety rules retain their own authority. |
| Harness-controlled shell parsing, tool declarations, focused test commands, invocation mutation ordering and single-writer admission/drainage: [shell](../../../subs/harness/src/tools/shell.ts), [focused scenarios](../../../subs/harness/src/work/focused-scenarios.ts), [mutation order](../../../subs/harness/src/hooks/mutation-order.ts), [writer](../../../subs/harness/src/run/writer.ts). | **Not used initially** as worker equipment. | Sol uses native Codex tools and project commands. Astra coordinates shared-file writers through ordinary assignments/messages or separate worktrees when useful. Assistance does not need another shell language, lease service or tool executor. Provider-owned command safety remains with the provider. |
| Designated terminal submission tools, schema/semantic validation, rejected-submission retries and accepted-result handling for each role: [submission validation](../../../subs/harness/src/run/submissions.ts), [step runner](../../../subs/harness/src/steps/runner.ts), [agent contract](../../../subs/harness/subs/agent/src/interfaces/port.ts). | **Not used initially**. | Ordinary agent messages return changes, checks and outstanding work. Astra can continue a worker or reassign unfinished work. A consultation or stopped subagent turn is not an iteration boundary. |
| Advisory architect consultations with exact-point forks, nested investigations, recorded caller/result positions, bound targets and replay-aware outcomes: [consultation tools](../../../subs/harness/src/consultations/tools.ts), [storage](../../../subs/harness/src/consultations/store.ts), [CLI reader](../../../subs/harness/src/consultations/command.ts). | **Not used initially**. | Ordinary Sol-to-Astra messages provide design help. Preserve useful decisions in existing notes; do not require a consultation ID, pinned fork or partial terminal return. The current code already supports an awaited advisory tool, so it would be inaccurate to describe all existing consultation as necessarily terminal handback. |
| Pi role-aware subagent tool: concurrent synchronous batches, shared parent scope/equipment, independent native contexts, `report_subagent`, child persistence and parent usage attribution: [Pi delegation](../../../subs/harness/subs/agent/subs/pi/src/subagents.ts), [adapter description](../../../subs/harness/subs/agent/subs/pi/README.md#experimental-subagents). | **Not used initially**. | Native Codex delegation supplies Astra/Sol workers and ordinary messages. Reusing this Pi-specific batch tool would introduce another execution owner and preserve the parent assignment guard the proposal deliberately omits. |
| Manual standalone module sessions and step-by-step role execution, including authored no-run engineer inputs, rendering, gate and after-handling: [single sessions](../../../subs/harness/src/sessions/single.ts), [step authoring](../../../subs/harness/src/steps/authoring.ts), [commands](../../../subs/harness/src/steps/command.ts), [after handling](../../../subs/harness/src/steps/after.ts). | **Not used initially**. | These are real implemented alternatives to the full autonomous loop, but still execute harness roles and contracts. No-run authoring is not yet a plain context helper: it still validates work items, assignments and policy. Native work plus narrow assistance operations replaces them for this experiment. |

### Reviews, verification and completion machinery

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Mandatory checkpoint taxonomy and automatic candidate capture/commit, gate attempts, checkpoint repair decisions, readiness audit, work-item gate and final full/nested qualification: [checkpoint policy](../../../subs/harness/src/checks/checkpoint.ts), [committing gate](../../../subs/harness/src/run/committing-gate.ts), [gate rules](../../../subs/harness/src/checks/gate.ts). | **Not used initially** as a harness lifecycle; **reuse unchanged** the project's audit CLI. | Astra prepares an authorized clean candidate and runs the project's ramify-audit at each coherent iteration boundary, repairs failures and audits the new candidate. Use default provider selection; retain any explicit final verification obligation. No synthetic run/attempt/checkpoint identity is needed. |
| Harness audit adapter ownership recording, attempt identity, workspace receipts, progress mapping and audit process coordination: [audit implementation](../../../subs/harness/subs/audit/src/check-execution.ts), [workspace records](../../../subs/harness/src/run/audit-workspaces.ts), [test lock](../../../subs/harness/subs/audit/src/test-lock.ts). | **Not used initially**; **adapt** only if later operations need provider evidence. | Direct provider invocation already supplies candidate-bound configured results, reuse and partial/full selection. Do not import harness workspace/attempt machinery simply to run the CLI. An assistance adapter must preserve verdict and provenance rather than recreate the audit runner. |
| Standalone in-place diagnosis (setup, type check and full Ramify check), diagnostics attributed to assignment scope and resulting repair-owner decisions: [execution](../../../subs/harness/src/checks/execution.ts), [diagnosis policy](../../../subs/harness/src/checks/checkpoint.ts), [diagnostics](../../../subs/harness/src/checks/diagnostics.ts). | **Not used initially** as a fixed protocol; **defer optional** check convenience. | Sol runs appropriate project checks and fixes failures wherever needed. Optional helpers can explain provider results. In-place diagnosis is not committed audit evidence and cannot replace the iteration audit. Failure location does not impose a module permission boundary. |
| Background code, scope and design review scheduling, concurrency/queues, immutable review snapshots and patch delivery, captured design guidance, current-attempt inspection evidence and review submission validators: [review preparation](../../../subs/harness/subs/reviews/src/preparation.ts), [snapshots](../../../subs/harness/subs/reviews/src/snapshot.ts), [validators](../../../subs/harness/subs/reviews/src/submission.ts), [scheduler](../../../subs/harness/src/reviews/scheduler.ts). | **Not used initially** as automatic rounds; **defer optional** evidence preparation. | Astra reviews behavior, the actual diff and applicable principles, and may delegate review when useful. This does not discard semantic review. Fixed snapshot/diff helpers could help later; present validators also encode a review workflow and should not become compulsory for native agents. |
| Durable CheckFinding identity, replay, risk/credibility, same-issue relations, factual witness matching, waivers/revocation and current-revision user decisions: [pure finding rules](../../../subs/harness/subs/check-findings/src/decide.ts), [identity](../../../subs/harness/subs/check-findings/src/identity.ts), [harness binding](../../../subs/harness/src/check-findings/report.ts), [user commands](../../../subs/harness/src/check-findings/user-commands.ts). | **Not used initially** as a lifecycle; **defer optional** pure reconciliation. | Initial protection differences, unresolved failures and decisions fit ordinary plan notes and provider evidence. Repeated findings may justify reuse later, with a real authority/evidence contract. Do not require findings merely to compare baseline bytes or let a waiver bypass a required audit. |
| Work-item reconciliation, bounded correction rounds, review settlement and completion refusal: [reconciliation](../../../subs/harness/src/reviews/reconciliation.ts), [review state](../../../subs/harness/src/reviews/state.ts), [run review finish](../../../subs/harness/src/run/review-finish.ts). | **Not used initially**. | Astra decides whether intended behavior, required evidence and unresolved concerns permit completion. Native continuation replaces another reconciliation role and accepted structured settlement. |
| Plan-wide nonfunctional coordinator, coverage validation, candidate-bound assessment/comparison, investigations, repair assignments, exhaustion and final correction: [pure rounds](../../../subs/harness/subs/nonfunctional/src/rounds.ts), [assessment contracts](../../../subs/harness/subs/nonfunctional/src/interfaces/contracts.ts), [phase](../../../subs/harness/src/run/nonfunctional-phase.ts), [final correction](../../../subs/harness/src/run/final-correction.ts). | **Not used initially** as a separate phase. | Relevant nonfunctional requirements and principles enter assignments and Astra's review throughout the work. Targeted investigation remains possible without a coordinator session, NFR round record or automatic exhaustion rule. |
| Automatic invalid-project preparation repair: prior contingent root delegation, captured repair scope and before/after identities, protected declarations, verified handback, incident history and export: [repair preparation](../../../subs/harness/src/run/repair-preparation.ts), [repair gate](../../../subs/harness/src/run/repair-gate.ts), [service composition](../../../subs/harness/src/run/service.ts), [export](../../../subs/harness/src/run/repair-export.ts). | **Not used initially** as a recovery subsystem. | A structural diagnostic goes to the ordinary worker/coordinator, who can repair coherent intermediate invalidity without a new root repair authority. No failed architect preparation needs recovery because assistance does not require that preparation lifecycle. Useful identity/comparison logic is an adaptation candidate for protection, not a reason to adopt incident machinery. |
| Merge-readiness projection combining final evidence, accepted/rejected deviations, follow-up requirements and candidate status: [merge-readiness owner](../../../subs/harness/src/run/merge-readiness.ts), [projection](../../../subs/harness/subs/projections/src/merge-readiness.ts). | **Not used initially**. | Astra reports outcome, candidate, audit reference and material unresolved work. User/repository merge authorization remains separate. The assistance experiment neither merges nor derives delivery authority from an audit pass. |

### Context preparation and acceptance artifacts

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Captured plan/linked document/principle manifest, model extraction into an element catalog, catalog fidelity checks and accepted analysis evidence: [discovery](../../../subs/harness/subs/plan-evidence/src/discovery.ts), [catalog contracts](../../../subs/harness/subs/plan-evidence/src/interfaces/catalog.ts), [extraction](../../../subs/harness/src/analysis/extraction.ts), [evidence acceptance](../../../subs/harness/src/analysis/evidence.ts). | **Not used initially** as compulsory extraction; **adapt** discovery and document identity. | Astra reads the plan and applicable principles directly with status, scope and provenance. A small protection facility may reuse byte identities and discovery without building a full requirement catalog or making model calls. |
| Work orientation, model-selected nonfunctional context elements, accepted selection/reselection and packages bound to work items: [context contracts](../../../subs/harness/src/context-selection/contracts.ts), [delivery](../../../subs/harness/src/context-selection/delivery.ts), [recorded orientation](../../../subs/harness/src/context-selection/recorded.ts). | **Not used initially**. | Short assignments provide starting context, and Sol can inspect further whenever needed. Optional module-context assembly can follow observed repetition. No selector fork or durable accepted selection is required. |
| Role-specific system/procedure prompts; common passage composition; task-declared named blocks; starting-point groups; exact briefing/environment replacement and delivered manifests: [prompt blocks](../../../subs/harness/src/prompts/blocks.ts), [tasks](../../../subs/harness/src/prompts/tasks.ts), [briefs](../../../subs/harness/src/run/task-brief.ts), [delivery manifests](../../../subs/harness/src/prompts/delivered-manifest.ts). | **Not used initially** as the delivery protocol; **adapt** concise useful guidance. | Two proposed skills and ordinary native assignments carry the reasoning. Do not import complete architect/engineer prompt packages, inherited-block accounting or submission instructions. Starting points and coverage limits remain useful content. |
| Gherkin extraction/form validation, initial scenario approval/freeze, deterministic feature rendering/tags, tracked feature protection, scenario obligation state and result extraction from audit Cucumber output: [scenario owner](../../../subs/harness/subs/scenarios/README.md), [feature materialization](../../../subs/harness/src/run/feature-files.ts), [result reader](../../../subs/harness/src/checks/scenario-results.ts). | **Not used initially** as an assistance entry requirement; **defer optional** parsers/report readers. | Existing project tests, including Cucumber when configured, still run through the project's audit. The plan need not acquire harness scenario IDs, generated feature files, state transitions or a scenario-review stop to use assistance. |
| Managed scratch directories, scratch setup/commits, generated scenario producer commits and special setup attribution: [scratch policy](../../../subs/harness/src/work/scratch.ts), [service](../../../subs/harness/src/run/service.ts), [setup attribution](../../../subs/harness/subs/kpi/src/setup-attribution.ts). | **Not used initially** as an execution policy. | Use the target project's ordinary scratch/test conventions and candidate preparation. Retain any existing project exclusions. Assistance does not need producer commits or harness setup classifications to begin implementation. |

### State, native sessions and recovery

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Harness-owned durable job log, atomic record materialization, torn-tail handling, effect intent/completion/replay, command IDs/expected revisions and serialized writes: [ledger](../../../subs/harness/subs/ledger/src/ledger.ts), [effects](../../../subs/harness/subs/ledger/src/effects.ts), [job commits](../../../subs/harness/src/jobs/commit.ts), [command admission](../../../subs/harness/src/jobs/commands.ts). | **Not used initially** as a run/effect ledger; **adapt** only needed file primitives. | Ordinary plan notes, source files, audit evidence and a small retained protection artifact provide continuity. Baseline capture is a real durable write and needs reliable ownership/storage, but not an execution log of the native conversation or every tool effect. |
| Exclusive project lock, process-identity stale-owner recovery and isolated `.harness` record directories: [lock](../../../subs/harness/src/store/lock.ts), [state layout](../../../subs/harness/src/store/state-directory.ts). | **Not used initially** as a long-lived execution lock. | Assistance operations need appropriate local write consistency for their own artifact. Native agents do not acquire a harness lifetime lock or put their ordinary task progress into harness job directories. |
| Neutral AgentPort and durable create/continue/exact-point fork/context append/tool change/terminal retry/stop/inspect operations; authority rebinding and immutable payload store: [agent contract](../../../subs/harness/subs/agent/src/interfaces/session-operations.ts), [operation engine](../../../subs/harness/subs/agent/src/session-operations.ts), [harness store](../../../subs/harness/src/run/session-store.ts). | **Not used initially**. | Native Codex owns conversation history, worker sessions, current tools and continuation. Assistance should accept project/subject facts without an agent session reference. |
| Pi SDK execution, model/login selection, native serialization and final-request artifacts, provider session/cache identity, liveness fences, tool-effect replay, settlement and automatic compaction/context notices: [Pi owner](../../../subs/harness/subs/agent/subs/pi/README.md), [implementation files](../../../subs/harness/subs/agent/subs/pi/module.ramify), [current pin](../../../package.json). | **Not used initially**. | Codex supplies the execution environment. There is no Pi login, second provider transport or custom compaction owner in the proposed workflow. Current source pins Pi `1.3.0`; older documentation and historical transport evidence must not be read as the current pin. |
| Harness sessions/lineage, transcript recorder, chapters/points/appends, content-addressed large bodies, live output and native-request inspection: [sessions](../../../subs/harness/src/run/sessions.ts), [transcript recorder](../../../subs/harness/src/transcripts/recorder.ts), [transcript storage](../../../subs/harness/src/transcripts/store.ts). | **Not used initially**. | Native history plus short durable plan notes preserve useful continuation. Do not fabricate harness invocations to display native conversations. Assistance evidence may cite its own operation/source without copying all conversation history. |
| Quiet-progress/resource continuity, compaction architect review, recoverable invocation reconstruction, same-run recovery admission and external-repair declarations: [policy](../../../subs/harness/src/run/policy.ts), [compaction review](../../../subs/harness/src/run/compaction-review.ts), [recovery identity](../../../subs/harness/src/run/recovery-admission.ts), [recovery runtime](../../../subs/harness/src/run/recovery-runtime.ts). | **Not used initially**. | Astra continues native workers or assigns unfinished work using current files and relevant decisions. Independent helpers have no pending architect invocation or native Pi point to reconstruct. |
| Terminal-run successor restart: authenticated import of retained records/effects, preserved obligations, blocked unsupported boundaries, policy transitions and branch/recovery handling: [restart import](../../../subs/harness/src/run/restart-import.ts), [restart runtime](../../../subs/harness/src/run/restart-runtime.ts). | **Not used initially**. | Restart ordinary work from source, plan progress, decisions, baseline and applicable verification. Assistance does not import a failed harness execution into a successor run. |
| Breakpoint selectors, pausing/drainage, debugger message exchanges, revision-aware resume and debug CLI/UI: [protocol](../../../subs/harness/src/interfaces/protocol/runs.ts), [CLI](../../../src/cli.ts), [debugger UI](../../../subs/web/src/debugger.tsx). | **Not used initially**. | Ordinary agent steering is sufficient, and repository instructions forbid adding breakpoints unless requested. This is an implemented operator facility, not an assistance prerequisite. |

### Measurements, presentation and administration

| Implemented capability and source | Disposition | Why it is not used; replacement in the proposal |
| --- | --- | --- |
| Per-invocation source/line snapshots, scope accounting, surviving delivered-line attribution, setup exclusions and baseline-weighted modularity/token efficiency: [capture](../../../subs/harness/subs/kpi/src/capture.ts), [line events](../../../subs/harness/subs/kpi/src/lines.ts), [delivered change](../../../subs/harness/subs/kpi/src/delivered.ts), [metrics](../../../subs/harness/subs/kpi/src/metrics.ts). | **Not used initially** as comprehensive instrumentation; **defer optional** compatible calculations. | The first trial records completed behavior, elapsed effort, waiting/reorientation, corrections, audit time and human interventions proportionately. Do not manufacture scope snapshots or invocation attribution to populate old KPI formulas. |
| Native usage/cost/timing, exploration/read/search counts, cache/context observations, session lineage/reuse and guard-denial/outside-scope reports: [timing/charge](../../../subs/harness/subs/kpi/src/efficiency.ts), [exploration](../../../subs/harness/subs/kpi/src/exploration.ts), [lineage](../../../subs/harness/subs/kpi/src/lineage.ts), [guard report](../../../subs/harness/subs/kpi/src/guarding.ts), [observations](../../../subs/harness/src/run/observations.ts). | **Defer optional** transferable measurements; **not used initially** for guard-performance metrics. | Use native observations only when available and comparable. Outside-focus edits are optional cheap observations, never guarding failures. Concurrent shared-worktree diffs do not establish individual authorship; retain unknown attribution. |
| Recorded-fact projections of plans/runs, analysis/catalog, work, capabilities, scenarios, decisions, findings, repairs, merge readiness, metrics, sessions and events: [projection owner](../../../subs/harness/subs/projections/README.md), [queries](../../../subs/harness/subs/projections/src/queries.ts). | **Not used initially** for new assisted work. | These derive from harness records the new workflow deliberately does not create. Existing harness queries continue to serve existing runs. A future assistance report should project actual assistance/native observations, not fake run data. |
| Versioned HTTP JSON queries/commands, validation, idempotent receipts, polling/event cursors, bounded result pages and static web serving: [HTTP app](../../../subs/harness/src/http/app.ts), [paths](../../../subs/harness/src/interfaces/protocol/paths.ts), [root composition](../../../src/main.ts). | **Not used initially**. | Start with small CLI operations. MCP can later call those same domain operations. Starting the server or translating assistance into run commands is unnecessary. |
| Browser plans/run controls, catalog/scenario approval, capability graphs and initial/current module comparison, execution/module maps, current activity, gate evidence, findings/decision forms, repair/recovery/restart/debug controls and live transcript/timeline windows: [web client](../../../subs/web/src/client.ts), [run page](../../../subs/web/src/run-page.tsx), [execution map](../../../subs/web/src/execution-map.tsx), [session timeline](../../../subs/web/src/session-timeline.tsx), [transcript workspace](../../../subs/web/src/transcript-workspace.tsx). | **Not used initially**. | Codex and ordinary plan progress provide the working interface. These views remain useful for harness-run inspection. Reusing a Ramify visualization later would not justify importing the complete run protocol. |
| Existing CLI families: `serve`, `session`, `step inputs/render/run/gate/after`, `consultations`, `debug`, `recovery`, `restart`, and repair export: [parser/help](../../../src/cli.ts), [dispatch](../../../src/main.ts). | **Not used initially** for the assisted execution. | New constraint capture/compare operations should be a narrow additional public surface, not wrappers around role execution or RunService. Their names and schemas remain proposed. The existing CLI is retained for its current consumers. |
| Optional target-project Beads start/finish administration using detached inherited Pi forks, explicit captured workspace/executable, existing-issue relevance/bindings, independent closure evidence and pending delivery: [administrative sessions](../../../subs/harness/src/run/beads-sessions.ts), [tracker tools](../../../subs/harness/src/run/beads-tools.ts), [storage](../../../subs/harness/src/run/beads-storage.ts). | **Not used initially**; **defer optional** separate administration. | The host can perform explicitly authorized tracker administration using the target's established workflow. Tracker status neither governs acceptance nor supplies plan progress. Assistance does not need inherited Pi context or start/finish forks to use protection checks. |
| Automatic repair incident Beads export with retained incident evidence, explicit destination and export retry/receipt handling: [repair export](../../../subs/harness/src/run/repair-export.ts), [command](../../../subs/harness/src/run/repair-export-command.ts). | **Not used initially**. | No harness automatic-repair incident is produced. A concrete deferred harness issue can still use the repository's existing Beads skill when actually requested/needed; that is separate from implementing a target plan. |

## Deliberate initial tradeoffs

Native Codex supplies execution and communication, not the harness's assurance
or observability records. Omitting those mechanisms has concrete consequences:

| Initially absent | Consequence and retained obligation |
| --- | --- |
| Formal scenario/obligation traceability and accepted architect reports. | There is no mechanically complete map from plan scenarios to accepted work and audit observations. Astra must check the actual acceptance requirements and retain sufficient evidence in ordinary plan progress. Existing project test requirements remain. |
| Automatically requested code/scope/design reviews, inspection-coverage validation, finding reconciliation and plan-wide NFR coverage. | Review coverage is whatever Astra actually performs or delegates; it cannot be described as the old harness's complete coverage. Applicable principles and behavioral/nonfunctional acceptance still require substantive assessment. |
| Tool-by-tool module scope prevention and recorded write authority. | Cross-module writes are permitted by design. Ramify still verifies structural correctness, and protected commitments receive their separate baseline comparison and authority assessment. A focus module is neither a permission nor a denial. |
| Detailed per-invocation attribution, delivered-change weighting, cache/lineage KPIs and complete mutation observations. | Some efficiency questions cannot be answered or compared directly with old runs. Record inexpensive reliable evidence and disclose unknowns; do not reconstruct unsupported quantities from shared diffs. |
| Harness dashboard, live transcript windows, execution maps and revision-aware operator controls. | Progress and faults are visible through ordinary Codex, plan notes and provider records. They do not acquire equivalent structured visual observability automatically. Add a view only if real use establishes its value. |
| Harness operation/effect replay and authenticated restart imports. | Continuation relies on native sessions and durable task facts rather than exact reproduction of the harness execution. The baseline, accepted exceptions, source work and candidate evidence must survive ordinary session changes. |

The experiment tests whether these omissions reduce effort while preserving the
required outcome. They are not evidence of equivalent coverage or a measured
speed improvement. If the target project explicitly requires any omitted
review, artifact or acceptance procedure, that requirement still applies.

## What remains useful, and what must be built

The exclusions above leave a small useful foundation. They do not mean that
architecture, semantic review, meaningful tests, provider checks or explicit
authority decisions disappear.

| Existing behavior | Disposition for assistance | Adaptation boundary or retained responsibility |
| --- | --- | --- |
| Ramify ownership queries, architect/module trees, ordinary/testing API views, symbol/exposure facts, measurements and explicit coverage limits: [evidence exposures](../../../subs/harness/subs/evidence/module.ramify), [view reader](../../../subs/harness/subs/evidence/src/views.ts), [ownership evidence](../../../subs/harness/subs/evidence/src/ownership-evidence.ts), [CLI adapter](../../../subs/harness/subs/evidence/src/ramify-cli.ts). | **Reuse unchanged** through installed CLI/generated files initially; **adapt** optional context assembly. | Assistance accepts project and requested subject, returns facts/source identities/limits, and allows further inspection. Generated views remain provider outputs and are never imported as source or manually edited. A stale/unavailable view is a disclosed limitation. |
| Installed ramify-audit configured checks and candidate evidence; current harness integration demonstrates use of default selection/reuse and separate final full/nested requests: [checkpoint policy](../../../subs/harness/src/checks/checkpoint.ts), [adapter](../../../subs/harness/subs/audit/src/check-execution.ts). | **Reuse unchanged** the installed provider CLI at every iteration boundary. | Astra prepares the clean authorized commit and records its audit reference. The provider determines selection, baseline and reuse. Keep broader project obligations. No new audit runner or inference that a green audit proves principle/seal compliance. |
| Ramify post-mutation structural check feedback and per-path `checked`/`not-analyzed`/`not-checked` distinctions: [post-write hook](../../../subs/harness/src/hooks/post-write.ts). | **Defer optional** native hooks; **adapt** result handling if justified. | Separate provider checking from assignment guards and mutation/session infrastructure. Check all touched modules. Temporary violations are repairable diagnostics; timeouts and absent coverage are gaps. Native hook installation/coverage has not been qualified by this analysis. |
| Exact document bytes, hashes/excerpts, local plan companions and principle discovery: [discovery](../../../subs/harness/subs/plan-evidence/src/discovery.ts), [document contracts](../../../subs/harness/subs/plan-evidence/src/interfaces/contracts.ts), [packages](../../../subs/harness/subs/plan-evidence/src/interfaces/catalog.ts). | **Adapt** selected facts for protection and principle context. | Retain document status, scope and provenance; a filename is not evidence of human adoption. Do not require catalog extraction or a model call. Specifications reached through plan links are captured today, but general specification discovery is incomplete. |
| Guarded-file hashing including absent files: [hash primitive](../../../subs/harness/subs/evidence/src/guarded-files.ts); repair file identities include file mode and symlink identity: [repair identities](../../../subs/harness/src/run/repair-preparation.ts). | **Adapt** for the first capture/compare facility. | These are primitives, not a complete seal system. Implement retained selection/baseline, candidate comparison including additions/deletions/renames and policy changes, exact accepted exceptions and unavailable-inspection results. A candidate's audit does not perform this comparison unless actually configured to do so. |
| Pure issue identity, snapshot evidence preparation, scenario parsing and useful metric calculations. | **Defer optional**, with the concrete source owners identified above. | Reuse only when a real task supplies the required observations and authority. Preserve one rule implementation and avoid inventing harness records. |
| Module architectural reasoning and iteration-sizing guidance: [module architect guidance](../../../skills/module-architect/SKILL.md), [iteration guidance](../../prompt-optimization-module-architect.principles.md). | **Adapt** into concise coordinator/worker skills. | Preserve consumer needs, module interfaces, principles and real integration. Remove module write-scope enforcement and prescribed role/submission sequences. Specialization is justified by expected benefit and reconsidered from discoveries. |

The initial proposal therefore requires **new assistance contracts**: short
Astra/Sol skills and harness-owned constraint capture/compare entry points.
The current root exposes harness-owned contracts and the web consumes those
contracts through the root; [root declarations](../../../module.ramify) and
[harness declarations](../../../subs/harness/module.ramify) define that boundary.
External CLI/MCP clients must not import an evidence child's internals. Keep
the existing ownership of durable writes when adding the baseline artifact;
do not create a sibling state writer incidentally. An eventual MCP adapter
should translate the same operations and results, without separate rules,
sessions, model calls or orchestration.

## Implementation status cautions

1. **General sealing is not an implemented capability being discarded.** The
   current [harness specification](../../harness.spec.md#principles-and-specifications-are-captured-and-sealed)
   explicitly says general specification discovery and sealing remain
   implementation work. Existing guards protect configured manifests,
   declarations/contracts and tracked scenario artifacts under harness policy;
   that is distinct from the proposal's retained principle/spec baseline.
2. **Aspirational/historical documents are not a feature list.** Implementation
   files establish the roles, reviews, findings, contract/capability workflows,
   manual commands, Pi delegation, recovery and restart described above even
   where old plan indexes still say proposed/unstarted. Conversely the new
   coordinate/module-work skills, assistance CLI/MCP catalog and general seal
   comparison are proposals, not available products.
3. **Old resource limits are not all active.** Current
   [run-policy/8](../../../subs/harness/src/run/policy.ts) and the
   [Pi contract](../../../subs/harness/subs/agent/subs/pi/README.md) retain
   historical budget/count/absolute-duration fields for reading old evidence.
   They no longer establish engineer lifetime or resource-return ceilings for
   current continuity. Pi already uses native automatic compaction. Assistance
   omits the current continuity machinery; it is not merely disabling an old
   fixed context budget.
4. **Changing an engineering backend is a separate proposal.** The
   [earlier Codex/Claude engineering design](../../analysis/2026-10-16-codex-claude-engineering.proposal.md)
   keeps harness architect sessions, assignments and acceptance. It must not
   be counted as an already implemented native-Codex backend or confused with
   this host-owned assistance workflow.
5. **Qualification facilities are retained development assets.** The scripted
   agent, scripted external-command seams, automatic process guard, registered
   native boundaries, browser acceptance, real-session and trial scripts
   support development/verification: [scripted agent](../../../subs/harness/subs/agent/src/scripted.ts),
   [testing specification](../../testing.spec.md),
   [test boundaries](../../../src/tests/test-boundaries.json),
   [scripts](../../../package.json). They are not runtime features to delete.
   New assistance behavior should retain appropriate testing boundaries;
   existing harness suites continue to protect the coexistence contract.

## Coverage and remaining uncertainty

Coverage includes every current child owner under the harness—agent/Pi, audit,
check-findings, evidence, KPI, ledger, nonfunctional, plan-evidence, projections,
reviews and scenarios—plus the harness's unextracted workflow owners, root
CLI/composition and web module. Module declarations were used to distinguish
public contracts from private implementations. This is a grouped capability
inventory, not an exhaustive endpoint/export catalog or a dead-code analysis.

No live trial established effectiveness, elapsed-time savings, native Codex
hook coverage, cost/usage availability, or worker-attribution quality. The
inventory does not assert interoperability between existing Pi records and
native Codex history. Cheap outside-focus change measurement may be absent
entirely without blocking the experiment. Existing implementation tests were
not rerun for this documentation-only analysis, and retained historical run
metrics were not remeasured.

The main adaptation uncertainty is contract coupling: current context,
review, audit and metric entry points often require harness identities even
when useful internal logic is reusable. Implementation should prove a narrow
project/subject operation can run without RunService, Pi, HTTP, accepted
assignments or a native-session store. Preserve provider provenance and exact
protection evidence while leaving semantic decisions with Astra and the
governing authority.
