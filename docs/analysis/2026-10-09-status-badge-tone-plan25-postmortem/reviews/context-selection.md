# Context selection (inv-0005)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, harness revision 474ffa58 (Plan 25 branch), `openai-codex/gpt-5.6-sol:high`.

## Summary

The context selector was forked from the local architect's orientation turn (ses-0004 turn 1, checkpoint `24b48587…`). It inherited the full orientation briefing and exploration history (items 0–52, about 80 KB of request JSON). Appended to that were a role message, the `submit_context_selection` declaration, an active-tools notice and a 3,857-byte task listing the four non-functional elements. It made no tool calls, sent one model request (6.3 s, an estimated $0.022), and its submission selected nfr-001…nfr-004 with reasons that cite facts from the inherited exploration. It was accepted first time. The first post-fork request read 17,280 of 19,571 input tokens from cache (88.3%), with instructions, tools and the parent's last request preserved as an exact prefix. The prompt was adequate. One affordance could not be used: "You may read a captured document" has no path, and the working directory is an empty directory. The selector's reasons and conditions are recorded but never reach the architect. The rendered package shows only the catalog's own "Conditions: none recorded". Inherited orientation blocks that no longer apply were not withdrawn at the fork, but the task header disambiguates them. Nothing went wrong in this run.

## Coverage

| Kind | Variant | Invocation | Session | Start | Evidence used |
|---|---|---|---|---|---|
| context-selector `selection` | fork from inv-0004 turn 1 | inv-0005 | ses-0005 (pi 8501c2e4…), forked from ses-0004 (pi 827b658b…) | fork (requested and actual) | `invocation.json` manifest (28 inherited and 10 appended entries), packet correlation `88890887…json`, native request `8a7a5cdc…` (the only one), transcript `ses-0005.jsonl`, `submission.json`, selection record `work/wi-001/selection/2026287f….json`, `outcome.json`, `observations.jsonl`, `summary.json` boundary entry |

## Delivered inputs at the boundary

The native request has unchanged `instructions` (the local-architect system prompt, 4,045 bytes), unchanged native `tools` (`read`, `grep`, `ls`, `submit_work_orientation`) and the same `prompt_cache_key`. The inherited input items 0–52 are byte-identical to the parent's last request plus its submission and result. Appended items:

| Item | Content | Bytes (request JSON) |
|---|---|---|
| 53 developer | Selector role ("You are a read-only context selector … You forked from its local architect after it oriented … so you know what it read.") | 512 |
| 54 additional_tools | `submit_context_selection` (schema in the description) | 806 |
| 55 developer | "Active tools: read, grep, ls, submit_context_selection. Inactive historical tools must not be called." | 137 |
| 56 user | Briefing delta: the package header listing nfr-001…004, the four NFRs in full, the selector procedure, `environment:workingDirectory` = `…/work/wi-001/selector-workspace`, `availableTools`, `supportPaths`, task header | 4,041 |

The manifest marks the 28 orientation entries `inherited` and these additions `appended`. Nothing was marked withdrawn.

## Required information

| Need | Status | Where |
|---|---|---|
| Objective (select which elements an engineer must keep in view) | Met directly | `procedure:context-selector:main`, task header "Perform selection for {"workItem":"wi-001"}" |
| Candidate elements in full | Met directly | `## Non-functional requirements of the plan` (nfr-001…004); no fixed or recommendation elements exist in this catalog |
| Understanding of the work item and module | Inherited | orientation history: goal, fr/ctx elements, source reads, consumer grep |
| Authority (read-only, no waiving) | Met directly | role message; "Omitting an element never waives it" |
| Submission contract | Met directly | `submit_context_selection` declaration |
| Access to captured plan documents "to settle a doubt" | Missing pointer | no path to `…/jobs/<run>/input/plan.md`; working directory is the empty `selector-workspace` |
| Execution location | Met, but changed from the parent | new `workingDirectory`; inherited history used paths relative to `shared-ui/src` |

## Findings

### S-1. "Read a captured document" has no usable pointer (low)

Affected: inv-0005.

Location: the task message, rendered by `contextSelectorMessage` in `subs/harness/src/context-selection/prompts.ts`: "You may read a captured document to settle a doubt; answer with IDs only." The procedure repeats it: "You may read a captured document to settle a doubt, but answer with IDs only". `environment:workingDirectory` is `…/plans/status-badge-tone/.harness/jobs/20261009T193340Z-51f42e/work/wi-001/selector-workspace`, which is retained as an empty directory. The captured plan is at `…/jobs/20261009T193340Z-51f42e/input/plan.md`, and no block names that path.

Expected: an affordance the agent is told about can be used through a clear pointer. Observed: the agent would have to guess `../../../input/plan.md` from the shape of the working directory. In this run no doubt arose: each NFR was one self-contained sentence, and the selector made zero tool calls. Impact: none observed. Confidence high that the pointer is missing, though not that the workspace was empty during the run (evidence gaps). Correction: name the captured documents' paths, the manifest `input/documents.json` and the documents themselves, in the selector's briefing. Otherwise, drop the sentence.

