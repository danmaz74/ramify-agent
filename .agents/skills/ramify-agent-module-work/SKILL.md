---
name: ramify-agent-module-work
description: Implement or repair an assignment from a native Ramify coordinator, using module context and making necessary cross-module changes. Use for Sol engineering work in an assisted plan, not for Pi review.
---

# Implement assisted plan work

Receive the intended outcome, acceptance, target project and any module focus from the coordinator. Read the project's instructions. This skill works for a focused module assignment or a broader outcome spanning several owners. RA's Pi sessions independently assess the committed result; the worker implements and verifies it with native tools.

## Working directory

For a module-focused assignment, use `<target-worktree>/<module-path>/src` as your default working directory. Retain the absolute project root and module root from the brief. Verify the directory with `pwd` before working. If the host cannot set a session-wide CWD, explicitly set each shell tool's working directory to that `src/` directory and resolve file-tool paths against it. A `cd` in one shell call does not establish the next call's directory or change a separate editing tool's path base.

Use an explicit project-root working directory for project-wide commands; in ramify-agent, npm checks run from the repository root. Use explicit paths or another working directory when inspecting or editing another owner. Broader assignments use the project root unless a useful common starting directory is given. If the focused module has no `src/`, use its module root and report that fact; create source directories only when the implementation needs them.

## Ramify module layout

Paths below are relative to a module root:

```text
module.ramify          module declaration and exposures
README.md              module purpose and documentation, when present
src/                   this owner's implementation; focused worker CWD
  interfaces/          optional same-owner contract files
  tests/               same-owner tests, with a separate API view
    .ramify/           generated APIs available to testing source
  .ramify/             generated APIs available to ordinary source
subs/                  child modules, each with its own layout
```

`subs/` is beside `src/`, so a search from your working directory stays in the owner's source rather than descending into child implementations. From `src/`, the module definition is `../module.ramify` and children are beneath `../subs/`.

`module.ramify` declares the module and what it exposes to its parent or descendants. `expose-src` selects owned exports relative to `src/`; `expose-test` selects exports relative to `src/tests/`; `expose-sub` re-exposes symbols received from a direct child. TypeScript exports alone do not establish cross-module availability. See the [module layout and declaration specification](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/model/module-description.spec.md) when changing declarations.

From your `src/` CWD, search `.ramify/` for ordinary cross-module APIs, or `tests/.ramify/` for testing APIs. Each view is self-contained: `children/` contains APIs owned by descendants; `external/` contains those owned elsewhere in the project, not npm packages. Pass these hidden paths explicitly to `rg`, for example `rg -n -i -C 4 'parser' .ramify/`. Read `_meta.json` for revision and coverage limits. Search the testing view separately; do not use test-only availability in production code.

These catalogs are generated documentation, never source to edit or import. Import the actual defining source using the project's resolution conventions. If a view is absent or stale, refresh with the installed toolkit from the project root: `node_modules/.bin/ramify materialize --view api --from <module-path>/src`. Failed refreshes and incomplete coverage remain limitations, not proof that an API is absent. For details, read the [API-view specification](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/architecture/materialized-api-view.spec.md). Project-wide discovery uses `.ramify-architect/` at the project root; it does not establish requester-specific importability.

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
