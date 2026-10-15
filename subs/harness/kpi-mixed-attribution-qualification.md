# sc-005: exact setup verifier → delivered-change integration

This is engineer qualification, not a committed-audit verdict. The assignment supplies accepted collection boundary `2730c7e9816c98f131b056f59efd88b320a9bbc1`; no Git command or independent ancestry verification was performed. Existing collection qualification history, including its failed original audit and subsequent repair, remains unchanged in kpi-collection-qualification.md.

## Correction and retained partial result

wi-001.i02 / inv-0022 returned partial without edits or tests. Its blanket RunQueries/SessionQueries approach could not supply generic mixed-source-path setup evidence: the inspected query composition acquires scratch-only .gitignore setup records. That finding is retained, not reinterpreted as a provider failure or an accepted scenario. The corrected assignment explicitly withdraws that constraint for sc-005 alone. No scratch events or unsupported query input were fabricated. The six other pending query cases remain deferred.

## Consumer and oracle

`src/tests/helpers/kpi-mixed-attribution.ts` calls the real received `verifySetupLineIdentities` and passes its actual returned `HarnessLineIdentities` to the real received `deliveredChange`. The ordinary test and exact frozen Cucumber steps invoke this same fixture. Only external Git answers are scripted by **FakeMixedChangeHistory**, implementing received ChangeHistory; exact cwd, BASE/accepted-FINAL, path/range arguments and required once-only calls are asserted. There is no calculator substitution, private import, child-test import, runtime generated-page read, production change, configuration change or process exemption.

The mixed source commit contains both setup and writer additions/deletions. Literal assertions require FINAL setup addition5 and BASE setup deletion2, setup weight2 and writer-mixed weight2 (one addition and one deletion), not a whole-path/commit exclusion. The independent overlap path contributes weight2 only to the exact uncertain-overlap reason. An intermediate writer-reverted commit remains in history but contributes no final diff weight. A second factual mapping proves complete setup reversion: verified []/[], setup0, writer2, overlap2. Unknown source-added mapping instead yields null/[2], setup1, writer1 and unavailable-setup weight2 with its exact reason, plus unchanged overlap2. Missing partition and invalid candidate identities still throw. SHA-256 values derive from explicit line/blob bytes; mapping evidence names source and BASE/FINAL positions separately.

Engineer interface inspection used the supplied testing API view revision `rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:45`, retaining 28 testing analysis limits (ordinary view has one). Selected setup/delivered and evidence Git pages provide the imported symbols and named companions. This is not an exhaustive availability claim. Generated views are not execution prerequisites.

Effective cucumber.json, prepared configuration and globally loaded support expression discovery were inspected before adding bindings. The prepared execution confirms no ambiguity. Existing sc-001/sc-007 step/helper files were not changed.

## Exact focused receipts

All commands ran from `/workspaces/worktrees/kpi-extraction-continuation-20261014`. Logs below are under `plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0025/shell/`.

`011.log` (also earlier `007.log`), exit0, **5 files / 57 passed**, no skips:

```
npm run test:quick -- subs/harness/src/tests/kpi-mixed-attribution.test.ts subs/harness/src/tests/kpi-run-collection.test.ts subs/harness/src/tests/kpi-scope-collection.test.ts subs/harness/subs/kpi/src/tests/delivered-change.test.ts subs/harness/subs/kpi/src/tests/setup-attribution.test.ts
```

Unchanged exact registered native witnesses:

- `008.log`: `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`: **1 file / 7 passed**, exit0. Covers actual Git setup authentication, reverts, shifted identities, arbitrary deletions and trial CLI cwd.
- `011.log`: `npm run test:boundaries -- subs/harness/subs/evidence/src/tests/git.test.ts`: **1 file / 11 passed**, exit0; includes direct-diff origins and deletion attribution.

