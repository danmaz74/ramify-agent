# Plan 46: Extract harness measurement and attribution

**Date:** 2026-10-14. **Status:** implementation in progress; continuation from
the retained partial extraction after the projections prerequisite was met. **Target:** ramify-agent. **Executor:** ramify-agent
operating from a separate bootstrap checkout.

## Problem and intended result

The harness currently owns measurement capture, scope accounting, delivered-line
attribution, session lineage and metric calculation in its own `src/kpi/`.
Execution coordination and query presentation need the results of these rules;
they should be able to consume them without understanding their implementation.

Extract that responsibility into the direct child `harness/kpi`, at
`subs/harness/subs/kpi/`. The child owns the measurement and attribution
algorithms and their contracts. The harness coordinates collection, supplies
execution facts and remains the only writer of durable run state. The already
extracted projections child consumes KPI behavior through explicit contracts
re-exposed by the harness.

The required result is the new provider and its actual use in run/step
collection, query calculation and existing qualification consumers. A directory
move with algorithms left in parent callbacks does not meet this outcome.
Architects determine assignments, delegations and iterations.

## Prerequisite and implementation baseline

Start only after the Plan 27 projections extraction is merged into the target's
integration branch. Select a clean implementation base descended from that
merge and record both identities. A nearly complete worktree or an unmerged
extraction candidate does not satisfy this prerequisite.

Inspect the merged implementation and its acceptance evidence. Confirm that
`harness/projections` owns the query implementation and that its actual consumers
use it through valid declarations. Preserve its delivered behavior and module
boundary. If the merged result differs from the forecast here, inventory those
differences before assigning work; do not reconstruct the old parent projection
directory or assume the in-progress branch's exposure list is final.

Independent changes included in the selected baseline remain supported. This
plan does not depend on Plan 45 or authorize changing progress/recovery behavior.

## Continuation baseline and remaining outcome

The projections prerequisite is satisfied. Acceptance source
`f227116f16514dd3500b2f4ae1e716272af1845a` was incorporated linearly at
`9f63d4e4660fba64c004941b2acab2c95eec46fc`. The retained extraction candidate
`e99a3ae8f39dabdef0fbb7ec777c1d9b657a7cf2` passed all six configured default
audit checks (report `ee6e09dba5aad6c43378e54e49fc3c91551813bb`), including
3871 regression cases with two existing opt-in skips. This is intermediate
execution health, not acceptance of this plan's completed outcome.

The continuation includes that candidate, retained composed query verification
from the interrupted writer, and the three independently committed guidance
changes through `0c74a7d2`. Inspect current source rather than recreating delivered
work. In particular, `harness/kpi` already exists as the ordinary direct child;
its real algorithms serve execution collection, invocation charge observations,
projections and root setup qualification through selected exposures. The general
ownership helper and trial destination validation have already moved to execution
utilities. Query tests now assert the exact weighted 2500/100000/40 result, ratio
0.25/reduction4, missing-writer subtotals, zero versus failed history and recorded
usage/rates/search uncertainty. Reverify these cases and all required outcomes.
No acceptance scenario is claimed complete by this baseline statement.

A concrete remaining ownership gap is in `steps/runner.ts`'s
`prepareInvocation`: it still builds scope results for an absent snapshot,
missing owned-source declaration and acquisition failure. These are measurement
qualification rules. They must belong to the child through factual inputs,
with collection timing, acquisition and durable commits retained by the harness.
Preserve the existing absent-snapshot two-component result, component order,
role details, error reasons, known support subtotal, partial/unknown states and
read-size behavior. A synthetic unavailable snapshot that changes the component
shape, or parent callbacks that calculate these results, does not satisfy this
extraction. This obligation was observed in current source; architects choose
its API and execution decomposition.

The old parent `src/kpi/` still contains duplicate algorithms retained for
comparison tests. Complete its retirement and the case-mapped relocation or
retirement of transitional parity tests without losing independent assertions
or native witness coverage. Finish the complete source/API ownership comparison,
all ten composed acceptance examples, root qualification handback and final
clean committed default audit. Existing integration notes are intermediate
receipts whose limitations remain historical; update the final delivery report
with the actual completed result. The interrupted run's records remain untouched
and are not relabeled as successful execution.

## Required ownership and integration

Create a direct child with declared name `kpi`, an ordinary untagged module
header, its own `module.ramify`, `README.md`, `src/` and owned `src/tests/`.

The child owns:

- Measurement snapshot construction and scope-size calculation: source,
  API-view, architect-view and support components, deduplication, revision
  compatibility, known subtotals and unavailable inputs.
