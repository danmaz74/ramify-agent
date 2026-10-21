# Descriptive identifiers for plans and execution

**Revised:** 2026-10-21. **Status:** proposed assisted implementation plan;
the earlier Plan 42 run remains incomplete.
**Target:** ramify-agent. **Inspected source:**
`233021c75f9f539865a0f05ae58925fc88bd306e`.
**Execution:** native Astra coordination and Sol implementation, with ramify-agent
(RA) assessment of each committed iteration and cumulative completion assessment.
The iterations below are a proposed breakdown; the coordinator adapts assignments
and sequencing to evidence while preserving requirements and acceptance.
Editing this source neither changes a captured plan nor starts or resumes work.

## Problem and intended result

Agents and people encounter opaque planning identifiers such as `nfr-003`,
`ps-01`, `sc-001` and `wi-001`. Some reference fields have the same name before
and after submission-local keys become accepted IDs. In the revision-preview
trial after Plan 41, the initial architect supplied accepted non-functional IDs
where local functional keys were required. Fifteen reference diagnostics caused
a rejection and correction despite existing guidance and validation.

Make harness-defined semantic planning identities descriptive, and make reference
fields explicit about the kind and acceptance stage they require. The actual
accepted reference must carry the descriptive name; a friendly display title
beside an opaque reference does not fulfill this outcome. Preserve complete text,
conditions, source and uncertainty alongside the name. Clearer naming is a
proposed usability improvement, not proven prevention or a measured efficiency gain.

Use ordinary submission and acceptance to allocate names. This revision replaces
the mandatory `register_names` tool and its reservation, consumption, release and
abandonment protocol. Authors propose names in the records they already submit;
existing validation returns collisions and reference errors for correction. No
separate registration call, naming session, reservation store or reservation
lifecycle is required or part of this plan.

## Current state and earlier work

The inspected main checkout still uses numeric element IDs in
`subs/harness/subs/plan-evidence/src/interfaces/catalog.ts`, numbered plan origins
in `subs/harness/subs/scenarios/src/extraction.ts`, and shared `requirementRefs`
and `acceptanceRefs` field names in the initial analysis submission. The earlier
Plan 42 worktree contains partial provider changes and attempted consumer
integration, without whole-plan acceptance. Treat that code as possible reusable
work, not a completed prerequisite or an integration baseline. Review any reused
change against this revised outcome and the current owners.

The harness has since been decomposed into planning, work coordination,
acceptance, assistance, task execution and persistence owners. Recovery uses
ordinary task restart with optional session reuse. Reviews use the current
review/fix workflow. Preserve those changes; do not restore old runtime/prompt-hash
vetoes, exhaustive inspection obligations or restricted tools.

The original run's captured input, accepted work, failed attempts and evidence
remain unchanged. Execution of this revision needs explicitly captured revised
input; editing the source cannot replace the original run's requirements.

## Required behavior

### Names and scope

Use the full entity namespace, a colon, and a descriptive lowercase kebab-case
name. Submission-local keys use the additional `draft:` prefix. These examples
define vocabulary and shape, not identities execution must assign to this plan:

| Entity | Example accepted ID |
| --- | --- |
| Functional catalog requirement | `functional-requirement:preview-missing-predecessor` |
| Non-functional catalog requirement | `non-functional-requirement:inspection-snapshot-isolation` |
| Fixed requirement from principles | `fixed-requirement:preserve-module-boundaries` |
| Context element | `context:existing-review-workflow` |
| Recommendation | `recommendation:reuse-predecessor-resolver` |
| Captured document | `document:revision-preview-plan` |
| Captured plan scenario origin | `plan-scenario:preview-rejects-missing-predecessor` |
| Registered execution scenario | `scenario:preview-rejects-missing-predecessor` |
| Entry capability | `capability:add-revision-preview` |
| Architectural hypothesis | `hypothesis:reuse-core-predecessor-resolver` |
| Work item | `work-item:add-revision-preview` |
| Capability request | `capability-request:resolve-review-predecessors` |
| Capability task | `capability-task:provide-review-predecessor-resolution` |
| Capability example | `capability-example:reject-unknown-predecessor` |
| Contract | `contract:review-predecessor-resolution` |
| Provider obligation | `provider-obligation:provide-review-predecessor-resolution` |
| Consumer requirement | `consumer-requirement:preview-resolves-review-predecessors` |
| Plan deviation | `plan-deviation:revise-preview-compatibility` |
| Finding requiring a decision | `finding:missing-world-companion-exports` |

