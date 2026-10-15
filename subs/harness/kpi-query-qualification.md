# Remaining KPI query qualification

Candidate evidence, not a committed audit verdict. The supplied accepted boundary
is `c3027b182630d5fd2c1aa8eeb43f83b913db1378`; no Git inspection or mutation was
performed in this slice. Root acceptance remains separately owned.

## Executable interpretation

`src/tests/helpers/kpi-history-usage.ts` supplies small harness-owned historical
records to real `RunQueries` and `SessionQueries` through `createQuerySource`.
There is no calculator fake, private projector import, child test-helper import,
or new runtime generated-page dependency. Historical records omit the optional
sessionOperation ledger link; they do not establish modern operation-ledger
behavior. Observation identities are explicit, not inferred from query outputs.

- sc-006: five invocations, four logical sessions, five model histories. The
  continued local session actually starts fresh (record, outcome and degraded
  event agree). Independent scope sum is 100+200+300+400+500=1500, rather than
  merging the first two into one maximum (1400). Baseline is explicitly
  unavailable, so this is a known byte subtotal, not an invented normalized
  value. History coverage is 5/5. Session answers retain both declared scopes,
  degradation, local fork source, global generation and failed unknown start.
  The local fork context is 3000; unknown global fork context stays unavailable
  at coverage 0/1; degraded fork coverage remains partial at 1/2. A pre-start
  request alone does not establish the missing outcome start.
- sc-008: recorded categories are 100 new input, 40 cache read, 10 cache write,
  20 output. Recorded rates 2/0.5/3 per million yield 0.0002/0.00002/0.00003;
  known subtotal is 0.00025 USD. Missing output rate leaves output and complete
  charge null with `output rate absent` in the recorded charge's coverage.
  Evaluation usage deliberately has four categories, not the durable usage
  record's redundant total. Two original search identities include one exact
  replay and one conflicting identity followed by an original replay. Exactly
  one search survives; outside-scope status remains unavailable at 0/1 and
  conflict coverage remains explicit. Session evaluation equals the composed
  metric invocation evaluation; category metric totals are checked separately.
- sc-009: reuses `recordedProjectionConsumers`, supported disk records, actual
  `RunService.open/close`, `createApp` HTTP and real query classes. Captures
  baseline metric/session/detail responses, full durable file inventory and
  event bytes. Each original/reopened read interval repeats in-process and HTTP
  answers, asserts zero acquisition counters, exact complete-project file
  snapshots, and unchanged last sequence 11. Across reopening durable run files
  are unchanged. Optional at-rest qualification closes a reopened service and
  compares the whole project at equivalent closed points before opening the
  final reader; lock tokens are not filtered out of an active-to-active
  comparison. This extra lifecycle is opt-in so existing compatibility fixtures
  retain their single-reopen warning count.

`FakeQueryEffects` scripts only external agent/audit/CLI/command seams.
Measurement argv, inputs.capture and command attempts are counted before any
throw, on the same injected ports used by both services; all remain zero,
including specifically during reads. Per architect source-chain inspection,
`captureSnapshot` unconditionally awaits `readMeasurement`, which calls
`ramify.run` with measure argv. This is acquisition-seam observation, not a claim
of a direct function spy. Git history reading remains permitted at its injected
seam; it is not fresh measurement acquisition. No alternative executor is
selected by these fixtures.

Shared ordinary examples are in `src/tests/kpi-history-usage.test.ts`; the late
bindings are in `src/tests/steps/kpi-history-usage.ts`. Current ordinary/testing
requester pages were inspected separately (revision
`rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:81`). They have respectively 1 and 28
supplied analysis limits, with truncated signatures: absence is not proof of
unavailability. Globally loaded expressions and the effective prepared/default
Cucumber configurations were inspected before adding exact strings.

## Commands and receipts

All commands below execute from `/workspaces/worktrees/kpi-extraction-continuation-20261014`.
Full output receipts are under
`plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0044/shell/`.

