# Reading session observations

Plans 24/25 reuse existing machine-readable records and projections. No new
collector or benefit trial is required. Dan can use these observations to assess
orientation reuse and instruction/discovery delivery; they do not establish a
benefit themselves.

## Per-invocation access

Run records live under
`plans/<plan>/.harness/jobs/<run>/invocations/<invocation>/`. The existing API
serves `GET /api/v1/plans/<plan>/runs/<run>/metrics` and
`GET /api/v1/plans/<plan>/runs/<run>/sessions/<session>`. Metrics exposes
`evaluation.invocations[]`; session detail exposes `session.invocations[]`,
including each invocation's `evaluation`. Join on `invocation` and the existing
work-item/iteration/request identities. The Sessions page already shows the
corresponding timing, usage and exploration details.

| Observation | Existing location |
| --- | --- |
| Role and work identity | `invocation.json`: `role`, `work`; metrics evaluation also exposes role, work item, iteration and request. A reviewer's `request` is the review request its `review-attempt-started` names. |
| Task kind and procedure | The retained packet's current task section starts with `# Current task: <kind>` and selects `procedure:<role>:<family>` with its exact framed SHA-256. That body can be inherited rather than appended. See the correlation lookup below. |
| Actual instruction inputs | `invocation.json.prompt.manifest`, also `evaluation.efficiency.manifest`, preserves ordered inherited/appended entries, bytes, hashes, sources and inherited point. `/1` and `/2` are readable; new packets use `/2` with optional logical block key/effect. |
| Briefing updates | The operation correlation's `context.history` retains ordered occurrence revisions and optional canonical `contentHash`; `context.revision` selects the current occurrence. Equal content hashes can name distinct A → B → A occurrences. Packet additions record actual set/remove effects. |
| Discovery origin and comparison | `packet.additions` and retained context carry `brief:support:starting-points` producer/work/iteration/invocation/boundary origins and `brief:support:nonfunctional-source` captured comparison names/base/target/default. Inherited pointers need not appear again in current additions. |
| Requested and actual start | `invocation.json.session.requested`; `outcome.json.session.mode` when recorded. Session detail includes `operation.mode`, continuation/fork lineage and `degraded`. For a separate fresh fallback, `degraded.requested` retains the original fork/continue intention while the new operation's mode is fresh. |
| Fresh fallback reason | `session.invocations[].degraded.reason`, recorded start/outcome reasons, and the failed predecessor's outcome. Global append loss also appears as `brief-not-appended` in `events.jsonl`. |
| Elapsed time | `outcome.json.elapsedMs`; metrics `efficiency.timing.elapsedMs`, from recorded invocation boundaries. Milestone, model and tool durations have their own fields and coverage. |
| Provider usage | `outcome.json.usage`: `input`, `cacheRead`, `cacheWrite`, `output`, `total`, or `{ unavailable: ... }`. `observations.jsonl` retains per-call `usage` rows. Recorded charges, when supplied, expose `newInputTokens`, `cachedInputTokens`, `cacheWriteTokens` and `outputTokens` under `efficiency.charges[]`. |
| Exploration | `efficiency.exploration.metrics`: reads, unique files, repeated reads, searches, broad/outside-scope searches, returned bytes and observed elapsed sum; `zeroMatchSearches` and original observations sit beside it. `efficiency.exploration.searches` counts completed and failed searches, and gives the broad, outside-scope and zero-match counts each with its state and coverage. |
| Rejected submissions | `observations.jsonl` rows of type `rejection`: `callId`, `target`, `attempt` and the errors. `callId` is the submission call's, as its `tool-start` row names it; rows recorded before it was passed have `''`. |
| All tool calls | `observations.jsonl` rows of type `tool-start`; count their distinct `data.callId` within an invocation. Tool durations are separate `tool-duration` rows. Read/search subsets are the exploration counts above. |

To locate a retained task packet, read `invocation.json.sessionOperation.runId`
and `.operationId`. Its harness correlation is under
`plans/.harness/session-operations/correlations/operations/<hash>.json`, where
`<hash>` is SHA-256 of the UTF-8 bytes of JavaScript
`JSON.stringify([runId, operationId])`. Read `packet.message` or
`packet.additions`; no provider payload decoding is needed. Legacy invocations
without this correlation have no retained task-kind value here.

To distinguish physical delivery from logical state, count ordered manifest
entries by `delivery`. Superseded sets and withdrawals remain physical inherited
bytes. Replay `/2` block effects in order for effective state; do not label that
map as provider context size. The manifest hash covers its original serialized
entry representation, not a schema parser's reordered serialization. Current
message bytes exclude the separately delivered role and tool declaration.

