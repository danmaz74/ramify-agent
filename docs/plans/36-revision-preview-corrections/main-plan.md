# Plan 36: Straightforward revision-preview corrections

**Date:** 2026-10-11. **Status:** proposed; implementation has not started.
**Target:** ramify-agent. **Execution:** ramify-agent architects derive work
items, owner assignments and iterations from this plan and the chosen base.

## Problem and intended result

The revision-preview run `20261011T143710Z-e572ca` exposed disagreements between
delivered instructions, tool schemas, runtime validation and recorded evidence.
Agents repaired preventable submission errors, followed unusable file pointers,
and received instructions that contradicted their tools or provider contracts.
The metrics UI also attributed inherited candidate changes to a later invocation.

Deliver consistent task contracts and usable evidence for the 21 findings
selected below. The consumers are initial and capability architects, engineers,
catalog reviewers, selectors and people reading the run UI. Preserve the
existing behavioral rules while making them explicit and applying them at the
appropriate submission and delivery boundaries.

This is one execution input, without authored iterations or a fixed assignment
schedule. The sections group required outcomes, not execution order.

## Scope and issue coverage

All issue identifiers below have the prefix `ramify-agent-bfn`. Beads remains
the source of implementation status. The table is the plan's scope, not a
second task tracker.

| Issue | Required outcome |
| --- | --- |
| `.2` | Explain the functional-key referent of nonbehavioral acceptance. |
| `.4` | Express the prospective caller-module requirement in the delivered schema. |
| `.5` | Reconcile prospective caller paths with their intended consumer modules. |
| `.6` | Make run-record pointers resolve from the declared cwd and read scope. |
| `.7` | Preserve prospective status in source navigation. |
| `.8` | Guide supported exposure declarations and explicit design reconciliation. |
| `.9` | Supply reliable consumer/provider locations and any proposed import path. |
| `.10` | Deliver relevant consumer API views during qualification and provider work. |
| `.11` | Explain and express the breaking-only multi-owner base-scope rule. |
| `.12` | Explain flat stage zero and explicit outline stage indices. |
| `.13` | Preserve mutation attribution through projections and UI. |
| `.15` | Align architect verification guidance with focused engineer commands. |
| `.17` | Omit irrelevant view inventories from catalog-only tasks. |
| `.19` | Correct catalog-role claims about downstream captured-document access. |
| `.21` | Supply scenario-origin mappings to fresh catalog reviewers. |
| `.23` | Retain selection explanations while identifying elements by stable ID. |
| `.24` | Explain automatic constraint reselection and available coordinator actions. |
| `.25` | Adapt discovery references to active tools and supplied metadata. |
| `.27` | Prefer bounded discovery from exact symbols, known owners and existing roots. |
| `.29` | Explain full-action resubmission and assess provider schema fidelity. |
| `.30` | Mark obsolete inherited orientation workflow as historical. |

`ramify-agent-bfn.1`, the fatal capability citation-validation mismatch, is
handled independently and excluded. Preserve its delivered correction when
selecting or integrating the implementation base. Its completion is not a
prerequisite for authoring this plan, and this plan does not prescribe its fix.

`ramify-agent-bfn.16`, Cucumber binding discovery and correction of conflicting
decisions, is assigned to Plan 37 at
`docs/plans/37-correction-at-decision-authority/main-plan.md`. It is excluded
here and is not a prerequisite for this plan. The caller-module validation
correction `.5` remains in scope independently of how a binding conflict is
resolved. Plan 37 is a separate execution input, not a required companion.

The investigation findings `.3`, `.14`, `.18`, `.20`, `.22`, `.26` and `.28`
are also excluded. In particular, do not choose same-submission registry
semantics, introduce capability-only focused-feature selection, redesign
context deduplication or search metrics, change scenario representation,
define suspension's partial-source contract, or redefine composed delegation.

## Required behavior

### Submission contracts agree with runtime rules

