# Assisted plan assessment over MCP

Agent assistance lets a native coordinator and workers implement a real plan while ramify-agent assesses each committed candidate. The assisted execution has the same plan and job identity system as implementation and manual jobs. The coordinator chooses the iteration sequence; the harness retains iteration starts, linked assessment records, audit evidence, Pi review and findings. See [Plan 47](plans/47-agent-assistance/main-plan.md) and its [implementation record](plans/47-agent-assistance/implementation-results.md).

## Prepare and connect

For a persistent coordinator on the supported Linux devcontainer, run from this harness checkout:

```sh
node --import tsx src/main.ts coordinate start --project /absolute/target --plan my-plan --replace-mcp ramify-agent --json
node --import tsx src/main.ts coordinate status --project /absolute/target --json
node --import tsx src/main.ts coordinate watch --project /absolute/target --id coord-UUID --after 0 --json
```

Name each existing standalone RA MCP entry with repeatable `--replace-mcp`; inspect your effective configuration for their exact names. The host disables those entries only in its dedicated Codex process, adds a separate authenticated loopback HTTP entry, and verifies its effective configuration and tool set before input. All Codex coordinators and native workers run with full access (`sandbox_mode = "danger-full-access"`, `approval_policy = "never"`); thread start and resume explicitly establish that policy. The host preserves global configuration, unrelated MCP entries and instructions without rewriting shared settings. Full access does not authorize publishing, pushing or protected changes. Python 3 and Linux `/proc` are required for owned descendant settlement. Choose `--model` (default `gpt-6-astra`), `--worker-model` (default `gpt-6-sol`) and optional `--assessment-model` using available credentials. `--skill` selects an existing coordinator skill; `--message-file` adds task directions without placing them in process arguments.

The detached host owns one project lock, one assistance service and a persistent provider. Terminal and observer disconnects leave execution running. Repeating start for the same live plan/job returns its identity; `--job` selects an existing registration. Ambiguous registrations are reported for selection. An existing live standalone owner is left running. Start returns after the initial turn acknowledges; startup errors retain any registered job and thread for inspection. A launch timeout leaves the host running and reports uncertainty. Status reports unreachable retained observations as stale; staleness does not authorize replacement. Use explicit `coordinate resume` after interruption; no host automatically restarts or continues an ended turn.

The agent that launches the host remains its external observer while authorized plan work is unfinished. Launch acknowledgement is not completion or a handoff. Keep observing until completion, an actual user decision boundary, or an acknowledged transfer to another live observer. On an ordinary terminal provider turn, inspect status, pending requests, assessments and uncertain operations; if the host is healthy and idle with authorized work remaining, continue through `coordinate send` with a new stable command ID. Preserve explicit stops and unknown delivery outcomes. A detached host retains state, but it cannot ensure supervision after every external observer disappears.

Use `send --id <id> --message-file <path> --command-id <stable-id>` for an idle turn. Use `respond --id <id> --request <pending-id> --response-file <path> --command-id <stable-id>` for a specific provider request. Response JSON is `{"kind":"approval","choiceId":"<offered-choice-id>"}`, `{"kind":"user-input","answers":{"<question-id>":["answer"]}}` or `{"kind":"mcp-elicitation","action":"accept","content":{}}` for an inspected empty consent form. Other supported primitive forms require content satisfying their displayed schema; `decline` and `cancel` omit content. The provider validates offered choices, questions and form content, including generation and turn identity; URL and unsupported requests remain visible. The host never answers automatically. Retry the same command ID and exact arguments after a lost reply. An uncertain delivery is retained and is never blindly redelivered.

`interrupt --id <id> [--turn <turn-id>]` requests coordinator-turn interruption; its receipt does not establish descendant or assessment settlement. `stop --id <id>` settles owned provider execution before closing assessments and releasing project ownership. Unconfirmed provider settlement leaves the host and lock available for inspection. The CLI also waits for whole-host guardian settlement; missing acknowledgement remains uncertain even after the host stopped. Both accept optional stable `--command-id`. All commands also require `--project` and support `--json` and `--timeout-ms`; a control timeout does not cancel execution. Ctrl-C during watch cancels observation only. Watch cursors outside retained bounded progress return a gap and current snapshot. Status reports host, turn, worker equipment and assessment state independently; an idle thread is not plan acceptance.

Continue after provider exit, coordinated stop or host failure:

```sh
node --import tsx src/main.ts coordinate resume --project /absolute/target --id coord-UUID --command-id resume-once --json
```

