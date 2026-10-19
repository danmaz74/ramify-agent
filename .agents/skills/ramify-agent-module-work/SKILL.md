---
name: ramify-agent-module-work
description: Implement or repair an assignment from a native Ramify coordinator, using module context and making necessary cross-module changes. Use for Sol engineering work in an assisted plan, not for Pi review.
---

# Implement assisted plan work

Receive the intended outcome, acceptance, target project and any module focus from the coordinator or parent Sol worker. Read the project's instructions. This skill works for a focused module assignment or a broader outcome spanning several owners. RA's Pi sessions independently assess the committed result; the worker implements and verifies it with native tools.

## Working directory

For a module-focused assignment, use `<target-worktree>/<module-path>/src` as your default working directory. Retain the absolute project root and module root from the brief. Verify the directory with `pwd` before working. If the host cannot set a session-wide CWD, explicitly set each shell tool's working directory to that `src/` directory and resolve file-tool paths against it. A `cd` in one shell call does not establish the next call's directory or change a separate editing tool's path base.

Use an explicit project-root working directory for project-wide commands; in ramify-agent, npm checks run from the repository root. Use explicit paths or another working directory when inspecting or editing another owner. Broader assignments use the project root unless a useful common starting directory is given. If the focused module has no `src/`, use its module root and report that fact; create source directories only when the implementation needs them.

## Ramify module orientation

Read the shared [module orientation](references/module-orientation.md) before inspecting module source or APIs. It explains `src/`, `subs/`, declarations and exposures, ordinary/testing API catalogs, refresh commands and deeper documentation.

## Orient to the outcome

Start with the owner's purpose, relevant source and tests, available ordinary/testing API views, and applicable principles or specifications. Use the installed toolkit CLI and generated views where useful. There is no assisted module-context MCP operation yet. Broaden inspection when a behavior or failure requires it; focus is not a read restriction.

Treat adopted principles as design commitments and specifications as precise behavioral requirements. Preserve document scope and status: a `.principles.md` filename alone does not establish adoption. Use the coordinator's protected baseline and project rules; do not edit a sealed commitment to make an implementation acceptable. If a change needs a protected edit, explain the concrete diff and reason to the coordinator and continue independent authorized work.

## Implement across owners when needed

Module focus concentrates understanding; it never restricts where you may write. Make understood provider, consumer, exposure, test or configuration changes needed for the outcome. Crossing a module boundary alone requires no permission, scope expansion, new task record or handback.

Consult the coordinator when design uncertainty needs a decision, another worker owns overlapping edits, or splitting/recombining coordinator assignments would help. Bounded delegation within your assignment follows the permission below. Send the needed behavior, evidence, affected owners and recommended next action. Keep working on independent parts. Do not turn an ordinary question into a terminal partial submission.

Preserve behavioral contracts and Ramify importability. Verify consumer/provider behavior together where it matters; local mocks alone do not demonstrate integration. When repairing an RA finding, use its evidence and acceptance to address the cause and relevant regressions, rather than changing the requirement or merely removing the reported symptom. Run checks appropriate to the change; RA performs the iteration audit.

## Delegate bounded work

A Sol worker assigned directly by Astra may use Sol subagents for bounded investigation, implementation or verification without asking permission again. Choose separable work whose benefit justifies briefing, repeated orientation and integration. This permits one additional delegation level: children of a Sol worker may not spawn further subagents. Honor explicit user restrictions and available agent capacity; continue locally when delegation is unavailable.

Give each child this skill and the shared module orientation, using resolved paths, and explicitly identify it as a child that may not delegate further. Supply the bounded outcome, relevant parent acceptance and integration obligations, applicable principles/specifications, protected inputs, source/API/test starting points, and known overlapping writers. Do not rely on conversation inheritance to provide the brief.

Inherit the parent's module focus by default. Explicitly name a different module when its internals dominate the child's task, or state a broader focus for integration across owners. If the parent has no module focus, retain that broader focus unless the child needs a specific owner. Supply the absolute target worktree root, chosen module root and working directory using the working-directory rules above. Focus never restricts reads or writes. Check API availability for the actual consuming module and ordinary or testing source area, even when it differs from the assigned focus.

Send Astra a short notice naming the child, its task, focus and affected areas so it can coordinate overlap and capacity; this is a notification, not an approval request. Coordinate shared edits and commit ownership before concurrent work. Children return findings, changes and verification evidence to their parent Sol, which integrates the results, verifies the composed outcome and owns the complete engineering handoff. Keep children within the existing iteration; Astra retains candidate assessment and plan coordination.

## Wait for verification

Wait for commands to finish using an interruptible process wait, with a maximum of 15 minutes where the host supports it. Completion should return early. Use the longest supported wait if the tool has a shorter limit; avoid repeated one-second checks and separate sleep/status loops. At the deadline, inspect status and investigate concrete evidence of a problem, then continue waiting if healthy. A timeout alone does not justify stopping or restarting work. Keep detailed output in command logs and retrieve what is needed to diagnose failures.

When waiting for children, use `wait_agent` with `timeout_ms: 900000` where supported, returning early for messages or completion. Finish or explicitly stop child work before the final handoff so no child continues changing the candidate afterward.

Send the assigning coordinator or parent Sol meaningful changes, blockers and the engineering result, rather than unchanged-status messages or routine acknowledgments. After the handoff, finish the worker turn; Astra observes RA and can resume engineering for repairs. See [passive-wait setup](../../../docs/agent-assistance.md#passive-waiting) for host configuration; a skill cannot override conflicting higher-priority commentary instructions.

## Return a concise engineering result

Report the changed behavior and interfaces, checks with their outcomes, any remaining integration work or uncertainty, and protected changes needing a decision. Mention other owners touched when useful for integration; no per-edit telemetry is required. Include a commit ID if the coordinator assigned candidate preparation, otherwise identify the working changes.

Keep commits within existing authorization and coordinate shared-worktree writers. Do not start a separate RA execution or assessment for each worker; the coordinator assembles the iteration candidate and submits it. Your verification informs that submission but does not replace RA's independent gate.
