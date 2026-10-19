# Review and fix cycles in cucumber viz and ramify agent

**Date:** 2026-10-19. **Status:** analysis and proposed direction; no runtime
changes are made by this document.

The starting point is an ordinary coding agent doing useful work. The harness
should make that work easier through context, tools and selected checks.
Cucumber-viz's established review and fix choices are the starting implementation
reference. Changes beyond those choices should be tried individually and kept
when experience shows that they help.

This analysis separates the user's operating experience and direction, observed
implementation facts, the author's judgments, and proposed changes. A source
observation about a possible weakness is not, by itself, a reason to add a
restriction.

## User experience and governing direction

The user reports that cucumber-viz's choices work and have been demonstrated
through months of use. The user also identifies the automated ramify-agent
path's restrictive starting policy as the reason it became unusable. These are
operational observations supplied by the person using both systems; they are
part of the evidence for this decision.

The direction given on 2026-10-19 is:

1. Start with what a normal agent would do.
2. Adopt the choices already demonstrated to work in cucumber-viz. Do not require
   those choices to prove themselves again before adopting them.
3. Do not start with stronger restrictions, exhaustive checks or stricter gates
   to prevent hypothetical problems.
4. Try proposed improvements beyond that baseline one at a time. Evaluate their
   usefulness after trying them, then keep, adjust or remove them.
5. If actual use reveals that a particular behavior is too loose, address that
   observed problem then.

This is different from designing a strict system first and requiring evidence
before relaxing it. It also differs from making a new measurement framework or
formal experiment protocol a prerequisite for ordinary work.

## Investigation facts

### Sources and scope

Three native Sol workers inspected cucumber-viz, automated ramify-agent and
assisted ramify-agent separately. The source references are:

| Source | Inspected revision or identity |
| --- | --- |
| cucumber-viz branch `modularization_v3b` | `54b56b48b5dfa15d77bfd88cda639744b3ab3e10` |
| ramify-agent main | `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac` |
| Harness decomposition worktree | `93f63a81fa87112d7ee71469c0c4cddbd27b4689` |
| Assisted run inspected | Plan `harness-decomposition`, job `20261019T065548Z-f298d1` |
| Assessor used by that run | `/workspaces/worktrees/passive-waiting`, based on `3cf06e52` |

Repository-relative source links below describe the inspected main revision;
files may move later. Cucumber-viz links are pinned to its inspected commit.
The measurements below come from retained prompts and assessment records. They
are not estimates of token usage or a benchmark comparing the two products.

### What cucumber-viz implements

**Large changes receive a compact initial presentation.** Review patches of at
most 200 KiB are delivered inline. Larger patches are retained in a frozen file;
the prompt contains a stat summary, changed paths, counts and the patch location.
The summaries have a 200-file limit with explicit omission notices and prioritize
high-churn stat entries. Instructions tell the reviewer to inspect relevant
sections rather than load the entire patch. Scope-qualified filenames preserve
separate artifacts for concurrent reviews. Tests cover threshold behavior,
summary bounds and concurrent paths. This mechanism limits initial delivery; it
does not schedule automatic review partitions or limit total agent reading.
See [diff preparation][cv-diff] and [inspection guidance][cv-triage].

**Constraint selection happens before full constraint delivery.** The relevance
step receives metadata and a diff summary. Constraints scoring at least 0.50,
plus constraints already selected during planning regardless of that score,
are included in the later full check. This is input selection, not a numerical
threshold for deciding which code-review findings deserve fixes.
See [constraint selection][cv-constraints].

**Review prompts ask for substantive, source-validated issues.** Iteration code
review excludes naming, formatting, comment style and cosmetic refactoring;
it requires a concrete file and allows an empty result. Its `Minor` category
still includes genuine improvement opportunities. The handler fails the check
on any returned finding, and the normalizer assigns automatic-fix policy to
those findings. There is no general severity cutoff before that conversion.
Final risk review covers security, breaking changes, performance, migrations,
test coverage and dependencies. See [iteration prompt][cv-code-prompt],
[check result handling][cv-code-result] and [risk prompt][cv-risk-prompt].

