# History: temporary coordinator baseline parity — i13 receipt

This is the retained historical receipt, not instructions for current source.
The runtime comparators it describes have since retired; README.md records the
current independent case mapping. Failures and limitations below remain history.

These are transition-only comparisons, not provider APIs or a second owner of
measurement behavior. Retain until case-mapped parent baseline retirement is
assigned and equivalent literal/schema/error evidence is preserved. Do not
retire parent bodies in this repair. The child owns its original behavior tests;
the harness coordinates independent real parent/real child comparisons.

## Exact child-to-coordinator map

For each basename below, the child file is
`subs/harness/subs/kpi/src/tests/<basename>.test.ts` and its coordinator companion
is `subs/harness/src/tests/measurement-parity/<basename>.test.ts`.
Every describe/test identity and body maps one-to-one, in order, with identical
inputs, literals and assertions. No child private fixtures/tests are imported.
`exploration-fixtures.ts` and `metric-fixtures.ts` are local copies: exact values
and bytes apart from defining imports. Shell/008 verified all seven copies
against the pre-repair child files, changing only import paths. Shell/016 verified
all child/coordinator describe/test bodies byte-identical after repair.

| Basename | Child cases passed | Coordinator cases passed | Genuine compared calls |
| --- | ---: | ---: | --- |
| efficiency | 3 | 3 | 5 invocationTiming calls: parallel 10ms tools/wall/milestone, missing end, partial fixture duration, milestone beyond end, conflicting source duration |
| exploration | 7 | 7 | 11 explorationDetails calls (6 direct, 5 via explorationMetrics): fixture totals, replay/inheritance dedup, new source identities, missing bytes/files/breadth/duration/failed call plus collection limit, unknown matches, conflicting replay, timestamp duration, partial outside-scope status, unavailable status, no-search, failed versus zero/unknown matches |
| guarding | 3 | 3 | 4 guardingReport calls: unguarded shell/excursion/gap, sorted verdicts/attribution/repeated gap, unattributed snapshot/shell gap, empty observations |
| lineage | 13 | 13 | 13 lineageMetrics calls through computed: all 8 ST13 recorded-fact cases and 5 missing-evidence cases, including generations, local fork, continuation/repair, fresh fallback, degraded/unknown starts, replacements, unended segments and exact ordering/schema |
| metrics | 19 | 19 | 21 kpiMetrics calls through computed; 9 comparableScopeMetrics calls, covering all 14 M4 cases, 3 F6 component cases and both standalone partial-zero/degraded-history cases |

Metrics comparisons retain 2500/100000/40, missing-writer subtotal, zero delivery
versus failed Git, unmapped/shared/replaced weights, incompatible policy,
unavailable baseline/usage, session counts, guarding/observation gaps, component
ratios, partial overlaps, missing/zero B and snapshot identity qualifications.
Each wrapper compares the real baseline defined under harness `src/kpi/` with
the selected production contract defined under child `src/`. No alias to the
child is used as a baseline. The copied charge-only efficiency case (1 of 3)
retains literal tests but was never a parent comparison: no new charge parity
claim is made. Counts above are static call-site inventory, not test counts.
There was no separate budget test among the former wrappers; collection-limit
inputs and all original cases are retained, not supplemented by invented cases.

Child timing/exploration/guarding/comparable wrappers are now direct local calls;
metrics/lineage computed helpers keep schema parsing and shed only parent equality.
No algorithms, declarations, root script or projections implementation/tests were
written by this repair.

Remaining owner-local baseline test accesses to these five parent bodies are
`subs/harness/src/tests/kpi-metrics.test.ts` (metrics),
`plan23-exploration-metrics.test.ts` (exploration/timing/charge), and
`unguarded-write.test.ts` (guarding). These remain inventoried for later retirement.
The bounded TypeScript scan in shell/016 finds parent comparator access only in
these owner-local files and this coordinator directory, none in KPI child tests
or projections. Root testing scan in shell/017 finds no parent KPI imports.

## Commands and actual outcomes

