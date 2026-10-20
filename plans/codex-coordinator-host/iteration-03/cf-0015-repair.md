# I3 stable resume intent during settlement

Assessment `as-0012` confirmed `cf-0013` and `cf-0014` resolved at candidate
`b591c6c0a66b4580545efb92cac18eb1d6f8def6`, with passing audit and independently
rerun focused tests/type checks. It identified `cf-0015`: a fresh predecessor's
thread adoption could complete while HTTP stop waited for startup. The client
used its earlier null-thread snapshot to infer a fresh-context flag for the first
admission, then inferred a different flag on identical retry after settlement.

The repair separates responsibilities using the existing fields:

- The client preserves its explicit caller fresh flag in the existing normalized
  request and hash; it does not reconstruct that input from provider thread state.
  Inherited settings come from the post-stop predecessor record.
- The host reads its predecessor after settlement, decides the effective fresh
  requirement once, and freezes that decision in the existing record.freshThread.
  An unfinished fresh-context request is retained; an already adopted thread is
  reused unless the new caller explicitly requests another fresh context.
- Exact retries continue to verify the original full request hash and observe the
  recorded admission. Changed explicit fresh flags conflict even if the effective
  inherited strategy would otherwise be identical.

No new hash/receipt format, generation state, index behavior or recovery lookup
was added. The sole generation admission, service ownership, settlement proof,
stale-selector refusal and uncertain-command inheritance remain unchanged.

The new exact registered native case uses the actual CLI, guardian, host, HTTP
control and Python provider process. The provider fixture holds its thread/start
response after creating persistent history. A fresh-context predecessor is observed
preparing with no adopted thread. A separate real CLI resumes it without a fresh
flag; its HTTP stop is observed waiting in stopping. Releasing the response lets
the host retain its thread before settlement. The successor is ready with that
same persistent thread and original job. Repeating the exact command observes
the same successor and leaves history unchanged. Adding the explicit fresh flag
under the same command ID fails with an argument conflict.

The existing early-publication witness additionally verifies a successor whose
effective fresh decision was inherited: exact retry still succeeds, while adding
the explicit fresh flag conflicts rather than being hidden by the inferred
strategy. Existing native stopped-successor, multi-generation, early-failure,
completed/uncertain mutation, persistent/fresh recovery and process-settlement
cases remain passing. Provider/model answers are scripted; process/HTTP ordering,
persistence, actual stop waiting and settlement are real. No broad live-model
repeat was run.

Final current-source checks from the isolated root:

- [Focused tests](verification/cf-0015-focused-tests.log): **197/197** in
  **14 files**, including **18 exact registered native cases**, exit 0.
- [TypeScript](verification/cf-0015-type-check.log): all four configurations pass.
- [Self-check](verification/cf-0015-check-self.log): 0 errors, 0 warnings,
  781 existing analysis limits; partial coverage; 25 owners, 1093 source files,
  101 resources, 20035 accesses; exit 0.
- `git diff --check` passes; [source hashes](source-sha256.json) bind all 33
  changed I3 source, test, registry, declaration, usage and skill files.

The protected specification after-blob remains
`d563faab5db2309f95878f632280d6f0d34e92b0`. Exact `cf-0008` authority is
held for final approval. This repair changes no protected specification, principle,
dependency, global configuration or audit project. The coordinator owns
reassessment; no direct full audit was run.