`008.log` then ran `npm run type-check`, which initially failed TS2339 because node:assert had already narrowed state, making the subsequent error branch never. Removed the redundant equality assertion, retaining the explicit refusal of every non-measured result. Its chained check:self did not run. This original exit1 is retained, not called a provider defect.

`009.log`: `npm run type-check && npm run check:self`, exit0. All four configured TypeScript projects passed. Self check completed/passed with **partial coverage**, 15 owners, 952 source files, 96 resources, 18495 accesses; **0 errors, 0 warnings, 457 analysis limits, 0 denied**. An edit-time hook timed out and verified nothing; that hook is not counted as a pass.

`010.log`: exact prepared command:

```
node_modules/.bin/cucumber-js --config subs/harness/src/tmp/ramify-focused/wi-001.i03/cucumber-focused-70135bd2c8f341fc.json --profile ramify-focused
```

Config SHA-256 `70135bd2c8f341fc02ec9fd12ac7af9b722181fd154d73ae1aa67cbde06c88e0`. **Exit1; 9 scenarios: 3 passed (sc-001, sc-005, sc-007), 6 undefined (sc-002, sc-003, sc-004, sc-006, sc-008, sc-009); 119 steps: 81 passed, 38 undefined.** No failed, ambiguous, pending-result or skipped cases were reported. Undefined cases remain pending in the catalog, not newly bound or complete. The nonzero command is not represented as an entire-feature pass.

No direct whole suite or audit was run. Gate-owned commitment and configured audit remain required; focused evidence establishes neither final plan completion nor complete static-analysis coverage.

## cf-0001 correction and independent requalification (wi-001.i05)

The earlier factual qualification above was incorrect: a three-line BASE/mixed blob did not support FINAL positions5/6 without additional prefix changes. The earlier passing scripts and gate did not prove factual consistency. The architect withdrew the sc-005 done judgment to bound and explicitly superseded the preservation instruction. The earlier receipts remain historical execution receipts, not successful factual qualification. i04's no-edit/no-test partial and its deferred arithmetic assignment remain partial/deferred; neither that partial nor earlier failures (including the initial type-check failure above and collection audit history) are relabeled by this repair. The supplied accepted starting boundary is `54e922438dc930b7ebc1882eb21fbfc72b29809b`; no Git command or independent starting-tree/ancestry observation was made here.

### Corrected literal facts and exhaustive accounting

The helper now defines complete tiny trees for all four revisions (BASE=b repeated40, mixed=1 repeated40, intermediate=2 repeated40, accepted FINAL=3 repeated40), with three paths in every tree:

| Path | BASE | mixed | intermediate | FINAL |
| --- | --- | --- | --- | --- |
| src/mixed.ts | `keep\nsetup-old\nwriter-old\n` | `keep\nsetup-new\nwriter-new\n` | same as mixed | same as mixed (alternate reverted mode: `keep\nsetup-old\nwriter-new\n`) |
| src/overlap.ts | empty blob | `overlap-one\noverlap-two\n` | same as mixed | same as mixed |
| src/reverted.ts | `original\n` | same as BASE | `temporary-writer-edit\n` | same as BASE |

Here `\n` denotes an actual LF byte. There is **no prefix insertion or line shift**. Complete surviving mixed ranges are added[2,2]/deleted[2,2]; alternate setup-reverted ranges are added[3,1]/deleted[3,1]. Overlap has added[1,2]/no deletions. The reverted writer path and unchanged keep line are absent from the direct diff because their BASE/FINAL bytes are identical. No other path or line exists to be omitted.

Before either algorithm, `assertMixedEvidence` scans every literal line on both sides and compares expanded complete direct ranges and the exact changed-path list, including empty and fully reverted paths. This intentionally uses positional replacements only, not a generic diff framework. It checks exact LF reconstruction, whole-blob and per-line SHA-256 values, source record positions and revision bindings, complete mapping facts, origin/source positions, BASE last-seen and mixed removing commits. All surviving additions are present at their identical source positions in mixed and intermediate; each deleted BASE byte is replaced at mixed. Overlap's two lines likewise first appear at mixed and survive. Alternate FINAL restores setup-old and removes setup-new, proving both setup partitions empty, not unknown. Unknown mode uses the same literal trees but deliberately withholds source-added authentication (`null`). The ordinary negative oracle case rejects the old position5, incorrect bytes/blob hashes, false origin commit/position, false removing commit and a truncated direct range without invoking either KPI provider.