Account for these families and additional semantic planning identities found in
the current implementation in the delivery inventory. Already descriptive names
need only changes necessary for consistent, unambiguous references. Module paths,
exported symbols, external check/test identities and user-supplied project or plan
names preserve their existing contracts.

Run, invocation, session, operation, event, assessment and audit receipt IDs,
revision/iteration counters, command deduplication keys, hashes and provider-owned
IDs remain technical identities and may keep their existing formats. Review
requests and attempts may also retain technical IDs while their planning
references use the new contract. This exception cannot conceal an opaque work
item, requirement or other semantic planning reference behind a friendly label.

A name describes an obligation, behavior or subject. Avoid generic names such as
`requirement-3` or `fix-issue`, and mutable status, priority or module ownership.
Where naming needs free-text interpretation, the responsible agent proposes the
name during its existing task. Guidance and ordinary review assess its meaning;
keyword rules do not. No separate model invocation solely for naming is needed.
Mechanically captured documents/scenarios can use explicit paths or scenario
names, and derived records can use an accepted parent's name, with documented
deterministic normalization. Do not infer semantic names from arbitrary prose.

### Allocate within ordinary acceptance

An author supplies a proposed name with each new semantic entity in its existing
submission. Local keys such as
`draft:functional-requirement:preview-missing-predecessor` identify same-submission
references. The harness validates shape, namespace, uniqueness and references,
then assigns accepted IDs and resolves keys as part of accepting that submission.
A draft is not an accepted requirement or authority for another operation.

Uniqueness is enforced over the run, namespace and descriptive name, including
accepted and retired identities. A name can repeat in another run. Distinct
obligations cannot silently merge, replace one another or redirect a reference.
Reject agent-authored collisions with the affected field and useful conflict
context so the author can add a meaningful qualifier. Do not silently append
numeric suffixes to agent-authored proposals. Equal mechanically captured names
remain distinct through source context and, where necessary, a stable short
discriminator supplementing the descriptive name.

Use the existing durable acceptance transaction and serialization boundary for
uniqueness, accepted records and their resolved references. Validate the complete
submission before accepting its semantic records. Rejection accepts no partial
entities. Concurrent submissions for the same name cannot both succeed. Retry
of an already accepted logical submission returns its recorded result; recovery
cannot allocate duplicate entities or leave references to missing records.
Changing an accepted submission follows its ordinary correction authority, never
overwrites it under the same retry identity. Proposing a name creates no separate
durable claim needing cleanup after rejection.

Accepted IDs are immutable. Permitted wording corrections and owner changes keep
the ID. Authorized splits, merges or changes of kind retire affected IDs, record
replacement relationships and update affected references. Retired IDs are never
reused. Naming adds no authority to revise frozen catalogs or registered scenario
wording. Cross-run references retain their run/catalog identity; matching names
do not establish equivalent meaning across runs.

### Explicit reference contracts and diagnostics

New fields distinguish local keys from accepted IDs and identify the allowed
family. For example, local functional citations use `functionalRequirementKeys`
and `functionalAcceptanceKeys`; accepted equivalents use `functionalRequirementIds`
and `functionalAcceptanceIds`. Context references use `contextKeys` or `contextIds`.
Scenario references distinguish `planScenarioId`, `scenarioKey` and `scenarioId`.
Apply the distinction to other affected fields; declare mixed families explicitly.

The schema actually delivered to the author describes the namespace, lookup
source, one valid example and the relevant invalid alternative. Instructions,
examples, validation and accepted-record fields agree. Supply relevant existing
references when helpful without embedding the whole catalog in every tool
description. Same-submission references resolve against that submission.

Reject unknown, wrong-kind, draft-in-accepted, accepted-in-draft, retired and
foreign-run references at their precise field path. Explain what was supplied,
what the field requires and where valid references can be found. In particular,
an accepted non-functional ID cannot satisfy a local functional key field; its
classification and ordinary selection/assessment remain valid. Do not reclassify
an obligation, fuzzy-match a misspelling or select an ambiguous reference to pass.
Return actionable feedback through ordinary correction without a fixed rejection
quota or a separate naming workflow.

### Propagate through real consumers

