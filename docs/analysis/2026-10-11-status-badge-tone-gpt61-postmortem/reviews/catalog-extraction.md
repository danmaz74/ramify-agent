# Prompt review: catalog-extractor intake and check (inv-0001, inv-0003)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent `5169117`
(clean main). Evidence root:
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`.
Run-record paths below are relative to
`collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`.

## Summary

Both prompts were adequate for their tasks. Each agent identified its task,
read the captured plan once, and submitted on the first attempt with no
rejection, clarification or repeated discovery. Intake recorded four
non-functional elements and judged the plan's Gherkin binding. Check
returned an empty correction list, which I judge correct for this plan.

There are no blocking or high-severity issues. The findings are about
redundancy and latent clarity:

- The whole plan is delivered inline and the procedure also tells the agent
  to read the captured file. Each instance spent one model round trip
  (about 4 s) and 1,544 returned bytes on this.
- About 2.8 KB of each task message is environment material this read-only,
  view-free role does not use.
- The submission tool declares `{"type":"object","properties":{}}` and keeps
  its schema in the description. In inv-0001 the model's reasoning remarked
  on this, but it still submitted correctly.
- The objective line reads `Perform intake for {}` and `Perform check for {}`.
- The intake procedure leaves out a downstream use of `goal`, and the
  role/procedure framing of what intake omits is in tension.

Neither instance is long enough for size to matter much: the first-call
input was 3,715 and 5,244 tokens.

## Coverage

| ID | Variant | Session | Start | Native requests | Usage (input / cacheRead / output) | Elapsed | Result |
|---|---|---|---|---|---|---|---|
| inv-0001 | `catalog-extractor:intake` | ses-0001 (`41876703-…`) | fresh, actual fresh | 2 | 4,311 / 3,584 / 471 | 14.5 s | `submit_intake` accepted, 0 rejections |
| inv-0003 | `catalog-extractor:check` | ses-0003 (`5f736663-…`) | fresh, actual fresh | 2 | 5,833 / 5,120 / 222 | 10.6 s | `submit_catalog_check` accepted, 0 rejections |

Both start fresh, so there is no inherited history. The manifests record
`inheritedPoint: null`.

Artifacts read for each instance:

- The derived extracts in `../invocations/<inv>/`: `packet.json`
  (`packet.message`, `packet.additions`, `packet.manifest`, `declaration`),
  `task.md` and `native-first.json`.
- The inventory and tool entries in `../inventory.json` and `../tools.json`.
- `invocations/<inv>/{invocation,submission,outcome}.json` and
  `observations.jsonl`.
- `transcripts/ses-0001.jsonl` and `ses-0003.jsonl`.
- `events.jsonl` sequences 3–18.
- `input/plan.md`, `analysis/catalog/8b8dc5c5….json` and
  `analysis/incorporation/9498c2fc….json`.

For inv-0003, inv-0002's `submission.json` was read only as the input check
received. I also read the harness source at the run revision to explain two
observations (cited below).

Captured delivered bytes:

- I confirmed that the native first request's `instructions` equal
  `packet.roleInstructions` (3,748 bytes), and that its single `input_text`
  equals `packet.message` (7,804 and 12,787 bytes).
- Tool declarations are taken from `native-first.json`.

Reconstruction: I tied the `{}` objective and the inline plan copy to the
source at `5169117`. The run's harness is that commit, so this is a
reconstruction of the cause, not of the bytes; the bytes are captured.

One clarification of the assignment: check does not compare the architect's
analysis with intake's catalog. It receives the merged catalog (intake's
nfr-001…004 plus the architect's ctx-001 and fr-001…005), the entry and its
scenario citations. It then checks that reading against the plan document
itself.

## Required information

**inv-0001, intake.** It needed:

- the captured plan and its path
- which element kinds to submit
- the goal to write
- the incorporation judgments, including the scenario blocks and missing
  references
- the submission tool and its schema
- that it is read-only and that no questions will be answered

Everything was delivered directly:

- The plan was delivered inline in `brief:requirements` and as an absolute
  captured path in `brief:support:# Intake…`.