**Nonbehavioral acceptance (`.2`).** Initial analysis guidance and the native
submission declaration explain that `nonBehavioralAcceptance.ref` names the
key of a functional acceptance element in that submission. It does not name
an accepted intake `nfr-...` element. Accepted intake non-functional elements
keep their original classification, coverage and identity; the architect
does not reclassify them to make this field valid. Acceptance preserves the
existing conversion of submitted keys to catalog IDs and the registered-test
requirement. An invalid referent receives the existing bounded rejection with
its field path; a valid functional key remains valid.

**Prospective usage (`.4`, `.5`).** A prospective usage entry requires `module`,
the intended caller's module, and the delivered schema expresses that condition
as well as describing it. Actual usage keeps its existing semantics, including
valid entries without an explicit module. `suggestedProvider.module` continues
to identify the provider separately.

Before accepting a new request and deriving task authority, reconcile each
declared usage module with the ownership evidence for its project-relative
path. Reject a demonstrated contradiction with the usage field and expected
owner so the engineer can correct it in the same turn. The retained nested
request's Reviews caller path must not be accepted as an integration-tests
caller merely because integration-tests is the suggested provider. A missing
prospective file is valid when its intended location belongs to the named
module. Preserve supported module-creation cases using their accepted authority;
missing ownership evidence must remain an explicit limitation rather than an
invented owner. Do not rewrite an immutable accepted historical request.

**Scope form (`.11`).** Describe the current rule that the `scope.base.modules`
form requires assignment `kind: "breaking"`; the form, rather than an array
length heuristic, determines this requirement. Preserve the existing breaking
evidence, rationale, scope and authorization checks. Express the relationship
in the delivered schema where the transport supports it, and keep runtime
validation authoritative. Ordinary alternatives are a single-owner base with
authorized narrow extras, or separate owner assignments.

**Stage indices (`.12`).** Explain that an assignment whose applicable outline
has no stages uses `stage: 0`; explicitly staged ordinary outlines use valid
zero-based indices. A capability assignment currently validated without an
applicable staged outline uses zero even when provider entry outlines appear
as background. Merely showing such an outline does not make it the assignment's
basis. Preflight and final validation agree, and fresh, continued and recovered
tasks receive the same rule. This plan does not enable staged capability
assignments by changing current authority.

**Validation and submission (`.29`).** Explain that successful
`validate_capability_action` does not submit, reserve or remember an action.
The architect must send the complete action to `submit_capability_action`;
`{}` does not reuse the preflight arguments. Final submission still validates
current authority and can reject an action whose basis became stale.

Assess the actual pinned transport's support for the action schema. Prefer a
faithful typed provider declaration where supported without weakening runtime
checks or bounded repair. If a permissive declaration remains necessary,
document the concrete transport limitation and retain the complete schema in
the delivered contract. Do not claim typed parameters merely because the
description contains JSON Schema. Failed preflight is not counted as a rejected
final submission. Preserve exact historical retries and immutable same-name
declarations at already admitted session points.

### Evidence pointers are usable and qualified

**Run records (`.6`).** Supply an explicit run-record root and absolute or
project-relative pointers that can be opened through the current role's tools
from its declared cwd. Cover provisional snapshots, accepted plan revisions,
assignment results and named gate/review artifacts, including pointers returned
by plan-update tools. Retain job-relative paths in durable formats where that
is their existing meaning; resolve them for delivery rather than changing the
stored path convention. Fresh and continued coordinator tasks can reach the
same records under existing read restrictions. Snapshot pointers identify the
immutable suspension tree; current source reads identify the live candidate.

**Prospective source (`.7`).** Preserve actual/prospective status when turning
usage records into read instructions. Do not instruct an agent to open a
nonexistent prospective file as existing live source. Supply known existing
caller evidence or useful parent-directory patterns when available, and state
when such evidence is absent. A prospective path stays useful as an intended
location and does not acquire existence or write authority from the hint.

**Consumer views (`.10`).** Qualification tasks and engineers implementing
provider work receive the relevant ordinary/testing API views of affected
consumers they are asked to inspect or modify, including consumers named in
authorized extra scope. Deliver actual paths, revision and coverage limits,
or an explicit reason a view is unavailable. Separate the pre-change view from
post-exposure evidence: an earlier unavailable API cannot be described as
already received. Verify delivery from recorded packets and use refreshed
consumer API evidence when assessing real integration.

