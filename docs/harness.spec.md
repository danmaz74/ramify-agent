# Harness Specification

**Status:** Proposed. The whole-tree scope and verification rules adopted on
2026-10-01 are normative design decisions; their implementation remains pending.

## Purpose

Specify the scope, verification, preparation and session behavior governed by
the [harness principles](harness.principles.md). The principles remain
applicable alongside these detailed contracts.

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
CLI role selectors remain compatible with existing runs:

| Stored role | Role name |
| --- | --- |
| `initial-architect`, `global-fork` | Plan architect |
| `local-architect` | Module architect |
| `engineer`, `contract-engineer`, `nonfunctional-repair-engineer` | Module engineer |
| `capability-architect` | Capability architect |

Historical evidence retains the names actually recorded. The toolkit's
module-architect skill and its glossary retain their upstream terminology under
the snapshot's [provenance](../skills/module-architect/PROVENANCE.md).

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
Older assignments without the required capture remain readable but do not gain
historical repair permission.

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
selection. Scenario pointers and filenames in prose select nothing. Legacy
assignments using scenario obligations keep their behavior. A capability-only
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

### Native Context Compaction Preserves The Task

Every model role uses Pi's native automatic compaction for fresh, continued,
forked and reconstructed work. Pi supplies context estimation, model window,
effective reserve/recent-history settings, summaries and overflow recovery.
Harness role fractions, fixed token ceilings and extra report reserves do not
reduce the usable model window. Missing observations remain unknown.

Compaction runs through the preserving Pi lifecycle with immutable model request
artifacts, cancellation, dispatch fences and actual summary request usage. The
new active history boundary records its source and task bindings without claiming
exact prefix reuse across rewritten history. An older fork uses its own retained
point rather than a later compacted history. Cache savings require actual cache
observations; fewer context tokens alone establish none.

Successful native compaction continues the same task and submission authority.
If compaction fails, is unavailable or cannot recover provider overflow, the
harness reconciles durable effects before a source-backed successor. Recovery
needs no final agent report. It retains the original need, accepted decisions,
current candidate/configuration, pending findings and requests, authority,
submission obligations and evidence pointers. Missing evidence or a usable
provider becomes an inspectable nonterminal prerequisite obstruction.

### Ordinary Operations Retain Recovery Evidence

New runs capture an operation-recovery policy. Historical runs retain their
captured policy and terminal meaning; service startup does not migrate them.
The shared contract applies to ordinary architect, catalog, engineer, capability,
review, failure-analysis, context-selection and non-functional operations,
including fresh starts, continuations, forks and source-backed reconstruction,
standalone steps and debugger exchanges. Automatic root repair preserves its
authorized repair boundary and reports unavailable prerequisites. Resource
recovery does not spend a semantic repair round.

Structured executor evidence distinguishes transport interruption, permanent
provider rejection, unavailable classification and adapter faults. Diagnostics
remain evidence, never semantic results. Only eligible transport interruption
receives automatic retries: two after the initial attempt by default. Retry
delays count as execution time and are cancellation-aware. The default delays
are 250 ms and 500 ms; a provider hint can increase either delay up to the
captured 5,000 ms ceiling. Provider-internal and review
attempts remain explicitly accounted for without multiplying retry loops.
Submission rejection, partial results, unresolved questions and explicit stop
retain their ordinary handling. `resource-pending` retains unfinished work;
context observations and invocation age provide no semantic verdict. Historical
`context-budget-reached` records retain their original meaning.

Each successor has a new invocation and session-operation identity linked to
its predecessor. Reconciliation first establishes whether an accepted result
or completed effect already exists. Accepted decisions, handbacks, iterations,
commits and gates are not resubmitted. Incomplete streamed arguments have no
submission verdict. Partial edits and their evidence remain available; uncertain
mutating effects are not replayed. Continuation and fork use their recorded
exact source, or a named source-backed reconstruction with recorded inputs and
degraded mode. Missing source evidence is a prerequisite failure.

### Standalone Recovery Retains Its Original Inputs

