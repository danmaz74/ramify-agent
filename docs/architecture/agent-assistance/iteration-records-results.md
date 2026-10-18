# Native iteration records: implementation evidence

The [implementation plan](../../../plans/assisted-iteration-records/plan.md) is implemented by `5e4aab94041b32fdf7bbfcf6a8cdea1d63b39645`. The follow-up `8ba4c157b67e6d1fcb00b61092a62a67e50aa6fb` repairs document discovery encountered during qualification. This record retains initial candidate evidence; the cumulative assessment and any later candidates remain in assisted job `20261018T121945Z-7fe06c`, plan `assisted-iteration-records`, with original baseline `c076c60a555bc06718ae51712dce032b22e64672`.

## Implemented behavior

The `iteration` MCP tool records a start before work and submits candidates through its end action. The immutable start retains the outcome, declared focus, resolved initial commit, server time and Git provenance. End retrieves that record and uses the existing assessment implementation. Multiple iterations remain independent, and repair candidates reuse the same iteration. The command ledger preserves replay and recovery; existing assessment callers and final-plan baseline rules continue to work. Assessment completion timestamps are optional for historical compatibility and appear only with a committed outcome.

The [usage guide](../../agent-assistance.md), [service contract](service.spec.md) and [coordinator skill](../../../.agents/skills/ramify-agent-coordinate/SKILL.md) describe the actual interface and timing limitations. Module focus does not constrain edits.

## Verification

The feature's focused service, official MCP client and shared-assessor tests passed: 25 tests. They cover action shapes, immutable starts, explicit and default bases, dirty and unavailable status, moving HEAD, replay and conflict, ledger recovery, multiple starts, repair candidates, completion timing and legacy compatibility. The discovery follow-up passed 21 focused discovery, capture and shared-assessor tests. Type checks and `check:self` passed for both commits; the structural check retains its existing partial-analysis qualifications.

The default configured audit of `5e4aab94` passed in provider-selected `ramify-partial` mode. Its six configured checks passed, including 3,470 passed tests and two skipped tests, plus 16 passed scenarios and 252 passed steps. This is the provider's selected coverage, not a claim that every repository test ran. The report is `36522ae50fde72812c23952a3ad252d772317922`, retained at `refs/audited/runs/2026-10-18T12-40-24Z-5e4aab940`. No scope override or separate audit runner was used.

## Live MCP witness

The [retained witness](evidence/iteration-records-live-2026-10-18.json) contains actual official-client calls and service responses against a disposable checkout of the initial candidate. A focused default-HEAD start and a broader explicit-base start were retained. The checkout was correctly qualified as dirty because its witness plan was untracked. Start replay and job retrieval remained identical after a clean service restart.

End returned `as-0001` promptly and repeated end calls retained one linked assessment. The configured provider reused the passed audit with its original source and report identities. Real Pi assessment completed with `incomplete`: its reviewer could not inspect the eventual post-completion MCP transcript while performing that same assessment. This exact evidence limitation and the recorded completion time are retained. After completion, a second restart preserved the result, timestamp and end replay. The broader iteration remains started and unassessed.

The observed time to first candidate was 781.921 seconds, including the wait for audit reuse; assessment elapsed time was 183.697 seconds. No clear-candidate interval exists for this witness. These intervals measure waiting and execution together, not active engineering effort or interface performance. Historical audit duration is not current retrieval cost. Source repairs, interrupted-assessment recovery, moving HEAD and controlled clock inconsistencies are covered by scripted tests, not claimed as live observations here.

## Discovery correction

Qualification encountered a historical absolute evidence link during transitive document discovery. Assisted capture now retains outside-project references before any external read. Default discovery still rejects path and symlink escapes. Pi receives missing and outside references to assess their relevance to the actual requirements; unrelated historical links do not become mandatory plan obligations. Unresolved required evidence still prevents clear, while explicit pinned-document failures and unreadable principle evidence remain deterministic gaps. The correction changes no principle, protected specification or assessment authority.
