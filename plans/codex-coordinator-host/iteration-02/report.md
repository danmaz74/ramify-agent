# Iteration 02 engineering evidence

Implementation source commits: `cff8956f0a0e6b664c6660bb597821662f7baed5`
and `73161fc4` (status-field projection repair).
Bridge commits: `0e3ad1ff`, `debc57da`. Implementation base:
`c1b7cb75206acff82bbaf3940f1e7d2b14f49c9a`.
Native iteration: `it-6e074b47-5d55-43ca-86c7-412b2ea44f83`;
implementation job: `20261019T190943Z-7fd938`.

The assistance owner now composes detached project ownership, one shared assistance
service/Pi runtime, independent official HTTP MCP sessions, a persistent dedicated
Codex provider, registration reuse, typed controls and durable command receipts.
The root consumes the exposed CLI facade. Startup verifies the listener before
provider launch, effective MCP transport/tools before input, and persistent thread
identity before the first message. Explicit replaced stdio entries are disabled
only in launch overrides; user permissions, instructions and unrelated MCP remain
unchanged. Worker identity/model/parent/history and inherited tools are observed
from actual activity events as well as thread notifications.

A stopped owner must settle the provider and assessment runtime before completing
its stop receipt and releasing the lock. Provider failure keeps inspection and the
shared service alive. Failed delivery/receipt persistence stays uncertain and is
never blindly replayed. An aborted control reply does not cancel admitted input.
Watch is bounded, returns cursor gaps, and owns only observation lifetime. Private
credentials and secret response values are excluded from retained observations;
form field names remain visible, while sensitive defaults and response bodies do
not enter progress or receipts.

## Focused verification

- [Configured focused selection](focused-checks.log): 8 files, 152 tests pass,
  including 7 native host/provider/detach cases. This is a filtered selection of
  the unchanged complete configured projects, not a full audit.
- [Later private-form/echo regression](private-form-check.log): final host native
  file 4/4 passes, including response secrecy, real SDK cancellation, ownership
  races, lost HTTP replies, activity-only worker discovery and progress gaps.
- [Actual CLI watch SIGINT](cli-watch-check.log): native detach case passes
  with its observer exiting 0 while host/provider/orphan remain live.
- [All four TypeScript configurations](type-check.log): pass; the final additional
  native watch case and status projection also pass a subsequent root type check.
- [Ramify self-check](check-self.log): pass, zero errors/warnings, 781 existing
  analysis limits and partial coverage.
- [Bridge engineering evidence](http-bridge/report.md): controlled cases 6/6;
  actual 900000ms assessment wait passes over native HTTP in 900.41s test time;
  final short native cases 3/3 establish stream headers, backpressure and failure
  cleanup. The complete audit retains the long witness and every other project.
- Exact kernel/process witnesses are registered in
  `src/tests/test-boundaries.json`. Ordinary tests script Git, provider, assessor
  and failing listener answers; no ordinary process escape is added.

Native detach qualification runs a real CLI child to completion, closes its
pipes, then observes the still-running detached host/provider/setsid orphan.
Reconnecting start returns the same job/thread; interrupt does not claim child
settlement; stop proves kernel disappearance of the owned processes. A new start
after confirmed stop reuses the supplied job and obtains a new host generation.
The real pilot separately launches from a completed native agent shell tool call
and continues work after that call returns. This qualifies the supported Linux
devcontainer tool execution boundary; it does not claim container survival or
arbitrary UI/session cleanup environments were tested.

## Actual installed protocol and permissions

[Installed protocol evidence](installed-protocol.json) binds locally generated
Codex 0.161.0 schemas by SHA-256. The live provider requests MCP consent through
`mcpServer/elicitation/request`, mode `form`, with an empty object schema. Exact
inspected consent is answered with `action: accept, content: {}`. Typed support
uses the installed official SDK JSON Schema validator; stale/concurrent responses,
invalid schema content and unsupported URL/nested forms have regressions.

The devcontainer's existing sandbox reports
`bwrap: Failed to make / slave: Permission denied`. The operator approves only
exact inspected fixture operations or required read-only skill references once,
and individual consent requests for the host's RA tools. No session/policy
approval, sandbox override, global configuration edit or shared daemon change is
used. [Operator identities and receipts](pilot-operator-responses.jsonl) retain
those bounded responses. The exact proposed source patch was inspected through
Codex-owned history before its [one-time file approval](pilot-inspected-file-change.json).