Standalone sessions and step commands use the same settled resource continuation
rule. A useful successor reconstructs the original assignment from durable task
inputs and retains partial source, scratch, guards and submission obligations.
A finite group of ineffective attempts, missing source/candidate evidence or
unknown effects records a pending recovery obstruction. A gate remains unverified
until safely resumed work supplies its ordinary accepted submission and qualifying
producer evidence.

A manual step resume names `--occurrence`, `--expected-revision` and a stable
`--command-id`; a session resume also names `--resume-run`. Admission compares
the original need, scopes, guarded configuration, prompt package, policy/runtime,
source and candidate. Exact command retries observe the same durable result;
stale, conflicting or concurrent new commands cannot admit overlapping writers.
Explicit compatible legacy continuation records continuity adoption while keeping
the original policy. Startup alone supplies no task execution authority.

### Recovery Waiting And Explicit Resume

Exhausted transport recovery and eligible ordinary preparation, adapter,
environment or check-execution obstructions can pause the same run. Assertion
failure and semantic rejection alone do not create an infrastructure pause.
Readiness and iteration, capability, work-item and final gates retain the pending
boundary, accepted inputs, candidate/configuration identities and all spent
attempts. Resume checks the unfinished prerequisite or qualifies the applicable
candidate without requesting an accepted submission again. Changed prerequisites
require correction or reassessment by their responsible authority.

A usable pause requires readable compatible inputs and durable state, confirmed
writer/tool settlement and reconciled effects. Ordinary scheduling quiesces.
Unknown settlement or effects retain a pending recovery obstruction and forbid
replacement writers and gates, even after a settlement observation deadline.
A stop receipt does not establish quiescence. Corrupt state and incompatible
inputs remain explicit blockers or failures under their independent contracts.
Elapsed execution and operator waiting remain measurements; neither expires
authority or the pending review obligation.

Harness-owned inspection reports the obstruction, pending boundary, retained
work and obligations, observed changes, compatibility, settlement/effect status,
predecessor/successor lineage and concrete resume blockers. Current execution
reports no terminal invocation or elapsed allowance; historical captured bounds
remain available as original evidence.
Resume names the current occurrence and revision. Stable command identities
deduplicate exact retries; conflicting content and stale occurrences are refused.
Concurrent clients admit at most one successor group. An explicit resume
authorizes another finite attempt group, preserving semantic correction rounds
and accepted effects. Repeated resource returns, reconstructions, model
invocations and infrastructure attempts cannot exhaust a terminal run budget.
A group ends with a different supported recovery or an obstruction naming the
missing prerequisite, rather than immediate identical retries. Check boundaries use their own infrastructure
policy without an additional model retry loop. Stop takes precedence.

Recovery waiting survives service restart without authorizing execution. Startup
reconciles durable progress before scheduling. Completed authenticated effects
are reused only for their candidate and configuration; a lost acknowledgement
does not duplicate a commit or gate transition. Debug-enabled runs retain the
live-server exception below.

### Terminal Failure Can Prepare A Linked Successor

`restart inspect` examines a retained failed or interrupted run after its owners
and effects have settled. `restart prepare` authenticates the inspected source
version again and commits one linked successor awaiting explicit recovery resume.
The source keeps its terminal event and immutable records. Inspection and
preparation launch no model, commit, audit or target writer, and preserve the
target's HEAD, index, unstaged and untracked source. Read-only candidate capture
may create temporary Git objects through the ordinary evidence adapter.

The initial importer requires accepted analysis and reconstructible ordinary
post-analysis work, including an unfinished module architect reconciliation.
It preserves frozen plan inputs, decomposition, accepted decisions and effects,
completed capability handbacks, findings, review obligations and spent semantic
allowances. An unfinished engineer assignment, nested capability coordination,
active non-functional coordination or unfinished automatic root repair produces
an unsupported-boundary blocker. Completed runs and explicit operator stops
cannot prepare successors; nonterminal pauses use same-run recovery.

The successor captures a versioned initial workflow state whose evidence names
its source run, record path, revision and hash. Historical inventory initializes
workflow readers; it is never appended as execution events of the successor.
Terminal cleanup does not satisfy the pending task or review. New sessions have
fresh execution identity and current authority; old sessions cannot submit or
write for the successor. Exact source invocation and designated submission
identity determine reconstruction. Accepted effects are preserved without
execution, and unknown effects block preparation.

