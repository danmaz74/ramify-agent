# Restrictions imposed on Pi by the harness

The harness repeatedly turns implementation choices into prohibitions: fixed
work counts terminate execution, ordinary investigation tools disappear,
format mistakes exhaust an invocation, and recovery rejects compatible fixes.
These mechanisms should generally become guidance, actionable feedback or an
architect decision while preserving the current work.

This inventory applies the user's clarification of 2026-10-15: the bar for
calling a restriction necessary is exceptionally high. A comment, test,
specification or previous implementation does not establish that the user
required it. None of the restrictions below is certified necessary by this
review. Existing explicit requirements are distinguished from additional
implementation restrictions; satisfying a requirement does not justify every
mechanism currently enforcing it.

The subsequent clarification,
[The Harness Makes Agents More Efficient Through Context and Guidance](../harness.principles.md#the-harness-makes-agents-more-efficient-through-context-and-guidance),
explicitly rejects preventing actions or withholding tools out of distrust of
agent judgment. Inadequate guidance and excessive-context drift require better
guidance and context. This governs the proposed treatment of the restrictions
below, including those that disable tools or force diagnostic handoffs.
All standard tools are available by default; task selection applies to
specialized tools. Each denial of a standard tool needs a specific reason,
without requiring the agent to justify anticipated use.

The [bounded-context clarification](../harness.principles.md#bounded-context-is-what-makes-agents-efficient)
sets a current ceiling of 300,000 tokens of context occupancy, preserving
earlier native Pi compaction thresholds. Use efficient prompts, focused
iterations and forks to avoid unnecessary context growth, with native
compaction enabled throughout. A fork isolates subsequent exploration; it
does not shrink its inherited prefix. Where Pi already compacts earlier, no
additional runtime limit is needed. Larger effective thresholds should be
adjusted through native settings, without a competing context controller,
tool removal or run termination.

Three Sol subagents reviewed execution, Pi integration, and semantic submission
rules. The primary review checked overlapping claims and additional recovery,
command execution and administrative paths. Source references describe the
working checkout at `8374e17e036211dce2653079b17e93dc10be5147`, including its
existing uncommitted documentation changes. This is a static mechanism review;
historical failures are identified separately. The companion providers were
not independently audited, and `docs/.superseded/` was excluded.

**Highest priority: rules that end useful work or require avoidable intervention.**

1. **Fixed implementation and workload counts.** The live defaults are 12
   iterations per work item, 24 assignments per capability task, 64 work
   items, 32 placement/unresolved requests, and one dependency-cycle replan.
   The work-item limit also constrains architect turns. Capability delegation
   applies a combined work-item/task limit. Exceeding these counts refuses
   work or fails the run without establishing that progress has stopped.
   Placement-only and combined unresolved-request counting are not even
   symmetrical. Replace termination with architect reconsideration and
   continuation. This directly conflicts with the adopted principle that
   counts do not establish failure and there is no fixed iteration limit.
   Evidence: [policy.ts:21](../../subs/harness/src/run/policy.ts#L21),
   [service.ts:5965](../../subs/harness/src/run/service.ts#L5965),
   [service.ts:7538](../../subs/harness/src/run/service.ts#L7538),
   [service.ts:7792](../../subs/harness/src/run/service.ts#L7792),
   [service.ts:8486](../../subs/harness/src/run/service.ts#L8486),
   [service.ts:9723](../../subs/harness/src/run/service.ts#L9723),
   [service.ts:11298](../../subs/harness/src/run/service.ts#L11298),
   [capability/ledger.ts:64](../../subs/harness/src/capability/ledger.ts#L64),
   [repetition principle](../harness.principles.md#repetition-triggers-architect-reconsideration).

2. **Repair quotas turn failed verification into final failure.** Iteration
   repair and work-item gate repair each default to three repair rounds.
   Exhaustion ends work even if the latest diagnostic supports another
   correction. Capability tasks have the same problem. These are repair
   round allowances, not a uniform claim that exactly the third failed audit
   always terminates every path. Let the responsible architect assess the
   latest evidence and choose the next correction.
   Evidence: [policy.ts:22](../../subs/harness/src/run/policy.ts#L22),
   [service.ts:7389](../../subs/harness/src/run/service.ts#L7389),
   [service.ts:7392](../../subs/harness/src/run/service.ts#L7392),
   [service.ts:9444](../../subs/harness/src/run/service.ts#L9444),
   [service.ts:10844](../../subs/harness/src/run/service.ts#L10844).

3. **A failed final gate immediately fails the run.** The final gate invokes
   `fail` for any nonpassing verdict rather than returning diagnostics to an
   architect for further work. Requiring verification before completion does
   not require terminating the attempt to obtain it. Retain the failed
   result and continue repair and reassessment.
   Evidence: [service.ts:12059](../../subs/harness/src/run/service.ts#L12059).

4. **Reconciliation forbids repairs based on round and risk.** Three rounds
   are allowed; the first admits any risk, later repair requires at least
   medium risk, and the last round permits no repair. An easy low-risk fix
   can be refused in round two, or an important newly understood fix in the
   last round. Work can complete with open findings; repeated completion
   refusals can instead fail the run. Risk and repetition should inform the
   architect, not remove its correction choices.
   Evidence: [reconciliation.ts:237](../../subs/harness/src/reviews/reconciliation.ts#L237),
   [reconciliation.ts:347](../../subs/harness/src/reviews/reconciliation.ts#L347),
   [service.ts:1873](../../subs/harness/src/run/service.ts#L1873),
   [service.ts:2360](../../subs/harness/src/run/service.ts#L2360),
   [service.ts:7380](../../subs/harness/src/run/service.ts#L7380).

5. **Nonfunctional work has three rounds and one repair batch per round.**
   A partial repair consumes the batch. Exhaustion can turn unresolved
   requirements into deviations for human review; it does not prove further
   repair would be unproductive. Even an admitted external fix requiring
   final reassessment can be rejected because the allowance is spent.
   Preserve pending requirements and let the coordinator continue or request
   a genuinely missing decision.
   Evidence: [rounds.ts:61](../../subs/harness/subs/nonfunctional/src/rounds.ts#L61),
   [rounds.ts:108](../../subs/harness/subs/nonfunctional/src/rounds.ts#L108),
   [service.ts:4119](../../subs/harness/src/run/service.ts#L4119),
   [service.ts:4498](../../subs/harness/src/run/service.ts#L4498),
   [service.ts:4981](../../subs/harness/src/run/service.ts#L4981),
   [service.ts:12085](../../subs/harness/src/run/service.ts#L12085).

6. **Fork, readiness and transport retry counts replace diagnosis.** Architect
   forks have two retries; repeated partial results can exhaust their path.
   Readiness has two recoveries, and operation transport recovery has two
   automatic retries. Current operation recovery often pauses for an operator
   rather than failing, so these are not all terminal caps. They still impose
   intervention when Pi could inspect the failure or retry with a new reason.
   Readiness failures without a recognized obstruction can remain terminal.
   Delegate diagnosis and continuation instead of making the counter the
   deciding fact.
   Evidence: [policy.ts:24](../../subs/harness/src/run/policy.ts#L24),
   [policy.ts:176](../../subs/harness/src/run/policy.ts#L176),
   [service.ts:5203](../../subs/harness/src/run/service.ts#L5203),
   [service.ts:7588](../../subs/harness/src/run/service.ts#L7588),
   [service.ts:7965](../../subs/harness/src/run/service.ts#L7965),
   [service.ts:11902](../../subs/harness/src/run/service.ts#L11902),
   [service.ts:11937](../../subs/harness/src/run/service.ts#L11937).

7. **A sixth plan deviation crosses an arbitrary human-review threshold.**
   The default allows five deviations before the next waits for a person.
   The count is independent of whether the new deviation requires a user
   decision. Keep actual requirement changes within the user's authority,
   but determine that need from the conflict rather than its ordinal number.
   Evidence: [policy.ts:47](../../subs/harness/src/run/policy.ts#L47),
   [service.ts:8016](../../subs/harness/src/run/service.ts#L8016),
   [service.ts:8210](../../subs/harness/src/run/service.ts#L8210).

8. **Automatic preparation repair is restricted to one root repair invocation.**
   The path forces the verified root as the assignment base; the architect
   chooses included subtrees, but the captured scope cannot expand during
   repair. It prohibits module structure changes and rejects changed topology. A broken project
   that actually needs topology repair cannot use this automatic mechanism.
   External operator repair and resume exists, but that is an avoidable
   intervention. Let an architect choose scope and successive corrections
   based on the obstruction.
   Evidence: [service.ts:12321](../../subs/harness/src/run/service.ts#L12321),
   [service.ts:12489](../../subs/harness/src/run/service.ts#L12489),
   [service.ts:12533](../../subs/harness/src/run/service.ts#L12533),
   [service.ts:12594](../../subs/harness/src/run/service.ts#L12594),
   [preparation-recovery.test.ts:138](../../subs/harness/src/tests/preparation-recovery.test.ts#L138).

9. **Runtime compatibility requires byte-identical source groups and lockfile.** Every
   recovery contract incorporates the entire lockfile hash; source entries
   incorporate absolute paths. The authority contract covers entire run,
   steps and evidence source areas. Thus a dependency change, relocation or
   compatible implementation correction can fail compatibility. Declaring
   the runtime repair does not override this comparison, and restart repeats
   it. Compare the actual persisted interfaces and pending effects, support
   migration where needed, and requalify changed evidence. Whole-source
   equality is not a compatibility test.
   Evidence: [recovery-runtime.ts:25](../../subs/harness/src/run/recovery-runtime.ts#L25),
   [recovery-admission.ts:87](../../subs/harness/src/run/recovery-admission.ts#L87),
   [restart-runtime.ts:73](../../subs/harness/src/run/restart-runtime.ts#L73).

10. **Audit configuration repair is narrower than its own stated contract.**
    The compatibility function says executable lookup and cwd may be
    corrected, but only executable basenames are normalized. Cwd corrections
    therefore fail comparison even with a configuration declaration.
    Arguments also remain compared as check semantics. Distinguish a repair to execution from a change to required
    acceptance, using reassessment when the distinction needs judgment.
    Evidence: [recovery-admission.ts:55](../../subs/harness/src/run/recovery-admission.ts#L55),
    [recovery-admission.ts:94](../../subs/harness/src/run/recovery-admission.ts#L94).

11. **Restart excludes much of the unfinished work it should recover.** It
    requires accepted initial analysis and refuses unfinished capability
    tasks, engineer assignments, automatic root repair and active
    nonfunctional coordination. It reconstructs only selected local
    architect submission boundaries or the final gate. A recorded operator
    stop also cannot be superseded through this restart path by a later
    explicit restart request. Resume the retained task from durable facts,
    with explicit new user intent where relevant, instead of requiring the
    workflow to have stopped in one of a few convenient states.
    Evidence: [restart-import.ts:68](../../subs/harness/src/run/restart-import.ts#L68),
    [restart-import.ts:87](../../subs/harness/src/run/restart-import.ts#L87),
    [restart-import.ts:100](../../subs/harness/src/run/restart-import.ts#L100),
    [restart-import.ts:117](../../subs/harness/src/run/restart-import.ts#L117).

12. **Captured instructions and bound scenarios lack an adequate amendment path.**
    Recovery rejects changes to the captured instruction/plan package;
    final verification fails if captured documents changed. Deviation
    handling only rewords pending scenarios, never bound ones, and cannot
    amend context elements. This preserves old evidence by preventing new
    instructions from taking effect. Keep the original revision and its
    evidence, accept authorized revised instructions as a new revision, and
    invalidate/rebind only what the change affects.
    Evidence: [recovery-admission.ts:84](../../subs/harness/src/run/recovery-admission.ts#L84),
    [restart-import.ts:136](../../subs/harness/src/run/restart-import.ts#L136),
    [service.ts:11960](../../subs/harness/src/run/service.ts#L11960),
    [architecture/submission.ts:280](../../subs/harness/src/architecture/submission.ts#L280).

**Pi capabilities and ordinary work are restricted before judgment is possible.**

13. **Three invalid submissions or tool inputs exhaust an invocation.**
    Validation already returns corrective feedback, but a fixed count turns
    further correction into `invalid-submission`. Some scenario validation
    returns only its first error; general responses show at most 20 errors.
    Large submissions can spend their allowance discovering format rules.
    Placement failures can propagate to run failure. Continue the correction
    conversation and use repetition to improve the instructions or consult
    the architect.
    Evidence: [submissions.ts:145](../../subs/harness/src/run/submissions.ts#L145),
    [submissions.ts:206](../../subs/harness/src/run/submissions.ts#L206),
    [runner.ts:900](../../subs/harness/src/steps/runner.ts#L900),
    [service.ts:7663](../../subs/harness/src/run/service.ts#L7663).

14. **Roles lose ordinary investigation capabilities.** Most architect,
    selector and reviewer contexts receive only read/grep/ls plus selected
    harness operations. Architects cannot run diagnostic commands; engineers
    have no ordinary Git inspection tool, although coordinating architects
    receive one. Pi's available `find` tool is also omitted by these loadouts.
    Read-only implementation authority does not imply inability to compute,
    inspect Git or query the toolchain. Restore all standard tools by default;
    require a specific reason for each denial and select only specialized
    operations according to the task.
    Evidence: [runner.ts:962](../../subs/harness/src/steps/runner.ts#L962),
    [steps/run.ts:472](../../subs/harness/src/steps/run.ts#L472),
    [engineer-equipment.ts:31](../../subs/harness/src/work/engineer-equipment.ts#L31),
    [initial-architect.system.md:13](../../subs/harness/src/prompts/initial-architect.system.md#L13),
    [git-inspection.ts:14](../../subs/harness/src/work/git-inspection.ts#L14).

15. **Pi extensions, skills, context discovery and native tools are disabled wholesale.**
    Session construction sets `noExtensions`, `noSkills`, `noPromptTemplates`,
    `noContextFiles`, `noTools: 'all'` and `noThemes`, then supplies the harness
    toolset. Hooks are replaced too. Themes are incidental; losing project
    context, skills, extensions and useful tools is operationally significant.
    A feature-specific integration issue should not become global suppression.
    Integrate the relevant Pi facilities and identify actual incompatibilities.
    Evidence: [pi/session-operations.ts:223](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L223),
    [pi/session-operations.ts:248](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L248).

16. **Exact prefix preservation restricts basic execution to one provider and SDK version.**
    The implementation requires Pi and nested pi-ai 0.87.1, the OpenAI Codex
    Responses provider/API and particular compatibility flags. Restored model
    identity cannot change; exact request/prefix checks reject drift. SSE and
    zero provider retries are imposed. Model selection looks more general
    than the session implementation permits. Record the limits of exact
    continuation separately from ability to perform the task; support a
    fresh context when preservation is unavailable, without silently changing
    the selected model or claiming preserved history.
    Evidence: [preservation.ts:105](../../subs/harness/subs/agent/subs/pi/src/preservation.ts#L105),
    [preservation.ts:129](../../subs/harness/subs/agent/subs/pi/src/preservation.ts#L129),
    [pi/session-operations.ts:62](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L62),
    [pi/session-operations.ts:183](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L183),
    [pi/session-operations.ts:292](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts#L292).

17. **Shell rejects whole suites and all unprepared Cucumber selections.**
    The harness parses shell commands and refuses recognized whole-suite
    Vitest/Cucumber calls and watch mode. Cucumber execution must match the
    current prepared command; an agent's own focused selection, changed
    options or stale prepared source can be refused. This obstructs diagnosis
    without establishing anything about correctness. Suggest efficient
    commands; allow exploratory execution and keep its results distinct from
    the audit evidence used for acceptance. The handwritten shell classifier
    also cannot reliably cover every equivalent shell spelling.
    Evidence: [shell.ts:197](../../subs/harness/src/tools/shell.ts#L197),
    [shell.ts:247](../../subs/harness/src/tools/shell.ts#L247),
    [shell-tests.ts:119](../../subs/harness/src/tools/shell-tests.ts#L119),
    [shell-tests.ts:140](../../subs/harness/src/tools/shell-tests.ts#L140).

18. **The shell silently loses much of the working environment.** Arbitrary
    engineer commands inherit a fixed variable allowlist and three prefixes;
    `NODE_OPTIONS` is expressly withheld. Project-specific configuration,
    proxy variables or credentials needed by an authorized command can be
    absent. The comments explicitly describe a shell-specific alternative as
    an unresolved decision, not a user-approved prohibition. Provide the
    intended project environment and supported per-command additions, with
    values kept out of logs; do not require a harness code change for ordinary
    project configuration.
    Evidence: [run-command.ts:125](../../subs/harness/subs/evidence/src/run-command.ts#L125),
    [shell.ts:22](../../subs/harness/src/tools/shell.ts#L22),
    [shell.ts:260](../../subs/harness/src/tools/shell.ts#L260).

19. **Silence and output volume can kill useful commands.** The shell's quiet
    interval defaults to two minutes; its normal selectable maximum is ten
    minutes, with assignment policy capped at thirty minutes. Output extends
    the interval: this is not an absolute lifetime cap. Nevertheless, the
    executor kills on silence without first obtaining Pi's assessment, and
    buffered output exceeding 128 MiB fails execution. Allow Pi to inspect or
    extend a quiet command and stream output to an artifact instead of making
    buffer size an execution limit.
    Evidence: [shell.ts:43](../../subs/harness/src/tools/shell.ts#L43),
    [policy.ts:48](../../subs/harness/src/run/policy.ts#L48),
    [assignment.ts:497](../../subs/harness/src/work/assignment.ts#L497),
    [run-command.ts:237](../../subs/harness/subs/evidence/src/run-command.ts#L237).

20. **Write scope and special-file authorization require ending the current assignment.**
    Scope is captured once; extra locations are individual files and ordinary
    assignment authorization lasts one iteration. Configuration files need
    separate explicit authorization. Feature files, captured documents and
    `ramify-agent.json` are categorically unavailable to engineer edits.
    Ownership failure can deny a write unless historical authority exists.
    The guard directs Pi to report the need rather than amend the assignment
    in place. Multi-target writes are unsupported. Module responsibilities
    and harness-owned state are explicit project requirements; these rigid
    amendment mechanics are additional choices. Let the responsible architect
    amend an assignment while retaining the engineer's context and candidate.
    Evidence: [scope.ts:23](../../subs/harness/src/work/scope.ts#L23),
    [assignment.ts:100](../../subs/harness/src/work/assignment.ts#L100),
    [assignment.ts:145](../../subs/harness/src/work/assignment.ts#L145),
    [write-guard.ts:86](../../subs/harness/src/guard/write-guard.ts#L86),
    [write-guard.ts:132](../../subs/harness/src/guard/write-guard.ts#L132),
    [write-guard.ts:208](../../subs/harness/src/guard/write-guard.ts#L208).

21. **Accepted child creation can lose its authority at assignment construction.**
    Capability assignment paths still supply `bootstrap: []`. The historical
    projections extraction encountered successful preflight followed by a
    refused declaration write; the qualified correction described there is
    not present at these current construction sites. Carry the architect's
    accepted creation decision through to the engineer instead of making it
    negotiate a second, contradictory restriction.
    Evidence: [service.ts:9070](../../subs/harness/src/run/service.ts#L9070),
    [service.ts:9763](../../subs/harness/src/run/service.ts#L9763),
    [historical F3](2026-10-14-projections-extraction-postmortem.md).

22. **Consultation requires exact inherited context and follows a fixed role path.**
    Consultation forks are read-only, have no shell, cannot act on the
    assignment, and specify `allowFreshFallback: false`. Missing settled
    context makes consultation unavailable. The topology is engineer to local
    architect to global architect; a capability architect consultation has no
    corresponding onward global consultation through this mechanism. An
    uncertain previous result is not retried implicitly. Supply a fresh
    advisory context when needed, reconcile uncertain results, and provide
    a way for the responsible architect to enact its correction.
    Evidence: [consultations/tools.ts:44](../../subs/harness/src/consultations/tools.ts#L44),
    [consultations/tools.ts:74](../../subs/harness/src/consultations/tools.ts#L74),
    [consultations/targets.ts:32](../../subs/harness/src/consultations/targets.ts#L32),
    [consultations/targets.ts:63](../../subs/harness/src/consultations/targets.ts#L63).

23. **Architects cannot persist authorized tracking incrementally.** The
    local architect's registrations, reports and planning changes are bundled
    into a terminal submission. It has no equivalent nonterminal operations
    for recording a decision and continuing its investigation. This is an
    explicit gap against the adopted architect tracking-authority principle.
    Provide small harness-owned operations with normal revision handling.
    Evidence: [local-architect.ts:234](../../subs/harness/src/steps/local-architect.ts#L234),
    [work/submission.ts:97](../../subs/harness/src/work/submission.ts#L97),
    [work/obligations.ts:40](../../subs/harness/src/work/obligations.ts#L40),
    [architect tracking principle](../harness.principles.md#architects-can-update-plans-and-tracking-without-writing-code).

24. **Mutation checks serialize each edit and command.** A mutation holds
    the shared lease through post-write checks. Unknown or large change sets
    can trigger complete checks; completion adds another check. This is
    latency and coordination friction, not a requirement that every edit
    leave the project valid: findings explicitly allow further editing.
    Consider coherent edit batches or deferred diagnostics instead of forcing
    every small mutation through the same synchronous cycle.
    Evidence: [engineer-equipment.ts:369](../../subs/harness/src/work/engineer-equipment.ts#L369),
    [post-write.ts:312](../../subs/harness/src/hooks/post-write.ts#L312),
    [post-write.ts:601](../../subs/harness/src/hooks/post-write.ts#L601).

**Submission rules prescribe how Pi must think and represent its work.**

25. **Initial decomposition and scenario mapping are prescribed mechanically.**
    The prompt demands one work item per entry capability. Each scenario
    names one entry; every entry needs a scenario. A plan scenario may be
    assigned to one entry, but classifying it as an integration scenario
    requires sub-scenarios, with every integration step copied verbatim into
    one. The prompt directs multi-entry scenarios into this latter form.
    A valid end-to-end acceptance case can therefore require
    artificial decomposition and duplicated text before analysis is accepted.
    Preserve coverage and origins while allowing the architect to choose the
    useful work and acceptance decomposition.
    Evidence: [initial-analysis.procedure.md:51](../../subs/harness/src/prompts/initial-analysis.procedure.md#L51),
    [scenarios/form.ts:193](../../subs/harness/subs/scenarios/src/form.ts#L193),
    [scenarios/form.ts:255](../../subs/harness/subs/scenarios/src/form.ts#L255).

26. **Acceptance must fit the initial scenario or registered-test schema.**
    Every entry acceptance reference must already be cited by a scenario or
    declared nonbehavioral with a registered test. Structured scenario input
    must be a single Scenario/Scenario Outline unit; extraction recognizes
    fenced Gherkin. Parsing structured Gherkin is useful, but these format
    choices should not decide whether another valid expression of a
    requirement can be carried forward. Preserve the semantic requirement
    and let the responsible agent translate it into executable acceptance.
    Evidence: [scenarios/form.ts:276](../../subs/harness/subs/scenarios/src/form.ts#L276),
    [scenarios/form.ts:327](../../subs/harness/subs/scenarios/src/form.ts#L327),
    [scenarios/extraction.ts:65](../../subs/harness/subs/scenarios/src/extraction.ts#L65),
    [initial-analysis.procedure.md:121](../../subs/harness/src/prompts/initial-analysis.procedure.md#L121).

27. **Catalog classification and turn ownership become hard content gates.**
    Functional/context elements can come only from plan documents; fixed
    elements only from principle documents. Intake, principle extraction and
    initial analysis each reject kinds assigned to another turn. A required
    missing reference is rejected as invalid intake instead of being an
    accepted account of missing information. Keep provenance, but let agents
    revise classifications and acquire missing material without consuming
    submission failures for reporting the problem accurately.
    Evidence: [catalog.ts:17](../../subs/harness/subs/plan-evidence/src/interfaces/catalog.ts#L17),
    [analysis/extraction.ts:187](../../subs/harness/src/analysis/extraction.ts#L187),
    [analysis/extraction.ts:201](../../subs/harness/src/analysis/extraction.ts#L201),
    [analysis/submission.ts:218](../../subs/harness/src/analysis/submission.ts#L218).

28. **Identifiers and citations inherit avoidable representation restrictions.**
    Capability names must fit lowercase ASCII slugs; `integration` is
    reserved because of feature-file naming. Initial-analysis symbol citations must name an
    exported original recorded in the architect view. Useful private,
    inherited or not-yet-materialized symbol evidence is rejected, although
    a file-only citation is possible. Separate storage filenames from domain
    identifiers and permit source citations with their actual provenance.
    Evidence: [analysis/records.ts:24](../../subs/harness/src/analysis/records.ts#L24),
    [analysis/submission.ts:283](../../subs/harness/src/analysis/submission.ts#L283),
    [analysis/submission.ts:420](../../subs/harness/src/analysis/submission.ts#L420).

29. **A new owner or external capability is treated as changing no existing symbols.**
    `changesExistingSymbols: true` is rejected for an external capability or an
    owner absent from the current architect view. That may describe the new
    owner's own symbols, but it cannot establish that introducing the
    capability changes no existing consumer or integration symbol. Clarify
    the field's scope and accept the architect's account of affected symbols
    rather than infer it from owner existence.
    Evidence: [architecture/submission.ts:482](../../subs/harness/src/architecture/submission.ts#L482).

30. **Architect plans must fit rigid stage and decision layouts.** Staged
    outlines require at least two stages and reject later-stage dependencies;
    assignments must select the prescribed stage index. Placement decisions
    bundle registry and hypothesis changes into one submission. Unresolved
    guidance is limited to ten constraints of 400 characters each. These
    restrictions force bookkeeping or compression without showing that the
    proposed work is invalid. Accept evolving goals/dependencies and store
    the architect's full explanation.
    Evidence: [work/submission.ts:377](../../subs/harness/src/work/submission.ts#L377),
    [assignment.ts:476](../../subs/harness/src/work/assignment.ts#L476),
    [architecture/submission.ts:182](../../subs/harness/src/architecture/submission.ts#L182),
    [architecture/submission.ts:259](../../subs/harness/src/architecture/submission.ts#L259).

31. **Context selection cannot request arbitrary relevant catalog material.**
    The selector accepts only predefined nonfunctional/fixed/recommendation
    kinds, with per-element rationale fields. It cannot use that same
    mechanism to request functional/context elements outside the entry's
    package. Source reads remain available, so this is a delivery limitation,
    not a global reading ban. Let the agent request any relevant captured
    material and treat context size as guidance.
    Evidence: [context-selection/submissions.ts:24](../../subs/harness/src/context-selection/submissions.ts#L24),
    [context-selection/submissions.ts:83](../../subs/harness/src/context-selection/submissions.ts#L83),
    [local-architect.ts:225](../../subs/harness/src/steps/local-architect.ts#L225).

32. **Reviews have hard finding and coverage cardinalities.** One submission
    allows 20 concerns, 500 inspected paths and 500 missing paths, but every
    changed path must appear exactly once. A fully inspected 501-file diff
    cannot be reported honestly as fully inspected; a diff over 1,000 files
    cannot be represented at all. The 21st real concern cannot be included.
    Add incremental submission/pagination rather than rejecting coverage or
    findings because the candidate is larger than anticipated.
    Evidence: [reviews/interfaces/submissions.ts:37](../../subs/harness/subs/reviews/src/interfaces/submissions.ts#L37),
    [reviews/submission.ts:43](../../subs/harness/subs/reviews/src/submission.ts#L43),
    [reviews/submission.ts:70](../../subs/harness/subs/reviews/src/submission.ts#L70).

33. **Review grounds require a particular read tool in the current attempt.**
    A complete delivered patch can establish inspected coverage, but cannot
    establish a nonnull ground: that requires `snapshot_read` during this
    attempt. Prior conversation, search and patch evidence are explicitly
    excluded. A null ground is allowed, so the concern need not disappear,
    but useful evidence is demoted or a redundant read is forced. Design
    review also prescribes rereading guidance. Recognize the evidence already
    available at the relevant revision rather than demand a ritual tool call.
    Evidence: [reviews/submission.ts:58](../../subs/harness/subs/reviews/src/submission.ts#L58),
    [reviews/submission.ts:86](../../subs/harness/subs/reviews/src/submission.ts#L86),
    [design-review.procedure.md:4](../../subs/harness/src/prompts/design-review.procedure.md#L4).

34. **Snapshot limits prevent some source investigation.** `snapshot_read`
    refuses a file over 512 KiB even when a small line range is requested.
    Search is suggested instead, but does not satisfy the ground rule above.
    Patches are clipped at 262,144 JavaScript string code units without a patch
    continuation cursor, yet the path is marked inspected. Stream or paginate
    the file and patch; report partial coverage explicitly.
    Evidence: [snapshot.ts:116](../../subs/harness/subs/reviews/src/snapshot.ts#L116),
    [snapshot.ts:207](../../subs/harness/subs/reviews/src/snapshot.ts#L207),
    [snapshot.ts:269](../../subs/harness/subs/reviews/src/snapshot.ts#L269).

35. **Review prompts prohibit findings outside their assigned lens.** Scope
    and design review exclude correctness concerns; code review excludes
    some other categories. A reviewer can discover a useful problem but be
    told to omit it because another role is supposed to find it. Keep the
    lenses as attention guidance and accept actionable findings with category
    metadata.
    Evidence: [code-review.procedure.md:14](../../subs/harness/src/prompts/code-review.procedure.md#L14),
    [scope-review.procedure.md:15](../../subs/harness/src/prompts/scope-review.procedure.md#L15),
    [design-review.procedure.md:13](../../subs/harness/src/prompts/design-review.procedure.md#L13).

36. **Reconciliation requires a complete bounded disposition package.** Limits
    include 50 relations, 100 dispositions, 20 evidence entries per relation, 20 conflict
    citations and 2–10 user options; every attention item needs a disposition
    in the terminal answer. This prevents dealing with one urgent finding
    while retaining the rest as pending, and can make a large attention set
    unsubmitable. Accept incremental dispositions and questions expressed in
    the form actually needed.
    Evidence: [reconciliation.ts:92](../../subs/harness/src/reviews/reconciliation.ts#L92),
    [reconciliation.ts:333](../../subs/harness/src/reviews/reconciliation.ts#L333),
    [reconciliation.procedure.md:49](../../subs/harness/src/prompts/reconciliation.procedure.md#L49).

37. **Escalation requires a literal conflict quote.** A user-decision request
    is rejected unless its conflict text appears verbatim in a current
    catalog element or source file. A semantic contradiction may require
    explaining the relationship between passages, not locating one matching
    substring. Verify supplied quotations as quotations, but let an agent
    explain the conflict with source references and uncertainty.
    Evidence: [reconciliation.ts:397](../../subs/harness/src/reviews/reconciliation.ts#L397).

38. **Finding records inherit arbitrary prose and batch caps.** CheckFinding
    interfaces limit prose to 4,000 characters, references to 500, evidence,
    locations and modules to 50, and command/event batches to 100. Review
    concerns also require multiple bounded prose fields. These are transport
    and presentation choices, not limits on how much evidence can exist.
    Persist large material as referenced artifacts and support batches;
    return useful correction feedback without exhausting the agent's turn.
    Evidence: [check-findings interfaces:21](../../subs/harness/subs/check-findings/src/interfaces/check-findings.ts#L21),
    [check-findings/records.ts:19](../../subs/harness/src/check-findings/records.ts#L19),
    [check-findings/transition.ts:140](../../subs/harness/src/check-findings/transition.ts#L140),
    [reviewConcernSchema:17](../../subs/harness/subs/reviews/src/interfaces/submissions.ts#L17).

39. **Contract and completion variants constrain legitimate evidence combinations.**
    Fake-backed contracts require a prescribed artifact set; access-only
    contracts disallow fake/conformance combinations. Engineer completion
    requires formal bindings for every assigned obligation, and `unsuitable`
    has only three reasons. Fake names are length-bounded and must carry
    literal `Fake`. Contract fake files also need a `.fake` suffix, reject
    default exports, and require exported and re-exported names to carry
    `Fake`. The principle asks for explicit recognizable fake names;
    these validators add particular spelling and export requirements.
    The broader issue is treating representational variants as a complete
    model of possible work. Let the architect judge evidence combinations
    and keep incomplete obligations pending without forcing inaccurate labels.
    Evidence: [contracts/submission.ts:111](../../subs/harness/src/contracts/submission.ts#L111),
    [work/engineer.ts:60](../../subs/harness/src/work/engineer.ts#L60),
    [work/engineer.ts:214](../../subs/harness/src/work/engineer.ts#L214),
    [obligations.ts:104](../../subs/harness/src/work/obligations.ts#L104),
    [contracts/naming.ts:19](../../subs/harness/src/contracts/naming.ts#L19),
    [fake naming principle](../harness.principles.md#fakes-are-explicitly-named).

40. **Prompt-only instructions further narrow otherwise possible work.**
    Engineer procedure mandates a read/edit/test/submit sequence, prescribes
    where step definitions go, and says to return contradictory verification
    instructions to the architect rather than resolve them with available
    commands. These are not all hard runtime denials. Together with the tool
    restrictions they cause avoidable handoffs. Express efficient defaults
    and the required outcome, allowing Pi to choose the investigation order
    and verification needed for its assignment.
    Evidence: [engineer.procedure.md:2](../../subs/harness/src/prompts/engineer.procedure.md#L2),
    [engineer.procedure.md:23](../../subs/harness/src/prompts/engineer.procedure.md#L23),
    [engineer.procedure.md:48](../../subs/harness/src/prompts/engineer.procedure.md#L48).

**Additional restrictions affect administrative Pi sessions, not plan execution.**

41. **Beads administration has its own artificial continuity and inspection limits.**
    It requires a particular inherited fork with no fresh fallback, forbids
    compaction, supplies only administrative tools, and times out by default
    after 120 seconds. Existing issue bindings are fixed at start, search
    returns 20 results without pagination, and the tracker workspace rejects
    symlinks and redirects. An uncertain update can remain pending even when
    the desired status is observed but its marker is missing. The current
    code isolates these failures from the main run, correctly avoiding a
    plan blocker; they can still strand the administrative task. Allow fresh
    context, normal compaction, adequate inspection and reconciliation.
    Keep the user's explicit restrictions on tracker creation, synchronization
    and remote writes distinct from these extra implementation choices.
    Evidence: [beads-sessions.ts:80](../../subs/harness/src/run/beads-sessions.ts#L80),
    [beads-sessions.ts:118](../../subs/harness/src/run/beads-sessions.ts#L118),
    [beads-sessions.ts:168](../../subs/harness/src/run/beads-sessions.ts#L168),
    [beads-tools.ts:28](../../subs/harness/src/run/beads-tools.ts#L28),
    [beads-tools.ts:79](../../subs/harness/src/run/beads-tools.ts#L79),
    [beads-tools.ts:127](../../subs/harness/src/run/beads-tools.ts#L127).

**Historical evidence and corrections to avoid overstating the findings.**

The [projections extraction postmortem](2026-10-14-projections-extraction-postmortem.md)
records actual instances of the iteration ceiling, refusal of a qualified
runtime fix, lost child bootstrap authority, and verification demands exceeding
the engineer's tools. Its F1–F4 support those historical consequences. They do
not establish that every other restriction above has already caused a paid run
to fail. Earlier recommendations in that postmortem to preserve particular
restrictions are not treated here as proof of necessity.

The current main-run policy permits native Pi compaction and has null token
budgets. Historical 400-invocation/eight-hour fields remain, but current
continuity paths do not enforce them as global stop conditions. Legacy
`context-budget-reached` terminal branches exist; the current wrapper handles
resource recovery, and no current production emission was established. These
are not counted as active termination mechanisms above.
Evidence: [policy.ts:97](../../subs/harness/src/run/policy.ts#L97),
[service.ts:815](../../subs/harness/src/run/service.ts#L815),
[service.ts:4892](../../subs/harness/src/run/service.ts#L4892),
[service.ts:5174](../../subs/harness/src/run/service.ts#L5174).

Read scope is soft: excursions are permitted and recorded. Post-write findings
allow continued edits. Shell writes bypass the pre-write guard and are
observed afterward, so builtin write restrictions do not establish a consistent
execution boundary. Complete audit reports and shell outputs have artifact
locations; bounded prompt excerpts alone do not establish evidence loss.
Evidence: [runner.ts:915](../../subs/harness/src/steps/runner.ts#L915),
[post-write.ts:601](../../subs/harness/src/hooks/post-write.ts#L601),
[shell.ts:30](../../subs/harness/src/tools/shell.ts#L30),
[diagnostics.ts:379](../../subs/harness/src/checks/diagnostics.ts#L379).

Explicit repository instructions about harness-owned durable writes, generated
views, dependency direction, ordinary-test process boundaries and tracker
remote changes were not reclassified as invented merely because their
implementation restricts an action. Their actual authorization remains the
user's instructions. Likewise, an unreadable record needs a diagnostic, and
an unfinished operation needs its effects reconciled; neither observation
automatically justifies terminal failure, a fixed retry count or permanent
loss of a useful tool.

**Direction for correction.** Remove arbitrary count-based termination first,
including repair and reconciliation limits. Return failed final verification
to the responsible architect. Make compatible runtime repair and retained-task
restart work across the actual unfinished states. Then remove shell refusals
and restore all standard Pi tools by default, replace submission attempt quotas
with continued feedback, and make plans, scopes and evidence incrementally
amendable. Do not replace these restrictions with a new approval registry or
another layer of exceptions.

Only this analysis file was added. Runtime code was not changed, tests or live
plans were not run, and nothing was committed or pushed. Source references and
the report's local links were checked; the inventory groups related rules
rather than claiming every `throw` or schema field is an independent defect.
