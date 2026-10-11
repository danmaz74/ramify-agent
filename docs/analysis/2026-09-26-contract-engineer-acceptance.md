# Contract engineer: concise instructions and harness verification

Date: 2026-09-26. Status: source-based analysis and proposed behavior; no runtime
implementation or new replay in this investigation.

The contract engineer designs and implements an executable agreement. The
harness determines whether that agreement is established. An unfinished but
repairable submission should result in specific feedback to the same session.
An actual blocker needs resolution; repeating the same instruction under the
same blocking conditions cannot resolve it.

## Findings in the current implementation

1. `validateContract` accepts a schema-valid `incomplete` result immediately.
   `runContractSession` then closes the iteration as partial, without a contract
   gate. Nothing is registered, but the engineer stops working. The test named
   `X1b: a contract sub-session that returns incomplete registers nothing`
   explicitly permits this when the fake does not yet pass conformance.
   This is existing policy, not just a missing prompt instruction.
2. For `established`, the harness already runs the contract checkpoint. It adds
   the declared conformance suites to consumer test selection, checks types and
   Ramify, and checks fake naming and exposure parity. Repairable gate failures
   can continue the same session within the configured repair bound.
3. The contract-specific checks do not establish that the consumer tests reached
   the fake or that their assertions depend on its required behavior. Artifact
   existence, declared injection paths, naming and exposure are insufficient.
   The integration fixture demonstrates a correctly wired example; it does not
   provide a general runtime check against disconnected or vacuous tests.
4. The interactive `run_scope_tests` tool receives the assignment's test policy.
   The gate adds conformance paths only after a completed submission names them.
   The prompt therefore promises more than the interactive tool selected in
   the trial. Both should use the same required evidence once draft suites exist.
5. The recorded revised replay supplied 21,795 bytes of system prompt and
   30,916 bytes of brief. The system prompt alone included an 8,188-byte JSON
   schema block. The Pi adapter also supplies that schema in the submission
   tool description. Most of the brief preceded the actual need and consisted
   of captured source evidence. Appending more instructions made this worse.
   Current Plan 14 package delivery has changed since that recorded trial;
   these measurements describe the replay, not every current invocation.

Source locations:

- [Submission validation](../../subs/harness/src/contracts/submission.ts:103).
- [Incomplete closure and contract repair](../../subs/harness/src/run/service.ts:7044).
- [Contract checkpoint](../../subs/harness/src/run/service.ts:7102).
- [Interactive equipment](../../subs/harness/src/work/engineer-equipment.ts).
- [Existing incomplete-result test](../../subs/harness/src/tests/contract-delegation.test.ts:455).
- [Executable delegation fixture](../../subs/harness/src/tests/contract-delegation-integration.test.ts:285).
- [Tool schema delivery](../../subs/harness/subs/agent/subs/pi/src/pi-agent.ts:517).

## Submission handling

| Result observed by the harness | Required response |
| --- | --- |
| Missing interface, fake, integration or tests that can be written in scope | Return the missing deliverables to the same session and require completion. |
| Failing tests or missing proof that the tests use the fake | Return exact check failures and missing evidence to the same session for repair. |
| Claimed scope blocker | Check it against actual module scope; fix the assignment when appropriate or obtain the necessary coordination decision, then resume with updated facts. Never tell the engineer to bypass scope. |
| Conflicting requirements, ownership decision, or unavoidable incompatible change | Assess the concrete conflict and resolve the decision before resuming. Free-text design conflicts need agent judgment, not keyword classification. |
| Missing infrastructure, context exhaustion, cancellation or exhausted repair budget | Record the harness-observed stop or suspension and retain progress. Register no contract. |
| All required evidence passes for the settled candidate | Register the contract and finish the contract iteration. |

There is a reason to record unfinished work and genuine blockers. There is no
reason to treat an arbitrary `incomplete` report as sufficient grounds to end
a repairable assignment. The simplest change can retain the existing report
shape while changing its disposition; a separate `blocked` report may make the
interface clearer, but is not necessary to establish this rule.

Separate schema validity, candidate submission and successful establishment in
the tool's feedback. Preserve a continuation handle until the harness has made
its decision. Run verification only after the writer has settled, as the
current gate does. Reuse bounded continuation instead of a fresh ordinary
engineer invocation that restates the same need. Apply the bound to semantic
corrections too; a model repeatedly returning unfinished work cannot loop forever.

## What the harness must verify

For an agreement that requires a fake:

1. Resolve the submitted artifacts and required tests against the actual candidate.
   Record the revision, interface, fake identity and suite identities. Do not use
   test results from an earlier tree as evidence for the candidate.
2. Execute consumer behavior tests and conformance tests through the project
   runner. Require results for the relevant cases, including missing, skipped
   and failed cases; a nonempty file selection and aggregate exit code alone
   do not establish that each required case ran.