Use accepted descriptive IDs in catalog packages, analysis, work assignments,
capability and contract delegation, scenario registration, findings, corrections,
deviations, reviews, assessments and projections. CLI/API selection and web
details resolve the same references delivered to agents. The harness owns identity
allocation and durable state; the web receives those contracts. Assistance must
continue to assess candidates and inspect evidence containing new identities;
it need not acquire autonomous planning operations.

Preserve full text, conditions, source attribution, uncertainty and authority.
Feature tags/paths, stored record paths and URLs need explicit collision-safe
encoding or mappings where their syntax differs from the ID syntax. Verify round
trips rather than using colon-delimited IDs as unchecked paths. Captured origins,
local keys and registered scenario IDs remain distinct even when their suffixes
match. Wording, coverage, ownership, pending state and completion authority do not
change with their spelling.

### Versioning and ordinary continuation

Fresh runs use an explicit descriptive-identifier contract. Version affected
submission and record shapes together with their producers and consumers; merely
broadening a regex while retaining a contradictory old schema is insufficient.

Supported historical runs, accepted submissions, frozen packages, transcripts,
features and reports retain their exact IDs, bytes and hashes. Readers resolve
legacy records without bulk rewriting or inferred semantic backfill. Supported
continuation of a legacy run retains that run's naming/reference contract for
newly accepted work. The installed default must not mix new descriptive IDs into
its legacy namespace.

Continue unfinished work using current runtime procedures and durable task
records, with optional session reuse. A changed source, dependency or prompt hash
alone is not incompatibility. Report a concrete unreadable contract or missing
required operation at the relevant boundary, preserving inspectable work and
ordinary correction where possible. Preserve explicit stops, pending decisions,
execution settlement and acceptance authority. Session loss must not require a
name reservation or exact replay of an authoring conversation.

## Constraints and specification alignment

Carry these obligations into implementation:

- `docs/harness.principles.md` and `docs/prompt-optimization.principles.md`:
  agents judge free-text meaning; code validates structured facts. Supply useful
  guidance and ordinary tools, preserve module ownership, and keep durable writes
  with their harness owners.
- `docs/harness-recovery.principles.md`: KISS governs recovery; retained tasks and
  accepted results support ordinary restart. Session context is optional,
  historical evidence stays truthful, and accepted effects are applied once.
- `docs/architecture/plan-context-catalog.spec.md`: preserve the five element
  kinds, source restrictions, full unchanged delivery of selected elements,
  conditions, uncertainty and catalog freezing. Context and recommendations stay
  unassessed; non-functional requirements keep separate selection and assessment.
- `docs/architecture/acceptance-scenarios.md` and `docs/harness.spec.md`: preserve
  origins, accepted scenario wording, authorized deviations, obligation state,
  audit ownership and focused feature selection. Use current review inspection
  and correction contracts rather than reviving older coverage rules.
- `docs/testing.spec.md`: ordinary tests script external Git, CLI, audit and
  command answers with the process guard active. Actual tool/kernel claims need
  an exact reviewed entry in `src/tests/test-boundaries.json`.

The intended contract change is identifier/reference syntax for new versioned
runs. During implementation, update specifications prescribing numeric IDs,
ambiguous fields or scenario tags to describe new and legacy contracts. Preserve
historical evidence and existing protection authority. This plan does not itself
edit governing specifications or adopt proposed principles. No new semantic
classification, provider API, naming permission system or recovery framework is
required. Shared identity helpers may reduce duplication; a new module or service
is not a deliverable in itself.

## Acceptance

These IDs are illustrative witness inputs for the product behavior under test.
Assisted execution assesses these scenarios against committed implementation;
the plan does not require an autonomous planning run to execute its own work.

