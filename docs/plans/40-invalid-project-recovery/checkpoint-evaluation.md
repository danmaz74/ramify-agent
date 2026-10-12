# Plan 40 checkpoint evaluation

**Date:** 2026-10-12. **Decision:** Defer the retained analysis checkpoint.
Iteration 8 is complete; iteration 9 is not triggered. Qualified stage-one
repair and architect continuation remain the delivered behavior.

## Benefit and decision

A retained baseline can recover exact intermediate bytes that an accepted Git
commit and hash-only mutation inventories cannot recover. The opt-in experiment
demonstrates that capability with the installed `ramify.ts@0.5.0`: a private
dependency-free project passes a complete batch check with an uncommitted
operator adjustment (`value = 19`), then a shell command overwrites that file
without reading its original contents into the transcript. The subsequent check
exits 1 with invalid-project evidence. HEAD contains `value = 1`; the command,
empty output, Git diff and mutation hashes omit the earlier adjustment.
Retaining its bytes permits exact inspection and reconstruction. Pre/post-check
inventories match. This is a constructed witness, not a replay or an estimate
of how often real work needs that baseline.

Existing transcripts retain tool arguments, read results and edit `oldText`;
assignment context can also carry source excerpts. These must be considered
alongside mutation/Git evidence. In the motivating retained run
`20261011T224003Z-6f9166`, transcript `ses-0011` rows 57 and 60 contain the
declaration edit and its exact inverse. The original block also exists in
accepted commit `3c3da62c36665ac277a8fd2bd4dec0a2cd6197fc`. The engineer already
knew precisely what to restore: admission and architect continuation were the
blockers. A checkpoint would not supply missing restoration content in that
case. The [compact historical comparison](evidence/checkpoint-historical-comparison.json)
retains the exact arguments, accepted declaration, original artifact path and
SHA-256, without copying the whole analysis or transcript.

Capture costs are affordable at occasional complete checks on these workloads,
but that alone does not establish enough practical benefit to justify adoption.
The observed motivating failure needs no additional old bytes. The new witness
establishes a narrower shell-overwrite possibility; neither its incidence nor
improved real diagnosis is measured. Adoption would also require a byte-capable
store, coherent check/candidate binding, coverage handling and retention-growth
policy. Existing full checks occur at readiness/verification and
`completion-proposed`; an ordinary successful changed hook does not establish
freshness for the whole captured candidate. During a long multi-edit session,
the retained completed check may therefore precede useful analyzable edits.

Defer on those grounds, rather than because capture is universally too slow.
Revisit if a retained real failure lacks the necessary bytes in HEAD, tool
inputs/read results and assignment context, and a completed-check baseline
would materially improve its diagnosis. Before adoption, demonstrate coherent
promotion in the existing check/writer paths and measure incremental cost and
retention across those actual opportunities, including changed binary content.
No production checkpoint, cache, numeric default or iteration-9 follow-up is
introduced by this evaluation.

## Reproduction and identity

The [standalone Python probe](evaluation/checkpoint-cost.py) is outside ordinary,
native-test and audit discovery. It uses native filesystem operations and,
only with the explicit flag below, private Git operations and the installed CLI.
It invokes no model or paid service. From the consumer checkout:

```sh
python3 docs/plans/40-invalid-project-recovery/evaluation/checkpoint-cost.py --repo /workspaces/worktrees/ownership-recovery-agent --output /tmp/plan40-checkpoint-cost-final.json --samples 5 --native-witness
```

Use a new output path; scratch projects/stores are created under `/tmp` and
their paths are retained. The final run started at **12:13:24 UTC**, took
**58.94 seconds**, and used script SHA-256
`1751df3071a1ce6720469ae64b6cfbaf2b81afca4564c9485d4ab3e5d3097629`.
The live checkout HEAD was documentation receipt
`a761bb5bde35ba30b9525c2dffc0fe93a05d18fd`, with evaluation files dirty.
Actual-source workloads were frozen with `git archive` from qualified code
`39dfae593e836fbe98b74830c17e865550d6e7d2`; archive hash, dirty status, host,
runtime, complete per-sample inputs/results and native commands are retained
in [lossless final JSON](evidence/checkpoint-cost.json.gz). Its uncompressed
SHA-256 is `81f25e8cd6297d70fdf05c5ce66f70c658a0e2cfd6a19a6f31c359890b6c643b`;
compressed SHA-256 is
`10284d3a49367b676447c7cb0f2f9c20b74736ceb473dc4a08e8b3df3ee52dd7`.

One initial invocation stopped before measurement because this Python's
`tarfile` lacks the newer extraction-filter argument. Portable extraction
corrected that issue. A subsequent exploratory run completed before resume
verification and the large edit sequence were added; its
[original JSON](evidence/checkpoint-cost-exploratory.json.gz) remains separate.
Only the final run supplies the numbers below.

The probe mirrors `projectMutationSnapshot` exclusions and symlink identities;
empty directories are unobserved. Frozen source includes tracked content only,
so it is not a measurement of ignored/untracked working files or installed
dependencies. Four-group synthetic content deliberately demonstrates dedup;
it is not a worst-case unique-content workload. There is one warmup and five
serial measured pairs per workload, with OS caches uncontrolled and no cold-cache
claim. All pre/post inventories were stable. These are Python prototype timings,
not production Node `ContentStore`, guard or provider-query timings.

