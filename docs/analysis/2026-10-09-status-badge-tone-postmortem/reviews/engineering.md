# Engineering prompt and API-view review

The single engineer invocation had enough information to implement its assigned
change and submit it correctly. It completed on the first submission, with four
focused component tests and both scenarios passing. The main improvements are
to resolve conflicting recovery instructions, remove duplicated machine details,
and clarify which dependencies API views document. This small change gives
limited evidence about discovering and adopting a new foreign application API.

## Coverage and evidence

Reviewed prompt kind **engineer / engineering**, package `engineer/7`, all its
observed instances: `inv-0007`, operation `inv-0007`, display session `ses-0006`,
provider session `14f28d3d-f49c-4a9e-aad2-303bd901a6d6`, work item `wi-001`,
iteration `wi-001.i01`. Actual and requested start were fresh; there was no
inherited history. The starting base was
`44a1f25d246a9ca2609654ca274002acdbbd90ad`; the trial source revision was
`390eef60abbfb9772969b1fd466204588adef138`.

Evidence labels below resolve to these retained files:

- **R:** [result.json](/home/app/ramify-trial-evidence/status-badge-tone-20261009/result.json).
- **P:** [captured plan](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/input/plan.md).
- **C:** [operation correlation](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/ff1b7f6ee06064f3a0abc80318a2309e1cbf2b38c03c016b7ec0874d7ae816f2.json), especially `packet.roleInstructions`, `packet.message`, `packet.additions`, and `declarations`.
- **T:** [resolved display transcript](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0006.jsonl). References `n=N` identify the JSONL record's `n` field. Blob-backed bodies were read from the run's `blobs/<hash>` files.
- **I:** [invocation](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0007/invocation.json).
- **S:** [submission](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0007/submission.json).
- **O:** [outcome](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0007/outcome.json).
- **D:** [candidate patch](/home/app/ramify-trial-evidence/status-badge-tone-20261009/candidate.patch).
- **N:** [first native provider request](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/c2dd9d866fbf4b819e7d14dc73257554197cc364371a002d0eaa0b9488ee477d), schema `ramify.pi-native-request/1`. Its ledger record is [session-ledger.jsonl:256](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/session-ledger.jsonl:256). The nine request payload paths and ledger records for this invocation are indexed by `inventory[invocation=inv-0007].nativeRequestSources` in [measurements.json](/ramify/ramify-agent/docs/analysis/2026-10-09-status-badge-tone-postmortem/measurements.json).

The captured system prompt is 9,513 UTF-8 bytes (hash
`88d92aaba494ed207fa5507c93b5ec4dfcbedcccfb54bb8d335c19656189dd06`);
the current user message is 21,275 bytes (hash
`9d966ea6c8c787c747adef91ac72f916cfafdb09c9bd2ac88e84d9f6b881caf9`).
T n=1-2 and I's manifest agree with C. C retains the seven declarations actually
available: read, grep, ls, edit, write, shell, submit_iteration_result. The
submission schema is explicitly embedded in the submission tool's description;
its generic `inputSchema` is `{ "type": "object" }`. No schema-related rejection
occurred. N establishes the provider-side transformation as well: its
`instructions` exactly equal C's role instructions, its single initial user
`input_text` exactly equals C's current message, and its tools are the same seven
named functions. All nine retained native requests were checked and keep these
same instructions. The first request uses pi package `0.87.1`, SSE transport and
zero configured retries. These artifacts establish what pi sent; they do not
show the provider's internal tokenization or hidden request processing.

## Required-information assessment

