# Harness Specification

**Status:** Proposed. The whole-tree scope and verification rules adopted on
2026-10-01 are normative design decisions; their implementation remains pending.

## Purpose

Specify the scope, verification, preparation and session behavior governed by
the [harness principles](harness.principles.md),
[harness recovery principles](harness-recovery.principles.md) and the
[shared](prompt-optimization.principles.md),
[engineer](prompt-optimization-engineer.principles.md),
[plan architect](prompt-optimization-plan-architect.principles.md) and
[module architect](prompt-optimization-module-architect.principles.md)
prompt optimization principles. The principles remain
applicable alongside these detailed contracts.

Recovery uses ordinary task restart under the principles clarified on 2026-10-18.

## Specification

### Role Names

The [glossary](glossary.md#plan-architect) defines **plan architect**,
**module architect**, **module engineer** and **capability architect**.
A module architect serves one module work item; it is not a permanent owner
of every task in that module. Its architectural visibility can span the project.
A module engineer can receive work from a module architect or a capability
architect. Contract work and non-functional repair describe assignments rather
than additional module engineer identities.

Initial analysis and later placement decisions are tasks of the plan architect.
Current prompts and UI labels use these role names. Stored protocol values and
CLI role selectors map to them:

| Stored role | Role name |
| --- | --- |
| `initial-architect`, `global-fork` | Plan architect |
| `local-architect` | Module architect |
| `engineer`, `contract-engineer`, `nonfunctional-repair-engineer` | Module engineer |
| `capability-architect` | Capability architect |

Historical evidence retains the names actually recorded. The toolkit's
module-architect skill and its glossary retain their upstream terminology under
the snapshot's [provenance](../skills/module-architect/PROVENANCE.md).

### Semantic Identities

Initial analysis proposes draft keys for functional requirements, context,
entry capabilities, hypotheses and scenarios in its ordinary submission. The
harness validates the complete submission and commits the accepted catalog,
entry assignments, hypotheses, capability records, initial work items and
scenarios in one accepted transition. Submission fields identify their reference
family and stage. Accepted records carry the namespace and descriptive name as
their actual ID; no separate registration call or reservation precedes
acceptance. Catalog replacement records retirement and replacement relationships
under the catalog checker's existing authority. The [catalog specification](architecture/plan-context-catalog.spec.md)
and [scenario contract](architecture/acceptance-scenarios.md) define source and
wording authority.

An agreement submission proposes `contractKey`, `providerObligationKey` and
`consumerRequirementKey` as draft keys in the ordinary contract task. Acceptance
resolves them in its existing transaction; a revision keeps accepted identities,
while a newly attached consumer receives its own requirement identity. Records
use contract `/3`, provider obligation `/2`, consumer requirement `/2` and
work-item `/2` shapes. Record paths encode their IDs. The capability run captures
the contract engineer and module architect's provider-yield action when an
engineer names an existing capability whose provider agreement is needed.

Public analysis entries expose `functionalRequirementIds`,
`functionalAcceptanceIds` and `contextIds`. A work item detail resolves those
accepted IDs against the frozen catalog and includes each selected element's
full text, conditions, source document and uncertainty. Public work, scenario,
contract and finding readers use current record versions and select by exact
accepted ID, including its namespace; HTTP paths encode it as one segment.
An unavailable recorded format yields an inspectable query or command error;
the harness leaves its durable bytes intact.

An engineer proposes capability request and example draft keys in submission
`/2`; qualification proposes a task draft key. Acceptance records request,
task, plan, exchange and handback `/2` with the same accepted relationships.
A later placement submission supplies `requestKey: draft:placement-request:<name>`;
acceptance removes `draft:` and records that exact `placement-request:<name>`
identity in `/2`. A repeated request must propose a distinct key, and an
occupied key is rejected. Its global decision derives
`placement-decision:placement-<name>` from the accepted request. A decision on
an accepted `unresolved-request:<name>` instead derives
`placement-decision:unresolved-<name>`. Derived provider, revision and
integration work items use `/2`; a final correction proposes its work item
name. A module architect proposes `draft:test:<name>` in each required-test
registration; acceptance records `test:<name>` and derives each registered
capability case from its
accepted task and case source with a stable collision-safe discriminator.
Registration, binding, reporting and reload preserve those accepted IDs.

### Forecast Early; Decide with Current Evidence

When a concrete need arises, reuse the responsible agent's oriented context
with the new evidence, through continuation or a fork carrying accumulated
decision briefs. It considers the immediate need alongside forecast needs
elsewhere, earlier decisions and current findings. Anticipated consumers inform
the design, but their requirements remain provisional until examined during
their own work. Considering them does not by itself coordinate their execution.

### Every Agent Scope Is a Cut on the Module Tree

A module assignment covers its owned contents, including configuration,
documentation, scratch and owned-unwired trees, except its
owned-nested-project trees. Child subtrees and owned-nested-project trees
require explicit inclusion, each as a whole. External trees are never
writable in the enclosing run. Guarded configuration remains
an authorization restriction within ownership; owning a file does not waive
that restriction.

Current ownership normally establishes placement before each intercepted
write. If acquisition is invalid, incomplete, unavailable or unsupported, an
engineer may temporarily repair within a previously verified, durably recorded
assignment boundary. This historical-authority exception permits work; it does
not establish current ownership or successful analysis. The recorded boundary
identifies the project, provider, acquisition input, canonical region, exclusions,
included trees and guarded-file authorizations. Successful placement observations
are retained as content-addressed evidence with settled ledger references before
their admission decisions. The complete assignment identity binds those records;
failure diagnostics themselves carry no authority.

Historical admission preserves previously observed refusals and narrowing. It
cannot include a foreign child, excluded tree, unapproved module creation or
unauthorized configuration. Logical and physical targets must still satisfy the
recorded boundary and protections against symlink or directory redirection,
dependencies, generated views, repository metadata and harness state. A current
answer refusing a target remains a refusal; cancellation admits no write. Missing
recorded authority is explicit, while corrupt authority is a harness failure.
Assignments without the captured boundary are refused with a diagnostic naming
the required current write-scope form.

The issuing architect names each included tree with a reason and instructions
for its meaning. An included owned-nested-project tree is excluded from Ramify
source checks; its own instructions and commands apply from its root. Substantial work on that project belongs in
a run rooted there. A module engineer needing a scope expansion asks its architect;
excluded analysis never creates write authority.

A module engineer's default working directory and code-search root are the assigned
module's `src/`, including its tests and interface vocabulary. Work on auxiliary
source and other owned contents uses their actual locations within the authorized
scope. Expanding reads is deliberate navigation; the harness checks write
authority separately. A directory layout alone does not control write access.
A production-only search excludes testing-classified source: `src/tests/` and
the ordinary `src/` of modules tagged `testing`.

Before launching work intended for `src/`, the harness creates that directory
if absent. Work on the module's own tests uses `src/tests/` without entering
child implementations; the harness creates that directory if needed. It must
not substitute the module root or a child module for either source location.

### Verification Follows Scope And Audit Policy

Verification executes the project's configured checks through ramify-audit.
For committed partial audits, impact selection comes from Ramify and the
project's audit policy; inert and excluded paths need not select their owner.
Detected shared inputs and explicitly listed undetected configuration files
follow the provider's full-audit policy. The harness records complete audit
results and preserves producer verdicts. The responsible architect evaluates
implementation, tests and relevant audit diagnostics and declares whether a
registered requirement is correctly implemented and passing. The harness
trusts that declaration and asks the architect about missing reports; it does
not match declarations or references to test files or execution results.
Final verification is a full audit of the configured suite, including required
nested projects. Architect declarations and that audit result remain separate.

Candidate acceptance requires fresh current ownership and the required check
and audit evidence for all candidate changes, including shell mutations. A
historically admitted edit is insufficient. Unavailable placement is recorded
separately from demonstrated outside-scope changes and execution failure. An
established invalid project returns repairable diagnostics without an acceptance
commit; infrastructure unavailability uses bounded handling and, for runs
capturing operation recovery, the durable recovery contract below. Ownership
and source analysis can recover independently;
neither alone satisfies acceptance.
A successfully observed empty mutation set needs no path-ownership query and
records empty outside-scope and unknown-placement lists without an acquisition
failure or provider answer. An unavailable mutation observation retains its
failure and is never evidence that no paths changed. Nonempty unresolved targets
retain unknown placement even when no physical target can be queried; nonempty
queries still require answers for exactly their requested paths. An empty turn
does not qualify accumulated candidate changes or waive the committing gate's
explicit current project-ownership preflight.
An owned-unwired tree is verified by its owner's tests; an included
owned-nested-project tree needs its own nested audit at the plan's final
gate, and each project's audit result is preserved separately.
Ownership, source classification and configured test execution are distinct.
A not-analyzed path is never presented as passing source analysis.

### Scratch Has The Iteration's Lifetime

The harness ensures module scratch directories are ignored by Git before use.
It adds missing rules to the project's `.gitignore`, preserving existing rules
and avoiding duplicates, including when new modules are introduced. This is
harness setup responsibility, independent of a module engineer's module write scope.

The harness creates the assigned module's scratch directory within its scope.
Scratch survives for as long as the iteration that generated it remains open,
including repairs, suspension for nested capability work and interrupted-iteration
resumption. Closing another iteration never removes that scratch. At closure,
the harness removes scratch from modules with no iteration still open, whatever
the closing outcome. It preserves and reports any paths in Git's index instead
of deleting them. Readiness first checks all scratch for tracked paths and stops
without deleting anything if any exist; otherwise it removes scratch left by an
earlier run. Evidence that must survive belongs in durable results or evidence
records, not scratch. The project remains responsible for compiler exclusions
that keep scratch out of builds.

### A Module Carries Its Own Onboarding

The launcher supplies the module description, relevant documentation and
permitted contracts as initial context.

Each ordinary task brief supplies the task's current goal, applicable cited elements,
known module/API/test pointers and declared check/configuration
pointers from the caller's existing records. Relevance follows the role, task
and assigned scope in the existing briefing constructors. The agent decides
what to read and explores for additional information. Inapplicable or unavailable
optional information is omitted; there is no required-input matrix or new
completeness gate. Review pointers use the candidate snapshot; module tasks
use their working-directory conventions.

Work orientation receives the work item's own functional, acceptance and context
elements, then asks the module architect to explore its module before submitting.
The context selector forks that point with selectable elements and its current
instruction, retaining inherited support sections without redelivering them.
The assignment turn continues with the selected package and explores further
as needed. A fresh selector or architect receives the ordinary full task inputs.

### Fakes Are Explicitly Named

Fake implementation files use a `.fake` suffix before the language extension,
such as `send-email.fake.ts`. Exported fake implementations, factories and
classes include `Fake` in their names, such as `createSendEmailFake`.
Re-exports preserve that designation rather than exposing a fake under a
production-looking name.

Shared contracts keep behavior-oriented names, such as `SendEmail`, because
both the fake and the real provider implement them. The implementing
assignment and its gate check the naming convention when a fake is used.

### Explicit Generated Feature Evidence

An architect may select exact generated files independently of completion
obligations with `assignment.featureSelection: { files, reason }`. Each file
is a normalized project-relative `.feature` path in the current run's scenario
registry. Unknown, stale, duplicate, dynamic or outside-project selections are
refused with the field and an actionable reason. The selection retains its
rationale, assignment coordination and design record. Project authority permits
consumer feature evidence beyond provider source write scope; selection changes
no write permission, generated feature protection or acceptance authority.

Explicit files and files of assigned scenario obligations form the exact
selection. Scenario pointers and filenames in prose select nothing. A capability-only
obligation can carry explicit files without registering another obligation or
completing a consumer's scenarios. Live preparation, captured inputs and
standalone rendering/execution use this meaning. Authored standalone assignments
without the run's registry cannot select generated features: derive their inputs
from the run instead. Omitted selection with no scenario obligation receives an
explicit unavailable explanation and no guessed command.

For a supported literal declared Cucumber command, the dedicated focused profile
replaces broad paths, clears tag/name/shard filters and dry-run, and enables
selected pending scenarios. It retains effective globally loaded support,
World configuration, loaders and declared environment. The command states its
pending-tag handling and loaded support. Unsupported declarations retain their
limitation. Selected generated bytes, authored configuration/package inputs and
the generated profile retain SHA-256 identities; dispatch revalidates bytes and
selected paths' project containment before execution. Changed input must be
prepared again. Success with zero executed cases establishes no acceptance;
ambiguous, undefined, failed and unrun results remain evidence with their actual
status and limitations for the responsible architect's assessment.

### A Small Closed Set of Outcomes Is the Whole Protocol

The capability architect distinguishes immediate provider/caller conformance,
required composed acceptance within the delegated task and broader consumer
acceptance outside it. It records this division and its reason in the existing
capability plan's decisions, consulting the requesting engineer when intended
use is unclear. File location, size and example designation do not determine
responsibility. Revisions preserve original example identities, behavioral
meaning and applicable constraints; examples remain immutable context and
register no independent obligation or coverage state.

A successful composed handback identifies delivered caller source/tests and
real-provider integration evidence in its summary, and limitations and
remaining consumer work with its owner in its limitations. A narrower handback
states its boundary and the broader behavior still owed. Required delegated
verification that is blocked requires partial or unresolved coordination.
Normal, recovered, nested and deferred return paths deliver the accepted
summary, limitations and evidence pointers so the consumer inspects and reuses
delivered work. None completes the requesting consumer's own obligations.

Each role submits from a closed action union. A requesting module engineer can
propose completion, report partial work or request a capability. The module
architect qualifies reuse or delegates. The capability architect consults,
revises its plan, assigns scoped work, delegates a nested need, records a
placement conflict or requests handback. An accepted module engineer completion
proposal advances orchestration to verification; it does not establish correct
implementation. An authorized architect's accepted done report records that
architect's judgment that its registered obligation is correctly implemented
and passing. The harness trusts the report and does not infer that judgment
from gate results. Read,
plan-update and prevalidation tools have explicit recorded effects but do not
complete work. The harness applies only accepted actions and current gates.

<a id="an-engineers-failure-is-its-architects-decision"></a>

### A Module Engineer's Failure Is Its Architect's Decision

The harness reports the failure pre-analyzed: a digest of what it already
holds, then a model's analysis, so the decision needs no transcript. A bound
that proves too tight is the architect's to raise, within the policy's
ceilings.

An accepted partial result returns retained edits, the prior assignment, changed
paths, located diagnostics and evidence pointers to its assigning local or
capability architect even when ownership and view refresh are unavailable.
Read-only preparation reuses captured configuration protection paths; retained
views are labelled historical and unavailable refreshes remain explicit. It
does not fail internally merely because the project cannot currently be analyzed.

The architect may issue a fresh engineer the same or narrower verified repair
scope while acquisition is unavailable. That assignment retains its original
authority provenance and cannot invent an owner, expand the canonical region or
add guarded-file permission. Operations needing current evidence, including
scope expansion and new generated-feature targets, report unavailability before
their side effects. If no authorized repair is possible, deliberation and partial
evidence remain available through the existing unresolved/environment path,
naming the blocked targets and missing authority.

Admitted edits need not make the next post-write check pass. Engineers may make
several invalid intermediate edits, restore selected files or retain unrelated
authorized work within their current authority; the harness does not infer
intent or roll work back automatically. Feedback names the effective write basis,
ownership acquisition failure, located diagnostics and change summary, with
complete failure and mutation evidence available through recorded pointers.
Stage-one recovery uses current files and named mutation/Git comparisons. It
does not claim a retained last-analyzable filesystem checkpoint.

### Failed Final Verification Returns To Correction

A nonpassing final verification remains evidence in the same run. The plan
architect receives the diagnostics and report locations and chooses the module
architect and next correction goal. The harness records an ordinary work item
with that final gate as its origin, preserving earlier accepted work. After
correction, it obtains focused candidate assessment of the repair and relevant
surrounding behavior, followed by final verification. Earlier complete-plan
results remain available; a concrete changed circumstance can broaden inspection.
Neither the failure count nor a former repair allowance ends the run. Accepted
correction decisions and created work items are reused after interruption.

### Native Context Compaction Preserves The Task

Every model role uses Pi's native automatic compaction for fresh, continued,
forked and reconstructed work. Pi supplies context estimation, model window,
effective reserve/recent-history settings, summaries and overflow recovery.
The current context ceiling is 300,000 tokens. Preserve earlier native
compaction thresholds; configure an earlier native threshold only when needed
to respect that ceiling. Do not add a competing context controller or extra
report reserve. Missing observations remain unknown.

Compaction runs through the preserving Pi lifecycle with immutable model request
artifacts, cancellation, dispatch fences and actual summary request usage. The
new active history boundary records its source and task bindings without claiming
exact prefix reuse across rewritten history. An older fork uses its own retained
point rather than a later compacted history. Cache savings require actual cache
observations; fewer context tokens alone establish none.

Successful native compaction preserves the task and submission authority. For
module, contract and nonfunctional repair engineers, compaction starts a review
by the responsible architect in parallel. Pi finishes and persists its summary,
then waits before its next model request or tool dispatch for that decision.
The architect assesses current correctness, expected benefit of further work
and guidance/context needs; compaction itself establishes no failure.

A continue decision resumes the same session. A handoff retains edits and the
compacted history and returns the unfinished task to its architect with the
reason, without inventing an engineer submission or running failure analysis.
The review start and decision are durable and keyed by invocation and compaction
ordinal; interruption retains a pending review and accepted decisions replay
without another assessment. Explicit stop cancels both activities.

If compaction fails, is unavailable or cannot recover provider overflow, the
unfinished task can execute in a fresh session after its former attempt settles.
Retain its assignment, partial work, accepted decisions and pending obligations.
No final agent report or reusable conversation is required. A required unavailable
provider or unreadable task record is reported as that concrete prerequisite.

### Ordinary Operations Retain Recovery Evidence

An interruption leaves the task pending unless a durable accepted result already
exists. The harness settles the former attempt and its child processes, resolves
any particular consequential operation, then delivers the accepted result once
or uses the ordinary task constructor and current procedures to execute again.
Every task remains executable without its previous session history. Useful
context may be reused; a failed exact fork is never presented as a successful
fork when a fresh invocation was used instead.

The shared recovery module decides re-entry from current authority, settlement,
accepted results and specific unresolved consequential operations. Hosted runs
and standalone execution use that policy. Task construction, workflow scheduling,
ledger durability, process ownership, effect inspection and acceptance remain
with their existing owners. The module owns no second log or scheduler.

Structured provider errors retain their actual classification. One bounded,
cancellation-aware retry policy handles transport/resource interruptions.
Persistent unavailable prerequisites leave work pending without multiplying
retry loops. Resource observations do not establish semantic failure or spend a
semantic correction round. Architects retain decisions about progress and handoff.

Accepted submissions, child assignments, decisions, handbacks and commits are
not duplicated after lost acknowledgements. Inspectable reads, source edits and
post-edit diagnostics require no exact tool replay. Required checks can run again.
Commands or other consequential operations whose outcome remains ambiguous use
owner inspection or idempotency before repetition. Old attempts cannot publish
or write after replacement; a stop receipt does not establish settlement.

Optional session bodies and payloads are validated when requested. Missing or
corrupt optional history cannot prevent unrelated fresh execution. The journal,
its ordering and ownership remain enforced. Unreadable essential task or accepted
result records identify the concrete obstruction instead of inventing work.
Runtime source, dependency and prompt hashes are not continuation prerequisites.
Captured requirements, accepted decisions, effective scope and required checks
continue to govern current execution.

### Standalone Recovery Retains Its Original Inputs

Standalone sessions and steps use the same re-entry policy and ordinary task
construction as hosted work. Retain partial source and relevant assignment inputs.
An explicit continuation command preserves a stable command identity across a
lost reply. A session names its retained run with `--resume-run`; a step already
names its run. Both accept `--command-id` without recovery occurrence or revision.
Ordinary repeated step execution retains its existing new-invocation behavior;
an explicit continuation delivers an already accepted result once.

### Recovery Waiting And Explicit Resume

Already-authorized active work can continue on service startup once the previous
execution settles. User stops, debugger holds and pending user decisions remain
effective. Inspection and listing never authorize task execution. A persistent
prerequisite obstruction exposes the pending task, retained work and concrete
reason; after that prerequisite changes, ordinary continuation retries the task.
There is no additional approval for an attempt group or repair declaration.

The `recovery resume` command continues the pending task. It takes plan, run
and stable command identity. Identical
commands recover their existing receipt; conflicting command content is refused.
Concurrency protection permits only one executing attempt for a task.

```sh
npx tsx src/main.ts recovery inspect --server http://localhost:4180 --plan <plan-id> --run <run-id> --json
npx tsx src/main.ts recovery resume --server http://localhost:4180 --plan <plan-id> --run <run-id> --command-id <stable-command-id> --json
```

<a id="terminal-failure-can-prepare-a-linked-successor"></a>

### Terminal Failure Can Continue Its Unfinished Tasks

A failed or interrupted run can continue on an explicit request after its owners
settle. A durable `job-continued` event starts a new active lifecycle in the same
run. Original failures, accepted results, dependencies and partial work remain
available. Completion and deliberate stops cannot be reopened this way. Analysis
itself may still be pending; unfinished engineering, nested capabilities,
nonfunctional work and automatic repair are ordinary tasks rather than unsupported
restart boundaries.

The `restart prepare` command performs this continuation in one operation;
it returns the same run's receipt. It does not create a successor or require a
second resume command. Its expected version prevents a stale new request, while
stable command identity recovers a lost acknowledgement. `restart inspect` is
read-only and reports actual prerequisites. Continuation writes no synthetic
history, copied inventory or runtime transition allowlist.

```sh
npx tsx src/main.ts restart inspect --server http://localhost:4180 --plan <plan-id> --run <failed-run> --json
npx tsx src/main.ts restart prepare --server http://localhost:4180 --plan <plan-id> --run <failed-run> --expected-version <inspected-version> --command-id <stable-command-id> --json
```

<a id="external-repairs-are-admitted-with-operator-provenance"></a>

### Current Changes Use Ordinary Attribution And Acceptance

Changes made while execution was quiescent remain available to the restarted
agent. Capture current source after settlement and retain attribution separately
from engineer changes. No recovery declaration establishes correctness or expands
agent scope. Ordinary ownership, protected-file and excluded-project rules apply.

Verification uses the actual resulting candidate and required configuration.
Changed source receives affected reassessment and checks; old evidence remains
historical for its original source. A harness or prompt edit alone does not
invalidate unrelated accepted work. A changed final candidate reopens its
assessment using the recorded candidate/assessment identity, without authenticating
an earlier recovery admission. Required checks cannot be weakened by continuation.
Consequential commits use their existing identity and owner evidence to reconcile
a lost acknowledgement. Safe cleanup remains with the resource owner.

### Final Candidate Qualification

After functional work, the harness prepares a final candidate and commits it
through the final gate. Its non-functional coordinator assesses that exact
candidate while the configured full nested audit runs. Both results settle
before a non-functional repair, infrastructure recovery decision, final
correction or completion. A failed audit retains the assessment; a failed or
unavailable assessment retains the audit. A repair prepares a new candidate
with new checks, while the earlier records remain tied to their source.

Provider-established instability in the final audit is reported as an
assessment finding even when the audit passes with warnings and no code review
ran. Final reconciliation uses the original execution baseline to judge each
test's origin. An existing unstable test retains the provider verdict without
repair work; an added unstable test requires a correction preserving reliable
coverage, and its finding can close only after semantic verification on a later
candidate without that test's established instability. Unknown origin remains
unresolved. A strict audit failure remains blocking regardless of the origin
judgment. Reused observations attach to their existing finding across gates.

The prepared candidate, gate operation, gate attempt and coordinator invocation
are retained separately. On restart, an existing result is reused and only
missing work proceeds. Candidate identity is verified again before completion.
Recorded event and invocation start/end times can show overlap; audit command
durations come from the provider. Missing historical times remain unknown, and
no stage duration is inferred from the preceding stage's completion.

### Execution Breakpoints Suspend The Whole Run

A start-run command may select `before-agent:engineer`. Unsupported selectors
are refused before starting. Absence preserves ordinary execution. This
selector matches ordinary and capability-task
`engineer` invocations, repair continuations, `contract-engineer` invocations
and `nonfunctional-repair-engineer` invocations. Each prepared workflow request
has one occurrence; internal context-loss fallback does not create a new one.

The harness prepares the ordinary assignment, scope, equipment and task input
before the boundary. It parks before invocation admission and writer acquisition,
with no run mutex or ledger transaction held. The server retains its project
lock. The ordinary job stays nonterminal; debugger state separately identifies
`pausing`, `paused` or `exchanging`, occurrence ID, interaction revision, actual
role, work, goal and next action. Read-only inspection consumes no invocation.

At `pausing`, admit no new ordinary operation or review attempt. Already admitted
review pipelines, including orientation followed by review, finish under their
ordinary submission and authority rules. Gates and invocation cleanup finish before a usable `paused`
transition. Every dispatched operation must confirm its session/tool settlement;
an empty live-invocation map alone is insufficient. Failed or unconfirmed
settlement retains its ordinary evidence and prevents a usable pause.

Review admission is reversibly suspended. Timer expiry, overflow and
completion-triggered wakeups cannot affect waiting work while suspended.
Suspension preserves the frozen candidate and entire outstanding review coverage.
Review waiting and invocation counts do not become terminal resource budgets.
Only fully reached caller waiting is excluded from measured active run age;
settlement and model execution remain measured. Quiet intervals initiate stall
inspection using relevant model streams, tools, command output, locks and
producer progress. A timer or polling heartbeat alone is no useful progress.

A resume names the current pause ID and interaction revision and acknowledges
release without waiting for the next stop. Stable command IDs deduplicate exact
retries before revision checks; changed content conflicts. A new stale, active
or already released interaction is refused. A debugger message or resume retains
the run's captured policy without adopting a later policy. Resume without
discussion executes the prepared ordinary request once, revalidating captured documents, writer
settlement and the runner's ordinary task and authority preconditions.
A later assignment or repair reaches a new occurrence. Stop takes precedence
over a pause or admitted resume, settles admitted work through the ordinary
stop mechanism, and returns the actual terminal run outcome.

Client disconnection has no effect on the run, retained records or command
admission. On service startup, the ordinary task can be reconstructed up to its
retained debugger pause once the previous execution settles. The existing pause
ID and interaction revision remain effective; reconstruction does not release the
pause or invoke an agent. The ordinary debugger action is still required. A run
interrupted before its next pause continues only as far as that configured pause.
Accepted results and consequential effects use the same ordinary completion and
owner reconciliation as other tasks; optional session context may be unavailable.

Inspection is a read-only preparation preview. It presents effective role,
procedure, briefing and environment inputs, physical inherited context and
current additions, current tool declarations, scope, bounds and exact source
point. It admits no operation, builds no executable tool equipment, retains no
packet as delivered input and consumes no invocation. Unavailable inherited
context is identified explicitly; a fresh reconstruction preview cannot claim
that the earlier conversation is retained.

A debugger message appends caller prose verbatim after the entire ordinary task
before immutable operation admission. Its packet identity and delivered manifest
include that prose. Normal tool authority, write guard, post-write hooks,
submission judge and stall observations apply. No discussion role, fork, hidden explain-only
instruction or substitute assignment is introduced. A settled plain return with
no accepted submission leaves the task pending only in this explicit exchange
mode; ordinary invocations retain missing-submission handling. Submission
rejections, failures and unconfirmed settlement keep their actual evidence.
Context compaction continues the task; remaining context obstruction preserves
unfinished work rather than inventing a submission or terminal judgment.

Follow-ups continue the latest settled logical session and retain both provider
history and harness briefing ancestry at its returned point. Known context loss
uses the ordinary fresh fallback, with current caller text retained and
conversational continuity loss reported. Accepted actions, including partial
work and capability requests, and terminal invocation outcomes are held for
ordinary workflow handling on resume. Further messages are refused once an
outcome is held. Resume consumes it once without another model call; otherwise
it continues the pending ordinary task, optionally appending new caller prose.
Tool settlement must be confirmed before another exchange, writer or gate.
Unconfirmed writer settlement blocks a resumed model invocation, another writer
and gates. Resume may return an already held terminal outcome to ordinary
failure handling without a new model call; it does not clear that barrier.
An exchange's `settled` status describes completed control-command handling.
Its `settlementConfirmed` flag separately reports actual tool/session settlement.

Message admission is serialized before model execution using the occurrence
revision and stable command ledger. Exact retries return the same admission
and retained result; a changed payload, stale revision or concurrent new
message/resume is refused. Admission and settled outcomes remain queryable by
plan, run and command identity after client reconnection or resume. Model and
tool execution run outside serialization locks and retain elapsed observations; caller waiting intervals close at exchange admission and reopen at
settlement, while reviews remain suspended throughout. Stop and server shutdown
settle the admitted exchange's lifetime before releasing resources. A stopped
or interrupted exchange cannot be reported as a completed conversation.

The run snapshot names the breakpoint the run was started with, or null
without one. The debug state query lists every intervention of the run in log
order, derived from the retained log and independent of its event paging: each
message with the exchange result the harness derives for it at query time, and
each resume with its optional message.

### An Oriented Context Is Reused, Never Required

Fork an oriented session for independent tasks. It starts from the point where
the earlier session was oriented, before it took up any one task, so the reused
context stays bounded and several questions can start from it at once.

When successive tasks benefit from shared orientation but produce substantial
exploratory context, execute each task in a fork of the updated long-lived
context. The fork can make decisions within its assigned authority and returns
a concise brief of its conclusions, rationale, corrected assumptions and
required follow-ups, referencing the durable records.

Append that brief to the long-lived context without invoking the model. The
next invocation receives the accumulated updates; detailed searches and tool
results remain in the fork. Tasks whose decisions depend on one another must
receive the preceding accepted decisions before starting.

Continuity can come from accumulated decision briefs as well as from continuing
the full conversation. Use direct continuation when its continuity is more
valuable than isolating task exploration. Forks limit accumulated context but
do not necessarily reduce total tokens or latency.

Each request supplies relevant new findings; context reuse does not
automatically reveal changes in the repository.

If reusable context is unavailable, the workflow uses the ordinary fresh task
brief. An actual unavailable fork or continuation closes its original invocation
and starts ordinary fresh execution with relevant task inputs and a recorded reason. Repeated resource losses cannot spend a terminal reconstruction cap. Only known missing reusable session/history/payload inputs license that
fallback; the operation receipt's optional `contextUnavailable` indication does
not classify arbitrary provider, task, authorization, cancellation or conflict
failures as context loss. Uncertain effects do not license replay.

After the existing work-orientation attempt bound, fresh selection and assignment
proceed from authoritative work-item records. Recorded attempts preserve that
bound across restart; already accepted orientation still recovers. Failed or
unreadable design orientation leads to an ordinary fresh review with captured
guidance and candidate tools. Global requests use current requests, registry,
hypotheses and decisions when the retained parent is unavailable. New losses
create no rebuild generation or replacement parent. An unavailable append records
`brief-not-appended`; later work starts fresh. Historical rebuild readers remain.

Existing invocation records, observations and projections expose timing, provider
usage, start modes and exploration. [Session observations](metrics/session-observations.md)
describes access and coverage. These are inputs for Dan's benefit assessment;
implementation and qualification require no benefit trial or performance gate.

### Effective Instruction Blocks and Exact Delivery

Each task selects its current role, kind, objective, submission tool and
`procedure:<role>:<family>` key with the SHA-256 of its exact rendered set text.
The selected body must be available at the selected session point or supplied
with that task. Assignment, completion and ordinary module architect repair use
the main family; orientation, reconciliation and qualification have distinct
families. Inherited procedures remain available, but only the current selection
is active. Current tools, cwd, validator, destination and read/write authority
bind independently of inherited prose.

Reusable procedure, environment and named briefing inputs, including named
appends, are framed as `# Block <key>` followed by the exact body, separated by
LF. Where the session at the delivery point already holds an earlier delivery of
the key, set or withdrawn, the line `Current value; replaces any earlier value
for this key.` follows the key line. A fresh session and a first delivery of a
key carry no such line. Block equality accepts either framing of the same body;
selected-procedure hashes cover the bytes actually delivered. A structural
withdrawal uses `Withdrawn; this block no longer applies.` with a final LF. Role
instructions stay pinned and same-name submission declarations remain immutable.

Resolve effective blocks by replaying actual ordered inputs at the chosen point.
Fresh tasks supply the complete current inputs; continuations and forks supply
missing/changed blocks and explicit withdrawals. A fork whose brief retains its
source's sections (a context selector, a design review of its orientation, a
consultation) withdraws none of them; an omitted section remains inherited.
Each invocation is sent only the environment fields its tools use: the project
root, working directory and views only to a file reader, and its own bounds
rather than the run's policy. A field the session already holds is kept current,
and support paths, which no role uses, are withdrawn. Environment fields replace
whole values in declared order with deterministic object properties and
preserved array order. Null and empty values clear earlier values explicitly.
Superseded inputs remain physically in the conversation; effective state is not
physical context size.

