# Plan 29: common prompt passages and direct task prose

**Date:** 2026-10-09. **Status:** proposed; implementation not started.
Source inspected at `5553510ae39fb62ac0b303e63e4f1455759dc6ae`.

## Outcome

Each prompt is assembled from substantial common passages and text unique to
its task. Common passages are written once and, when already held unchanged at
the selected session point, are not delivered again. Useful facts currently in
JSON environment blocks move into those passages or direct current-task prose.
Both JSON environment rendering paths are removed from newly authored prompts.

An engineer, for example, receives its procedure, work-item requirements,
module/API context and check instructions, followed by its assignment, effective
execution bounds and current evidence. It receives one focused scenario command,
not that command plus a JSON configuration containing the same information.
A scope-review fork reuses the same work-item package its parent held, rather
than withdrawing it and delivering it again under a different heading.

This implements the bounded direction selected after the
[candidate investigation](../../analysis/2026-10-09-common-prompt-block-candidates.md).
It supersedes the broad declaration-table direction in
[Declared task blocks](../../analysis/2026-10-09-declared-task-blocks.md).
That analysis remains historical evidence; this plan does not adopt an
exhaustive runtime block registry, a semantic relevance engine or a new cache.

## Why this scope

The retained trial already avoided appending 34,297 framed bytes of substantial
current inherited passages. Those are existing savings in delivered text, not
additional savings promised here. Remaining concrete opportunities include a
roughly 3 KB work-item package resent to its scope-review fork, overlapping
Cucumber inputs, repeated engineer binding rules, and stable scenario/reporting
instructions resent alongside changing status.

This plan improves composition using the existing mechanism. Equal text in
independent fresh sessions still needs delivery. No token, cost, latency or
quality benefit is asserted or required as an acceptance threshold.

## Current implementation and ownership

All production changes belong to the harness and its existing review child;
the web module continues to project the delivered manifests it already reads.
No new public API or module is proposed. Discover any necessary foreign access
through the consuming module's generated API view before adding an import.

| Existing surface | Use in this plan |
| --- | --- |
| `subs/harness/src/prompts/packages.ts` and role/procedure Markdown | Keep stable role/package handling and existing shared passage expansion; remove its fallback `# Current environment` JSON renderer. |
| `prompts/tasks.ts` | Retain role/task procedure selection, required submission binding and actual execution inputs; replace nine environment JSON deliveries with composed prose. |
| `prompts/blocks.ts`, `prompts/briefings.ts` | Retain exact effective-state resolution, invariant framing, briefing occurrences and explicit withdrawals. |
| `run/session-operations.ts` | Preserve exact source points, immutable admitted operations, authority and active-tool binding; adapt callers for common named sections. |
| `work/task-support.ts` | Stop deriving migrated shared passages from rendered heading text; leave remaining unique support on its existing path until no caller needs it. |
| `work/session.ts`, `work/engineer.ts`, `work/starting-inputs.ts`, `work/scenario-briefing.ts`, `work/obligations.ts`, `context-selection/` | Compose shared work-item/module/check passages and current task inputs once. |
| `run/service.ts`, `subs/reviews/src/message.ts`, `nonfunctional/prompts.ts` | Supply candidate-bound and role-appropriate facts, replacing opaque task-input dumps with readable sections. |

Paths after the first row are relative to `subs/harness/src/`, except the reviews
child, which is relative to `subs/harness/`.

## Composition decisions

### Substantial passages selected for this change

1. **Existing procedures and scope rules.** Preserve whole useful procedures,
   including the existing shared architect write-scope passage. Consolidate
   duplicated writer navigation/import/check rules through existing package
   assembly where the consumers actually share them. Preserve writer versus
   read-only and architect versus engineer responsibilities.
2. **Work-item requirements and selected context.** Use the existing package
   content owner and one explicit identity across architect, engineer and
   reviewer producers when they supply the same selection and meaning. Keep
   current assignment intent and deviation state explicit. Deliver the captured
   plan once; do not strip its text and leave an empty `<plan>` wrapper.
3. **Module and navigation context.** Combine overlapping owner/README/source/
   test/API pointers. Supply only views available to the role, with source-area
   distinctions and their known revisions/limits. Preserve source-absent cwd
   fallback. Actual current cwd is stated separately when it changes.
