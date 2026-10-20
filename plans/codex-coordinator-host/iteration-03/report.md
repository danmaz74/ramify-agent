# Iteration 03 engineering evidence

Implementation base: `8785a35e7d14610e4883a684714587a781a14934`.
Native iteration: `it-089cd173-032b-4ab1-86ce-b2ca09a541a4`, started
2026-10-20T00:32:03.369Z. Implementation job: `20261019T190943Z-7fd938`.
The original registered plan baseline remains
`1a87d832b6890f0658e7024faed78487815b7823`.

## Delivered continuation

`coordinate resume --project <root> --id <previous-id> --command-id <stable-id>`
continues the retained assisted job with its original baseline and captured plan.
It preserves staged, unstaged and untracked source, model/worker/assessor/skill
settings and task directions. It stops a reachable old owner through its existing
authenticated control, then requires confirmed whole-host settlement before
replacement. An alive unreachable owner remains refused. Provider exit leaves the
host/service available until explicit continuation. There is no automatic restart,
new turn, assessment resume, compaction policy or acceptance inference.

A dedicated Linux guardian is the subreaper for the complete host tree, covering
assessor/audit subprocesses as well as the Codex provider and native workers. The
provider and guardian share the narrow existing Linux ancestry/identity/settlement
kernel exposed by the harness; provider wire policy stays in Codex and lifecycle
policy stays in assistance. The guardian kills/reaps its own descendants after
host exit, including setsid/double-fork orphans, and retains an atomic receipt bound
to its generation and guardian/host start identities. No unrelated process is
signalled. A dead guardian without acknowledgement leaves unknown orphan writers
and refuses replacement even when known PIDs are gone.

The initial guardian evidence uses the private launch directory. Once the host
owns the project, the receipt moves to mode-0600 `guardian.json` in its owned
coordinator directory. Host preparation verifies that evidence before provider
creation. Later settlement does not depend on temporary launch files. Fresh starts
also require the preceding released owner's settlement; stale-owner start cannot
bypass explicit resume. Legacy hosts without guardian evidence require their
ordinary confirmed coordinated stop; crash settlement is never inferred for them.
The CLI reports an acknowledged stop as uncertain when whole-host settlement
cannot be established.

A resumed coordinator reuses the latest available persistent thread in its
continuation lineage, including across a failed startup that retained no thread.
A confirmed missing-history RPC permits a fresh persistent thread; unrelated RPC,
transport and uncertain-resume failures do not. `--fresh-thread` explicitly chooses
fresh persistent context. Every new thread uses and verifies `ephemeral: false`.
Readiness distinguishes retained history from acknowledgement of the new initial
continuation. A historical turn cannot make launch return successful early.

Current HTTP endpoint/credential settings are explicitly passed on thread start
and resume, and loaded equipment is verified before input. Replaced global stdio
names remain disabled. Each preceding generated HTTP entry receives a complete
valid disabled HTTP transport table using retained endpoint metadata, alongside
the new required HTTP entry. The installed parser rejects a newly introduced
`enabled=false`-only table even though it is disabled. The repaired combination is
verified by [actual installed CLI probes](mcp-rebind-probe.json), including the
negative case; global configuration hashes remain unchanged. The
[installed resume schema](installed-resume-protocol.json) binds the actual fields
and local generated schema hash. No sandbox, permission or instruction override
is introduced.

Prior send/respond command receipts remain referenced through coordinator lineage.
Identical completed admissions return their retained result, reserved/uncertain
admissions remain uncertain, and conflicting arguments fail. No old message or
approval is redelivered. Continuation uses a distinct current-state instruction,
preserving the task and existing decisions while directing ordinary inspection.
Private `task.json` retains task directions; receipts retain hashes rather than
response/message bodies. Missing active-index state is distinct from missing
ownership/settlement evidence, so lost proof cannot be treated as an empty checkout.

Service recovery leaves interrupted assessments pending. Reconnection, host resume
and a fresh thread do not automatically resume or replace them. The coordinator
must explicitly call `assessment_resume` for an existing interrupted assessment
that still needs completion. Existing stage evidence, requested time, candidate,
job and independent acceptance authority remain unchanged. Standalone stdio MCP
and normal assisted clients retain the existing implementation and tests.

## Resume admission repair