Only setup position2 is authenticated on each side. Consequently the six surviving line units in normal mode are setup2 + writer-mixed2 (writer-new addition3, writer-old deletion3) + overlap-unattributed2. The intermediate writer-reverted has zero units. Alternate setup reversion leaves four units: setup0 + writer-mixed2 + overlap2. Unknown source additions leave six units: setup1 (verified deletion2) + writer1 (deletion3) + unavailable-setup additions2 + overlap2. The exact existing unavailable/overlap reasons are retained. Numeric weights therefore remain unchanged, while the invalid FINAL position5 expectation is explicitly superseded by position2. This is exact per-line exclusion, never a whole-path/commit waiver. The real verifier's actual result is still passed directly to real deliveredChange, with only external history scripted by **FakeMixedChangeHistory**. Invalid candidate/missing partition errors remain asserted.

### Refreshed access, discovery and receipts

Inspected the selected setup/delivered/evidence Git pages in the supplied testing view revision `rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:58`: verifySetupLineIdentities, SetupLineIdentityInput, deliveredChange, DeliveredChange, HarnessLineIdentities, ChangeHistory, ChangedFile, GitLineRange and their named companions. Testing coverage retains 28 analysis limits, ordinary coverage one; no exhaustive availability claim. No foreign private source or calculator fake was used. Effective cucumber.json and the current prepared profile were read, and the existing globally loaded mixed step expressions inspected; no new competing step binding or World state was introduced. Existing step definitions remain unchanged and now invoke the corrected pre-algorithm assertions through their shared helper.

All commands ran from the project root. New logs are under `plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0033/shell/`:

- `004.log`: exact focused quick selection shown above (mixed, run collection, scope collection, delivered-change, setup-attribution): **exit0, 5 files / 58 tests passed**, no skips; includes the new independent rejection oracle.
- `005.log`: `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts subs/harness/subs/evidence/src/tests/git.test.ts`: **2 files / 18 tests passed** (7 attribution CLI/native, 11 Git). Registrations unchanged. Followed by `npm run type-check` (all four configured projects passed) and `npm run check:self`; chain **exit0**. Self: completed/passed, **partial coverage**, 15 owners, 952 source files, 96 resources, 18498 accesses; **0 errors, 0 warnings, 457 analysis limits, 0 denied**. Earlier edit hook deadline-exceeded verified nothing and is not a pass.
- `006.log`: exact prepared `node_modules/.bin/cucumber-js --config subs/harness/src/tmp/ramify-focused/wi-001.i05/cucumber-focused-70135bd2c8f341fc.json --profile ramify-focused`, config SHA-256 `70135bd2c8f341fc02ec9fd12ac7af9b722181fd154d73ae1aa67cbde06c88e0`: **exit1, 9 scenarios: 3 passed (sc-001/sc-005/sc-007), 6 undefined (sc-002/sc-003/sc-004/sc-006/sc-008/sc-009); 119 steps: 81 passed, 38 undefined**. No failed/ambiguous/skipped cases. All six mixed steps pass, including independent literal checks and real verifier-to-delivered integration. The six unassigned query scenarios remain deferred, not implemented, bound or accepted here. This is not an entire-feature pass.

No production algorithm/contract, durable format, native registration, process guard, configuration, feature text or discovery change. No direct whole suite or audit run. These are focused current engineer receipts; the gate owns committed audit and the architect owns semantic judgment/closure of cf-0001. Broader work-item completion remains unclaimed.
