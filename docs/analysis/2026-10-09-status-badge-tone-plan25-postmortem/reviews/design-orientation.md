# Prompt review: reviewer `design-orientation`

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
model `openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision 474ffa58.

## Summary

The orientation (inv-0010, fresh session ses-0009, pi session
`6c97a9a3-b376-46a3-a90c-b9f8373b7fbb`) received everything it needed and did
its narrow task correctly in one model call: it named the three delivered
guidance paths and wrote an accurate summary, accepted on the first submission.
The prompt itself is adequate. The problem is what the orientation is for. It
exists so that later design reviews fork from a session that has already read
the guidance, but in this run it served exactly one design review (inv-0012),
and that review re-read all three guidance files with `snapshot_read` before
judging, as the reviewer role and design procedure require for any grounded
concern. The orientation therefore added one model call ($0.0249 estimated,
4,975 uncached input tokens, 7.09 s, one review slot) with no observable benefit
to the fork. It was not on this run's critical path. Smaller issues are about
3.4 KB of environment blocks that do not apply to an orientation with no read
tool, one of which points at a generated view the reviewer's tools refuse, and
a whole-file root README whose operational sections widened the summary beyond
design.

## Coverage

| ID | Value |
| --- | --- |
| Invocation | inv-0010 (kind `reviewer:orientation`, task `design-orientation`) |
| Harness session | ses-0009; pi session `6c97a9a3-b376-46a3-a90c-b9f8373b7fbb`, turn 1 |
| Orientation record | `J/reviews/orientations/ec7606cfbaf86b53.json`, key `ec7606cf…58727`, outcome `oriented` |
| Triggering request | rq-0003 (design review of wi-001.i01, candidate b999ea9) |
| Native requests | 1: `O/store/payloads/016f656c…eaccd` |
| Submission | `J/invocations/inv-0010/submission.json`, accepted, 0 rejections |
| Dependent fork | inv-0012 (ses-0010), reviewed separately in `design-review.md` |

All instances of this kind in the run are covered; there is only one.

Evidence read: `D/invocations/inv-0010/{task.md,packet.json,native-first.json}`,
`J/invocations/inv-0010/{invocation.json,observations.jsonl,submission.json}`,
`J/transcripts/ses-0009.jsonl`, `J/events.jsonl` (sequences 85 to 105), the native
payload above, and for explanation only the harness source at 474ffa58
(`subs/harness/src/prompts/reviewer.system.md`,
`reviewer-orientation.system.md`, `subs/reviews/src/inputs.ts`,
`subs/reviews/src/message.ts`, `src/run/service.ts` lines 1090 to 1600).

## Delivered prompt

The native request (`016f656c…`) carried 2,795 bytes of role instructions
(`reviewer.system.md`, reviewer/4), one tool (`submit_orientation`, 530 bytes as
declared) and one 17,761-byte user message. Block sizes in that message:

| Block | Bytes |
| --- | --- |
| briefing header, `brief:goal`, `brief:requirements` | 414 |
| `brief:support:design-guidance` (root README 10,669, workspace README 674, shared-ui README 524, plus headings) | 12,352 |
| `procedure:reviewer:orientation` | 1,032 |
| `environment:*` (projectRoot, workingDirectory, candidate, snapshot, limits, availableTools, views, supportPaths, cucumberConfiguration) | 3,504 |
| `# Current task: design-orientation` | 459 |

Provider usage for the single call: 4,975 input, 0 cached, 252 output. From
that call the request averages about 4.24 bytes per input token (21,086 bytes of
instructions, tool and message); section token figures below use that ratio and
are estimates, not provider measurements.

## Required information

| Need | Status | Evidence |
| --- | --- | --- |
| Objective | Met directly | `brief:goal` "Read the captured design guidance for wi-001."; procedure "Name in `read` every guidance path the message gives, and in `summary` what that guidance asks of a design" |
| Guidance content | Met directly | full text of the three READMEs in `brief:support:design-guidance`, each with a 12-hex hash |
| Authority and write scope | Met directly | role "You change nothing and decide nothing"; procedure "you have no tool but the designated submission tool" |
| Current state, candidate | Correctly absent | `environment:candidate` and `snapshot` are `null`; no candidate exists for an orientation |
| Dependencies, execution location | Not needed | no reads or commands possible |
| Verification expectations | Met directly | validation requires exactly the given paths, each once (`validateOrientation`) |
| Expected submission | Met directly | tool declaration carries the schema; the harness answers rejections with every error |
| Purpose of the summary for later work | Met directly | "Later, each design review of an iteration continues from what you have read here" |