3. Verify runtime use of the declared fake through the consumer's integration
   path. Associate observations with the relevant tests. A direct call from a
   conformance test must not satisfy the consumer integration requirement.
   Module loading or fake factory construction alone is insufficient when the
   requirement concerns operations on the object the factory returned.
4. Verify that assertions depend on the fake's required behavior. A useful
   controlled check runs the same tests on an isolated candidate with a relevant
   fake response deliberately made incorrect. The expected behavior assertion
   must fail. Compilation errors, import errors and unrelated failures do not
   count. Keep the real candidate intact and restore/recreate the test environment
   between runs. Use controls appropriate to the behavior, including side effects
   or asynchronous events where those define the contract.
5. Check that tests cover the requested guarantees. Execution traces and negative
   controls establish use and sensitivity, not completeness or correct expected
   answers. An agent must assess the requirements and assertions; the harness
   should record that assessment beside executable evidence. Do not substitute
   a regex search for fake names or a line-coverage percentage.
6. Run the existing type, architecture and applicable contract checks, and accept
   only when the required evidence is present and passing. Return failures to
   the same session with concrete repair instructions.

The test runner needs a supported way to report fake invocation and controlled
substitution. This adapter contract is not implemented by the current artifact
schema. The engineer can provide fixtures and wiring, but the harness must run
the checks and verify their results. If an adapter cannot establish a required
witness, report that gap rather than silently passing it. A scoped prototype
for the project's actual runner should precede a generic instrumentation design.

For an access-only agreement, verify consumer behavior through the real provider;
there is no fake or fake conformance requirement.

## Shorter prompt

Replace the current repeated system/procedure/skill text with one short role
instruction, followed by the actual need, scope and directly applicable constraints.
Keep the submission schema in one tool-facing location. Retain important
compatibility, ownership and fake exposure requirements; supply detailed source
references through the existing context package instead of duplicating them.

Illustrative role instruction for the proposed protocol, not current behavior:

> Design the interface that satisfies the supplied need. Read the provider and
> consumer and check affected existing uses. Preserve existing contracts, or
> report a concrete incompatibility requiring a decision.
>
> Create the interface, fake, conformance tests and consumer integration tests.
> Tests must assert the requested behavior through the fake. Keep existing
> behavior real and give the fake the same access as its eventual replacement.
>
> Work within the supplied scope. Report genuine blockers with evidence.
> Missing work or failing tests that you can repair are reasons to continue.
>
> **Harness verification:** Submit the candidate artifacts. The harness runs
> the required tests, verifies use of the fake and checks the candidate. Repair
> any returned failures in this session. The agreement is complete only when
> the harness confirms it.

The highlighted paragraph is a promise the harness must implement. Merely
placing it in the prompt would repeat the existing test-tool mismatch.

## Next experiment

Test the shorter prompt and changed continuation behavior as separate factors:
original versus short prompt, each with current versus revised submission
handling. Start with bounded isolated invocations at the same original state;
report completed artifacts and verified behavior, not verbosity of the report.

Before interpreting a live-model result, exercise the acceptance mechanism with
concrete controls: a fake never used by the consumer, a fake called but ignored,
a fake used only by conformance, a skipped required test, a valid integration,
a repairable incomplete result, and a genuine scope blocker. The first four
must not establish a contract; the valid integration must; repairable work must
return to the same session; the scope blocker must produce a resolution path
without an unchanged retry loop. Include bound exhaustion and access-only cases.

The earlier replay stopped at submission and never ran this acceptance process.
Its longer report is evidence of improved discovery only. It provides no evidence
that a contract was established or that consumer tests exercised a fake.

## Prompt revision after the user's edits

The user removed persona commentary, later provider lifecycle details and
repeated design rationale from the rendered prompt, and emphasized backward
compatibility. Those edits were retained in a consolidated draft at
`/tmp/contract-engineer-full-rendered-tfyzx3pq.md`, also copied to
`/tmp/contract-engineer-short-draft.md`. The user-edited input is preserved at
`/tmp/contract-engineer-user-edited-9tbfg8pz.md`.

The draft is 6,094 bytes and 116 lines, down from the user's 51,211-byte input
(88.1% smaller). Its system message is 344 words. The behavioral need and
captured write-scope entries remain verbatim. Repeated procedures, tool usage
descriptions, the embedded JSON schema, and long principle excerpts were
removed; relevant source references remain available for reading. The tool
schema must still be supplied by the runtime. All referenced files were checked
to exist in the replay tree.

The highlighted harness-verification paragraph describes the proposed behavior
in this analysis. The runtime does not yet implement all of it. This revised
file is a draft, not the historical prompt or evidence of another replay.
Original replay inputs remain under each arm's `records/` directory.
