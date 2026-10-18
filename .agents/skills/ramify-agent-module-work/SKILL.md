---
name: ramify-agent-module-work
description: Implement or repair an assignment from a native Ramify coordinator, using module context and making necessary cross-module changes. Use for Sol engineering work in an assisted plan, not for Pi review.
---

# Implement assisted plan work

Receive the intended outcome, acceptance, target project and any module focus from the coordinator. Read the project's instructions. This skill works for a focused module assignment or a broader outcome spanning several owners. RA's Pi sessions independently assess the committed result; the worker implements and verifies it with native tools.

## Orient to the outcome

Start with the owner's purpose, relevant source and tests, available ordinary/testing API views, and applicable principles or specifications. Use the installed toolkit CLI and generated views where useful. There is no assisted module-context MCP operation yet. Broaden inspection when a behavior or failure requires it; focus is not a read restriction.

Treat adopted principles as design commitments and specifications as precise behavioral requirements. Preserve document scope and status: a `.principles.md` filename alone does not establish adoption. Use the coordinator's protected baseline and project rules; do not edit a sealed commitment to make an implementation acceptable. If a change needs a protected edit, explain the concrete diff and reason to the coordinator and continue independent authorized work.

## Implement across owners when needed

Module focus concentrates understanding; it never restricts where you may write. Make understood provider, consumer, exposure, test or configuration changes needed for the outcome. Crossing a module boundary alone requires no permission, scope expansion, new task record or handback.

Consult the coordinator when design uncertainty needs a decision, another worker owns overlapping edits, or splitting/recombining work would help. Send the needed behavior, evidence, affected owners and recommended next action. Keep working on independent parts. Do not turn an ordinary question into a terminal partial submission.

Preserve behavioral contracts and Ramify importability. Verify consumer/provider behavior together where it matters; local mocks alone do not demonstrate integration. When repairing an RA finding, use its evidence and acceptance to address the cause and relevant regressions, rather than changing the requirement or merely removing the reported symptom. Run checks appropriate to the change; RA performs the iteration audit.

## Return a concise engineering result

Report the changed behavior and interfaces, checks with their outcomes, any remaining integration work or uncertainty, and protected changes needing a decision. Mention other owners touched when useful for integration; no per-edit telemetry is required. Include a commit ID if the coordinator assigned candidate preparation, otherwise identify the working changes.

Keep commits within existing authorization and coordinate shared-worktree writers. Do not start a separate RA execution or assessment for each worker; the coordinator assembles the iteration candidate and submits it. Your verification informs that submission but does not replace RA's independent gate.
