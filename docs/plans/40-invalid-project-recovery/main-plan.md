# Plan 40: implementation through temporarily invalid projects

**Date:** 2026-10-12. **Status:** In implementation; qualification remains open.
**Tracking:** `ramify-agent-9dt.1` for stage-one recovery;
`ramify-agent-9dt.2` for mutation classification;
`ramify-agent-9dt.10` for checkpoint evaluation.
The joint design was recorded in `ramify-agent-9dt.1.1`; this conversion is
`ramify-agent-9dt.1.2`. Beads owns work status.
**Execution:** ordered implementation iterations, with explicit acceptance
for each increment. Authorized on 2026-10-12 with one GPT-6.1 Sol agent per
iteration, coordinated under `ramify-agent-570`. Stage two remains conditional
on its measurement gate.

## Outcome

An authorized change may need several edits before Ramify can analyze the
project again. The engineer must be able to investigate and repair that state
toward the requested outcome. When a decision needs correction, its responsible
architect must receive the findings even while analysis is unavailable.

This plan combines independent ownership evidence from Ramify with a
controlled use of recorded write authority. A separable second stage proposes
a retained filesystem baseline, subject to measurement before adoption.
It extends existing equipment, records and partial-result handling. It adds no
agent role, submission kind or recovery workflow alongside the current one.

## Principles and scope

