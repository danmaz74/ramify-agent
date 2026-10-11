# Prompt review: design-orientation

The only observed design-orientation invocation received all three captured guidance documents inline, summarized their design obligations, named every path and completed an accepted submission on its sole model request. Required information was adequate. There is low-priority excess in generic snapshot-review instructions and the environment's inaccessible view list, but the current procedure clearly confines this turn to reading supplied guidance and submitting an orientation. No wrong tool call, repair or failed submission occurred.

## Coverage and exact delivery

| Kind/variant | Invocation / work | Session/start | Coverage |
| --- | --- | --- | --- |
| design-orientation; reviewer/4 with orientation procedure | inv-0011 / wi-001 / wi-001.i01 | ses-0009; native session 15c94a7f-b6d4-45e8-97b9-28db4f29b2ea; fresh requested/actual | Exact packet, native request, inline complete guidance, transcript/submission/outcome |

Run is `20261009T181051Z-4c5bfc`, plan status-badge-tone, project collection-review. This turn is orientation for future design review, not candidate inspection or semantic acceptance. Candidate and snapshot are null. Its captured guidance comprises root README.md, subs/workspace/README.md and subs/workspace/subs/shared-ui/README.md; displayed captured hash prefixes are b72856422e9d, f5cdda73289e and 8cec99d7e15b. The target design involves shared-ui; ancestor guidance identifies the application independence and workspace responsibility that constrain this owner.

Evidence prefixes:

