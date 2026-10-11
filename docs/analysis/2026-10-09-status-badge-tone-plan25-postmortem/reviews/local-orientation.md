# Local architect orientation (inv-0004)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture, harness revision 474ffa58 (Plan 25 branch), `openai-codex/gpt-5.6-sol:high`, pi 0.87.1.

## Summary

The orientation prompt for work item `wi-001` gave the local architect of `collection-review/workspace/shared-ui` everything it needed: the goal, the complete functional and context elements, both scenarios, its module paths, both API views, the architect view, the declared checks with configuration pointers, the default write scope and a clear submission contract. The agent explored in three parallel batches (23 non-submission calls, 40,766 returned bytes, 33.9 s wall time), submitted an accurate orientation on the first attempt with no open questions, and its understanding carried the rest of the session: the following assignment turn (inv-0006) needed no further tool calls. No required information was missing. The findings are minor. About 2.5 KB of the 17.9 KB first message duplicates other blocks or is not usable by this role. The agent searched API views by grepping every line, which returned about three times the bytes of the views themselves. Consumer discovery went straight to a project-wide source grep without the architect view the system prompt names for dependency questions. In this run that grep was focused and useful, and the post-run architect view could only partly have answered it. One within-invocation request missed the provider cache although its prefix was preserved; the cause is unknown.

## Coverage

| Kind | Variant | Invocation | Session | Start | Evidence used |
|---|---|---|---|---|---|
| local-architect `orientation` | fresh, first turn of ses-0004 | inv-0004 | ses-0004 (pi 827b658b…) | fresh (requested and actual) | `invocation.json` manifest (28 appended entries), packet correlation `27e46190…json`, all 4 native requests (`77636d05…`, `f81881e4…`, `20384e69…`, `da51c52d…`), transcript `ses-0004.jsonl` lines 1–33, `submission.json`, `outcome.json`, `observations.jsonl` |

All four native requests were retained. Delivered system instructions (4,045 bytes, `local-architect.system.md` hash `68450a29…`), tools (`read`, `grep`, `ls`, `submit_work_orientation`; 3,590 bytes) and the 17,913-byte user message match the manifest. Reasoning items are encrypted. Only their summary headings are visible.

## Required information

| Need | Status | Where |
|---|---|---|
| Objective (orient only, no assignment) | Met directly | `brief:support:# Orientation task`, `procedure:local-architect:orientation`, `task` block |
| Goal, functional and context elements | Met directly, complete text | `brief:goal`, `brief:requirements` (ctx-001, fr-001…fr-005) |
| Non-functional elements | Deliberately deferred, and the prompt says so | "Non-functional, fixed and recommendation elements are selected after orientation." |
| Scenarios, feature file, step location | Met directly | scenarios block, `scenario-files` block |
| Authority and write scope | Met directly | `## Default write scope`; system prompt says the architect writes nothing |
| Execution location and path semantics | Met directly | `environment:workingDirectory` (`…/shared-ui/src`), `environment:projectRoot`, system prompt "Relative paths in your tool calls resolve against it" |
| Received interfaces | Obtainable through a clear pointer | API view paths and revisions with coverage counts in `## Your module` |
| Global ownership and consumers | Obtainable through a pointer | architect view path in `## Your module` and `environment:views`; system prompt names it for ownership, placement and dependency questions |
| Verification expectations | Met through pointers | `## Declared project checks` with `package.json` and `cucumber.js` pointers |
| Stylesheet location (fr-002 names "the stylesheet") | Not supplied; obtained by a source search | `subs/workspace/src/styles.css`, outside the module |
| Submission contract | Met directly | `submit_work_orientation` declaration (schema in the description) |

Nothing was missing, contradictory or inaccessible at delivery time. Two pointers in the briefing could not be used, as finding O-2 explains.

## Findings

### O-1. Duplicated module pointers and restated orientation instructions (low)

Affected: inv-0004, inherited by inv-0005, inv-0006 and inv-0011.