Assessment `as-0010` passed audit and identified `cf-0012`: retrying a resume
through its older predecessor after the admitted successor stopped could create
a branch that omitted that successor's command receipts and settings. The
[repair report](cf-0012-repair.md) records the corrected admission invariant and
actual multi-generation CLI regression. Exact retries now observe their admitted
successor even after stop or later generations. New continuations must select the
latest coordinator; the host enforces that requirement under service ownership
before publishing another generation. No old input or approval is replayed.

## Publication and early startup recovery repair

Assessment `as-0011` confirmed `cf-0012` fixed and required `cf-0013`/`cf-0014`:
a successor could become permanently admitted before retaining its known job or
before the active index advanced. The [focused repair](cf-0013-0014-repair.md)
makes generation records the single admission authority. Supplied jobs are
verified under ownership and private directions are retained before admission.
One lookup resolves the latest committed generation and exact prior admission;
the active index is only a hint. Normal next-generation publication advances it,
without a separate repair protocol. Settlement proof remains required.

The native crash witness exercises both sides of admission and listener failure.
An early failed successor retains its job, settings, task and pending fresh-context
choice. Its unused generated MCP name is not introduced into provider configuration;
actual preceding HTTP entries and explicit replacement settings remain preserved.
No placeholder endpoint, model-history reconstruction, automatic restart or
acceptance-authority change was added.

## Stable caller intent during settlement

Assessment `as-0012` confirmed `cf-0013`/`cf-0014` fixed and required `cf-0015`:
thread adoption could finish while stop waited, changing the inferred fresh choice
and therefore an identical retry's request hash. The [localized repair](cf-0015-repair.md)
keeps the caller's explicit fresh flag unchanged in the existing hash. The host
separately freezes its effective context requirement from the settled predecessor
in the existing generation record. Inherited settings use the post-stop record.
No new receipt format, hash scheme or recovery path is introduced.

The native witness holds actual provider thread creation, starts explicit resume
and observes its HTTP stop waiting, then releases thread adoption. The admitted
successor reuses that retained persistent thread; exact retry observes the same
successor without another turn or launch. Changed explicit flags conflict even
when an inherited effective decision would produce the same context strategy.

## Focused verification

All commands ran from `/workspaces/worktrees/codex-coordinator-host`. The unchanged
complete configured projects remain in place; these are explicit focused selections,
not a direct full audit. RA owns implementation assessment and audit submission.

- [Focused selection](verification/cf-0015-focused-tests.log): **197/197**, 14 files,
  including **18 exact registered native cases**, exit 0. Selection was
  `node_modules/.bin/vitest run --project node --project boundaries` followed by
  root `cli.test.ts`, root `coordinator-launch.boundary.test.ts`, assistance's
  `coordinator-recovery.test.ts`, `coordinator-control.test.ts`,
  `coordinator-provider.test.ts`, `coordinator-read.test.ts`,
  `coordinator-projection.test.ts`, `coordinator-host.boundary.test.ts`,
  `coordinator-guardian.boundary.test.ts`, `coordinator-publication.boundary.test.ts`,
  `coordinator-provider.boundary.test.ts`,
  `assistance-mcp.test.ts`, `assistance-service.test.ts`, and Codex's
  `provider.test.ts`, at their committed source paths.
- The actual detached CLI witness kills the host after provider acceptance but
  before send acknowledgement, removes temporary launch files, then verifies
  whole-tree settlement, the same persistent thread/job/baseline, unchanged staged
  and untracked work, one continuation, and no replay of the uncertain send.
  Provider-exit continuation, confirmed missing-history fallback, explicit fresh
  context, same-ID retry, changed-argument refusal, new endpoint/credential,
  multi-generation MCP transport and guardian-death refusal are exercised.
- The actual guardian composition witness creates an assessor setsid orphan
  outside the Codex supervisor tree, plus a provider orphan, kills the real host,
  verifies both stop and an unrelated process survives, then reopens the same job.
  Its assessment stays interrupted until the official HTTP SDK explicitly resumes
  that same assessment ID. Git/provider answers and assessor outcomes are scripted;
  process ownership, HTTP transport, service persistence and kernel death are real.
- Ordinary cases cover receipt inheritance across multiple generations, completed
  approvals, missing acknowledgements, argument conflicts, missing proof without
  any attempted process launch, binding errors, provider resume uncertainty and
  exact thread MCP overrides. Existing provider race regressions, stdio MCP
  registration/observation, assessment interruption and acceptance semantics pass.
