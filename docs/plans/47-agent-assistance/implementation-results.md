# Plan 47 implementation record

**Status:** Runtime implementation delivered in the `agent-assistance` worktree; final qualification pending. Implementation commit `e792f3c21d2d2e3dd45f09aefe35f9740d605865` has completed its first default audit; a native repair iteration and final qualification are in progress. Final passing audit evidence and the native repair pilot result remain outstanding. This record does not declare plan acceptance.

## Delivered runtime behavior

| Area | Implementation |
| --- | --- |
| Plans, jobs and MCP | An `assisted` job uses existing plan discovery, job IDs/directories, command admission, generic ledger and project lock. Official SDK stdio tools register jobs, submit assessments, read compact results/detail and findings, record authorized decisions, cancel and resume. |
| Audit | The adapter calls the existing configured-audit port with the exact candidate and default provider scope. Existing workspace ownership and receipts retain requested and reused commit identities and provider evidence. |
| Protection | Git diffs and tree entries compare every candidate with a fixed registration baseline. Rules select principles, specifications, guarded configuration and explicit paths. Dirty protected inputs become setup gaps. Authorized exceptions bind an exact before/after change through existing finding decision records; they never authorize subsequent edits. |
| Review | Shared review preparation supplies candidate inspection tools, observed-read coverage and report validation. Pi performs a combined independent code/scope/design review through the existing queue and session infrastructure. Explicit requirement documents are read at pinned revisions; captured plan and baseline companions remain available as evidence. |
| Findings and gate | Pi investigates, deduplicates and reconciles concerns through shared factual briefing and validation. Existing CheckFinding transactions retain reports, decisions and correction history. Deterministic rules combine audit, protection and review into `clear`, `action-required` or `incomplete`. Required failures cannot be waived by reviewer prose. |
| Follow-up and recovery | Later assessments link the same job's prior assessment and findings. Final assessment compares the original baseline with the current candidate. Ledger-backed checkpoints retain accepted Pi reports before acknowledging submission; explicit resume reuses retained stages. Shutdown drains owned work before releasing the lock. |

The assessment only inspects source. Native workers implement repairs and can edit any module. Optional observations stay in reports; findings do not automatically become tracker issues. Routine results bound repairs, decisions and gaps and point to retained detail when truncated. Missing evidence or review overflow cannot become a clear gate.

## Reuse and extraction

Thin adapters reuse `CandidateSource`, configured audit, audit workspace ownership, document discovery, plan discovery, job storage, command admission, generic ledger and Pi sessions. Git remains the source identity and protected-change mechanism; there is no copied source snapshot store.

Where harness execution context previously prevented direct reuse, both execution paths now call shared behavior:

- Candidate review preparation and concern/evidence binding.
- Reconciliation factual briefing and decision validation, with execution-specific authority.
- Finding transaction validation, replay detection and record materialization, with execution-specific ledger events.

New code owns assisted job admission/lifecycle, MCP transport, fixed-baseline protection policy, a Git-backed document reader, retained evidence access and assessment composition. It does not introduce a plan scheduler or parallel plan registry.

## Separate non-runtime deliverables

The [coordinator](../../../.agents/skills/ramify-agent-coordinate/SKILL.md) and [module-work](../../../.agents/skills/ramify-agent-module-work/SKILL.md) skills describe native coordination and optional module focus. The [usage guide](../../agent-assistance.md) and [service contract](../../architecture/agent-assistance/service.spec.md) document setup, tools, results and authority. These are separate from runtime capabilities.

## Verification

Qualification ran in `/workspaces/worktrees/agent-assistance`, branch `agent-assistance`, based on `10958a2b652fcc90656776d39c238b63c680f833`. The worktree has its own installed dependencies; installed `ramify.ts` is the pinned `0.5.2`.

- Type checking passed for the root, web and scripts configurations. The final runtime adjustment also passed `tsc --noEmit`.
- The affected regression run passed **108 tests in 16 files**: assistance service/adapters/MCP/Pi, CLI, shared review lifecycle, findings composition and run recovery. Ordinary tests script external boundaries.
- Additional current-harness reconciliation, finding-ledger and review-signal regressions passed (55 tests in six files, including assisted overlaps; counts are not additive).
- `npm run check:self` completed and passed: **0 errors, 0 warnings, 458 analysis limits**, with partial coverage over 15 owners, 997 source files, 97 resources and 19,082 accesses. This is not a claim of complete static coverage or a provider audit.
- `git diff --check` passed. Documentation links and skill frontmatter were checked.

