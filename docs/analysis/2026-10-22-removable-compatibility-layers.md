# Removable compatibility layers across ramify-agent, ramify and ramify-audit

**Date:** 2026-10-22. **Method:** three read-only Sol sessions
(`openai/gpt-6.1-sol`, high thinking), one per repository, with the same
[brief](2026-10-22-removable-compatibility-layers/brief.md). Each report was
spot-checked against the source before this summary was written. Inspected
checkouts: ramify-agent `44a8811f`, ramify `e775e8fc`, ramify-audit `720d88d`.

**Rule applied:** the compatibility default adopted in commit `7e174f09`
([AGENTS.md](../../AGENTS.md#run-state-and-compatibility)). Run state is
disposable; only long-lived committed files and package surfaces another
repository imports keep compatibility, converted by deletable run-once scripts.

Classes: **A** internal or run state, remove outright. **B** long-lived
committed file, remove with a run-once conversion. **C** package or CLI surface
another repository uses, remove after that consumer changes.

## ramify-agent

Full report: [ramify-agent.md](2026-10-22-removable-compatibility-layers/ramify-agent.md).
About 7,200 lines, all class A, no pin change needed.

| # | Layer | Est. lines |
| --- | --- | ---: |
| 1 | Standalone-session reader for `plans/.harness/sessions/`, its HTTP endpoints, protocol variants, web branches and two fixture trees (30 files, 4,676 lines) | ~5,500 |
| 2 | Linked-successor import reader (`restart-import.ts`, `restart-prepared` handling); the producer was removed in `4b1a2c5d` | ~450 |
| 3 | Inline-document qualification and `git-exact-text/1` review readers in assistance | ~350 |
| 4 | `delivered-inputs/1` and `harness-operation/1` readers and the `/1` manifest helper default | ~300 |
| 5 | `run-policy/7` admission and continuity adoption; Plan 45 still prescribes more of this | ~200 |
| 6 | Count-forced non-functional exhaustion replay | ~100 |
| 7 | Inline-body `session-store-commit/1` replay | ~80 |
| 8 | `scope-size/1` KPI readers and manifest-less scope fallback | ~70 |
| 9 | Ignored rejection-bound judge options | ~40 |
| 10 | Run-snapshot defaults for responses missing breakpoint and repair state | ~30 |
| 11 | Assignment-boundary absence checks | ~25 |
| 12 | Pi `0.87.1` transcript and observation identities | ~20 |

Verified directly: the standalone-records header states nothing writes that
layout; `restart-prepared` has no producer left in the run service;
`policy.ts` writes only `run-policy/8` while `records.ts` admits `/7`; the
manifest helper defaults to `/1` while both production callers pass `/2`.

Kept on purpose, with Sol's reasons: stored role spellings are current
identifiers; `recovery resume` fields are still produced by the CLI client, so
they go with a CLI change rather than a reader removal; `restart prepare` is
current behavior; `settlementConfirmed` is still omitted by current code;
review-orientation records and scenario obligations are still produced.

## ramify

Full report: [ramify.md](2026-10-22-removable-compatibility-layers/ramify.md).
About 105 lines. No class C finding; both consumers pin `ramify.ts` 0.5.2 and
none of the findings touches an imported entry.

| # | Layer | Class | Est. lines |
| --- | --- | --- | ---: |
| 1 | Retired `.lock.reclaim` daemon startup guard in `launcher.ts` | A | 35 |
| 2 | Completed Claude Chrome DevTools conversion in `.devcontainer/claude-mcp-setup.sh` | A | 25 |
| 3 | `legacyChunks` reader for gzip evidence without indexed members; 26 of 66 committed measurement records lack `gzipMembers` | B | 25 |
| 4 | `ANY_ARCHITECT_SCHEMA` acceptance of older architect views; renderer writes only `/3` | A | 20 |

Finding 3 needs a run-once conversion of the 26 archives first, preserving the
decoded bytes and raw hashes and updating the compressed identities. Coverage
limit: cucumber-viz's implementation is not in this checkout, so its parsers
were not inspected.

## ramify-audit

Full report: [ramify-audit.md](2026-10-22-removable-compatibility-layers/ramify-audit.md).
About 30 lines.

| # | Layer | Class | Est. lines |
| --- | --- | --- | ---: |
| 1 | Schema-5 source names (`EvidenceSummaryV5`, `createEvidenceSummaryV5`) aliasing schema 6, exported from the package barrel | C | 10–15 |
| 2 | Optional `tests` on `VitestSummary` for older stored summaries | A | 8–12 |
| 3 | Legacy-cleanup exception in flakiness journal finalization | A | 3–6 |

Finding 1 is class C only in form: neither ramify-agent nor ramify imports the
V5 names, so the removal needs a release and a pin bump in ramify-agent but no
consumer code change. `ramify-audit.json`, receipts, notes and refs read one
current version each; rejected keys are refused, not aliased.

## Suggested handling

- ramify-agent: one plan written with the new constraint line, or direct
  removal in order of size. Finding 1 alone is three quarters of the total.
  Plan 45 should drop its adoption and legacy-reader requirements before it is
  run.
- ramify: findings 1, 2 and 4 are small direct removals; finding 3 is a
  conversion script followed by the reader deletion.
- ramify-audit: three small removals and a release, then the pin bump here.