4. **Declared checks and focused execution.** Share configured check guidance;
   supply the exact prepared focused command once, preserving cwd, arguments,
   necessary environment and runner support information. Candidate reviewers
   receive read-only configuration pointers rather than writer instructions.
5. **Binding and reporting rules.** Give stable engineer binding rules one home;
   consolidate the architect's overlapping scenario/reporting reminders. Keep
   frozen scenario text once, separately from current state, revision, binding,
   fakes and prior judgments. Engineers report bindings; architects judge done;
   passing audit evidence does not perform either semantic action.

Selected design guidance keeps its existing content owner and complete text.
Its new preparation and grounding behavior belongs to Plan 28. Other specialized
procedures (catalog extraction, contract work and failure analysis) remain
substantial units. Remove their duplicate environment delivery and obvious
within-prompt duplication; do not create new tracked blocks for small clauses.

### Facts that stay in current-task prose

The current objective, role/procedure selection, submission tool, actual cwd,
effective invocation bounds, candidate/comparison, current obligation rows,
assignment scope, repair diagnostics/attempt, consultation question and current
evidence are direct task text. Shared render functions are allowed; individual
fields do not become independently tracked blocks merely for consistency.

State that these facts describe the current task and supersede earlier task
facts. A snapshot-only task explicitly says it has candidate-relative snapshot
access, not access to a previously inherited worktree. A changed fact appears
even when its value occurred at an older point in the conversation.

### Complete replacement of environment JSON

| Existing field | Replacement |
| --- | --- |
| `projectRoot` | Project/module navigation or a relevant path-resolution sentence. |
| `workingDirectory` | Actual current execution-location sentence; snapshot-only tasks instead state their access model. |
| `candidate`, `snapshot` | One current evidence/comparison section, preserving distinct commit/tree/snapshot identities. |
| `limits` | Assignment authors receive applicable defaults and ceilings; writers receive effective command/idle/absolute values; repair receives relevant current attempt facts. Runtime-only counters are omitted. |
| `availableTools` | Existing declarations and active-tool notices plus task-specific submission and authority instructions. |
| `views` | Applicable navigation passage with paths, source areas and known revision/coverage information. |
| `supportPaths` | Delivered-manifest provenance; no target-project navigation to harness prompt sources. |
| `cucumberConfiguration` | Applicable check/scenario prose with exact executable facts, delivered once. |

This table is an implementation checklist, not a runtime requirements matrix.
Optional facts/pointers remain optional; this change adds no completeness gate
or filesystem probing. Required goal, submission, candidate and authority
validation remains in force independently of prompt formatting.

Task-level serialized review requests and NFR source/assessment inputs should
render their useful content as prose using their existing data owners: exact
candidate/comparison identities, intent, permitted scope, results, evidence and
uncertainty. Preserve dirty-original-capture and net-diff limitations. Supply
accepted investigation content when an action depends on it; do not direct a
snapshot-only agent to inaccessible harness records. Use existing authenticated
records, not transcript mining or a new evidence-acquisition workflow.

JSON examples needed to explain a submission, actual tool schemas, quoted plan
content, runtime records, validators, authorization and manifest formats remain
structured where their contract requires it. The removal targets environment
and opaque briefing serialization, not every occurrence of JSON syntax.

## Delivery and compatibility contract

- Use ordinary pure render functions and existing Markdown fragments. Assign
  explicit section keys to the selected common passages at their producer.
  A heading or content hash alone is not their identity. Do not merge different
  work items, purposes or evidence bindings just because their text matches.
- A shared passage's body is independent of neighbor spacing. Assemble it once;
  do not strip duplicated goal/requirement text from inside an already rendered
  shared passage. Preserve quoted documents/code literally, including meaningful
  whitespace. Migrate selected passages out of `taskSupportSections` before
  applying its existing fallback to remaining unique support.
- Deliver selected common sections through the existing briefing/block resolver.
  On a fresh session, supply every applicable passage. A continuation/fork may
  omit it only when the selected point already holds its current value. Keep
  A → B → A, withdrawal/reactivation, selected-procedure hashes and current-task
  selection behavior. Do not introduce a parallel set of delivered hashes.
- Keep selection distinct from validity. Callers explicitly restate required
  current common sections so the resolver can inherit them; do not rely on a
  blanket retain-everything switch. Preserve selector retention and existing
  structural withdrawal policy. A stale/withdrawn passage cannot become current
  through omission or a matching historical body.