Location: first user message, blocks `brief:support:module-pointers` (1,297 bytes) and `brief:support:## Your module:0` (2,252 bytes). The README, declaration, source, test-area and both API-view paths appear in both. `module-pointers` adds only "Read its metadata for revision and coverage limits", which `## Your module` already summarizes as "coverage limits: 1, so absence is not proof". The orientation instruction also appears three times: the `# Orientation task` brief (418 bytes: "Read the supplied elements and explore your module … Submit your orientation using `submit_work_orientation`"), the 1,213-byte procedure and the 439-byte task block. `environment:limits` (1,074 bytes) carries run-level limits such as `maxWorkItems`, `runAbsoluteMs` and `nonfunctionalRoundsPerPlan`, which no orientation decision uses. Its per-engineer subset is restated in `## The bounds of an engineer`.

Expected: one statement of each fact. Observed: about 2.5 KB of repetition or irrelevant limits in a 17.9 KB message. Using the run's own new-input measure (inv-0006 appended about 35 KB and was billed about 8.9 K uncached tokens, roughly 4 bytes per token), that is about 600 tokens. They were paid once uncached, because this was a fresh session, then cached by later requests. Impact on behavior: none observed. Confidence high on the sizes. This is a relevance issue more than a cost issue.

Correction: drop `module-pointers` when `## Your module` is present, or merge them into one block. Keep one orientation instruction (procedure plus task header). Omit run-level limits from a role that cannot act on them, or replace them with a pointer.

### O-2. Harness-source support paths presented as environment (low)

Affected: inv-0004, and inv-0005 and inv-0006, which replaced the block with other harness paths.

Location: `environment:supportPaths` = `["subs/harness/src/prompts/local-architect.system.md", "subs/harness/src/context-selection/orientation.procedure.md"]`. The briefing says "Any project-relative path in this briefing resolves from the project root", but these paths are relative to the ramify-agent package, not the collection-review project. They cannot be read from the agent's tools.

Expected: environment fields name only paths the agent can use. Observed: a block of provenance data that looks like a path pointer. The agent never tried to read it, so nothing followed from it. Confidence high that it cannot be resolved, low that it causes harm. Correction: keep the source provenance in the manifest and remove it from the delivered environment, or label it explicitly as harness provenance that is not readable.

### O-3. API-view lookup by grepping every line (low)

Affected: inv-0004, transcript lines 12–24.

Location: calls `grep {"path":".ramify/external","pattern":".","limit":100}` (9,627 bytes returned) and the same call on `tests/.ramify/external` (9,460 bytes). These were followed by `read …/vocabulary.ts.md offset 27 limit 92` in both views (1,882 bytes each, identical content) because the line-limited grep stopped partway through the page. The views hold three pages totaling 6,883 bytes: ordinary `vocabulary.ts.md` 3,252, tests `vocabulary.ts.md` 3,252 and tests `fixture.ts.md` 379. The API-view lookup took 10 calls and returned 23,236 bytes.

Expected goal: establish which foreign interfaces the module receives. The system prompt says: "Name the hidden directory explicitly in `grep`'s `path`, then read the matching pages." Observed mismatch: at orientation the agent had no symbol to search for, `ls` is not recursive (`ls .ramify/external` returned only `subs/`), and no index file lists the pages. A grep for every line was the practical way to list them. The agent also read the identical contracts page twice, correctly following "Each view applies to its own source area; do not combine them". The result was correct and was used: the orientation names `ReviewStatus` as the only received interface and notes coverage limits. About 16 KB of avoidable returned bytes, roughly 4 K tokens at the measured ratio. Confidence high.

Correction: give the views a small page index (in `_meta.json` or an `index.md`), or list each view's page paths in `## Your module` when they are few. Separately, `_meta.json` records only `"coverage":1` / `"coverage":2`, with no description of the limits.

### O-4. Consumer discovery went to source without consulting the architect view (low, observation)

Affected: inv-0004, transcript line 22.

