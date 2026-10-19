# Assisted reviews wait for actual completion

User correction registered as iteration
`it-4e134ddb-6972-4282-9fa2-b15b0bab201a`, base
`ed9a61330fa6e3f7d72d34197e7fb840beffc13c`. This correction is separate from
the six ownership extractions.

The ten-minute limit was in `subs/harness/src/assistance/pi.ts`:
`runPiAssessment` raced `handle.settled()` against a default timer, then called
Stop and waited at most another 30 seconds. Both timers and the entire
`timeoutMs` configuration chain through `PiAssessmentInput`,
`AssessmentDependencies` and `createAssistanceRuntime` are removed. The shared
adapter covers the combined assisted review and assisted reconciliation.
There is no replacement elapsed limit.

The adapter now awaits actual session settlement. Existing abort signals still
call Stop; service cancellation and shutdown still abort the assessor's signal
and wait for settlement. Provider failures, rejected/unavailable sessions and
missing accepted submissions retain their existing outcomes. The separate
`assessment_wait` observation deadline and its 15-minute maximum are unchanged;
observation expiry does not stop an assessment.

The deterministic regression uses the real session-operations engine and a
controlled driver. It advances a fake clock by one hour with a review pending,
then proves either a validated submission succeeds or a genuine provider failure
returns incomplete. A second case advances an hour, explicitly cancels, verifies
the operation stays pending until its driver settles, and rejects a late
submission. The first local test attempt expected the raw provider error in the
public reason; the existing session engine deliberately reports the interrupted
point as unavailable. The assertion now verifies the existing failed outcome;
production error semantics were not changed. Both attempt logs are retained.

| Local verification | Result |
| --- | --- |
| [Focused Pi, real assessor, service and MCP tests](focused-tests.log) | 4 files, 65 tests passed; includes explicit cancellation/shutdown and observation cases |
| [Type-check](type-check.log) | All configured TypeScript projects passed |
| [check:self](check-self.log) | Passed; zero errors/denied accesses; existing partial coverage retained |
| Patch integrity | `git diff --check` and staged/committed patch checks passed |

No protected requirements, configuration, package pins or boundary registrations
changed. No full audit or duplicate Pi assessment was run. Existing live
assessment `as-0003` remains on its immutable candidate; this work does not alter
or interrupt it. Coordinator must qualify this committed candidate before using
it as the stable assessor.

## Startup after qualification

From the qualified assessor checkout root, with a compatible configured model:

```sh
node --import tsx src/main.ts mcp --project /workspaces/worktrees/harness-decomposition --model <provider/model>
```

The actual path is `src/main.ts` → `startAssistanceServer` →
`createAssistanceRuntime({projectRoot, model})` → `createAssessor` →
`runAssistedPiReview`/`runPiAssessment`. Neither the CLI nor this chain requires
or accepts an assessment timeout. A custom bootstrap can use the same exported
`startAssistanceServer({ projectRoot, model })`; it must not introduce its own
review deadline. Transport observation requests may still specify their separate
`assessment_wait` deadline.

## Other review policy observations

`subs/harness/src/run/policy.ts` still declares historical/default
`defaultReviewPolicy.attemptMs = 600_000` and `settleMs = 900_000`, with positive
integer fields in `run/records.ts`. The autonomous scheduler has legacy deadline
logic and a patch-preparation timer, guarded by `run.policy.continuity`; current
continuity disables those deadlines/timers and preserves coverage. Autonomous
review/reconciliation step construction and the manual reviewer adapter also
carry `attemptMs` into their invocation bound inputs. These paths use the shared
invocation/recovery machinery, distinct from the removed assistance timer. They
were inspected and reported to the coordinator; this correction changes none of
those captured policies or general invocation/command budgets.

## Broader managed and manual correction

The subsequent review-path trace found that the common invocation runner still
applied its five-minute silence watchdog to reviewers, design orientations and
other semantic review invocations. The runner now awaits actual provider outcome
for role `reviewer` and these exact submission schemas:

- `ramify-agent.reconciliation-submission/1`
- `ramify-agent.nonfunctional-assessment-submission/1`
- `ramify-agent.nonfunctional-investigation/1`

This includes managed and manual reviewer steps and design orientation, managed
local/capability reconciliation, and NFR assessment/investigation. The NFR paths
use equipment writer ownership for their read-only tools, so writer/reader flags
alone cannot identify review work. NFR action/scheduling, repair engineers,
ordinary engineers and other non-review roles retain their existing progress
watchdog. Command execution timeouts, explicit stop/shutdown, source authority,
provider failures, context recovery and actual session settlement stay effective.
The standalone `session` command is engineer-only; manual `step run` is the
standalone entry point for reviewer inputs.

Managed review preparation no longer receives an attempt timer. Review queue
composition no longer supplies deadline/expiry callbacks. Work-item and final
review settlement now await actual outcomes or explicit stop/shutdown, including
when historical policy records lack continuity. The obsolete private deadline and
elapsed waiting-budget derivation were removed. Captured `attemptMs`, `settleMs`
and invocation-bound fields, old events and schema readers remain compatible;
none of these fields cancels a review. Generic optional scheduler deadline APIs
remain for compatibility, but neither production queue construction supplies a
deadline. No runtime policy override or protected schema edit is required.

The earlier report overstated policy injection as a production path:
`RunService.open` already rejects caller-supplied policy; only explicit test
factories inject the retained policy-7 fixtures. Production default and resumed
continuity paths already skipped the old preparation/settlement branches. Removing
those branches makes the review rule unconditional, while the shared silence
watchdog correction changes actual managed/manual execution.

| Additional verification | Result |
| --- | --- |
| [Managed preparation, quiet review settlement, legacy queue admission, reconciliation and unchanged non-review watchdogs](broad-focused-tests.log) | 5 files, 42 tests passed |
| [Manual step suite, including hour-long quiet design-orientation submission and explicit cancellation](manual-review-tests.log) | 1 file, 14 tests passed |
| [Review attempts/questions/queue plus assisted Pi/service/MCP](additional-review-tests.log) | 6 files, 47 tests passed |
| [Real NFR assessment and investigation each quiet for an hour before repair/reassessment](nfr-review-tests.log) | 1 file, 3 tests passed |
| [Final type-check](broad-type-check.log) | Passed |
| [Final check:self](broad-check-self.log) | Passed; zero errors/denied accesses; partial coverage retained |

The new managed and NFR witnesses advance controlled clocks, rather than waiting
for wall time or raising limits. Existing deadline assertions were migrated to
actual completion and candidate-bound evidence under the explicit user correction.
The initial migrated reports omitted a changed index file; source validation
correctly rejected them, and the tests now inspect/report all required changed
paths. One NFR test initially restored real time before its fake-clock operation
persisted, causing the existing nonnegative elapsed-time validator to reject the
fixture; controlled time is now retained through settlement. Initial failed test
outputs remain in `broad-initial-tests.log` and `nfr-initial-tests.log`; no validation
rule was relaxed. No new skips, retries, native exemptions or timeout increases.

The independent [evidence-access report](../evidence-access/README.md) addresses
large-artifact inspection through complete decompression/verification and bounded
readable projections. Those artifacts do not change source behavior or rewrite
the original extraction measurements. This joint candidate requires configured
reassessment; existing live assessments were not cancelled or restarted.
