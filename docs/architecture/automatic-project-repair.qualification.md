# Automatic project repair qualification

**Date:** 2026-10-12. **Verdict:** Pass by composed committed default audits.
**Tracking:** `ramify-agent-y03`. Production benefit evaluation remains
`ramify-agent-18f`; no paid or live target trial is claimed.

The qualified implementation is `9a34d828232f0aed6b6fb25a0178246e47f5509a`, tree
`1ec54d4089941638fb1307ab58e7d362829649b0`, on `feat/automatic-project-repair`.
Both attempts ran from a clean committed checkout in
`/workspaces/worktrees/automatic-project-repair` with:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

No scope override was used. The auditor read committed `ramify-audit.json`.
Installed pins were `ramify-audit@0.8.0`, `ramify.ts@0.5.0`, and
`@earendil-works/pi-coding-agent@0.87.1`.

| Attempt | Candidate | Automatic execution | Result | Files | Tests |
| --- | --- | --- | --- | --- | --- |
| Initial implementation | `b92cf8a` | Full: drift cap exceeded | Fail | 371 passed, 1 failed, 1 skipped; 373 total | 3320 passed, 2 failed, 2 skipped; 3324 total |
| Event inventory correction | `9a34d82` | Scoped: one direct test file, both failures carried | Pass | 1 passed | 45 passed |

The first run automatically selected full execution because 45 changed paths
exceeded the drift cap of 25 since the preceding full baseline. All six checks
ran. Only the regression check failed: two assertions in
`subs/harness/src/tests/union-values.test.ts` omitted the new repair events and
incident reference from their explicit inventories. The correction adds those
values and producer examples while preserving the exhaustive assertions.

The second run directly executed that file, including both carried failures;
runner coverage records no missing expected files. Patch integrity, type checking,
structural self-check and web build also passed. The configured Cucumber profile
passed in the first run with **zero scenarios and zero steps**; the scoped retry
did not select it. The first run retained all configured test projects. Its skipped
file and two skipped tests remain skips, not passing coverage.

The passing composition has chain depth 1, rooted in the first full report,
with **zero outstanding failures**. Counts overlap and must not be added; the
second attempt is not a new full-suite execution. Durations were
619.105 seconds and 64.555 seconds. Structural checking
reported zero errors, zero warnings and partial coverage with 368 nonblocking
analysis limits.

## Durable evidence

Initial report: `6f63e37b13e8dd818e85207d6c883fe119f64c42`.
Passing report: `f9ffaf9a69e8d2891a2792da589882385c7e6f9b`.

```sh
git show refs/audited/runs/2026-10-12T15-46-50Z-b92cf8af4:reports/audit/summary.json
git show refs/audited/runs/2026-10-12T15-48-49Z-9a34d8282:reports/audit/summary.json
git notes --ref=audit show 9a34d828232f0aed6b6fb25a0178246e47f5509a
```

The report refs and tree refs retain complete command output, coverage, failure
identities and composition evidence. This receipt documents the code candidate;
a subsequent documentation-only commit records it without changing that code.

The [architecture contract](automatic-project-repair.spec.md) describes the
implemented boundary and safeguards. The source-pointer witness uses a scripted
preparation dependency and a real filesystem exception after an allowed rename;
it does not establish a naturally observed residual failure after Plan 40.
