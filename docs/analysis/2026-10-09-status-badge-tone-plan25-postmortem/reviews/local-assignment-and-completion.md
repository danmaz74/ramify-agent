# Local architect assignment and completion (inv-0006, inv-0011)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, harness revision 474ffa58 (Plan 25 branch), `openai-codex/gpt-5.6-sol:high`.

## Summary

Both turns continued ses-0004 and succeeded first time without clarification. inv-0006 continued from checkpoint `30b8bfaf…`, after the selected context package was appended, and assigned the single iteration with zero tool calls in one 18 s model request. That shows the inherited orientation and the appended package were sufficient. inv-0011 continued after iteration `wi-001.i01` closed. It used the inherited procedure, inspected the commit and the three files the engineer's starting points named, reported sc-001 and sc-002 `done` and requested completion. Its two requests took 19.8 s in total. Plan 25's carry-forward worked as intended. The procedure, environment and tool blocks were not resent at inv-0011, and both continuation boundaries reused the cached prefix (66.0% and 88.5% of first-call input). The findings are minor or latent. The delivered procedure says completion is refused while a review requirement remains, but inv-0011 received no review state and it started while two of the three reviews were running; its request was accepted 0.17 s before the code review (rq-0001) finished, after the design review (rq-0003) had finished at 19:38:49. The assignment briefing replaced the views list with API views only, so the architect view the procedure names drops out of the current environment block. inv-0011 resent about 2.6 KB of unchanged or nearly unchanged blocks. Its starting-point paths are absolute, although the block says they resolve from the project root. The package resent the functional and context text already delivered at orientation (1.6 KB).

## Coverage

| Kind | Variant | Invocation | Start, source point | Evidence used |
|---|---|---|---|---|
| local-architect `assignment` | continued after context package; `procedure:local-architect:main` appended | inv-0006 | continued (requested and actual) from ses-0004 turn 1, checkpoint `30b8bfaf…` | manifest (29 inherited and 11 appended entries), packet `dc742ead…json`, native request `ce4debe6…` (the only one), transcript `ses-0004.jsonl` lines 34–40, `submission.json`, `outcome.json`, `observations.jsonl`, `events.jsonl` (`context-package-appended`, `outline-revised`, `iteration-assigned`) |
| local-architect `assignment` | continued after iteration closed; procedure inherited | inv-0011 | continued (requested and actual) from ses-0004 turn 2, checkpoint `a9cdf8b9…` | manifest (40 inherited and 8 appended entries), packet `28555d23…json`, native requests `5cb1ce6a…` and `7ec824c1…`, transcript lines 41–53, `submission.json`, `outcome.json`, `observations.jsonl`, `events.jsonl` (reviews rq-0001…0003, `obligation-reported`, ga-0003) |

I checked the provider prefix by comparing the retained native requests item by item. inv-0004's last request (50 items) is a prefix of inv-0006's first (57 items). inv-0006's request is a prefix of inv-0011's first (61 items), and that is a prefix of inv-0011's second (72 items). Instructions (4,045 bytes), native tools and `prompt_cache_key` are unchanged throughout.

## What each boundary delivered

inv-0006, appended after the inherited orientation (request items 53–56):

| Item | Content | Bytes |
|---|---|---|
| 53 user (`append:context:4646e400…`, recorded as inherited at the checkpoint) | Work-item package: ctx-001, fr-001…005 and nfr-001…004 in full | 2,988 text |
| 54 additional_tools | `inspect_git` (799) and `submit_work_item_result` (20,435; a 17,459-byte JSON schema in the description, `parameters` = `{"type":"object"}`) | 21,298 JSON |
| 55 developer | "Active tools: read, grep, ls, inspect_git, submit_work_item_result. Inactive historical tools must not be called." | 113 |
| 56 user | Delta briefing: `brief:requirements` replaced by a package reference; `What the plan asks` updated; `Registered obligations`; `# Orientation task` withdrawn; `procedure:local-architect:main` (7,145 bytes, from `local-architect-capability.procedure.md` and `write-scope.procedure.md`); `availableTools`; `views` (API views only); `supportPaths`; task | 11,058 |