**Repeated review and remediation are bounded.** The iteration code-review
plugin has `maxRuns: 1`; scope review has `maxRuns: 1` and
`maxRemediationAttempts: 1`. The filtering logic skips those checks once the
remediation-attempt count reaches the run limit. The general remediation
default is four attempts, with per-check overrides; exhausted work can be
deferred. Thus a repair does not automatically receive another iteration code
review. See [code-review configuration][cv-code-policy],
[scope-review configuration][cv-scope-policy], [remediation defaults][cv-remediation]
and [check filtering][cv-filter].

**A skipped review is not recorded as proof of a fix.** Tests verify that a
finding stays unresolved when its owner check was skipped because of
`max-runs`, retaining `ownerCheckReran: false` and an inconclusive reason.
Successful owner reruns can supply resolution evidence. The system can stop
spending on a finding without relabeling it verified.
See [the skipped-rerun test][cv-skip-test].

**Known decisions are supplied to subsequent risk reviews.** A ledger includes
same-workflow, final-scope risk findings with canonical waived status and
complete risk metadata. It is bounded to 50 entries and 16,000 serialized
characters, with field limits, deterministic ordering, escaping and omission
notices. Both risk reviewers receive it. Instructions ask them to revalidate
against current code, avoid reporting the same unchanged issue, distinguish
nearby issues, and report materially increased severity or blast radius as an
escalation. Escalations preserve links to the original disposition.
See [ledger construction][cv-ledger] and [ledger review instructions][cv-ledger-rules].

**That ledger assists judgment rather than guaranteeing correspondence.**
Acknowledgments are not parsed into closure decisions. The design records that
identity depends on category, file and finding prose; the optional agent
correspondence hook is not wired in production. Rewording can therefore produce
a new finding. Tests establish rendering, bounds and escalation behavior.
The source investigation did not measure how often duplication occurs in use.
See [the recorded motivation][cv-ledger-plan] and
[default reconciliation][cv-risk-reconcile].

**Finding discovery and deciding what to do are separate.** At this branch's
head, automatic adjudication receives every actionable finding and chooses a
legal disposition: approve, an applicable constraint approval, address now,
add to a later plan, or exceptionally ask the user. The response is validated
for one decision per finding, allowed actions and required rationale; trusted
code applies it. The latest commit makes the feature configurable and enabled
by default. There is no batching or context cap for this adjudication input.
The prompt tells the agent to decide ordinary reversible tradeoffs and reserve
user questions for important consequences that available evidence cannot resolve.
See [adjudication implementation][cv-adjudication] and
[decision instructions][cv-adjudication-prompt].

**Incremental final-review cursors are a proposal, not an implemented feature
at this revision.** The May 18 plan proposes successful-review heads,
follow-up deltas and fallback. Current final risk review still constructs the
full cumulative workflow comparison. A separate effective-baseline mechanism
accounts for integrated upstream history; it is not the proposed per-review
cursor. See [the cursor proposal][cv-cursors],
[actual final diff construction][cv-risk-diff] and
[effective phase baseline][cv-effective-baseline].

**Some unavailable or malformed risk-review results become empty results.**
A missing peer executable can produce `null`; malformed risk output can become
an empty result with Low risk; a failed primary task can return Low risk, no
findings and an error summary that the caller records as a completed review.
Malformed adjudication, in contrast, returns an error rather than applying
decisions. These are source behaviors; this investigation established no
incident rate or user harm caused by them. See
[peer handling][cv-peer], [failed primary handling][cv-failed-review] and
[parser fallback][cv-parser].

**Planning review remains broad.** It receives the plan and iterations, uses
two model reviews, validates against source, deduplicates and edits the plan.
There is no equivalent known-issue ledger, delta-review cursor or explicit
diminishing-return rule in that path. When a peer is unavailable it can run
another review with the available agent. See [planning review][cv-planning].

### What automated ramify-agent implements

