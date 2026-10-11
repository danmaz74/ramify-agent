# Common prompt block candidates

**Date:** 2026-10-09. **Status:** candidate inventory for discussion; prompt
and runtime code unchanged. Three Sol agents
investigated architecture, engineering, and review/non-functional prompt families.
Source inspection uses `5553510a`; the retained trial used `474ffa58`.

This is a companion to [Declared task blocks](2026-10-09-declared-task-blocks.md).
It starts from the clarified requirement: assemble a prompt from meaningful
common passages and its unique task text. A reusable passage earns its place by
avoiding substantial repetition. JSON environment objects, one block per field,
and exhaustive role/task declarations are not requirements.

## What is being evaluated

There are two benefits to distinguish:

- **Common authored text:** several prompt builders use one passage. Each fresh
  session still receives it. This reduces duplicated implementation and wording.
- **Common delivered text:** a continuation or fork already holds the exact
  applicable passage, so the next prompt can omit it. This avoids adding those
  bytes again. Equal text in unrelated fresh sessions does not establish this
  benefit.

The candidates below are prose sections with named inputs, not proposed JSON
objects. Small current facts can remain in task-specific prose. The names are
discussion labels, not a new persisted protocol or final block-key taxonomy.
Examples illustrate composition; the cited source owns the complete rules.

The proposed replacement covers all nine model-visible JSON environment fields
and the separate `# Current environment` JSON renderer. There would be no
parallel JSON environment delivery. Internal execution records, tool schemas,
structured submissions and authority enforcement remain structured; changing
their representation is outside this prompt-authoring proposal.

## Evidence and its limits

The [measurement script](2026-10-09-common-prompt-block-candidates/measure.py)
reads all thirteen retained operation packets and records input hashes in
[measurements.json](2026-10-09-common-prompt-block-candidates/measurements.json).
It reconstructs effective block state before each operation's additions and
checks that omitted current passages match the actual inherited bytes. It does
not infer inheritance from text appearing elsewhere in the run.

| Observed task | Substantial passages already reused | Existing framed bytes not appended |
| --- | --- | ---: |
| Context selection, inv-0005 | Requirements, scenarios, module context, checks and module pointers | 8,917 |
| Assignment, inv-0006 | Scenarios, module context, checks, work-item package and module pointers | 10,024 |
| Completion request, inv-0011 | Local architect procedure, module context, checks, work-item package and module pointers | 15,356 |
| Total | Only individually selected passages larger than 1,000 bytes | 34,297 |

These are **existing reuse**, not additional savings promised by this proposal.
The threshold selects passages for this analysis; it is not a runtime rule.
Counts include the current block framing. The earlier chat totals of roughly
8.4/9.5/15 KB mostly counted unframed briefing bodies; this table uses one
consistent framed-byte convention. The completion behavior in inv-0011 is
encoded as task kind `assignment` in its retained packet.

The nine JSON environment fields appended 35,373 bytes in this run. That is a
delivery inventory, not a savings estimate: useful facts must survive their
replacement, and some already appear elsewhere in the same prompt.

Fresh code, scope and design review messages contain identical 7,339-byte diff
payloads and 2,622-byte starting-point sections. Those reviewers do not all
inherit those inputs from their selected parents. Shared builders are useful;
their repeated delivery is not automatically avoidable.

No repair, capability delegation, contract engineering, failure-analysis,
reselection or NFR repair branch ran in this trial. Candidate reuse on those
branches below is supported by source composition, not measured live savings.

## Candidates with the clearest justification

### 1. Existing substantial procedures and shared scope instructions

Keep the existing substantial role/task procedures as common authored passages.
The local architect's main procedure is 7,143 framed bytes in the retained run;
assignment supplies it and the completion request inherits it. There is no need
to break every paragraph into its own tracked object.

Within the architect procedures, the shared
[write-scope passage](../../subs/harness/src/prompts/write-scope.procedure.md)
is already authored once and inserted by
[package construction](../../subs/harness/src/prompts/packages.ts). Its body is
about 2.5 KB. Local and capability architects both need its rules for owner
contents, included children, extra files, guarded files and read-only artifacts.
This is a concrete instance of the original common-block idea already working.

**Consumers:** local assignment/repair and capability assignment procedures;
continued use of the same main procedure. Engineers receive their operational
write rules, not the architect's instructions for constructing an assignment.

**Boundary:** retain the complete policy passage. Put the actual iteration's
write scope and individual authorizations in its task-specific assignment.
Assignment-bound defaults and ceilings can be a short adjacent paragraph; their
numeric values do not justify a separate persistent block.

**Example composition:**