- Scenario line ranges were given (34–38 and 40–43, which match
  `input/plan.md`), along with "Missing references to judge: none".
- The procedure `procedure:catalog-extractor:intake` restricts submission to
  `non-functional` and `recommendation` elements.
- Read-only status and the no-questions rule come from the role instructions.
- The schema is in the tool description.

Nothing needed was missing or inaccessible. The cwd and project root were
correct for the run's execution checkout (`/tmp/claude-1000/…/badge-run-61/collection-review`),
and the read of the captured absolute path succeeded.

**inv-0003, check.** It needed:

- the document
- every element read from it, in the form downstream readers get
- the entries and scenarios that cite those elements
- the correction actions and their kind and document rules
- the re-citation rules
- the "faithful" signal: empty `corrections`, `entries` and `scenarios`

All were delivered directly:

- The plan, inline and as the captured path.
- Ten elements, with their conditions and uncertainty, rendered as the
  "Plan context package".
- Entry `render-status-badge-with-tone` with its refs, and three scenario
  keys with their refs.
- The procedure, plus a tool schema that includes the `oneOf`
  add/rewrite/replace shapes.

Scenario Gherkin bodies were not delivered. That is consistent with the
procedure ("Never copy Gherkin into an element; cite registered scenario
identities"). Element faithfulness can be judged against the plan, and the
refs are enough for the "every acceptance element stays cited" rule. I found
nothing missing, contradictory or stale.

## Findings

### F1. The plan is delivered inline and also required as a file read (Low, inv-0001 and inv-0003)

- **Location:** `packet.additions[brief:requirements]` (1,644 bytes) contains
  `# Requirements\n- ` followed by the full plan. I verified that the 1,544
  bytes after that prefix are byte-identical to `input/plan.md`.
- **Procedure step:** intake step 1 says "Read every captured plan document
  in the message in full". Check step 1 says "Read the document in full".
  The role says "Read the captured files named in the message, at their
  absolute paths: they are the bytes this run captured."
- **Cause (reconstruction):** in
  [service.ts](../../../../subs/harness/src/run/service.ts), line 4293
  defaults a task's `requirements` to the captured plan text, and
  `prompts/tasks.ts:146` rejects a task with empty requirements.
- **Expected:** one authoritative copy.
- **Observed:** both agents spent their first model call (inv-0001: 4,283 ms,
  92 output tokens; inv-0003: 4,004 ms, 92 output tokens) on a single `read`
  of that file (1,544 returned bytes). Transcript entries n=3–4 in ses-0001
  and ses-0003 show this.
- **Impact:** small. The cost is one round trip and about 1.5 KB of
  duplicated content per instance; the second call's 596/589 new input
  tokens include the tool result. The inline copy is also shaped oddly: the
  whole document, including its `#` heading, sits under a single list bullet.
- **Confidence:** high.
- **Correction direction:** for catalog-extractor tasks, keep one copy:
  - Option A: drop the inline plan and keep the pointer plus the read. This
    keeps "captured bytes" authority and loses nothing.
  - Option B: keep the inline copy, state that it is the captured bytes, and
    drop the read step.

  Either way, give `requirements` a short statement for this role rather
  than the document.

### F2. Environment blocks this role does not use (Low, inv-0001 and inv-0003)

- **Location:** `environment:limits` (1,074 bytes), `environment:views`
  (1,190 bytes, the architect view path and 15 modules),
  `environment:supportPaths` (229/228 bytes),
  `environment:cucumberConfiguration` (133), `environment:candidate` (109)
  and `environment:snapshot` (107). That totals 2,842 bytes (inv-0001) and 2,841 bytes (inv-0003),
  using UTF-8 byte counts from `packet.manifest.entries`.
- **Smaller items:** `projectRoot` and `workingDirectory` carry the same path
  (231 + 241 bytes). The per-block line "Current value; replaces any earlier
  value for this key." appears 13 times (728 bytes) in inv-0001 and 18 times
  (1,008 bytes) in inv-0003, although both are fresh `based on: none (full)`
  briefings.
- **Expected:** a read-only extractor that works only from captured plan
  bytes needs the captured path, its tools and the submission tool.
- **Observed:** the agent never consulted the views or the limits. Its only
  tool calls were the plan read and the submission (`tools.json`).
- **supportPaths:** the entries
  (`subs/harness/src/analysis/catalog-extractor.system.md`,
  `…/intake.procedure.md` and `…/check.procedure.md`) are harness-repository
  provenance paths. They do not exist under the project root (the evidence
  copy has no `collection-review/subs/harness`), so the pointer could not be
  resolved if it were followed.
- **Size and cost:** about 2.8 KB of irrelevant material out of 7.8 KB
  (inv-0001) and 12.8 KB (inv-0003) of task message. Relevance and cache
  cost are separate questions: these blocks come after the cacheable system
  and tool prefix, and in fresh sessions with per-session `prompt_cache_key`
  they were uncached on the first call anyway (cacheRead 0). The cost is
  small in absolute terms.
- **Impact:** no observed effect. Confidence: high that the material is
  irrelevant here.
- **Correction direction:** per-role environment selection. For
  catalog-extractor, omit views, limits, candidate, snapshot, cucumber
  configuration and supportPaths. Alternatively, label supportPaths as
  provenance that is not readable from the project root.

### F3. Submission tool parameters are empty and the schema is only in prose (Low, latent; inv-0001 and inv-0003)

- **Location:** `native-first.json`
  `.request.tools[3].parameters = {"type":"object","properties":{}}`,
  `strict: null`. The description begins "Submit this task using exactly
  this JSON schema: {…}" (1,926 bytes for intake, 3,520 bytes for check).
- **Observed:** the inv-0001 reasoning summary (ses-0001 n=5) says "I need
  to submit a tool schema that isn't defined yet, but the description says
  it requires JSON. It seems I can pass arguments as usual." The submission
  conformed on the first attempt, and inv-0003 also submitted cleanly.
- **Expected:** the declared parameters carry the schema, so the provider
  can constrain or validate arguments.
- **Impact:** none in this run. The mismatch was noticed, which suggests
  some risk for less capable models or larger schemas.
- **Confidence:** high for the mismatch, low for the risk.
- **Correction direction:** put the JSON Schema in `parameters`, with
  `oneOf` flattened where the provider requires that, and keep the
  description short. If the provider cannot accept the schema, say so in
  the description.

### F4. Objective line shows an empty work object (Low, inv-0001 and inv-0003)

- **Location:** the `task` block: "Perform intake for {}; use the current
  evidence and designated submission." and "Perform check for {}; …".
- **Cause (reconstruction):** in
  [task-brief.ts](../../../../subs/harness/src/run/task-brief.ts), line 72
  renders `JSON.stringify(facts.work)`, and run-scope tasks have `work: {}`.
- **Expected:** a named subject, such as `plan status-badge-tone` or
  `doc-001`.
- **Observed:** no confusion. The goal and support blocks name the plan and
  document.
- **Impact:** cosmetic. It reads like an unresolved placeholder.
- **Confidence:** high.
- **Correction direction:** render a run-scope subject, or drop the `for …`
  clause when the work is empty.

### F5. Intake framing understates who uses `goal` and conflicts on what is omitted (Low, inv-0001)

- **Location, part 1:** intake procedure step 2 says "The readers of the
  principles documents use it to judge which of their rules bear on this
  plan."
- **What happened:** this run had no principles documents. Intake's `goal`
  became inv-0002's `brief:goal` verbatim: compare `../invocations/inv-0002/task.md`
  lines 3–6, and service.ts line 4406 (`goal: intake.value.goal`). So the
  stated audience leaves out the use that actually happened.
- **Location, part 2:** the role instructions say "Every later agent works
  from the catalog instead of the documents … What you leave out, nobody
  downstream sees". The intake procedure says "Do not submit functional or
  context elements: the architect reads those."
- **How it played out:** the procedure takes precedence, and the agent
  followed it correctly. It submitted only nfr elements and filed the third
  Acceptance bullet as nfr-004, a reasonable kind that the role's
  "tests kept in step" example supports. The resulting catalog was complete:
  the architect supplied ctx-001 and fr-001…005, and the analysis-accepted
  event (sequence 18) reports catalog `{context:1, functional:5,
  nonFunctional:4}` with no warnings.
- **Impact:** none observed. The risk is that a model weighs the role text
  over the procedure and either duplicates functional elements or fears
  omission.
- **Confidence:** medium.
- **Correction direction:**
  - In the intake procedure, say that `goal` also becomes the initial
    architect's goal.
  - Qualify the role's "What you leave out" sentence for split extraction:
    the catalog as a whole is what downstream sees.

### No issue found

- Task identification and the submission contract were clear in both
  instances.
- The paths and cwd were correct.
- The tools listed in `environment:availableTools` match the native tool
  declarations (read, grep, ls and the submission tool).
- Inline and file plan bytes were consistent.
- The check correction schema matched the procedure's three actions.
- No obsolete or contradictory current-task guidance was found.

I also reviewed the check's judgment on its merits:

- fr-004 and fr-005 restate fr-002 and fr-003, but the source states both,
  and the role includes acceptance statements as functional elements.
- Conditions and text track the source.
- No constraint lacks an element.

So the empty `corrections` was faithful, and success here does not hide a
missed correction.

## Observed effects

- **No adverse events.** Neither instance had a clarification, tool error,
  rejected submission, repair or retry (`rejectedSubmissions: 0`, verdict
  `accepted` at ses-0001 n=6 and ses-0003 n=6).
- **One effect tied to the prompt.** The extra `read` round trip in each
  instance follows directly from F1's procedure step. This is causal: it is
  the procedure's first step, and the read is the only non-submission call.
- **One correlated observation.** The tool-schema remark in inv-0001's
  reasoning (F3) had no behavioral consequence.
- **Downstream.** The merged catalog was accepted with no findings, and the
  run's four gates passed. Neither result isolates prompt quality, but
  nothing downstream points back at these two prompts.
- **Cost.** Recorded estimates are inv-0001 USD 0.0137 and inv-0003
  USD 0.0144. In both, the second call read 3,584 and 5,120 cached tokens,
  so the role, tool and message prefix was reused within the session.
- **Cache across instances.** The two instances share an identical 3,748-byte
  system prompt and their first three tool declarations. Their first calls
  still had cacheRead 0, which is consistent with distinct per-session
  `prompt_cache_key`s and the different fourth tool. I did not test whether
  any cross-session reuse was possible.

## Suggested corrections

1. **Single plan copy for catalog-extractor tasks (F1).** Either drop the
   inline `brief:requirements` copy and keep the captured-path read, or keep
   the inline copy as the declared captured bytes and drop the read step.
   To validate, compare first-call latency and total input on a fixture
   rerun; expect one fewer model call per instance.
2. **Role-scoped environment (F2).** Omit views, limits, candidate,
   snapshot, cucumber configuration and supportPaths for this role. Collapse
   duplicate root and cwd. Consider dropping the per-block "Current value"
   preamble on full (`based on: none`) briefings.
3. **Declare the submission schema in `parameters` (F3).** Then verify on
   the next run that arguments still validate, and that there are no
   provider schema errors for check's `oneOf`.
4. **Give run-scope tasks a subject in the objective line (F4).**
5. **Align intake's goal audience and the role's omission statement with the
   split-extraction design (F5).**

## Evidence gaps

- **Reasoning text.** inv-0003's thinking body is empty (0 bytes; 101
  reasoning tokens recorded), and inv-0001 has only a short summary. Neither
  model's actual deliberation is available, so claims about confusion rest
  on the inv-0001 summary alone.
- **Native requests.** I inspected only the first native request of each
  instance. The second request's prefix equality is inferred from cacheRead
  values, not compared byte for byte (`nativeLast` paths are recorded in
  `inventory.json`).
- **Token attribution.** Provider tokenization is not recorded per block.
  Sizes above are UTF-8 bytes from the packet manifest, not tokens.
- **Revision assumption.** The cause attributions for F1 and F4 rely on
  source at `5169117`, which is assumed to be the run's harness revision
  (the job is recorded on clean main at that commit). The delivered bytes
  themselves are captured.
- **Generated views.** Not relied on. Neither agent used them, and this
  review does not reconstruct their state.