| Need at delivery | Evidence and assessment |
| --- | --- |
| Objective and required behavior | Met directly: optional four-value tone, `data-tone`, omission default `neutral`, unchanged labels/status/callers. C's goal, approach and context package reproduce P's constraints. |
| Authority and write locations | Met: shared-ui module root only, guarded features/configuration excluded, architect fixes assignment, engineer reports bindings. Some general recovery/authority prose conflicts are listed below. |
| Execution location | Met directly: absolute project root and shared-ui `src` cwd, explicit distinction between tool-relative and project-relative paths. No wrong-path write occurred. |
| Starting state and dependencies | Met through current source/onboarding pointers, base hash, supplied API-view paths/revision/coverage and actual file tools. T n=4-8 provides onboarding, declaration and pre-change component. |
| Verification | Met: declared audit checks, focused test guidance, exact pending-scenario profile, loaded support globs, scenario text, no-fake requirement. T n=33-42 records successful focused Vitest, focused Cucumber, TypeScript and structural checks. |
| Submission | Met: schema-bearing tool declaration and both obligation IDs. T n=43 submits valid bindings for sc-001/sc-002 with empty fake lists; n=46 accepts, O reports zero rejections. |
| Plan constraints outside the pasted approach | Met directly through all cited functional/nonfunctional requirements in the context package; no access to the protected plan was needed. |

There was no observed placeholder, unavailable required tool, inaccessible
essential document, missing requirement or stale implementation instruction.
The engineer did not clarify, retry a write, repair a failing test or revise its
submission. This supports adequacy for this task while leaving the contradictory
branches below unexercised.

## Findings

### ENG-01 — Medium: conflicting instructions for an unavailable foreign API

**Affected:** inv-0007, C role instructions and message section “What you may
import.” **Expected:** a single actionable handback when required foreign behavior
cannot be used, preserving uncertainty under coverage limits. **Observed:** role
instructions say “submit `capability-needed` with the actual usage, missing
behavior and examples”; the brief says “A symbol you need that is not there is
reported with `unsuitable`, reason `scope`.” The procedure again directs
`capability-needed` if blocked by another owner's behavior. Both views have
reported coverage limits, so absence itself cannot settle API availability.

**Impact/confidence:** high confidence in the contradiction; no realized impact
because no required new application API was missing. It can misdirect the next
engineer into abandoning an assignment instead of requesting a provider task.
The role explicitly directs “Follow the procedure in the current task”; the
procedure points to `capability-needed`, providing the engineer a sensible way
to resolve this conflict. That does not remove the inconsistent current brief.
**Correction:** distinguish an assignment outside the authorized scope from a
missing/insufficient capability inside an otherwise valid assignment, and use
the same submission route throughout. Retain explicit coverage uncertainty.

### ENG-02 — Low: generic control prose contradicts the current procedure and environment

**Affected:** inv-0007, C role instructions versus message/procedure/environment.
**Expected:** one description of engineer, audit and responsible architect
authority, plus recovery limits that match this run. **Observed:** role opening
says the harness “owns that verdict” about whether the iteration is done, while
the current procedure says “whether an obligation is done is the responsible
architect's own judgment and report.” The role promises “one repair round,”
where the environment exposes `repairRoundsPerIteration: 3`. The role says
“You never run git,” while the brief proposes `git diff
44a1f25d246a9ca2609654ca274002acdbbd90ad` to inspect current work.

**Impact/confidence:** high confidence in the conflicting text; no gate repair,
Git call or semantic self-acceptance occurred. The accepted engineer result
remained a completion proposal. **Correction:** explicitly assign suite health
to audit, semantic obligation completion to the responsible architect, and
engineer reporting to the engineer. State repair counts from current limits;
replace the forbidden Git suggestion with an available diff/evidence pointer.
The role's explicit direction to follow the current procedure supports the
responsible architect's semantic authority for this invocation. The finding is
inconsistent general prose, not evidence that the engineer lacked any usable
authority rule or that the harness actually made a semantic completion call.

### ENG-03 — Low: duplicated Cucumber machine details and unrelated orchestration limits