### Architect guidance follows provider and verification contracts

**Exposure and imports (`.8`, `.9`).** Give architects actionable documentation
for the installed, pinned provider. Explain supported `expose-src`,
`expose-test` and `expose-sub` forms, including that `expose-sub` selects symbols
received from a direct child. Exposure to descendants already includes the
target descendants; do not require an invented ancestor-to-descendant
intermediate declaration. For the retained Core/Catalog/Workspace/Validation
case, Core exposes to its parent, Catalog re-exposes what it received to its
parent, and Workspace exposes the received symbols to descendants including
Validation. A separate unsupported Reviews declaration is unnecessary.

When source evidence contradicts a plan or assignment, the responsible
architect explicitly reconciles the authoritative design before handback;
an advisory answer alone is not that revision. Guidance must not make free-text
design correctness a deterministic keyword verdict.

Identify actual provider and consumer files without forwarding an unchecked
relative import. If an import string is supplied, it resolves from the actual
consumer file to the intended provider file. In the retained fixture,
`../../../catalog/subs/core/src/history.js` from Validation's `src/preview.ts`
is incorrect; `../../../../catalog/subs/core/src/history.js` reaches the
intended Core file. Path resolution does not prove importability: use the
consumer's current API evidence and provider check for that distinct rule.

**Check instructions (`.15`).** Harness-authored guidance and architect
procedures ask engineers for relevant focused verification and identify the
gate-owned complete committed audit. They agree with the active shell/tool
restrictions and declared-check support block, including the restriction on
full Vitest/Cucumber engineer commands. Architects reconcile contradictory
assignment instructions rather than asking engineers to bypass restrictions.
Retain every configured project and nested project in full qualification.
Do not classify or rewrite arbitrary approach prose with keyword heuristics.

### Catalog and selector tasks receive coherent current instructions

**Catalog task inputs (`.17`, `.19`).** Intake and catalog checking retain their
captured-document identities, necessary reference evidence and complete
submission contracts, while omitting architect-view inventories irrelevant to
their captured-prose task. Tasks that use views still receive them. A change
in task needs preserves the effective-block replacement/withdrawal rules.

Role openings agree with procedures: intake extracts its designated
non-functional requirements and recommendations, initial analysis reads
captured plan documents and extracts functional/context elements, and catalog
checking compares the captured document with the reading. State which later
implementation/review/assessment roles rely on complete cited elements, rather
than claiming that every later agent lacks captured-document access. Preserve
source fidelity, conditions and uncertainty, and do not introduce new source
reads for roles that currently rely on the catalog.

**Scenario origins (`.21`).** A fresh catalog checker receives a compact mapping
of architect scenario keys to registered plan origins and source-document
intervals, or a precise accessible registry pointer carrying that mapping.
Explain that correction fields keyed by architect scenario key are distinct
from registered plan-origin identities. The six retained plan scenarios must
be recoverable without inherited initial-architect history. This supplies
navigation and identity evidence; it does not choose the excluded Gherkin
representation question or change frozen scenario text.

**Selection and reselection (`.23`, `.24`, `.30`).** Identify elements by stable
catalog ID and retain the required reason, conditions and uncertainty fields.
Forbid replacing IDs with passages, headings or line ranges without calling
the entire response "IDs only". The same previously valid structured selection
continues to be accepted.

Capability guidance states when the harness automatically reselects constraints
for expanded ownership, how the selected package is supplied, and which current
coordinator actions remain available. It does not ask the architect to invoke
a selector action absent from the active schema/tools. Responsible selection
and full relevant constraint delivery remain effective.

A selector fork explicitly treats inherited orientation completion, write-scope
and scenario workflow as historical. It retains useful ownership/provider facts
and the complete selectable catalog, uses its selected procedure and active
submission tool, and acquires no source-write or parent-completion authority.
Preserve healthy session prefixes; a new fresh briefing is not required just
because inherited physical bytes are numerous.

**Discovery (`.25`, `.27`).** References name available read/grep/list
alternatives for roles without a shell and identify verification they cannot
perform. Refresh commands appear only for roles authorized and equipped to
execute them. Supplied revision/coverage metadata remains the authoritative
delivery evidence; do not direct an agent to rediscover it unnecessarily.