> Assign work within the owner's contents. Including an immediate child includes
> its subtree; a nested project needs its own inclusion. Guarded files require
> this iteration's explicit authorization. [Complete shared scope rules follow.]
>
> For this assignment, the command/idle/absolute defaults are … and their
> respective ceilings are …. Explain any increase in `assignment.bounds`.

**Freshness:** prompt-package version for the rules; current effective policy
for the values. The latter must not be inherited from an unrelated invocation.

### 2. Work-item requirements and accepted context

One rendering of the selected plan elements, requirements, acceptance and useful
context, identified by their actual work-item/package revision. Local
architecture, engineering, code review and scope review need overlapping parts
of this material. Existing package renderers should remain the content owner.

The retained work-item package is 2,892 body bytes (2,988 framed). Assignment
and completion already reuse it. The scope fork appends the same content as an
`assignment-package`, with different framing/trailing spacing. This is a real
additional reuse opportunity: the selected parent already holds the content.
Fresh engineering and code-review sessions still need their own copy.

**Boundary:** immutable selected requirements and acceptance text belong here;
current implementation status, decisions made this turn, assignment approach,
review standing and revision-sensitive obligation rows stay in the task text.
Do not create both a requirements copy and an empty `<plan>` wrapper. A task
that needs the captured plan receives it once in an explicitly named section.

**Example:**

> Work item wi-001 implements the selected plan elements below. Their IDs and
> full text are retained so you can refer to them in your submission. …
>
> Your task now is to assign the next iteration. The current decisions and
> obligation states are listed below. …

**Freshness:** exact package selection/content revision, not merely the heading
or equal prose from another work item. Scenario texts must have one home if
they are included here; do not repeat them in a second scenario block.

### 3. Module context and navigation

Combine currently overlapping descriptions into one coherent passage: owner
name and purpose, declaration/README/source locations, test areas, and the API
views actually usable by this role. Supply project root and path-resolution
rules once. Keep the current cwd and changed view revisions in short current
task text when they would otherwise invalidate a large stable passage.

Sources are [module briefing](../../subs/harness/src/work/session.ts),
[starting inputs](../../subs/harness/src/work/starting-inputs.ts), and the
`taskBrief` construction in [run service](../../subs/harness/src/run/service.ts).
The local lineage already reuses a 2,157-byte module section and a 1,203-byte
pointer section. They overlap; their sum is not a proposed new-block size.

**Consumers:** initial/global architecture gets project/architect-view context;
local/capability architecture gets its owner context; engineers get their
authorized module/API context. A selector can reuse the orientation's context.
Snapshot-only reviewers get candidate navigation, not filesystem/API-view
instructions that their tools refuse.

**Example:**

> You work on module `<owner>`. Its README is `<path>`, source is `<path>`, and
> its testing source is `<path>`. Project-relative paths resolve from `<root>`.
> For a foreign project API used in ordinary source, search `<ordinary view>`;
> for testing source, search `<testing view>`. Each is its own complete source
> area view. Packages and built-ins are outside these catalogs. Consult the
> supplied metadata before treating a missing result as evidence of absence.

**Freshness:** owner/scope, source boundary, onboarding and available-view
identity. Do not claim a historical view is current after source changes.
Do not add a second project-wide semantic relevance calculation.

### 4. Project checks and focused scenario execution

Use the existing authored check guidance once: configured command, cwd,
configuration/profile pointers, and source/test/support locations where known.
For an engineer assigned scenarios, append the exact prepared focused command
and its required environment. This replaces both the redundant Cucumber JSON
dump and the duplicate scenario-command text.

The retained declared-check section is about 1.6 KB and is already reused along
the architect lineage. Engineering receives a 1,507-byte focused-command block
as well as a 2,755-byte Cucumber environment block containing overlapping facts.
The overlap is a within-prompt consolidation opportunity, not 4,262 bytes that
can all disappear.

**Consumers:** architecture uses declared checks to plan work; engineers,
contract engineers and NFR repair use their applicable runnable instructions.
Read-only reviewers may need candidate configuration pointers, but not the
writer's command-running instructions. Standalone command tasks receive their
specific command and restrictions.

**Example:**

> The project declares `<check>` in `<configuration>`. Run it from `<cwd>`.
> For the assigned scenarios, run the exact command below with these environment
> values: …. The selected profile loads …. Observed files do not establish what
> the configured runner loads.

**Freshness:** captured configuration/command/profile identity. Keep scenario
selection and command arguments task-specific when they change. Preserve exact
arguments and environment values; prose is not permission to paraphrase a
machine command. Relevant source:
[focused scenarios](../../subs/harness/src/work/focused-scenarios.ts).

