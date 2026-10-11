# Locate postmortem evidence

Paths below are relative to the selected ramify-agent checkout unless stated
otherwise. They are discovery pointers, not a claim that every run version
retains every field. Prefer the schema and implementation used for the run.

## Run and prompt artifacts

The target project's run normally lives under
`plans/<plan>/.harness/jobs/<run>/`. Start with:

- `job.json`, `input/plan.md`, captured document manifest/bytes, `events.jsonl`.
- `invocations/<id>/invocation.json`, `submission.json`, `outcome.json`,
  `observations.jsonl`, and the work/iteration/review/gate records they name.
- `prompts/manifest.json`, `transcripts/<session>.jsonl` and `blobs/<sha256>`
  for prompt provenance and transcript bodies.

For supported versions, a retained task packet is found using
`invocation.json.sessionOperation.runId` and `.operationId`. Its correlation
file is in the target project's
`plans/.harness/session-operations/correlations/operations/<hash>.json`.
The hash is SHA-256 of the UTF-8 bytes of JavaScript
`JSON.stringify([runId, operationId])`. Read `packet.message` and
`packet.additions`. Task kinds can appear as `# Current task: <kind>` and
`procedure:<kind>`. Legacy records may lack this correlation.

Follow recorded operation/session links for inherited points and retained pi
history or request evidence. Do not assume a provider session file proves the
exact request prefix, tools or first-call usage were retained. Consult the
recorded version's layout instead of guessing private filenames.

The current harness layout and schemas can be located in:

- `subs/harness/src/run/records.ts`: `runLayout`, invocations, outcomes,
  usage and session relations.
- `subs/harness/src/run/observations.ts`: per-call observations and coverage.
- `subs/harness/src/interfaces/protocol/transcripts.ts` and
  `subs/harness/src/transcripts/recorder.ts`: transcript bodies/start entries.
- `subs/harness/subs/agent/subs/pi/`: pi adapter and provider-facing behavior.

When finding existing capabilities or their owners, search the generated
`.ramify-architect/` as required by project instructions before inspecting
implementation details. Do not edit generated views. For historical evidence,
use the run's recorded revision without replacing a dirty checkout.

## Materialized views and their use

Locate the views in the target execution project, relative to its root:

- `.ramify-architect/`: project map and per-module behavior, supporting symbols,
  test records and observed use. Inspect `_meta.json` and module revision facts.
- `<consumer-module>/src/.ramify/{external,children}`: foreign application APIs
  available to ordinary source. Its `_meta.json` describes revision and limits.
- `<consumer-module>/src/tests/.ramify/{external,children}`: the independent
  complete API view for that consumer's testing source area.

These directories are generated and gitignored. Prefer retained view snapshots,
delivered excerpts, tool results and materialization records from the run. Record
what cannot be recovered. If reconstruction is necessary, use an isolated copy
of the recorded inputs and label the reconstructed evidence; rematerializing
today's checkout cannot verify historical availability or use.

Correlate observation `tool-start`/exploration records with transcript tool
arguments/results, shell commands, cwd, requested/resolved paths and prompt
packets to classify discovery targets. Coarse exploration totals alone cannot
distinguish views from source or prove that returned information was applied.
Retain unknown classifications when arguments, paths or results are missing.

The toolkit's `docs/architecture/architect-view.spec.md` and
`docs/architecture/materialized-api-view.spec.md` define these views when the
toolkit checkout is available. Otherwise consult the installed version's
documentation and generated metadata. In particular, the API view excludes
packages/built-ins outside the Ramify application source set: `external/` is
not a catalog of all third-party dependencies. Generated views are documentation,
never import targets or a replacement for the project's importability rules.

## Metrics definitions and access

Read the applicable parts of `docs/metrics/README.md`, especially
`session-observations.md` for artifact/API correlation and usage semantics,
`lineage.md` for session counts, and the glossary/measurement policy for ratios
or scope/change measures under discussion. Verify historical definitions against
the selected run's policy version when today's documents differ.

An already available server may expose:

- `GET /api/v1/plans/<plan>/runs/<run>/metrics`, including
  `evaluation.invocations[]` and run-level lineage.
- `GET /api/v1/plans/<plan>/runs/<run>/sessions/<session>`, including
  `session.invocations[]` with per-invocation evaluation.

Join by invocation and recorded work/iteration/request identities. A projection
is useful for exploration; cite and inspect raw observations for disputed counts
or boundary-level claims. Read records directly if no server is available.

`docs/analysis/2026-10-08-session-reuse-and-system-prompts.md` explains the
project's distinction between preserved forks and history reuse with replacement.
Use it when interpreting historical labels or assessing prefix changes; it is
design context, not proof of behavior in the selected run. Later plan documents
also cannot establish what an earlier implementation did.