Briefing content identity hashes canonical ordered section bodies/provenance.
Occurrence identity identifies an accepted update after its predecessor and
durable operation identity. A → B → A has equal A content hashes and distinct
ordered A occurrences. Unchanged content at the selected point reuses its
occurrence. Named accepted appends use the same history; ad hoc prose is not
parsed into blocks. A fork inherits only its named point, never a later parent
or sibling. Prepared-only or uncommitted failures establish no delivery.

Task manifests and harness operation intents use `/2`. Manifests retain ordered
physical inherited/appended entries with exact bytes, hashes and actual source
provenance. Retry uses the original admitted packet, schema, declarations,
context and destination exactly.
Historical hashes and evidence are not rewritten.

### Optional Discovery Handoffs and NFR Comparisons

Work orientation, architect assignments and module engineer completion/partial results
may declare concise `startingPoints` path/note pairs. Paths are normalized literal
project-relative locations, never absolute paths, traversal or globs. Omission
remains valid. Syntax validation does not probe existence or judge relevance.
No extra discovery invocation, completeness rule or semantic decision follows.

The shared named `support:starting-points` briefing groups pointers by their
harness-recorded producer, work item, iteration, invocation and source boundary
when available. Identical path/note pairs coalesce while retaining every origin.
Assignment pointers reach the module engineer; result pointers reach its architect and
that exact candidate's code/scope/design reviewers. Retained orientation and
selector contexts need no repeated pointer list; fresh consumers receive usable
recorded orientation pointers alongside their ordinary current brief.

