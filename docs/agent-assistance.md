# Assisted plan assessment over MCP

Agent assistance lets a native coordinator and workers implement a real plan while ramify-agent assesses each committed candidate. The assisted execution has the same plan and job identity system as implementation and manual jobs. The coordinator chooses the iteration sequence; the harness retains iteration starts, linked assessment records, audit evidence, Pi review and findings. See [Plan 47](plans/47-agent-assistance/main-plan.md) and its [implementation record](plans/47-agent-assistance/implementation-results.md).

## Prepare and connect

Use the [assisted planning skill](../.agents/skills/ramify-agent-assisted-plan/SKILL.md) to create or revise a plan around useful module-specialized iterations. It analyzes affected owners, reuse, contracts and integration, and proposes a revisable breakdown. It needs no MCP connection and does not start an execution. For example:

> Use $ramify-agent-assisted-plan to optimize this plan for module-specialized iterations, preserving its requirements and acceptance.

The [coordinator skill](../.agents/skills/ramify-agent-coordinate/SKILL.md) is the starting point for native assisted implementation. The coordinator gives its Sol workers the [module-work skill](../.agents/skills/ramify-agent-module-work/SKILL.md). These skills live in this checkout's `.agents/skills/`; when working on another project, load them by their absolute source paths or make them available in your user skill directory. Keep links pointed at a checkout containing this implementation. Loading a skill does not establish an MCP connection. The existing `ramify-agent-plan` skill remains for plans executed by the full harness.

Once the MCP server below is connected, a starting request is:

> Use $ramify-agent-coordinate to implement plans/my-plan/plan.md in this project. Coordinate Sol workers, use module focus when it helps, and let RA assess each committed iteration and the final result.

For continuation, name the existing plan/job if known and ask the same skill to resume. It discovers the existing execution instead of registering a fresh baseline. A worker can be explicitly told to use `$ramify-agent-module-work` with its assignment; workers do not need their own MCP server.

