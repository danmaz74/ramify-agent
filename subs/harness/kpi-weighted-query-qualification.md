# sc-002/sc-003/sc-004: public metrics arithmetic and availability

Engineer evidence only; the gate owns candidate commitment/default audit and the architect owns semantic acceptance. The assignment supplies accepted boundary `85e8e8f1056f97350907a53e9dc7f043f7fd82f2`; no Git inspection or independent ancestry/starting-cleanliness claim was made. Earlier collection and mixed-attribution qualification documents, including failed receipts, i04's partial and cf-0001's corrected facts, remain unchanged.

## Composition and independent facts

`src/tests/helpers/kpi-weighted-queries.ts` constructs schema-validated harness records and small files, supplies them through `createQuerySource`, and calls the real public `RunQueries.metrics`. `src/tests/kpi-weighted-queries.test.ts` and the frozen bindings in `src/tests/steps/kpi-weighted-queries.ts` share those factual fixtures and assertions. There is no private projector, child test/helper import, fake KPI calculator, runtime requester-page read, production API change, durable version change, configuration/discovery change or process exemption.

Only external Git acquisition is scripted: **FakeWeightedHistory** implements ChangeHistory and **FakeWeightedCandidates** implements CandidateSource. Commits, direct ranges, origins, whole trees and blobs are explicit. Unexpected ranges/paths/revisions throw; removals and unrelated candidate operations are not scripted. Required history calls are asserted, including the public composition's two successful history traversals and the single failed traversal.

BASE=b repeated40, first writer commit=1 repeated40 and accepted FINAL=2 repeated40. Every tree includes three unchanged baseline source files of exactly 1000, 3000 and 6000 UTF-8 bytes (10000 total), under p/a, p/b and p. The frozen measurement document records those exact/subtree sizes. Complete writer scopes are 1000/3000 bytes with measured zero view/support components. Document and snapshot hashes derive from serialized bytes. Writer1 creates only `subs/a/src/new.ts` at first; writer2 creates only `subs/b/src/new.ts` at FINAL. The files have precisely 10/30 LF-terminated lines (10/3 in missing mode); each line survives at its original position and introducing commit. There are no setup events, deletes, rewrites or other changed paths. Independent assertions compare the complete before/after changed-path lists, literal line counts, source survival/introduction and recorded line-event additions. Invocation bases, writer records, gate commits and accepted final history agree. Fixed start/end/observation times match their constructed ledger event times; candidate entries use Git path order. Known-zero mode has no added files: BASE and FINAL trees are identical, and recorded invocation line summaries are complete empty lists, not missing observations. These are deliberately simple factual checks, not a test-side attribution/diff algorithm.

- sc-002 independently requires `(1000*10 + 3000*30)/(10+30) = 100000/40 = 2500`, baseline10000, ratio0.25 and reduction4. Assertions retain the actual unit `bytes (change-weighted mean)`, kpi/1, scope-size/2, lineage/2, exact ordered writer evidence, ordered invocation line summaries and complete two-writer coverage.
- sc-003 deliberately withholds writer2's source-size observation, not its delivery or its baseline module. Its exact reason is `writer source size was not captured`; the owned-source component is unknown/null, not nonexistent or measured zero. The complete weighted value/numerator remain null/unavailable. Known subtotal is10000, known denominator10, coverage1/2; total attributed weight13 includes unknown-size weight3. The public invocation evaluation's declared scope is also checked equal to the recorded unknown/null scope. Exact evidence retains the missing-source qualification and the *known* zero component subtotal without treating the unknown source as zero or dividing10000 by13.
- sc-004 retains both complete invocation scope costs and complete usage/rate/charge observations despite known-zero delivery. All three delivered-weight scope metrics are not-applicable/null. Session-weighted-total is separately measured0.4 baselines (4000/10000), not dollars. Each invocation has recorded usage100 input/1000 cache-read/50 cache-write/10 output, fixed recorded rates1 USD per million in each category, charge components0.0001/0.001/0.00005/0.00001 USD, complete charge coverage[], and available chargeTotal/chargeSubtotal0.00116 USD. Public invocation evaluations preserve the exact recorded charge source/revision/categories/rates/units; no pricing lookup or new dollar aggregate is introduced. A separate source fails external history with `external weighted history read failed`: attribution is unavailable/null with that actual reason while scope session costs and recorded charges remain available unchanged.

