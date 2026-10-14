# Final retirement case map

The legacy harness `src/kpi/` directory is absent. This directory is documentation
only: no calculators, fixtures, runtime comparisons or child-to-itself equalities.
[Historical receipt](history.md) describes the earlier partial repair, including
its failures, interrupted/limited checks and then-unfinished work; it is not the
current inventory or acceptance evidence.

## Mapping convention and comparison

`K/<file>` below means `subs/harness/subs/kpi/src/tests/<file>.test.ts`.
`H/<file>` means `subs/harness/src/tests/<file>.test.ts`. Same-title means the
original test title in the named surviving file, not a broad suite-level claim.
The five former coordinator suites were inspected against the child originals:
all 45 test bodies match after import/wrapper removal (3 efficiency, 7 exploration,
3 guarding, 13 lineage, 19 metrics). The only removed assertions are transitional
real-parent/real-child equalities in wrappers/computed helpers. Independent literal,
schema, error, state, reason and ordering assertions remain in child originals.
Fixtures remain child-local; they are not imported from another owner's tests.

## Metrics: exact ordered case map

All 19 former `measurement-parity/metrics` cases map in order to the same-title
`K/metrics` cases. The 18 former `H/kpi-metrics` cases map to cases 1–18 of that
same file (formatting/comments differ, not the expected facts). Every computed
metric still passes `metricSchema.parse`.

| Case / original distinguishing identity | Independent surviving evidence in K/metrics |
| --- | --- |
| 1 measured sum(w_e*S_e)/sum(w_e), over B and inverse | 1000*10 + 3000*30 = numerator100000; denominator40; value2500; B10000; ratio.25; inverse4; policies/evidence |
| 2 missing size component | subtotal10000; denominator10; covered1/total2; inv-0003 weight3 and owned-source unknown reason; complete value null |
| 3 sum(w_e)=0 | not-applicable; numerator0/denominator0; ratio not-applicable, not unavailable |
| 4 no named writer | partial numerator10000/weight10; 50 of60 unattributed; inv-0003 delivered zero evidence |
| 5 replaced/shared delivered shares | 4,4.5,1.5 weights at1000,3000,5000; numerator25000/10; 4.50 evidence |
| 6 no accepted commit versus failed Git | not-applicable versus unavailable, original Git failure reason |
| 7 incompatible size policy | unavailable, incompatible scope-size/1 reason retained |
| 8 unavailable baseline | ratios unavailable with baseline reason |
| 9 separate usage categories | recorded input/cache/output; missing usage unavailable; no price/cost metric |
| 10 every session/continued max | continued component maxima, session count and coverage retained |
| 11 blocked writes | measured .5 =1/2; engineer blocked-scope evidence; unguarded statement makes partial |
| 12 unreadable observations | explicit observations.jsonl reason; absent initial-architect compactions not-applicable |
| 13 transcript incomplete is raw output | observation coverage2/3, only inv-0003 usage gap; no transcript-incomplete metric |
| 14 no writer session | change ratios not-applicable, empty gate/accepted inputs |
| 15 corresponding components | project50/120; total90/200; weights3,1 at90,50 => mean80, numerator320/4 |
| 16 partial writer plus overlap | attributed4, complete3, unknown1, unattributed2; partial subtotal350; project subtotal200; old KPI denominator3 |
| 17 missingB/zeroB/zero delivery/policy/snapshot | distinct states and reasons, frozen snapshot identity retained |
| 18 partial zero versus absent | captured subtotal0, absent subtotal null, both unavailable; denominator null |
| 19 degraded fresh continuation | one harness session, two scope histories; numerator4000; value.4; fresh-two evidence |

## Exploration, timing and guarding

Former `measurement-parity/exploration` cases 1–7 map to same-title `K/exploration`
cases 1–7. Former `H/plan23-exploration-metrics` pure cases 1–7 map there too;
timing/charge cases map to `K/efficiency` cases1–2. The parent retains both
`declaredRoots` tests with their original assertions (shop/orders, global view,
named location; empty declaration/view/unplaceable owner).

