# Implemented responsibility map

Source baseline: `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`. This maps the
proposal's 77-file remainder, 16-file execution seed and 25-file facade allocation
to implemented responsibilities. Original paths identify that immutable baseline;
current paths identify defining source, with the mixed-file splits below.
The proposal and its original collector/baseline are unchanged.

```
harness: public protocol/HTTP composition and named shared mechanisms
├── assistance: assisted job, assessment and MCP lifecycle
├── autonomous: admission, recovery, ordering and accepted transitions
│   ├── planning: captured intake/extraction and accepted initial analysis
│   ├── work-coordination: frontier, placement, turns, contracts, capability stack
│   └── acceptance: candidate/gate/review/reconciliation/completion decisions
├── task-workflow: authored/manual/standalone task recipes and entry points
├── task-execution: one prepared invocation's mechanical execution/settlement
├── session-store: the one durable session implementation
└── existing provider children: their original evidence/audit/review/rule/storage roles
```

## Decision boundaries and mixed files

`run/service.ts` is lifecycle composition, not an alternative planning/work loop.
Planning owns the intake/extraction sequence and complete accepted-analysis bundle.
Work coordination owns actual scheduling, assignment/engineer turns, contingent
repair policy, failure interpretation, compaction decisions and depth-first
capability/consumer return. Acceptance owns actual qualification, readiness,
scenario staging, gates, review queue/orientations, reconciliation, obligation
satisfaction, nonfunctional assessment and completion eligibility. The service
adapts their named ports, admits tasks and serializes accepted event/record writes.
It retains lifecycle restart/stop/approval/debug admission, writer/reader recovery,
current project authority and quiescent shutdown. Its task-brief adapter assembles
captured provenance and owner-supplied inputs; task selection/prose and the shared
framing algorithm have their own defining owners.

`steps/runner.ts` split: [shared execution](../../subs/harness/subs/task-execution/src/execution.ts)
owns invocation/session binding, recording, tool/submission binding and settlement;
[the workflow runner](../../subs/harness/subs/task-workflow/src/steps/runner.ts)
prepares authored inputs and invocation/session records over a bound
`RunnerContext`. Managed lifecycle and manual lifecycle supply detached
observations, serialized admission/publication, live registration and writer
settlement operations. Their logs, mutexes, live maps and writer objects remain
private; no complete managed or manual run enters the runner. Managed, manual and
standalone callers use that same runtime. `prompts/tasks.ts` keeps
role/task recipe selection and prose in task-workflow; prepared framing, block
and manifest mechanics are in task-execution. `run/session-operations.ts` puts
mechanical session operations there while the harness's prompt session adapter
adds workflow content. The runtime imports no autonomous scheduler/service.

`run/records.ts` split: lifecycle owns captured managed identity/policy, recovery,
layout and the compatibility schema registry. Gate/readiness/review policy schemas
belong to acceptance; context delivery belongs to task-execution; manual identity
to task-workflow; metric/line records to KPI; project configuration and prompt
manifests to named harness support. The registry imports these defining schemas;
its universal filesystem layout/reader is compatibility composition, not a second
domain selector. Owner selectors compose over one immutable replay. Shared
invocation/outcome/session/usage schemas remain task-execution-owned. Public
`interfaces/protocol/*` stay unchanged browser-safe wire contracts, with no Node
service imports.

`CommittingGates` and `AfterHandling` bind captured identity, detached observations,
accepted-publication and named-effect ports per caller. No GateRun, RunLog, mutex
or live map crosses into their decisions. Manual workflows use their own supported
adapter and explicit refusals, never autonomous private state. A publication
decides against current authority under lifecycle serialization. A finding effect
retains the authorized carrier as an opaque lifecycle publication; reconciliation
keeps its original durable intent/brief completion protocol. Correction close
still commits the iteration and finding transitions on one ledger line.