For discovery with an exact symbol or known owner lead, prefer bounded symbol
or owner lookups and verify existing view roots before using broader fallback.
Retain coverage limits and focused source verification. Do not impose quotas
for view use or infer semantic availability from exposure counts. Implement
role-specific adaptations in harness-owned delivery; preserve the documented
module-architect snapshot and its provenance rather than silently editing
upstream reference files.

### Scope projections preserve mutation provenance

**Attribution (`.13`).** Keep candidate-relative outside-scope differences
distinct from writes attributable to the invocation being evaluated. Carry
recorded `attributable: false` through the public projection and web rendering:
inherited README/declaration changes cannot become "written by" the settling
provider invocation. Preserve the path and recorded observation origin where
useful; uncertain attribution remains explicit when evidence is missing.

The harness owns the public projection contract; the web consumes that contract
and renders its distinctions. Retain compatible reading of older records and
clients where feasible; a necessary protocol change includes all affected
consumers and documented version behavior. Querying historical evidence does
not rewrite outcomes or mutation observations. Gate settlement, guarding
verdicts and architect completion judgments remain separate and unchanged.

## Constraints and qualification evidence

- Apply the harness principles on free-text judgment, producer-owned check
  evidence, bounded context, trust/provenance and consumer integration. The
  relevant specification obligations are carried in this plan: exact effective
  block delivery, frozen catalog/scenarios, current task authority, usable
  qualified hints, and complete final audit health.
- Preserve the harness as the only durable-state writer. Web changes consume
  public harness contracts and forward commands; they do not inspect Node
  implementation records to reconstruct missing attribution.
- Use Ramify through its installed CLI, generated files and permitted package
  surface. Keep exact provider pins, source ownership and the documented skill
  provenance. This work introduces no new module ownership or provider release
  requirement. A discovered provider defect is separate follow-up work.
- Preserve admitted operation packets, schemas, declarations, hashes and
  historical run evidence. Corrections apply to new delivery and compatible
  reading, with explicit historical limitations instead of fabricated facts.
- Use retained submissions, tool results and delivered packets as deterministic
  cases. Ordinary tests script external Git, CLI, audit and command answers and
  retain the process guard. Actual tool/kernel claims require the exact reviewed
  registration in `src/tests/test-boundaries.json`.
- Focused checks establish changed behavior; `npm run check:self` must pass.
  Implementation qualification uses the committed configuration from a clean
  committed candidate with
  `node_modules/.bin/ramify-audit audit --cwd . --full --nested --json`.
  Committing or running a live plan belongs to separately authorized execution,
  not authoring this document.
- For guidance-only changes, assess effective new/fresh/continued packets and
  their schema/tool agreement. Script meaningful submission, delivery and
  projection regressions rather than merely asserting a sentence's presence.
  A deterministic delivery test establishes guidance delivery, not that an LLM
  will always follow it. Exposure/import claims also require appropriate
  provider evidence.
- Record before/after delivered bytes and available discovery observations for
  `.17` and `.27`, with source identity and coverage. Token/charge or accuracy
  benefits require actual observations; output bytes are not scanned bytes or
  token savings. `.30` keeps existing reuse unless an alternative is supported
  by accuracy and first-call usage evidence. No paid trial, benchmark threshold
  or fresh-session experiment is required or authorized by this plan.

## Acceptance examples

These examples describe observable consumer behavior. Execution assigns
run-local identities, entry mappings and bindings. The architect additionally
assesses the required guidance and structural evidence above.