- **J** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc`.
- **O** = `/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/.harness/session-operations`.
- **P** = `O/correlations/operations/78378581f2ca62a5702d4530430616096cb0ae0ada56acb0b89aa2c89f8b614f.json`.
- **N** = `O/store/payloads/d81fe7339cc34d1783a4d3398e18542dfb64b301cb95d026a0a4236c8871bd3f`, the sole model request.

N corroborates exactly P's 2,546-byte reviewer instructions and 16,392-byte user message, with one user input and no inherited dialogue. The only native declared tool is submit_orientation. Its description carries the complete schema: read is a 1–50 item string array; summary is a required nonempty string up to 4,000 characters. The native tool's parameters are a generic object as captured; descriptive schema and actual harness validation define the full contract. Exact task-body hash is ab5893376d9933c562c291f73ebca6ad457695ce2b507c171cf5b4b398a7bebd.

The current guidance addition is 12,256 UTF-8 bytes, the procedure 935, environment 2,682 and closing task 257. Artifact copies under this postmortem's invocations/inv-0011 preserve packet/task/native-first; raw evidence above and J/transcripts/ses-0009.jsonl remain authoritative. No current template reconstruction is used.

## Required information and usability

| Need | Delivery/assessment |
| --- | --- |
| Objective | Direct: read captured design guidance, name every path and summarize its design expectations; “You review nothing yet.” |
| Guidance and design context | All three documents are directly supplied in full, with origin paths and captured hash prefixes. Root describes self-contained dependency/configuration, ownership/tags and testing; workspace describes shell and declarations; shared-ui describes presentation ownership and UI-only access. |
| Authority | No edits, commands, scheduling or decisions. Procedure explicitly allows only the designated submission tool during orientation. |
| Current state/dependencies | Orientation creates understanding for later design review; candidate null is appropriate. No iteration diff, audit result or completion evidence is needed to summarize guidance. |
| Tools/location | Only submit_orientation is available. Documents are inline, so physical working directory and unavailable snapshot reads do not impede the task. |
| Submission | Name every guidance path in read, brief own-word summary; complete schema delivered and accepted result observed. |

The task's limited purpose is clear despite a generic reviewer role. “Read” in the submission is a declaration of consuming inline guidance, not evidence of a file-tool operation. A requirement to perform snapshot_read here would be impossible, but no such current-procedure requirement exists. The generic role's “Follow the procedure in the current task” and the explicit single-tool orientation procedure resolve its future-review descriptions.

The summary accurately emphasizes root independence, explicit ownership/exposure, workspace shell/relay, shared presentation primitives, UI/browser classification, separate integration-testing owner, configured scenario locations and audit obligations. It does not promote dated standalone results into current qualification. No missing document, placeholder, stale candidate instruction or unfulfilled submission field was found.

## Findings and potential improvements

### Low: generic reviewer sections describe tools and concerns unavailable in this orientation

**Affected:** inv-0011; P roleInstructions and N instructions, Your tools and Risk and ground.

**Excerpt:** “snapshot_read reads one file of the candidate,” and “Name only a file you read with snapshot_read in this review,” while the current procedure says “you have no tool but the designated submission tool.”

**Expected goal:** Consume captured inline guidance and submit paths/summary. There is no candidate, no snapshot tool and no concern submission in this turn.

**Mismatch/impact:** The generic system carries 772 bytes of snapshot-tool instructions plus 1,028 bytes of concern risk/ground rules. These sections describe later candidate review rather than this turn's actual tools. They are not needed to complete an orientation. Current procedural limits are explicit and the agent calls only submit_orientation, so no observed failure or invented read is attributed to the mismatch. Confidence in immediate irrelevance is high; future reuse value is separate.

**Correction direction:** Make stable reviewer guidance conditional: snapshot/risk/ground sections apply only to candidate reviews; orientation consumes inline captured guidance through submit_orientation. Preserve a cache-compatible shared prefix where later design reviews continue from orientation. Replacing the prefix solely to shorten this first task can sacrifice later cache reuse; an improvement requires measurement across both turns, not only first-task bytes.

### Low: environment advertises a generated view the role cannot consult

**Affected:** inv-0011; P environment / N user message.

**Excerpt:** availableTools contains only submit_orientation, but views includes .ramify-architect, all fifteen module identities, revision and coverage limits.

The 2,682-byte environment includes a 1,077-byte view field and 988-byte limits field. Listing architect discovery paths is unnecessary to summarize supplied prose, and no read/search tool can access the advertised view in this turn. Repair and placement limits also concern other roles. No attempt to access the view or run commands is observed.

**Correction direction:** Omit unavailable view advertisements from orientation or explicitly label them as run provenance. Keep the inline guidance identities, current turn mode, designated submission and applicable rejection/time/budget controls. This trims irrelevant information while preserving the role's authority and complete submission contract. No demonstrated cost/latency improvement is claimed.

### Potential: separate operational history from durable design guidance

**Affected:** inv-0011; P design-guidance/root README section.

The root guidance includes development-server commands and proxy/port instructions (512 UTF-8 bytes), an environment-specific Vite build warning (253 bytes), and historical standalone installation/test results plus their dated limitation (552 bytes). These three exact bounded segments total 1,317 bytes. They are relevant operational documentation but do not determine the status-badge ownership or presentation contract. The agent's summary uses their durable testing/independence context without repeating historical counts or build-size details.

Potentially separate operational evidence into a referenced document so design orientation retains the complete durable design rules, ownership/test profiles and package-independence obligations while omitting unrelated startup/history details. Do not truncate arbitrary passages of captured README guidance under the current contract: the task explicitly requires reading and naming every captured path. Revise guidance selection/document structure first, then validate later design review against the same obligations. Full ancestor/module prose is useful context; its length alone does not establish excess.

## Observed effect, metrics and limits

Transcript ses-0009.jsonl line 3 records a sole submit_orientation call at 18:15:56.273Z. Its read array names exactly README.md, subs/workspace/README.md and subs/workspace/subs/shared-ui/README.md. The 1,118-byte submission includes a concise obligations summary. Line 4 records acceptance; outcome is submitted/applied with zero rejected submissions, no outsideScope changes, no late writes and 5,147 ms elapsed. There are no file reads/searches or tool errors. The task's predicted need for only inline guidance and submission matches execution.

Usage is 4,572 new input, 0 cache-read/write, 237 output and 4,809 total. Recorded-rate estimated charge is USD 0.023028. Model is openai-codex/gpt-5.6-sol high; native request package 0.87.1, SSE. There is no continuation/fork boundary inside the covered orientation. Its fresh request has no cache read; that alone is not evidence of a broken future continuation or a missed eligible parent prefix.

No architecture-discovery episode or foreign API capability need occurs. The project/module prose supplies design ownership directly; an advertised generated view is neither consulted nor necessary. An accepted orientation validates the paths/summary contract, not design compliance of a candidate. Future design-review outcomes and cache boundaries belong to their own invocation evidence.

Every observed design-orientation instance in this repeat run is covered: inv-0011 only. Native request retention establishes delivery before provider handling, not provider-internal transformations. Guidance hash headers are abbreviated in delivered text; exact delivered bytes are retained. No shorter-guidance trial or shared-prefix alternative was tested. Operational trimming and conditional generic-role recommendations remain potential improvements, not demonstrated run benefits.
