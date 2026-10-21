# Assisted service contract

## Persistent coordinator host

`coordinate start` owns a dedicated host per target checkout. It acquires the existing project lock before registration or provider creation, binds an authenticated loopback HTTP listener and verifies its identity before provider launch. Repeating start for a live matching plan/job observes that host; concurrent launches cannot create competing owners. An existing owner is refused without cancellation. Ambiguous existing execution identities require explicit job selection. A supplied job is verified and reused without recapturing the plan or baseline. A newly registered job remains retained if later provider preparation fails.

One host owns one assistance service and assessor runtime. Official SDK HTTP MCP sessions reuse the existing tool registration and shared service. Session closure and cancelled wait/watch requests release only observation resources. They never close the service or cancel an assessment. Standalone stdio behavior remains supported. The listener accepts only its exact loopback Host and, when supplied, matching Origin. All operations require a private bearer credential. HTTP request, socket, keepalive and observation deadlines accommodate a 900000ms assessment wait with margin; the required provider HTTP MCP tool timeout exceeds 900 seconds.

The provider receives launch-only overrides disabling each explicitly named replaced MCP entry and adding a distinct required HTTP entry. Effective configuration verification rejects an inherited command under that HTTP name, missing tools, enabled replaced entries or insufficient tool timeout. It runs before initial input and for the loaded persistent coordinator. Worker equipment observations report verification or an explicit error. User model selection, instructions, unrelated tools and permission policy remain effective. Persistent thread identity is retained before implementation input. The initial message supplies the exact registered execution; the coordinator verifies it through `job_detail` and does not register it again.

Coordinator observations live under ignored `plans/.harness/coordinators/<id>/`: a small atomic record, private runtime credential and append-only command receipts using the existing ledger. Public observations contain identities, selected models, provider version, host phase, independent turn/worker/assessment state, pending requests and bounded progress with cursors. They exclude credential values, request headers, hidden reasoning and full tool payloads. Provider history remains authoritative conversation storage. Runtime directories are mode 0700 and credential files mode 0600. An unreachable host returns stale observations; a stale timestamp or failed connection never establishes safe replacement authority.

Controls are `send`, `respond`, `interrupt` and `stop`, bound to a retained host generation. Durable command admission precedes provider mutation. Concurrent identical command IDs share one result; changed arguments conflict. Lost replies may be retried only with the same identity and arguments. An uncertain provider delivery or failed receipt persistence is not redelivered. Responses name the exact pending provider request and an offered choice, validated question answers or schema-validated MCP form content. Supported MCP forms have at most 32 declared primitive fields (string, finite number, integer, boolean or string array); accepted content must satisfy the provider's schema and name only declared fields. Decline/cancel submits no content. URL, nested and unsupported form requests remain visible without an invented answer. No observer or host automatically approves a request. Operator response content is hashed for admission and omitted from progress and receipts.

Send refuses busy execution without queueing. Interrupt names a specific turn and reports parent acknowledgement separately from descendant and assessment settlement. Stop prevents later startup admission, settles owned provider processes before closing the service and releasing ownership, and retains ordinary interrupted-assessment records. Unconfirmed descendant settlement retains ownership and an unsettled observation. Provider exit leaves the host and assistance service available for status and explicit controls. CLI timeout or observer disconnect does not stop execution. Watch returns bounded progress, an explicit cursor gap and a current snapshot. Turn completion does not establish final-plan acceptance.

`coordinate resume --id <previous-id>` explicitly continues the same registered plan/job and original baseline. It preserves staged, unstaged and untracked source. A reachable live owner is stopped through its authenticated control and retained stop receipt. An alive but unreachable owner is refused. The detached host runs beneath a dedicated Linux subreaper guardian covering provider, worker, assessor and command descendants. The guardian initially uses the private launch directory, then retains its private atomic receipt in the owned coordinator directory before provider creation, bound to its generation and guardian/host process start identities. Later settlement does not depend on ephemeral launch files. Replacement requires the previous host tree's confirmed settlement and an exited guardian. The stop CLI waits for that guardian acknowledgement after the host response; an acknowledged stop with unconfirmed whole-tree settlement reports uncertainty. A dead guardian without acknowledgement leaves orphan ownership uncertain and refuses replacement; old timestamps, missing sockets and disappearance of known PIDs are insufficient. Legacy hosts without a guardian support continuation only after an explicitly confirmed coordinated stop, never inferred crash settlement.

