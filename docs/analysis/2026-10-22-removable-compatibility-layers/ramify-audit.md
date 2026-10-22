| # | Location | What it tolerates | Old form still produced? | Class | Est. lines | Consumers affected |
|---|---|---|---|---|---|---|
| 1 | Evidence builders, types and public barrel | Schema-5 API names that now mean schema 6 | No schema-5 records; internal callers still use the old names | C | 10–15 | `ramify-agent` consumes the package barrel; no direct imports of these aliases found |
| 2 | Vitest summary decoder and observation extraction | A readable summary without individual `tests` | No production reporter; test helpers still construct it | A | 8–12 | Audit-local helpers and fixtures; no matching imports in the other repositories |
| 3 | Flakiness history journal finalization | An old cleanup that deleted a displaced backup without retaining its inode | No; replaced by retain-before-remove cleanup | A | 3–6 | Internal recovery tests only |

Estimates are net removable compatibility lines, not rename churn or whole test-file sizes. No configuration or published-receipt conversion was established as necessary.

## 1. Remove schema-5 source-compatibility names

**Paths**

- `subs/evidence/src/interfaces/evidence.ts:392–393`: explicitly retains `EvidenceSummaryV5` as an alias of `EvidenceSummaryV6`.
- `subs/evidence/src/coverage.ts:152–176`: the implementation input still bears the V5 name; V6 is its alias.
- `subs/evidence/src/coverage.ts:237–302`: `createEvidenceSummaryV5` builds schema 6; `createEvidenceSummaryV6` aliases it.
- `src/index.ts:16–17,260–261`: publishes both naming sets.
- `subs/evidence/module.ramify:15,26`: exposes both naming sets.
- `src/tests/installed-entrypoints.test.ts:154–168`: specifically protects the V5 exports.

**Verification**

`git log -S 'source compatibility'` identifies `720d88d` as the introduction of the aliases. Its diff changes the actual evidence schema from 5 to 6 while retaining the old source names.

The current builder writes `evidenceSchemaVersion: 6`. The decoder accepts only schema 6 at `subs/evidence/src/evidence.ts:83–94`. There is no second implementation behind the V5 names.

Searches of current source and tests in `ramify-agent` and `ramify` found no imports of `EvidenceSummaryV5`, `EvidenceSummaryV5Input` or `createEvidenceSummaryV5`. The agent imports the package’s service, result and diagnostic contracts through `subs/harness/subs/audit/src/check-execution.ts:7–25` and its sibling adapters. Its package pin is already `0.12.0`.

**Removal**

Make the V6 builder and input the primary declarations. Rename audit-local callers. Remove the V5 exports, alias declarations, module exposures and alias-specific installed-package assertions. Keep the evidence validation and schema-6 tests.

This is a public-package change, not a published-evidence conversion. `ramify-agent` needs the corresponding package pin update; its inspected imports need no alias replacement.

**If verification is wrong**

An uninspected consumer importing a V5 name fails to compile or import. Published JSON evidence does not change.

## 2. Stop accepting live Vitest summaries without `tests`

**Paths**

- `subs/checks/subs/vitest/src/interfaces/vitest-observations.ts:101–102`: says `tests` is optional for older stored summaries.
- `subs/checks/subs/vitest/src/failure-list.ts:58`: omits combined test observations when an input summary lacks them.
- `subs/checks/subs/vitest/src/failure-list.ts:174,220`: accepts and preserves an absent `tests` field.
- `subs/checks/src/test-observations.ts:12–15`: turns that old readable shape into indeterminate observations and substitutes an empty iteration list.
- Representative old-shape test producers:
  - `subs/checks/subs/vitest/src/tests/failure-list.test.ts:27–41`
  - `subs/checks/src/tests/execution.test.ts:60–67`

**Verification**

`git log -S 'Optional for older stored summaries'` identifies `7d39218`. That commit added individual test observations to the reporter and simultaneously added the optional-field compatibility path.

The current reporter initializes a `tests` array and always returns it, including when empty: `subs/checks/subs/vitest/src/vitest-reporter.ts:144,202`.

The decoder’s production read paths consume temporary output from the current reporter:

- `subs/checks/subs/vitest/src/vitest-command.ts:110`
- `subs/checks/src/check-dispatcher.ts:322`

No production path was found that passes historical Git report artifacts through this decoder. Published summaries are retained separately as artifacts by `subs/checks/subs/vitest/src/vitest-artifacts.ts:3–10`.

**Removal**

Require `VitestSummary.tests`. Remove absent-field preservation from decoding and aggregation, and remove the old-shape branch from observation extraction. Update synthetic summaries in test helpers rather than deleting their failure-ledger and execution tests.

Leave published historical artifacts unchanged. Keep malformed-summary rejection.

Do **not** make `attempts` mandatory as part of this removal: the current reporter deliberately omits it when native event evidence is incomplete at `vitest-reporter.ts:166–178`.

**If verification is wrong**

A registered host writing a summary without `tests` becomes undecodable instead of supplying an ordinary failure list with unavailable individual observations. The audit cannot treat that result as complete.

## 3. Remove the pre-retention cleanup exception

**Paths**