- [Four TypeScript configurations](verification/cf-0015-type-check.log):
  `npm run type-check`, exit 0.
- [Ramify self-check](verification/cf-0015-check-self.log): `npm run check:self`, exit 0,
  **0 errors, 0 warnings, 781 existing analysis limits**, partial coverage;
  25 owners, 1093 source files, 101 resources, 20035 accesses.
- `git diff --check`: exit 0. [Final source hashes](source-sha256.json) bind the
  changed source, tests, declarations, skill and usage contracts.
- The I2 [900000ms HTTP witness](../iteration-02/http-bridge/report.md) and its
  configured deadlines remain unchanged; no unnecessary 15-minute repeat was run.

## Disposable live qualification

The independently prepared target is `/tmp/ramify-recovery-pilot-nCsA1r`, plan
`duration-labels`, original baseline
`c19fca03ee92291dc2c682b56bd4e6a785932ec7`, sole assisted job
`20261020T004457Z-52b40b`. Native Sol work, exact owner interruption, persistent
thread continuation across a failed provider startup, and fresh persistent context
all retain that registration and committed partial source. The completed
[live report](live-qualification/report.md), SHA-256
`b394ee17678f8d1acc0150f42ad5a65ed343237a3e208ce02e62beb421ed11de`,
binds the actual launch source fingerprints and phase-specific evidence.

The original persistent coordinator thread
`01a156c4-c2e4-7391-b326-10993247cbda` survived partial-source interruption and
a failed null-thread startup. After an assessment-time host crash, explicit fresh
thread `01a156d0-d57c-76a2-a19e-6aa2218d1a50` retained the same job and candidate.
It explicitly resumed interrupted assessment `as-0001` (revision 7 to running
revision 8), which completed `clear` at revision 12. Final assessment `as-0002`
completed `clear` at revision 10 for exact pilot candidate
`a3469c87dabdb928d130fd39b28330acc507c133` against the original pilot baseline.
Both configured pilot audit checks passed. This separate pilot's clear gates do
not replace the implementation coordinator's I3 or cumulative assessment.

The useful formatter partial commit remains an ancestor of the completed parser
candidate. Native Astra and both Sol worker identities were verified. Recovered
MCP calls used the current HTTP endpoint, retained previous disabled MCP names,
and preserved global configuration. Final explicit stop confirmed descendant
settlement; all four guardian receipts report settled and every known owned
host/provider/supervisor/guardian identity was absent. The target is clean and
contains only its original job. No private bearer value appears in retained
artifacts.

Live launch fingerprints delimit the earlier source snapshots; the final durable
guardian-directory refinement is separately qualified by the current-source
native witnesses. The pilot used explicit fresh context rather than inducing a
real missing-history RPC, and did not manufacture ambiguous live message delivery.
Those cases are covered by the focused scripted/native regressions. Shell-tool
and PTY return were observed while later native work continued; arbitrary UI or
outer-agent disappearance remains unqualified.

## Protected contract and scope

The sole protected specification difference is the required additive host contract
in `docs/architecture/agent-assistance/service.spec.md`. I3 replaces its I2-only
resume-unavailable sentence with the delivered explicit settlement, persistence,
rebind, receipt and assessment-resume semantics. All pre-existing assisted service,
protection, finding and exact-candidate acceptance contracts remain unchanged.

[Exact cumulative diff](protected-service-spec.patch) contains 24 added lines
against the original plan baseline; [Git entry identities](protected-change.json)
bind before blob `f104982bad49054c654df4922faee7af26e587f4` and after blob
`d563faab5db2309f95878f632280d6f0d34e92b0`. Exact user authority remains held for
the coordinator's final approval step; this engineering report does not authorize
it. No principles, dependency pins, global configuration, shared daemon or audit
project configuration changed. Coordinator-owned execution notes are included with
the coordinator's explicit authorization, recording implementation completion and
these evidence pointers.

The supported scope is the running Linux devcontainer with Python3, readable
`/proc`, subreaper support and provider connectivity. Process failure is recovery,
not uninterrupted execution. Missing or unproven guardian settlement remains an
explicit refusal. Launching CLI/tool return is qualified; arbitrary launching
UI/agent termination or container cleanup policy must not be inferred from it.
I3 and the separate cumulative implementation assessment remain the coordinator's
next gates, including the held exact protected change authority.