From the ramify-agent checkout, run `npm ci`. The target project needs a readable `plans/<plan-id>/plan.md`, Git commits for the original baseline and submitted candidates, and a committed `ramify-audit.json` whose checks can run in the provider workspace. Set up Pi credentials once with `npx pi` and `/login`; the [main README](../README.md#commands) describes that login. `mcp` takes the project lock, so one live harness owner serves a project at a time.

Configure an MCP client to start a stdio process with this command and arguments, replacing the two absolute paths:

```text
command: /absolute/path/to/ramify-agent/node_modules/.bin/tsx
args: /absolute/path/to/ramify-agent/src/main.ts mcp --project /absolute/path/to/target-project
```

Use the ramify-agent checkout as its working directory. The process speaks MCP on standard input and output; do not treat its output as a line-oriented command interface. The CLI also accepts `--model <provider/model>` for the Pi reviewer model. The target project and its own instructions remain authoritative for implementation and candidate commits.

## Register once, assess each candidate

Call `plan_executions` first when reconnecting. Reuse the intended assisted job's returned `planId` and `jobId` as the next call's `plan_id` and `job_id`. For a new execution, call `plan_start` before edits with `plan_id`, `execution: "assisted"` and a client-chosen `command_id`. The optional `protection` object declares `explicit_paths`, `excluded_paths`, `guarded_paths` and `additions` (`"protect"` or `"allow"`). The service adds the project's guarded configuration files and the default `.principles.md` and `.spec.md` selection, then captures the rules, plan and fixed Git protection baseline at registration. Exclusions cannot remove guarded paths; `additions: "allow"` affects only new selected paths outside the guarded set. Retry a lost response with the same command ID; a deliberate second execution needs a new ID. Call `job_detail` with the registered IDs to inspect the captured plan, protection baseline, rules and any setup gaps before relying on them. Relevant staged, unstaged or untracked protected inputs are gaps because they are absent from the Git baseline; unrelated dirty files do not require a clean checkout. Registration does not commit them.

Immediately before implementing an outcome, call `iteration` with `action: "start"`, the registered IDs, a fresh `command_id`, a concise `brief` and `focus_module` as a project-relative module path or explicit `null` for broader work. Optional `base` accepts a Git revision and otherwise defaults to checkout HEAD. The response captures an immutable iteration `id`, server `startedAt`, full `base`, `brief`, `focusModule` and Git `provenance`; retain the `id` as `iteration_id` in continuation notes. No assessment or implementation starts. Multiple iterations may be open independently.

```json
{"plan_id":"my-plan","job_id":"20261018T120000Z-abcdef","command_id":"outcome-1-start","action":"start","brief":"Implement parser validation and verify its consumer.","focus_module":"subs/evidence"}
```

A start result has this shape (identities and times are examples):

```json
{"schema":"ramify-agent.iteration/1","id":"it-97de9a74-3f6d-497b-a99f-b5f790dc0001","planId":"my-plan","jobId":"20261018T120000Z-abcdef","startedAt":"2026-10-18T12:00:00.000Z","base":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","brief":"Implement parser validation and verify its consumer.","focusModule":"subs/evidence","provenance":{"baseSource":"head","requestedBase":null,"checkoutHead":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","checkoutHeadAfter":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","cleanliness":"clean","cleanlinessError":null}}
```

`provenance.baseSource` is `"head"` or `"explicit"`; `requestedBase` retains an explicit revision, while the observed checkout heads distinguish it from `base`. `cleanliness` is `"clean"`, `"dirty"` or `"unknown"`; unavailable status retains its reason in `cleanlinessError`. Dirty starts are allowed, but the initial commit omits those edits and later diffs cannot exactly attribute them to this iteration. A moving or unavailable default HEAD fails the start instead of inventing a snapshot. Invalid revisions are input errors. Start creates no source commit or snapshot.

Once implementation and verification produce a committed candidate, call the same tool with `action: "end"`, `iteration_id`, the exact `candidate` commit, applicable `acceptance` references and a fresh `command_id`:

```json
{"plan_id":"my-plan","job_id":"20261018T120000Z-abcdef","command_id":"outcome-1-end","action":"end","iteration_id":"it-97de9a74-3f6d-497b-a99f-b5f790dc0001","candidate":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","acceptance":["Parser rejects malformed records and its consumer preserves valid records."],"requirement_documents":[],"additional_context":"Consumer verification also required a change in the harness."}
```

End inherits the stored base, brief and advisory focus, and returns `{planId, jobId, assessmentId, status}` promptly while the ordinary assessment pipeline runs. Optional `additional_context` supplements the outcome; end cannot replace the captured brief or focus. `requirement_documents` accepts `{path, revision}` pairs; `previous_assessment` carries prior review and finding context. End means ready for checking, not accepted. For a repair, call end again with the same iteration ID, a new candidate and command ID, and the prior assessment ID. Each candidate compares cumulatively from the original iteration base; successive candidate commits remain available for inspecting repair changes. A retry with the same arguments and command ID returns the original start or assessment, including after reconnect; changed arguments conflict.

`job_detail` preserves its `job` and `planMarkdown` fields and adds `iterations`. Each entry contains the captured start plus `assessmentIds` and `status`: `"started"` means no assessment was submitted, and `"submitted"` means at least one was submitted, irrespective of its gate. There is no implicit current iteration and no inferred abandonment. Legacy `iteration_assess` remains available with `base`, `candidate`, `brief`, optional assessment context and a command ID. Historical assessments without iteration records have unknown module focus and implementation timing.

For cumulative acceptance, separately call `iteration_assess` with `kind: "final"`, the registered IDs, explicit `base` and `candidate`, whole-plan `brief` and `acceptance`, a fresh `command_id` and `plan_baseline` equal to the original execution baseline. Final review compares the whole plan with the current candidate; an iteration base never replaces that baseline.

`assessment_status` reports queued, running, interrupted, cancelled or completed state without starting work. Poll at a useful interval. A completed assessment has an `assessment_result` with `gate`, concise summary, repairs, decisions, gaps, evidence references and `completedAt` when recorded. `assessment_detail` also retains `requestedAt` and optional `completedAt`. Use `assessment_detail` when the compact result lacks evidence needed to act. `assessment_resume` explicitly resumes an interrupted assessment using retained stages. `assessment_cancel` stops only the named assessment. Retain the same command ID when retrying a request; do not submit a new candidate merely because a transport response was lost.

`finding_list` shows retained findings and pending choices for the assisted job. `finding_answer` records an already-authorized user's selection of one offered option for an existing pending request. Supply its `assessment_id`, `check_finding`, `request`, `option`, actual `user_name`, governing `authority` reference and a retryable `command_id`. Use it only after the user has made that choice and the cited record actually authorizes it. It records the answer; it neither edits source nor waives a required check. Material choices without authority remain for the user.

When a completed assessment reports a protected change that the user explicitly authorizes retaining, call `protection_accept` with its `plan_id`, `job_id`, `assessment_id`, exact `path`, actual `user_name`, governing `authority` reference and a retryable `command_id`. The service records the offered choice and the user's answer against the before and after Git entries in that assessment's protection stage. A later candidate must receive a fresh assessment (another iteration end for a repair); the required protection check clears only if those exact entries still match. A different edit remains actionable. Restoring the original baseline content also clears the check without an acceptance. This command records an existing user decision; the coordinator must not invent that decision or treat its own explanation as authorization.

The `clear` gate means required checks and assessment completed for that submitted candidate with no remaining material action under the declared policy. `action-required` names established repairs or decisions. `incomplete` names required evidence that was unavailable or invalid and may also retain established defects. A failed required audit and an unresolved protected change prevent `clear`. Pi's review does not authorize a protected edit or a weaker requirement. An exact accepted decision must identify the before and after Git entries; it does not change the original baseline. A repair is a new candidate and assessment, not a relabeling of old evidence.

Native workers may edit across modules when the task requires it. Module focus concentrates context but adds no write boundary. The project decides whether and how candidate commits are authorized; assistance only inspects committed source and does not commit, merge, publish or update a tracker. The optional [coordinator skill](../.agents/skills/ramify-agent-coordinate/SKILL.md) and [module-work skill](../.agents/skills/ramify-agent-module-work/SKILL.md) capture this division of work.

## Evidence and current limits

The harness records assessment stages under the assisted job in `plans/<plan-id>/.harness/jobs/<job-id>/`. Audit uses the installed ramify-audit provider and committed configuration, retaining requested and reused source identities. Protection compares every candidate with the registered baseline through Git tree entries and name/status differences. Document discovery can read the captured plan plus baseline companions and principles through Git; a filename alone does not establish adoption. The concise MCP result points to retained detail when needed.

Iteration timing uses server call times. Derive time to first candidate from the first linked assessment's `requestedAt` minus `startedAt`; assessment elapsed time from `completedAt` minus `requestedAt`; and time to a clear candidate from that clear assessment's `completedAt` minus `startedAt`. Count linked assessment IDs for attempts. These intervals include waiting and interruptions; parallel intervals cannot be summed into plan duration or active effort. Missing historical timestamps remain absent. Unfinished, interrupted and cancelled assessments have no completion time; resume retains submission time. Completion records a valid durable outcome for any gate, including `incomplete`. Clock inconsistencies remain visible in the raw timestamps; do not turn them into invented positive durations. A clear result covers only its exact candidate. Audit execution durations and reuse provenance retain their existing meaning; a historical execution duration is not current retrieval cost.

Plan 47 runtime implementation has passed its committed configured audit and a native Sol repair pilot through MCP and Pi. The [implementation record](plans/47-agent-assistance/implementation-results.md) separates scripted validation from live client and provider evidence, and lists unresolved qualification work. The pilot validates the workflow on this project; it does not establish comparative time or context savings.