Workspace consumers use their current cwd conventions. Snapshot consumers use
the pinned candidate's project-relative paths and existing captured entry/access
filters. Missing, symlink, generated-view, run-record or inaccessible hints are
omitted without task failure or new filesystem probes. Origin boundaries describe
history, not unchanged files. Hints grant no access, writes or completion authority;
the consumer inspects the current source and explores beyond stale hints.

NFR source preparation supplies two captured comparisons to the same candidate
tree: `run-start` from reliable original recorded source, and `accepted-boundary`
from the latest accepted commit. Dirty original capture retains its qualification:
the commit comparison excludes uncommitted starting bytes. Missing reliable
history omits `run-start`; current HEAD cannot fabricate it, and a failed diff
cannot become an empty comparison. Changed paths obey existing NFR source filters.

NFR `snapshot_diff` accepts only captured comparison names and reports actual
base/target identities for both lists and patches. New tasks default to reliable
`run-start`, otherwise explicitly to `accepted-boundary`. Legacy admitted tasks
retain their original declaration/default on exact retry. Ordinary reviewer
iteration-base semantics remain. Repair retains guarded workspace tools and its
prepared candidate identity; reassessment rebuilds comparisons and filters hints
for the new candidate. Scoped investigations retain their declared read scope.

NFR assessment starts from supplied implementation locations and requests a
relevant diff when useful; no initial pathless diff is required. Every fixed/NFR
obligation, broader permitted inspection, uncertainty and independent judgment
remains. Pointer notes, previous completion reports and green audits cannot
establish satisfaction. Audit establishes configured test health; responsible
architects assess semantic completion.