Nothing required was missing, stale or inaccessible.

## Findings

### O1. The orientation cannot pay off in this run and is superseded by the fork's required re-reads

Severity: medium (efficiency and design of the step, not correctness).
Affected IDs: inv-0010, inv-0012, rq-0003, orientation key `ec7606cf…`.

Location and excerpts. The orientation procedure states the premise:
"Later, each design review of an iteration continues from what you have read
here." The role instructions it shares with the fork state the opposite for
evidence: "Inherited understanding never substitutes for current snapshot
evidence." and "Name only a file you read with `snapshot_read` in this review;
an earlier conversation, a search hit or a patch does not count". The design
procedure delivered to the fork repeats it: "Its ground is that guidance file,
read with `snapshot_read` in this review even if an earlier conversation already
showed it to you." The fork's guidance block adds: "If this session has not read
one of them yet, read it with `snapshot_read` before you judge."

Expected goal. A retained orientation should save each design review from
re-acquiring the guidance, and its cost should be recovered across several
reviews of the same guidance selection.

Observed mismatch. The run had one work item and one iteration, so rq-0003 was
the only design review. The orientation key includes the work item and the
README selection derived from the changed paths (`orientationKey`, scope
`workItem`; `guidancePaths`), so it could not be reused outside wi-001 in any
case. In the fork, the first model turn (`J/invocations/inv-0012/observations.jsonl`
n 3 to 17; native payload `029c8e00…` items 8 to 10) issued `snapshot_read` for
`README.md`, `subs/workspace/README.md` and `subs/workspace/subs/shared-ui/README.md`
in parallel with the changed files, returning 12,428 + 782 + 614 = 13,824 bytes,
before any concern existed. The inherited 12,350-byte guidance block and the
re-read copy were both in the fork's context.

Impact and confidence. The orientation call cost $0.0249 (4,975 new input
tokens, 252 output, 7,087 ms), against $1.187 for the run and $0.067 for the
design review. The fork then read 4,864 inherited tokens from cache on its first
call (cache share 0.42, prefix fully preserved per `summary.json`
`boundaries[inv-0012]`), and its second call carried them again as part of
11,264 cached tokens. In time, the orientation occupied one of the two
concurrently used review slots from 19:38:32.517 to 19:38:39.611 and delayed the
design review's start by about 7 s; the design review still finished
(19:38:49.104) before the code review (inv-0008, 19:38:53.729) and the
concurrent architect turn (inv-0011, 19:38:53.754), so the run's critical path
was unaffected. The facts are high confidence. That the orientation contributed
nothing observable to the review is also high confidence: the fork's first act
was to fetch the same guidance it inherited, and its reasoning summaries
("Assessing patch inspection design", "Confirming tone enum placement and
styling scope") do not show reliance on the orientation summary. Whether the
inherited reading improved judgment cannot be established from this evidence.

Correction direction. Either make the orientation's reading count, or do not
run an orientation where it cannot. Concretely: let a design review whose
guidance hashes match a recorded orientation cite that guidance as ground
without a fresh read, since the harness holds the captured text and can verify
quoted words against it; or run the first design review of a selection fresh
with the guidance in its own message and orient only when a second review of
the same key is actually requested. Keep the current fork if the project values
a fixed, cache-shared prefix more than one extra call per work item, but then
remove the re-read requirement for orientation-delivered guidance.

### O2. Environment blocks that do not apply to an orientation, one of them contradictory

Severity: low. Affected IDs: inv-0010 (and inherited by inv-0012).

Location and excerpts. `D/invocations/inv-0010/task.md`, environment blocks.
`environment:views` (1,168 bytes) lists the architect view path
`…/collection-review/.ramify-architect` with fifteen modules and coverage notes,
while the role says "a generated view such as `.ramify-architect/` are refused"
and the orientation has no read tool at all. `environment:limits` (1,075 bytes)
lists 29 run limits such as `maxWorkItems` and `repairRoundsPerIteration`.
`environment:supportPaths` (231 bytes) names
`subs/harness/src/prompts/reviewer.system.md` and
`reviewer-orientation.system.md`, which are harness source paths and do not
exist in the project the reviewer reads. `candidate`, `snapshot` and
`cucumberConfiguration` are `null`; `projectRoot` and `workingDirectory` are
absolute paths in a role with "no access to the working directory".

Expected goal. Each block should be something the agent can act on or needs to
know for this task.

Observed mismatch. About 3,357 bytes (roughly 0.8k tokens, estimated) carry no
information the orientation can use, and the views and supportPaths blocks
point at things it cannot or should not read.

Impact and confidence. No observed effect: one call, no tool misuse, accepted
submission. The bytes are a small part of a prefix the fork reads from cache,
so the cache cost is minor; relevance is the issue. The fork resets `views` to
`[]` and re-sends `limits`, which confirms the orientation copies are not needed
downstream. High confidence on content; no measurable impact.

Correction direction. Omit environment blocks for an orientation except
`availableTools`, or send them as `null`-free minimal values; never offer a
generated-view path to the reviewer role, whose tools refuse it; do not expose
harness-internal source paths as `supportPaths` to an agent that cannot read
them.

### O3. Whole-file root README widens the design standard with operational text

Severity: low (relevance only). Affected IDs: inv-0010, orientation summary.

Location and excerpts. `brief:support:design-guidance` includes the entire root
`README.md` (10,669 bytes) because `guidancePaths` adds every `README.md` on the
way to a changed path. By section: purpose 1,485; "Running it" 2,931 (commands,
the `NODE_ENV` build note, the K05 fixture explanation); "The scenario harness"
2,267 (quick/full modes, audit wiring, then the step and feature directory
conventions); "The ownership tree" 1,875; "Reading the descriptions" 630; "Trial
records" 401; "Independence" 1,080 (copy-out procedure and 2026-09-07 historical
evidence). The orientation summary then states that designs "must also retain
standalone dependency/configuration integrity, conventional test placement,
configured audit obligations, and validation through the project's structural
and declared command gates".