Candidate changes and changed or unavailable producer bindings require
responsible reassessment. Historical done reports, reviews and gates remain
available with their original provenance while their conclusions await renewed
applicability. Reassessment preserves work-item decomposition and never implies
automatic reimplementation. Missing required review coverage remains missing.

Legacy sources without recorded launcher hashes retain an explicitly labelled
identity of captured policy, prompt and invocation representations. They do not
acquire an invented historical implementation hash. The importer supports the
known continuity representation transition and exact reviewed prompt hash pairs;
unknown transitions remain blockers. Legacy producer conclusions require
responsible reassessment and fresh qualification. An independently captured
runtime retains the ordinary exact protected-contract compatibility rule.

Preparation is serialized under the project execution lock. Its single committed
initialization contains the accepted command, authenticated source cursor and
digest, import digest and waiting recovery occurrence. Staged files without that
transaction are inert. Startup restores a committed successor's hold and command
receipt without dispatch; exact retries return the original receipt and changed
content under the same command identity conflicts. One source admits one
successor, and later attempts continue the latest eligible terminal successor.
Optional tracker delivery stays administrative and is not replayed into imported
plan acceptance.

```sh
npx tsx src/main.ts restart inspect --server http://localhost:4180 --plan <plan-id> --run <source-run> --json
npx tsx src/main.ts restart prepare --server http://localhost:4180 --plan <plan-id> --run <source-run> --expected-version <source-version> --command-id <stable-command-id> --json
npx tsx src/main.ts recovery resume --server http://localhost:4180 --plan <plan-id> --run <successor-run> --occurrence <occurrence-id> --expected-revision <revision> --command-id <different-stable-command-id> --repair-file repair.json --json
```

Preparation records observations without admitting a repair. Recovery resume
uses the existing external repair declaration and compares source evidence,
prepared state and current observations before dispatch. Fixes already present
at preparation remain observed changes requiring explanation. Drift after
admission requires revalidation. Dispatch creates the successor's own execution
branch at the admitted HEAD through a journaled effect, preserving source refs,
index and retained edits. An existing conflicting branch is an obstruction;
an acknowledged matching branch effect is reused after a lost reply.
Plan progress projects the successor's existing
recovery pause while historical run views keep their original failure.

### External Repairs Are Admitted With Operator Provenance

An operator can repair while a run is quiescent, then declare changed areas,
an explanation and optional diagnostic evidence in resume. Admission compares
actual HEAD, candidate tree, staged, unstaged and untracked source changes,
supported configuration and harness/provider identities with the settled pause.
Environment-only repair requires no invented source delta and records no
credentials. A declaration does not establish that the fix works.

Admission retains original obstruction evidence and durably records the observed
repair, operator command, compatibility, outstanding verification and continuation
boundary before dispatch. Candidate/runtime changes after admission require
revalidation. Exact duplicate commands and restart cannot admit or dispatch the
same successor twice. Unexplained drift, modified frozen packages or durable
records, incompatible policy and weakened acceptance checks are refused without
launching a model or resetting files.

Compatible harness fixes and supported operational configuration changes can be
admitted without replacing the original captures. Required audit checks remain
required; affected qualification must be renewed under the admitted configuration.
Installed runtime identity is captured by the running service. Changed runtime
bytes require restart before admission. Protected policy, durable record,
submission, equipment and authority source hashes must remain exact; the service
and recovery validators are protected authority. This conservative rule can
admit an adapter fix while refusing a change to a validator.
At readiness, admitted dirty source receives a journaled repair commit on the
run branch after fresh ownership, protected-file and exclusion validation. The
baseline audit verifies that exact commit and admitted configuration. A matching
commit receipt reconciles a lost acknowledgement; completed setup effects remain
recorded without another execution in the target working tree.
External edits carry operator provenance separate from engineer and automatic
repair deltas. Later gates authenticate those edits and enforce fresh ownership,
protected files and excluded projects without enlarging subsequent agent scope
or excusing an earlier violation. Earlier accepted evidence remains historical
for its candidate; affected semantic choices return to the responsible architect
and changed candidates require fresh qualification. External repair neither uses
nor replenishes automatic repair authority or verified-delta consumption.