### Review Patch Delivery

The harness child `reviews` prepares fixed candidate evidence and validates reviewer
submissions; harness retains agent invocation, cancellation, durable records and
CheckFinding coordination. Its preparation API supplies candidate tools and validates
submission shape and candidate references. Reviewers choose relevant inspection.

Before invoking a code, scope or design reviewer, collect patches through the
candidate source between the request's fixed base and audited candidate. Apply
the same snapshot path restrictions as the review tools. Include complete
patches inline when their combined UTF-8 size is at most 200 KiB. Once collection
exceeds that budget, stop acquiring further patches and deliver a name-status
summary capped at 200 entries, with explicit omissions. Reviewers obtain the
needed per-file patches through `snapshot_diff` against the same fixed commits.
The complete canonical changed-path list remains supplied separately.

Record the diff payload once as a literal delivered input, including its hash
and byte count in the invocation's delivery manifest. Patches supply evidence;
there is no exhaustive per-file inspection requirement. Snapshot tools are optional
inspection conveniences. Ordinary shell inspection runs in a disposable detached
checkout of the request's intended candidate, preserving nested project cwd and
supporting compressed or large evidence. Reviewers must not edit source. This is
instructed shell access, not a write sandbox. Each call starts from the candidate
and its owned checkout is cleaned after settlement.