**Affected:** inv-0007's 21,275-byte user message. **Expected:** retain the exact
focused command, pending-tag explanation, support loading and task-relevant
limits without repeated representations. **Observed:** the exact focused command
and support globs appear in a human-readable section, then reappear in an escaped
`cucumberConfiguration` JSON string in `Current environment`. That environment
field alone occupies 2,522 UTF-8 bytes including its key/escaped representation.
The serialized payload is 2,359 decoded UTF-8 bytes and repeats argv, support,
environment-variable names, configuration identity and selection paths. The
environment also prints harness-wide counts for work items, placement requests,
cycle replans, nonfunctional rounds and reconciliation that do not help this
engineer's implementation/submission. The limits object measures 973 bytes when
serialized with four-space indentation; this is an upper bound for any proposed
removal because command timeouts and current invocation limits remain relevant.

**Impact/confidence:** high confidence in repetition, moderate confidence that
selection can preserve every required instruction, no demonstrated failure or
measured token saving. These are UTF-8 byte counts, not provider token counts.
**Correction:** retain one readable focused-command/support description and a
configuration/evidence pointer, and provide role-relevant limits. Keep hashes in
durable records rather than duplicating the full adapter payload in prose. A
comparison run should verify unchanged task information/submission outcomes and
measure actual input/cache cost; repeated content can be cacheable.

### ENG-04 — Low: API-view scope is unclear for package dependencies and empty child views

**Affected:** inv-0007, C API-discovery instruction and T n=3, 11-17. **Expected:**
search the consumer API view for foreign application capabilities, while using
existing patterns/package information for third-party dependencies and recognizing
that a module without children may have no children directory. **Observed:** the
engineer searches `tests/.ramify/external` for
`Given|When|Then|renderToStaticMarkup|@cucumber|assert|expect`; n=15 returns “No
matches found.” Those Cucumber/React/Vitest/Node capabilities are packages or
built-ins outside the application API view's scope. At n=11, listing
`tests/.ramify/children` returns “Path not found.” The module declaration n=5
has no children. The required external view was present and readable.

**Impact/confidence:** high confidence in the wasted package lookup and one
nonfatal directory error; the prompt's omission is a plausible contributor,
not proven sole cause. Neither event prevented implementation. **Correction:**
briefly state that API views document foreign application source, not packages or
built-ins, and that a nonexistent external/children subtree can be empty rather
than a failed materialization. Preserve the supplied coverage caveat; do not
treat either no-match result as proof of absent application behavior.

## Engineer materialized-API effectiveness

The prompt supplied ordinary and testing API roots at
`rev/1:72adef7d-a384-4db0-8922-01f5af63b30c:4`, with one and two coverage limits
respectively (C; I). Historical access is established by T's returned content;
today's generated view contents are unnecessary to this conclusion. The
engineer made **seven API-view calls out of eighteen read/search/list calls**:
four listings (one missing children path), two searches and one page read.
All seven were directed to the testing view; zero were directed to the ordinary
view. This is an access count, not a usefulness/adoption percentage.

### Capability inventory and stage tracing

| Need or exploration episode | Supplied / consulted | Applied / verified | Classification |
| --- | --- | --- | --- |
| Preserve existing ordinary-source `ReviewStatus` dependency in `StatusBadgeProps` and `defaultLabels` | View roots/revision/limits supplied. T n=8 shows the existing ordinary import from `../../contracts/src/interfaces/vocabulary.js`. T n=17 searches the testing view for `ReviewStatus`; n=23 reads its vocabulary page, showing the type-only alias and `reviewStatusSchema` enum with passed/failed. | Import and uses retained unchanged in D; focused type/structural checks passed (T n=41-42). No ordinary-view lookup occurred and no new import was introduced. Cannot attribute ordinary importability to the testing view. | One continuing foreign application dependency, weak evidence of view-assisted understanding, no evidence of new adoption from the proper consumer view. No contracts provider-source inspection. |
| Need scenario-local state compatible with the configured Cucumber World | C supplied support import globs. After the package-oriented API grep, T n=19 searches foreign integration-test steps/support, results n=20-21 expose `CollectionReviewWorld` and its registration/hook usage. | T n=30 implements a local `WeakMap<IWorld, BadgeScenarioState>` with package `IWorld`, avoiding a foreign application import. Focused Cucumber passes both scenarios/nine steps (n=37). | One foreign-source support/compatibility exploration episode; no selected foreign application capability and no missing-capability handback. Useful question, expensive result selection. |
| Render real badge and assert scenarios/tests | Own existing static-markup tests read at n=13; package manifest read n=18. API grep n=15 provides no package API documentation. | Real same-owner StatusBadge/StatusBadgeProps, package renderToStaticMarkup, Cucumber Given/When/Then/IWorld, Node assert and existing Vitest functions used; n=36-42 checks pass. | Packages/built-ins and same-owner APIs excluded from foreign-application API adoption denominator. |