Expected goal. Design guidance for a change to one shared-ui primitive: module
purposes, the ownership and tag table, the relay role of `workspace`, and test
placement conventions.

Observed mismatch. Roughly 6 KB of the root README (running commands, mode
mechanics, trial records, independence and historical evidence) is operational,
and the summary folded gate and audit obligations into "what the guidance asks
of a design", although those belong to the gates and to other reviews.

Impact and confidence. No observed effect on the review, which raised no
concern and cited nothing. The text is cached in the fork. Medium confidence
that the broadening matters at all in a larger run; it is recorded because the
summary is meant to frame later design judgments. The fixture has no
`*.principles.md`, so the module prose is the entire standard; this is a
property of the project, not a prompt defect.

Correction direction. Keep whole READMEs (they are the project's module prose
and section selection would be guesswork), but tell the orientation to
summarize design rules only and to leave run, build and audit procedure out of
the summary.

### O4. No issue: instructions and tools were usable

Affected IDs: inv-0010. The role instructions describe `snapshot_diff`,
`snapshot_read`, `snapshot_list` and `snapshot_search`, which the orientation
did not have, but the orientation procedure states "you have no tool but the
designated submission tool named in the current task", `environment:availableTools`
lists only `submit_orientation`, and the native request declares only that
tool. The shared role text is what keeps the fork's prefix identical
(`instructionsEqual: true`), so the mismatch is deliberate and harmless. The
model made no other tool call, named all three paths, and was accepted first
time. The summary is accurate for the shared-ui and workspace responsibilities
("Shared UI must own reusable browser presentation primitives such as the status
badge, expose them through Workspace to both feature UIs, and keep them
inaccessible to non-UI core modules").

## Observed effects

The orientation ran from 19:38:32.517 to 19:38:39.611 (events 87 to 95), one
model call of 6,888 ms, one `submit_orientation` call, accepted. The design review
forked from its turn-1 checkpoint at 19:38:39.678 and its first act was to re-read
all three guidance files (see O1). No clarification, rejection, tool error or
repair is associated with this prompt. Causal: the orientation's cost and the
fork's duplicate guidance follow directly from the recorded procedure and
calls. Correlated only: whether the orientation summary influenced the review's
attention to "tone enum placement and styling scope"; the same points are
available from the re-read README and the delivered iteration approach.

## Correction suggestions

1. Resolve the conflict between the orientation's purpose and the grounding
   rule (O1): either accept hash-matched orientation guidance as citable ground,
   or orient only when a second design review of the same key is due.
2. Trim the orientation's environment to what an agent with only a submission
   tool can use, and never list `.ramify-architect` or harness source paths to a
   reviewer (O2).
3. Ask for a summary of design rules only, excluding run, build and audit
   procedure (O3).

## Evidence gaps

Reasoning content is encrypted; only one-line reasoning summaries are retained,
so the orientation's influence on the fork's judgment cannot be measured.
Section token counts are byte-ratio estimates from one call's provider usage,
not tokenizer measurements. The run had a single iteration, so orientation reuse
across iterations, the case the design targets, was not exercised and its benefit
there remains unmeasured.
