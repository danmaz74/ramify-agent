# ramify-agent documents

Design documents for the separate agent harness:

- [Agent assistance over MCP](agent-assistance.md), setup, plan registration,
  candidate assessment and evidence; [Plan 47](plans/47-agent-assistance/main-plan.md)
  is in implementation, with [qualification still pending](plans/47-agent-assistance/implementation-results.md)
- [Removing Pi restrictions that violate harness principles](analysis/2026-10-15-removing-restrictions-that-violate-principles.md),
  implemented Batch 1 continuation and correction, with proposed follow-up
  batches, clarified principles and observable acceptance examples
- [Pi restriction inventory](analysis/2026-10-15-pi-restrictions-audit.md),
  41 restriction families across execution, Pi integration, submissions and
  administration, with source references and active-versus-historical distinctions
- [Plan 44: execution continuity](plans/44-execution-continuity/main-plan.md),
  native Pi compaction, progress-sensitive stall recovery and retained pending
  work; [qualification evidence](plans/44-execution-continuity/implementation-results.md)
  distinguishes scripted continuation witnesses from committed audit evidence

- [Plan 41: interrupted-operation recovery and empty mutations](plans/41-interruption-recovery/main-plan.md),
  implemented and qualified: bounded retries, durable
  same-run pause/resume for new runs with admission of external repairs,
  retained accepted work and honest classification when no paths changed;
  [implementation results](plans/41-interruption-recovery/implementation-results.md)
- [Plan 40: implementation through temporarily invalid projects](plans/40-invalid-project-recovery/main-plan.md),
  implemented, qualified and merged: recorded repair authority, architect
  continuation and honest candidate qualification; the checkpoint evaluation
  defers checkpoint adoption
- [Plan 39: run changed tests individually](plans/39-test-file-audits/main-plan.md),
  implemented, released and qualified: Ramify file facts, direct test selection
  and evidence in ramify-audit, exact provider pins and a one-file consumer witness
- [Plan 38: Cucumber acceptance and delivery](plans/38-cucumber-acceptance-and-delivery/main-plan.md),
  implemented and qualified by a composed committed default audit:
  explicit capability-feature evidence,
  faithful Gherkin acceptance elements, retained context and delegated
  acceptance; preserves and qualifies Plan 37's committed correction workflow
- [Plan 37: correction at the responsible decision authority](plans/37-correction-at-decision-authority/main-plan.md),
  implemented and qualified with Plan 38 by a composed committed default audit:
  Cucumber binding discovery and returning
  contradictions to the authority that can revise the choice or delegate its
  correction; separates finding `.16` from Plan 36
- [Plan 36: straightforward revision-preview corrections](plans/36-revision-preview-corrections/main-plan.md),
  proposed for harness execution: consistent submission contracts, usable
  qualified evidence, role-aware guidance and mutation attribution across
  21 Beads findings; the independent citation-validation fix and Plan 37's
  Cucumber binding and decision-correction work are excluded
- [Plan 35: the breakpoint debugger in the web UI](plans/35-breakpoint-debugger-ui/main-plan.md),
  implemented, audited and witnessed in Chromium: start a plan with the
  module engineer breakpoint from the Plan page, then read the prepared input,
  message the paused module engineer and resume from a Debugger area on the Run page,
  over Plan 34's controls
- [Plan 34: execution breakpoints](plans/34-execution-breakpoints/main-plan.md),
  proposed: four serial iterations for before-engineer inspection, same-session
  conversation and CLI resume; whole-run suspension with a live server
- [Plan 33: consult architect](plans/33-consult-architect/main-plan.md), proposed:
  four serial iterations for advisory architect forks, one-level nesting and
  inspectable consultation logs, including capability-assigned module engineers
- [Consult architect](analysis/2026-10-10-consult-architect.md), initial analysis:
  advisory questions from module engineers to module architects and module architects
  to the plan architect, using forks of their delegation context