```gherkin
Scenario: Ordinary submission delivers meaningful accepted references
  Given an analysis proposes the local key "draft:functional-requirement:preview-missing-predecessor"
  And its entry and scenario cite that key in the appropriate fields
  When the author submits the complete analysis without a name registration call
  Then acceptance resolves the references to "functional-requirement:preview-missing-predecessor"
  And the engineer receives the full requirement text, conditions and source
  And CLI and web work-item details resolve the same accepted requirement

Scenario: Reference diagnostics preserve semantic classification
  Given a submission defines a valid local functional key
  And cites an accepted non-functional ID where a local functional key is required
  When the harness validates the submission
  Then it rejects that field without accepting partial semantic records
  And its diagnostic explains the two namespaces and where valid keys are found
  And the non-functional requirement retains its classification and assessment path

Scenario: Colliding proposals are corrected in the existing authoring task
  Given an accepted requirement already uses "functional-requirement:preview-input"
  When an author submits a distinct requirement with that same name
  Then the harness returns the collision without replacing the accepted requirement
  When the author supplies a meaningful qualifier in a corrected submission
  Then ordinary acceptance succeeds without releasing or acquiring a reservation

Scenario: A rejected batch creates no partial planning entities
  Given one submission proposes two new requirements
  And one proposal conflicts with an accepted or retired name
  When the harness validates the submission
  Then neither new requirement is accepted
  And existing records and references remain unchanged

Scenario: Concurrent acceptance and retry preserve one identity
  Given two authorized submissions propose distinct requirements with the same namespace and name in one run
  When their acceptance overlaps
  Then exactly one submission accepts that name and the other receives a collision
  When the accepted submission is retried after a lost reply and service restart
  Then the harness returns its recorded IDs without allocating duplicate records
  And an independent run may accept the same spelling

Scenario: Interrupted acceptance preserves records and references together
  Given a valid submission proposes names and references between its entities
  When acceptance is interrupted at a persistence boundary and recovered
  Then recovery exposes either the prior state or the complete accepted result
  And no reference resolves to a partially accepted entity
  And retry applies the logical submission at most once

Scenario: Equal captured names remain distinct
  Given two captured scenarios in different source locations have the same name
  When the harness assigns descriptive origins and materializes registered scenarios
  Then source context distinguishes their IDs with stable allocation on retry
  And each feature and focused target resolves to its own scenario and origin
  And scenario wording and completion authority remain unchanged

Scenario: Authorized correction preserves stable and retired identities
  Given an accepted descriptively named requirement permits a wording correction
  When its wording or module owner changes under ordinary authority
  Then its ID and existing references remain stable
  When an authorized correction splits its obligation into two
  Then the old ID is retired with replacements and updated affected references
  And a later proposal cannot reuse the retired ID

Scenario: Capability delegation preserves descriptive relationships
  Given a work item requests a capability with a named behavioral example
  When its provider obligation and consumer requirement are accepted and resolved
  Then their distinct descriptive IDs resolve to the original request
  And provider handback and consumer verification update the intended work item
  And serialization and reload preserve those relationships

Scenario: Unknown and foreign references are not repaired by guessing
  Given a run contains two similarly named accepted requirements
  When an assignment cites a misspelling or a foreign requirement without its run identity
  Then the harness rejects the reference without selecting a substitute
  And identifies the source of valid references for that field

Scenario: Supported legacy inspection and continuation retain original identities
  Given a supported legacy run contains numeric IDs and frozen deliveries
  When the upgraded harness displays its details and continues an unfinished task
  Then historical references resolve without changing persisted bytes or hashes
  And newly accepted work uses that run's legacy naming and reference contract
  And current procedures require neither a reservation nor the former session

Scenario: A concrete unavailable contract leaves retained work inspectable
  Given continuation needs a record contract the installed runtime cannot read
  When the task reaches that required operation
  Then it reports the unavailable contract without guessing replacement identities
  And retained work and historical references remain inspectable
  And a source or prompt hash change alone is not reported as incompatibility

Scenario: Continued and forked tasks preserve delivered identities
  Given a session contains an accepted assignment with descriptive references
  When the harness continues it and forks from an admitted source point
  Then both tasks resolve references to the appropriate accepted records
  And inherited deliveries retain their recorded bytes and source identities

Scenario: Findings and deviations remain actionable through public consumers
  Given a new-format run records a named finding and an authorized named plan deviation
  When their references reach assessment and CLI and web details
  Then each resolves to the intended record and its current disposition
  And URL and stored-path encoding preserves distinct identities
  And identifier changes supply neither acceptance nor deviation authority
```

Assess representative names and delivered schemas for every scoped family;
mechanical validation cannot establish semantic adequacy. Retain a concise family
inventory mapping producers, consumers, contract versions and verification.
Use composed consumer witnesses alongside focused acceptance/replay tests, with
controlled interleavings and fault injection where needed. Cover assisted
assessment using new identities without adding autonomous authoring to assistance.
Inspect that ordinary naming adds no registration operation or reservation state.
Do not invent speed, token or rejection-rate targets or claim gains without evidence.