All logs below are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0089/shell/`.
Commands run from project root; no whole suite/audit was run by this engineer.

Shell/009:

```sh
npm run type-check && npm run check:self
```

Both exit 0; all four configured TypeScript projects pass with no diagnostics.
Structural execution completed/passed with **partial coverage**: 15 owners,
959 sources, 92 resources, 18502 accesses; 13694 allowed, 0 denied,
4802 external; 0 errors, 0 warnings, 458 analysis limits. Earlier mutation hooks
reported deadline-exceeded/not-checked (not passes); the complete check supplies
current structural evidence, not retrospective success for those hooks.

Shell/010:

```sh
npm run test:quick -- subs/harness/subs/kpi/src/tests/efficiency.test.ts subs/harness/subs/kpi/src/tests/exploration.test.ts subs/harness/subs/kpi/src/tests/guarding.test.ts subs/harness/subs/kpi/src/tests/lineage.test.ts subs/harness/subs/kpi/src/tests/metrics.test.ts subs/harness/src/tests/measurement-parity/efficiency.test.ts subs/harness/src/tests/measurement-parity/exploration.test.ts subs/harness/src/tests/measurement-parity/guarding.test.ts subs/harness/src/tests/measurement-parity/lineage.test.ts subs/harness/src/tests/measurement-parity/metrics.test.ts
```

10 files/90 tests passed, zero failures/skips. Per-suite counts are above.

Shell/011 (required retained i12 selection):

```sh
npm run test:quick -- subs/harness/subs/projections/src/tests/kpi-metrics.test.ts subs/harness/subs/projections/src/tests/lineage-metrics.test.ts subs/harness/subs/projections/src/tests/efficiency-provenance.test.ts subs/harness/subs/projections/src/tests/plan23-observation-presentation.test.ts subs/harness/subs/projections/src/tests/plan23-setup-attribution.test.ts subs/harness/subs/projections/src/tests/session-reading.test.ts subs/harness/src/tests/run-protocol.test.ts subs/harness/src/tests/projections-pure.test.ts src/tests/plan23-trial-collector.test.ts
```

**Exit 1: 1 failed suite, 8 passed files; 68 passed tests, zero skipped.**
Per-file counts: projections kpi-metrics **0/no suite**; lineage-metrics 14;
efficiency-provenance 1; plan23-observation-presentation 9;
plan23-setup-attribution 4; session-reading 1; harness run-protocol 9;
projections-pure 3; root collector 27. Exact diagnostic:
`No test suite found in file .../subs/harness/subs/projections/src/tests/kpi-metrics.test.ts`.
The retained file contains only a JSON discovery array, not TypeScript tests.
This invocation did not write it. Its provenance is not established. The i12
reported 3 passing cases remain historical, not current. Advisory architect
confirmed projections-test repair needs recorded authority; do not omit this
file, weaken discovery or reconstruct lesser expectations. The chained native
command did not execute after quick failure; it was then executed separately.

Shell/012:

```sh
npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts
```

1 file/7 tests passed, zero failures/skips. Exact native case identities:

- public trial attribution CLI verifies the exact established scratch append from original Git objects
- public trial attribution CLI attributes missing EOF newline replacement as two setup additions and one deletion
- public trial attribution CLI preserves shifted setup identities and retains later same-file agent lines
- public trial attribution CLI proves reverted setup empty without exempting remaining agent lines
- public trial attribution CLI refuses mixed unknown binary dirty and symlink setup exemptions
- prepared trial tool uses actual assigned module src cwd and external report destination
- native Git authenticates renamed nested-project source positions and arbitrary setup-before deletions

The 27 root collector cases still execute the actual child verifier and relocated
`qualification/trial-report.ts` validator. Original ex01–ex04 semantics documented
in measurement-integration.md retain current root/native passes: exact identities,
unavailable corruption/coverage, same-file/revert distinctions and external versus
internal/symlink destination with unchanged target bytes. Root script retains its
actual two defining specifiers (child setup-attribution import, harness
qualification trial-report re-export). No KPI fake is used. Existing repeated and
reopened in-process/HTTP metrics/session equality and durable/event/process
assertions in projections-pure remain unchanged and passed.

Shell/013–014: separate materializations for root, projections and KPI:

```sh
node_modules/.bin/ramify materialize --from . --root .
node_modules/.bin/ramify materialize --from subs/harness/subs/projections --root .
node_modules/.bin/ramify materialize --from subs/harness/subs/kpi --root .
```

All six ordinary/testing areas share
`rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:35`.
Root ordinary/testing limits 39/77, truncations 2/2;
projections 39/69, truncations 4/4; KPI 39/78, truncations 4/4.
These are incomplete analyses, not proof of absent interfaces. Supplied revision
24 and historical revision 22 remain separately labelled evidence. Shell/019–020
inspect root verifier/validator and projections selected child original signature
pages separately for ordinary/testing areas; complete check establishes allowed
accesses within the stated limits. No parent exposure was restored.

Shell/015: authoritative configured discovery used `vitest list` with all 20 exact
file paths from shell/010, shell/011 and shell/012 as positional filters, followed
by `--filesOnly --json` (no JSON output filename). Exactly 19 node files and one
boundaries file discovered, including all five new coordinator files and all five
child originals. Discovery of kpi-metrics does **not** mean it defines tests; its
zero-suite failure above is retained. No configuration, registration, process
exemption, retry, skip or timeout changed.

## Unfinished / historical status

This is partial: restoring the retained projections kpi-metrics three-case query
suite requires a recorded narrow scope correction and original valid source;
then rerun the exact selection. Gate owns the committed default audit over the
entire composed candidate; it has not been requested for this failed selection.
Preserve historical i09/i11/i12 failed/limited checks and original audit receipts;
no focused pass erases them or proves a flake. Two previously skipped opt-in
fixture cases were not rerun and are not passing. Full scenarios, web-build,
other witnesses/default audit are unrun here and retain gate-owned status.
Still owed: meaningful composed weighted 2500/100000/40, missing-writer subtotal,
zero-versus-failed-history and complete cache/rates/search-conflict cases;
case-mapped parent-body/pure-test retirement and full selected feature evidence.
No scenario binding, capability completion, task handback or acceptance claim.
