# Catalog extractor: check

The check prompt supplied the information needed to assess the catalog's
faithfulness and maintain entry/scenario references after a correction. The
extractor read the captured plan, declared the reading faithful and completed
without rejection. Comparing the supplied catalog against that capture supports
the no-correction result. The complete source copy and unrelated environment
inventory are low-severity prompt excess; neither caused an observed error.

## Coverage and evidence

- Kind/variant: `catalog-extractor / check`, package `catalog-extractor/1`.
- Invocation/operation `inv-0003`, transcript `ses-0003`, provider session
  `59c85ecf-47a3-4c94-8d27-e65ff6105b27`, turn 1.
- Requested and actual start: fresh; no inherited intake or architect history.
- Run `20261009T132856Z-07ccc4`, plan `status-badge-tone`.
- Historical source commit `390eef60abbfb9772969b1fd466204588adef138` in
  `/home/app/ramify-status-badge-trial-20261009` (result provenance).
- R =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4`.
- P =
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/1e7ca486ae381e18c8dbb15ed953f8e99a67bdd2539f514550102b1ea06edd12.json`.
- Read P's actual packet, declaration and additions; invocation/submission/
  outcome records under `R/invocations/inv-0003/`; all transcript records;
  `R/input/{plan.md,documents.json}`;
  `R/analysis/catalog/0a993ffc4dd5fbfea041e03156c91b60207e7c454d87a9082da623d23a86b21a.json`;
  `R/analysis/incorporation/9498c2fc5d569b3d694cd32f564b4f0695bfb7ddb34dd40445da08090e8b8137.json`;
  `R/analysis/entries.json` and scenario records `sc-001`, `sc-002`.
- Resolved transcript role blob
  `d1d4861e7d1803af94a26c135e473e6996fd2936ef05eebf0a67354b02d65690`
  and user-message blob
  `a03cba40d703269f633e85bc963c4d3413fd470873c1869b5d89f32b4176c1dd`;
  both exactly match P. Current template source was not used as delivery proof.
- Native requests under
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/`:
  `4664ebdac37e3bb9a7ef3ad2a7ffbd9f00546b76253070e61f2209dc3b77ebd3`
  and `f8a60f8fef235f205a22bb7bf565e4abe121e14ac86335665a30c46e7b6e5422`.
  Both have schema `ramify.pi-native-request/1`, pi-ai 0.87.1, SSE; captured
  request instructions/input/tools match their native projections. Instructions
  and initial user input exactly match P; tools are `read`, `grep`, `ls`,
  `submit_catalog_check`. Request two retains source in the user message and
  appends reasoning/call/read output, confirming duplication in actual provider
  input as well as the display transcript.

## Required information and authority

| Need | Delivery-time assessment |
| --- | --- |
| Objective and comparison target | Goal names the plan; check procedure requires a faithful reading of the one captured document. Catalog hash and all ten element identities, kinds, source paths, complete text, conditions and uncertainty are supplied. |
| Authoritative source | `doc-001`, original path and absolute captured path are explicit; the available `read` tool returns the complete 1,544-byte capture. |
| Constraints | All plan constraints and acceptance text are available both in source and element package. Kind rules and the rule against strengthening/weakening source are explicit. |
| Correction mechanics | `add`, `rewrite`, `replace`, retire IDs, local keys and required reasons are explained in procedure and schema. Entry references and scenario keys/references are supplied for re-citation. |
| Scope and current state | Read-only role, no candidate, fresh session, no deviations. No implementation or source-code investigation is needed. |
| Completion | `submit_catalog_check` is available; tool description contains complete schema and procedure specifies empty corrections/entries/scenarios for faithful reading. |
| Missing references/incorporation | Capture manifest has no missing references and incorporates `doc-001` scenarios. This check's supplied goal is element faithfulness and reference maintenance; it does not authorize changing incorporation judgments. No incorporation repair is required in this run. |

The check task does not receive an independent incorporation-edit tool or the
incorporation manifest in its prompt. That is a limit of this task's declared
scope, not missing information required for its actual assignment. The two
registered scenario keys and their acceptance references are supplied; source
scenario content remains available in the mandatory capture read. There is no
need to infer provider/source APIs or ask for clarification.

## Findings

### Low: source duplicated before the required source read

- IDs: `inv-0003`, `ses-0003`.
- Location/excerpt: P `brief:requirements` includes the complete plan beginning
  `# Requirements\n- # A tone for the status badge`; P `procedure:check` says
  “Read the document in full, then each element.” Transcript record 4 returns
  the same source again.