Resume stops a reachable previous owner, verifies whole-host descendant settlement through its dedicated Linux guardian, and launches a new host for the same job and baseline. An alive unreachable owner or a guardian that died without settlement acknowledgement refuses replacement; known PID disappearance alone does not prove all writers stopped. A legacy host without guardian evidence must have a confirmed coordinated stop. Resume preserves partial files and retained model/worker/assessor/skill settings. Optional `--model`, `--worker-model`, `--assessment-model`, `--skill`, `--codex-executable` and `--message-file` select explicit continuation settings. Replaced MCP names are retained; extra `--replace-mcp` names add to them, and earlier generated HTTP entries remain disabled. The current endpoint and credential are supplied again to the persistent thread and verified before input.

Available history reuses the recorded thread. A confirmed missing-history RPC permits a fresh persistent context; other failures remain errors. `--fresh-thread` explicitly selects a fresh context using the same captured task and authority. Recovery observations show the strategy and uncertain prior command identities. Retry a lost resume reply with the same previous ID, command ID and options. That retry observes its admitted successor even after the successor stops or later generations exist; it cannot restart stopped work. A new continuation must select the latest coordinator ID; a stale ancestor is refused. Old send/respond admissions are not replayed: completed receipts retain their outcome, missing outcomes remain uncertain and conflicting arguments fail. A different message needs a new command identity after ordinary current-state inspection.

After an early startup failure, resume the failed coordinator ID shown by status. Its verified job, task directions and settings remain available even if no listener or thread was created. A pending explicit fresh-context choice survives that failure. Status and explicit recovery follow the committed continuation history when startup ended before its latest-coordinator index was updated; no manual retained-state edits are needed.

Host resume leaves interrupted assessments pending. Inspect their existing IDs, then explicitly call `assessment_resume` when needed; do not submit duplicate assessments or recapture a baseline. Independent iteration/final assessment remains mandatory for the exact candidate. Runtime continuity is qualified for the running Linux devcontainer; arbitrary client cleanup policies or destruction of the guardian without settlement evidence are not assumed safe.

When supervisor or runtime replacement is required, the external observer uses `coordinate resume` with the exact retained job, baseline, settings and retry identities after confirmed writer settlement, then verifies the successor. The coordinator should retain a concrete restart note naming the pending action and uncertainties; it cannot reliably replace its own ancestor supervisor. “Run externally” is an instruction to that observer, not an acknowledged transfer. Idle, stale status or a timeout alone establishes no need for replacement or completion.

Runtime credentials are held in a private `runtime.json` beneath a mode-0700 coordinator directory. Public records, command receipts and bounded progress exclude credentials and full provider conversation history. Private task directions and guardian evidence are retained as mode-0600 `task.json` and `guardian.json` in the owned coordinator directory. Initial launch requests, guardian evidence and independent diagnostics use a mode-0700 temporary directory; execution and later settlement do not depend on that temporary directory. Protect access to the local account and these files. No remote listener or browser UI is provided.

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

For cumulative acceptance, separately call `iteration_assess` with `kind: "final"`, the registered IDs, explicit `base` and `candidate`, whole-plan `brief` and `acceptance`, a fresh `command_id` and `plan_baseline` equal to the original execution baseline. The first final review compares the whole plan, including applicable fixed and nonfunctional requirements, with the current candidate; an iteration base never replaces that baseline. After selected repairs, submit another final assessment with `previous_assessment` naming the prior final assessment. It follows the repair and relevant surrounding behavior using existing results, with the complete original plan available on demand. It may broaden inspection for concrete new circumstances. `review_reason` requests and records a purposeful extra broad review.

`assessment_status` reports queued, running, interrupted, cancelled or completed state without starting work. Prefer `assessment_wait` for passive observation as described below. A completed assessment has an `assessment_result` with `gate`, concise summary, repairs, decisions, gaps, evidence references and `completedAt` when recorded. `assessment_detail` also retains `requestedAt` and optional `completedAt`. Use `assessment_detail` when the compact result lacks evidence needed to act. `assessment_resume` explicitly resumes an interrupted assessment using retained stages. `assessment_cancel` stops only the named assessment. Retain the same command ID when retrying a request; do not submit a new candidate merely because a transport response was lost.

`finding_list` shows retained findings and pending choices for the assisted job. `finding_answer` records an already-authorized user's selection of one offered option for an existing pending request. Supply its `assessment_id`, `check_finding`, `request`, `option`, actual `user_name`, governing `authority` reference and a retryable `command_id`. Use it only after the user has made that choice and the cited record actually authorizes it. It records the answer; it neither edits source nor waives a required check. Material choices without authority remain for the user.