**Code, scope and design reviews follow accepted engineering iterations,
including corrections.** Their comparison uses the accepted boundary before
the candidate gate, so this path already has incremental iteration diffs.
Code review starts fresh; scope review forks a captured assigning-architect
point; design can reuse an orientation keyed by its guidance and execution
context. See [after handling](../../subs/harness/src/run/after-handling.ts),
[committing gates](../../subs/harness/src/run/committing-gate.ts) and
[session preparation](../../subs/harness/src/run/service.ts).

**Review packets contain both useful context and broad obligations.** They
include assignment intent, cited plan elements, scope deviations, changed paths,
patches, check pointers and earlier finding titles. Diff preparation uses the
same 200 KiB threshold idea as cucumber-viz, but crossing the threshold removes
all inline patches and makes the reviewer retrieve individual patches.
Every changed path must be reported as inspected or missing. Inspection is
validated against delivered patches or tool reads. See
[review messages](../../subs/harness/subs/reviews/src/message.ts),
[diff preparation](../../subs/harness/subs/reviews/src/diff-payload.ts) and
[submission validation](../../subs/harness/subs/reviews/src/submission.ts).

**Design guidance selection is mechanical and project-wide.** It selects
alphabetically ordered `*.principles.md` files from the whole candidate before
ancestor READMEs, with limits of 12 files, 64 KiB per file and 192 KiB total.
Selection does not examine applicability or adoption status. The credibility
helper classifies principles filenames as human-reviewed without checking
document status. See [guidance selection](../../subs/harness/subs/reviews/src/inputs.ts)
and [signal credibility](../../subs/harness/src/reviews/signals.ts).

**Whole-catalog nonfunctional assessment repeats after repairs.** Each initial
and after-repair assessment starts fresh and receives every fixed and
nonfunctional element. Source and test hints accumulate across accepted
iterations. Action selection then uses another fresh session and the full
package. See [nonfunctional prompts](../../subs/harness/src/nonfunctional/prompts.ts),
[coverage validation](../../subs/harness/src/nonfunctional/submissions.ts) and
`nonfunctionalSourceInputs` and assessment creation in
[the run service](../../subs/harness/src/run/service.ts).

**The system already has discretionary finding decisions.** Architect
reconciliation can correct risk, relate repeated issues, supersede, waive,
defer, leave unresolved or request repair. It asks for proportional effort and
for refinement to end when the requirements are met and further benefit is
small. Required check failures have different decision rules. See
[reconciliation guidance](../../subs/harness/src/prompts/reconciliation.procedure.md),
[reconciliation message](../../subs/harness/src/reviews/reconciliation-message.ts)
and [finding decisions](../../subs/harness/subs/check-findings/src/decide.ts).

**Finding intake and later-round attention remain broad.** Valid subjective
concerns become findings, including low-risk concerns. The reviewer prompt
defines low risk to include code that works but could be better. Subjective
reports have no automatic underlying-issue identity; matching occurs later.
Reviewers receive at most 100 same-work-item finding titles and standings,
rather than complete disposition rationales. Current later-round reconciliation
considers every signal needing disposition, regardless of risk. Earlier round
and risk-floor settings are marked legacy; nonfunctional repairs can continue
beyond the former round counts. See
[reviewer instructions](../../subs/harness/src/prompts/reviewer.system.md),
[finding ingestion](../../subs/harness/src/run/review-finish.ts),
[later-round selection](../../subs/harness/src/reviews/reconciliation.ts),
[policy records](../../subs/harness/src/run/records.ts) and
[nonfunctional rounds](../../subs/harness/subs/nonfunctional/src/rounds.ts).

The older [CheckFinding principles](../check-findings.principles.md) describe
bounded correction rounds and unresolved subjective signals as a normal end
state. They are marked Proposed and do not establish that the current runtime
enforces those bounds.

### What assisted ramify-agent implements

**Every review receives the complete captured plan and discovery
qualifications.** Discovery scans plan-directory documents, follows local
references transitively and discovers principles. Document bodies are mostly
retrievable references, but all missing, outside-project and unreadable
reference qualifications are appended to the initial prompt. Explicit pinned
requirement documents are also inlined. See
[discovery](../../subs/harness/subs/plan-evidence/src/discovery.ts),
[assessment preparation](../../subs/harness/src/assistance/assessment.ts) and
[evidence access](../../subs/harness/src/assistance/pi-evidence.ts).