### 5. Scenario binding and architect reporting rules

Separate the stable rules from changing scenario and obligation rows. The
[architect scenario instructions](../../subs/harness/src/work/scenario-briefing.ts)
contain a repeated 664-byte binding/reporting passage; the
[obligation briefing](../../subs/harness/src/work/obligations.ts) adds a repeated
694-byte reporting passage. Together they contain meaningful recurring policy,
but also overlap. Author one coherent architect passage rather than simply
concatenating both. Keep the engineer binding instructions as a distinct
consumer-specific passage.

**Consumers:** local/capability architects handling obligations; engineers
binding assigned scenarios. Frozen scenario text can be part of the work-item
requirements above. Current state, binding attribution, fakes and the revision
needed by a submission remain task-specific facts.

**Example, architect:**

> Engineers bind assigned obligations and identify any fakes. A passing gate is
> execution evidence, not your implementation judgment. Report an obligation
> done when you judge it correctly implemented and passing, using its current
> revision below. Feature files remain read-only. …

**Freshness:** rules change with the prompt contract; each current state/revision
must come from its task's durable records. The repeated clauses are observed;
the net size of a consolidated replacement has not been measured.

### 6. Selected design guidance

A substantial reusable reference body: exact selected guidance paths, hashes
and full text. The run delivered 12,350 bytes of guidance to orientation; the
design reviewer subsequently reread three READMEs totaling 13,824 tool-result
bytes. These are different representations, not additive savings estimates.

This candidate is already the subject of
[Plan 28](../plans/28-design-review-guidance-sessions/main-plan.md). Reuse must
preserve its candidate-hash grounding contract and fresh fallback. Removing
JSON fields alone does not make inherited guidance acceptable as concern ground.

**Consumers:** design reviews with the same selected guidance and content.
Fresh sessions need the body; prepared-session forks could inherit it under
Plan 28. Only one design review occurred in this trial, so repeated-review
benefit is not established.

**Example:**

> Judge the candidate against the guidance below. `<path>` has SHA-256 `<hash>`:
> [full document text]. …

**Freshness:** selection and file hashes. Task-specific candidate, comparison,
changed paths, patches and findings are outside this block.

### 7. Writer navigation, imports and operating rules

The ordinary and capability engineer roles share substantial passages:
navigation is about 1,246 bytes, tools about 1,588 bytes, and import/API discovery
about 3,670 bytes in the ordinary variant. Their common wording is an authored
reuse opportunity. The variants are alternatives; their common 8,748 bytes must
not be counted as duplicate deliveries to the trial's single engineer.

**Consumers:** ordinary/capability engineers; the applicable navigation, tool
and check portions can serve contract/NFR repair engineers. Read-only
consultation takes a read-only variant, not writer authority. Contract discovery
also needs its distinct provider architecture instructions. See the
[engineer role](../../subs/harness/src/prompts/engineer.system.md),
[capability engineer role](../../subs/harness/src/prompts/engineer-capability.system.md)
and [contract procedure](../../subs/harness/src/prompts/contract.procedure.md).

The reusable part explains how paths resolve, how tools are guarded, how to use
source-area-specific API views, and how to handle exposure and signature
companions. Module paths/revisions come from the module context above; current
write locations, guarded-file authorizations and effective limits are current
task inputs. Do not repeat the same navigation facts in both places.

> Relative file-tool paths and shell commands resolve from your current working
> directory. Structured submission paths remain project-relative. Use the
> importer area's supplied API view before choosing a foreign project API;
> foreign source does not establish importability. A view's coverage limits
> qualify absence. Never edit or import generated documentation. …
>
> Your current working directory is `<cwd>`. This invocation permits commands
> up to `<effective command bound>`, with idle/absolute bounds `<values>`.
> Your authorized write locations and configuration changes are …. …

The engineer's own obligation-binding rules are another concrete consolidation
opportunity. The observed message contains a 723-byte obligation section and
repeats its rules in the capability engineering procedure. Give those rules one
home, retain the exact assigned obligations and scenario text once, and keep the
engineer's binding report distinct from the architect's completion judgment.
The 951-byte scenario binding rules should likewise not be repeated by a broad
procedure and a scenario-specific briefing. These are **within-prompt**
duplications, even when the engineer starts fresh.

The observed engineer's 26,665-byte task message and 9,792-byte role instructions
establish scope for reviewing its composition. They do not establish how much a
rewrite would remove. No engineering continuation ran in this trial.

## Candidates that need a weaker claim

### Review inspection and evidence rules