## Capture, storage and write costs

Raw capture reads/hashes the inventory, hashes original-byte blobs again, writes
new blobs through a flushed temporary plus exclusive hard link and directory
flush, and retains the manifest. It models durable blob cost, without production
leases, ledger reference publication or integrated check ordering. A separate
full inventory fence quantifies one extra scan; it does not measure the provider
check, locks or race-proof integration. Initial and repeated capture both read
all source bytes. A new reader verifies every manifest and blob hash.

| Workload | Entries / source MiB | Snapshot median ms | Initial raw capture ms | Repeated capture ms | Extra fence ms | Cold store-cache recapture ms | Resume verification ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Synthetic small | 129 / 1.00 | 7.61 | 12.23 | 9.91 | 7.65 | 11.64 | 4.86 |
| Synthetic large | 4099 / 112.00 | 411.52 | 704.83 | 660.01 | 420.89 | 724.04 | 319.95 |
| Actual collection fixture | 103 / 0.34 | 8.73 | 48.64 | 10.07 | 8.79 | 41.84 | 3.44 |
| Actual committed harness source | 2592 / 75.65 | 292.60 | 1482.27 | 442.01 | 292.18 | 1335.75 | 213.66 |

Initial capture hashes respectively **2,112,437; 235,372,831; 719,590;
159,095,479 bytes**, including the second blob hash and manifest. Initial raw
storage is **48,053; 50,888,993; 367,523; 78,815,304 bytes**. Unique regular-file
contents number **4; 6; 103; 2548**. Every unchanged repeated capture stores
zero additional bytes. Resume with an empty store cache still hashes and writes
temporary payloads before discovering existing targets; zero retained growth
does not mean zero I/O.

Eight synthetic steps on both scales cover invalid byte edits, addition,
deletion, repeated edit, exact restoration, symlink deletion, type change and
binary overwrite. They are byte-edit experiments, not eight provider verdicts.
The active checkpoint stays at its initial manifest. Every-step capture is a
separate hypothetical upper-cost probe, not a proposed production promotion
policy. Median existing before/after inventory cost is **15.38 ms** small and
**798.82 ms** large. Adding an independent every-step retention pass costs
**10.85 ms** and **623.93 ms** respectively. A net comparison against the already
available current inventory costs **0.061 ms** and **1.858 ms**. No fused
implementation or end-to-end write speedup is claimed.

After those edits, a reader reloads the initial manifest and verifies all
original blobs (**4.86 ms / 298.82 ms**), recovering the original first file
exactly. The restored file disappears from the net diff. Original binary bytes
are verified by their stored hash, without invoking Ramify. These are prototype
readback and comparison results, not production resume qualification.

## Binary handling, limits and coverage

The production store accepts UTF-8 strings; decoding arbitrary binary into those
strings loses bytes. The 256-byte control fails a replacement-decoding UTF-8
round trip. Raw blobs preserve them; base64 round trips losslessly but requires
an encoding envelope and original-byte identity. The string-envelope costing
trial stores **59,409; 67,688,709; 496,049; 105,213,287 bytes** respectively,
roughly a third more than raw for the larger real workload. It is not a
production binary API or a fully integrated encoded manifest. A byte API would
also require typed references/read behavior for existing text consumers.

The following are experimental storage-coverage limits, **not adopted defaults**:

| Per-file / total / entries | Synthetic large retained entries / source MiB | Actual harness retained entries / source MiB |
| --- | ---: | ---: |
| 1 MiB / 8 MiB / 1000 | 513 / 8.00 | 226 / 8.00 |
| 8 MiB / 64 MiB / 5000 | 4097 / 64.00 | 1544 / 64.00 |
| 64 MiB / 256 MiB / 20000 | 4099 / 112.00 | 2592 / 75.65 |

The first row loses **3586 / 2366 entries**; the middle loses **2 / 1048**.
Both smaller workloads retain complete observation coverage at all three rows.
The middle synthetic limit specifically omits its 16 MiB binary and 32 MiB
text file. The largest row covers these examples, whose largest file is
32 MiB, but establishes neither adequate universal bounds nor a realistic
retention-growth maximum. One active reference does not erase historical
references or changed blobs retained across checks.

Limits here are applied after the full inventory has read and retained payloads
in memory. Consequently these measurements establish storage coverage loss,
not bounded reads, hashing, peak memory or capture-time guarantees. Lexical
traversal also makes total-budget omissions arbitrary with respect to diagnostic
importance. A future streaming design must bound acquisition itself, retain
explicit gaps and separately evaluate file/entry/byte policy. External edit
races, unsupported input correlation and provider/environment changes must
keep an older named baseline or report unavailable coverage; they cannot label
current bytes with an earlier check. Missing checkpoint evidence must continue
to permit stage-one authorized repair and architect handoff.

No runtime source changed. This opt-in script executed successfully and retained
actual CLI success/failure plus verified blob readback. The
[stage-one default-audit receipt](audit-qualification.md) remains the authority
for production qualification; this experiment neither reruns nor extends its
audited code identity.