- [Plan 32: independent repository and persistent development workspace](plans/32-repository-extraction/main-plan.md),
  in implementation, published here; the host cutover, container witnesses,
  toolkit cleanup landing and pending branches remain, as listed in the
  [iteration 5 handoff](plans/32-repository-extraction/iterations/05-results.md):
  preserve history and local work, extract the agent, provide one
  devcontainer with persistent sibling Ramify and ramify-audit checkouts,
  qualify the new workspace and complete the repository cutover
- [The development workspace](development/workspace.md): the devcontainer,
  its companion checkouts, setup, status, ports, volumes and host state
- [Plan 30: harness steps as a library and a CLI](plans/30-harness-steps/main-plan.md),
  implemented; the real-plan exercise awaits the user's go-ahead: step
  inputs and constructors the run itself uses, and `ramify-agent step` to
  render, run, gate and apply the after-handling of one step from files, run
  again after a harness fix; the [README](../README.md#steps) describes the
  workflow; supersedes Plan 15's capture and replay
- [Plan 31: the operator driver](plans/31-operator-driver/main-plan.md),
  proposed, after Plan 30: a session operation driver fed by a file mailbox
  and CLI so a generalist agent or a person plays chosen roles inside a real
  run, enforced and recorded as pi's turns are
- [Exercising the harness one step at a time](analysis/2026-10-10-step-wise-dogfooding.md),
  proposal behind Plans 30 and 31: why scripts alone and MCP are not the
  answer, and the three layers
- [Plan 28 self-run](analysis/2026-10-10-plan28-self-run.md), the real-run
  failures that motivated them
- [Context budgets and compaction](analysis/2026-10-10-context-budgets-and-compaction.md),
  why sessions end at a budget instead of compacting: the mechanism's
  provenance, pi's own compaction, what Plan 23 switched off, and the
  decisions to restore autocompaction
- [Plan 25: discovery handoffs and instruction delivery](plans/25-carry-discovery-forward/main-plan.md),
  consolidated delivery of effective named blocks, optional recorded source
  pointers and candidate-bound NFR comparisons; [session observations](metrics/session-observations.md)
  describes physical input/provenance access and benefit-assessment limits
- [Plan 24: useful starting briefs and orientation reuse](plans/24-orientation-for-context-selection/main-plan.md),
  consolidated implementation plan for known task inputs and pointers, shared
  work orientation, simple fresh fallbacks and existing inexpensive metrics;
  benefit assessment remains with Dan
- [Plan 23: session reuse and real-run corrections](plans/23-session-reuse-and-run-efficiency/main-plan.md),
  proposed implementation of exact session continuation/forks, task-specific
  submission tools, shell/scenario/briefing corrections and exploration metrics;
  independent provider iterations run in parallel before ordered runtime integration
- [Plan 22: enforced test boundaries and prompt command cleanup](plans/22-test-boundaries/main-plan.md),
  qualified on committed source: scripted ordinary scenarios, automatic process
  guarding, explicit native selection and prompt command cleanup;
  [final results](plans/22-test-boundaries/final-results.md) retain the aggregate
  timing limitation and failed working-tree materializer observation
- [Harness principles](harness.principles.md)
- [Prompt optimization principles](prompt-optimization.principles.md), shared
  context, guidance, instruction delivery, orientation reuse and concise results
- [Engineer prompt optimization principles](prompt-optimization-engineer.principles.md),
  local context with access to architectural advice
- [Plan architect prompt optimization principles](prompt-optimization-plan-architect.principles.md),
  forecasts and implementation mapping
- [Module architect prompt optimization principles](prompt-optimization-module-architect.principles.md),
  work decomposition and progress reconsideration
- [Automatic project repair](architecture/automatic-project-repair.spec.md):
  one explicitly delegated root repair session for an unexpected architect
  preparation obstruction, verified handback, retained incident evidence,
  Beads export and UI visibility; implemented and qualified by
  [composed committed default audits](architecture/automatic-project-repair.qualification.md)
- [Session reuse and system prompts](analysis/2026-10-08-session-reuse-and-system-prompts.md),
  ordinary continuation as the default, forks that preserve the complete
  inherited prefix, current history reuse with prompt/tool replacement, and
  predetermined workflow strategies and high-level session operations;
  implementation is planned in Plan 23
- [Status-badge-tone real-run findings](analysis/2026-10-08-status-badge-tone-real-run.md),
  correctness, exploration, cost and metric corrections covered by the proposed
  Plan 23; original run observations remain historical evidence
- [Agent declarations and automated audit evidence](analysis/2026-10-07-agent-declarations-and-audit-responsibilities.md),
  desired responsibility boundary and issues in the current implementation and
  Plan 21, with relevant principles, adopted decisions and remaining design
  questions
- [Plan 21: provider adoption and architect-owned completion](plans/21-project-boundary-adoption/main-plan.md),
  expanded Phase 3 migration with eleven serial iterations; current provider
  adoption, architect declarations, delegation handback, bounded clarification,
  recovery and independent full-audit final verification; implementation unstarted
- [Harness specification](harness.spec.md), scope, verification, scratch,
  preparation, session behavior and pending specification discovery and sealing
- [CheckFinding principles](check-findings.principles.md), proposed rules for
  evidence, agent judgment, automatic resolution and user attention
- [CheckFinding specification](check-findings.spec.md), classification,
  credibility, settlement, correction rounds and presentation
- [CheckFinding architecture](architecture/check-findings.md), proposed CheckFinding
  module, background reviews, durable dispositions and work-item reconciliation
- [Decomposition hypothesis 3](decomposition/dan-hypothesis-3.md), initial draft:
  local coordinators, unified delegation and decisions recorded without review waits
- [Autonomous implementation loop](architecture/autonomous-implementation-loop.md), current implementation design:
  plan and module architects refine architectural hypotheses, and a fresh
  capability architect coordinates scoped work through verified handback
- [Cooperation through a capability plan](architecture/capability-plan-cooperation.hypothesis.md),
  architecture hypothesis: consumer and provider architects iteratively develop
  an interface, coordinate implementation and verify real consumer use through
  a shared plan
- [A fresh architect for one capability](architecture/fresh-capability-architect.hypothesis.md),
  architecture hypothesis: one new architect coordinates interface design and
  provider implementation, consults the consumer module engineer and returns the result
  for consumer integration
- [Plan 16: a fresh architect coordinates each requested capability](plans/16-capability-architect/main-plan.md),
  proposed implementation: durable capability plans, direct consumer consultation,
  scoped provider and compatibility work, real verification and explicit handback
- [Breaking and non-breaking plans](decomposition/breaking-vs-non-breaking-plans.md),
  reasoning, sequential sub-plan hypothesis and non-breaking-only MVP scope
- [Harness architecture](architecture.md), superseded early draft
- [Implementation loop](implementation-loop.md), superseded task state machine proposal
- [The work loop as a state machine](work-loop.md), superseded proposal
- [State machine architecture with XState](analysis/2026-09-26-state-machine-architecture.md),
  analysis of owner-local workflow machines with the run ledger as authority
- [What the plan-to-brief spike taught us](analysis/2026-09-19-plan-to-brief-spike.md),
  analysis of the former `spikes/briefs/` experiment that mapped three toolkit
  plans and assembled their briefs; the spike tree was removed on 2026-10-04
- [From a plan to a brief: a merge of the two spikes](analysis/2026-09-19-merged-brief-process.md),
  proposal
- [A merged implementation loop](analysis/2026-09-19-loop-merge-proposal.md),
  proposal connecting capability-only maps and rendered briefs to the whole-run state machine
- [When should a contract be a module?](analysis/2026-09-20-contract-module-analysis-brief.md),
  analysis brief for contract authority, dependency cost and cognitive complexity
- [When should a contract be a module? Result](analysis/2026-09-20-contract-module-analysis-result.md),
  what that analysis established, what Plan 3 takes from it and what it did not record
- [Session transcripts and live session views](analysis/2026-09-23-session-transcripts-live-view.md),
  draft analysis: what is collected for a web view of agent sessions, the gaps,
  and a harness-owned transcript designed for parallel sessions
- [Required capabilities and retired forecasts](analysis/2026-09-23-capability-registry-analysis.md),
  analysis for the capability registry: only top-level capabilities are
  required, a forecast is retired by deduction when the run completes, and
  early retirement is a placement decision
- [Refactoring and debugging plans](analysis/2026-09-23-refactoring-and-debugging-plans.md),
  draft analysis: debugging generalizes the capability requirement as a
  correction, while refactoring is a plan kind of its own with target
  assertions and a protected boundary
- [Plan requirements, advisory items and context selection](analysis/2026-09-25-plan-requirements-and-context-selection.md),
  initial analysis for evidence capture, one-time context selection and
  non-functional work; [Plan 13](plans/13-plan-evidence-and-nonfunctional-work/main-plan.md)
  records the later decisions that narrow its catalog and coordinator
- [Plan execution dashboard](analysis/2026-09-23-plan-execution-dashboard/README.md),
  inventory of what the web client shows and the harness records, with
  screenshots, and a [design proposal](analysis/2026-09-23-plan-execution-dashboard/design-proposal.md)
  with a static [mockup](analysis/2026-09-23-plan-execution-dashboard/mockup.html):
  an overview answering now, done, left and issues, a layered Map and a
  Timeline sharing one selection; proposed
- [Dashboard elements and their relationships](analysis/2026-09-24-dashboard-elements-and-relationships.md),
  catalog of the elements a dashboard could display (capabilities, scenarios,
  modules, exposed symbols and contracts, sessions by kind, gates and test
  runs), what is known about each and how they relate, with where each fact
  comes from and whether the protocol publishes it
- [Plan execution decomposition map](analysis/2026-09-24-plan-execution-decomposition-map.proposal.md),
  design proposal for capability-rooted work trees with scenario results and
  full module paths, ordered iterations, module architect sessions, gate results
  and movable live transcript windows
- [Acceptance scenarios](analysis/2026-09-23-acceptance-scenarios.md),
  analysis recording Dan's decision that Gherkin scenarios are the plan's main
  acceptance gate: their origin and review, matching to entries, late binding,
  quick and full modes, and Cucumber runs scoped to the module tree
- [Acceptance scenarios: the v1 architecture](architecture/acceptance-scenarios.md),
  the design of the first step, implemented by Plan 10, with Dan's decisions of 2026-09-23: plan
  scenarios extracted at capture, frozen at analysis, a review stop,
  harness-materialized feature files, four scenario states, declarations
  verified by every gate, and an integration work item at the common
  ancestor; since Plan 21, scenarios run as a configured Cucumber check of
  the project's committed audit
- [Work-brief decomposition spike](spikes/work-brief-examples/README.md), isolated example requests and Sol planning runs
- [Autonomous-loop initial capability and module hypothesis](spikes/autonomous-loop-initial-analysis/README.md),
  spike output and reusable input for the later implementation plan
- [Glossary](glossary.md)
- [Additional points to evaluate](additional-to-evaluate.md)
- [To do](todo.md), harness work decided in outline and not yet started
- [Dan's to-do](dan-to-do.md), decisions and actions only Dan can take
- [Plan 1: from a chosen plan to an implementation map](plans/01-implementation-map/main-plan.md),
  implemented except its live items: the real pi session and the live trial,
  which need a person's pi login. See its
  [completion report](plans/01-implementation-map/completion-report.md) and the
  trial's [review sheet](plans/01-implementation-map/trial/review-sheet.md).
- [Plan 2: put contracts with their authority](plans/02-contract-authority-refactor/main-plan.md),
  prerequisite refactor before the autonomous implementation loop
- [Plan 3 authoring brief: autonomous implementation loop MVP](plans/03-autonomous-implementation-loop/authoring-brief.md),
  inputs, boundaries and acceptance requirements for the full implementation plan
- [Lessons from cucumber-viz](cucumber-viz-lessons/README.md), analysis of what
  its agent studios teach about state, checks, planning and sessions, with the
  consequences proposed for Plan 3
- [Implementation Studio adoption analysis](analysis/2026-09-24-implementation-studio-adoption.md),
  ranked output-quality features, adaptation costs and a review-first delivery sequence
- [Agent reviews and CheckFindings](analysis/2026-09-24-agent-reviews-and-checkfindings.md),
  review points in the current run loop and their minimal CheckFinding integration
- [Sealed-file edit hooks and justified saves](analysis/2026-09-24-sealed-file-edit-hooks.md),
  analysis for a follow-up plan with immediate edit feedback and linked CheckFindings
- [File authority and provenance](analysis/2026-09-24-file-authority-and-provenance.md),
  the authority mechanisms and today's provenance changes, their contradictions and a
  three-class model to resolve them
- [Estimating file authority](analysis/2026-09-24-file-authority-estimation.md),
  proposed four-level estimate from source authority, interpretation and recorded
  human review, with revision-specific evidence and an explicit unknown state
- [Plan 3: the autonomous implementation loop MVP](plans/03-autonomous-implementation-loop/main-plan.md),
  in implementation; its thirteen-iteration
  [index](plans/03-autonomous-implementation-loop/iterations/README.md) records
  current progress
- [Plan 3 core records](plans/03-autonomous-implementation-loop/core-records.proposal.md),
  proposal for the durable records, submissions and identities the plan will reference
- [Plan 3 capability progress visualizations](plans/03-autonomous-implementation-loop/initial-hypothesis-vs-implemented-module-tree.proposal.md):
  one implementation plan for the dependency-progress and
  initial-versus-current module diagrams, including the Ramify canvas
  extraction they need; proposed
- [Plan 4: delivered-solution token efficiency](plans/04-token-efficiency/main-plan.md),
  including context-limit and overflow visibility; planned and blocked until
  Plan 3 is complete and merged
- [Plan 5: single module engineer sessions](plans/05-single-engineer-sessions/main-plan.md),
  the `ramify-agent session` command for one module engineer session on one module;
  proposed
- [Plan 6: role-specific prompts](plans/06-role-specific-prompts/main-plan.md),
  self-contained prompts per role in place of the module-architect skill;
  proposed
- [Plan 7: commit-audit integration](plans/07-commit-audit-integration/main-plan.md),
  implemented commit-then-audit gates with revision-bound evidence; its
  completion gate is verified, while run delivery or merge remains out of scope
- [Plan 8: baseline repairs](plans/08-baseline-repairs/main-plan.md),
  both projects' suites and frozen gates made green, the capability views'
  layout defects fixed, and an audited run of this project's suite; proposed
- [Plan 9: session model and transcripts](plans/09-session-model-and-transcripts/main-plan.md),
  harness-owned sessions with lifecycle and lineage, a transcript per session,
  the session list, live transcripts, diagram markers, a lineage timeline and
  lineage measurements; implemented 2026-09-23, with its
  [results](plans/09-session-model-and-transcripts/results.md)
- [Plan 10: acceptance scenarios](plans/10-acceptance-scenarios/main-plan.md),
  the v1 acceptance scenarios architecture in eleven iterations; implemented,
  with its [results](plans/10-acceptance-scenarios/results.md), and merged
  with Plan 9's session model; both audits pass on the merge
- [Plan 11: plan execution and modules maps](plans/11-plan-execution-map/main-plan.md),
  implemented with zoomable execution and companion module maps, scenario and
  capability details, gate results, sessions and movable live transcript windows;
  [results](plans/11-plan-execution-map/results.md) include real-browser and
  scripted-run acceptance evidence
- [Plan 12: CheckFindings and iteration reviews](plans/12-check-findings/main-plan.md),
  proposed v1 implementation of durable CheckFindings, background code, scope
  and design reviews, work-item reconciliation and selected factual evidence
- [Plan 13: plan evidence, context selection and non-functional work](plans/13-plan-evidence-and-nonfunctional-work/main-plan.md),
  proposed capture and delivery of plan and principles evidence, with bounded
  non-functional assessment and repair
- [Plan 14: unified evidence packages](plans/14-unified-evidence-packages/main-plan.md),
  proposed: the four-kind element catalog extracted in bounded turns and
  checked by an agent, and one package creator that every prompt carrying
  plan or principle material uses; rewritten 2026-09-26 to adhere to the
  catalog specification
- [The plan context catalog: purpose and fidelity](architecture/plan-context-catalog.spec.md),
  Dan's decisions of 2026-09-26: the catalog is the bounded view an agent works
  from, with four kinds of element, kept as faithful as the technology allows
  and not more; a fork of the warmed-up module architect selects the
  non-functional elements once per work item, and one package creator renders
  every package; exactness belongs to byte facts the harness owns, never to a
  reading
- [Module architect skill design](architect-skill-design/README.md)
- [Metrics](metrics/README.md), glossary, measurement principles and the initial
  delivered-change token-efficiency policy; its glossary names concepts and
  their selected measurements, and its terminology map clarifies older names
- [Ramify measurements and agent KPIs](measurements-and-kpis.md)
- [Potential future capabilities](future/README.md), candidate and planned
  user-facing features with their maturity
- [Testing ramify-agent](testing.spec.md), automatic ordinary process guard,
  exact native witnesses, focused selectors and complete audit qualification
- [Plan 2C consumer review](reviews/2026-09-19-plan2c-consumer-review.md)

What Ramify provides to agents is described in the toolkit's
[agents documents](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/agents/README.md).

[Plan 2C](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/plans/iteration-2c-module-measurements/main-plan.md) stays in
Ramify and publishes generic project facts. The dependency goes from this
project to Ramify only; agent activity and KPIs are measured here.

Replaced designs are kept in the hidden `.superseded/` directory for
comparison. They are not current and are read only on request; its
[index](.superseded/README.md) notes what may be reused.
- [Plan 29: common prompt passages and direct task prose](plans/29-common-prompt-passages/main-plan.md),
  proposed bounded prompt composition: substantial reusable passages, complete
  replacement of environment JSON, and existing delivery/authority contracts;
  based on the [candidate inventory](analysis/2026-10-09-common-prompt-block-candidates.md)
- [Plan 27: extract the harness query and projection module](plans/27-projections-extraction/main-plan.md),
  proposed ownership refactor executed by ramify-agent itself, with selected
  reading contracts and acceptance scenarios rather than authored iterations
- [Declared task blocks](analysis/2026-10-09-declared-task-blocks.md),
  proposed rule that each task declares its prompt blocks and receives only
  those its session does not already hold; evidence from the Plan 25 run

## Historical links

Until Plan 32, this project was the `ramify-agent/` directory of the Ramify
toolkit repository. Historical analyses, reviews, spikes, results, receipts
and completed plans keep their original commands, paths, hashes and relative
links. A relative link there that leaves this repository's root refers to the
toolkit: resolve it as if this repository were the `ramify-agent/` directory of
<https://github.com/danmaz74/ramify/tree/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5>.
Commands such as `ramify-agent/node_modules/.bin/ramify-audit audit
--project-root ramify-agent` ran from that repository's root; current commands
run from this repository's root. Current documents link toolkit documents as
pinned GitHub URLs.
