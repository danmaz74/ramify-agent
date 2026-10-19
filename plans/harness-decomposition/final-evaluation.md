# Harness decomposition evaluation

The measured implementation is `409c7de199b0919378a1cea86486724495764fec`, compared
with the immutable execution baseline `85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`.
The architecture has actual owners and integrated consumers; **operational benefit
remains unmeasured**. One combined native whole-plan review selected two boundary repairs; both are
implemented and locally verified in this candidate, without repeat broad review.
The final configured audit was pending at collection. Its outcome belongs in the
[execution notes](execution-notes.md), not inferred from these counts. The later
`28e5d808` audit repair changes two writer-blocked sentinel comparisons, updates
source/testing witnesses and adds one test helper and a blocked-writer regression.
These metrics remain the frozen `409c7de1` snapshot; see the
[repair delta](iteration-06/results.md) for the subsequent implementation.

The [responsibility map](responsibility-map.md) and
[implementation results](implementation-results.md) describe the resulting
behavior and remainder allocation. [Final metrics](final-metrics.json) supplies
compact producer identities, per-owner measurements, dependency edges, supported
contract declaration hashes, test distribution, coverage and elapsed observations.
It links the unchanged [execution baseline](evaluation/execution-baseline.json)
and preserves the distinction from the proposal's hypothetical file allocation.
The original baseline and collector were not changed.

## Structural result

Exact buckets below count each owned file once. Harness-subtree totals include
its children; do not add those totals to the individual-owner rows.

| Harness subtree descriptor | Baseline | Final |
| --- | ---: | ---: |
| Project module owners | 16 | 24 |
| Production source files / bytes | 314 / 4,681,322 | 353 / 4,808,785 |
| Production resources / bytes | 40 / 196,604 | 40 / 196,604 |
| Testing source files / bytes | 571 / 6,868,319 | 581 / 6,967,618 |
| Testing resources / bytes | 48 / 354,388 | 48 / 354,388 |
| Documentation files / bytes | 28 / 229,137 | 44 / 335,897 |
| Ordinary API catalog bytes, summed across owners | 4,084,110 | 16,002,175 |
| Testing API catalog bytes, summed across owners | 4,270,698 | 17,454,486 |

The parent falls from 223 production files / 3,490,588 bytes to 55 / 603,785.
Its testing sources fall from 424 to 284. These are redistributed responsibilities,
not removed delivered work. Subtree source and test bytes increase, reflecting
integration contracts, splits and verification alongside moves. Documentation
buckets include declarations; this is not a count of all repository prose.

| Actual owner within harness | Production files / bytes | Owned testing sources | Provider owners | Outbound production file pairs |
| --- | ---: | ---: | ---: | ---: |
| Parent | 55 / 603,785 | 284 | 15 | 99 |
| Assistance | 13 / 158,098 | 10 | 12 | 60 |
| Session store | 1 / 22,661 | 7 | 3 | 4 |
| Task execution | 20 / 217,369 | 10 | 7 | 38 |
| Task workflow | 26 / 497,942 | 20 | 17 | 419 |
| Autonomous lifecycle | 15 / 367,328 | 9 | 17 | 180 |
| Planning | 11 / 92,778 | 4 | 9 | 56 |
| Work coordination | 68 / 1,018,239 | 44 | 16 | 304 |
| Acceptance | 44 / 582,527 | 45 | 17 | 244 |

Dependency counts derive from distinct directed application production-file pairs,
including type dependencies and excluding packages/builtins. They are limited by
partial producer coverage. The metrics retain the actual owner edges and
resolved-original counts; neither an exposure count nor a provider count proves
minimal interfaces or independent changeability. Testing counts include helpers.
Direct testing-import counts are retained separately and overlap across owners;
they are not transitive reach or executed test counts.

The session-store boundary retains four production consumer files and three
provider owners. Assistance has one external production consumer file. Task
execution has 93, while the authored task-workflow layer has 11. These descriptors
are consistent with shared mechanisms and separate workflow construction, but do
not measure how much unrelated knowledge a real subsequent task needs.

API context did **not** shrink in this measurement. Parent ordinary/testing
catalog buckets grow from 220,310 / 223,871 to 663,378 / 698,314 bytes. The
additional owners receive large inherited/relayed catalogs; their summed API
bytes repeat available contracts and are not unique delivered provider context.
The catalogs retain coverage/truncation metadata. Final architect dependency and testing-reference summaries are
unavailable with `resource-limit`, despite successful catalog materialization.
The dependency and direct-test descriptors here come from the complete retained
batch check application-access inventory, not the unavailable architect graph.
Measure context buckets remain available; structural analysis still has the
explicit partial-coverage limits described below. Declaration hashes and
Ramify-produced exposed-symbol counts identify supported contract surfaces;
actual consuming entries were inspected during implementation, as recorded in
iteration results. No delivered-prompt or token saving follows from these sizes.

## Selection and qualification coverage