### S-2. The selector's reasons and conditions do not reach the architect (low, design observation)

Affected: inv-0005 → inv-0006.

Location: the selection record keeps work-specific conditions. For example, nfr-002 has "Applies to both explicit-tone and omitted-tone rendering, including badges with custom labels." The package appended to ses-0004 before inv-0006, request item 53 (`brief:support:work-item-package`, 2,988 bytes), renders nfr-002 with "Conditions: none recorded. / Uncertainty: none recorded." Those are the catalog's fields, not the selector's. `contextSelectorMessage` and the package builder take element IDs only.

Expected goal: the procedure asks for "your reason, the conditions under which it applies and your uncertainty", so either something downstream consumes them or they are only an audit record. Observed: the architect and, through `citedElements`, the engineer receive only the IDs and catalog text. In this run the omission had no effect, because all four NFRs were selected and their plan text is self-explanatory. In a larger catalog, a selector condition such as "only for the public props contract" could be the deciding information. Its absence would be silent, because the package's "Conditions: none recorded" reads as authoritative. Confidence high on delivery, low on future impact. Correction: either render the selector's reason and conditions beside each selected element in the package, labelled as the selector's judgment, or state in the procedure that they are recorded for audit only, so selectors keep them brief.

### S-3. Inherited orientation instructions remain current at the fork (low)

Affected: inv-0005.

Location: the inherited blocks `brief:support:# Orientation task:0` ("Submit your orientation using `submit_work_orientation`") and `procedure:local-architect:orientation` are not withdrawn. The native `tools` still list `submit_work_orientation`, and the system instructions still say "You are the local architect of one module". The appended blocks use different keys (`procedure:context-selector:main`), so both procedures are "Current value". The conflict is resolved only by the task header ("This selection supersedes every prior task selection. Active role: context-selector. Selected procedure: procedure:context-selector:main; SHA-256: 5bce0525…"), the developer role message, and "Inactive historical tools must not be called."

Expected: unambiguous current instructions. Observed: the role and procedure conflict exists in the text, but the disambiguation is explicit and the agent followed it. It called only `submit_context_selection` and was accepted first time. The later continuation (inv-0006) withdraws the orientation brief ("Withdrawn; this block no longer applies."). The fork does not, although the same withdrawal would cost about 80 bytes. Keeping the system prompt and tool list unchanged is what preserves the cache (S-5), so a withdrawal notice is the right correction, not a replacement. Impact: none observed. Confidence high.

### S-4. Minor extraneous material in the appended message (low)

The final paragraph of the brief, "Select, by ID, the elements … answer with IDs only." (about 370 bytes), restates the procedure that follows it. `environment:supportPaths` (240 bytes) names `subs/harness/src/context-selection/selector.system.md` and `…/selector.procedure.md`, harness-package paths that cannot be read from the agent's tools (see O-2 in `local-orientation.md`). Together this is about 0.6 KB of a 4.0 KB message. Relevance is low and cost negligible. There was no effect.

### S-5. Cache reuse on the first post-fork request (no issue)

The parent's last request (`da51c52d…`, 50 items, 17,386 total input tokens) is an exact prefix of the child's first request (`8a7a5cdc…`, 57 items). Instructions (4,045 bytes), provider tools and `prompt_cache_key` are equal (`summary.json` boundaries[inv-0005]). First and only call: 2,291 new and 17,280 cached input tokens (88.3% of 19,571), 310 output tokens, an estimated $0.0223 at recorded rates. The cached amount covers the whole parent prefix to within the provider's caching granularity. The new tokens are the parent's final submission turn plus the appended items. The fork's invocation started about 0.1 s after the parent ended (19:35:48.147 against 19:35:48.023), and its usage was recorded 6.4 s later. Good reuse.

### No issue found

The inherited history was relevant and was used. The selector's nfr-003 reason ("the optional prop and neutral default must allow current catalog and review UI call sites to remain unchanged") restates a conclusion from the parent's consumer grep, and its nfr-001 reason ties to the props-only design the parent observed. A fresh selector would have needed that exploration or a summary of it.

## Observed effects

One request, no tool calls, an accepted submission, and a selection that was used verbatim: inv-0006 cited all ten package elements in `citedElements`. The missing document pointer (S-1) and the uncarried reasons (S-2) had no observable effect, because nothing in this catalog needed either. The fork's cost, an estimated $0.022 and 6.3 s, is small, and its first-call cache share is high.

## Correction suggestions

1. Point the selector at the captured documents, or remove the read affordance (S-1).
2. Decide whether selector reasons and conditions are delivered or are audit-only, and say which in the procedure (S-2). Validate on a plan with several NFRs that apply only conditionally.
3. Append a withdrawal for the orientation brief and procedure at the fork, as the continuation already does. Keep the system prompt and native tools unchanged for cache reuse (S-3).
4. Drop the restated selection paragraph and the provenance-only support paths from the message (S-4).

## Evidence gaps

The selector workspace is retained empty after the run. I assume it was empty during the run, because nothing records writes to it. Reasoning is encrypted. That the inherited history was used is inferred from submission wording, not from a citation mechanism.