The [qualification record](evidence/qualification-2026-10-18.json) retains the commands and result counts.

The regression cases include restart/replay, mixed job discovery, single-writer drainage, cancellation isolation, requirement revisions, current source reads before closure, cumulative final review, review overflow, exact protected-change acceptance/revision/reversion, and actual materialized evidence hashes.

### Installed MCP client

The [protocol witness](evidence/mcp-protocol-2026-10-18.json) records an official SDK client launching the real stdio executable against a disposable local clone. Registration retry and process reconnection recovered the same job and captured plan. This witness predates the added `protection_accept` tool; its recorded tool count is historical. Linked-transport tests cover assessment observation and cancellation with a scripted assessor.

### Live Pi review

The [Pi witness](evidence/pi-review-2026-10-18.json) records a real `openai/gpt-6-sol:high` review of the existing compatibility fix from `177c004ea13ada774347a96266ed5eacaba3f248` to `10958a2b652fcc90656776d39c238b63c680f833`. Pi submitted a validated report in **92.6 seconds**, reading 17 source files. The report found no source concern and explicitly recorded that the isolated review had no audit/test execution. Token usage was unavailable. This proves live review integration, not acceptance of the new feature or measured coordinator savings.

### Live MCP assessment

The [live MCP assessment record](evidence/mcp-live-assessment-2026-10-18.json) records real stdio registration, admission and polling against the same existing commit in a fresh local clone. After **602.7 seconds**, the smoke reached its ten-minute bound while the default provider audit was still executing its configured tests. The client cancelled the assessment and closed the server successfully. No assessment stage completed and no gate result was returned. The clone had no existing `refs/ramify-audit` evidence to reuse. This verifies admission, observation and bounded cancellation, but **does not verify the full live audit-to-Pi pipeline**. It also cannot audit the executor's own uncommitted implementation. A further run needs sufficient audit time; no scope override or audit bypass was used.

## Limits and remaining acceptance

The local MCP control plane accepts explicit assertions of actual user authority, consistent with the existing trusted harness control boundary. `finding_answer` and `protection_accept` record an already-authorized decision; Pi receives neither tool. There is no new identity/authentication framework. Required audit failures remain non-waivable.

Pi can read immutable candidate source and retained audit/document/assessment evidence. Arbitrary scratch diagnostic commands are not exposed in this first implementation; evidence that requires unavailable diagnostics must remain an explicit gap. Principle adoption is not inferred from a filename. Requirement coverage reviews the captured plan and explicit references without creating a persistent acceptance inventory.

Before plan acceptance, commit the implementation, run the project's default configured audit on that clean candidate, and exercise a native implementation/repair iteration plus cumulative assessment through MCP. Record exact candidate identities, returned results, useful findings, coordinator interactions and available timing/context observations. No measured efficiency benefit or complete live correction-cycle qualification is claimed here.

## Committed qualification and native repair pilot

The first [committed audit](evidence/committed-audit-initial-2026-10-18.json) completed in 673.5 seconds. Default mode selected a full audit because the dependency manifests changed. All 470 expected test files ran: 3,836 tests passed, one failed and two existing opt-in fixture tests were skipped. Type checking, all 16 Cucumber scenarios (252 steps), structural checking, production web build and patch integrity passed. The remaining failure was the existing exact tree-metadata assertion, which had not yet been updated for submodule commit IDs.

The real repair pilot uses the implementation worktree as both executor and target, with native Sol implementation and `openai/gpt-6-sol:high` Pi assessment. Job `20261018T101139Z-115fc6`, plan `assistance-tree-entry-qualification`, captured baseline `e792f3c21d2d2e3dd45f09aefe35f9740d605865` before repair, with no protected-input gaps. Its captured plan requires valid submodule identities, refusal of malformed metadata, blob compatibility and a passing audit. The initial MCP assessment reuses the completed audit and inspects the pinned pre-repair source. The coordinator supplied the audit failure and parser invariants to a native Sol worker; no harness records are edited manually. Results and the correction candidate will be recorded here after qualification.
