# ramify-agent instructions

These instructions apply to Claude and Codex work in this repository.
[CLAUDE.md](CLAUDE.md) points here. They are complete: no instructions are
inherited from a containing repository or a companion checkout.

ramify-agent is an independent project that consumes the Ramify toolkit
([ramify.ts](https://github.com/danmaz74/ramify)) and
[ramify-audit](https://github.com/danmaz74/ramify-audit). It lived in the
toolkit repository's `ramify-agent/` directory until Plan 32 extracted it.

## Dependency direction

- ramify-agent depends on ramify.ts. ramify.ts never depends on ramify-agent:
  the toolkit never imports from it, names its roles or reads its files.
- Use the toolkit only through its package surface (`ramify.ts/<entry>`), its
  CLI (`node_modules/.bin/ramify`) and the files it generates. Never import
  toolkit source by relative path or through tsconfig `paths`.
- Prefer the CLI and generated files over library imports. The harness and
  every other Node owner import the library for types and schemas only. The
  web module may also render a presentation component the toolkit exports
  through a package entry; it never copies or re-implements one. Such a
  component shares the web module's single React runtime.
- The toolkit is an ordinary library dependency: `ramify.ts` is pinned to an
  exact release from the registry `.npmrc` names, as is `ramify-audit`. A
  toolkit change reaches ramify-agent only through a pin bump, never through
  a nearby checkout. Do not add npm workspaces, `npm link`, `file:`
  dependencies or compiler aliases to companion checkouts.
- The [module-architect skill](skills/module-architect/SKILL.md) is a
  documented snapshot of the toolkit's skill; its
  [provenance](skills/module-architect/PROVENANCE.md) names the upstream
  commit and how to update it.

## Inside the project

- Self-contained package: own `package.json`, lockfile, `tsconfig.json` and
  Vitest configuration. Run npm commands from the repository root.
- ESM with `.js` extensions in source imports and strict TypeScript. Tests go
  in the owner's `src/tests/`.
- The project is a Ramify project. `npm run check:self` must pass. The harness
  is the only writer of durable state and owns the public contracts of the
  behavior it implements; the web module projects files and forwards commands,
  and receives only those contracts.
- Its audit checks live in committed `ramify-audit.json`. From a clean
  committed checkout, run `node_modules/.bin/ramify-audit audit --cwd . --json`;
  add `--full --nested` for qualification. The CLI reads the configuration
  from the audited commit and publishes evidence under this repository's refs.
- `.ramify-architect/` and every `src/.ramify/` are generated, gitignored
  views. Never edit or import them; refresh them with
  `node_modules/.bin/ramify materialize --view architect`.
- The toolkit's roadmap, plans and cucumber-viz workflow do not govern this
  project. Its own plans live under `docs/plans/`.
- `docs/.superseded/` holds replaced designs kept for comparison. Never read,
  search or cite it unless the user names it. Current design starts at
  [docs/README.md](docs/README.md).

## Writing conventions

These apply to every document, page and comment, including agent-written
results. They were carried from the toolkit's instructions at
`1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`:

- A module exposes a symbol to its parent or to its descendants, and the other
  side receives it. Never say grant or route; an ancestor re-exposes what it
  received.
- Up and down describe motion in a picture, never a channel. Descendants are
  the target of exposure; the subtree is the region.
- Say a module's internals, not its inside. Use inside only as a preposition
  or in the inside/outside contrast.
- Say enforced, verified or a rule. Never say checked fact or coin similar
  terms.
- Use behavioral terms for what Ramify derives, and capability for what an
  agent ascribes (see the skill's [glossary](skills/module-architect/guidance/glossary.md)).
- Glossary entries are definitions: one term, one crisp definition. Rationale
  belongs in the principles document.
- Assume common computer-science concepts such as trees, roots and siblings;
  state only what Ramify does with them.
- `.principles.md` files state short, durable commitments. `.spec.md` files
  define precise model or behavioral contracts, including rules, exceptions,
  formats and outcomes. Glossaries define terms; plans describe implementation
  and migration. Document kind does not establish approval or implementation.
- Principle statements stay short. Other documents reference principles
  documents, never the reverse; fold a new principle into the document where
  it belongs rather than adding a file.
- Link this repository's files relatively. Link toolkit documents as absolute
  GitHub URLs pinned to a commit. Historical results, receipts and analyses
  keep their original commands, paths and hashes; see
  [docs/README.md](docs/README.md#historical-links).

## Development

- The devcontainer mounts the workspace parent at `/workspaces`, beside
  independent `ramify` and `ramify-audit` checkouts that setup clones when
  absent. Rerun `bash .devcontainer/setup.sh` after a lockfile changes;
  `bash .devcontainer/status.sh` reports each repository and the installed
  provider pins. See [the development workspace](docs/development/workspace.md).
- Prepare a checkout with `npm ci` at its root. `.npmrc` names the registry
  that serves the pinned releases. Check `node_modules/.bin/ramify --version`
  against the `ramify.ts` pin.
- Create a worktree for a branch beside the repository, for example
  `git worktree add ../worktrees/<name> -b <branch>`, and run `npm ci` in it.
  Never share or link another checkout's `node_modules`.
- A change the harness needs from Ramify or ramify-audit is made in that
  project's own checkout: implement and qualify it there, release it through
  that project's workflow, then bump the exact pin here
  (`npm install --save-exact ramify.ts@<version>`), commit the manifest and
  lockfile, and qualify this project. A pre-release experiment may install a
  packed provider artifact (`npm pack`) only in a disposable worktree of this
  project; record the provider commit, tarball hash and consumer base, and
  never commit it.

## Test boundaries

Follow [Testing ramify-agent](docs/testing.spec.md). Ordinary tests must script
external Git, CLI, audit and command answers; the configured runner refuses all
process launches automatically. Actual tool/kernel claims require an exact
reviewed entry in `src/tests/test-boundaries.json`. Full audits retain every
configured project.

## Plans for harness execution

Use [ramify-agent-plan](.claude/skills/ramify-agent-plan/SKILL.md) to write,
review or convert a plan that ramify-agent will execute on a target project.
It defines outcomes, constraints and acceptance; the harness's architects
derive the execution breakdown. This is separate from authoring roadmap plans
with prescribed iterations. The shared Claude skill is linked from
`.agents/skills/` for Codex.

## Real-plan dogfooding

Use [ramify-agent-dogfooding](.claude/skills/ramify-agent-dogfooding/SKILL.md)
when a Claude Code or Codex agent applies a real plan with the harness and
improves it as problems surface. The shared skill lives in `.claude/skills/`
and is linked from `.agents/skills/` for Codex. When the target project is
elsewhere, load this skill from the harness checkout; the target project's
own instructions still govern its worktree and implementation.