| Original distinguishing case | Independent surviving assertion |
| --- | --- |
| known calls | K/exploration: reads3/unique2/repeated1/bytes22/searches2/broad1/outside1/time17; one zero-match; r3 duration unknown; no scannedBytes |
| replay/inheritance | same source counted once: reads1/bytes10/time5; changed op/invocation/turn/kind yields reads4/search1/bytes50 |
| unknown/failed/truncated | bytes10 known; explicit unknown bytes/files/duration/breadth and observation-log-truncated; unknown matches not zero |
| conflicting replay/timestamps | conflicting bytes11 excluded => reads0/bytes0; explicit timestamps yield10ms |
| outside scope unknown | known1, partial covered2/total4; broad measured0 with4/4 |
| all unknown versus no searches | unavailable covered0/1 versus not-applicable0/0 |
| failed versus zero/unknown matches | completed3/failed1; zeroMatch1, partial2/3 |
| timing parallel tools | K/efficiency: wall10/tool20/milestone4; no end gives null; fixture subtotal17 but complete time null; milestone beyond end null |
| recorded charges | new100/cache50/write0/output10 at2/.2/0/8 per million => .0002/.00001/0/.00008, total.00029; missing cache usage or output rate gives null total |
| conflicting durations | K/efficiency case3: wall10/model0/check0/tool null; exact three coverage reasons, including excluded source identity |
| unguarded shell report | K/guarding case1: same edit/shell/mutation/excursion/gap fixture, exact integration statement and completeness |
| sorted verdicts/attribution/repeated gap | K/guarding case2: schema-valid observations, sorted unique tools, original verdict and gap counts |
| snapshot/shell gap | K/guarding case3: unattributed mutation remains incomplete; empty observations retain original report |

All three former coordinator efficiency and guarding cases map to the same-title
child cases above. `H/unguarded-write` is retained intact, now calling the selected
child `guardingReport`, alongside real execution/guard/durable assertions.

## Lineage

All 13 former `measurement-parity/lineage` bodies map in order and by exact title
to `K/lineage`; its computed helper still parses every `lineageMetricSchema`.
The complete ordered inv-0001…inv-0011 fixture remains: global contexts24000/26000,
local8000→11000, degraded fresh7000, engineer10000→15000 repair, replacement12000,
global fresh18000 and degraded fork9000; recorded usage categories are unchanged.

| Original case (ordered) | Surviving independent qualification |
| --- | --- |
| 1 fork inherited context/cost by generation | generation1 versus fresh global forks, recorded categories |
| 2 continuation growth | current minus previous start; degraded excluded |
| 3 repair cost | repair segments separate from fresh engineer entries |
| 4 degraded requested relation | exact executor reasons: session file gone / executor cannot fork |
| 5 separate fallback invocations | requested relation retained without invented fork |
| 6 replacements and generations | reconstructed/context-rebuilt reasons; forks served per generation |
| 7 glossary order | exact metric ID order and lineage/2 schema |
| 8 local fork | local group, not global generation |
| 9 missing fork context | known subtotal, coverage and each missing-input reason |
| 10 missing previous context | growth unavailable, not zero |
| 11 unknown actual start | partial degraded rate and forks served |
| 12 empty groups/generation2 | not-applicable, no invented rebuild |
| 13 unended/unknown requested | unended excluded; wholly unknown unavailable |

## Delivered changes and setup qualification

Former `H/delivered-change` cases map to same-title `K/delivered-change` assertions
except the overlapping-line-snapshot case, relocated verbatim to `K/lines`.
There are 15 surviving same-title attribution/cache cases plus this relocated case.