```gherkin
Feature: Revision-preview tasks use consistent contracts and qualified evidence

  Scenario: Initial analysis distinguishes functional acceptance from intake constraints
    Given accepted intake constraints and a submitted functional acceptance element
    When initial analysis declares nonbehavioral acceptance for that element
    Then its functional key is accepted with the existing test-registration rules
    And substituting an intake non-functional ID receives a bounded field rejection
    And intake constraint coverage and classification remain unchanged

  Scenario: Prospective usage declares the consumer rather than the provider
    Given a prospective Reviews caller path and integration-tests as the suggested provider
    When an engineer prepares a capability request using the delivered schema
    Then prospective usage requires its intended consumer module
    And declaring integration-tests as that caller's owner is rejected before authority is derived
    And a missing caller file in the correct intended module remains valid
    And valid actual usage without an explicit module remains supported

  Scenario: Coordinator record pointers resolve in fresh and continued tasks
    Given a suspended request with a snapshot and a later assignment result and gate
    When fresh and continued coordinators open the delivered record pointers from their declared cwd
    Then the allowed reads reach the named records without root-directory rediscovery
    And the suspension snapshot is distinguished from current candidate source

  Scenario: Prospective source is navigable without an impossible live read
    Given a request naming a prospective test file that has not been created
    When the coordinator receives its source navigation
    Then the file is identified as prospective
    And existing evidence or parent-directory guidance is supplied when known
    And the task does not require opening that file as existing live source

  Scenario: Provider work receives qualified consumer API evidence
    Given provider work authorized to modify an exact consumer caller in extra scope
    When qualification and implementation tasks are prepared
    Then they receive the relevant consumer API pointers with revision and coverage or explicit unavailability
    And refreshed post-exposure evidence is distinguished from the pre-change view
    And the delivered packet provides the evidence needed to assess real consumer integration

  Scenario: Exposure guidance preserves the supported descendant relationship
    Given Core exposes a helper through Catalog to Workspace
    And Workspace exposes the received helper to descendants including Validation
    When the capability architect prepares the consumer integration assignment
    Then the assignment uses supported declarations and the actual consumer and provider locations
    And any supplied import resolves from the actual consumer file
    And a contradictory earlier exposure design is explicitly reconciled before handback
    And path resolution alone is not presented as evidence of importability

  Scenario: Ordinary scope remains ordinary through explicit narrow extras
    Given an ordinary assignment using the multi-owner base form
    When preflight and final submission validate it
    Then both reject that form with its breaking-only requirement
    And a valid corrected single-owner assignment with authorized narrow extras is accepted
    And a valid breaking assignment retains its existing rationale and authority checks

  Scenario: Flat assignments use zero without borrowing a background outline
    Given a capability assignment with no applicable staged outline
    And provider entry outlines are shown as background
    When fresh or continued coordinators validate the assignment
    Then stage zero remains valid and stage one is rejected consistently
    And ordinary assignments with applicable explicit stages keep their valid indices

  Scenario: Preflight does not remember the action for final submission
    Given a complete capability action passes preflight
    When the architect submits empty arguments to the final submission tool
    Then the final submission is rejected within the existing bound
    And submitting the complete action succeeds while its basis remains current
    And preflight failures are distinct from rejected final submissions

  Scenario: Focused engineer verification preserves full gate responsibility
    Given an engineer whose active tools restrict full Vitest and Cucumber commands
    When its task supplies declared checks and architect verification guidance
    Then the guidance requests relevant focused verification within those restrictions
    And identifies the gate as owner of the complete configured audit
    And full qualification retains every configured project

  Scenario: Inherited candidate changes are not attributed to the settling invocation
    Given an earlier engineer changed a consumer README and declaration
    And the provider invocation's recorded mutation observation marks those paths unattributable
    When run metrics and the web UI present the provider invocation
    Then candidate-relative differences remain distinguishable from attributable writes
    And those inherited paths are not described as written by the provider invocation
    And projection does not change the recorded successful gate settlement

  Scenario: Catalog-only tasks retain evidence without irrelevant view inventories
    Given intake and catalog checking compare captured plan documents with catalog readings
    When their fresh task packets are prepared
    Then captured document identities and complete submission contracts remain available
    And irrelevant architect-view inventories are omitted
    And their role descriptions agree with the initial architect's captured-document access
    And tasks needing generated views still receive their qualified view inputs

  Scenario: A fresh catalog reviewer can recover registered plan origins
    Given the six retained plan scenarios and their architect scenario keys
    When catalog checking starts without inherited initial-analysis history
    Then it can recover each registered origin and source-document interval from delivered evidence
    And correction guidance distinguishes architect keys from plan-origin identities
    And frozen scenario text remains unchanged

  Scenario: A selector keeps explanations while orientation remains historical
    Given a selector fork inherits orientation completion and scenario instructions
    When it receives the complete selectable catalog and current selection task
    Then inherited orientation workflow is explicitly historical
    And selected elements are identified by stable ID with reason conditions and uncertainty
    And useful ownership facts and the reusable session prefix remain available
    And the task acquires no source-write or parent-completion authority

  Scenario: Expanded capability ownership explains automatic reselection
    Given the harness reselects constraints after affected ownership expands
    When the coordinator receives the resulting package and current action declaration
    Then it receives the relevant selected constraints and their current delivery identity
    And guidance explains automatic reselection without requesting an unavailable selector action

  Scenario: Discovery references fit the active tools and supplied evidence
    Given an architect with read grep and list tools but no shell
    And an engineer supplied with view revision coverage and an exact symbol-owner lead
    When their discovery guidance is delivered
    Then the architect receives usable alternatives and explicit verification limitations
    And refresh commands are limited to authorized equipped roles
    And the engineer can begin with bounded lookups using existing roots and supplied metadata
    And coverage limits remain visible without inferred availability or invented savings
```