**The reviewer uses a restricted set of candidate tools.** It can list, read,
search and diff files from the captured candidate and read retained assessment
evidence. It has no shell in this review path. Candidate reads reject files over
512 KiB and deliver at most 2,000 lines; searches deliver at most 100 matches;
patch responses have a 256 KiB limit. The evidence tool pages at 8,000 characters
by default, with a 12,000-character maximum. See
[Pi equipment](../../subs/harness/src/assistance/pi.ts),
[snapshot tools](../../subs/harness/subs/reviews/src/snapshot.ts) and
[evidence paging](../../subs/harness/src/assistance/pi-evidence.ts).

**Missing coverage automatically blocks.** Every changed path must be
classified inspected or missing. There is no supplemental or not-applicable
classification. The assessment promotes every missing entry into a required
gap, independently of its relevance to the acceptance question. Uncertain
requirement answers and a declared coverage gap also block. See
[review validation](../../subs/harness/subs/reviews/src/submission.ts) and
[outcome construction](../../subs/harness/src/assistance/assessment.ts).

**Repairs repeat a cumulative review in a fresh session.** Each repair retains
the iteration's original base. The prompt supplies the prior result and repairs,
then says previous inspection is not evidence for the new candidate. Each
review creates a fresh Pi session. Accepted stages can be reused when resuming
the same assessment, but a new repair candidate does not carry forward its
predecessor's review coverage. Reconciliation is another fresh session and
receives the complete captured plan again. See
[iteration composition](../../subs/harness/src/assistance/service.ts),
[assessment preparation](../../subs/harness/src/assistance/assessment.ts) and
[session creation](../../subs/harness/src/assistance/pi.ts).

**The 20-concern limit does not select repairs.** The prompt asks for material
concerns and puts nits in prose, but every submitted concern is ingested. Every
remaining open finding blocks regardless of risk. Assisted reconciliation can
fix, supersede and relate findings, but cannot waive or defer them. Its refusals
refer those actions to coordinator authority. Unmet requirement answers can
independently add repair requests. See
[assisted review](../../subs/harness/subs/reviews/src/assisted.ts),
[finding conversion](../../subs/harness/src/assistance/findings.ts) and
[reconciliation and gates](../../subs/harness/src/assistance/assessment.ts).

**Audit failure does not avoid subsequent semantic review.** The assessment
performs its audit and then prepares review with that audit status. A failed
audit can therefore be followed by both review and reconciliation of the same
qualification obligation. Required audit failures and protected changes retain
their existing distinct decision rules.

### What the inspected run actually spent and found

The original extraction began at 06:56 UTC and had a candidate at 07:05 UTC.
The first assessment began at 07:06 UTC. Subsequent work included both qualifying
the extraction and a separately requested correction removing review execution
deadlines. These are not all repeated attempts at an unchanged extraction.

| Assessment | Observed work and outcome |
| --- | --- |
| `as-0001` | About 12 minutes total; tests took 626.6 seconds with 3,891 passing tests. Patch integrity failed on extra blank lines in retained logs. Review also lacked the configured model capabilities. |
| `as-0002` | About 11 minutes; audit passed, but review stopped at its former ten-minute execution limit. |
| `as-0003` | About 19 minutes; reused audit evidence. The review marked all six acceptance references met and reported zero semantic concerns, but incomplete coverage of five retained artifacts blocked it. |
| `as-0004` | About 19 minutes; assessed the deadline correction. Tests took 681.7 seconds and one workflow test timed out. Review and reconciliation followed. |
| `as-0005` | About 25 minutes 37 seconds: approximately 12 minutes 16 seconds before review, 10 minutes 53 seconds reviewing, and 2 minutes 26 seconds reconciling. Tests took 619.6 seconds: 3,488 passed, one failed, two skipped. The failure was a stale test-name reference in a composition test. |