- Per-invocation line measurements and delivered-change attribution, including
  shared commits, exact setup-line identities, binary paths, reverted changes
  and uncertain writer contributions.
- Existing KPI, session and lineage calculations, guarding summaries,
  exploration aggregation, timing and charges derived from recorded usage and
  recorded rates. These remain descriptive measurements.
- The domain inputs, results, policy constants and existing bounded caches
  needed to implement those responsibilities.

The harness retains command admission, scheduling, writer settlement, session
lifecycle, observation production, record/event commits and recovery. It decides
when to collect measurements and commits their returned records through its
existing durable path. The child receives no writable run service or ledger.
Acquisition uses the existing evidence-owned Git, measurement and CLI contracts;
the child does not launch its own Git, Ramify or audit processes or introduce
another project analyzer.

Separate execution adapters from measurement rules. Translate prompt packages,
delivered manifests and assignment write scopes into measurement inputs at the
coordinating owner. The child must not import prompt construction or assignment
implementation to discover what an invocation was given. Any supplied input
types must describe the measurement facts required. Preserve exact delivered
byte counts, hashes, scope selections and source identities during translation.

Inventory helpers according to their responsibility. Trial-report destination
validation remains an execution/qualification concern, with its existing
outside-project and symlink protections. General path-to-owner lookup needed by
reviews or equipment must retain a selected contract and its existing semantics;
it must not force those callers to understand metric calculation. Its placement
is an execution design choice. Remove the old `harness/src/kpi/` production
directory after moving the measurement implementation and placing retained
adapters/utilities with their responsibilities. Leave no duplicate algorithms or
forwarding implementation files there.

Integrate every production consumer present in the merged baseline, including
run and step collection, invocation observations, reviews/equipment ownership
queries, the projections child and root qualification scripts. Keep the parent
as composition owner. Re-expose received child behavior where siblings or root
consumers need it. Preserve existing root-facing setup-attribution contracts and
their signature companions.

The child defines its provider API. Current names such as `DeclaredScope`,
`InvocationFacts`, `MetricInputs`, `DeliveredChangeRequest` and `LineageInputs`
are useful existing seams, not a mandatory new API specification. Expose selected
entry points and companions needed by real consumers; private algorithms do not
become production APIs merely to keep tests importing them.

Public browser protocol and durable record authority remain with the harness.
Retain the wire schemas, export names, tags, durable versions and supported
historical readers. A necessary reading dependency on selected harness record
types, schemas or observation vocabulary is valid. Replace parent imports with
explicit selected exposures, rather than copying types, exposing implementation
files wholesale or creating a neutral definitions module. Review the visibility
of exposures to descendants across the whole harness subtree. Verify ordinary
and testing access using refreshed requester API views.

## Behavioral compatibility

For the same baseline facts and supplied provider answers, preserve calculation
results, ordering, units, policies, evidence references, errors and coverage.
The merged baseline, rather than a pre-extraction file inventory, is the
comparison point. Carry these obligations into the implementation:

- Missing observations, unknown ownership, failed Git reads and unavailable
  measurement documents retain their actual states and reasons. Preserve a known
  zero separately from unknown, partial subtotals separately from complete
  values, and zero-denominator `not-applicable` outcomes.
- Compare scope figures only under compatible policies and source revisions.
  Retain exact-owner/subtree distinctions and count overlapping scope and
  delivered-support identities according to the existing deduplication rules.
- Delivered change uses the base-to-accepted-final comparison. Intermediate
  rewrites and reverts do not inflate surviving change weight. Preserve exact
  setup attribution, unmapped and binary handling, shared-writer splitting,
  uncertainty and evidence; guessing a writer or excluding an entire mixed
  setup/agent path is not permitted.
- Count failed, repaired, stopped and unchanged sessions as the existing policy
  requires. Preserve actual versus requested start, degraded fallback, local
  versus global forks, historical generations and distinct model histories.
- Retain usage categories and their accounting meanings, recorded-rate charge
  calculations, unavailable rates/usage and coverage. Wall duration remains
  distinct from summed model/tool/check durations. Preserve exploration source
  identity, deduplication, conflicting-observation handling and unknown search
  statuses. No pricing lookup or inferred cache saving is introduced.
- Preserve guarding coverage and attribution qualifications. Measurements do
  not enforce scope, judge architectural progress, award scenario satisfaction,
  accept work or license a gate.
- Repeated metrics/session reads do not collect new measurement evidence,
  append durable state, mutate the project or invoke an agent, CLI or audit.
  Existing injected reading of Git history remains behind its existing owner.
  Preserve reopening, historical versions and current cache behavior.