Capability return keeps its exact gate record, audited/current tree, accepted
review/finding basis and reconciliation identity through interruption. Lifecycle
serializes the append while acceptance revalidates that retained proof; coordination
validates the same task/stack/record bodies. Historical absent-basis events remain
readable. Final autonomous verification still requests full nested audit, separately
from the refactor's configured default audit. Reviews retain unlimited elapsed
lifetime; explicit stop/shutdown, genuine failures and settlement remain effective.

Parent mechanisms are explicit: job identity/records, command replay/version
admission, lock acquisition/release, audit-workspace lifetime, configuration,
contained-path/write guards, hook ordering, shell effect/test inspection,
administrative Beads forks and qualification entry points. These support multiple
workflows without deciding their planning/frontier/completion policies. Project
locks release only after the lifecycle's quiescent close. Read-only projections
and KPI consume supported immutable records; no query receives writable lifecycle
or acceptance state.

## Baseline file coverage

Each original allocated file appears once below. The current primary file is a
navigation anchor; the split descriptions above identify decisions moved out of
mixed files. This is an ownership/accountability map, not a prediction of developer
productivity or a claim that module dependencies form an acyclic graph.

### Autonomous remainder (77)

| Original relative to harness/src | Current defining source | Responsibility |
| --- | --- | --- |
| `consultations/command.ts` | [subs/autonomous/subs/work-coordination/src/consultations/command.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/command.ts) | Work/placement/contract/repair/consultation policy or facts |
| `consultations/records.ts` | [subs/autonomous/subs/work-coordination/src/consultations/records.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/records.ts) | Work/placement/contract/repair/consultation policy or facts |
| `consultations/store.ts` | [subs/autonomous/subs/work-coordination/src/consultations/store.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/store.ts) | Work/placement/contract/repair/consultation policy or facts |
| `consultations/submissions.ts` | [subs/autonomous/subs/work-coordination/src/consultations/submissions.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/submissions.ts) | Work/placement/contract/repair/consultation policy or facts |
| `consultations/targets.ts` | [subs/autonomous/subs/work-coordination/src/consultations/targets.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/targets.ts) | Work/placement/contract/repair/consultation policy or facts |
| `consultations/tools.ts` | [subs/autonomous/subs/work-coordination/src/consultations/tools.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/consultations/tools.ts) | Work/placement/contract/repair/consultation policy or facts |
| `context-selection/contracts.ts` | [subs/autonomous/subs/work-coordination/src/context-selection/contracts.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/context-selection/contracts.ts) | Work/placement/contract/repair/consultation policy or facts |
| `context-selection/delivery.ts` | [subs/autonomous/subs/work-coordination/src/context-selection/delivery.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/context-selection/delivery.ts) | Work/placement/contract/repair/consultation policy or facts |
| `context-selection/prompts.ts` | [subs/autonomous/subs/work-coordination/src/context-selection/prompts.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/context-selection/prompts.ts) | Work/placement/contract/repair/consultation policy or facts |
| `context-selection/recorded.ts` | [subs/autonomous/subs/work-coordination/src/context-selection/recorded.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/context-selection/recorded.ts) | Work/placement/contract/repair/consultation policy or facts |
| `context-selection/submissions.ts` | [subs/autonomous/subs/work-coordination/src/context-selection/submissions.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/context-selection/submissions.ts) | Work/placement/contract/repair/consultation policy or facts |
| `guard/resolve-contained-path.ts` | [src/guard/resolve-contained-path.ts](../../subs/harness/src/guard/resolve-contained-path.ts) | Shared containment/write-authority mechanism |
| `guard/write-guard.ts` | [src/guard/write-guard.ts](../../subs/harness/src/guard/write-guard.ts) | Shared containment/write-authority mechanism |
| `hooks/mutation-order.ts` | [src/hooks/mutation-order.ts](../../subs/harness/src/hooks/mutation-order.ts) | Shared mutation ordering/post-write observation |
| `hooks/post-write.ts` | [src/hooks/post-write.ts](../../subs/harness/src/hooks/post-write.ts) | Shared mutation ordering/post-write observation |
| `measurement/inputs.ts` | [subs/kpi/src/measurement/inputs.ts](../../subs/harness/subs/kpi/src/measurement/inputs.ts) | Metric inputs, ownership and historical metric data |
| `measurement/owners.ts` | [subs/kpi/src/measurement/owners.ts](../../subs/harness/subs/kpi/src/measurement/owners.ts) | Metric inputs, ownership and historical metric data |
| `prompts/packages.ts` | [src/prompts/packages.ts](../../subs/harness/src/prompts/packages.ts) | Captured prompt package loading/hashes |
| `prompts/tasks.ts` | [subs/task-workflow/src/prompts/tasks.ts](../../subs/harness/subs/task-workflow/src/prompts/tasks.ts) | Workflow task recipes/prose; shared framing split above |
| `qualification/live-session.ts` | [src/qualification/live-session.ts](../../subs/harness/src/qualification/live-session.ts) | Application live-session/trial qualification entry |
| `qualification/trial-report.ts` | [src/qualification/trial-report.ts](../../subs/harness/src/qualification/trial-report.ts) | Application live-session/trial qualification entry |
| `run/audit-workspaces.ts` | [src/run/audit-workspaces.ts](../../subs/harness/src/run/audit-workspaces.ts) | Shared audit-workspace ownership/lifetime |
| `run/beads-sessions.ts` | [src/run/beads-sessions.ts](../../subs/harness/src/run/beads-sessions.ts) | Separate administrative tracker session/storage/tool adapter |
| `run/beads-storage.ts` | [src/run/beads-storage.ts](../../subs/harness/src/run/beads-storage.ts) | Separate administrative tracker session/storage/tool adapter |
| `run/beads-tools.ts` | [src/run/beads-tools.ts](../../subs/harness/src/run/beads-tools.ts) | Separate administrative tracker session/storage/tool adapter |
| `run/candidate-attribution.ts` | [subs/autonomous/subs/acceptance/src/candidate-attribution.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/candidate-attribution.ts) | Candidate, gate, review or completion evidence |
| `run/committed-history.ts` | [subs/autonomous/src/run/committed-history.ts](../../subs/harness/subs/autonomous/src/run/committed-history.ts) | Historical version/integrity validation over owner schemas |
| `run/compaction-review.ts` | [subs/autonomous/subs/work-coordination/src/compaction-review.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/compaction-review.ts) | Work/placement/contract/repair/consultation policy or facts |
| `run/document-inputs.ts` | [subs/autonomous/subs/planning/src/documents.ts](../../subs/harness/subs/autonomous/subs/planning/src/documents.ts) | Captured document/intake analysis evidence |
| `run/feature-files.ts` | [subs/autonomous/subs/acceptance/src/feature-files.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/feature-files.ts) | Candidate, gate, review or completion evidence |
| `run/inputs.ts` | [subs/autonomous/src/run/inputs.ts](../../subs/harness/subs/autonomous/src/run/inputs.ts) | Admission-time plan/source/view capture adapter |
| `run/log.ts` | [subs/autonomous/src/run/log.ts](../../subs/harness/subs/autonomous/src/run/log.ts) | Atomic lifecycle journal/event authority |
| `run/module-header.ts` | [subs/evidence/src/module-header.ts](../../subs/harness/subs/evidence/src/module-header.ts) | Project/module fact acquisition |
| `run/mutations.ts` | [src/run/mutations.ts](../../subs/harness/src/run/mutations.ts) | Explicit lifecycle/shared application support |
| `run/policy.ts` | [src/run/policy.ts](../../subs/harness/src/run/policy.ts) | Shared project configuration/default policy assembly |
| `run/project-config.ts` | [src/run/project-config.ts](../../subs/harness/src/run/project-config.ts) | Shared project configuration/default policy assembly |
| `run/project-facts.ts` | [subs/autonomous/subs/work-coordination/src/project-facts.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/project-facts.ts) | Work/placement/contract/repair/consultation policy or facts |
| `run/readiness-commit.ts` | [subs/autonomous/subs/acceptance/src/readiness-commit.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/readiness-commit.ts) | Candidate, gate, review or completion evidence |
| `run/readiness.ts` | [subs/autonomous/subs/acceptance/src/readiness.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/readiness.ts) | Candidate, gate, review or completion evidence |
| `run/records.ts` | [subs/autonomous/src/run/records.ts](../../subs/harness/subs/autonomous/src/run/records.ts) | Lifecycle identity/layout/registry; owned schemas split above |
| `run/recovery-admission.ts` | [subs/autonomous/src/run/recovery-admission.ts](../../subs/harness/subs/autonomous/src/run/recovery-admission.ts) | Lifecycle source/runtime/recovery admission identity |
| `run/recovery-checks.ts` | [subs/autonomous/subs/acceptance/src/check-execution-recovery.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/check-execution-recovery.ts) | Candidate, gate, review or completion evidence |
| `run/recovery-gate.ts` | [subs/autonomous/subs/acceptance/src/recovery-gate.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/recovery-gate.ts) | Candidate, gate, review or completion evidence |
| `run/repair-export-command.ts` | [subs/autonomous/src/run/repair-export-command.ts](../../subs/harness/subs/autonomous/src/run/repair-export-command.ts) | Lifecycle administrative repair outbox/export entry |
| `run/repair-export.ts` | [subs/autonomous/src/run/repair-export.ts](../../subs/harness/subs/autonomous/src/run/repair-export.ts) | Lifecycle administrative repair outbox/export entry |
| `run/repair-gate.ts` | [subs/autonomous/subs/acceptance/src/repair-gate.ts](../../subs/harness/subs/autonomous/subs/acceptance/src/repair-gate.ts) | Candidate, gate, review or completion evidence |
| `run/repair-history.ts` | [subs/autonomous/subs/work-coordination/src/repair/repair-history.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/repair/repair-history.ts) | Work/placement/contract/repair/consultation policy or facts |
| `run/repair-preparation.ts` | [subs/autonomous/subs/work-coordination/src/repair/repair-preparation.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/repair/repair-preparation.ts) | Work/placement/contract/repair/consultation policy or facts |
| `run/repair-records.ts` | [subs/autonomous/subs/work-coordination/src/repair/repair-records.ts](../../subs/harness/subs/autonomous/subs/work-coordination/src/repair/repair-records.ts) | Work/placement/contract/repair/consultation policy or facts |
| `run/restart-import.ts` | [subs/autonomous/src/run/restart-import.ts](../../subs/harness/subs/autonomous/src/run/restart-import.ts) | Lifecycle authenticated restart import |
| `run/service.ts` | [subs/autonomous/src/run/service.ts](../../subs/harness/subs/autonomous/src/run/service.ts) | Lifecycle orchestration; domain decisions split above |
| `run/snapshot.ts` | [subs/autonomous/src/run/snapshot.ts](../../subs/harness/subs/autonomous/src/run/snapshot.ts) | Lifecycle read-only state reduction |
| `run/task-brief.ts` | [subs/task-workflow/src/task-brief.ts](../../subs/harness/subs/task-workflow/src/task-brief.ts) | Authored/manual/standalone workflow construction |
| `sessions/command.ts` | [subs/task-workflow/src/sessions/command.ts](../../subs/harness/subs/task-workflow/src/sessions/command.ts) | Authored/manual/standalone workflow construction |
| `sessions/single.ts` | [subs/task-workflow/src/sessions/single.ts](../../subs/harness/subs/task-workflow/src/sessions/single.ts) | Authored/manual/standalone workflow construction |
| `steps/after.ts` | [subs/task-workflow/src/steps/after.ts](../../subs/harness/subs/task-workflow/src/steps/after.ts) | Authored/manual/standalone workflow construction |
| `steps/agent.ts` | [subs/task-workflow/src/steps/agent.ts](../../subs/harness/subs/task-workflow/src/steps/agent.ts) | Authored/manual/standalone workflow construction |
| `steps/assigned.ts` | [subs/task-workflow/src/steps/assigned.ts](../../subs/harness/subs/task-workflow/src/steps/assigned.ts) | Authored/manual/standalone workflow construction |
| `steps/authored.ts` | [subs/task-workflow/src/steps/authored.ts](../../subs/harness/subs/task-workflow/src/steps/authored.ts) | Authored/manual/standalone workflow construction |
| `steps/authoring.ts` | [subs/task-workflow/src/steps/authoring.ts](../../subs/harness/subs/task-workflow/src/steps/authoring.ts) | Authored/manual/standalone workflow construction |
| `steps/command.ts` | [subs/task-workflow/src/steps/command.ts](../../subs/harness/subs/task-workflow/src/steps/command.ts) | Authored/manual/standalone workflow construction |
| `steps/construct.ts` | [subs/task-workflow/src/steps/construct.ts](../../subs/harness/subs/task-workflow/src/steps/construct.ts) | Authored/manual/standalone workflow construction |
| `steps/constructed.ts` | [subs/task-workflow/src/steps/constructed.ts](../../subs/harness/subs/task-workflow/src/steps/constructed.ts) | Authored/manual/standalone workflow construction |
| `steps/engineer.ts` | [subs/task-workflow/src/steps/engineer.ts](../../subs/harness/subs/task-workflow/src/steps/engineer.ts) | Authored/manual/standalone workflow construction |
| `steps/from-run.ts` | [subs/task-workflow/src/steps/from-run.ts](../../subs/harness/subs/task-workflow/src/steps/from-run.ts) | Authored/manual/standalone workflow construction |
| `steps/gate.ts` | [subs/task-workflow/src/steps/gate.ts](../../subs/harness/subs/task-workflow/src/steps/gate.ts) | Authored/manual/standalone workflow construction |
| `steps/inputs.ts` | [subs/task-workflow/src/steps/inputs.ts](../../subs/harness/subs/task-workflow/src/steps/inputs.ts) | Authored/manual/standalone workflow construction |
| `steps/local-architect.ts` | [subs/task-workflow/src/steps/local-architect.ts](../../subs/harness/subs/task-workflow/src/steps/local-architect.ts) | Authored/manual/standalone workflow construction |
| `steps/manual-hosts.ts` | [subs/task-workflow/src/steps/manual-hosts.ts](../../subs/harness/subs/task-workflow/src/steps/manual-hosts.ts) | Authored/manual/standalone workflow construction |
| `steps/manual.ts` | [subs/task-workflow/src/steps/manual.ts](../../subs/harness/subs/task-workflow/src/steps/manual.ts) | Authored/manual/standalone workflow construction |
| `steps/render.ts` | [subs/task-workflow/src/steps/render.ts](../../subs/harness/subs/task-workflow/src/steps/render.ts) | Authored/manual/standalone workflow construction |
| `steps/review-step.ts` | [subs/task-workflow/src/steps/review-step.ts](../../subs/harness/subs/task-workflow/src/steps/review-step.ts) | Authored/manual/standalone workflow construction |
| `steps/reviewer.ts` | [subs/task-workflow/src/steps/reviewer.ts](../../subs/harness/subs/task-workflow/src/steps/reviewer.ts) | Authored/manual/standalone workflow construction |
| `steps/run-text.ts` | [subs/task-workflow/src/steps/run-text.ts](../../subs/harness/subs/task-workflow/src/steps/run-text.ts) | Authored/manual/standalone workflow construction |
| `steps/run.ts` | [subs/task-workflow/src/steps/run.ts](../../subs/harness/subs/task-workflow/src/steps/run.ts) | Authored/manual/standalone workflow construction |
| `tools/shell-tests.ts` | [src/tools/shell-tests.ts](../../subs/harness/src/tools/shell-tests.ts) | Shared command/effect/test inspection mechanism |
| `tools/shell.ts` | [src/tools/shell.ts](../../subs/harness/src/tools/shell.ts) | Shared command/effect/test inspection mechanism |