Some assessments overlapped. Their durations must not be summed as elapsed plan
time. Fixed audit costs remain relevant even when review becomes cheaper.

| Retained review measurement | `as-0003` | `as-0005` |
| --- | ---: | ---: |
| Initial task message characters | 190,737 | 166,312 |
| Discovery qualification characters | 115,743 | 115,743 |
| Share occupied by those qualifications | 60.7% | 69.6% |
| Cumulative changed paths | 66 | 65 |
| Collected patch bytes before summary fallback | 395,202 | 204,905 |
| Paths reported inspected / missing | 61 / 5 | 47 / 18 |
| Retained exact-read paths, including unchanged files | 45 | 63 |
| Semantic concerns | 0 | 1 |

The `as-0005` collection crossed the 204,800-byte inline threshold by 105 bytes,
so no patches remained inline. These counts do not imply that its full diff was
only 204,905 bytes: collection stops after the threshold is crossed.

The discovery artifact held 1,043 document identities representing 19,547,468
source bytes, including nine principles. It retained 112 missing, 164
outside-project and 39 unreadable reference qualifications. The document bodies
were not all delivered in the initial message.

In `as-0003`, the five missing artifacts were three compressed check reports and
two oversized summaries. The reviewer distinguished those limits from missing
implementation. Native investigation subsequently verified the artifacts and
prepared smaller readable evidence. In `as-0005`, the reviewer described the
18 missing historical import slices as supplemental and unused for the
correction's acceptance; they still became blocking gaps. That assessment also
had the independent audit failure, so removing the coverage gaps alone would
not have produced a passing audit.

The sole semantic concern in `as-0005` repeated the failed qualification
obligation. These two reports did not repeatedly invent optional improvement
work. They show broad delivery, inspection obligations and repeated qualification
costs. They do not establish how often discretionary finding churn occurs in
other runs.

The decomposition branch at `93f63a81` contains changes removing review lifetime
expiration and review silence-watchdog cancellation across several execution
paths. Those changes do not remove the context, coverage and finding-selection
behavior described above.

### Retained evidence locations

The run directory is
`/workspaces/worktrees/harness-decomposition/plans/harness-decomposition/.harness/jobs/20261019T065548Z-f298d1`.
Assessment revisions and `assessments/as-000N/stages/{audit,review,reconciliation}.json`
retain the timings and outcomes above. The discovery artifact is
`evidence/2e5f5d0dc6e615e9cf16f4457103efeaab39b514cb77582f06fbdaf3ddb9448d.json`
relative to that run directory.

The task messages are the `task.message` values in these retained JSON payloads,
under `/workspaces/worktrees/harness-decomposition/plans/.harness/session-operations/store/payloads/`:

- `as-0003`: `e977676beadaff62c667c6f107915fccd513dbe84931ddf1adf7c6786916bf8f`.
- `as-0005`: `231fdf2e5f4dce5180400dbf2a5f0f525046ae653770c8737513900d1a6fe4c1`.

Those are historical local evidence locations, not portable committed inputs.
The summaries here retain the measured values without copying the large reports
into another review input.

## Author judgments

The statements in this section are interpretations and recommendations, not
additional observations about the implementations.

**The initial recommendation used the wrong default.** It treated exhaustive
coverage, strict evidence continuity and stronger concern admission as things to
preserve or add before simplifying. That puts the burden of proof on removing
restrictions. The user's direction puts the burden on adding them.

**Cucumber-viz's established behavior should be the practical baseline.** Its
months of successful use are sufficient reason to adopt its bounded review/fix
cycle, progressive inspection and decision-making approach. A code inspection
that identifies a theoretical weakness does not outweigh that experience or
justify making the replacement stricter in advance.

**ramify-agent currently turns too much review activity into acceptance machinery.**
Requiring every artifact to be inspected, rejecting conclusions because optional
material was unread, and promoting every open subjective concern into a blocker
make the reviewer responsible for demonstrating exhaustiveness. An ordinary
agent can judge the task with selected evidence and report limitations without
making every limitation another work item.