- Expected goal: compare authoritative captured document to supplied catalog,
  not rely only on a briefing copy.
- Mismatch: source text is duplicated in prompt and required read result.
  Supplied catalog text is independently necessary as the comparison target;
  it should not be removed as duplication.
- Size: `brief:requirements` measures 1,561 UTF-8 bytes (14.8% of the
  10,538-byte current user message); 1,544 bytes are identical source. Method:
  UTF-8 byte measurement of actual packet additions, confirmed by manifest.
- Impact/confidence: no observed error or additional search. High confidence
  in redundancy; savings and quality effect unmeasured.
- Correction: preserve the absolute capture pointer, document identity, full
  comparison catalog and references; omit the full source pasted in the
  briefing when the capture read remains mandatory. Validate faithfulness
  judgments and first/second call usage in a focused comparison.

### Low: architectural inventory and unrelated phase limits do not help check

- IDs/location: `inv-0003`; P `environment`.
- Excerpt: `views` lists 15 project modules, revision and coverage, while
  `limits` includes `maxIterationsPerCapabilityTask`, `maxPlacementRequests`
  and non-functional rounds.
- Expected goal: assess element cuts, wording, kinds and references using the
  supplied catalog/source pair, with no ownership or capability-placement task.
- Mismatch: architecture listing and most lifecycle limits cannot inform this
  check's permitted decisions. No architect view is read.
- Size: 988 bytes for pretty-printed `limits`, 1,061 for `views`; 2,049 total
  (19.4% of the user message). These measurements include indentation and
  separators and identify blocks for narrowing, not all-or-nothing removals.
- Impact/confidence: no observed misdirection; high confidence in irrelevant
  architectural listing, medium in minimal useful limits selection. Token/cost
  reductions cannot be calculated from these bytes.
- Correction: retain cwd, tools and applicable submission/invocation limits;
  omit unrelated implementation phases and view inventory from this check.

### Informational: empty task payload is compensated by the procedure

- Location/excerpt: P `task`: “Perform check for {}; use the current evidence
  and designated submission.”
- Expected goal/mismatch: task-specific document/catalog identity would make
  this caption meaningful; `{}` supplies none. Earlier check heading and
  package provide those identities, so there is no required-information gap.
- Impact/confidence/correction: no observed error; high confidence. Name
  `doc-001` and the catalog or refer concisely to the current procedure. The
  complete 189-byte task block also contains necessary submission guidance;
  do not attribute its full size as removable excess.

## Explicit no-issue findings

All ten supplied elements match the retained catalog. The context preserves
the motivating situation. Functional elements preserve optional tone values,
`data-tone`, neutral default and both acceptance statements. Recorded
conditions restate the applicable source conditions without narrowing or
strengthening them. Three non-functional elements preserve presentation-only
ownership, status/label meaning and caller compatibility. The fourth preserves
the coherent testing obligation covering existing tests and tone-specific
tests. No omitted recommendation, unsupported requirement or incorrect kind
was found. Source wording is retained with harmless whitespace normalization.

Entry requirement/acceptance/context references correspond to these kinds;
each acceptance element is cited by its registered scenario. The capture's
two scenarios and incorporation record agree. No retired element exists, so
empty entry/scenario correction lists are appropriate. The short visible
thinking preview considers splitting/classification of the testing element;
it does not show a resulting defect or prove wasted reasoning.

Actual sequence: transcript record 3 requests capture read, record 4 returns
all source, record 5 submits `{"corrections":[],"entries":[],"scenarios":[]}`,
record 6 accepts, record 8 completes. Outcome submitted/applied, zero rejected
submissions, 15,742 ms. New input 5,202, cache read 4,480, output 620 across two
model calls. No continuation or fork boundary occurs within this invocation.
Harness shape acceptance and this source-comparison judgment remain distinct.

## Evidence limits

The retained packet, resolved transcript and native provider request establish
role/user content, ordered tool definitions and actual request input.
Server-side transformations remain unknown. Exact provider tokens for removable
sections, cache-prefix effects and counterfactual cost/latency are unknown.
Architecture/API view effectiveness is not applicable to this read-only
catalog task, and metadata delivery is not evidence of consulting a view.
No provider calls, tests or runtime/evidence writes were performed.
