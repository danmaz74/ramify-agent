# Assisted plan assessment over MCP

Agent assistance lets a native coordinator and workers implement a real plan while ramify-agent assesses each committed candidate. The assisted execution has the same plan and job identity system as implementation and manual jobs. The coordinator keeps the iteration sequence; the harness owns assessment records, audit evidence, Pi review and findings. See [Plan 47](plans/47-agent-assistance/main-plan.md) and its [implementation record](plans/47-agent-assistance/implementation-results.md).

## Prepare and connect

The [coordinator skill](../.agents/skills/ramify-agent-coordinate/SKILL.md) is the starting point for native assisted implementation. The coordinator gives its Sol workers the [module-work skill](../.agents/skills/ramify-agent-module-work/SKILL.md). Both live in this checkout's `.agents/skills/`; when working on another project, load them by their absolute source paths or make them available in your user skill directory. Keep links pointed at a checkout containing this implementation. Loading a skill does not establish an MCP connection.

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

Once an iteration is implemented and a candidate commit exists, call `iteration_assess` with the same `plan_id` and `job_id`, `base` and `candidate` commit IDs, a concise `brief` describing the intended outcome, applicable `acceptance` references, and a fresh `command_id`. The service resolves the submitted commits and returns `assessmentId` promptly; pass it as `assessment_id` in subsequent calls. A later or repaired candidate can name `previous_assessment`. Pass `requirement_documents` as `{path, revision}` pairs when a specific source revision matters. For cumulative acceptance, set `kind: "final"` and `plan_baseline` to the original execution baseline; the final review compares the whole plan with the current candidate.

`assessment_status` reports queued, running, interrupted, cancelled or completed state without starting work. Poll at a useful interval. A completed assessment has an `assessment_result` with `gate`, concise summary, repairs, decisions, gaps and evidence references. Use `assessment_detail` when the compact result lacks evidence needed to act. `assessment_resume` explicitly resumes an interrupted assessment using retained stages. `assessment_cancel` stops only the named assessment. Retain the same command ID when retrying a request; do not submit a new candidate merely because a transport response was lost.

`finding_list` shows retained findings and pending choices for the assisted job. `finding_answer` records an already-authorized user's selection of one offered option for an existing pending request. Supply its `assessment_id`, `check_finding`, `request`, `option`, actual `user_name`, governing `authority` reference and a retryable `command_id`. Use it only after the user has made that choice and the cited record actually authorizes it. It records the answer; it neither edits source nor waives a required check. Material choices without authority remain for the user.

When a completed assessment reports a protected change that the user explicitly authorizes retaining, call `protection_accept` with its `plan_id`, `job_id`, `assessment_id`, exact `path`, actual `user_name`, governing `authority` reference and a retryable `command_id`. The service records the offered choice and the user's answer against the before and after Git entries in that assessment's protection stage. A later candidate must receive a fresh `iteration_assess`; the required protection check clears only if those exact entries still match. A different edit remains actionable. Restoring the original baseline content also clears the check without an acceptance. This command records an existing user decision; the coordinator must not invent that decision or treat its own explanation as authorization.

The `clear` gate means required checks and assessment completed for that submitted candidate with no remaining material action under the declared policy. `action-required` names established repairs or decisions. `incomplete` names required evidence that was unavailable or invalid and may also retain established defects. A failed required audit and an unresolved protected change prevent `clear`. Pi's review does not authorize a protected edit or a weaker requirement. An exact accepted decision must identify the before and after Git entries; it does not change the original baseline. A repair is a new candidate and assessment, not a relabeling of old evidence.

Native workers may edit across modules when the task requires it. Module focus concentrates context but adds no write boundary. The project decides whether and how candidate commits are authorized; assistance only inspects committed source and does not commit, merge, publish or update a tracker. The optional [coordinator skill](../.agents/skills/ramify-agent-coordinate/SKILL.md) and [module-work skill](../.agents/skills/ramify-agent-module-work/SKILL.md) capture this division of work.

## Evidence and current limits

The harness records assessment stages under the assisted job in `plans/<plan-id>/.harness/jobs/<job-id>/`. Audit uses the installed ramify-audit provider and committed configuration, retaining requested and reused source identities. Protection compares every candidate with the registered baseline through Git tree entries and name/status differences. Document discovery can read the captured plan plus baseline companions and principles through Git; a filename alone does not establish adoption. The concise MCP result points to retained detail when needed.

Plan 47 runtime implementation has passed its committed configured audit and a native Sol repair pilot through MCP and Pi. The [implementation record](plans/47-agent-assistance/implementation-results.md) separates scripted validation from live client and provider evidence, and lists unresolved qualification work. The pilot validates the workflow on this project; it does not establish comparative time or context savings.