Code and scope reviews share instructions for using complete delivered patches,
reading surrounding candidate source, stating coverage and grounding concerns.
The identical coverage paragraph alone is only 328 bytes; it does not justify
a separately tracked block. A coherent shared review passage could reduce
authored duplication, while retaining distinct code/scope/design questions and
the different guidance rule proposed by Plan 28.

Candidate facts, comparison base, gate identity, read scope, pending-tag binding
provenance and current findings belong in a readable task-specific briefing.
Diffs and starting points already have shared builders. Their equality across
fresh reviewers establishes common content, not additional delivery savings.
See [review messages](../../subs/harness/subs/reviews/src/message.ts) and
[reviewer instructions](../../subs/harness/src/prompts/reviewer.system.md).

An **audited comparison** is nevertheless a substantial common input assembly
for code/scope/design review, with exact base/commit/tree, passed gate, changed
paths and patches. Render its useful identities once instead of repeating them
in a serialized review request, environment objects and prose. Keep the bounded
patch fallback: omitted or summarized patches do not count as inspected; the
reviewer must fetch them. Preserve missing-assignment and no-plan-in-candidate
branches. The package describing assignment intent does not itself establish a
candidate-file ground for a concern.

> Review commit `<candidate>`, tree `<tree>`, against `<base>`. Gate `<gate>`
> passed for this candidate. The following paths and patches belong to that
> fixed comparison. Fetch any omitted complete patch before reporting its path
> inspected. The supplied assignment intent and starting points follow. …

### Catalog element semantics and NFR requirements

The catalog's element semantics contain about 2,259 bytes repeated verbatim in
fresh intake/check role instructions. This is a source-sharing candidate; those
two sessions do not inherit from each other. Preserve the distinction between
capturing human input and the initial architect's interpretation.
The full passage is in the
[catalog extractor role](../../subs/harness/src/analysis/catalog-extractor.system.md).

NFR assessment/action/investigation can share the selected requirement catalog
and their bounded inspection rules, but current source starts them fresh. Their
current candidate/comparison evidence and task-specific decisions must be
delivered each time. Do not introduce session reuse merely to make an authored
block seem beneficial. Read-only investigation findings need their actual
accessible evidence, not just paths to unavailable run records.

These candidates need an authored-duplication comparison before deciding that a
new shared passage is useful. They do not yet justify new delivery machinery.

A **prepared-source briefing** would replace the NFR source JSON with candidate
tree, contextual HEAD, named comparison boundaries, changed paths, original
dirty-capture status, read scope and the limitations on historical inference.
The retained source block is 1,740 bytes; the assessment's requirement package
is another 1,335 bytes. These are substantial common input assemblies even
though current assessment/action/investigation sessions start fresh.