Preserve the selected baseline's implemented policies, including `kpi/1`,
`scope-size/2` and `lineage/2` where supported. The separately documented
`token-efficiency/1` proposal does not make new scores part of this extraction.
If a later baseline already implements additional measurements, preserve them.
No new metric, collector, UI, durable format, provider pin, lifecycle policy or
performance experiment is required. Resolve a discovered specification/baseline
contradiction through the responsible authority instead of silently changing a
formula to make the refactor pass.

## Acceptance

Use the extracted provider's real implementation at its composed consumers.
Ordinary tests script external provider answers; substituting a KPI calculator
in the composed tests does not establish this extraction.

```gherkin
Feature: Harness measurements are supplied by the KPI child

  Scenario: Execution and projections use one measurement provider
    Given an implementation base containing the merged projections extraction
    And a scripted run with invocation measurements and accepted changes
    When run collection and the projections child produce its metric answers
    Then measurement and attribution rules are implemented by the KPI child
    And execution commits returned measurements through the harness writer
    And the HTTP metrics and session answers match the baseline
    And cross-owner imports satisfy the declared ordinary API contracts

  Scenario: Weighted scope measurements retain their arithmetic and evidence
    Given a complete baseline measurement of 10000 bytes
    And one writer with scope 1000 bytes and delivered weight 10 lines
    And another writer with scope 3000 bytes and delivered weight 30 lines
    When the metrics query calculates the weighted scope measurements
    Then the weighted scope value is 2500 with numerator 100000 and denominator 40
    And the scope size ratio is 0.25 and the reduction factor is 4
    And policy versions and evidence identify both writer contributions

  Scenario: A missing writer scope stays unavailable with its known subtotal
    Given a writer with scope 1000 bytes and delivered weight 10 lines
    And another writer with unknown source size and delivered weight 3 lines
    When the metrics query calculates the weighted scope measurement
    Then its complete value is unavailable
    And its known subtotal is 10000 over known weight 10
    And coverage identifies one of two writers and the missing size reason
    And the unknown size is not represented as zero

  Scenario: Zero delivered weight remains distinct from missing evidence
    Given complete recorded invocation costs and no delivered line weight
    When the metrics query reads the run
    Then ratios requiring delivered line weight are not applicable
    And recorded session costs remain available under their existing policies
    And a failed history read instead retains an unavailable attribution reason

  Scenario: Mixed setup and writer changes keep exact attribution
    Given a commit containing setup and writer edits to the same source path
    And authenticated surviving setup line identities
    When the delivered change is calculated from the base to the accepted final tree
    Then only the verified setup line identities are excluded from writer weight
    And reverted changes contribute no surviving weight
    And uncertain overlapping contributions stay unattributed with their reasons

  Scenario: Degraded starts preserve the history actually used
    Given a requested continuation that actually starts fresh
    And an observed local architect fork and a segment with unknown actual start
    When the metrics and session queries calculate lineage and scope aggregates
    Then the fresh fallback is counted as degraded and starts another model history
    And the local fork remains distinct from global generation forks
    And unknown start evidence retains its existing coverage qualifications

  Scenario: Scope adapters preserve identities and revision limits
    Given delivered support with repeated source identities and overlapping module scopes
    When execution translates its inputs and asks the KPI child for scope measurements
    Then sources and scopes are counted once under the existing measurement policy
    And the resulting captured records match the baseline
    And incompatible view and measurement revisions retain an explicit limitation

  Scenario: Recorded usage and search uncertainty survive composition
    Given invocation usage with separate input and cache categories and a missing charge rate
    And replayed search observations with unknown scope status and conflicting source identities
    When the session query supplies its invocation evaluation
    Then usage categories and known charge components match the baseline
    And the complete charge remains unavailable with its coverage
    And original searches are not counted twice
    And conflicting or unknown observations retain their coverage qualifications

  Scenario: Reopening and repeated reads preserve records and responses
    Given a recorded run supported by the merged implementation base
    And captured durable file contents and baseline metric and session responses
    When the extracted application reopens the run and repeats those queries
    Then supported records produce compatible responses
    And durable files and the event sequence are unchanged by the queries
    And reading invokes no measurement collector or command executor

  Scenario: Root qualification retains setup verification and destination protection
    Given existing root qualification consumers of setup attribution and trial reporting
    When they verify valid and invalid setup evidence and choose report destinations
    Then their results and errors match the baseline through selected contracts
    And in-project and symlink report destinations remain refused
    And no KPI implementation becomes a browser production API
```