Location: `grep {"path":"../../../../../","pattern":"StatusBadge","glob":"*.{ts,tsx}","context":2,"limit":50}` (5,656 bytes) and `grep {"path":"../../../../../","pattern":"status-badge","glob":"*.{css,ts,tsx}","context":3,"limit":50}` (4,378 bytes), both from the project root. Neither call touched `.ramify-architect/`. The globs exclude the views' `.md`, `.json` and `.jsonl` files, and the results contain no hidden-directory hits. The system prompt says: "If local evidence leaves an ownership, placement or dependency question, search the `.ramify-architect/` directory … Read foreign source when a specific question still needs it." The orientation procedure says: "use global discovery only for questions that local evidence cannot answer."

Expected: an architect-view lookup for consumers, then focused foreign source. Observed: the README already named both consumers ("the status badge that both the catalog card and the review result render"). The agent wanted call-site shape and the stylesheet's location, so it searched source directly. The post-run architect view (`.ramify-architect/workspace/shared-ui/module.json`, revision `…:11`, regenerated after the run) records `usedBy` catalog/ui and reviews/ui/pure-ui as behavioral users, and `behavior.jsonl` lists them for `StatusBadge`. Assuming the run-time view at revision `…:1` held the same facts, it would have answered only the question of who uses the badge. Neither caller's props usage nor `styles.css`, which is CSS in the parent `workspace` module, is in the view. The two greps were targeted, ran in parallel, and their results directly support two orientation conclusions: "this does not require changing either existing caller" (later nfr-003) and "No stylesheet change is required by the supplied acceptance". Impact: no avoidable rediscovery. This is a reasonable, focused source-first episode. Confidence medium, because the run-time architect-view content was not retained.

Correction: no prompt change is required by this run. If consumer compatibility is a recurring orientation question, the `## Your module` block could carry the architect view's `usedBy` list (two lines here). That would make the view-first route cheaper than a grep, and caller-shape checks would remain a focused source follow-up.

### O-5. Provider cache miss on request 3 despite a preserved prefix (observation, cache)

Affected: inv-0004, third native request (`20384e69…`, 37 input items).

Usage per request: 1) 6,240 new / 0 cached; 2) 1,434 / 6,144; 3) 13,276 / 0; 4) 4,202 / 13,184. I compared the retained requests 2 and 3 item by item: the input prefix was preserved, instructions and tools were equal, and `prompt_cache_key` (`827b658b…`) was the same. The gap between the calls was about 5 s. Cache eligibility was intact, but the measured hit was zero, and the reason is unknown from the retained evidence. Estimated extra cost at recorded rates is about $0.04 (13.3 K tokens at $4/M instead of about 11.9 K at $0.4/M). This is not a prompt defect. Treat it as a hint for the cache review.

### No issue found

Path handling worked. The agent translated project-relative briefing paths into cwd-relative tool paths without error (for example `../../../../../cucumber.js` and `tests/features/…`). The single tool error, `ls tests/steps` returning "Path not found", was consistent with the briefing's "observed files: (none)" and cost nothing. The submission was accepted first time, and its `startingPoints` were project-relative as the schema requires.

## Architecture-discovery classification (local architect, all of ses-0004's own invocations)

Method: I took every non-submission tool call of inv-0004, inv-0006 and inv-0011 from `transcripts/ses-0004.jsonl` and resolved each argument path against the recorded cwd `…/collection-review/subs/workspace/subs/shared-ui/src`. I classified each call by its resolved target. `module.ramify` and `README.md` count as module documentation, and `package.json` and `cucumber.js` as project configuration. Returned bytes are the transcript's result `bytes`. Their sum, 40,766, equals the inventory's `returnedBytes` for inv-0004.

All calls by target:

| Invocation | Architect view | API view | Direct source/tests | Module docs | Project config | Git (`inspect_git`) | Unknown/mixed | Total |
|---|---|---|---|---|---|---|---|---|
| inv-0004 (orientation) | 0 | 10 (23,236 B) | 9 (13,547 B) | 2 (1,052 B) | 2 (2,931 B) | 0 | 0 | 23 (40,766 B) |
| inv-0006 (assignment) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| inv-0011 (assignment after iteration) | 0 | 0 | 3 (4,939 B) | 0 | 0 | 2 (8,036 B) | 0 | 5 (12,975 B) |
| Total | 0 | 10 | 12 | 2 | 2 | 2 | 0 | 28 |