The replacement acquires ordinary project ownership and loads the same assistance job, without registration or baseline replacement. Its endpoint, credential and HTTP MCP name are new. It preserves retained model, skill, task directions and explicitly replaced MCP names, also disabling preceding generated HTTP entries with complete valid HTTP transport tables. It can reuse the latest available ancestor thread across an intervening failed startup that retained no thread. Thread start/resume receives the current MCP configuration explicitly and verifies loaded equipment before input. It reuses the retained persistent thread when available. A concrete missing-history RPC can start a fresh persistent thread; transport failure, uncertain resume acceptance, incompatible equipment and permission errors never trigger that fallback. `--fresh-thread` explicitly selects fresh persistent context. Every new thread remains non-ephemeral and is retained before input. Recovery reports the thread strategy and any unavailable-history reason.

Prior send/respond admissions remain referenced through retained coordinator receipts. Completed receipts return their original result; an admitted mutation without an outcome remains uncertain and cannot be delivered again under that command identity. Conflicting arguments still fail. Resume submits a distinct current-state continuation instruction rather than replaying prior messages or approvals. It retains task directions privately, tells the coordinator to inspect current source and job state, and preserves existing decisions and candidate-bound acceptance obligations. Pending provider responses from an old generation cannot settle a new request.

Interrupted assessments remain interrupted after service recovery. Neither host resume, reconnection nor a new thread automatically resumes or replaces them. The coordinator inspects existing assessment identities and explicitly invokes ordinary `assessment_resume` when their work remains required. Iteration and cumulative final assessment retain their existing authority and exact-candidate semantics. No finished turn, provider exit, settlement receipt or successful host resume establishes acceptance.

## Assisted execution operations

The harness owns assisted execution records under the same `plans/<plan-id>/.harness/jobs/<job-id>/` directory as implementation and manual jobs. An assisted job has kind `assisted`, the existing job schema version and job ID format, a captured `input/plan.md` with its SHA-256, the project identity, and frozen protection rules, Git baseline and setup gaps. `plan_start` reads only `plans/<plan-id>/plan.md`; it does not start the implementation driver.

The MCP stdio command is `ramify-agent mcp --project <root>`. It uses the existing project lock, so it cannot write beside another owner. The service owns all durable state; the MCP adapter validates arguments and forwards operations. Its operations are:

| Tool | Behavior |
| --- | --- |
| `plan_start(plan_id, execution, command_id, protection?)` | Registers a new assisted job. The optional policy adds explicit paths, exclusions, guarded paths and an additions rule; the default project guards remain enforced. Repeating the same command returns the original identity, while changing policy under the same ID conflicts. |
| `plan_executions(plan_id?)` | Lists implementation, manual and assisted job identities and kinds from the shared job directories. |
| `job_detail(plan_id, job_id)` | Reads the registered job, captured plan, baseline, protected-input gaps and native iteration starts with linked assessment IDs. |
| `iteration(action, plan_id, job_id, command_id, ...)` | Records a native iteration start or submits a candidate using that immutable start. Both actions are retryable; neither adds a write scope. |
| `iteration_assess(plan_id, job_id, base, candidate, brief, acceptance, command_id, ...)` | Resolves Git commit IDs and admits a background assessment, returning its ID. A final assessment also names the original plan baseline. `previous_assessment` must belong to the same job. |
| `assessment_status`, `assessment_result`, `assessment_detail` | Read an assessment without starting work. Result is absent until completion; detail includes retained stage evidence. |
| `assessment_wait` | Observe committed assessment transitions until settled or a bounded deadline; optional revision observation includes progress. Never starts, resumes or cancels assessment work. |
| `assessment_cancel`, `assessment_resume` | Cancel only the named assessment, or explicitly continue interrupted work. Reconnection alone never continues work. |
| `finding_list` | Reads the job's current findings and pending choices. |
| `finding_answer` | Records an already-authorized user's answer to an offered option, with the actual `user_name`, governing `authority` reference and a stable `command_id`. It makes no source edit or automatic waiver. |
| `protection_accept` | Records an already-authorized user's acceptance of one exact protected change. It binds the path, before and after identities, current required protection finding and stage evidence, then persists a request and answer in one ledger transition. |

