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