The [harness principles](../../harness.principles.md) govern this plan: ordinary
Ramify failures reach the engineer; agents make semantic decisions; the simplest
sufficient correction preserves module boundaries; state survives sessions;
and an engineer's failure returns to its architect. The
[scope specification](../../harness.spec.md#every-agent-scope-is-a-cut-on-the-module-tree)
and [responsible-authority correction](../37-correction-at-decision-authority/main-plan.md)
remain the basis for assignment and escalation.

The proposed write-admission exception is explicit: while current ownership
cannot be obtained, an engineer may repair within a previously verified,
recorded assignment boundary. This is historical authority for temporary work,
not a claim that Ramify verified current ownership. Fresh evidence is still
required at acceptance. The current unconditional live-ownership prerequisite
must change; merely catching its exception would leave recovery impossible.

The [retained missing-export case](../../analysis/2026-10-12-revision-preview-rerun.md)
is one witness. The plan also covers malformed declarations/configuration,
multi-file changes, incomplete diagnostics, provider failures and resumed work.
Existing useful edits and historical reports remain intact.

## Delivery sequence

Iterations 1–7 deliver and qualify stage one. The user confirmed on 2026-10-12
that a separate session owns the Ramify implementation. Treat iteration 1 as
that external provider dependency; do not implement or publish it a second time.
Iterations 2–7 belong to ramify-agent, with one Sol agent per iteration.

Consumer development may proceed alongside the provider plan against the agreed
serialized contracts, using scripted external answers and the currently released
package surface. Keep consumer implementation handoffs ordered: adapter, durable
boundary, repair, architect continuation, then gate classification. An iteration
may hand off its independently tested implementation while its released-provider
integration remains pending. No sibling-source imports, compiler aliases, linked
dependencies or assumed unpublished version are permitted.

The external provider's qualified release is required to close iteration 1,
finish the exact-pin adoption in iteration 2, and qualify stage one in iteration
7. Reconcile the final released contracts and rerun affected checks before
claiming those gates. No ramify-audit implementation change is prescribed.

The external provider gate was met on 2026-10-12: the configured default audit
passed for implementation `f370d7d3e96820710585668aabb9ec23cea29d43`, and
the registry published `ramify.ts@0.5.0` from release commit
`26e382791ae64e52f179573054ff00ff03078700`. The release commit changes only
the package version and lockfile relative to the implementation and its audit
receipt. Consumer adoption and qualification remain separate gates.

| Iteration | Deliverable | Depends on | Acceptance gate |
| --- | --- | --- | --- |
| 1 | External release of independent ownership and useful failure evidence | Separate Ramify implementation | Provider qualification and published contract/release identity |
| 2 | Typed evidence decoding, then exact provider adoption | Agreed contracts for development; 1 for adoption | Explicit old/new schema handling, failure/cancellation regressions and released pin |
| 3 | Durable effective assignment authority | 2 | Faithful capture, narrowing and restart reconstruction |
| 4 | Authorized multi-edit repair and engineer feedback | 3 | Recovery succeeds while all filesystem and assignment protections hold |
| 5 | Architect continuation through invalid state | 4 | Partial reaches local and capability architects; bounded reassignment works |
| 6 | Honest mutation classification and candidate gates | 5 | Unknown placement remains distinct and cannot qualify acceptance |
| 7 | Composed stage-one qualification and query measurements | 6 | Retained-case regressions, required checks, committed default audit and latency evidence |
| 8 | Separate checkpoint benefit/cost evaluation | 7 | Recorded adopt/defer decision and justified bounds |
| 9 | Conditional retained checkpoint | 8, only if adoption is justified | Coherent capture, restart and net-diff evidence; repair works without a checkpoint |

Checkpoint work is separable from repair admission and architect continuation.
Stage one ships using provider diagnostics and observed changes, existing
per-mutation snapshots and the accepted Git boundary, each with its actual
coverage and comparison identity. It neither creates nor promises a
last-completed-analysis filesystem baseline. Missing checkpoint evidence
must not disable repair or hold stage-one qualification open.

## Iteration 1: qualify and release the provider contract

**Owner:** the separate Ramify implementation session, in its own checkout.
**Prerequisite:** none within this plan. This session consumes its release handoff
and may share comparison evidence; it does not duplicate provider implementation.

Ramify's [companion design](https://github.com/danmaz74/ramify/blob/f370d7d3e96820710585668aabb9ec23cea29d43/docs/architecture/analysis-failure-recovery.spec.md)
and [adopted contracts](https://github.com/danmaz74/ramify/blob/f370d7d3e96820710585668aabb9ec23cea29d43/docs/plans/analysis-failure-recovery/contracts.md)
are committed in its independently qualified implementation. Its
[audit receipt](https://github.com/danmaz74/ramify/blob/5ae6890a6adb24dec3b94879b8e8257a601600d4/docs/plans/analysis-failure-recovery/audit-receipt.md)
records the passing default audit of that candidate. Publication and the exact
consumer pin remain separate gates. The consumer requirements below are
self-contained. Existing upstream grounding is the
[ownership principle](https://github.com/danmaz74/ramify/blob/6161e76dcd22e45213a59e19950762750ca03e60/docs/model/cross-module-importability.principles.md)
and [inventory operation](https://github.com/danmaz74/ramify/blob/6161e76dcd22e45213a59e19950762750ca03e60/subs/analysis/src/inventory.ts).

The proposed `ramify ownership --root <project> --path <path>... --format json`
uses fresh batch acquisition without source export linking or import analysis.
Its `ramify.ownership/1` answered result contains provider/root identity, an
acquisition input identity, `scope: { configuration, ownership }`, warnings
and every requested path classification. `scope.ownership` has the identical
`ProjectOwnership` shape currently read from `selection.scope.ownership` in
`affected`: reuse its table validation while adapting envelope/path decoding.
Acquisition failures use variants of the same ownership schema: `invalid`
with exit 1, or `incomplete`/`unavailable` with exit 2, structured diagnostics
and no authoritative partial ownership table. Invocation failures use the
generic CLI envelope with exit 2. Cancellation remains exit 130.
An ownership success is not a source-check pass.

Ramify also preserves diagnostic locations, related locations and available
stage outcomes across failure adapters. Resident failure evidence can identify
the last completed analysis and paths observed changing since it; history gaps
remain explicit. Batch execution need not retain history. Observed paths are
useful investigation pointers, not a complete net diff. The proposed carriers
are `ramify.check/4` for changed checks and `ramify.cli/2` for generic failures,
with recovery forwarded through negotiated IPC outcomes or service errors.
Complete reports (`ramify.analysis/3`) and the batch-only ownership document
retain current diagnostics without a recovery block. The consumer adopts these
versioned contracts in iteration 2.

Implement and qualify these contracts through Ramify's own workflow, then
publish a registry release. Record the provider commit, released version and
schema identities; replace the uncommitted proposal pointer with a pinned
upstream link when one exists. Do not copy provider implementation into the
harness or introduce a dependency on a companion checkout.

**Acceptance:** provider tests show that missing source exports do not prevent
ownership acquisition; malformed acquisition inputs return the declared failure
variants; failure adapters retain available located diagnostics and resident
history limitations. Verify batch/resident and cancellation behavior through
the provider's required checks. A release with those contracts is the handoff
to iteration 2; source-check success is never inferred from ownership success.

## Iteration 2: adopt the released provider and typed failure evidence

**Owner:** harness evidence adapter. **Prerequisite:** agreed serialized contracts
for independent development; iteration 1 for final pin adoption and qualification.
The development handoff can unblock iterations 3–6 while release adoption remains
explicitly pending.

The harness consumes these through its CLI adapter and public types/schemas
only. The evidence adapter returns typed answered/unavailable results for
ordinary provider failures, retaining the provider's distinct failure status,
exit code, raw output and decoded evidence within the unavailable result.
Unsupported output is unavailable, not a success or a guessed project verdict.
Corrupt harness records and unconfirmed writer settlement retain their existing
fatal handling; they do not activate a permissive fallback.

Adopt the released version using `npm install --save-exact ramify.ts@<version>`
and retain the manifest and lockfile together. Verify the installed CLI version
against that pin. Import only public provider types/schemas; use the CLI for
execution. Reuse the existing ownership-table validation while adapting the
new envelope and path classifications.

Decode supported old and new versions explicitly: `ramify.check/3` and
`ramify.check/4`, `ramify.cli/1` and `ramify.cli/2`, and unchanged
`ramify.analysis/3`. Older shapes do not acquire recovery fields. Keep
cancellation distinct from an ordinary unavailable result throughout the
adapter so it cannot select historical write admission.

Ramify changes are implemented, qualified and released in its own repository;
this repository adopts an exact registry pin and lockfile. The fallback behavior
also handles the currently pinned provider's ordinary failures, but availability
of the new ownership command is a verified provider-version capability, not an
assumption. Do not repeatedly invoke an unsupported command. Existing durable
assignments can use recovery only if their records contain enough verified
boundary evidence to reconstruct the same restrictions; otherwise report the
missing basis explicitly. Never invent a historical analysis checkpoint on
resume.

**Acceptance:** scripted adapter tests cover answered ownership, invalid and
incomplete acquisition, invocation failure, timeout/crash, unsupported or
undecodable output, exit/schema disagreement and cancellation. Assert retained
raw output, diagnostic locations, identities and history gaps, including sparse
older results. Verify provider capability selection avoids repeated unsupported
command invocations. Migrate existing callers to the typed results while
preserving refusal on unavailable ownership until iteration 4 enables bounded
historical write admission.

## Iteration 3: persist the effective assignment boundary

**Owner:** scope capture and the run writer. **Prerequisite:** iteration 2.

When an assignment is accepted with current ownership, retain its provider
evidence identity and materialize its effective write region. Reuse the
existing roots, exact extra files, included trees, bootstrap authority and
guarded-file authorizations. Capture the directories of non-included child
modules, whose exclusion currently relies on a live placement query.
`resolved.excluded` already records non-included nested projects, unowned
exclusions and harness layout roots; preserve and enforce those entries.
This projection represents the assignment's permission, not another module
model.

Protected run inputs, generated features, repository metadata, external and
other excluded trees remain protected. Guarded configuration requires its
recorded authorization. An exact-file exception cannot reopen an otherwise
forbidden tree. Arbitrary new `module.ramify` files remain forbidden; accepted
bootstrap authority retains its exact owner, parent and directory limits.
Exclusion from analysis alone does not remove permission for an owned-unwired
or scratch area. Owned nested projects still require their explicit inclusion,
and their own captured instructions remain applicable.

Persist the captured boundary before the first write. Retain subsequent
successful ownership evidence used by the guard through the existing ledger
and content store. A discovered narrowing applies to recovery as well; a later
provider failure cannot undo a known exclusion, owner change or protection.
A broader current table never expands the original assignment. Use the latest
verified restriction together with the assignment. A later successful current
query may establish that a temporary restriction has gone; unavailability
cannot. Territory outside the original assignment still needs a new assignment.
Reuse unchanged evidence by hash rather than recording duplicate full tables
for every write.

Define the durable record/schema changes and backward-reading behavior before
enabling recovery. Keep assignment authority separate from current placement
and from any future analysis checkpoint. Reconstruction from older assignments
is permitted only when existing verified records establish every required
restriction; otherwise return the exact missing authority.

**Acceptance:** capture tests cover roots, exact files, non-included child
modules, nested projects, guarded configuration, bootstrap limits and existing
excluded trees. Close/reopen the store and reproduce the same effective region
and retained evidence references. Verify known narrowing survives restart and
a later outage, broader ownership never expands the assignment, and only fresh
successful evidence can remove a temporary restriction. Missing/corrupt records
must not produce permission; identical evidence reuses its content identity.

## Iteration 4: admit bounded repair and deliver post-write findings

**Owner:** write guard and shared engineer equipment. **Prerequisite:** iteration 3.

1. Resolve both logical and physical targets. Enforce containment, denied
   files, configuration authorizations, included/excluded trees and recorded
   module-creation restrictions before considering analysis availability.
   Move the captured exclusion test ahead of the provider call: the current
   order is denied files, live placement, then exact files/roots, and a thrown
   placement query skips the captured exclusions inside `placementOutcome`.
2. Ask for current ownership. When answered, apply the existing intersection
   of captured permission and current placement. A genuine refusal stays a
   refusal; it cannot select recovery instead.
3. When current ownership cannot be established, use the recorded effective
   boundary and retained restrictions. This includes invalid acquisition
   (exit 1), incomplete acquisition or execution unavailability (exit 2),
   and undecodable/unsupported provider output. An answered classification
   that refuses the target never activates this fallback. Cancellation
   aborts the pending write; it does not authorize recovery. Record the
   write's basis as historical and retain the provider failure. Continue
   ordinary authorized `edit`/`write` calls; no special rollback tool is
   required.
4. Run the normal post-mutation observation and check. Report findings or
   unavailability to the engineer. An invalid result does not undo the edit
   and does not require the next single edit to restore validity.

Physical resolution is live even in recovery: a symlink or directory replacement
cannot redirect an authorized path to another owner or outside the captured
region. Check logical and physical exclusions, including a denied file reached
through an alias. Unreadable targets and missing/corrupt authority remain
unresolved. New source files inside an already authorized region remain
possible; new ownership boundaries are subject to the recorded bootstrap rule.

Each admitted write records the assignment reference, ownership-evidence
reference and whether placement was current or historical. Historical admission
also names the failed query. A resumed invocation reconstructs this basis from
durable records before accepting writes; an in-memory cache is not its
authority.

During ownership uncertainty, changed declarations do not silently enlarge the
recorded write region. The historical region governs interim repair. When
current ownership returns, enforce it immediately, including any new exclusion.
This permits work on a temporarily inconsistent candidate; it does not assert
that every intermediate edit satisfies the final modularity rules.

Shell commands retain their existing status: their effects are observed after
execution, not prevented by the file guard. Shell execution is never offered as
a way around a refusal. Preserve known unauthorized mutations separately from
placement that is unknown; the gate must still assess all candidate changes.

### Engineer feedback

The tool result gives the failure category, located diagnostics, what Ramify
could not establish, the effective write basis and a compact change summary.
Complete reports and existing mutation/Git evidence remain available through
read tools and run-record pointers. Stage two adds checkpoint manifests and
original-file references. Avoid pasting the whole baseline or repeating every
unchanged diagnostic after each edit.

The engineer decides whether to finish a coordinated change, correct an error
or restore selected files. Its task remains the requested outcome. The harness
does not infer intent from a diagnostic, automatically revert a candidate,
declare a new capability necessary, or require each repair edit to pass.
Normal invocation and iteration limits bound unsuccessful repair.

**Acceptance:** exercise real guard, equipment and ledger logic with scripted
provider results. Cover exact restoration, several invalid intermediate edits,
authorized unrelated corrections, new source files and authorized configuration
repair. Assert pre-query exclusion enforcement, live logical/physical checks,
recorded write provenance and restart behavior. Refuse foreign children,
excluded/nested trees, denied aliases, unauthorized configuration, symlink or
directory redirects and unapproved module creation. Answered refusal stays a
refusal; cancellation writes nothing; missing authority remains unresolved.
Exercise the shared equipment for standalone, local, capability, contract and
non-functional engineer entry points. No automatic rollback or passing
post-write check is required to retain an admitted edit.

## Iteration 5: continue responsible-architect correction

**Owner:** read-only task preparation and existing coordination workflows.
**Prerequisite:** iteration 4.

When a decision or scope correction is needed, consultation remains advisory.
The existing partial result preserves work and returns findings to the assigning
local or capability architect. That turn receives the invalid-state evidence,
prior assignment and changed paths even when views and ownership cannot refresh.
Keep previously established configuration protection paths rather than querying
live ownership merely to rediscover them while preparing a read-only turn.
Label retained views historical and unavailable refreshes explicitly.

Operations that genuinely require current evidence, such as capturing expanded
ownership or validating a new generated-feature target, return explicit
unavailability before their side effects. They must not turn read-only
coordination into an internal run failure. The architect can arrange boundary
repair first and then pursue the intended decision through the existing tools.

A fresh engineer can receive the same recorded scope, or a narrower scope,
to repair the candidate. While current ownership remains unavailable, a new
assignment cannot expand beyond verified recorded authority or invent an owner.
Restore sufficient boundary validity first, then use ordinary scope revision
for additional work. If no recorded authorized repair can do that, the architect
uses the existing environment/operator path with the specific blocked targets
and missing authority. Diagnosis, partial handoff and architectural deliberation
remain available; there is no automatic terminal `internal` failure merely
because the project is invalid.

**Acceptance:** extend the existing decision-correction tests for both local
and capability coordinators. An engineer's accepted partial result must reach
its assigning architect while ownership/view refresh fails, carrying the prior
assignment, retained edits, located diagnostics and changed paths. Verify that
read-only preparation reuses protected configuration paths, retained views are
labelled historical, and a fresh engineer can receive the same or narrower
verified repair scope. New scope/feature operations requiring current evidence
must report unavailability before side effects. When no authorized repair can
proceed, preserve deliberation and return exact missing authority through the
existing environment/operator path; never invent an owner or expand permission.

## Iteration 6: separate placement uncertainty from violations and acceptance

**Owner:** mutation evidence, candidate gates and their projections.
**Prerequisite:** iteration 5. **Tracking:** reuse `ramify-agent-9dt.2` for the
classification correction; do not create a duplicate implementation.

Before accepting a candidate, obtain current ownership and the required check
and audit evidence. Historical permission is insufficient for acceptance.
Keep source violations, unavailable placement and runtime failure distinct.
In particular, unavailable ownership must not populate `outsideScope` with
every changed path or become a fabricated scope violation. This classification
correction is tracked by `ramify-agent-9dt.2`; share its implementation and
regressions across mutation evidence and gate projections.

If candidate preflight cannot establish ownership, use the complete Ramify
diagnostics to return a repairable invalid-project outcome when established.
If execution itself is unavailable, use existing bounded infrastructure handling
and then its explicit environment outcome. Do not create a commit for acceptance
on the strength of historical ownership. ramify-audit continues to own
configured check execution, selection and audit evidence; recovery invents no
passing gate.

Successful analysis ends the analysis gap; successful ownership ends the
placement gap. Either may recover before the other. Resume ordinary behavior
from those facts without a new coordinator state machine. Invalid work can be
retained or handed back, but cannot be reported as completed and verified.

**Acceptance:** scripted regressions distinguish admitted historical writes,
unknown current placement, demonstrated outside-scope changes and runtime
failure. Verify invocation outcomes, events, metrics and web projections retain
those distinctions and mutation attribution. Include shell mutations and all
candidate changes, rather than only intercepted writes. A recovered ownership
query with still-invalid source, or recovered analysis with unavailable
placement, cannot pass acceptance. Established invalid-project diagnostics
produce repairable outcomes; exhausted infrastructure handling produces the
existing environment outcome. Neither creates an acceptance commit or passing
gate without the required fresh evidence.

## Iteration 7: qualify stage one and record ownership-query cost

**Owner:** ramify-agent implementation and qualification. **Prerequisite:**
iteration 6. Stage-one completion is independent of iterations 8 and 9.

Run the composed retained missing-export regression through authorized edit,
further repair or restoration, partial handoff, responsible-architect correction,
fresh assignment and final verification. Cover both architect kinds. Use the
retained report and scripted external answers; if historical artifacts are
unavailable, identify the scripted reconstruction instead of claiming a replay.
Qualify the other stage-one cases in the acceptance matrix below without an
analysis-correlated filesystem checkpoint.

Record ownership-query latency against `affected --batch` on representative
projects, including repeated per-write queries. Retain provider version,
project/input identity, command, sample conditions and results so the comparison
is reproducible. Removing source linking is a structural change; actual latency
is a measured result. Do not add a cache without measured need and a design that
preserves freshness, narrowing and provider identity. Keep performance probes
outside ordinary tests, following the separate stress/native boundaries.

No principle amendment is required. Update affected scope, hook, evidence and
continuation specifications, including the scope rule in `docs/harness.spec.md`,
to name the historical-authority exception, its provenance and its acceptance
limit. Keep source behavior, contracts, prompt guidance and projected evidence
consistent. Record implemented behavior and remaining limitations only after
qualification; this plan currently establishes no implementation result.

**Acceptance:** focused ordinary regressions, any required registered native
provider witnesses, `npm run type-check` and `npm run check:self` pass. Then,
when implementation has been authorized and committed, qualify a clean committed
checkout from the repository root using the default audit:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

Let the auditor determine scope and retain all configured projects. Do not add
scope overrides merely because this plan asks for qualification. Record the
consumer commit, exact provider pins, audit evidence, regression coverage and
latency results in the plan's qualification receipt. Close the stage-one Beads
work only when its acceptance is met; checkpoint evaluation remains separate.

## Iteration 8: measure checkpoint benefit before adoption

**Owner:** checkpoint evaluation under `ramify-agent-9dt.10`.
**Prerequisite:** stage one qualified in iteration 7.

The checkpoint remains an investigation direction until a measurement gate
establishes its benefit and cost. Measure representative small and large
projects, repeated invalid edits, large/binary files and resumes: capture
latency, added write latency, bytes hashed/stored, deduplication and coverage
lost to limits. Demonstrate a diagnosis that the existing mutation/Git
evidence cannot supply, and choose justified bounds before adoption. If the
benefit does not justify the cost, retain stage-one behavior. Iteration 9
describes the conditional design, not a stage-one requirement.

**Acceptance:** retain reproducible measurements and a concrete diagnostic
comparison against stage one's mutation/Git evidence. Record an adopt/defer
decision with the reasons, measured limits and coverage consequences. An adopt
decision supplies the bounds and freshness conditions for iteration 9; a defer
decision ends checkpoint work while preserving qualified stage-one behavior.
Do not implement a production checkpoint or introduce numeric defaults before
this gate is met. Track any accepted implementation follow-up in Beads.

## Iteration 9: conditionally retain a coherent analysis checkpoint

**Owner:** mutation inventory, content store and the run writer.
**Prerequisite:** iteration 8 justifies adoption and records bounds.

Use two distinct pieces of evidence: the assignment's ownership boundary for
permission, and the latest coherently retained completed analysis for diagnosis.
Neither substitutes for the other. Completed analysis may contain violations;
it is not necessarily the last passing audit or accepted Git commit.

Extend the existing project mutation inventory and content store to retain one
active recovery checkpoint per run or standalone implementation session:

| Field | Meaning |
| --- | --- |
| Analysis reference | Original check/report, provider version, project identity and input/revision identity. |
| Candidate manifest | Observed paths, entry kinds and content identities under the recorded filesystem observation scope. |
| Content references | Original regular-file bytes, held by existing content-addressed storage; symlink targets are recorded without following them. |
| Coverage | Excluded areas, unavailable content and capture gaps. |

Initial capture uses an existing completed readiness/full check where its exact
candidate is available. Later complete checks can advance it. A changed hook
can advance it only when its freshness contract establishes that the completed
analysis covers the captured candidate; an expected hash for one written file
alone is insufficient. Otherwise keep the older checkpoint and identify it as
the latest retained analyzable state, not necessarily the latest valid daemon
revision. Do not add a full batch check after every edit merely to advance it.

Capture and promotion occur under the existing mutation/writer ordering. The
manifest must be stable across the covering check and agree with its reported
input evidence where comparable. Store blobs and the manifest before atomically
recording the new checkpoint reference. A racing external edit, unsupported
freshness or incomplete capture leaves the previous checkpoint in place and
records the limitation. Never label current bytes with an earlier revision.

Use the existing mutation inventory's observation scope: project files,
configuration, additions, deletions and symlink identities, excluding repository
metadata, installed dependencies, generated views and harness state. Record
entry kinds explicitly. Files outside that scope, including external compiler
inputs, have only whatever evidence Ramify supplies. A changed environment or
provider identity is not a filesystem-only comparison.

Capture is bounded. Reuse existing candidate/content-store limits where they
apply. Determine any additional byte, file-size and entry-count bounds at the
stage-two measurement gate; this proposal establishes no new numeric defaults.
A limit or read failure records incomplete coverage rather than truncating to a
false complete baseline. Keep one active checkpoint; historical records retain
their references under existing run-evidence retention. Reuse unchanged blobs
and manifests; do not create Git commits or a second source-history service.

After a failure, compare the current inventory with this checkpoint without
calling Ramify. Supply added/changed/deleted/type-changed paths and references
to old content for inspection. Renames may be represented as delete/add. A
modified then restored file disappears from this net diff, even if Ramify's
observed path list still names it. A missing baseline falls back to the latest
mutation evidence and the accepted Git boundary, explicitly naming that older
comparison. Lack of a checkpoint must not disable otherwise authorized repair.

**Acceptance:** verify coherent capture/promotion, external edits during capture,
unsupported freshness, limits, unreadable content, restart, missing blobs and
changed provider identity. Compare multiple invalid edits, additions, deletions,
type changes, symlinks and modified-then-restored files without invoking Ramify.
Every comparison names its actual baseline and coverage. A missing or damaged
checkpoint reduces diagnostic evidence without expanding authority or disabling
otherwise authorized repair. Repeat relevant stage-one regressions and required
checks, then qualify the committed increment with the same default audit policy
as iteration 7. Record checkpoint qualification separately from stage one.

## Responsibilities and implementation leads

The evidence adapter owns CLI result decoding. Existing scope/guard code owns
captured permission and live filesystem enforcement. Engineer equipment owns
mutation observation and delivery of post-write findings. The run writer owns
durable evidence, architect continuation and any stage-two checkpoint
references. Web projects those contracts and forwards commands; it neither
derives permissions nor repairs state. Standalone, local, capability, contract
and non-functional engineers must use the same equipment rules.

Implementation leads are [scope capture](../../../subs/harness/src/work/scope.ts),
[the write guard](../../../subs/harness/src/guard/write-guard.ts),
[engineer equipment](../../../subs/harness/src/work/engineer-equipment.ts),
[project facts](../../../subs/harness/src/run/project-facts.ts),
[candidate authority](../../../subs/harness/src/run/committing-gate.ts) and
[mutation evidence](../../../subs/harness/src/run/mutations.ts).

The specific read-only preparation lead is `auditPreparationPathsOf` in
`subs/harness/src/run/project-facts.ts:108`: it awaits `queryOwnership` without
a fallback to find the configuration path. The immediately preceding
`defaultWriteScopesOf` already tolerates query failure. This uncaught call is
the source lead for the internal failure at event 141 in the retained run;
reuse captured configuration protection paths so partial can reach its
architect. The event has no stack trace, so it does not by itself prove the
exact runtime call site.

Also inspect the [CLI evidence adapter](../../../subs/harness/subs/evidence/src/ramify-cli.ts)
and [ownership decoder](../../../subs/harness/subs/evidence/src/ownership.ts).
These are implementation leads; verify current contracts before editing.

## Acceptance matrix

| Case | Required result |
| --- | --- |
| Retained missing-export edit | Ownership still answers; exact restoration and the authorized test correction work, and partial reaches its architect. |
| Forward repair | Several edits remain invalid before the final fix; all authorized edits execute and useful unrelated work remains. |
| Broken declaration or configuration | Invalid acquisition (exit 1) activates recorded permission for repair, including an authorized configuration edit, without requiring an immediately valid result. |
| Incomplete acquisition or provider outage | Exit 2 or unsupported output activates the same bounded historical authority, with the failure preserved; cancellation aborts the pending write. |
| Answered refusal | Current placement that refuses the target stays refused; it never activates historical fallback. |
| Provider gives little or no evidence | Stage one uses current files and named mutation/Git comparisons; stage two may add retained source. Timeouts/crashes are not invented project violations. |
| Authority attacks | Foreign children, excluded/nested trees, unauthorized configuration, harness files, symlink redirects and unapproved module creation remain refused. |
| Known narrowing then outage | A previously observed ownership refusal or exclusion cannot be forgotten by entering recovery. |
| Partial with invalid project | Local and capability architects receive the findings; a fresh engineer can inherit the permitted repair scope and retained work. |
| No authorized repair | Findings reach the existing environment/operator path with exact missing authority; no scope expansion from failure. |
| Stage one without checkpoint | Authorized repair and architect handoff succeed using existing evidence; no claimed last-analyzable filesystem baseline. |
| Stage two measurement | Demonstrated diagnostic benefit and measured capture/write latency, storage, deduplication and coverage justify adoption and chosen bounds. |
| Stage two checkpoint lifecycle | Stable capture, external edit race, limits, restart, missing blobs and changed provider identity preserve provenance or explicitly reduce coverage. |
| Stage two change evidence | Multiple invalid edits, additions, deletions, restored bytes and symlink changes compare correctly against the named baseline without Ramify. |
| Gate (`ramify-agent-9dt.2` classification) | Current ownership and required verification are mandatory; unknown placement is distinct from an outside-scope mutation. |

Follow [testing boundaries](../../testing.spec.md). Script provider, Git, audit and
command answers while exercising real scope, equipment, ledger and workflow
logic. Extend the existing decision-correction tests with invalid analysis for
both coordinator kinds. Native provider claims require reviewed registered
witnesses after release adoption. Measure ownership-query cost for stage one;
checkpoint bytes/time belong to the separate stage-two gate. Add caches or
more orchestration only when those measurements justify them. No paid trial
is needed to establish these deterministic contracts.