- `subs/evidence/subs/flakiness/src/guarded-file.ts:150–155`: accepts a named displaced backup when neither its checkout path nor its retained path exists.
- `subs/evidence/subs/flakiness/src/guarded-file.ts:88–108`: current cleanup retains the inode before removing the checkout backup.
- `subs/evidence/subs/flakiness/src/tests/application.test.ts:260–290`: manually constructs cleanup states by deleting the backup without creating its retained link.

**Verification**

`git log -S 'legacy cleanup'` identifies `4dee086`.

Before that commit, cleanup directly removed the backup. The commit replaced that operation with a hard link under Git’s `ramify-audit/flakiness-backups/`, verified the inode, and only then removed the checkout name. It also added the explicit legacy-cleanup exception.

Current cleanup therefore leaves either the original backup or its retained link while the journal exists. A receipt-bearing journal with a named backup but neither copy is the obsolete case.

**Removal**

Remove acceptance of the missing-both-copies case. Keep recovery through the retained link and keep journals without `backupName`, which current initial-file creation still produces.

Remove the old-cleanup-only test states. Preserve current interrupted-cleanup coverage using the retained inode.

This changes an internal recovery exception, not the committed history format or Git receipt format.

**If verification is wrong**

Recovery reports a conflict for an interrupted installation whose backup was lost. It leaves the installed history and receipt in place rather than completing journal cleanup.

## Areas inspected with nothing to remove

### `ramify-audit.json` versions and key aliases

`subs/project/src/project-definition.ts:49–76` reads one unversioned configuration shape. There is no configuration-version switch.

`fullAuditPaths` and `enclosingProject` are **rejected**, not aliased, by `subs/project/src/undetected-config-files.ts:24–41`. The configuration reader also rejects unknown keys. History shows their removal in `c660aad` and the stricter undetected-file rules in `5771d00`.

The optional flakiness settings, workspace settings and empty-list defaults remain current configuration choices. They are not evidence of an obsolete producer.

### Published evidence, notes and receipts

- `subs/evidence/src/evidence.ts:83–94,165–172` reads and writes only evidence schema 6. Schema detection for older records supplies rejection diagnostics; it does not convert them.
- Notes and exact-tree refs remain current publication outputs. Both report-ref and report-object headers are still written by `subs/evidence/src/evidence-construction.ts:40–41`. Their presence checks alone do not establish a removable historical format.
- `subs/evidence/subs/flakiness/src/receipt.ts:24–50` creates and reads only receipt version 1. Its parent verification checks the report objects it anchors.
- History, update intent and observation-artifact readers likewise validate one current version. Normal replay and crash recovery remain current behavior.
- Promoted evidence still has a current public producer, `publishPromotedAudit`, in `subs/evidence/src/promoted-evidence.ts`. It is not merely a reader for retired output.

### Check kinds and classification

`subs/checks/src/interfaces/checks-configuration.ts:3–52` retains current scope, category, executor and parser choices. Command and registered executors both have current producers.

Parser inference in `subs/evidence/src/test-runners.ts:11–21` remains an authored command convention, not an old-name mapping. It is still exercised by current test inputs and documented as current behavior.

The Cucumber `CUCUMBER_SUMMARY_FILE` path has a current formatter producer in `subs/checks/subs/cucumber/src/tests/fixtures/cucumber-projects/modules/summary-formatter.mjs:15–17` and explicit integration coverage in `cucumber-runner.test.ts:241`. Its display-only role was deliberately retained when message-based ledgers arrived in `cdb3ae6`. It was not established as dead compatibility code.

### Optional runner fields

`sharedSetupFiles` is not removable merely because its type mentions older discovery documents. The current producer still omits it when setup roles are unknown: `subs/checks/subs/vitest/src/vitest-reporter.ts:289–312`. Selection’s presence checks protect current uncertainty.

Older Cucumber plugin handling and Vitest discovery-version checks cover runners installed in audited projects. They are genuine runtime variation.

### CLI flags

`src/cli-support.ts:169–187,507–524` implements the current commands and flags. `--request` is unknown; there is no adapter command or old request-file reader. `--full`, `--force`, `--nested` and `--project-root` have current execution paths. Help spellings are current CLI conveniences.

### Workspace preparation

The “legacy” `build` and linking options remain current producers, not dead readers. `createNodejsWorkspaceAdapter().getPreparation()` still emits `linkNodeModules` and `build` at `subs/execution/src/workspace-adapters.ts:105–118`. The committed configuration reader also produces default nodejs preparation with empty options. History in `c56abf4` confirms that setup commands supplemented these behaviors rather than replacing their producers.

### `scripts/`

All five scripts were inspected:

- `packed-install-smoke.mjs`: current package and CLI witnesses.
- `record-ramify-affected.mjs`: current `/4` answer assertions and explicit registry/tarball acquisition paths.
- `release-delta.mjs`: current version-only and ignored-path policy.
- `release.mjs`: current release validation and provenance.
- `relocate-build.mjs`: current emitted-tree relocation, not a second source-layout reader.

No migration shim or retired-operation wrapper was found. The relocation script preserves the published root paths and installed worker resolution; it is part of the current package layout.
