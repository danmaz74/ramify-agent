# Catalog extractor: intake

The intake prompt was adequate for this run. It supplied the authoritative
captured plan, exact document identity, permitted element kinds, incorporation
decisions, read-only authority and a usable submission contract. The extractor
read the capture once and submitted all three plan constraints plus the test
constraint, with no rejection. Its prompt also included avoidable duplicate
plan text and implementation-oriented environment metadata.

## Coverage and evidence

- Kind/variant: `catalog-extractor / intake`, package `catalog-extractor/1`.
- Covered invocation/operation: `inv-0001`; display transcript `ses-0001`;
  provider session `ae4354ce-dda9-424b-862d-cd52e10b84fc`, turn 1.
- Requested and actual start: fresh; no inherited context.
- Run: `20261009T132856Z-07ccc4`, plan `status-badge-tone`.
- Historical harness provenance: source checkout
  `/home/app/ramify-status-badge-trial-20261009`, source commit
  `390eef60abbfb9772969b1fd466204588adef138`.
- Evidence root R:
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4`.
- Delivered packet P:
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/86a0967d12009d9996cf2c34a52d34460b58198551d1f3cb43d61cdbd936abea.json`.
- Inspected P's actual role instructions, message, declaration and manifest;
  `R/transcripts/ses-0001.jsonl` records 1–9, role blob
  `R/blobs/d1d4861e7d1803af94a26c135e473e6996fd2936ef05eebf0a67354b02d65690`,
  `R/input/{plan.md,documents.json}`, and
  `R/invocations/inv-0001/{invocation.json,submission.json,outcome.json,observations.jsonl}`.
  The resolved role blob exactly matches P's role instructions; the embedded
  plan exactly matches the captured plan. Current templates were not used to
  establish delivery.
- Native requests under
  `/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/`:
  `90fe68ae96e6923e6faea52ffa8c6b978798a3e21dbb87e52c39085c99027684`
  and `83550dc57003c8105f283d7010c430ebf7a15b89f7d2f8d8a5e008899b4a2ea4`.
  Both are `ramify.pi-native-request/1`, pi-ai 0.87.1, SSE. Their request
  instructions exactly match P; input starts with the exact P user message;
  tools are `read`, `grep`, `ls`, `submit_intake`. Second request appends the
  reasoning/call/read output, confirming source duplication at the provider
  request level. Captured request instructions/input/tools match their native
  projections.

## Required information

| Need at delivery | Assessment |
| --- | --- |
| Objective | Goal and intake procedure directly specify goal extraction, non-functional/recommendation elements and incorporation judgments. |
| Authoritative plan and constraints | `doc-001` and its absolute captured file path are directly supplied; `read` returns all 1,544 UTF-8 bytes. All requests, constraints and acceptance scenarios are available. |
| Relevant principles/dependencies | Manifest has no principles and no missing references; prompt says “Missing references to judge: none.” No unstated dependency is required for intake. |
| Authority and write scope | “You change nothing” and read-only tool set fit the task; submission is the designated handback. |
| Execution location/current state | Project root and cwd are explicit, capture path resolves; actual mode fresh matches request. |
| Verification and completion | Tool description supplies complete JSON schema; procedure names required incorporation entries. Accepted submission is the completion condition. No test or architecture discovery is needed for this role. |
| Uncertainty handling | Agent must decide rather than ask unattended questions and retain uncertainty in the submission. |

The role describes all catalog kinds, while this turn's procedure explicitly
restricts extraction to non-functional and recommendation elements. This is a
clear specialization, not an instruction conflict. No missing, stale,
inaccessible or contradictory requirement was found.

## Findings

### Low: duplicate full plan alongside a mandatory read

- Affected role/IDs: intake, `inv-0001`.
- Location/excerpt: P `packet.additions[key=brief:requirements]` contains
  `# Requirements\n- # A tone for the status badge` and the entire 1,544-byte
  plan. P `procedure:intake` then requires “Read every captured plan document
  in the message in full.” Transcript record 4 supplies the same full plan.
- Expected goal: establish requirements from the captured authoritative
  document, preserving its context and force.
- Observed mismatch: the complete plan is supplied twice in the first two
  requests' conversation history. The copy in the briefing is removable while
  retaining the capture pointer and required read.