inv-0011, appended (item 60, 7,737 bytes): `briefing-state`; `## The scenarios of this work item` (1,807; the only change is pending → bound); `## The bounds of an engineer` (417); `## The iteration you last assigned` (1,945); `## Earlier outlines` (172); `# Registered obligations` (1,000); `starting-points` (1,785); `task` (430, the same hash `737a5caa…` as inv-0006's). The procedure, environment and tool declarations were inherited, not resent.

## Required information

| Need | inv-0006 | inv-0011 |
|---|---|---|
| Objective | Met directly: task header "assignment", procedure `main` | Met directly: "Assign the next iteration, or request completion and let the work item's gate answer." |
| Plan elements | Met: package appended once (item 53); `brief:requirements` now points to it | Inherited |
| Module understanding | Inherited orientation (turn 1) | Inherited, plus own assignment |
| Write-scope rules and default scope | Procedure (appended) and `## Default write scope` (inherited) | Inherited |
| Obligations | Met: sc-001 and sc-002 pending | Met: both bound by inv-0007 with no fakes |
| Iteration result | n/a | Met in part: commit `b999ea9a…`, scenario passes with step locations; other gate checks not itemized; engineer proposal obtainable through `inspect_git show` |
| Review state of the iteration | n/a | Missing: rq-0001 (code) and rq-0003 (design) were still running; nothing in the briefing mentions reviews |
| Completion semantics | Procedure: "`request-completion` is refused while … any ordinary scenario/review/gate requirement remains." | Inherited; contradicted by what actually happened (A-1) |
| Tools and submission contract | Met: `additional_tools` and active-tools notice | Inherited |
| Views | API views listed (project-relative paths); architect view only in the inherited `## Your module` | Inherited |

## Findings

### A-1. Completion is accepted while reviews run, but the briefing says neither (low to medium, latent)

Affected: inv-0011, with the procedure inherited from inv-0006.

Location: the delivered procedure (inv-0006 item 56): "`request-completion` is refused while a capability request is pending, a delegated task is stopped or lacks an accepted current handback, or any ordinary scenario/review/gate requirement remains. Correct the cited blocker and submit again". The inv-0011 briefing contains no review section. Events: rq-0001 (code), rq-0002 (scope) and rq-0003 (design) were recorded at 19:38:24. inv-0011 started at 19:38:33.9, while rq-0002 had finished and rq-0001 and rq-0003 were running. rq-0003 finished at 19:38:49. Its `request-completion` verdict was "accepted" at 19:38:53.577. rq-0001 finished at 19:38:53.742, and the work-item gate ga-0003 ran at 19:38:56. The non-capability `local-architect.procedure.md` at this revision states the actual flow: "Before that gate, the reviews of your iterations settle. When they leave CheckFindings that need attention, a fork of your session taken at your completion request assesses them". The delivered `main` procedure, the capability variant, does not contain that text.

Expected: the architect knows whether reviews can block or follow its completion request, and knows the current review state. Observed: the delivered rule implies a refusal that the harness did not apply, and the briefing gives no review state. The architect requested completion based on its own source inspection ("Source review found no remaining requirement or compatibility gap"). That is its role, and the result was correct, because all reviews returned no concerns. The risk is interpretive. An agent that reads "refused while … review … remains" literally might wait or resubmit, and it would not expect a reconciliation fork to follow its completion request. Impact in this run: none. Confidence high on the mismatch.

Correction: add the review-settlement paragraph to the capability procedure, or align its refusal sentence with actual behavior. Add a one-line review status ("3 reviews requested for wi-001.i01; they settle before the work-item gate") to `## The iteration you last assigned`.

### A-2. The assignment's `views` block omits the architect view the procedure tells it to use (low)

Affected: inv-0006, inherited by inv-0011.

Location: inv-0006 `environment:views` ("Current value; replaces any earlier value for this key") lists only `subs/workspace/subs/shared-ui/src/.ramify` and `…/src/tests/.ramify`, as project-relative paths with "1 coverage limits" and "2 coverage limits". At orientation the same key listed `.ramify-architect` with its 15 modules, as an absolute path. The same procedure says: "Use the architect view to locate behavior and ownership". Its path survives only in the inherited `## Your module` block. The new project-relative paths also differ from the cwd-relative resolution the system prompt gives for tool calls ("Relative paths in your tool calls resolve against [the working directory]"), so using one verbatim from `…/shared-ui/src` would resolve to a nonexistent `src/subs/…` path.

Expected: the current environment names every view the procedure relies on, in a form the tools resolve. Observed: the agent made no view calls in either turn, so nothing followed from it. Confidence high on the content and low on the impact. Correction: keep the architect-view entry in the replaced `views` block, or do not replace the key at this boundary. Render view paths absolute, as orientation did.

### A-3. Unchanged or nearly unchanged blocks resent at inv-0011 (low)

Location: inv-0011 item 60. `## The bounds of an engineer` (417 bytes) differs from the inherited 418-byte block only by a trailing blank line, so a whitespace-only hash change triggered a resend. `## The scenarios of this work item` (1,807 bytes) repeats both Gherkin scenarios and the binding paragraph to change "(pending)" to "(bound)" twice. The same statuses also appear in `# Registered obligations` ("sc-001 (scenario): bound, revision 0; bound by inv-0007 with no fakes"). The `task` block (430 bytes) is byte-identical to inv-0006's. As the turn's instruction it is reasonable to repeat. `## Earlier outlines` (172 bytes) says only "This work item already has 1 outline revision(s)", which the session already contains.

Expected: a delta carries changes. Observed: about 2.4 KB of the 7.7 KB delta, excluding the task block, carries no new information. At the run's measured ratio (inv-0006: about 35 KB appended for 8,897 uncached tokens) that is roughly 600 tokens, paid once uncached. The agent's behavior shows no effect. Correction: normalize trailing whitespace before hashing blocks. Send scenario status changes only through the obligations block, or as a one-line status delta, not a full re-render.

### A-4. Starting-point paths are absolute, contradicting their header (low)

Location: inv-0011 `brief:support:starting-points`: "Paths below resolve from the project root; structured submissions keep project-relative paths." It is followed by JSON objects such as `{"path":"/tmp/claude-1000/…/collection-review/subs/workspace/subs/shared-ui/src/status-badge.tsx", …}`. The submission schema forbids absolute `startingPoints` paths (pattern `^(?!\/|~|[A-Za-z]:)…`).

Observed: the agent read exactly those three files, using cwd-relative paths (`status-badge.tsx`, `tests/status-badge.test.tsx`, `tests/steps/status-badge-tone.steps.tsx`). The pointers were used and helped. The rendering is internally inconsistent, and raw JSON lines are harder to read than the `path — note` form used elsewhere. Correction: render project-relative paths to match the header, or change the header to say the paths are absolute. Use the list format of the other pointer blocks.

### A-5. Gate evidence for the iteration is itemized only for scenarios (low)

Location: inv-0011 `## The iteration you last assigned` says "`wi-001.i01` ended `accepted`, committed as b999ea9a…" and lists the scenarios that passed in `fixture-scenarios`. The other configured checks (`fixture-type-check`, `fixture-tests`, `fixture-structure`), all of which passed in ga-0002, are not listed. The architect's completion summary says "the iteration also reports passing type-check and structural audit". That wording comes from the engineer's commit message, which it read through `inspect_git show`, not from the gate. Its statement is true, but it rests on the engineer's claim, while the procedure stresses that gate results and engineer proposals are separate evidence. Correction: list each configured check and its verdict for the closing gate in this block.

### A-6. The package resends the functional and context elements already in the session (low)

Location: inv-0006 item 53 repeats ctx-001 and fr-001…005 in full (1,608 bytes). They were delivered in inv-0004's `brief:requirements` (1,881 bytes, item 0). The new `brief:requirements` then supersedes the earlier text with "Use the accepted work-item package 27ea883f… Its complete context is supplied once and remains in this session." The package text itself does not show its hash, so the agent must infer that item 53 is the package `27ea883f…`. With only one package this is trivial.

Expected and observed: a canonical, complete package is a reasonable design, because the same item is also inherited by the reviewer forks taken from this session. The duplication costs about 400 tokens once and is cached afterwards. No effect. Correction is optional: include the package hash in its header. If byte economy matters, a continued session could receive only the newly selected elements plus a reference.

### No issue found

The submission contract is large (the `submit_work_item_result` declaration is 20,435 bytes, about 60% of inv-0006's appended bytes), but it is the authoritative schema covering every submission kind. Both submissions were accepted first time, and the declaration was cached at inv-0011. The capability-workflow paragraphs of the `main` procedure (about 1.5 KB on `capability-needed`, delegation and handback) do not apply to this work item. They are a legitimate contingency for any assignment, because the engineer may report `capability-needed`, so I do not count them as extraneous. inv-0006's assignment carried every element (`citedElements` all ten), both obligations, scope `base.included: []`, no authorizations and three project-relative starting points. The engineer's iteration passed its gate first time. inv-0011's reports used `basedOnRevision: 0`, matching the revision shown.

## Cache at the continuation boundaries

| Boundary | Source point | First-call new / cached input | Cache share | First-call output | Whole-invocation usage | Notes |
|---|---|---|---|---|---|---|
| inv-0004 → inv-0006 | turn 1 checkpoint `30b8bfaf…` (after the package append) | 8,897 / 17,280 | 66.0% | 1,152 | the same (one request); estimated $0.0655 | Cached amount equals the parent's last request prefix (17,386 tokens). New tokens are the parent's final submission turn, the 2,988-byte package, the 21,298-byte tool declarations and the 11,058-byte delta. The concurrent fork (inv-0005) sent the same items 0–52 six seconds earlier, but inv-0006 read no more cache than the fork did (17,280 each), so the fork did not extend the reusable prefix. The difference is about 1 K tokens, cause unknown. |
| inv-0006 → inv-0011 | turn 2 `a9cdf8b9…` | 3,375 / 25,984 | 88.5% | 162 | 2 requests: 7,054 / 55,168 cached, 715 output; estimated $0.0646 | The cache hit despite about 2.4 min between the parent's last usage (19:36:12.8) and this request. The parent request's 26,177 tokens were reused almost entirely. Second request: 3,679 / 29,184. |

Plan 25's inheritance is visible in inv-0011. The 7,145-byte procedure, the tool declarations and the environment were not resent, and the delta was 7.7 KB, against 11.1 KB plus 21.4 KB of declarations at inv-0006.

## Observed effects

inv-0006 went from delivery to accepted assignment in one request, with no exploration and no rejection. Orientation plus the appended package was enough, and the procedure was usable. inv-0011 issued one parallel batch: `inspect_git show` (8,036 bytes, commit message and diff), three reads that matched the engineer's starting points exactly, and `inspect_git status` (empty). It then submitted `request-completion` with both reports, and the harness accepted it first time. No finding coincides with a clarification, tool error, rejected submission or repair. A-1 is latent and depends on timing: here the reviews happened to finish within 0.2 s of the completion verdict, and none raised a concern.

## Correction suggestions

1. Align the capability procedure's completion text with review settlement and the reconciliation fork, and give inv-0011-type briefings a review-status line (A-1). Validate on a run where a review returns CheckFindings.
2. Keep the architect view in the replaced `views` block and use absolute paths (A-2).
3. Normalize block text before hashing, and stop re-rendering the scenario block for status-only changes (A-3).
4. Render starting points in the format their header states (A-4), and itemize the closing gate's checks (A-5).
5. Optionally show the package hash in the package header (A-6).

## Evidence gaps

Reasoning is encrypted, so the motive for each call is inferred from summary headings ("Inspecting commit details", "Submitting completion without assignment"). Whether the harness deliberately defers the work-item gate until reviews settle is inferred from event order and the uninvoked `local-architect.procedure.md` text. I did not trace it in the service code. Token figures other than provider usage are estimates from byte sizes and the run's own usage deltas. No provider tokenizer was available.
