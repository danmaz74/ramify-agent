# Descriptive identifiers for plans and execution

**Revised:** 2026-10-22. **Target:** ramify-agent.
**Execution:** native Astra coordination and Sol implementation with committed RA
iteration and cumulative assessments. The [user-directed requirement revision](requirements-2026-10-22.md)
supersedes the captured identifier compatibility clauses. The captured input,
original baseline and prior evidence remain immutable; this current source is
not a replacement registration or protected-file approval.

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

### One naming contract and ordinary continuation

Every semantic entity uses the descriptive naming/reference contract. Author
schemas, accepted record shapes, procedures and consumers agree on that contract.
Keep format versions only for meaningful current formats. Obsolete numeric
semantic identifiers and obsolete naming formats are rejected; do not select a
naming mode from missing metadata, accept a second submission shape or infer a
replacement name. No migration, adapter, historical-name backfill or compatibility
framework is required. Actual historical durable evidence remains untouched.

Continue current-contract unfinished work using current procedures and durable
task records, with optional session reuse. A changed source, dependency or prompt
hash alone is not incompatibility. Report a concrete unreadable contract or
missing operation at its boundary without guessing identities. Preserve explicit
stops, pending decisions, execution settlement and completion authority. Session
loss must not require a reservation or replay of an authoring conversation.

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

Specifications describe the single descriptive identifier/reference contract.
Preserve historical evidence and existing protection authority. This plan and
its revision do not approve protected specification differences. No new semantic
classification, provider API, naming permission system or recovery framework is
required. Shared helpers follow ownership and actual consumer access.

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

Scenario: One current format rejects obsolete identifiers
  Given authoring, accepted records and public consumers use descriptive IDs
  When a submission or lookup supplies an obsolete numeric semantic identifier
  Then the relevant boundary rejects it without a fallback or inferred name
  And the diagnostic identifies the current reference family and source
  And existing durable evidence is neither rewritten nor deleted
  When a current-contract unfinished task continues after session loss
  Then it reuses accepted identities and delivers current references exactly once

Scenario: A concrete unavailable contract leaves retained work inspectable
  Given continuation needs a record contract the installed runtime cannot read
  When the task reaches that required operation
  Then it reports the unavailable contract without guessing replacement identities
  And raw retained evidence remains unchanged and the error names the unavailable contract
  And a source or prompt hash change alone is not reported as incompatibility

Scenario: Continued and forked tasks preserve delivered identities
  Given a session contains an accepted assignment with descriptive references
  When the harness continues it and forks from an admitted source point
  Then both tasks resolve references to the appropriate accepted records
  And inherited deliveries retain their recorded bytes and source identities

Scenario: Findings and deviations remain actionable through public consumers
  Given a run records a named finding and an authorized named plan deviation
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

## Cleanup implementation and verification

Work in the registered target checkout with the original execution baseline.
Use cohesive assignments covering producers with their necessary consumers:

- Catalog capture, initial planning and scenarios: remove naming-mode selection,
  numeric generators, dual shapes and obsolete feature tags; verify complete
  atomic analysis and equal-source-name encoding with current references.
- Work coordination and runtime: use one work/capability/contract authoring and
  persistence contract, current prompt packages and ordinary retry/recovery/fork.
  Remove old naming admission and retry branches without changing authority.
- Findings, deviations, assistance and public consumers: remove old-name readers,
  public schemas and projection branches; verify disposition, readiness, CLI/web
  selection and current-contract continuation against actual accepted records.

Finish the family inventory and current specifications. Preserve ordinary module
and testing boundaries; convert reusable fixtures to current names and remove
backward-naming tests. Technical IDs retain their existing exemptions. Do not
alter historical durable execution records. Run focused tests, typechecks and
`check:self`, then submit committed candidates with the pinned requirement
revision through RA. Perform a fresh cumulative final assessment against the
original baseline. Exact protected changes require actual user approval after
all engineering and cumulative review are complete.