**The recent run supports a simpler context fix directly.** Most initial text in
the measured prompts was historical reference qualifications. That material
could remain available without requiring its ingestion or adjudication. The
measured data supports removing this delivery burden; it does not establish a
need for a new relevance-scoring agent, proof schema or evidence-selection gate.

**Ordinary judgment is the right first selection mechanism.** The existing
coordinator or architect can decide that a suggestion is useful, unnecessary,
already addressed, or better left for later. A new mandatory structured proof of
materiality for every finding would itself add work. A concise explanation is
enough to start.

**Repair review need not recreate the whole original review.** Familiar context,
the repair diff and ordinary relevant tests are a reasonable starting point.
My earlier suggestion to prove dependency-level validity before carrying forward
every judgment was a new mechanism without a demonstrated need here. It should
not be a prerequisite for normal review reuse.

**A bounded review cycle is different from killing a running review.**
Cucumber-viz's one-pass policy limits how many review/fix cycles are launched.
It need not interrupt a useful review on elapsed time. Adopting that cycle policy
is consistent with the user's separate instruction to remove review execution
deadlines.

**Source caveats should remain facts, not become an automatic hardening list.**
The parser fallbacks, identity limitations and broad adjudication packet found in
cucumber-viz are worth recording. This analysis found no operational incident
that makes replacing them a prerequisite for adopting the working workflow.
Any change to those behaviors should be proposed and tried separately if useful.

## Revised suggestions

### First adopt the established workflow

Use cucumber-viz's established pattern for both assisted and automated work:

1. Implement a coherent outcome with normal agent tools and relevant context.
2. Run the project's applicable configured checks; report concrete failures to
   the implementing agent.
3. Review the iteration once, using compact context and progressive source
   inspection.
4. Let the coordinator or architect select useful fixes and decide what to leave
   alone or for later. Routine decisions do not need another approval exchange.
5. Apply selected fixes and perform relevant verification. Do not automatically
   launch the same broad review again after every correction.
6. Continue the plan, retaining unresolved observations honestly. Use the
   established final workflow review where appropriate, rather than making every
   iteration a rehearsal of final review.

Adopt the one-pass code/scope review behavior as the initial policy. Extra review
is available when the user or coordinating agent has a concrete reason, such as
a substantial new change introduced by a repair. Do not require a clean list of
subjective suggestions before proceeding. Existing user requirements and actual
configured check failures still mean what they say; the change is to avoid
creating extra obligations merely because a reviewer can suggest more work.

Keep direct reporting of review availability and unresolved issues. Choosing to
continue after a review limit does not require pretending that another review
ran. Do not add a mandatory fail-closed gate for every advisory review problem.

### Make the implementation of that baseline straightforward

The complexity estimates below are author judgments about the smallest useful
implementation. **Change effort** includes adapting existing consumers, tests
and contracts. **Retained complexity** means the net effect on the system after
the change, including new state and concepts. A substantial change can remove
complexity even when making it takes care.

Low effort means a localized prompt, projection or policy change. Medium means
several cooperating preparation, execution or result consumers. High means a new
coordination or persistence mechanism. These are not elapsed-time estimates.
The workflow steps above are implemented by the rows below, so they are not
additional estimates to sum. Several rows share the same code and tests.