## Disposable real pilot

[Target metadata](pilot-target.json), [preparation script](prepare-pilot.mjs),
[operator helper](approve-pilot.mjs) and [observer](observe-pilot.mjs) retain setup
and actual operator activity. The target has independent installed dependencies,
committed Ramify declarations, a captured real formatElapsed implementation plan,
Node behavior tests and its own two configured audit checks. Source work is only
in that target; it never competes with the implementation checkout's live owner.
The assessor model is explicitly `openai/gpt-6-astra:high`, matching the proven
implementation-assessor selection. Coordinator/worker are native
`gpt-6-astra`/`gpt-6-sol`.

The original job `20261019T225219Z-546e10`, baseline
`b7e71489ea514ef947202dac109dec9ad9b41afe`, and started iteration
`it-9ffcac1d-d68a-444f-9cc4-69c8c92f8f5b` are retained through explicit settled
equipment-repair restarts. The final running pilot host is
`coord-bc289a26-6329-4a24-8e03-303821a0a51d`, thread
`01a15665-9f11-7c52-8eb6-95c85125d578`; its actual Sol worker is
`01a15668-edda-79e1-a248-959e0dd17497`. The
[observations](pilot-observation.json) record verified native worker equipment and
disconnect/reconnect identities. Final candidate/assessment outcomes and global
configuration integrity are recorded below.

The pilot host was launched from the evolving I2 working source before the final
private-form redaction, official JSON Schema validator, status-field projection
and stop-receipt hardening.
Its exercised empty consent shape is unchanged; final native regressions qualify
those later paths. This report does not claim a bit-identical live model rerun of
every intermediate source change.

## Protected change and remaining scope

The only protected document edit is an additive opening coordinator-host section
in `docs/architecture/agent-assistance/service.spec.md`, with a heading for its
existing assisted operations. Its [exact diff](protected-service-spec.patch)
defines the implemented ownership, transport, private records, control and
settlement behavior; existing assisted protection/assessment/authority rules are
preserved. No principles file or guarded package/runner/project configuration is
changed. The coordinator skill adds the supplied-registration branch before
unsupplied discovery; README and usage document the same behavior. Exact user
protection acceptance remains the coordinator's final workflow step.

Crash continuation/resume, live surviving-process reconciliation and assessment
reuse after process failure remain I3. The I2 CLI diagnoses resume as unavailable
and never treats stale observations as safe replacement authority. No full audit
or independent Pi review is duplicated here; the coordinator submits this
committed iteration to RA.

## Settled pilot result

The real native Sol worker delivered candidate
`80ce66efeec1bc4cb252f2ee653af4bdc0288975`. Its iteration assessment `as-0001`
and cumulative final assessment `as-0002` are both `clear`, with no repairs,
decisions or gaps. The final request uses the original registered baseline, and
exactly one job directory exists after all starts. The configured audit checks
`elapsed-tests` and `elapsed-structure` passed through ordinary RA assessment;
final assessment reused the same valid candidate audit evidence. See
[compact results](pilot-assessment-results.json) and
[candidate/baseline/audit provenance](pilot-final-evidence.json).

[Worker evidence](pilot-worker-equipment.json) binds its native Sol model, parent,
persistent history prefix and actual inherited HTTP `job_detail` call/result.
The [observer evidence](pilot-observation.json) records a watch disconnect during
active worker execution and an MCP session disconnect during active assessment.
Both reconnects retained the same host/thread/job, and the assessment continued
to completion. Observation records retain only assessment status fields; complete
assessment evidence remains in the existing job store and separate provenance.

The host ended idle with its worker complete and both assessments complete; see
[final live status](pilot-live-final-status.json). Explicit
[stop](pilot-final-stop.json) then settled owned execution and released ownership.
[Kernel and credential verification](pilot-settlement-and-secrecy.json) confirms
the original host, provider and supervisor process identities are gone, and no
private bearer value appears in retained artifacts. The global Codex configuration
SHA-256 is unchanged.

Qualified runtime: Linux `6.8.0-85-generic`, Node `v22.23.3`, Python `3.11.2`,
Codex CLI `0.161.0`, official MCP SDK client/server `2.3.1`, Ramify `0.5.2` and
ramify-audit `0.9.3`. The devcontainer sandbox limitation remains factual; exact
approve-once fixture operations exercised the real permission flow without
weakening it. Container loss, unsupported operating systems, and arbitrary IDE
shutdown behavior are outside this qualification.