Tool arguments use snake_case. Successful responses carry the service value in `structuredContent.result` and as JSON text; service fields use camelCase (`planId`, `jobId`, `assessmentId`). `assessment_result` returns `null` until an outcome exists.

`iteration` has two strict action shapes. Start accepts `action: "start"`, `plan_id`, `job_id`, `command_id`, nonempty `brief`, `focus_module` (a project-relative module path or explicit `null`) and optional `base` Git revision. End accepts `action: "end"`, the same job and command identifiers, `iteration_id`, an exact full `candidate` commit, optional `acceptance` (default `[]`), `requirement_documents` (default `[]`), `previous_assessment` and nonempty `additional_context`. End does not accept replacement base, brief or focus. A focused declaration never restricts cross-module edits.

Start returns the immutable `{schema: "ramify-agent.iteration/1", id, planId, jobId, startedAt, base, brief, focusModule, provenance}`. IDs have the form `it-<UUID>` and belong to exactly one job. `base` is the full resolved commit. `provenance` contains `baseSource` (`"head"` or `"explicit"`), `requestedBase` (explicit revision or `null`), `checkoutHead` and `checkoutHeadAfter` (full observed commits or `null`), `cleanliness` (`"clean"`, `"dirty"` or `"unknown"`) and `cleanlinessError` (unavailable-status reason or `null`). Cleanliness includes staged, unstaged and untracked changes. A dirty start is allowed and qualifies attribution because the initial commit omits existing edits. Unavailable status remains unknown. Invalid revisions are input errors. Default-base capture requires matching HEAD observations and resolved base; an unavailable or moving HEAD rejects registration. An explicit base retains the independent HEAD observations, including movement or unavailability. Start creates no source commit, snapshot, implementation, Pi session or audit.

End retrieves the original base, brief and focus and composes the same assessment admission and pipeline as `iteration_assess`. Its response remains `{planId, jobId, assessmentId, status}` and returns before assessment completion. The effective assessment request retains `iterationId`, `focusModule` and optional `additionalContext`; additional context supplements the stored outcome in assessment. Unknown or wrong-job iterations are rejected without assessment work. End means ready for checking, never accepted. A repair is another end with the same iteration ID, a new candidate and command ID, and optional `previous_assessment`; it preserves the original base and start time. Each comparison from that base is cumulative; Git comparisons between successive candidates describe repairs.

`job_detail` preserves `job` and `planMarkdown` and adds `iterations`. Each entry includes its start record, linked `assessmentIds` in submission order and `status`: `"started"` when no assessment was submitted, otherwise `"submitted"`. Submission status does not imply a completed outcome. Multiple iterations may remain open; there is no implicit current iteration, abandonment or completion classification. Old assessments without an iteration record have unknown focus and implementation timing. Immutable start files are materialized at `iterations/<id>.json`.

Each assessment captures the submitted base and candidate commit, brief, acceptance references, requirement document versions resolved to full Git commits and optional prior assessment ID. Requirement document paths are project-relative. Its immutable revision files are under `assessments/<id>/rev-<revision>.json`. Stage evidence is materialized at `assessments/<id>/stages/<stage>.json` in the same ledger transition. Finding reports and decisions use the existing CheckFinding domain and materialized records under `check-findings/` in that job.

The generic `events.jsonl` ledger is the commit point for registration, iteration starts, assessment transitions, stage evidence and finding decisions. Command hashes and receipts are reloaded from it after restart. Command replay precedes volatile Git observations: identical start retries retain their ID, timestamp and base after restart or HEAD movement, and identical end retries retain their assessment without relaunch. Changed arguments under an accepted command ID conflict. Iteration starts use the same command receipts, ledger commits and recovery as assessments. A missing materialized record is repaired from the ledger; a queued or running assessment found on service startup becomes interrupted and waits for explicit resume. Completed stage evidence survives continuation. A stable finding operation key prevents duplicate decisions if a process stops after committing findings and before recording a later stage.

The service's assessor callback receives the captured job, assessment, plan, abort signal, durable stage checkpoint, prior assessment records and current findings. It returns `clear`, `action-required` or `incomplete` with concise repairs, decisions, gaps and evidence references. The transport never infers `clear`: absent assessment capabilities produce `incomplete`.