- Size/method: the `brief:requirements` block is 1,561 UTF-8 bytes, measured
  from P and corroborated by its manifest; 1,544 bytes are identical plan
  content. This is 25.0% of the 6,234-byte current user message. These are byte
  measurements, not token estimates or claimed charge savings.
- Observed effect/impact: one successful file read and one accepted submission;
  no confusion, extra search, retry or omission attributable to duplication.
  The evidence supports a context-reduction opportunity, not a demonstrated
  quality or latency defect.
- Confidence: high in redundancy; unmeasured benefit of removal.
- Correction: omit the pasted full plan for intake when a captured-file read
  remains mandatory. Retain document ID, absolute path, scenario locations,
  missing-reference list, goal, procedure and schema. Compare accepted
  extraction and first/second request usage after this change.

### Low: environment exposes architecture and workflow state unrelated to intake

- Affected role/IDs: intake, `inv-0001`.
- Location/excerpt: P `environment` contains all workflow `limits` (including
  `maxIterationsPerCapabilityTask`, `nonfunctionalRoundsPerPlan`) and an
  architect `views` entry listing 15 modules with `cut: 11` and
  `detailsUnavailable: 4`.
- Expected goal: read captured plan prose and submit intake judgments; no
  project architecture, capability discovery, implementation or gate execution.
- Observed mismatch: detailed architecture inventory and most limits cannot
  inform any action available through `read`, `grep`, `ls`, `submit_intake`.
- Size/method: UTF-8 substring measurements on the actual pretty-printed
  environment yield 988 bytes for its `limits` block and 1,061 for its `views`
  block (including indentation/separators). Together 2,049 bytes, 32.9% of the
  6,234-byte user message, are candidates for narrowing. Some rejection and
  invocation limits can remain; this is not a claim that every limit is useless.
- Observed effect/impact: extractor reads only the captured plan and makes no
  architecture/source search; no misdirection is observed. This is prompt excess
  with prospective efficiency benefit.
- Confidence: high in task irrelevance of the view/module list; medium in
  the precise minimal limits subset.
- Correction: give intake cwd, captured documents, tools and applicable
  submission/rejection constraints; omit unrelated phase limits and architect
  view metadata. Preserve run enforcement in the harness.

### Informational: empty task payload adds no usable objective

- Location/excerpt: P `task`: “Perform intake for {}; use the current evidence
  and designated submission.”
- Expected goal: a task caption should name the plan/document set or delegate
  clearly to the already supplied procedure.
- Observed mismatch: `{}` conveys no task-specific state. Complete objective
  and procedure elsewhere compensate, so this did not make the prompt
  inadequate.
- Impact/confidence/correction: no observed error; high confidence in redundant
  wording. Replace with “Perform intake for plan status-badge-tone (doc-001)”
  or a concise procedure reference. The entire task block is 184 bytes; no
  savings are attributed to removing its necessary submission instruction.

## Explicit no-issue findings and observed result

The captured plan is available through an actionable pointer and actual tool;
its wording is intact. All three constraints are faithfully retained as
separate non-functional elements; the acceptance clause about existing and
new tests is also retained. No recommendations are invented. Goal includes
the four tone values, `data-tone`, neutral default and preserved label.
`incorporation.documents` correctly identifies the two Gherkin scenarios as
binding; the empty missing-reference list agrees with the capture manifest.
No unavailable tool, wrong cwd/path, write-scope violation or submission-schema
error occurred. Harness acceptance establishes shape/citation acceptance; the
faithfulness assessment here comes from comparing submission with source.

Transcript: read request record 3, successful full response record 4,
`submit_intake` record 5, accepted verdict record 6, completion record 8.
Outcome is submitted/applied, zero rejected submissions, 14,537 ms elapsed.
Two model calls are recorded; totals are new input 3,858, cache read 3,072,
output 561. This role has no continuation or fork boundary, and its aggregate
cache use does not establish anything about later roles' first post-fork calls.

## Evidence limits

The packet, transcript and native provider request establish role/user text,
ordered tool declarations and actual request input. Server-side transformations
and cache treatment remain unknown. No token savings,
counterfactual performance improvement or provider cache-prefix explanation is
inferred from byte counts. No trial, test or runtime/evidence mutation was
performed. Architecture/API effectiveness is not applicable to intake's task;
irrelevant view metadata should not be counted as architect use.