- If an admissible selected point contains old `environment:*` set entries, a
  new-format task explicitly withdraws them once and supplies current prose.
  Historical entries stay physically intact. Do not revive the old JSON writer
  or infer authority from the old values. An old brief key replaced by a new
  explicit key similarly gets a normal withdrawal and current set; no heuristic
  alias recognition is required for historical headings.
- Retries/recovery of an already admitted operation reuse its retained packet,
  declarations, environment and destination exactly, even when it is legacy JSON.
  New-format writers do not rewrite historical `/1` or `/2` evidence. Preserve
  pinned role/package checks and current recovery refusal on changed packages;
  this plan does not enable hot-upgrading a run's pinned instructions.
- Preserve runtime cwd, effective bound merging, tools, validators, destinations
  and writer/read-only authority independently of prompt prose. Accurate source
  provenance follows all newly shared fragments. Existing manifest readers and
  historical environment entries remain supported; no new schema is intended.

## Relationship to other work

[Plan 25](../25-carry-discovery-forward/main-plan.md) is the implemented delivery
foundation. [Plan 26](../26-instruction-block-delivery/main-plan.md) redirects to
it; there is no second delivery implementation to schedule.

[Plan 28](../28-design-review-guidance-sessions/main-plan.md) is independent and
still proposed at this baseline. This plan preserves today's design-orientation
and snapshot-grounding rules. It neither creates prepared sessions nor treats
delivered guidance as an accepted ground. If Plan 28 lands first, preserve its
accepted behavior and compose through its guidance builder instead. Serialize
edits to shared reviewer/package/service/session files, and rerun the affected
integration cases on the combined candidate. Plan 28's naming and reuse-breadth
decisions are not prerequisites here.

[Plan 27](../27-projections-extraction/main-plan.md) may move projection ownership.
Recheck paths against the implementation checkout and serialize overlapping
`run/service.ts` work; prompt composition does not change projection ownership.

## Implementation sequence

Use an isolated checkout and preserve unrelated user work. Execute three serial
iterations: they share package, briefing and service files. No parallel write
ownership is claimed. Record each commit, focused checks and remaining issues in
its result receipt during implementation.

| Iteration | Deliverable | Prerequisite |
| --- | --- | --- |
| [1: author and inspect](iterations/01-author-passages.md) | Shared prose/render helpers and complete fresh/continued/forked prompt examples, before runtime wiring | Inspected implementation base and baseline full audit |
| [2: integrate delivery](iterations/02-integrate-delivery.md) | All task families use composed prose; both environment JSON writers removed; current facts and legacy transitions correct | 1 |
| [3: qualify](iterations/03-qualify.md) | Combined behavior, documentation and final committed full audit | 2 |

The [manifest](iterations/manifest.json) records dependencies and case ownership;
the [acceptance cases](acceptance.md) are deterministic delivery/authority checks,
not an automated judgment that wording is semantically sufficient.

Iteration 1 produces reviewable examples from synthetic fixture data. The
implementer inspects them against the existing role/task contracts and records
that assessment before integration. This is ordinary engineering review, not a
new mandatory user-approval pause or a model-scored prompt-quality gate.

## Verification and boundaries

Use the [project testing specification](../../testing.spec.md). Ordinary tests
script all Git, CLI, audit and command boundaries. Extend existing prompt and
session tests rather than creating a parallel test harness. Tests assert useful
facts, their authority and physical delivery; avoid giant prose snapshots that
only mirror the new implementation.

Take a baseline full audit from the clean committed implementation base. After
focused checks and `npm run type-check` / `npm run check:self` in `ramify-agent/`,
qualify the final clean committed integration candidate from the repository root:

```sh
ramify-agent/node_modules/.bin/ramify-audit audit --project-root ramify-agent --cwd . --full --nested --json
```

The audit retains every configured project. Unrun, blocked and skipped checks
are reported as such. No direct whole-suite substitute, paid live trial, model
cache experiment or performance threshold is added. Existing observations let
Dan assess benefit later; neither fewer bytes nor a green suite proves it.

Outside scope: session topology, model/reasoning changes, context rebuilding,
compaction, role merging, new tool/submission protocols, audit selection,
automatic semantic relevance, a prompt-workbench product, and a project-wide
common-block registry. Implementation updates current specifications; this
planning change does not rewrite them or historical result receipts.