Structural acceptance also requires an ownership/API comparison identifying
the algorithms moved, retained adapters, consumers, signature companions and
removed parent implementation. Show that projections receives KPI behavior
through harness re-exposure, that durable writing remains with the harness,
and that ordinary and testing imports are valid. Explain which implementation
knowledge the parent no longer needs and the costs of the new input exposures.
File counts alone do not establish reduced cognitive complexity.

## Verification and completion

Follow the selected target's `AGENTS.md` and `docs/testing.spec.md`. Preserve
the process guard, existing scripted provider boundaries, exact native witness
registrations and configured test discovery. Keep ordinary examples small and
use controlled clocks where timing is relevant. Do not weaken checks, exclude
tests or register new process exemptions to accommodate moved code.

Move focused algorithm tests to the child. Keep collection, HTTP, reopen and
cross-owner integration tests with their coordinating owners. Split mixed tests
where necessary while retaining their cases. Preserve native witness claims and
update their exact registrations only when their owning files move. Validate
actual configured discovery, including the projections child's moved tests.

Required evidence includes `npm run check:self`, relevant type checks, focused
ordinary tests through `npm run test:quick -- <exact file filters>`, affected
registered native witnesses, and the composed metrics/session and root-script
contracts. Existing tests are starting evidence; add or adapt meaningful cases
where they do not establish the new boundary or compatibility.

Qualify the final clean committed candidate from the target repository root:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

Use default audit mode and the committed configuration. Preserve every
configured project and report actual selected/reused evidence, failures, skips,
missing and unrun checks. Do not substitute a direct whole-suite run or force
scope overrides merely because this is an extraction. Passing audit evidence
establishes configured execution health; the responsible architect judges the
ownership change and each requirement's semantic disposition.

Retain a delivery report outside the captured plan directory, beside the
canonical authored plan as `results.md`. Record the projections merge identity,
implementation baseline, bootstrap revision, run ID, final candidate, source and
API ownership comparison, moved/retained tests, verification evidence and each
acceptance example's outcome. Preserve remaining limitations and historical
results. No performance or provider cache benefit is claimed by this plan.

## Context and execution placement

At authoring, `harness/src/kpi/` contains eleven production TypeScript files,
2351 physical lines and 129953 bytes. This is a source inventory, not a cognitive
complexity score or a promised post-merge inventory. Measurement behavior is in
`capture.ts`, `delivered.ts`, `efficiency.ts`, `exploration.ts`, `guarding.ts`,
`lineage.ts`, `lines.ts`, `metrics.ts`, `sessions.ts` and `setup-attribution.ts`.
`trial-report.ts` is destination validation. Inspect the chosen baseline before
mapping these responsibilities to the child and parent.

Source navigation pointers, relative to the selected target root:

- `subs/harness/src/kpi/` and its callers in `run/`, `steps/`, `reviews/` and
  `work/`; `scripts/trial-attribution.ts` and root re-exposures in `module.ramify`.
- The merged `subs/harness/subs/projections/` declaration, metric/session query
  implementations and their generated API views; the harness HTTP adapter.
- `subs/harness/src/run/records.ts`, `run/observations.ts`, the evidence child,
  and public `interfaces/protocol/runs.ts` measurement contracts.
- Existing `kpi-metrics`, `measurement`, `delivered-change`, `line-events`,
  `lineage-metrics`, `setup-attribution` and trial-attribution tests; post-merge
  projection purity/session tests and configured discovery determine their paths.
- `docs/harness.principles.md`, `docs/testing.spec.md`,
  `docs/metrics/measurement-principles.md`, `docs/metrics/lineage.md`,
  `docs/metrics/session-observations.md` and `docs/measurements-and-kpis.md`.
  Their relevant compatibility obligations are stated above; these pointers
  are navigation context, not a request to implement every historical proposal.

The canonical authored document is
`docs/plans/46-kpi-extraction/main-plan.md`. Its identical execution copy is
`plans/kpi-extraction/plan.md`, the harness discovery location. Keep the copy
identical when revising the authored plan and retain its hash at capture. The
execution directory contains only this plan; run-local tracking belongs to the
harness. The document uses root-relative navigation text so relocation does not
change the meaning of local Markdown links.

After the merge prerequisite is met, use separate prepared bootstrap and target
checkouts with their own installed dependencies. Keep the bootstrap code stable
while the target changes and serve the target project using the existing
harness entrypoint. Preserve unrelated working-tree changes. Writing this plan
does not launch a run or establish implementation acceptance.