### Execution seed (16)

| Original relative to harness/src | Current defining source | Responsibility |
| --- | --- | --- |
| `prompts/blocks.ts` | [subs/task-execution/src/delivery/blocks.ts](../../subs/harness/subs/task-execution/src/delivery/blocks.ts) | Prepared invocation/session/recording mechanics |
| `prompts/briefings.ts` | [subs/task-execution/src/delivery/briefings.ts](../../subs/harness/subs/task-execution/src/delivery/briefings.ts) | Prepared invocation/session/recording mechanics |
| `prompts/delivered-manifest.ts` | [subs/task-execution/src/delivery/delivered-manifest.ts](../../subs/harness/subs/task-execution/src/delivery/delivered-manifest.ts) | Prepared invocation/session/recording mechanics |
| `run/excursions.ts` | [subs/task-execution/src/excursions.ts](../../subs/harness/subs/task-execution/src/excursions.ts) | Prepared invocation/session/recording mechanics |
| `run/observations.ts` | [subs/task-execution/src/observations.ts](../../subs/harness/subs/task-execution/src/observations.ts) | Prepared invocation/session/recording mechanics |
| `run/pausable-deadline.ts` | [src/run/pausable-deadline.ts](../../subs/harness/src/run/pausable-deadline.ts) | Shared caller-wait accounting; no review cancellation policy |
| `run/port-events.ts` | [subs/task-execution/src/port-events.ts](../../subs/harness/subs/task-execution/src/port-events.ts) | Prepared invocation/session/recording mechanics |
| `run/session-operations.ts` | [subs/task-execution/src/session-operations.ts](../../subs/harness/subs/task-execution/src/session-operations.ts) | Shared mechanics; workflow content adapter split above |
| `run/sessions.ts` | [subs/autonomous/src/run/sessions.ts](../../subs/harness/subs/autonomous/src/run/sessions.ts) | Lifecycle replay over shared session contracts |
| `run/submissions.ts` | [subs/task-execution/src/submissions.ts](../../subs/harness/subs/task-execution/src/submissions.ts) | Prepared invocation/session/recording mechanics |
| `run/writer.ts` | [subs/task-execution/src/writer.ts](../../subs/harness/subs/task-execution/src/writer.ts) | Prepared invocation/session/recording mechanics |
| `steps/runner.ts` | [subs/task-workflow/src/steps/runner.ts](../../subs/harness/subs/task-workflow/src/steps/runner.ts) | Manual admission adapter; shared runtime split above |
| `transcripts/pages.ts` | [subs/task-execution/src/transcripts/pages.ts](../../subs/harness/subs/task-execution/src/transcripts/pages.ts) | Prepared invocation/session/recording mechanics |
| `transcripts/recorder.ts` | [subs/task-execution/src/transcripts/recorder.ts](../../subs/harness/subs/task-execution/src/transcripts/recorder.ts) | Prepared invocation/session/recording mechanics |
| `transcripts/store.ts` | [subs/task-execution/src/transcripts/store.ts](../../subs/harness/subs/task-execution/src/transcripts/store.ts) | Prepared invocation/session/recording mechanics |
| `transcripts/writer.ts` | [subs/task-execution/src/transcripts/writer.ts](../../subs/harness/subs/task-execution/src/transcripts/writer.ts) | Prepared invocation/session/recording mechanics |

