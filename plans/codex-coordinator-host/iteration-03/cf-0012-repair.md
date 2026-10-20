# I3 resume successor admission repair

Assessment `as-0010` passed audit at candidate
`af7e91d8db8f67efee6d3088c4459c9a9576a2b2` and required repair `cf-0012`.
An exact resume retry through predecessor A after successor B stopped could
previously launch another host from A, omitting B's receipts and settings.

A retained successor record now permanently identifies the continuation admitted
from its predecessor. Resolution examines retained generations independently of
the active index. The same command ID and full argument hash observe that admitted
successor, including its stopped/error state or an older generation while a newer
owner exists. Changed arguments fail. A different command cannot branch from an
ancestor that already has a successor, and a new continuation must select the
latest coordinator. Conflicting retained successors cause refusal. The actual
host rechecks latest-predecessor authority while holding the existing service
ownership, before publishing its own record; a losing or direct launcher cannot
bypass that check. No extra acceptance state or replay engine was introduced.

The exact registered native CLI regression executes A -> explicitly fresh B,
changes B's coordinator/assessor configuration and disabled MCP names, admits a
completed send and a send whose provider acknowledgement is withheld, and stops
B. Retrying A's original resume observes stopped B and leaves provider history
and the active index unchanged. Changed options and new stale-selector commands
fail. Resuming latest B creates C with B's fresh thread, model/assessor settings,
all disabled MCP names and both mutation receipts. Retrying the completed send
returns its exact retained outcome; retrying the unacknowledged send remains
uncertain, and neither changes provider history. Further old retries still
observe B while C exists. After C stops, its original resume admission also
remains C rather than launching another generation.

Ordinary regressions additionally verify that an unrelated later active record
does not hide an older admitted successor, and that a direct host invocation
against a stale predecessor closes service/runtime ownership before any provider
construction or new record publication. The ordinary process guard rejects any
unexpected launch. The native fixture's protocol/model answers are scripted;
CLI, filesystem, loopback HTTP, persistence, detached processes and settlement
are real. This is not a repeat of the separate model-backed pilot.

Verification from the isolated project root:

- [Focused tests](verification/cf-0012-focused-tests.log): 194/194 in 13 files,
  including 16 exact registered native cases, exit 0.
- [TypeScript](verification/cf-0012-type-check.log): all four configurations pass.
- [Self-check](verification/cf-0012-check-self.log): 0 errors, 0 warnings,
  781 existing analysis limits; coverage remains partial, exit 0.
- `git diff --check` passes. Updated [source hashes](source-sha256.json) bind
  the final changed source, tests, registry and documentation.

No protected specification, principle, dependency, global configuration or audit
project changed in this repair. The protected after-blob remains
`d563faab5db2309f95878f632280d6f0d34e92b0`; exact authorization `cf-0008`
remains held for the coordinator's final approval. Implementation reassessment
belongs to the coordinator; no direct full audit or broad live repeat was run.