Denominators and outcomes:

- **New foreign application capability needs/imports: 0.** View-assisted new
  adoption, incorrect new API use, unresolved new need and capability requests
  are all zero; adoption percentage is **not applicable (0 denominator)**.
- **Continuing foreign application dependencies relevant to changed code: 1**
  (`ReviewStatus`). One testing-view consultation, zero ordinary-view
  consultations, one retained existing use, zero observed incorrect uses, zero
  unresolved dependencies. Attribution of a changed/new use to view information
  is **unknown/not demonstrated**, not a 100% adoption success.
- **Foreign support source-discovery episodes: 1**, with two grep calls, no
  foreign support import, one local/package solution. This overlaps the scenario
  implementation episode; it is not a second adopted foreign capability.

The two foreign support greps return 18,267 and 8,275 UTF-8 bytes respectively
(T n=20-21), **26,542 bytes** together. They answer whether a custom World and
hooks are loaded, but much returned text concerns catalog, MCP and review
behavior that the badge steps never use. A focused read/search for World
registration and hook effects could preserve the useful answer with less
unrelated material. This is an exploration improvement, not evidence that the
testing API view should contain the project's internal support code or every
package API. The local WeakMap solution correctly avoids exposing/importing a
foreign World merely for scenario-local state.

T n=23's vocabulary page is usable for type/value distinction and passed/failed
meaning: it marks `ReviewStatus` type-only and includes the referenced schema.
The engineer did not guess a provider import, import generated documentation,
use a type-only export as a value, request an already available capability or
treat coverage-limited absence as decisive. This is a positive boundary outcome,
but the task is too small to establish how engineers perform on substantial new
cross-module API reuse.

## Observed result and limits

The implementation adds exactly the optional tone union/default/attribute,
retains existing labels/status behavior and existing component tests, and adds
scenario-local real-component steps (D). The focused evidence is four Vitest
tests, two Cucumber scenarios/nine steps, TypeScript success and a completed
Ramify check with partial coverage and no denied accesses (T n=36-42). The
engineer's completion proposal binds both scenario IDs with no fakes, and its
first submission is accepted (S; O). No testing was rerun for this postmortem.

Acceptance by the submission tool establishes a valid engineer handback; audit
suite health and subsequent responsible-architect semantic acceptance remain
separate evidence handled in the main postmortem. O records 101,449 ms, 48,975
input, 119,936 cache-read and 3,829 output tokens. Those totals include later
model turns; they do not establish first-request cache reuse or the cost saving
from removing any particular paragraph.

The retained native request verifies instructions, input and ordered tools on
the provider boundary; provider-internal processing remains unobserved.
View roots/identities and consulted page contents
are retained, but a complete frozen snapshot of each view at delivery was not
needed or verified here. In particular, coverage counts are not a complete list
of their underlying limitations. No new foreign application API need exercised
the conflicting handback instructions, incomplete signature companions or an
ordinary-source view lookup. These remain limits on generalizing from this run.
