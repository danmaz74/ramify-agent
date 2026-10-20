# I3 live recovery qualification

The disposable real pilot completed after two owned-host crashes. It retained
its original assisted job and baseline, resumed the original persistent Codex
thread after partial implementation, then continued from an explicitly fresh
persistent thread after assessment interruption. The resumed iteration assessment
and cumulative final assessment both returned `clear` for the exact candidate.

This evidence supports iteration `it-089cd173-032b-4ab1-86ce-b2ca09a541a4` of
implementation job `20261019T190943Z-7fd938`. The pilot is a separate target and
job; it never competed with the implementation checkout's owner. The source owner
sent an explicit passing recovery smoke result before the first launch.

| Pilot identity | Retained value |
| --- | --- |
| Target | `/tmp/ramify-recovery-pilot-nCsA1r` |
| Plan and only assisted job | `duration-labels`, `20261020T004457Z-52b40b` |
| Original registered baseline | `c19fca03ee92291dc2c682b56bd4e6a785932ec7` |
| Useful formatter partial commit | `eccf2661d92dba017050898f4bfa662909e3aede` |
| Complete candidate | `a3469c87dabdb928d130fd39b28330acc507c133` |
| Original persistent coordinator thread | `01a156c4-c2e4-7391-b326-10993247cbda` |
| Explicit fresh persistent coordinator thread | `01a156d0-d57c-76a2-a19e-6aa2218d1a50` |
| Coordinator, native engineering, assessor models | `gpt-6-astra`, `gpt-6-sol`, `openai/gpt-6-astra:high` |

[Preparation](prepare-pilot.mjs) created an independent package with installed
Ramify `0.5.2` and ramify-audit `0.9.3`, committed declarations, a real captured
formatter/parser plan, native Node behavior tests and two configured audit checks.
The initial two tests and Ramify check passed. Native Sol implemented the formatter
and meaningful tests first and committed that useful partial result. While parent
and worker turns were still active, the operator verified the exact host process
start identity and sent `SIGKILL` to that owned fixture host. The
[crash observation](partial-source-crash.json) retains the active state, partial
commit and source fingerprint. Its [guardian receipt](partial-source-guardian.json)
reported settlement; independent `/proc` inspection found the host, provider,
supervisor and guardian identities absent before replacement.

The first resume attempt failed before thread adoption. The source owner repaired
installed-CLI MCP transport composition and qualified its exact config shapes.
The failed host, job, partial source and original history were preserved. The
[repaired explicit resume](persistent-resume-repaired-live.json) traversed that
failed startup's lineage and reused the original persistent thread, reporting
`recovery.thread: resumed`. The native coordinator inspected current source and
the existing job, then delegated unfinished parser/test work to a new verified
native Sol worker. Its completed candidate contains the partial formatter commit
as an ancestor; the target's final working tree is clean and exactly the two
intended source/test files differ from the original baseline.

The operator then [crashed the exact replacement host](assessment-running-crash.json)
while actual iteration assessment `as-0001` was running. That assessment's audit
had passed; review remained unfinished. The
[second guardian receipt](assessment-crash-guardian.json) again confirmed settlement
and all known owned process identities were absent. Explicit
`coordinate resume --fresh-thread` started a different persistent coordinator
thread with the same job and candidate. Its
[initial live status](fresh-assessment-resume-live.json) retained `as-0001` as
`interrupted`, revision 7, with `Server ended before assessment completed`.
Nothing restarted automatically.

The fresh coordinator inspected the same job and assessment and explicitly called
the rebound HTTP server's `assessment_resume` for `as-0001`. The
[resumed observation](explicit-assessment-resume.json) shows that same assessment
running at revision 8. It completed at revision 12 with gate `clear`, no repairs,
decisions or gaps. The coordinator then requested kind `final` assessment
`as-0002` for the exact candidate against the original registered plan baseline;
it completed at revision 10 with the same clear outcome. The
[final evidence](pilot-final-evidence.json) retains request/candidate/baseline,
revision histories, audit references, gates and source hashes. Only one pilot job
directory exists. Both `duration-tests` and `duration-structure` passed through
ordinary RA assessment. Final assessment reused that exact candidate's valid audit
evidence; the operator did not duplicate a full audit.

Native histories retain the original Astra thread before and after recovery,
both persistent Sol workers with their actual parent/model identities, and the
fresh Astra thread. Actual recovered coordinator calls use the new generated
HTTP server names, including `job_detail`, `assessment_resume`, wait and result.
The ready host's actual equipment inspection reported both engineering workers
verified. Each generation retained all previously disabled MCP names. This pilot
did not ask the resumed worker to make a separate MCP tool call; its inherited
equipment evidence is the live host/provider inspection. The previous I2 worker
tool-call witness retains its original scope.

The [launch helper](launch-pilot.mjs) records each command, stable command ID,
returned status and exact source SHA-256 map. All launches came from native agent
shell tools with PTYs. The launcher/CLI processes exited before later observations;
the host then continued native worker or assessment activity. This strengthens
the observed shell-tool/terminal boundary. Closing an arbitrary UI or the entire
outer Codex conversation was not exercised and is not implied. The container stayed
running throughout. Live source came from base `8785a35e7d14610e4883a684714587a781a14934`
plus the source owner's evolving I3 edits. Later durable guardian-directory
refinements are covered by that owner's native witnesses; this pilot's recorded
launch fingerprints delimit its exact live snapshots.

The existing `bwrap` initialization restriction remained. The operator inspected
each requested fixture/guidance/test/Git operation and selected only its exact
once choice; empty RA form consent used `accept` with `{}`. The
[operator helper](pilot-control.mjs), [patch inspector](inspect-patch.mjs), retained
patches and compressed operator receipts bind those selections. Native coordinators
occasionally misresolved the skill's correct relative guide link and then recovered
to the actual repository path; those read requests are retained. No policy or
session approval, sandbox setting change, global config edit, shared daemon change,
push or tracker synchronization occurred. Final evidence confirms the global Codex
configuration SHA-256 remained unchanged, credentials were checked only for
readability, and none of four private bearer values appears in scanned artifacts.

After the final coordinator turn completed, explicit
[stop](pilot-final-stop.json) returned confirmed descendant settlement with both
assessments completed. The [final guardian observation](pilot-final-guardian.json)
and final evidence show the host, provider, supervisor and guardian identities
absent for every pilot generation. The useful target commits and original job
remain available. [Final live status](pilot-final-live-status.json) preserves the
state immediately before stop.

This pilot exercised persistent-history reuse, explicit fresh context, partial
source preservation, failed-start lineage, HTTP rebinding, real assessment
interruption/resume, independent final acceptance and owned process settlement.
It did not manufacture a live ambiguous message-delivery crash: recovered
`uncertainCommands` is empty. Unknown-delivery retention/no-replay and confirmed
missing-history fallback are separate source-owner scripted/native witnesses.
Explicit `--fresh-thread` was used here; no real missing-history RPC was induced.
Container loss, unsupported kernels and arbitrary UI cleanup remain outside this
live qualification. Retained logs trim surplus terminal blank lines while
preserving substantive commands and results. These scripts/evidence change no implementation source,
public/protected contract or test-boundary registry.