Submissions contain conclusions, actionable concerns and meaningful limitations.
Legacy inspected/missing inventories remain readable without governing acceptance.
An unread supplemental artifact does not automatically make a completed review
partial or create required work. A concern's source reference must identify a
candidate file; the harness binds its identity independently of the tool used.
Unavailable review execution remains distinct from a supported review conclusion.

### Principles And Specifications Are Captured And Sealed

The harness captures applicable `.principles.md` documents as sources of fixed
requirements and `.spec.md` documents for initial plan review, preserving each
document's kind and authority. Their review lifecycle follows
[Principles Guide Implementation; Specifications Constrain the Plan](harness.principles.md#principles-guide-implementation-specifications-constrain-the-plan).
Relocating an approved requirement between these kinds does not change its
review provenance or make it optional.

Sealing belongs to ramify-agent and covers both `.principles.md` and `.spec.md`
files. Cucumber-viz sealing is deprecated for Ramify projects.

Specification discovery, initial specification review, credibility preservation
and sealing remain implementation work. The current evidence scan discovers
principles automatically; a specification reached through a plan link is captured
as plan material. The current credibility classifier downgrades a concern grounded
in a specification, as the [CheckFinding specification](check-findings.spec.md#credibility-follows-provenance)
records. These contracts do not establish runtime support.

Continuing design reviews receive affected-owner README context and document
starting points selected by the assigning architect for this task. A principles
filename alone does not make a document an initial review obligation. Other
relevant guidance remains available through candidate inspection. Relevant specification obligations
must reach implementation and review through the reviewed plan; this does not
require adding every specification to recurring design guidance.


### Review Once, Select Useful Repairs

An accepted coherent iteration receives the configured code/scope/design review.
Its selected corrections use their existing `corrects` identity, configured gate
and source-backed repair dispositions. They do not automatically repeat those
broad reviews. The assigning architect may supply `reviewReason` on the correction
for a concrete additional pass, such as substantial new behavior. The reason stays
in the captured assignment; retries preserve the original review request keys.
An accepted correction without that reason records `reviewPolicy.mode: not-run`
in its iteration result and creates no repeat request. Completion settles only
actual requests and never waits for deliberately omitted reviews.

The existing architect chooses useful repairs, leaves an understood discretionary
suggestion through a waiver, or defers it with a short rationale and revisit
condition. Ordinary decisions need no user approval. They do not waive actual
unmet requirements, failed required checks or protected changes. Review packets
include a bounded summary of relevant existing findings, dispositions and
rationales; reviewers avoid repeating unchanged issues and explain changed
circumstances when raising an issue again. Unavailable reviews retain their status
for the architect's completion decision and are never represented as completed.
A newly unavailable terminal result reaches that architect through ordinary
reconciliation even when no finding needs attention. The architect records a
short continuation rationale in its completion brief or selects a correction
goal for relevant verification. The same recorded result needs no new decision
after continuation or restart, and this choice schedules no automatic broad
review.

Failed configured checks return their diagnostics directly to the responsible
engineer or coordinator. Review requests follow accepted iterations; a concrete
check failure does not automatically invoke broad review and reconciliation.

The first final assessment covers the complete plan's applicable fixed and
nonfunctional requirements. Later selected repairs receive a focused follow-up
of repaired and unresolved elements and relevant surrounding behavior. The agent
may reassess other elements for concrete changed circumstances. Existing satisfied
judgments retain their evidence; an assessment's optional `followUp` names the
prior assessment and IDs actually reviewed. Retained judgments are not fresh review
of those elements. An unanswered unmet or undetermined requirement cannot become
satisfied. The original baseline, prepared candidate identities and final
configured checks remain in force; no separate proof cache is required.


Assisted final review uses accepted iteration reports as evidence for plan
completeness, integration, remaining obligations and architectural quality. Its
initial packet carries the complete captured plan and compact recorded outcomes,
with candidate source, full assessments and individual/cumulative diffs on demand.
It does not eagerly collect a cumulative patch or repeat iteration code review.
The reviewer explains why earlier evidence applies and revisits behavior for
later changes, conflicting evidence, unresolved limitations or concrete
integration concerns. Architectural findings identify practical consequences and
the smallest useful correction. Accepted submissions can retain unmet obligations;
missing or unavailable reviews cannot become accepted evidence. Protection
authority remains independent. Later selected repairs keep focused follow-up.