`requestedAt` remains the assessment's original submission time through interruption and resume. A new optional `completedAt` records the service time in the same durable transition as a valid completed outcome for every gate, including `action-required` and `incomplete`. It appears in assessment detail and, when known, additively in `assessment_result`. Queued, running, interrupted or cancelled work without a completed outcome has no completion timestamp. Historical records without this field remain readable and expose its absence; replay preserves committed times.

Elapsed intervals can be derived from these records: first linked `requestedAt` minus `startedAt` is time to first candidate; `completedAt` minus `requestedAt` is assessment elapsed time; a clear candidate's `completedAt` minus `startedAt` is time to a clear candidate. Linked assessment identities count attempts, excluding retries. These include waiting and interruptions and never imply active effort. Parallel intervals are not additive plan duration. Clock inconsistencies remain visible rather than being replaced with positive durations. Git commit times are not service call times. A clear result applies only to its exact candidate. Existing audit counts, durations, selection, provenance and reuse references retain their meaning; historical audit execution duration is not current retrieval cost. Final-plan assessment continues to use the original registered plan baseline independently of iteration starts.

## Blocking assessment observation

`assessment_wait` identifies the exact assessment with `plan_id`, `job_id` and `assessment_id`. Optional `timeout_ms` is an integer from zero to 900000, default 900000. Unknown identities and invalid options fail without launching work. Optional `after_revision` is a positive integer; without it, stage checkpoints do not end the wait.

The result contains the same `id`, `status`, `revision`, `error` and `stages` as `assessment_status`, plus `reason`. Completed, interrupted and cancelled assessments return `settled` immediately. Otherwise, an explicit `after_revision` below the current revision returns `changed`. A deadline returns `timeout` with the current status; it does not imply failure. A zero timeout observes immediately. Settled state takes precedence over revision progress. Callers retrieve the effective gate separately through `assessment_result`; a completed assessment can require decisions or repairs or retain evidence gaps.

Observation subscribes to committed transitions and checks the current state without an intervening asynchronous gap, so a transition preceding subscription is not missed. Multiple observers are independent. Waits write no records and do not restart, resume or cancel assessments. Timers and subscriptions are released on return or request cancellation. Aborting an observation affects only that observation. Service shutdown rejects pending observations and preserves ordinary assessment interruption/recovery. A client deadline must exceed the requested wait; transport expiry is not an assessment outcome.

## Focused assessment preparation

An iteration review initially receives the stored current goal, supplied acceptance
text, selected requirement-document references, candidate changes and earlier
findings and decisions. It does not eagerly traverse plan links, qualify transitive
references or deliver every principles document and the complete plan repeatedly.
A document's filename alone establishes neither applicability nor adoption. Original
plan and document bytes remain available on demand through `assessment_evidence`;
final review receives the complete captured plan and original plan baseline.
Historical document manifests and inline records remain readable as recorded.

Reviewers choose relevant inspection with snapshot conveniences and ordinary
`shell`, including compressed or large evidence. Shell commands run in a disposable
detached checkout of the intended candidate; each call starts at that revision and
uses the nested project's root when applicable. Reviewers are instructed not to
edit source. Shell access is not a write sandbox. Owned checkouts are cleaned after
command settlement, including failed commands.

Accepted reports answer supplied acceptance references with supported conclusions
and report meaningful limitations. Inspected/missing lists and `coverageGap` remain
readable for historical compatibility; no exhaustive inventory is required. Unread
or unavailable supplemental files do not automatically make an assessment
incomplete or create required repairs. A reviewer may identify an actual required
obligation as unmet or uncertain; those judgments and failed required checks retain
their existing outcomes. Full reports and limitations remain in stage evidence.

## Coordinator decisions and iteration follow-up

An iteration defaults to one broad review. Its corrections use the previous
assessment (explicit `previous_assessment`, or the latest completed assessment of
the same recorded iteration). Follow-up inspects selected repairs and relevant
surrounding behavior. If prior acceptance was met and no open findings or protected
conflicts remain, passing configured checks can finish a correction without another
semantic invocation. Otherwise the reviewer receives a focused follow-up brief.
A nonempty `review_reason` explicitly requests another broad review and records why.
`review-policy` stage evidence records broad iteration, final-plan, focused-follow-up or not-run work;
not-run work is never represented as a completed review. The first final assessment
receives the complete plan, including applicable fixed and nonfunctional requirements.
A subsequent final request naming that final assessment follows selected repairs and
relevant surrounding behavior using its existing results; it does not restart the
complete catalog by default. The original plan remains available on demand, and
inspection may broaden for concrete changed circumstances. A prior iteration
assessment does not replace the first complete-plan assessment. All final comparisons
retain the original registered plan baseline and exact candidate.