A changed final candidate invalidates its previous assessment through a recorded
operator-repair occurrence. Reassessment uses the next remaining captured
non-functional round; prior closures and their spent allowance remain intact.
Admission refuses a required final reassessment when no round remains.

The CLI attaches to the service that owns the project lock:

```sh
npx tsx src/main.ts recovery inspect --server http://localhost:4180 --plan <plan-id> --run <run-id> --json
npx tsx src/main.ts recovery resume --server http://localhost:4180 --plan <plan-id> --run <run-id> --occurrence <occurrence-id> --expected-revision <revision> --command-id <stable-command-id> --repair-file repair.json --json
```

Inspection launches no model. Resume uses the occurrence and revision returned
by current inspection; `--repair-file` is optional for transport recovery and
required for known nontransport repair. Its JSON contains `areas` (one or more
of `target`, `configuration`, `environment`, `runtime`), `explanation`, and
optional `evidence` references. For example, an environment-only correction is
`{"areas":["environment"],"explanation":"Restored check-service access"}`.
Keep the same command ID and payload after a lost reply; changed content requires
a new command. The Run page exposes the same inspection, declaration and resume
contract and preserves an uncertain command for identical retry.

### Execution Breakpoints Suspend The Whole Run

A start-run command may select `before-agent:engineer`. Unsupported selectors
are refused before starting. Absence preserves ordinary execution and legacy
record readability. This selector matches ordinary and capability-task
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
or already released interaction is refused. An explicitly admitted compatible debugger message or resume records continuity
policy adoption while keeping its original policy evidence. Resume without
discussion executes the prepared ordinary request once, revalidating captured documents, writer
settlement and the runner's ordinary source/session/authority preconditions.
A later assignment or repair reaches a new occurrence. Stop takes precedence
over a pause or admitted resume, settles admitted work through the ordinary
stop mechanism, and returns the actual terminal run outcome.

This debugger requires the same live server. Client disconnection has no effect
on the run, its retained records or command admission. On server startup, every
unfinished debug-enabled run is interrupted before pending effect completion,
capability source reconciliation or workflow restoration, even before its first
pause or after resume. Interrupted invocation and session evidence is retained;
pending effects are not redispatched. Ordinary runs keep their existing
recovery policy.

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
Its `settlementConfirmed` flag separately reports actual tool/session settlement;
legacy exchange records may omit this flag.

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
and admits source-backed recovery with full inputs and recorded degradation
reason. Repeated resource losses cannot spend a terminal reconstruction cap. Only known missing reusable session/history/payload inputs license that
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

New task manifests and harness operation intents use `/2`; readers accept `/1`
and `/2`. Manifests retain ordered physical inherited/appended entries with exact
bytes, hashes and actual source provenance. Legacy normalization interprets known
components without changing their physical bytes or manufacturing separately
delivered environment fields. Retry uses the original admitted packet, schema,
declarations, context and destination exactly, including legacy `/1` operations.
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
CheckFinding coordination. Its preparation API binds delivered patches and observed
tool answers to one validator.

Before invoking a code, scope or design reviewer, collect patches through the
candidate source between the request's fixed base and audited candidate. Apply
the same snapshot path restrictions as the review tools. Include complete
patches inline when their combined UTF-8 size is at most 200 KiB. Once collection
exceeds that budget, stop acquiring further patches and deliver a name-status
summary capped at 200 entries, with explicit omissions. Reviewers obtain the
needed per-file patches through `snapshot_diff` against the same fixed commits.
The complete canonical changed-path list remains supplied separately.

Record the diff payload once as a literal delivered input, including its hash
and byte count in the invocation's delivery manifest. A complete patch delivered
in the current review message can establish inspection coverage without another
tool call. A summary, unavailable patch or omitted patch cannot. Concern grounds
still require a file read with `snapshot_read` during that review. Patch collection
supplies evidence; it makes no judgment about correctness, scope or design.

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

Continuing design reviews select principles and relevant READMEs as guidance.
They do not receive the whole specification set. Relevant specification obligations
must reach implementation and review through the reviewed plan; this does not
require adding every specification to recurring design guidance.