| Proposal | Initial change | Change effort | Retained complexity and main source of work |
| --- | --- | --- | --- |
| Assisted prompt | Supply the current goal, relevant acceptance text, selected guidance, change summary and earlier decisions. Remove eager transitive-reference qualifications and repeated whole-plan delivery; keep originals available. | Low–medium | **Decrease.** Reuse the iteration brief, acceptance references and evidence access. Change prompt composition and its consumers; no new selection service or durable catalog is needed. |
| Automated design context | Supply guidance relevant to the changed owners and task through the coordinator's ordinary selection. Stop treating every principles filename as an initial obligation. | Medium | **Decrease.** Replace global selection rules with supplied relevant references and existing module context. The work is connecting selection to design preparation and orientation reuse; no separate scoring agent. |
| Reviewer tools | Supply normal candidate-inspection tools, including a shell for large or compressed evidence, with read-only review instructions. | Medium | **Small addition initially; possible decrease after consolidation.** Reuse existing agent equipment. The main uncertainty is preparing and cleaning up a checkout of the intended candidate if no suitable checkout is already available. Keeping both standard and custom tools indefinitely would retain two paths. |
| Coverage | Remove mandatory inspected/missing accounting as a completion gate. Let the reviewer select files and report meaningful limitations. | Medium | **Substantial decrease.** Remove enforcement from submission validation, assessment outcomes and their consumers. Historical records can remain readable without applying their old coverage rule to new reviews. No replacement coverage schema is proposed. |
| Review frequency | Adopt one-pass iteration code/scope review. Additional review has a concrete purpose rather than following every small correction automatically. | Medium | **Decrease.** Change scheduling and completion decisions using existing iteration/review identities. Verify that continuing after the normal review pass does not wait for a review deliberately not scheduled. No new scheduler or budget store. |
| Finding decisions | Let the existing coordinator/architect select fix now, leave or defer, including in assisted work. | Medium–high | **Small policy/API addition, overall decrease in mandatory workflow.** The finding domain already supports dispositions. Assisted command access, result construction and completion consumers must consistently honor those decisions. This is more than changing a prompt, but needs no new adjudicator or findings database. |
| Known issues | Render a bounded summary of existing issues and decisions, with instructions about repetition and changed circumstances. | Low | **Small addition.** One projection/formatter and prompt guidance over existing records. No new durable ledger, matching model or automatic identity mechanism. |
| Verification | Send concrete failed checks to the implementing/coordinating agent without automatically adding broad semantic review and reconciliation. | Low–medium | **Decrease.** Adjust assessment sequencing and return the existing diagnostic evidence. Keep review-not-run distinct from review-completed using the existing stage/result machinery where possible. |
| Final fixed/nonfunctional review | Keep a useful final assessment; after repairs let the agent inspect the fix and relevant surrounding behavior rather than restart the whole catalog by default. | Medium–high | **Decrease if implemented through ordinary judgment and existing results.** Change packet preparation, follow-up selection and completion consumers together. No dependency graph or per-requirement proof cache is included in this estimate. |

These are proposals for replacing ramify-agent's extra mandatory ceremony with
the adopted baseline. They are not new prerequisites for starting ordinary
implementation, and writing this analysis does not change existing runtime
contracts or resume the stopped run.

### Then try improvements individually

After adopting the baseline, possible experiments include:

| Experiment | Smallest useful trial | Change effort | Added retained complexity |
| --- | --- | --- | --- |
| Partial inline patches | Keep complete patches that fit and list the rest for retrieval, rather than discard every inline patch at the threshold. | Low | **Low.** Mixed inline/retrieved presentation and a deterministic selection rule. Existing patch identities and tools suffice; no new state. Its effect on useful context still needs trying. |
| Assisted repair delta | Offer previous-candidate-to-current-candidate beside the cumulative comparison, using the existing previous-assessment link. | Low–medium | **Low.** One additional comparison and clear base labels. A persistent successful-review cursor with recovery rules would be a larger, separate change; it is not needed for this trial. |
| Reuse review context | First try a short prior-result handoff or existing session continuation/fork for one related review. | Low for a handoff; medium for session reuse | **Low for a handoff; medium for persistent reuse.** Session reuse adds choices about which context to continue and what to do when it is unavailable. Start with existing session facilities, without a new cache or proof that every remembered statement remains valid. |
| Split a large review | Have the coordinator make an ad hoc split into a few coherent questions and combine the answers. | Low for native delegation | **Low for an occasional coordinator decision.** Automating the split would be high complexity: scheduling, overlapping findings, partial results and completion ownership. Do not build that automation before the manual trial helps. |
| Improve issue matching | Ask the existing decision-maker to relate a recurring concern to a supplied prior issue. | Low–medium | **Low when using existing finding relations.** A dedicated semantic matcher, new identity model or automatic reopen policy would be medium–high complexity and is outside the first trial. |