### Final plan review

The assisted final review is distinct from the broad iteration code/scope review.
It assesses whole-plan completeness, cross-iteration integration, remaining fixed
and nonfunctional obligations, unresolved findings and limitations, and
architectural quality: clean modularity without unnecessary complexity. An
architectural concern names a concrete practical consequence and the smallest
useful correction; speculative redesign, style preferences and reopening settled
decisions without new evidence are not useful final findings.

The first packet contains the complete captured plan, final audit/protection
state, known finding dispositions, changed file/module hints, and compact earlier
iteration outcomes, boundaries, candidates, conclusions and evidence references.
At most 30 recent assessment summaries are inline; the original records remain
available on demand. No cumulative patch is eagerly collected or embedded. Full
assessments, individual iteration diffs, the cumulative diff and candidate source
are available through ordinary inspection and `assessment_evidence`.

Completed, successfully submitted iteration reviews may support requirement
answers through optional `evidenceRefs`; `explanation` states why they apply to the
final candidate. References must name supplied accepted review stage records from
before this assessment. Only the final review's submission tool declares
`evidenceRefs`; an iteration review that names it is rejected as final-only, since
no accepted iteration evidence exists for it to cite. Final, future, interrupted, unavailable or unsubmitted
reviews cannot be invented as accepted iteration evidence. An action-required
assessment can supply accepted review evidence while its unmet/uncertain answers
and protection status remain explicit; accepted submission does not mean the plan
passed. A citation alone cannot resolve an unmet obligation.

Reuse these conclusions without fresh source inspection merely to repeat them.
Revisit behavior when later changes, conflicting evidence, unresolved limitations
or a concrete integration concern warrant it. The reviewer explains any resolution
of earlier unmet or uncertain answers. Exact protection authority and failed
required checks retain their meaning. Subsequent final repairs keep focused
follow-up; no evidence cache, automatic invalidation graph or new ledger is added.

A failed configured audit returns its diagnostic evidence after factual finding
and protection ingestion. It does not invoke semantic review or reconciliation.
Audit and protection stages and the deliberately unrun review remain visible.

Large audit outcomes are retained intact as verified content-addressed evidence beside the ledger. The compact audit stage records its state and exact requested/audited candidate identities plus the artifact reference. Resume and on-demand `assessment_evidence` reads verify and resolve that reference; historical inline stages remain readable. Readiness binds the recorded stage, without embedding the provider report again or changing the ledger line limit.

`finding_decide(plan_id, job_id, assessment_id, check_finding, action, rationale,
command_id)` records ordinary coordinator judgment after assessment completion.
Actions `fix`, `leave` and `defer` use existing repair-intent, waiver and deferral
records. The actor is the assisted coordinator, never an invented user answer.
A short rationale suffices. Decisions and command receipts survive reload.
Required check findings and pending user authority cannot use this command.
Independent unmet or uncertain acceptance answers remain effective even when a
discretionary suggestion is left or deferred. An unavailable follow-up retains
applicable prior acceptance answers and substantive gaps through the existing
assessment chain until a relevant submitted assessment resolves them. `assessment_result` projects the
remaining finding actions; original assessment evidence stays unchanged.

Reviewer context includes at most 20 recent findings with bounded titles,
dispositions and rationales. Reviewers avoid repeating unchanged issues and explain
meaningful changed circumstances if raising one again. Full existing finding
records remain authoritative; no additional ledger or issue matcher is introduced.

`review_continue(plan_id, job_id, assessment_id, rationale, command_id)` records the
coordinator's decision to continue when an advisory review or reconciliation is
unavailable. It cannot bypass running work, failed configured checks, protected
changes, substantive unmet requirements or other evidence gaps. Retained stages
still show the unavailable invocation; the effective result removes only its
availability gap. When exact user protection authority was recorded first,
continuation also derives an append-only finalization from retained readiness and
that authority. Both command orders preserve original receipts and assessment
records across reload. This is ordinary coordinator authority, not user approval.