> Inspect prepared tree `<tree>`; HEAD `<head>` is context. `run-start` compares
> `<start>` with this tree, while `accepted-boundary` compares `<accepted>` with
> it. These show net changes between their recorded boundaries, not every
> intermediate edit. An empty diff does not prove historical preservation.
> [State the original capture's dirty condition and the permitted read scope.]
> Assess the supplied requirements from inspected source, preserving their
> conditions, evidence and uncertainty. …

Assessment judges all fixed/NFR requirements; investigation answers only its
named question and scope; action chooses the currently permitted next step.
Keep those different responsibilities in task-specific instructions. An action
brief should carry the accepted assessment and investigation evidence as
per-requirement prose, including scope and uncertainty, rather than opaque JSON
or inaccessible submission paths. Its decision constraints remain explicit.
See [NFR prompts](../../subs/harness/src/nonfunctional/prompts.ts) and
[bounded tools](../../subs/harness/src/nonfunctional/submissions.ts).

### Specialized procedures that should remain substantial units

The contract engineer's 3,695-byte skill, 5,056-byte procedure and
[task message](../../subs/harness/src/contracts/session.ts) overlap on interface
authority, naming, exposure and fake invariants. Consolidate those rules inside
its existing procedure/skill assembly rather than creating small tracked blocks
for every rule. Keep new-agreement versus revision instructions and consumer
evidence task-specific. This legacy contract workflow is selected when
`capabilityWorkflow` is false; it was not exercised by the retained run.

The [failure-analysis procedure](../../subs/harness/src/prompts/failure-analysis.procedure.md)
is already a coherent 2,067-byte unit. Its failed invocation's goal, bounds,
transcript/command endings, patch, evidence paths and unavailable evidence are
unique input. Analysts start fresh, so there is no demonstrated inherited
procedure saving. The initial/global architect's roughly 3.2 KB adapted
discovery skill is another existing substantial shared unit; it should not be
added to every architecture-related role merely for uniformity.

Standalone engineering begins fresh. Contract repair can continue its contract
session. Consultation forks the original accepted capability-request point,
not the preceding consultation answer; a later consultation therefore does not
automatically inherit text delivered to an earlier consultation. NFR repair
starts fresh and reports work completed/partial, not NFR satisfaction. Those
boundaries constrain any later delivery-savings calculation.

## Complete disposition of the JSON environment fields

| Current field | Proposed model-visible destination | What must not be lost |
| --- | --- | --- |
| `projectRoot` | Module/project context when navigating files; otherwise a short relevant task sentence | The correct root for project-relative paths |
| `workingDirectory` | Current task execution-location sentence; omit misleading filesystem context from snapshot-only tasks | Actual effective cwd, including fallback cwd |
| `candidate` | Current candidate/comparison paragraph for a task that uses it | Exact commit/tree and the decision's source boundary |
| `snapshot` | Same paragraph, preserving a distinct snapshot identity where one exists | The tool-bound snapshot; never equate different identity types implicitly |
| `limits` | Architect defaults/ceilings paragraph; engineer effective bounds sentence; current repair/attempt facts where needed | Effective overrides and actionable remaining constraints |
| `availableTools` | Actual tool declarations and existing activation notices; task states its submission tool and important authority restrictions | Inactive historical tools must not appear usable after a role change |
| `views` | Role-appropriate module/project navigation | Paths, source-area separation, revisions and coverage limits, only where tools permit access |
| `supportPaths` | Delivered manifest/provenance only | Which source instructions produced the prompt remains inspectable outside it |
| `cucumberConfiguration` | Project checks plus the exact applicable focused-scenario instructions | Configuration/profile, command/cwd, required environment and loaded support paths |

The current limits object contains 28 values. Assignment authors need the three
policy defaults (command, idle, absolute) and their three ceilings. Engineers,
contract engineers and NFR repair need their **effective** command/idle/absolute
bounds, including assignment overrides. A failure analyst already receives the
failed invocation's bounds in its evidence digest; copying the analyst's own
limits does not substitute for that evidence.

Workflow caps/retry counters should appear only as actual task facts when the
agent has a corresponding decision to make. Current attempt/remaining allowance
is more useful than a dump of every global maximum. `stopSettleMs`,
`writerSettleMs`, `maxWorkItems`, `maxPlacementRequests`,
`cycleReplansPerWorkItem` and `laterRoundMinimumRisk` remain runtime settings,
not a new prose list. No proposal here lets an agent bypass enforced bounds.

For tools, the Pi adapter already announces active-tool changes and rejects
inactive historical tools; see
[session operations](../../subs/harness/subs/agent/subs/pi/src/session-operations.ts).
That existing behavior must survive removal of the redundant environment list.

Both [task packet construction](../../subs/harness/src/prompts/tasks.ts) and the
fallback/legacy environment rendering in
[packages](../../subs/harness/src/prompts/packages.ts) must eventually adopt the
chosen prose composition. Changing one and retaining the other would not meet
the requested complete replacement.

## What stays unique to each prompt

Keep the current objective, selected task/procedure, submission target, current
candidate and comparison, effective invocation bounds, actual cwd, current
obligation states, repair failure/attempt, consultation question, assignment
scope, decisions and fresh evidence in direct task prose. Some of these use
shared rendering functions; that does not make each field a reusable block.

For example, a fresh engineering prompt could comprise its role/procedure,
work-item requirements, module context, check instructions and binding rules,
followed by its unique assignment and current execution facts. A continuation
can reuse unchanged applicable passages, then state the changed assignment,
evidence and current facts directly. A scope review uses its reviewer rules,
the work-item package and its current candidate/diff question; it does not
inherit the architect's authority merely because it inherits history.

If delivery reuse is retained, it must resolve at the selected session point.
Changing from A to B and back to A requires restoring A; historical presence
alone is insufficient. New task prose must clearly supersede stale execution
facts. The exact replacement/withdrawal mechanism is a later design decision,
not a reason to turn every fact into its own object.

## Evaluation still to make

The strongest candidates are substantial existing procedures, work-item
requirements, module context, project checks and selected design guidance.
Separating stable scenario/reporting instructions is a smaller measured
opportunity. Shared review/catalog/NFR wording mainly offers authoring reuse
under current session topology.

Before deciding to implement, select the candidates worth authoring and compare
the resulting full prompts and continuing-task additions. Account for overlap,
new framing and necessary current facts. The observed 34,297 bytes of existing
reuse, 35,373 bytes of environment delivery and cross-review repeated payloads
must not be added together as projected savings. This inventory makes no token,
latency, cost or semantic-quality improvement claim and runs no live benchmark.