| Original case identity | Independent surviving fixture/value/reason |
| --- | --- |
| later rewrite/deleted base | final origins and last-seen base positions => inv-0007:2, inv-0009:3 |
| harness/path/binary | harness commit and feature path excluded, binary has no line weight |
| shared per-path increases | exact recorded fractional split, unmapped lines remain unattributed |
| shared unreadable/no writer | original unavailable line-event and absent writer reasons |
| no accepted/failed Git | not-applicable versus unavailable with original error |
| kept history | one Git answer per question, failures not cached |
| exact commit/path setup | .gitignore setup2 excluded; later same-path writer inv-0007:2/inv-0009:1 |
| unknown overlap | unrelated writer three:2 survives, overlap2 unattributed with reason |
| complete shell snapshots | shared4 => one3/two1; missing snapshot => all4 unattributed |
| overlapping snapshots | K/lines: a.ts added3/deleted0 retained, coverage partial, overlapping-writers gap |
| rename/reverted | final diff empty line weights, no harness or unattributed lines |
| mixed same-commit/path | only recorded revision-bound setup identities excluded; stale identities refuse exemption |
| reverted setup | verified empty positions exempt nothing; agent lines retained |
| deleted setup | BASE positions and removing commit exclude2, writer retains1 |
| unknown mapping | no path-wide exemption, weight2 unattributed |
| single uncertain writer | known path2 survives/overlap3 unknown; global overlap gap makes all5 unknown |

The child's additional bounded-cache case remains (reads2→4→7; FIFO hits do not
refresh; roots, paths and ranges separate). Every pure setup identity fixture and
assertion from `H/plan23-trial-attribution` survives in `K/setup-attribution`: the
entire pure section is byte-identical after imports, comments and blank lines
are normalized. Operator review retired that remaining duplicate section;
`H/plan23-trial-attribution` retains the distinct execution cwd assertion. Native
trial registration/file, root collector/script and external report destination
tests remain unchanged; no verifier fake is introduced.

## Scope adapter and private API retirement

`H/scope-size-recipe` now asserts actual adapter results against literals, never
against another alias of the child. Repeated brief hash cases [5,6]→6, [6,5]→5,
[5,5]→5 retain exact scope/supplementary/total expectations. Both orders of source
hash and byte conflicts retain Error name and exact message
`Conflicting delivered support revisions for same`. Child same-title/purpose cases
independently assert these rules on factual entries.

The removed pure 100/20/30/50 versus40/10/15/20/5 body maps to same-title
`K/scope-size-recipe`: project120/50 and total200/90. The private partial
project-only subtotal520 assertion maps to its same-title child partial-support
case (total725; policy mismatch0; revision mismatch200; unselected components0).
The other eight removed pure scope bodies map by same title to
`K/scope-size-recipe` (no adapter was exercised in those bodies):

| Original case | Independent child assertion |
| --- | --- |
| B support once/architect separate | architect5000, support950, total1100+200+30+25+5000+950, scope-size/2 |
| own role support/brief | documents550 + brief700 =1250; exact three-distinct-documents detail |
| uncaptured support | nowhere.md unavailable, bytes null, explicit reason |
| outside inventory/absent | package.json90 + owned510 =600; absent new.ts adds nothing; both exact detail strings |
| revision mismatch | rev/1:g:1 versus rev/1:g:2 reason on three state-bound components; support950 survives, partial subtotal950 |
| unselected architect at mismatch | architect measured0, selected owned-source unavailable |
| partial support/bootstrap | total725/project520; revision mismatch200; no-selected API/architect/owned0; policy mismatch subtotal0 |
| unselected support owner | unselected b.ts adds350 to510 =>860; selected p/b counts only710 |

Parent adapter/collection tests retain acquired locations including ENOTDIR,
scope translations, support/brief dedup, nested/bootstrapped owners and read scope.
The four invocation qualification child cases and corresponding steps-run tests
are unchanged: absent snapshot exactly two components; unknown owned replacement;
failure retains declared subtotal/snapshot/reason; read-size before acquisition.

No native file/registration, process rule, runner configuration, opt-in skip,
protocol, algorithm, score or durable version changed. Final whole-run acceptance,
root results.md and captured feature/ledger updates belong to the operator.
