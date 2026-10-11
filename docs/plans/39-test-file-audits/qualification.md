# Plan 39 release and consumer qualification

Implementation and qualification completed on 2026-10-11. Consumer integration
is left to the parent review. No branches were pushed and no Dolt remote sync
was run. The single-file demonstration commit remains on its separate branch.

## Released providers

Both exact pins were installed from `https://npm.braimax.com`, in an independent
consumer worktree with its own `npm ci`. Installed package contents matched
all 494 Ramify files and all 255 auditor files against release manifests.

| Package | Version | Released source | Tarball SHA-256 |
| --- | --- | --- | --- |
| ramify.ts | 0.4.3 | `6161e76dcd22e45213a59e19950762750ca03e60` | `fb94e0c049278d21a1ef3e8fb4b8e834021f76204f89c0848f218130799215ff` |
| ramify-audit | 0.8.0 | `611c4ba14206b4e2ca26c5f3d0945c5695c81305` | `81a640237ca47a0603ecf456cbcb14fdea61c660dfc04b6b97a6295e3cf5a5b1` |

Ramify's full release audit passed 205 files and 2,902 tests. Its report is
`d2f408d0f67e9e7b006c78ed349b0e25a9d2ad63`, run
`refs/audited/runs/2026-10-11T20-30-45Z-6161e76dc`.

Auditor 0.8.0 preserves the published 0.7.3 early-mode changes from
`628b9dff61b6c97819e74e293e6a2449039439da` and
`4fe4b24298c4967a679cca5e63b819e075948c02`. A fresh forced full audit of
clean source `611c4ba` was produced by independently registry-installed 0.7.3;
these overrides are required by the provider release workflow. All four
checks, 51 files and 1,348 tests passed with no skips. The report is
`96d5908ec0efe097a130248046f472eb88dea5c6`, run
`refs/audited/runs/2026-10-11T21-27-55Z-611c4ba14`. Publication used:

```sh
npm run release -- --publish --audited-source 611c4ba14206b4e2ca26c5f3d0945c5695c81305 --audit-run-ref refs/audited/runs/2026-10-11T21-27-55Z-611c4ba14 --audit-producer 0.7.3
```

The release script verified packed identity and registry CLI smoke. Auditor
provenance remains in its Git common directory at
`ramify-audit/releases/ramify-audit-0.8.0.json`. Its durable release receipt is
[recorded upstream](https://github.com/danmaz74/ramify-audit/blob/8a1c30af8ef25ec11ad0af3c8fff7323be828fd0/docs/2026-10-11-direct-test-selection-release.md).

## Consumer adoption and passing audit chain

Worktree `/workspaces/worktrees/ramify-agent-plan39`, branch
`feat/plan39-provider-adoption`, started from
`fefb0b0499ab44e75ebbd9f345e9b326b2896912`. Commit
`ce49799e32a6294703a07df0782dde12e9d949eb` installs the exact registry pins,
requires schema-5 completed evidence, explicitly rejects schema 4, and updates
live native fixture metadata and boundary titles. Historical receipts retain
their original schema and versions.

```sh
npm ci
npm install --save-exact ramify.ts@0.4.3 ramify-audit@0.8.0
npm run check:self
node_modules/.bin/ramify-audit audit --cwd . --json
```

Focused completed-evidence tests passed 16/16, TypeScript checks passed, and
`check:self` reported zero errors and warnings. Consumer audits used default
scope from clean committed sources; no scope or reuse override was supplied.

The initial audit of `ce49799` selected full scope because its predecessor had
schema-4 evidence. It retained every configured project and ran 358 files and
3,200 tests: 355 files passed, two failed, one skipped; 3,196 tests passed, two
failed and two skipped. All five other checks passed. The failures exposed a
stale assertion accepting a retained schema-4 receipt and a test observing a
handback ledger event before its materialized file existed.

Commit `cf7e5851b808058e762bebec691a308b0a83859d` fixes only those tests:
the historical receipt is now refused, and the acceptance helper waits for
the existing `afterWrite` materialization callback. It adds no timeout, sleep
or retry. Focused workspace boundary tests passed 4/4 and the acceptance
matrix passed 12/12; TypeScript checks passed.

The subsequent default audit selected seven modules and carried both failures
forward. All six checks passed, with 324 expected files executed and none
missing: 323 files passed and one skipped; 2,806 tests passed and two skipped
out of 2,808. Composition passed at chain depth 1 with zero outstanding
failures. This passing partial result composes with the compatible full root;
it is not a second full-suite execution. The two pre-existing opt-in skips are
in `subs/harness/src/tests/fixture-trials.test.ts`. The configured Cucumber
check passed with zero scenarios in both audits.

| Evidence | Source | Report | Run ref |
| --- | --- | --- | --- |
| Initial full root, failed | `ce49799e32a6294703a07df0782dde12e9d949eb` | `bd462db64e1405de8bade64c3412caf3a9494760` | `refs/audited/runs/2026-10-11T21-40-22Z-ce49799e3` |
| Corrected passing chain | `cf7e5851b808058e762bebec691a308b0a83859d` | `331da83005844ac330338b839b19081bcb7f63aa` | `refs/audited/runs/2026-10-11T21-54-04Z-cf7e5851b` |

## Subsequent single-file witness

Disposable worktree `/workspaces/worktrees/ramify-agent-plan39-witness` had its
own `npm ci` and the same exact registry pins. Branch
`test/plan39-single-file-witness-qualified` starts from passing `cf7e585`.
Commit `11478dda109bec6c141524eaafc61dfbdd90a32a` adds only a comment to
`subs/harness/subs/audit/src/tests/completed-audit.test.ts`. This demonstration
commit must not be integrated into the adoption branch.

The same default audit command passed. Selection contained no modules and
exactly that one direct file, executed once by `agent-tests` / `agent-vitest`
in project `node`: one invocation group, one passing file and 16 passing tests.
Expected-file contract `runner-configured-files/2` recorded expected 1, run 1,
missing `[]`, and the matching required direct execution with `ran: true`.
All four non-test checks passed: patch integrity, TypeScript, structure and
web build. Composition passed at chain depth 2 with zero outstanding failures.

Both revisions' Ramify facts report an owned, present file with complete empty
exports, no known incoming paths and no limits. Incoming analysis is recorded
as partial; the auditor's eligibility policy uses the absence of known incoming
dependencies. The selection records reason `discovered-isolated-test` and a
modified path. Existing caps count the change: baseline depth 1, depth 2,
distinct drift paths 3, with full root `ce49799`.

- Report: `5e477cd3919f14dfb72182996caa308ea8850d18`.
- Run: `refs/audited/runs/2026-10-11T21-55-28Z-11478dda1`.
- Tree: `refs/audited/by-tree/83a7478947be5d96121fb5262c23798e2622aa5e`.
- Exact retained [selection artifact](evidence/direct-test-selection.json)
  uses report schema 4 and selector schema 3.

Retrieve the complete execution and expected-file artifacts from retained Git
evidence, including the full-root chain:

```sh
git show 5e477cd3919f14dfb72182996caa308ea8850d18:reports/audit/summary.json
git show 5e477cd3919f14dfb72182996caa308ea8850d18:reports/audit/expected-files.json
git show 331da83005844ac330338b839b19081bcb7f63aa:reports/audit/summary.json
git show bd462db64e1405de8bade64c3412caf3a9494760:reports/audit/summary.json
```