When a completed assessment reports a protected change that the user explicitly authorizes retaining, call `protection_accept` with its `plan_id`, `job_id`, `assessment_id`, exact `path`, actual `user_name`, governing `authority` reference and a retryable `command_id`. The service records the offered choice and the user's answer against the before and after Git entries in that assessment's protection stage. Complete the applicable final assessment before asking the user to approve, or run it while the user considers the exact diff shown inline. Approval should be the final ordinary step. New assessments retain `approval-readiness` evidence bound to the exact candidate, original baseline, captured plan, requirement inputs and prerequisite stages. `protection_accept` records an append-only `finalization` with the choice in the same transition, deriving the effective result without repeating audit, Git inspection or Pi review. `assessment_result` exposes that result and its provenance; `assessment_detail` preserves the original outcome and adds `finalizations`. Retry returns the original receipt and finalization, including after restart. A later candidate must receive a fresh assessment (another iteration end for a repair); an exception applies only while its exact before and after entries match. A different edit remains actionable. Restoring the original baseline content also clears the check without an acceptance. The reviewer may mark an unmet requirement with `pendingProtection` only when those exact factual protected paths are its sole remaining condition and all other obligations are satisfied. Finalization resolves only those typed dependencies and corresponding protection obligations. Other unmet requirements, semantic concerns, audit failures, missing evidence and partial approvals remain blocking. Historical reviews without readiness evidence or typed dependencies keep their original result. Authorized historical failures remain factual findings; authorization does not fabricate a passing check witness or a repair. This command records an existing user decision; the coordinator must not invent that decision or treat its own explanation as authorization.

The `clear` gate means required checks and assessment completed for that submitted candidate with no remaining material action under the declared policy. `action-required` names established repairs or decisions. `incomplete` names required evidence that was unavailable or invalid and may also retain established defects. A failed required audit and an unresolved protected change prevent `clear`. Pi's review does not authorize a protected edit or a weaker requirement. An exact accepted decision must identify the before and after Git entries; it does not change the original baseline. A repair is a new candidate and assessment, not a relabeling of old evidence.

Native workers may edit across modules when the task requires it. Module focus concentrates context but adds no write boundary. The project decides whether and how candidate commits are authorized; assistance only inspects committed source and does not commit, merge, publish or update a tracker. The optional [coordinator skill](../.agents/skills/ramify-agent-coordinate/SKILL.md) and [module-work skill](../.agents/skills/ramify-agent-module-work/SKILL.md) capture this division of work.

Under those skills, Sol workers assigned directly by Astra may delegate bounded work to one additional level of Sol subagents. Children inherit the parent's module focus unless their brief explicitly selects another module or a broader focus; API availability always follows the actual consuming source. The parent notifies Astra of the delegation, coordinates edits, integrates results and verifies the complete outcome. Children may not delegate further. All work remains in the existing iteration, with Astra responsible for candidate assessment and plan coordination.

## Passive waiting

Use a maximum 15-minute wait, returning early when work needs attention. The native coordinator and parent Sol workers wait on their workers' messages/completion with `wait_agent`; workers use interruptible process waits for local verification. When a host caps process waits below 15 minutes, use its longest supported wait instead of repeated one-second checks. Worker handoff ends the worker turn; only the coordinator observes the RA assessment. A deadline triggers a status/health check, not automatic cancellation, restart or acceptance.

Call `assessment_wait` with the same `plan_id`, `job_id` and `assessment_id` as status reads. `timeout_ms` defaults to `900000` and accepts integers from zero to `900000`; zero is an immediate observation. The result includes the status fields (`id`, `status`, `revision`, `error`, `stages`) and `reason`: `settled` for completed, interrupted or cancelled work, or `timeout` with the current status. Routine stage progress does not end the default wait. For explicit progress observation, supply `after_revision`; a newer revision returns `changed` immediately, including if it was recorded before the call. A settled assessment always returns `settled`. After completion, retrieve `assessment_result` for the effective gate and any decisions; settled does not mean clear. Decisions become available with the completed result, not through speculative mid-review notifications.

The service waits on committed transitions without polling or launching work. Cancelling the MCP request releases only that observation; `assessment_cancel` remains the explicit assessment cancellation operation. Closing the service rejects pending observations and retains the existing interruption/recovery behavior. Reconnect using the same job and assessment IDs.