On these estimates, compact prompts, fewer automatic review rounds, removal of
coverage enforcement and ordinary finding decisions simplify the default path.
The principal unavoidable integration work is in result/completion handling and
normal tool access. The known-issue summary is a small useful addition. Durable
review cursors, automated review partitioning, semantic matching services and
dependency-aware evidence caches would add substantially more machinery; none is
part of the initial adoption proposal.

Try one change at a time on real work. Use the observations already available:
time to complete the task, repeated exploration, useful fixes, unnecessary fixes
and user interruptions. Keep the change if it helps; adjust or remove it if it
does not. Existing audit time should be distinguished from review time when
interpreting a result. No new telemetry platform or exhaustive qualification
program is required before trying an improvement.

The same rule applies to stricter checks. If use reveals a specific missed
defect, repeated abuse of a shortcut, or a real authority error, try the smallest
change addressing that problem. Do not introduce dependency-proof graphs,
mandatory exhaustive coverage, repeated full-plan checks, extra approval layers
or universal fail-closed review handling in anticipation of such incidents.

## References

Related ramify-agent documents:

- [Prompt optimization principles](../prompt-optimization.principles.md),
  including normal tools, bounded context and relevant guidance.
- [Harness principles](../harness.principles.md), including specifications
  informing the plan rather than repeated independent specification review.
- [Assisted service contract](../architecture/agent-assistance/service.spec.md),
  the currently implemented contract that a runtime change would need to update.
- [Plan context catalog](../architecture/plan-context-catalog.spec.md), separating
  requirements, recommendations and context.
- [Earlier cucumber-viz lessons](../cucumber-viz-lessons/README.md), based on an
  earlier installed version and separate from this branch-specific investigation.

[cv-diff]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/check-execution/review-diff-payload.ts#L14-L93
[cv-triage]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/check-execution/review-diff-payload.ts#L206-L227
[cv-constraints]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/check-execution/check-engine.ts#L1085-L1173
[cv-code-prompt]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/prompts/implementation-studio/iteration-code-review.md#L30-L82
[cv-code-result]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/check-execution/check-engine.ts#L2018-L2035
[cv-risk-prompt]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/prompts/implementation-studio/workflow-risk-review.md
[cv-code-policy]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow/audit-composition/plugins/code-review-plugin.ts#L4-L15
[cv-scope-policy]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow/audit-composition/plugins/scope-review-plugin.ts
[cv-remediation]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow/checks/check-registry.ts#L343
[cv-filter]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/check-execution/iteration-check-filtering.ts#L44-L88
[cv-skip-test]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow-service/machine-service-checks.test.ts#L805-L861
[cv-ledger]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/known-issue-ledger.ts#L3-L61
[cv-ledger-rules]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/known-issue-ledger.ts#L129-L156
[cv-ledger-plan]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/docs/plans/2026-07-27-risk-review-known-issue-ledger/main-plan.md#L3-L44
[cv-risk-reconcile]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/risk-review-reconciliation.ts#L138-L162
[cv-adjudication]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/review/check-finding-adjudication-handler.ts#L98-L245
[cv-adjudication-prompt]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/prompts/implementation-studio/workflow-check-finding-adjudication.md#L15-L37
[cv-cursors]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/docs/plans/2026-05-18-incremental-review-cursors/main-plan.md#L35-L103
[cv-risk-diff]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/risk-review-handler.ts#L224-L253
[cv-effective-baseline]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow-service/effective-review-baseline.ts
[cv-peer]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/risk-review-handler.ts#L166-L179
[cv-failed-review]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/runtime/risk-review/risk-review-handler.ts#L312-L333
[cv-parser]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/src/domain-sub-apps/implementation-studio/core/workflow/review-models/risk-review-parsing.ts#L77-L100
[cv-planning]: https://github.com/danmaz74/cucumber-viz/blob/54b56b48b5dfa15d77bfd88cda639744b3ab3e10/prompts/planning-studio/planning-plan-review.md#L23-L214
