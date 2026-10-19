# Independent evidence-access diagnostic

The as-0003 review found no source concerns and marked iteration requirements met,
but reported five retained artifacts as incompletely accessible through bounded
text tools. This diagnostic supplies delegated native verification of their full
contents. It does not require Pi to independently decompress binary evidence or
read every byte of a large producer report again. It does not change the original
review or any harness record.

Run from the project root:

```sh
python3 plans/harness-decomposition/corrections/evidence-access/verify.py
```

The script imports no evaluation collector code and performs no provider query,
model request, audit or job operation. It fully reads all input bytes, checks gzip
integrity through complete decompression, parses the complete JSON, and recomputes
content claims from retained application accesses and inventories. It uses
`git cat-file --batch` against immutable commit paths to authenticate source bytes.
[verification.json](verification.json) records the exact inputs, stored and decoded
SHA-256 identities, byte counts, outcomes and verifier identity.

The command passed. Every entry in both input manifests matches stored bytes and
SHA-256. All 1,099 baseline inventory files match Git commit
`85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`. All 1,101 after inventory files match
`ed9a61330fa6e3f7d72d34197e7fb840beffc13c`, including physical line/byte counts.
There are zero mismatches. The separate worker before-check inventory is identical
to the immutable execution baseline inventory despite different producer IDs.
The after-summary's captured HEAD remains the original baseline plus dirty source;
the new Git authentication establishes its content correspondence to the later
candidate without rewriting that provenance.

Independent assertions cover every source/resource exact bucket and documentation
bucket, every summary file identity, imported-original and unresolved-selection
count, directed production module edge, consumer/provider count, direct-test path
and count, declaration hash, and the comparison's added/removed owners. The
measure records also match every summary module measurement. The retained summary
API physical-byte values equal the corresponding measure context buckets, and
API revision metadata is consistent with the retained measure revision. This is
consistency of retained provider facts, not a fresh reconstruction of historical
physical API catalogs. Batch affected input and resident measure IDs can differ;
the collector records them separately, and the architect input matches the
retained affected revision. Partial coverage and catalog truncation remain.

## Quantified extraction comparison

[comparison.json](comparison.json) provides the bounded source of the following
descriptors; its input hashes connect to the full retained artifacts.

| Exact owner bucket | Before harness | After harness | New session-store |
| --- | ---: | ---: | ---: |
| Production source files | 223 | 222 | 1 |
| Production source bytes | 3,490,588 | 3,468,530 | 22,661 |
| Production resource files / bytes | 39 / 194,999 | 39 / 194,999 | 0 / 0 |
| Test source files | 424 | 419 | 7 |
| Test source bytes | 5,542,743 | 5,475,547 | 71,227 |
| Documentation files / bytes | 2 / 143,601 | 2 / 144,190 | 2 / 1,433 |
| Ordinary API bytes | 220,310 | 220,941 | 306,687 |
| Testing API bytes | 223,871 | 224,733 | 320,766 |

These are ownership/source and provider context-size descriptors. The new child's
ordinary/testing catalogs retain broad ancestor exposures, so creating the owner
does not establish a smaller delivered context. The harness's API buckets grow
by 631 and 862 bytes. Its production source decreases by 22,058 bytes while the
child has 22,661 bytes: their combined production size increases by 603 bytes.
Their combined testing sources increase by two files and 4,031 bytes. These counts
include integration changes; they are not delivered-work credit or performance.

The child has four outgoing production file pairs to four dependency files in
three owners: harness (lock), agent (store contract/error identities) and ledger.
It imports ten distinct resolved external original identities, with zero unresolved
selection occurrences. Four harness production consumers each import the child.
There are 13 testing source files directly importing child production source;
11 also directly import other production owners. These include helpers and do not
measure transitive test reach. Seven testing source files belong to the new owner.
The parent's production outbound pairs change 393 → 394 and inbound pairs change
226 → 227; this extraction does not claim whole-harness decoupling.

Actual module count changes 16 → 17. Before and after affected probes both select
all modules, increasing selected test owners 16 → 17 because of partial coverage.
This establishes no audit saving. The producer still reports 458 analysis limits.

## Bounded inspection pieces and limits

[slices/](slices/) contains exact projections of the retained summaries for harness,
session-store, agent and ledger: declarations, architecture contracts and direct
testing import paths. Each file is at most 33,152 bytes. These pieces are useful
for bounded snapshot reads; the verification has already parsed all summary files
and dependency descriptors, rather than requiring a guessed truncated excerpt.
Original compressed checks and oversized summaries remain immutable and retain
their complete content. Read this report, verification.json and comparison.json
first; follow the child/parent contract slices when those details matter.

The diagnostic preserves the distinction between producer facts (inventory,
accesses, measure buckets, affected selection), independently recomputed collector
descriptors (unique pairs/originals/direct-test distribution), and unavailable
operational benefit. It does not rerun structural producers, catalogs, tests or
audits and does not establish fresh qualification for subsequent source corrections.
It does not infer active engineering effort, provider token savings, cache savings
or productivity from source moves. No accepted comparable operational task pair
was established. No missing observation is treated as zero.

## Compressed input identities

The complete identities are machine-readable in verification.json. These decoded
hashes identify the complete JSON documents, independently of gzip encoding:

- `evaluation/baseline-inputs/check.json.gz`: 5,158,111 stored bytes → 71,227,149 decoded bytes; decoded SHA-256 `d80ea336b4a0cdb401fa77e6e84fa9a6388de18d6dc39f85d435d988457fe3e4`.
- `iteration-01/before-check.json.gz`: 5,343,063 stored bytes → 71,227,009 decoded bytes; decoded SHA-256 `33d09cc8e9d02686c0a5fd277d810a3de076254e396c6e0c4376a810c5e45b3f`.
- `iteration-01/after-check.json.gz`: 5,350,982 stored bytes → 71,339,729 decoded bytes; decoded SHA-256 `a590954e50f6cee71b49bf03ec8a3223de9228bf1045860746edc66777b93381`.