### Facade/shared support (25)

| Original relative to harness/src | Current defining source | Responsibility |
| --- | --- | --- |
| `http/app.ts` | [src/http/app.ts](../../subs/harness/src/http/app.ts) | HTTP composition/read-only query adapter |
| `http/query-source.ts` | [src/http/query-source.ts](../../subs/harness/src/http/query-source.ts) | HTTP composition/read-only query adapter |
| `http/server.ts` | [src/http/server.ts](../../subs/harness/src/http/server.ts) | HTTP composition/read-only query adapter |
| `interfaces/protocol/capability-tasks.ts` | [src/interfaces/protocol/capability-tasks.ts](../../subs/harness/src/interfaces/protocol/capability-tasks.ts) | Browser-safe public wire schema |
| `interfaces/protocol/check-findings.ts` | [src/interfaces/protocol/check-findings.ts](../../subs/harness/src/interfaces/protocol/check-findings.ts) | Browser-safe public wire schema |
| `interfaces/protocol/errors.ts` | [src/interfaces/protocol/errors.ts](../../subs/harness/src/interfaces/protocol/errors.ts) | Browser-safe public wire schema |
| `interfaces/protocol/evidence.ts` | [src/interfaces/protocol/evidence.ts](../../subs/harness/src/interfaces/protocol/evidence.ts) | Browser-safe public wire schema |
| `interfaces/protocol/execution-map.ts` | [src/interfaces/protocol/execution-map.ts](../../subs/harness/src/interfaces/protocol/execution-map.ts) | Browser-safe public wire schema |
| `interfaces/protocol/ids.ts` | [src/interfaces/protocol/ids.ts](../../subs/harness/src/interfaces/protocol/ids.ts) | Browser-safe public wire schema |
| `interfaces/protocol/jobs.ts` | [src/interfaces/protocol/jobs.ts](../../subs/harness/src/interfaces/protocol/jobs.ts) | Browser-safe public wire schema |
| `interfaces/protocol/paths.ts` | [src/interfaces/protocol/paths.ts](../../subs/harness/src/interfaces/protocol/paths.ts) | Browser-safe public wire schema |
| `interfaces/protocol/queries.ts` | [src/interfaces/protocol/queries.ts](../../subs/harness/src/interfaces/protocol/queries.ts) | Browser-safe public wire schema |
| `interfaces/protocol/repairs.ts` | [src/interfaces/protocol/repairs.ts](../../subs/harness/src/interfaces/protocol/repairs.ts) | Browser-safe public wire schema |
| `interfaces/protocol/runs.ts` | [src/interfaces/protocol/runs.ts](../../subs/harness/src/interfaces/protocol/runs.ts) | Browser-safe public wire schema |
| `interfaces/protocol/sessions.ts` | [src/interfaces/protocol/sessions.ts](../../subs/harness/src/interfaces/protocol/sessions.ts) | Browser-safe public wire schema |
| `interfaces/protocol/transcripts.ts` | [src/interfaces/protocol/transcripts.ts](../../subs/harness/src/interfaces/protocol/transcripts.ts) | Browser-safe public wire schema |
| `jobs/activity.ts` | [src/jobs/activity.ts](../../subs/harness/src/jobs/activity.ts) | Shared job identity, replay or accepted-write mechanism |
| `jobs/commands.ts` | [src/jobs/commands.ts](../../subs/harness/src/jobs/commands.ts) | Shared job identity, replay or accepted-write mechanism |
| `jobs/commit.ts` | [src/jobs/commit.ts](../../subs/harness/src/jobs/commit.ts) | Shared job identity, replay or accepted-write mechanism |
| `jobs/mutex.ts` | [src/jobs/mutex.ts](../../subs/harness/src/jobs/mutex.ts) | Shared job identity, replay or accepted-write mechanism |
| `jobs/records.ts` | [src/jobs/records.ts](../../subs/harness/src/jobs/records.ts) | Shared job identity, replay or accepted-write mechanism |
| `plans/discover.ts` | [src/plans/discover.ts](../../subs/harness/src/plans/discover.ts) | Application plan discovery/display |
| `plans/title.ts` | [src/plans/title.ts](../../subs/harness/src/plans/title.ts) | Application plan discovery/display |
| `store/lock.ts` | [src/store/lock.ts](../../subs/harness/src/store/lock.ts) | Shared state location or single-writer exclusion |
| `store/state-directory.ts` | [src/store/state-directory.ts](../../subs/harness/src/store/state-directory.ts) | Shared state location or single-writer exclusion |