Architecture-discovery subset. These calls answered what the module already does, what it receives, who uses it, and where related behavior lives. The other calls were test-runner setup (package.json, cucumber.js, existing test file, feature file, two `ls` of test directories) or iteration verification (all of inv-0011).

| Target | Calls | Share (denominator 17) | Returned bytes |
|---|---|---|---|
| Architect view | 0 | 0% | 0 |
| API view (ordinary 5, tests 5) | 10 | 58.8% | 23,236 |
| Direct source (own `ls .`, `ls tests`, `status-badge.tsx`; two project-root greps) | 5 | 29.4% | 11,362 |
| Module documentation (`../README.md`, `../module.ramify`) | 2 | 11.8% | 1,052 |
| Unknown or mixed | 0 | 0% | 0 |

Unique targets: 14 distinct paths or directories among the 17 calls. Both `external/` directories were listed and also searched, and the project root was searched twice with different patterns. `status-badge.tsx` was read once in discovery and again in inv-0011 for verification. No search was repeated, but two reads (`vocabulary.ts.md` in both views) returned identical content. Tool time for all 23 orientation calls was 3,430 ms of 33,919 ms wall time. Model time was 32.8 s over four requests, so discovery cost is dominated by model turns (three exploration rounds), not by tools.

Episodes:

| Episode | Question | Route | Outcome |
|---|---|---|---|
| E1 local behavior | What does shared-ui already do and expose? | Module docs then own source (README, declaration, `status-badge.tsx`), as the procedure directs | Correct and used: props, `data-status`, exposure "to parent" |
| E2 received interfaces | Which foreign interfaces can source and tests use? | View-first (API views only) | Correct: `ReviewStatus` from contracts; inefficient enumeration (O-3); no source fallback |
| E3 consumers and stylesheet | Will existing callers or the stylesheet need to change? | Direct-source-first (project-root grep); architect view not consulted | Correct and used in the orientation; architect view could have answered only the consumer-owner part (O-4) |

View-first episodes: 1. Direct-source-first episodes: 1 global (E3), plus the instructed local reading (E1). Source fallback after a view lookup: 0. Over the whole session the architect view was never read. Its only potential contribution, consumer owners, was already in the module README.

## Observed effects

The orientation was adequate at delivery time. The sequence of three batches followed by the submission (transcript lines 3, 12 and 22, then 29) shows directed exploration with no clarification, no rejected submission and one harmless `ls` miss. Its value is shown downstream: inv-0006 assigned the iteration from inherited understanding with zero tool calls, and the engineer's iteration passed its gate first time. The excess material (O-1, O-2) shows no behavioral effect. The search pattern (O-3) is a correlation with missing view navigation affordances, not with the prompt text.

## Correction suggestions

1. Merge `module-pointers` into `## Your module`, and remove the duplicate orientation instruction and the run-level limits from the orientation briefing (O-1). Validate by checking that a later orientation shows the same exploration pattern with a smaller first message.
2. Remove or relabel `environment:supportPaths` as provenance that cannot be read (O-2).
3. Add a page index to each API view, or list the pages in the briefing when there are few (O-3). Validate by counting API-view calls and returned bytes in the next orientation.
4. Optionally surface the architect view's `usedBy` for the assigned module in `## Your module` (O-4). Keep focused caller-source inspection as the follow-up for call-shape questions.

## Evidence gaps

The architect view at the run-time revision `rev/1:…:1` was not retained. The copy in the project is revision `…:11`, regenerated after the run, so O-4 assumes unchanged consumer facts. Reasoning content is encrypted, so the agent's motive for the project-root grep is inferred from its summary headings ("Inspecting status-badge usage and styling") and its submission text. No provider tokenizer was available: sizes are bytes, and token figures are estimates from the run's own usage deltas. The cause of the request-3 cache miss cannot be established from the retained requests.