The first draft's session-cost assertions alone did not exhaust sc-004's monetary-cost premise. Architect consultation clarified this distinction; complete recorded charge observations and public evaluation assertions were added before the final receipts below. No formula, frozen step or production oracle was changed.

## Access and binding discovery

Inspected current ordinary/testing requester pages at supplied revision `rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:66`, including RunQueries/RunSource, CommittedRun/CommittedLine and CandidateSource/ChangeHistory/LineRange and named companions. RunQueries' page is truncated; type/self checks validate actual typed usage, not complete view coverage. Supplied ordinary coverage retains one analysis limit and testing coverage28; absence is not proof of unavailable APIs. Generated views are not runtime dependencies.

Read effective root cucumber.json and the exact prepared i06 configuration before adding steps; searched globally loaded support expressions (the root and deeper glob locations have no matching directories). Existing bindings do not match these steps. Singular/plural weighted-query wording shares one regex; the `one writer`/`a writer` wording likewise shares one definition. Prepared execution confirms no ambiguous binding. Existing sc-001/sc-005/sc-007 helper and step files are unchanged and pass; corrected sc-005 semantics remain intact.

## Exact focused receipts

Commands ran from `/workspaces/worktrees/kpi-extraction-continuation-20261014`. Receipts are under `plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0038/shell/`.

`013.log` (also earlier `011.log` before final assertion strengthening), exit0:

```
npm run test:quick -- subs/harness/src/tests/kpi-weighted-queries.test.ts subs/harness/src/tests/kpi-mixed-attribution.test.ts subs/harness/src/tests/kpi-run-collection.test.ts subs/harness/src/tests/kpi-scope-collection.test.ts
npm run type-check
npm run check:self
```

Quick: **4 files / 7 tests passed**, no skips. Type-check: all four configured projects passed. Self: execution completed, check passed, **partial coverage**; 15 owners, 955 source files, 96 resources, 18538 accesses; **0 errors, 0 warnings, 457 analysis limits, 0 denied**. Edit-time deadline-exceeded checks verified nothing and are not counted as passes.

`014.log` (also earlier `012.log`), exact supplied prepared command:

```
node_modules/.bin/cucumber-js --config subs/harness/src/tmp/ramify-focused/wi-001.i06/cucumber-focused-70135bd2c8f341fc.json --profile ramify-focused
```

Config SHA-256 `70135bd2c8f341fc02ec9fd12ac7af9b722181fd154d73ae1aa67cbde06c88e0`. **Exit1; 9 scenarios: 6 passed (sc-001/sc-002/sc-003/sc-004/sc-005/sc-007), 3 undefined (sc-006/sc-008/sc-009); 128 steps: 109 passed, 19 undefined.** No failed, ambiguous, skipped or pending-result cases reported. The three deferred scenarios remain pending in the catalog with undefined executable steps; they are not bound or completed here. This is not an entire-feature pass.

Earlier development receipts are retained: `006.log` exit1 (wrong draft unit spelling and camelCase usage metric IDs), `008.log` exit1 (draft expected one history traversal and nonexistent usage total metric; chained type-check not run), `009.log` exit1 (draft missing-evidence text/traversal assertions and nullable-lines TypeScript error), `010.log` exit0 (3 tests and type-check, preceding final missing-reason/consistency strengthening). Repairs preserve actual baseline units/IDs/evidence and nullability; no provider change was needed.

Native witnesses were **not rerun**: this change adds only public-query qualification over explicit external facts; it changes no native adapter, origin/removal rule, setup authentication, registered witness file or native claim. Earlier cf-0001 receipts for the exact attribution and evidence Git witnesses remain historical, not fresh evidence here. No direct whole suite or substitute audit was run. Committed default audit remains gate-owned.