Implementation qualification uses relevant owner tests, type checks,
`npm run check:self` and the configured default audit on a clean committed
candidate. Let the auditor choose scope and retain every configured project.
Semantic completion follows RA's assisted assessment workflow, including a
cumulative assessment against this complete plan after integration. A live
paid comparison, provider release or harness run is not required to validate this
authored document.

## Module impact and existing behavior

Expected owners and integration points, not write restrictions or evidence of
consumer importability:

| Owner | Relevant behavior and integration |
| --- | --- |
| `subs/harness/subs/plan-evidence/` | Element/document identity, catalog acceptance and complete package rendering. |
| `subs/harness/subs/scenarios/` | Captured origins, scenario forms and registered IDs, features and state. |
| `subs/harness/subs/autonomous/subs/planning/` | Initial analysis, extraction, draft references and accepted planning records. |
| `subs/harness/subs/autonomous/subs/work-coordination/` | Work items, capability/contract delegation and authoring/consumer paths. |
| `subs/harness/subs/autonomous/subs/acceptance/` | Obligations, review/assessment references, deviations and completion. |
| `subs/harness/subs/check-findings/` | Finding identity, decisions and replay shared by execution paths. |
| `subs/harness/subs/assistance/`, `subs/harness/subs/task-workflow/` and `subs/harness/subs/ledger/` | Existing assessment, delivery, transaction and retry facilities; preserve their distinct ownership. |
| `subs/harness/subs/projections/`, public protocol and `subs/web/` | Lookup, historical readers and public selection/display. |

Orientation used refreshed architect and planning ordinary/testing API views at
the inspected source revision. The views report coverage and truncated details;
the proposed reuse points below were checked in defining source. Missing view
entries do not establish that a consumer lacks access. Refresh the relevant
consumer views again when implementing a changed interface.

The main integration seam is the accepted analysis bundle:
[planning acceptance](../../subs/harness/subs/autonomous/subs/planning/src/accept.ts)
derives work items, scenarios, hypotheses and registry entries, and
[planning execution](../../subs/harness/subs/autonomous/subs/planning/src/planning.ts)
stages catalog evidence and commits the `analysis-accepted` transition. Catalog,
scenario and initial work-item changes therefore need joint integration; separate
provider-only completion would leave the motivating submission failure unresolved.

Reuse the [catalog](../../subs/harness/subs/plan-evidence/src/interfaces/catalog.ts)
for kind/source validation, retired identities and complete package delivery,
the [scenario renderer](../../subs/harness/subs/scenarios/src/rendering.ts) for
feature/tag translation, and existing autonomous acceptance and ledger facilities
for durable transitions. The ledger remains unaware of semantic entity families.
The [capability records](../../subs/harness/subs/autonomous/subs/work-coordination/src/capability/records.ts)
have separate request, task and example identities; their delegation lifecycle
forms a useful second focus after the accepted-analysis contract is established.

The contracts that must remain stable are semantic classification, source and
wording authority, complete delivery, obligation state, historical bytes and
acceptance authority. Contract versions, draft-to-accepted resolution, retirement
relationships and reversible path/tag encoding need joint design at their owning
boundaries. Update the relevant specifications with each implemented contract.
No new shared service or exposure is presumed: inspect each actual consumer's
ordinary/testing API catalog before changing imports, and update owner and
ancestor declarations only where the chosen implementation requires them.

## Proposed implementation iterations

The sequence groups changes by the knowledge needed to implement and verify them.
Module focus is an orientation aid; a Sol worker may inspect and change other
owners where necessary to complete the outcome. Reuse an oriented worker for
closely related integration and repairs. Every iteration ends with relevant
worker verification, a committed candidate and RA assessment; resolve findings
through the ordinary repair and reassessment workflow before depending on the
result. The coordinator manages assessment mechanics and durable progress.

### 1. Accept descriptive catalogs and initial analysis together

**Outcome and acceptance.** Implement the naming and explicit-reference contracts
for captured documents, all five catalog kinds, plan origins, entry capabilities,
hypotheses, initial work items and registered scenarios. Resolve draft references
in ordinary submission, deliver actionable schema guidance and diagnostics,
and accept the complete semantic bundle atomically. Establish the run's explicit
contract version and legacy dispatch at the same boundary. Preserve the current
default until every consumer needed by new-format runs is compatible.