Support-size projections count delivered source identities and unique briefing
content as defined by the scope-size policy, rather than summing every physical
manifest entry. Read those components separately from inherited/appended totals.
Original retries retain the exact old packet and manifest; legacy normalization
does not synthesize physical field deliveries or change historical provenance.

NFR comparison identities describe actual Git boundaries. `run-start` is absent
when original provenance is unavailable; dirty original captures exclude
uncommitted starting bytes. An empty accepted-boundary comparison can coexist
with historical run-start changes, and unchanged caller pointers can be useful
with either empty diff. Neither diff nor pointer provenance proves satisfaction.

## Coverage and interpretation

Missing provider usage, task correlations or timing endpoints remain unknown;
they are never zero. Read coverage fields and retain known subtotals separately.
Provider usage categories retain their recorded meanings. Do not infer uncached
input by subtracting categories unless that provider's accounting supports it.
A recorded fork does not guarantee provider prompt-cache reuse.

Exploration observations retain source identity across replay and inheritance.
The existing projection deduplicates them and excludes conflicting observations;
raw log analysis should likewise count original calls once. Returned output bytes
are not scanned/source bytes. Wall time is not the sum of parallel tool calls.

A call's `outsideScope` compares the scope it reached, or the path it asked for
where the tool reported none, with the invocation's roots: a writer's guarded
roots, or the directories of the modules a reader's declared scope selects, with
the global view where its profile includes it. Where neither is known the status
is `null`. The `metrics` counts of broad and outside-scope searches count only the
searches known to be so; read them with `searches`, whose `known` is the value
only where the state is `measured`. A count with an unknown status is `partial`
with its known subtotal and coverage, or `unavailable` where no status is known,
never zero. A zero-match count is over completed searches whose matched files
were reported; a failed search, such as a path that does not exist, is counted
apart and matched nothing because it searched nothing.

Run-level `lineage.metrics` groups actual fresh/continue/fork starts, with forks
of a local session in their own `fork.local` group, and preserves degradation
reasons. Its requested-start counts use `degraded.requested` for
separate fresh fallback invocations, while the operation remains fresh; [lineage measurements](lineage.md) defines those aggregates
and their historical generation/replacement inputs. Historical values remain
readable even though new context losses do not build replacement parents.


## Context continuity and recovery

`evaluation.context.observations[]` projects actual `context` observation rows:
current estimated `tokens`, model `window`, observation time and, when supplied,
`native` settings from `pi@0.87.1:SettingsManager`. Native settings name enabled
compaction, reserve and retained recent-history tokens. `projectedTokens` is a
separate prospective request estimate; `null` means Pi did not provide it.
Missing occupancy, window, settings or observations remain explicit coverage gaps.
These values are distinct from cumulative billed usage and cache charges.

`evaluation.context.compactions[]` projects native threshold, overflow or explicit
triggers, before/after estimates, success and actual errors. Transcript compaction
entries also retain effective native settings. Compaction's own preserved request
artifacts carry `purpose: compaction`; they keep their actual instructions,
dispatch identity and usage instead of being mislabeled ordinary task requests.
Opaque Pi state records `historyBoundary` and native session entries. Earlier
requests, transcripts, observations and old-point forks remain immutable. A
rewritten history boundary does not establish exact native prefix reuse. Neither
scripted requests nor smaller context establish real provider acceptance or cache
savings.

`resource-pending` keeps the assignment unfinished. Recovery inspection exposes
the retained boundary, original task evidence, current candidate/configuration,
accepted head, pending obligations and authority. Its continuity projection names
the trigger and predecessor, successor admission status, settlement/effect status
and current resume blockers. Unknown mutation effects remain unknown until the
owner reconciles them. A quiet interval or stop receipt is not proof of kernel
settlement, assertion failure or qualifying audit evidence. Read the responsible
producer's ordinary evidence for check outcomes.

Elapsed invocation/run time and counts remain observations. Continuity execution
reports `remaining.invocations` and `remaining.activeMs` as `null`, with effective
`run-policy/8` recorded separately. Earlier policies and terminal outcomes remain
readable; an explicitly admitted compatible legacy continuation records a policy
transition without rewriting the historical policy. Service restart retains a
recovery hold and supplies no new authority. Semantic submission rejection and
assessed correction rounds retain their independent meaning.

The historical Plan 43 cutoff used an effective 188,000-token trigger against
205,728 observed tokens; its recorded 150,000-token fallback was not the applied
trigger. These are historical failure evidence, never current execution limits.
