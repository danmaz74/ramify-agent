# Execution evaluation evidence

The [execution baseline](execution-baseline.json) measures actual ownership at
`85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`, using Ramify 0.5.2 and the
committed ramify-audit 0.9.3 pin. Its production source is identical to proposal
baseline `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`; `git diff 85ed836c
3cf06e52 -- src subs` produced no output. The immutable original
[proposal baseline](../../../docs/analysis/2026-10-19-harness-decomposition/baseline.json)
and [collector](../../../docs/analysis/2026-10-19-harness-decomposition/collect.py)
remain unchanged. Their hypothetical whole-file allocation is separate from the
actual-owner inventory here.

Independent collection began after the implementation worker was assigned
iteration 1. No claim is made that operational observations were captured before
that assignment. Structural acquisition used a separate detached worktree at the
execution baseline, with its own `npm ci --ignore-scripts`; its tracked source was
clean. No after-change facts are substituted for before-change facts.

## Collection and reuse

Run from a stable checkout root. Commands used for the baseline were:

```sh
node_modules/.bin/ramify --version
node_modules/.bin/ramify check --batch --format json > check.json
node_modules/.bin/ramify materialize --view api --view architect --all
node_modules/.bin/ramify measure --format json > measure.json
node_modules/.bin/ramify affected --path subs/harness/src/run/session-store.ts --format json > affected-session-store.json
node_modules/.bin/ramify affected --path subs/harness/src/assistance/service.ts --format json > affected-assistance.json
python3 plans/harness-decomposition/evaluation/collect.py \
  --root /workspaces/worktrees/harness-decomposition-evaluation-baseline \
  --check plans/harness-decomposition/evaluation/baseline-inputs/check.json.gz \
  --measure plans/harness-decomposition/evaluation/baseline-inputs/measure.json \
  --affected plans/harness-decomposition/evaluation/baseline-inputs/affected-session-store.json \
  > plans/harness-decomposition/evaluation/execution-baseline.json
```

The collector command runs from the implementation checkout; provider inputs and
generated catalogs originate in the detached baseline checkout. The original check
JSON was then compressed with Python `gzip.compress(data, mtime=0)`; collection
accepts either format. [Input manifest](baseline-inputs/manifest.json) hashes stored
bytes; the summary hashes decompressed check bytes. Raw producer results retain
coverage notes, revisions, full application accesses and actual affected selection.
The first collection used the uncompressed equivalent of the command above.

For each later accepted candidate, retain its own check/measure/affected inputs,
refresh API and architect views together, and invoke the collector with that
checkout and `--compare plans/harness-decomposition/evaluation/execution-baseline.json`.
Use the actual changed path for an extraction-specific affected witness, preserving
the original assistance probe separately when comparing the same intervention.
Do not collect while production source or generated catalogs are changing.

The collector validates every inventory file's hash against disk, its byte count
against measure, and catalog/measure/affected revisions. It retains actual owner
declarations, purposes, exposed-symbol counts, dependency identities, per-owner
source/resource/document and API context buckets, physical catalog sizes,
consumer/provider pairs, imported original counts, and owned/direct test source
files. It does not implement a second import resolver. Cross-owner counts include
type imports and remain limited by producer coverage. Direct testing imports
include helpers and exclude transitive reach; suite/title counts come separately
from architect evidence. Physical catalog bytes include metadata and differ from
producer context-size buckets. The module declarations preserve selected exposure
contracts; full requester catalog contents are represented by identity hashes,
sizes and truncation metadata, rather than copied as if complete.

Validation used the complete clean baseline, compressed input rereading and an
identity self-comparison. No additional process witnesses or audit were run.

## Baseline observations and limits

The baseline has 16 actual modules. Harness owns 223 production source files
(3,490,588 bytes), 39 production resources (194,999 bytes), 424 testing source
files (5,542,743 bytes), and two documentation files (143,601 bytes). Producer API
context buckets are 220,310 ordinary bytes and 223,871 testing bytes. Its subtree
counts are separate; summing parent subtree totals with child totals double counts.

Both the session-store and original assistance affected probes select all 16 test
modules because of `partial-coverage`. This is actual selection, not a hypothetical
audit saving. It does not establish what tests an audit executes. The passed check
also reports partial coverage; retained codes, unresolved selections and catalog
truncations limit interpretation of dependency and contract completeness.

[Observation availability](observations-availability.json) records bounded,
read-only discovery in 160 accessible native Codex session files and existing
harness plan directories. Only session metadata and counts of explicit user-message
mentions of session persistence were retained; no prompt bodies, credentials or
whole histories were exported. This discovery is incomplete: implementation tasks
may be described differently or only appear in tool calls. The metadata's cwd is
the main checkout even for workers using explicit worktree commands, so it cannot
establish task source identity. No accepted comparable historical persistence task
was identified. The main checkout had no historical `plans/*/.harness` directories;
the current target plan had no invocation/outcome records at inspection time.

Native engineering and coordination are not automatically represented by Pi
metrics. Later assisted assessment records can describe Pi usage, exploration and
elapsed boundaries using the existing [session observation contract](../../../docs/metrics/session-observations.md),
but iteration intervals include waiting and are not exclusive active effort.
A valid operational comparison still needs comparable accepted tasks, native and
Pi coverage, model/configuration identities, actual delivered inputs, qualification
work, repairs and handoffs. None of those missing quantities are zero. This
collection establishes no productivity, speed, token, cache or audit improvement.
Moves do not count as new delivered work or enlarge the frozen search denominator.
