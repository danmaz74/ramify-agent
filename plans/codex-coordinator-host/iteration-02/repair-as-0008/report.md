# Iteration 02 repair evidence: as-0008

Repairs prepared against reviewed candidate
`44b495adacd51dac8fdc43c0698893c2d7519618`, within iteration
`it-6e074b47-5d55-43ca-86c7-412b2ea44f83` and implementation job
`20261019T190943Z-7fd938`. This remains the same iteration and registration.

The host now projects confidential display content separately from control
metadata. Request identities, generation/thread/turn/item identities, approval
choice handles/effects, question identities/selectable labels, form property names
and validation constraints remain verbatim. Display text, errors and completed
message content redact known secret values; form defaults/examples remain omitted.
Process/readiness metadata, worker identities and terminal status retain their
actual provider values. Opaque metadata can coincide with a short answer without
being rewritten as confidential message content.

Every launch adoption, including polling a concurrent ownership winner, verifies
the admitted full normalized argument hash when the command identity matches.
Identical retries observe the same host, and a distinct command identity can
observe that target without replacing its initial instructions. Once a compatible
owner is observed, a losing launcher child's exit does not invalidate that owner.

Runtime publication is individually atomic but precedes observation publication.
Readers re-read a conflicting observation before diagnosing an endpoint mismatch.
A same-generation runtime paired with the initial `starting` observation and null
endpoint is unavailable until publication completes. Its unpublished listener is
never used. Generation/identity mismatches and established endpoint conflicts
remain errors; launch/status can observe genuine startup without a fatal identity
error.

## Verification

All commands ran from `/workspaces/worktrees/codex-coordinator-host` on
2026-10-20 UTC. No direct audit or complete unfiltered suite was run.

- [Focused checks](focused-tests.log): **117/117** in seven files, exit 0,
  including **eight exact registered native cases**. Selection:
  `node_modules/.bin/vitest run --project node --project boundaries`
  followed by assistance's `coordinator-projection.test.ts`,
  `coordinator-read.test.ts`, `coordinator-control.test.ts`,
  `coordinator-provider.test.ts`, Codex's `provider.test.ts`, assistance's
  `coordinator-host.boundary.test.ts` and root's
  `coordinator-launch.boundary.test.ts` (their committed paths).
- The authenticated HTTP consumer answers secret `1`, then answers an actual
  approval from status, a question from watch and an MCP form from status using
  their unmodified handles. A completed message echo is redacted while its turn
  identity remains exact. Ordinary cases also cover secrets `e` and `inProgress`,
  and opaque handles longer than the display-text truncation boundary.
- A real listener is held after runtime publication and before record
  publication. Status reports unready; an existing-host launcher remains pending
  then returns that same ready host after release. Incorrect runtime identity,
  generation and established endpoint remain errors. Scripted reads additionally
  cover the old-record/new-runtime/new-record interleaving and conflicts during
  re-read.
- Actual independent CLI processes concurrently launch identical and conflicting
  initial instructions. Identical requests return one host; conflicting arguments
  produce exactly one ready result and one argument-conflict error. Native
  provider history retains the winning instructions. Later same-ID conflicts
  reject, while a distinct observation retains the same host/job. Actual host,
  provider and owned orphan settlement remains covered by the existing detach
  witness. These additions have exact entries in `src/tests/test-boundaries.json`.
- [All four TypeScript configurations](type-check.log): `npm run type-check`,
  exit 0.
- [Ramify self-check](check-self.log): `npm run check:self`, exit 0, **zero
  errors/warnings**, **781 analysis limits**, partial coverage, 25 owners,
  1086 source files, 99 resources and 19948 accesses.
- `git diff --check`: exit 0 before committing. No fixture host/provider remains
  after the native checks.

## Scope and remaining qualification

No new protected specification, principle or guarded configuration edit is part
of this repair. The previously required additive `service.spec.md` contract and
its retained exact diff remain unchanged; cf-0008 authorization is held for the
coordinator's final approval step. Coordinator-owned execution notes remain
unstaged. No provider control-state rewrite, global configuration, dependency,
sandbox or shared-daemon change was made.

The [earlier I2 evidence](../report.md) remains the actual installed-provider,
Sol-worker, assessment and 900000ms qualification. Those expensive exercises were
not repeated for these focused repairs. Agent-tool return and launching CLI exit
are qualified; arbitrary launching UI/agent termination is still **not
established**. I3 crash continuation remains future work. No new engineering gap
or user decision was identified by these focused checks; independent RA assesses
the repaired committed candidate.