**Focus and rationale.** Planning, plan-evidence and scenarios are the principal
owners, with autonomous run admission/commit, initial work-item records and
delivery consumers included. Their schemas and acceptance functions evolve
together; grouping them avoids repeated catalog and reference integration.
Complete the initial family inventory here and use existing acceptance/retry
boundaries rather than introducing reservations.

**Interactions.** Include extraction prompts and delivered tool schemas, catalog
packages, scenario form validation, feature rendering, focused selection and
necessary protocol readers. Define collision-safe encoding with the consumers
that use it. Implement catalog correction/retirement within existing authority.
Any new helper's placement follows responsibility and actual consumer access.

**Dependencies and verification.** No earlier partial run is a prerequisite.
Use real catalog, planning, scenario and work-item functions together with
scripted external operations. Cover the submission-to-engineer portion of
“Ordinary submission delivers meaningful accepted references”, and these witnesses:

- “Reference diagnostics preserve semantic classification”.
- “Colliding proposals are corrected in the existing authoring task”.
- “A rejected batch creates no partial planning entities”.
- “Concurrent acceptance and retry preserve one identity”.
- “Interrupted acceptance preserves records and references together”.
- “Equal captured names remain distinct”.
- The catalog cases of “Authorized correction preserves stable and retired identities”.

Verify the full diagnostic matrix, including retired and
wrong-stage references, and unchanged legacy catalog/scenario bytes. CLI/web
witnesses are completed in iteration 4; the core submission path must work here.

### 2. Preserve identity through work and capability delegation

**Outcome and acceptance.** Carry descriptive accepted references through later
work creation, assignments, capability requests, tasks and examples, contracts,
provider obligations, consumer requirements and handback. Preserve IDs for
authorized wording/owner changes; implement retirement and replacement handling
for affected execution entities without weakening correction authority.

**Focus and rationale.** Work coordination owns most of this reasoning. Include
its planning, task delivery and acceptance consumers in the same iteration so
request/provider/consumer relationships are verified together.

**Interactions.** Reuse iteration 1's version selection, reference rules and
acceptance facilities. Update author-facing schemas and briefings with their
record consumers; carry the same IDs through serialization, reload, corrections
and verification. Extend the family inventory for identities discovered here.

**Dependencies and verification.** Depends on iteration 1. Demonstrate
“Capability delegation preserves descriptive relationships”, execution-entity
cases of “Authorized correction preserves stable and retired identities”, and
“Unknown and foreign references are not repaired by guessing”. Exercise actual
provider handback and consumer verification, plus collision, retry and interrupted
acceptance cases at any distinct durable submission boundary. Keep legacy
delegation and new assignments under a legacy run's contract working throughout.

### 3. Carry findings and deviations through assessment

**Outcome and acceptance.** Implement descriptive finding and plan-deviation
identities, correction references and review/assessment consumers. Preserve
dispositions, non-functional selection/assessment and completion authority.
Assistance can assess candidates and inspect evidence containing the new IDs.

**Focus and rationale.** Check-findings and autonomous acceptance hold the core
state rules; assistance and reviews are integration consumers. Keep the identity
change narrow across these owners rather than assigning one worker per module.

**Interactions.** Integrate finding decisions, deviation records, packages,
review evidence and assisted assessment with the versioned run contracts.
Technical review, attempt and receipt IDs may keep their existing formats.
Assistance receives no autonomous planning operations.

**Dependencies and verification.** Depends on iterations 1 and 2 for accepted
planning/work references. Demonstrate the assessment/disposition portion of
“Findings and deviations remain actionable through public consumers”, including
serialized reload and supported historical records. Exercise assisted assessment
with real evidence readers and scripted agent/audit answers. Complete its public
selection/display witness in iteration 4.

### 4. Integrate public selection and encoded references

**Outcome and acceptance.** CLI/API selection, projections, web details, stored
record paths, feature tags and focused targets resolve the same accepted IDs
delivered to agents. Preserve distinct identities through encoding and decoding.

**Focus and rationale.** Projections and the harness public protocol, with root
CLI and web consumers, form one integration focus. They now receive stable
contracts from the preceding iterations, reducing repeated UI and reader edits.
Harness owners retain allocation and durable writes.