```sh
npm run test:quick -- subs/harness/src/tests/kpi-history-usage.test.ts subs/harness/src/tests/kpi-run-collection.test.ts subs/harness/src/tests/kpi-scope-collection.test.ts subs/harness/src/tests/kpi-mixed-attribution.test.ts subs/harness/src/tests/kpi-weighted-queries.test.ts subs/harness/src/tests/projections-pure.test.ts subs/harness/src/tests/projection-consumers.test.ts subs/harness/src/tests/projection-compatibility.test.ts subs/harness/src/tests/projection-paging.test.ts subs/harness/subs/projections/src/tests/lineage-metrics.test.ts subs/harness/subs/projections/src/tests/kpi-usage-search-query.test.ts
npm run test:quick -- subs/harness/subs/kpi/src/tests/metrics.test.ts subs/harness/subs/kpi/src/tests/lineage.test.ts subs/harness/subs/kpi/src/tests/sessions.test.ts subs/harness/subs/kpi/src/tests/efficiency.test.ts subs/harness/subs/kpi/src/tests/exploration.test.ts subs/harness/subs/projections/src/tests/session-reading.test.ts subs/harness/subs/projections/src/tests/kpi-metrics.test.ts
npm run type-check
npm run check:self
'/workspaces/worktrees/kpi-extraction-continuation-20261014/node_modules/.bin/cucumber-js' '--config' 'subs/harness/src/tmp/ramify-focused/wi-001.i07/cucumber-focused-70135bd2c8f341fc.json' '--profile' 'ramify-focused'
node_modules/.bin/vitest list --filesOnly --json | node --input-type=module -e 'let s="";for await(const c of process.stdin)s+=c;const files=JSON.parse(s);console.log("configured files:",files.length);for(const f of files)if(/kpi-history-usage|kpi-weighted-queries|kpi-run-collection|projections-pure|projections\/src\/tests\/(lineage-metrics|kpi-usage-search-query)|kpi\/src\/tests\/(lineage|metrics|efficiency|exploration|sessions)/.test(JSON.stringify(f)))console.log(JSON.stringify(f));'
```

- `016.log`: exact two quick commands above, exit 0: 11 files/35 cases and
  7 files/52 cases passed. No skipped cases. Includes retained six-case KPI
  guarantees, reopened HTTP purity, query lineage/usage and real provider tests.
- `017.log`: type-check exit 0; check:self exit 0, completed/passed with partial
  coverage: 0 errors, 0 warnings, **457 analysis limits** (not complete analysis).
- `018.log`: configured runner discovery exit 0: 454 files; new harness witness
  and selected moved KPI/projections tests are actually in the node project.
  This is discovery evidence, not execution of all 454 files.
- `020.log`: after the final request-reference consistency edit, exact
  `npm run test:quick -- subs/harness/src/tests/kpi-history-usage.test.ts`,
  `npm run type-check`, and `npm run check:self` all exit 0: 3 cases pass;
  completed structure check again reports 0 errors/0 warnings/457 analysis limits.
- `013.log`, `019.log`, and final `021.log`: prepared feature exit 0, **9 scenarios passed,
  137 steps passed**, no ambiguity/undefined/pending result. Config identity
  `70135bd2c8f341fc02ec9fd12ac7af9b722181fd154d73ae1aa67cbde06c88e0`.

Earlier failures remain evidence:

- `008.log`: new examples 1 passed/2 failed: incomplete exploration fixture
  schema and an inappropriate comparison of active project lock tokens across
  reopen. Repaired factual schema and used interval-local active snapshots plus
  equivalent closed-service comparisons; no durable paths excluded.
- `009.log`: type-check failed for untyped requests and use of a KPI-specific
  metric helper with lineage metrics; repaired local typing/lookup.
- `010.log`: 2 passed/1 failed: evaluation exposes four usage categories, not
  redundant total; expectation corrected to existing public shape.
- `011.log`: 2 passed/1 failed: rate absence belongs to recorded charge coverage,
  not aggregate efficiency coverage. Asserted its actual preserved location.
- `015.log`: 34 passed/1 failed. Extra lifecycle caused the existing
  compatibility warning count to be 3 instead of 2. Made at-rest lifecycle
  opt-in to sc-009, preserving existing single-reopen behavior. `016.log`
  re-executes that case successfully; no warning expectation was weakened.
- Some mutation hook checks timed out with not-checked; those are not passes.
  The explicit completed check:self receipt above supplies bounded current
  structural evidence.

Native registrations and native tool/kernel claims are unchanged. No native
witness was rerun: this slice changes only harness test fixtures, counters,
bindings and this record, not production acquisition/lifecycle/protocol or test
configuration. Ordinary process-guarded checks do not establish native execution.
No full Vitest/Cucumber suite, build:web, root qualification or committed audit
was run manually; the gate owns the committed default audit.

An exploratory shell command accidentally redirected expression listings to
`/tmp/loaded-expressions.txt`, outside assignment write scope. It did not alter
project source/configuration; it was reported to the architect and no
out-of-scope cleanup was attempted. No scope authorization is inferred from it.