The final passed structural producer covers 24 owners, 1,051 source files and
97 resources, with zero errors/warnings and 775 analysis limits. The execution
baseline had 16 owners, 1,002 source files, 97 resources and 458 limits. Coverage
is partial at both boundaries. The final limit codes are 755 `signature-inferred`,
nine `namespace-escape`, six `nonliteral-target` and five `shared-global`.

Equivalent session-store and assistance service affected probes select **all 24
test owners**, versus all 16 at baseline, with `partial-coverage` widening.
There is no demonstrated test-selection or audit saving. These are actual Ramify
selections, not a claim about which checks an audit ultimately executes.

The iteration reports retain focused/native verification and consumer integration.
Their test totals overlap and must not be summed as unique coverage. This
evaluation did not rerun tests, structural checks or audits. A passed structural
check and native review observations do not replace the final configured audit.

## Execution observations

The user-approved native cadence replaced repeated RA gating during execution;
[execution notes](execution-notes.md) records the authority and retained statuses.
Iterations 2–4 each received one native review with no material finding. Iteration
5 received one review selecting two boundary repairs: detached nested observations
and retained handback completion basis. Their focused verification preceded
acceptance. The combined iteration-6/whole-plan review selected two further repairs: removing
mutable lifecycle authority from the task-workflow boundary and detaching remaining
finding/index/projection reads. Both were implemented and focused-verified before
this measured candidate; no second broad review was run.

| Native outcome | Recorded start → candidate commit, UTC | Elapsed capture window |
| --- | --- | ---: |
| 2: assistance | 09:31:19.905 → 09:43:11 | 11.85 min |
| 3: task execution | 09:44:48.280 → 10:07:00 | 22.20 min |
| 4: lifecycle/planning | 10:09:03.812 → 10:30:59 | 21.92 min |
| 5: coordination, including selected repairs | 10:33:01.854 → 11:19:39 | 46.62 min |
| 6: acceptance/integration, including selected repairs | 11:20:36.006 → 12:33:22 | 72.77 min |

All endpoints are on 2026-10-19. Starts come from retained iteration records;
commit times come from Git. These windows include waits and parallel work. Reviews
or acceptance after a commit are outside that window; it is not exclusive active
effort, a complete review-cycle duration or a comparison between equivalent tasks.
The metrics retain full identities and endpoints rather than deriving speedups.

Earlier qualification work also matters: seven retained RA assessments comprise
five `incomplete`, one `action-required` and one `clear`. The clear result qualifies
the review-lifetime correction; it does not relabel the session-store assessments.
Setup/model compatibility, review lifetime, ordinary-test boundary repairs and
artifact-access accounting contributed real coordination and assessment effort.
The parked inspection experiment is excluded. Assessment endpoints are retained
separately and may overlap engineering windows; adding them would double-count.

The accessible native-session discovery did not establish a comparable accepted
before/after task pair. Complete native engineering/coordinator input/output tokens,
exclusive active time and task-local exploration are unknown. Pi observations
cover their own invocations, not all native work. Neither structural counts nor
this chronology demonstrates productivity, latency, exploration, token, cache or
audit benefit. Missing observations remain unknown rather than zero.

## Provenance and reproduction

Collection reused the worker's final check JSON at `/tmp/final-repair-check.json`
from `npm run check:self -- --format json`, with npm wrapper text removed. It reused
all ordinary/testing catalogs and architect metadata from synchronized revision
`rev/1:98401fa3-0bf0-4288-872c-8a6629b3b266:16`; no materialization was repeated.
The installed pins remain Ramify 0.5.2 and ramify-audit 0.9.3.

From the target root, collection ran:

```sh
node_modules/.bin/ramify measure --format json > /tmp/harness-decomposition-final-measure.json
node_modules/.bin/ramify affected --path subs/harness/subs/session-store/src/session-store.ts --format json > /tmp/harness-decomposition-final-affected-store.json
node_modules/.bin/ramify affected --path subs/harness/subs/assistance/src/service.ts --format json > /tmp/harness-decomposition-final-affected-assistance.json
python3 plans/harness-decomposition/evaluation/collect.py --root . \
  --check /tmp/final-repair-check.json \
  --measure /tmp/harness-decomposition-final-measure.json \
  --affected /tmp/harness-decomposition-final-affected-store.json \
  --compare plans/harness-decomposition/evaluation/execution-baseline.json \
  > /tmp/harness-decomposition-final-summary.json
```

The existing collector authenticated inventory hashes, measure bytes and catalog
revision correspondence. Additional `git cat-file --batch` authentication compared
all **1,196 measured source/resource/document/declaration files** byte-for-byte
with frozen commit `409c7de1`; all matched. The checkout was clean at collection. The reports' later commit
is therefore separate from the measured source identity.

The metrics retain producer input hashes, revision identities, collector hash,
units and source authentication. Large raw/check/collector outputs remain temporary
and are not new committed proof obligations. To reproduce the compact projection,
keep each owner's exact measurement, dependency/test descriptors, contract
path/hash and API coverage metadata from the collector output; omit full file and
direct-test path inventories. Original inputs remain under the immutable baseline.