## Context, navigation and execution placement

The historical findings come from harness revision
`8d5e46840194ebca8b9dbe72ae8b37a8f9e418ac`. The existing report is
`docs/analysis/2026-10-11-revision-preview-run.md`; its sibling directory
contains per-role reviews, packet identities and metrics. The native evidence
root recorded by the issues is
`/home/app/ramify-trial-evidence/revision-preview-20261011T143639Z/collection-review/plans/revision-preview/.harness/jobs/20261011T143710Z-e572ca/`.
These are background investigation pointers, not plan companions or a request
to reproduce the paid run. Keep historical paths and hashes unchanged. If
retained evidence is unavailable at execution, record that limitation and use
explicit scripted cases; do not claim a historical reproduction.

Relevant governing documents inspected during authoring are
`docs/harness.principles.md`, `docs/harness.spec.md`,
`docs/architecture/plan-context-catalog.spec.md`, `docs/testing.spec.md`,
`docs/metrics/measurement-principles.md` and
`skills/module-architect/PROVENANCE.md`. The applicable obligations are stated
above; no specification change is requested. The document-access correction
describes extraction/initial-analysis roles while preserving the catalog-only
delivery contract for implementation consumers.

Useful implementation seams, relative to the repository root, are:

- `subs/harness/src/analysis/{submission,extraction}.ts` and analysis/catalog
  prompt procedures for functional references and scenario origins.
- `subs/harness/src/capability/{records,submission}.ts`,
  `subs/harness/src/work/{assignment,engineer,session}.ts` and
  `subs/harness/src/run/service.ts` for request validation, scope/stage rules,
  record navigation, extra-scope API views and capability task delivery.
- `subs/harness/src/prompts/{packages,tasks,blocks,briefings}.ts`,
  `subs/harness/src/context-selection/` and `subs/harness/src/steps/` for
  current task instructions and role-aware effective delivery.
- `subs/harness/subs/agent/subs/pi/src/{session-operations,pi-agent}.ts` for
  actual provider declarations and retained operation compatibility.
- `subs/harness/src/run/observations.ts`,
  `subs/harness/src/projections/{metrics,work}.ts`, public protocol files and
  `subs/web/src/run-page.tsx` for attribution through the consumer boundary.

These seams are optional navigation leads; they do not assign ownership or
require new modules. Use the selected base's generated views and actual code
to determine the implementation boundaries.

This document stays in `docs/plans/36-revision-preview-corrections/` under the
repository's planning convention. Before a separately authorized full run,
place this document as the target checkout's
`plans/revision-preview-corrections/plan.md`. Keep the execution directory to
this input and genuinely required companions; this plan has none. Do not copy
historical reviews, unrelated plans or iteration packages into it. Resolve the
independent `.1` work and other concurrent edits through the selected execution
base, preserving their behavior rather than treating an uncommitted shared
checkout as a qualified starting point.
