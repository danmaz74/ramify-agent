# Iteration 1 repair: identity-scoped admission

Repairs `cf-0004` from assessment `as-0003` of candidate
`92a13cc2b2a8bf3aafc32312e6ad59225d553384`. This remains iteration
`it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a` of job
`20261019T190943Z-7fd938`. Earlier reports retain their historical provenance;
this report supersedes the admission/idle attribution rules in
[repair 02](../repair-02/report.md). The [original live qualification](../report.md)
was not repeated.

An admitted input is now a separate request generation, not a null active turn
whose surrounding notifications can be mistaken for its outcome. Admission has a
pending/uncertain phase; only its correlated `turn/start` reply establishes its
turn identity. Runtime status and exact active identity remain independent. Input
admission and explicit rejection advance snapshot revisions without replacing
runtime values. Rejection preserves newer observations; uncertain acceptance is
never replayed automatically.

The control rules are now explicit:

| Evidence | Effect |
| --- | --- |
| Old completion while a new request awaits identity | Record that old turn's terminal fact. Do not change the admission or attribute its completion to the new request. |
| New acknowledgement | Check the admission generation and establish its exact identity. Use only terminal facts for that same identity to return a completed outcome; unrelated idle/completion observations cannot retire it. |
| Completion before acknowledgement | Retain its exact outcome; the acknowledgement settles the admission if its identity matches. An unrelated completion remains unrelated. |
| Ambiguous thread status during admission | Keep the admission reserved. The status alone does not identify which turn it describes. |
| Idle against an exact live running turn | Keep busy/interruption authority until matching terminal proof. Idle may describe preceding work, including when delivered before the new acknowledgement. |
| Idle against a previously adopted snapshot identity | Clear/retire that exact known snapshot identity. Never infer retirement for an unseen identity from a later snapshot or acknowledgement. |
| Start for an unseen identity after pre-adoption idle | Accept the actual start. That identity was not retired merely by an earlier ambiguous idle. |
| Conflicting acknowledged/observed running identities | Report explicit uncertainty and keep admission reserved. Matching terminal notifications or history for all implicated identities can settle it; idle alone cannot. |

Snapshot adoption still preserves newer observations across start/resume/read,
retains early notifications before verified adoption, refreshes snapshot-derived
state from fresh history, and requires matching terminal proof to finish known
live work. Terminal facts stay scoped to their own IDs. A lost submission reply
with no correlated identity remains uncertain even if unrelated or uncorrelated
turns finish. The unchanged bounded response-delivery repair retains its prior
qualification. No public interface, protected document/configuration, process
supervisor or provider permission changes.

The actual `prepareCoordinatorProvider` regression resumes an old active snapshot,
receives idle, admits new input, receives the old completion, and acknowledges the
new turn in progress. A later actual new start and fresh active history preserve
busy state and exact interruption authority; no second `turn/start` is emitted.
Matching new completion permits follow-up input. Other small regressions cover an
unrecognized old completion, completion before acknowledgement, batched replies,
ambiguous idle, pre-adoption identity handling and terminal proof for conflicting
identities. The earlier consumer adoption/history/response regressions remain.

The exhaustive probe is kept in `provider-ordering.stress.ts`, outside ordinary
and audit discovery as required by [the testing contract](../../../../docs/testing.spec.md).
Its shared black-box helper tests public provider operations:

- All 120 relative orders of old start, old completion, new start,
  acknowledgement and idle must retain busy state and exact new-turn interruption.
- All 720 relative orders adding new completion must require that matching
  terminal evidence before allowing follow-up input. This includes completion
  before acknowledgement and defensive duplicate starts after terminal facts.
- Each ordering runs with interleaved promise continuations and again in one
  synchronous dispatch batch: 1,680 sequences total. Every sequence checks no
  unintended second input, fresh history, interruption and terminal follow-up.

This is finite adapter ordering qualification, not an assertion that every tested
ordering occurs in the installed CLI or a proof of every possible protocol trace.

| Verification from the isolated project root | Result |
| --- | --- |
| Focused ordinary provider and assistance tests | 70 passed in two files; zero native/refused process attempts. |
| Opt-in provider ordering probe | Both tests passed, covering 1,680 guarded in-process sequences; zero native/refused process attempts. |
| Exact registered native coordinator-provider witnesses | Both passed; six native API observations and zero refused attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` | Passed. |

[Exact commands and compressed logs](verification/), [selected process receipts](test-process-receipts.json)
and [source fingerprints](source-sha256.json) retain this repair's evidence. The
receipts select the exact isolated root and absolute test paths, starting at
20:59:54 UTC on 2026-10-19. Native settlement/persistent-history behavior remains
unchanged and passed its two registered witnesses again.

No broad review, full audit, new installed-provider exercise or I2 implementation
was run. Live file/user-input requests, stopping an active native worker, and
future host/HTTP/disconnect behavior retain their earlier unqualified status.
The coordinator owns reassessment and execution notes; its dirty notes remain
outside this repair commit.
