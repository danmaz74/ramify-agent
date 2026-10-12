# Plan 40 committed stage-one qualification

**Date:** 2026-10-12. **Verdict:** Pass by composed committed default audits.
Stage one is implemented and qualified. Subsequent
[checkpoint evaluation](checkpoint-evaluation.md) deferred adoption; that
separate experiment does not alter this audited code identity.

## Qualified identity and command

The qualified consumer is commit
**`39dfae593e836fbe98b74830c17e865550d6e7d2`**, tree
`4bd03b9226419c06dea3286f8de378fc5c511416`, branch `fix/ownership-recovery`.
Both attempts started clean in `/workspaces/worktrees/ownership-recovery-agent`
and kept their candidates unchanged while running:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

No scope override or separate direct whole suite was used. Auditor **0.8.0**
read the committed configuration. Provider pins are `ramify.ts@0.5.0`,
`ramify-audit@0.8.0` and `@earendil-works/pi-coding-agent@0.87.1`.
The [released-provider receipt](release-integration-qualification.md) retains
registry identity, installed native witnesses, scripted recovery coverage and
the earlier ownership-query measurements with their actual candidate identities.

## Both attempts remain evidence

| Attempt | Candidate | Automatic execution | Result | File counts | Test counts |
| --- | --- | --- | --- | --- | --- |
| First | `810758a13f6348078f517500e17ac5bf7ff3083c` | Full: manifest/lock preparation inputs changed | Fail | 362 passed, 5 failed, 1 skipped; 368 total | 3261 passed, 7 failed, 2 skipped; 3270 total |
| Second | `39dfae593e836fbe98b74830c17e865550d6e7d2` | Scoped: first full audit baseline, all seven failures carried | Pass | 333 passed, 0 failed, 1 skipped; 334 total | 2877 passed, 0 failed, 2 skipped; 2879 total |

Requested mode was defaulted `ramify-partial` in both attempts. The first
automatically selected full execution for
`preparation-input: package-lock.json, package.json`; duration was 579.835
seconds. Its candidate tree was
`b566d686a47918cd22c8d3f24e72c6c53127d9d7`.

The first failures were existing expectation/fixture regressions: producer
refusal wording, denial-array ordering, missing scripted normalized ownership
answers in the measurement fixture, comparing root-dependent authority hashes
as identical, and recovery tests expecting a generic exception instead of
asserting the persisted refused gate. Scoped fixes preserve permission and
no-commit assertions; independent fixture provenance is verified before semantic
comparison. The original failure report remains intact.

The second automatically selected seven modules and carried all seven failures.
Its duration was 597.338 seconds. All five previously failed files are explicitly
recorded as direct executions. Runner coverage accounts for 334 expected files,
334 observed files and no missing files. The first accounted for all 368 expected
files. Both retain all three configured projects:

| Project | First full attempt | Second scoped attempt |
| --- | --- | --- |
| Node | 291 passed, 3 failed | 261 passed |
| Boundaries | 51 passed, 2 failed, 1 skipped | 52 passed, 1 skipped |
| Web | 20 passed | 20 passed |

The skipped file and two skipped tests remain explicit existing opt-in results;
they are not passing coverage. Counts overlap across attempts and must not be
added. The second is not a fresh full suite: its **scoped composition** is a pass,
chain depth 1, rooted in the first full report, with **zero outstanding failures**.

## Configured checks

All six checks and all six command units were selected in both attempts; none
was omitted.

| Check | First | Second |
| --- | --- | --- |
| Committed patch integrity | Pass | Pass |
| Type-check | Pass | Pass |
| Configured regression suite | Fail | Pass |
| Configured Cucumber profile | Pass: 0 scenarios, 0 steps | Pass: 0 scenarios, 0 steps |
| Structural self-check | Pass | Pass |
| Production web build | Pass | Pass |

The Cucumber result establishes command/profile execution, not scenario coverage.
Both structural checks report zero errors, zero warnings and 359 nonblocking
analysis limits, with partial analysis coverage over 13 owners, 810 source files
and 72 resources. Scripted local/capability recovery tests and the installed CLI
witness establish their own claims; no paid trial or replay of the historical
target is claimed.

## Durable evidence and retrieval

The first report is `f150c685a783ffc59c90d04b4ca21b49529c2f8c`, retained at
`refs/audited/runs/2026-10-12T11-48-37Z-810758a13` and
`refs/audited/by-tree/b566d686a47918cd22c8d3f24e72c6c53127d9d7`.
Run ID is `52508633-cd5e-4fcc-9bb5-417a7960d49f`.

The passing report is **`46b94ae41838254f1384095300e558854bb1194e`**, retained at
`refs/audited/runs/2026-10-12T12-07-12Z-39dfae593` and
`refs/audited/by-tree/4bd03b9226419c06dea3286f8de378fc5c511416`.
Run ID is `88f44889-f0ab-40d7-ac82-a64fdec1262a`.

```sh
git notes --ref=audit show 810758a13f6348078f517500e17ac5bf7ff3083c
git show refs/audited/runs/2026-10-12T11-48-37Z-810758a13:reports/audit/summary.json
git notes --ref=audit show 39dfae593e836fbe98b74830c17e865550d6e7d2
git show refs/audited/runs/2026-10-12T12-07-12Z-39dfae593:reports/audit/summary.json
```

Lossless [first raw output](evidence/audit-810758a.json.gz),
[second raw output](evidence/audit-39dfae5.json.gz),
[first stderr](evidence/audit-810758a.stderr.log) and
[second stderr](evidence/audit-39dfae5.stderr.log) preserve the original commands,
outcomes and mode decisions. The [derived summary](evidence/committed-audit-summary.json)
retains exact check/file/test counts, failures, coverage, refs and uncompressed/
compressed SHA-256 identities.

This receipt is added after the qualified code commit. A later documentation
receipt commit has a separate identity; it is not retroactively the audited
candidate or the dirty measurement candidate. No push, merge or sync is claimed.