Configure the client deadline above the server wait. In Codex, add `tool_timeout_sec = 930` to the existing `[mcp_servers.<your-ra-server>]` entry. An official SDK client uses `client.callTool(request, { timeout: 930000 })`. A wrapper must also allow that duration. These are observation deadlines, not audit or provider execution limits. See the [official Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

Codex's periodic-commentary instructions may otherwise encourage minute-by-minute wake-ups. Add this to top-level `developer_instructions` in the effective Codex configuration, preserving any existing instructions:

```toml
developer_instructions = """
During passive waiting for commands, subagents or assessments, the periodic
commentary requirement and guidance to avoid waits longer than 60 seconds do
not apply. Use interruptible waits of up to 15 minutes, returning early on
completion, actionable messages, errors or user input where supported. Respect
tool limits; use the longest supported wait when it is shorter. Do not wake
solely to narrate unchanged status. On a 15-minute timeout, inspect status and
investigate concrete signs of trouble; continue waiting when healthy. Timeout
alone never authorizes cancellation or restart. Report meaningful changes,
blockers, decisions and completion. Keep normal updates during active work.
"""
```

Reload the client/start a fresh session and verify the effective coordinator and worker instructions. Existing sessions may retain their captured instructions. This is a host preference; the skills cannot override higher-priority instructions. The service tests verify early return, timeout and cancellation behavior, not whether a particular Codex client honors this preference or saves tokens.

## Evidence and current limits

The [assistance child](../subs/harness/subs/assistance/README.md) owns service, store, assessor and transport together. The root executable consumes its supported startup facade through harness. The harness records assessment stages under the assisted job in `plans/<plan-id>/.harness/jobs/<job-id>/`. Audit uses the installed ramify-audit provider and committed configuration, retaining requested and reused source identities. Protection compares every candidate with the registered baseline through Git tree entries and name/status differences. Document discovery can read the captured plan plus baseline companions and principles through Git; a filename alone does not establish adoption. The concise MCP result points to retained detail when needed.

Iteration timing uses server call times. Derive time to first candidate from the first linked assessment's `requestedAt` minus `startedAt`; assessment elapsed time from `completedAt` minus `requestedAt`; and time to a clear candidate from that clear assessment's `completedAt` minus `startedAt`. When recorded approval supplies the clear result, use `finalization.finalizedAt` for its acceptance time; the original `completedAt` continues to measure assessment completion. Count linked assessment IDs for attempts. These intervals include waiting and interruptions; parallel intervals cannot be summed into plan duration or active effort. Missing historical timestamps remain absent. Unfinished, interrupted and cancelled assessments have no completion time; resume retains submission time. Completion records a valid durable outcome for any gate, including `incomplete`. Clock inconsistencies remain visible in the raw timestamps; do not turn them into invented positive durations. A clear result covers only its exact candidate. Audit execution durations and reuse provenance retain their existing meaning; a historical execution duration is not current retrieval cost.

Plan 47 runtime implementation has passed its committed configured audit and a native Sol repair pilot through MCP and Pi. The [implementation record](plans/47-agent-assistance/implementation-results.md) separates scripted validation from live client and provider evidence, and lists unresolved qualification work. The pilot validates the workflow on this project; it does not establish comparative time or context savings.


Review an iteration once, then choose useful work. `finding_decide` records `fix`,
`leave` or `defer` with a short coordinator rationale; it does not impersonate a
user approval. A discretionary finding need not force another engineering
assignment. Existing unmet requirements and failed required checks retain their
meaning. A failed audit returns diagnostics directly before semantic review or
reconciliation. Corrections normally receive focused follow-up, or configured
verification alone when no semantic repair remains. `review-policy` distinguishes
broad, focused-follow-up and deliberately not-run work. `review_continue` can
record the coordinator's reason to continue an unavailable advisory review while
retaining that unavailable result and substantive unresolved obligations.


Final review is a separate plan-level assessment of completeness, integration,
remaining fixed/nonfunctional obligations and architectural quality. It starts
with the complete captured plan and compact recorded iteration outcomes, not an
embedded cumulative patch. Full earlier reports, iteration diffs, the cumulative
diff and source remain available on demand. The reviewer can cite supplied accepted
iteration review `evidenceRefs` with an explanation of applicability instead of
re-inspecting unchanged behavior. Accepted review evidence can still contain unmet
requirements or pending protection choices; those do not disappear through
citation. Later changes, conflicting evidence, unresolved limitations or concrete
integration concerns justify revisiting earlier behavior. Architectural findings
should name practical consequences and the smallest useful correction. Final
repair follow-ups remain focused.
