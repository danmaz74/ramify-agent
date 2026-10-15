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