**Interactions.** Finish all consumer adaptations and legacy readers for the
family inventory, including full text, conditions, uncertainty and source
attribution. Verify feature/tag selection through the scenario and acceptance
owners, not just an isolated encoding helper.

**Dependencies and verification.** Depends on iterations 1–3. Complete the CLI
and web parts of “Ordinary submission delivers meaningful accepted references”
and “Findings and deviations remain actionable through public consumers”. Use
composed witnesses from accepted records through public lookup and display;
cover URL/path/tag round trips, equal captured names and focused targets, and
supported legacy inspection without rewriting evidence. Mocked public payloads
alone do not demonstrate this integration.

### 5. Qualify continuation and enable the complete fresh-run contract

**Outcome and acceptance.** Fresh runs use the complete descriptive contract.
Legacy runs continue with their original contract. Retained tasks, retries,
continuations and admitted forks preserve accepted identities and deliveries;
concrete unavailable contracts produce the required inspectable failure.

**Focus and rationale.** Autonomous lifecycle, task workflow and persistence
integration are the focus, with fixes in affected producers/readers as needed.
Recovery is verified across the completed feature; it is not a replacement
recovery framework or a reason to postpone compatibility in earlier iterations.

**Interactions.** Enable the fresh-run default only after all required paths are
compatible. Finish specification alignment and the family inventory, including
representative names, delivered schemas, version selection and verification.
Preserve historical run evidence and the original Plan 42 baseline.

**Dependencies and verification.** Depends on iterations 1–4. Demonstrate
“Supported legacy inspection and continuation retain original identities”,
“A concrete unavailable contract leaves retained work inspectable”, and
“Continued and forked tasks preserve delivered identities”. Extend interruption,
concurrency and lost-reply witnesses across the composed runtime with controlled
interleavings and fault injection. Verify that source/prompt hash changes alone
do not reject continuation and that no registration/reservation state was added.
Run relevant owner tests, type checks and `npm run check:self`, then the configured
default audit on a clean committed candidate. RA performs cumulative assessment
against all requirements and acceptance scenarios in this plan, including semantic
adequacy of names and cross-iteration consumer behavior.

## Sequencing assumptions and material uncertainties

- Exact version identifiers and dispatch locations remain implementation choices.
  Resolve them in iteration 1, including how a run's contract reaches every
  producer and reader. If a required consumer cannot be adapted incrementally,
  bring that adaptation into the same iteration rather than emitting mixed
  contracts or enabling an incomplete default.
- The existing acceptance transition is a reuse point, not proof that every
  submission already serializes uniqueness and retirement correctly. Inspect
  each distinct boundary as it is changed; include any necessary repair and its
  composed interruption/retry evidence in that iteration.
- The scoped family list is a minimum. Additional semantic identities found in
  current source join the relevant iteration and inventory. Technical IDs keep
  the stated exemptions; uncertain classification is resolved against the
  behavior the identity names, without shrinking the required outcome.
- Parallel implementation is not assumed while version and reference contracts
  are unsettled. After iteration 1, independent projection or finding-reader
  preparation may overlap delegation work if interfaces and file ownership are
  coordinated; final integration still waits for the producing iterations.
  Combine or split work when actual coupling makes the proposed handoff costly.
- Reuse of the earlier Plan 42 work remains optional. Compare it with this plan's
  ordinary-acceptance requirement and current module ownership before adopting
  it; the removed registration/reservation workflow is not a dependency.

## Context and execution placement

The original motivating evidence is in
`docs/analysis/2026-10-12-revision-preview-plan41-postmortem.md`; it supplies
background rather than extra obligations. The previous plan and its partial run
remain historical evidence. Recheck current implementation before choosing which
partial changes to reuse. No earlier worktree, frozen executor, tracker update or
dependency release is a prerequisite.

This plan remains at `plans/42-descriptive-identifiers/plan.md` for assisted
implementation. The coordinator starts from the proposed iterations and adapts
the breakdown to evidence; concrete version formats, encoding and assignments
remain implementation choices constrained by the requirements above. This format
conversion preserves the revised requirements, including removal of mandatory
name registration. If an assisted execution already exists, preserve its captured
input and original baseline; source edits do not replace them. Explicitly capture
revised requirements when execution is requested, without relabeling the original
incomplete run as complete. Register or launch work only when requested.
