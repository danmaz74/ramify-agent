# Projection ownership after extraction

The original runtime base is `5364524e11ce13fb91968521763fef62fc12791f`.
The restarted target baseline is `1c023ce1621bf9b3b79a334c2881b31c3934c6ca`:
it already includes the separately qualified Ramify 0.5.1 capacity pin and
partial repair-history preparation. The extraction and acceptance source
examined here is `f227116f16514dd3500b2f4ae1e716272af1845a`; subsequent
documentation commits do not change the TypeScript inventory. These are three
different revisions. The source move is assessed against the restarted target;
the original runtime identifies what the user initially asked to extract.

| Tracked TypeScript inventory | Original runtime | Restarted baseline | Extracted candidate |
| --- | ---: | ---: | ---: |
| Harness exact owner, `subs/harness/src/**/*.ts` | 614 | 616 | 609 |
| Harness subtree, `subs/harness/{src,subs}/**/*.ts` | 766 | 768 | 814 |
| Old parent production `src/projections/*.ts` | 23 | 23 | 0 |
| New child production `subs/projections/src/*.ts` | 0 | 0 | 23 |
| New child owned test TypeScript files | 0 | 0 | 30 |

The counts use `git ls-tree -r --name-only` on each exact revision, retaining
tracked `.ts` paths under the shown prefixes; the child tests include 25
`.test.ts` suites. The 23 child production files contain 6,000 lines. The
[baseline-to-child inventory](extraction-inventory.md) maps every old path to
its child path with source hashes. These counts establish ownership and test
placement, not reduced complexity by themselves. The parent still coordinates
the large harness; its exact-owner decrease is small because integration and
acceptance tests remain there while focused tests moved to the child.

Before extraction, the parent implemented run, session, progress, scenario,
metrics, execution-map, consultation and repair response projection under
`src/projections/`. It also served HTTP, commands, scheduling and durable
writes. Now [the child declaration](../module.ramify) exposes its `RunQueries`,
`SessionQueries`, `RunSource`, `currentModuleTree`, consultation reader and
named result/error companions through eight production exposure lines (plus
one historical testing-layout exposure). The child's private projectors,
decoders, caches and Node reading files are not exposed. Its ordinary module
header has no tags.

The real [HTTP adapter](../../../src/http/app.ts) imports the child provider and
constructs both query classes from the frozen, seven-key
[reading port](../../../src/http/query-source.ts). The
[consultation CLI](../../../src/consultations/command.ts) imports the child
consultation reader. The [repair export command](../../../src/run/repair-export-command.ts)
uses the parent's [shared history authenticator](../../../src/run/repair-history.ts)
before record-copy recovery or external effects; the child reader consumes the
same authenticator and translates its result. The exporter does not use a
response projector for admission. The old production directory is absent,
with no forwarding implementation in the parent.

The cost of this boundary is explicit reading contracts. Relative to the
original runtime, [the parent declaration](../../../module.ramify) has 110
added lines and 86 additional exposure statements. They name committed
records, protocol shapes, pure replay and KPI facts needed by the child and
its owned tests; existing inherited descendant APIs remain available under
Ramify's subtree semantics. The child production source imports no writable
run service, ledger writer or command executor, and its injected `RunSource`
offers committed reads, versions and optional Git reading only. This
extraction did not attempt a subtree-wide least-privilege redesign.

The parent no longer needs to hold the query implementations' private
projection rules, pagination/cache state or error translation while reasoning
about scheduling and durable writes. It does need to maintain the frozen
reading adapter, the shared repair authenticator and the enlarged named
contract seam. Those contracts are a real maintenance cost; further reducing
them would require a separate design judgment, not a file-count claim.

`module.ramify`, `subs/web/module.ramify`, the public protocol source under
`subs/harness/src/interfaces/protocol/`, and web production source have no
Git diff between the original runtime and this candidate. Thus no root/web
tag, browser exposure or public wire declaration changed. Actual parent/child
imports type-check and Ramify reports zero denied accesses. Ramify still
reports inferred-signature and view coverage limits, so this comparison does
not claim a complete inferred companion proof; it verifies the named imports
used by real consumers and tests. The focused latest generated feature's eight
definitions (14 expanded cases) pass without changing its frozen pending tags;
the stopped full-run record retains its own four-done/four-pending state.
