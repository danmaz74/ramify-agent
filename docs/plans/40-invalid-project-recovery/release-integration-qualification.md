# Plan 40 released-provider integration

**Date:** 2026-10-12. **Status:** Released-provider focused checks and ownership
measurements pass. Clean committed consumer audit qualification remains open.
The earlier [development receipt](development-qualification.md) retains its
original 0.4.3 results and limitations.

## Release and consumer identity

The candidate remains uncommitted in
`/workspaces/worktrees/ownership-recovery-agent`, branch `fix/ownership-recovery`,
based on `3820eb42117651cb6fb1f29a5839e7d5b6000f88`. This base is not the identity
of the modified candidate. No consumer commit, push or audit was performed.

The manifest and lockfile now pin **`ramify.ts@0.5.0`** from the configured
registry. The installed executable answers `0.5.0`. A single retained registry
query verifies the published release:

```sh
npm view ramify.ts@0.5.0 version dist.integrity gitHead --json
```

[Raw registry output](evidence/published-provider.json) records release commit
`26e382791ae64e52f179573054ff00ff03078700` and integrity
`sha512-N2XY3DBe3JPQ24EhCrvyr0PNZZInivHRn5/fc4W4xxnYTerdIr7UNo2xPaep7oBGZOFy+/iKj2r0FapXeUF0AQ==`.
The authoritative provider implementation candidate was
`f370d7d3e96820710585668aabb9ec23cea29d43`; its
[configured audit receipt](https://github.com/danmaz74/ramify/blob/26e382791ae64e52f179573054ff00ff03078700/docs/plans/analysis-failure-recovery/audit-receipt.md)
records report commit `82380fedea4d5ddb8688cf665e2d8da5841bc56c`.
The release preparation changed manifest/lock version metadata. No comparison
checkout or packed provider artifact was adopted. Other pins remain
`ramify-audit@0.8.0` and `@earendil-works/pi-coding-agent@0.87.1`.

## Installed and scripted qualification

The reviewed exact native witness was registered in
`src/tests/test-boundaries.json` and executed through the configured boundaries
project:

```sh
npm run test:boundaries -- subs/harness/subs/evidence/src/tests/ownership-recovery.boundary.test.ts subs/harness/subs/evidence/src/tests/project-boundary.test.ts subs/harness/src/tests/write-guard.boundary.test.ts subs/harness/src/tests/engineer-api-preparation.boundary.test.ts --maxWorkers=1
```

At 11:12:31 UTC this passed **four files, 14 tests**. The new witness uses
`new RamifyCli({ timeoutMs: 120_000 })`, with no capability override. It verifies
the ownership carrier and provider version match the actual installed pin,
baseline affected analysis succeeds, removing an exposed source export leaves
ownership answered while affected fails with `missing-export`, invalid
declaration acquisition retains typed and raw diagnostics, and restoration
permits fresh ownership and successful analysis. Its 180-second test timeout
was unchanged. This proves the installed CLI/consumer adapter boundary; it does
not replace the scripted workflow regression.

The same 17-file focused command retained in the development receipt was rerun
against 0.5.0 at 11:12:45 UTC and passed **17 files, 124 tests**. Its composed
local/capability recovery cases remain symbolic scripted reconstructions of
the retained failure, not a replay of that target.

A focused composition run then exposed two gaps: generated-feature physical
refusal could throw before producing a gate outcome, and new preflight failure
statuses lacked named producers in the coverage inventory. The gate now records
known feature-target refusal separately from unavailable physical placement;
expected filesystem access failures remain unavailable, while unexpected
programmer errors propagate. The original tampering regression remains intact.
The existing NFR repair scenario now records normalized ownership evidence in
one variant and retains the legacy carrier in the other. The existing committing
checkpoint fixture exercises all five acquisition failure statuses and asserts
the persisted status, outcome and absence of commit/audit effects. A subsequent
test-only inventory title mismatch was corrected. Earlier failures remain
development evidence; they are not counted as passing runs.

After all production and fixture edits settled, this command passed **four
files, 29 tests** at 11:20:15 UTC:

```sh
npm run test:quick -- subs/harness/src/tests/nonfunctional-repair.test.ts subs/harness/src/tests/ownership-mutation-classification.test.ts subs/harness/src/tests/composition.test.ts subs/harness/src/tests/feature-target-placement.test.ts --maxWorkers=4
```

These totals overlap the prior focused run and must not be added as unique
coverage. Final `npm run type-check` and `npm run check:self` passed on the
settled source. The latter reported completed execution, passed check and
partial analysis coverage: **zero errors, zero warnings, 359 analysis limits**,
13 owners, 810 source files and 72 resources.

[Process evidence](evidence/release-process-evidence.json) retains exact cwd,
file and time windows. Both ordinary selections recorded zero native API
observations and zero refused attempts. The four registered native files
recorded 72 allowed API observations and zero refused attempts; these are
invocation traces, not successful child-process counts. Probe processes are
explicit opt-in measurements outside ordinary/audit test discovery.

## Ownership-query measurements

The opt-in probe ran after tests and structural checks finished, without
concurrent checks from this task. Each workload received one warm-up pair and
five measured pairs, alternating ownership/affected order. Each command starts
a fresh process; no harness cache or daemon is used. OS/filesystem cache state
is uncontrolled, with no cache flush or cold guarantee. First probe invocations
are retained separately and are not labelled cold.

| Workload | Ownership median, ms | Affected median, ms | Affected result | Equivalent-success comparison |
| --- | ---: | ---: | --- | --- |
| Capability fixture | 223.38 | 597.13 | Exit 0; analysis failed; complete selection coverage | No |
| Collection fixture | 338.57 | 1684.34 | Exit 0; analysis passed; partial selection coverage | No |
| Harness candidate | 1021.83 | 11774.48 | Exit 0; analysis passed; partial selection coverage | No |
| Private valid control | 184.78 | 486.33 | Exit 0; analysis passed; complete selection coverage | Yes |

Every ownership acquisition answered successfully. The first three affected
timings describe their actual operation outcomes; they do not establish
equivalent complete work or a source pass for the capability fixture. The valid
control's median ownership/affected ratio was **0.380** in these five samples.
This is a workload/host observation, not a general speed guarantee or evidence
for caching.

Every workload had **one unique ownership input ID and one unique affected
input ID**, including its warm-up and measured calls. Identity was stable
within each operation. Acquisition and analysis identities belong to distinct
domains; no cross-operation equality is asserted.

The original three-workload run was 11:21:41–11:23:15 UTC. A private,
dependency-free control was then authored with
[exact files and hashes](evidence/query-control-fixture.json). Its separate
[baseline affected answer](evidence/query-control-baseline.json) established
passing complete coverage before the same probe ran at 11:24:39–11:24:43 UTC.
The raw receipts retain exact start/finish times, commands, project/input
identities, host, installed package/runtime/launcher and lockfile hashes,
consumer HEAD/dirty state, warm-ups, first calls, every sample and all raw output.

Reproduction uses the installed pinned CLI through the standalone script:

```sh
node_modules/.bin/tsx scripts/ownership-query-cost.ts --output /tmp/ramify-agent-plan40-ownership-cost-0.5.0.json --samples 5 --warmups 1 --project /workspaces/worktrees/ownership-recovery-agent/subs/harness/fixtures/capability-coordination --path subs/a/src/caller.ts --project /workspaces/worktrees/ownership-recovery-agent/subs/harness/fixtures/collection-review --path src/main.ts --project /workspaces/worktrees/ownership-recovery-agent --path subs/harness/src/guard/write-guard.ts
node_modules/.bin/tsx scripts/ownership-query-cost.ts --output /tmp/ramify-agent-plan40-query-control-cost-0.5.0.json --samples 5 --warmups 1 --project /tmp/ramify-agent-plan40-query-control-94tum8aw --path src/index.ts
```

Use new output paths: the probe refuses overwrite. Recreate the private control
from its exact retained files when its scratch path is unavailable. This
measures repeated per-write queries on an unchanged candidate, including process
startup and JSON output; it does not measure end-to-end write latency.

The unmodified original observations are retained losslessly as
[three-workload raw JSON](evidence/released-ownership-query-cost.json.gz) and
[control raw JSON](evidence/released-query-control-cost.json.gz).
[The derived summary](evidence/ownership-query-cost-summary.json) records
sample ranges, first invocations, actual statuses, unique IDs, eligibility and
raw/compressed SHA-256 identities. No failed or unsupported acquisition was
relabeled as successful. No production cache or filesystem checkpoint was added.

## Remaining qualification

Release adoption, installed-provider witness, focused regression/type/structure
checks and the ownership-query measurement are complete for this reviewable
candidate. **Stage-one qualification remains open** until an authorized consumer
commit and a clean committed default audit:

```sh
node_modules/.bin/ramify-audit audit --cwd . --json
```

The audit must retain all configured checks and projects and record the exact
consumer commit and audit evidence. This receipt has no consumer audit ref or
passing whole-suite claim. Commit/audit permission remains the coordinator's
next user approval step; no commit was made here. Conditional checkpoint
measurement/adoption remains separate, unimplemented stage-two work.
