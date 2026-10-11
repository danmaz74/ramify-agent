# Iteration 2 results: make the agent project self-contained

[Iteration brief](02-standalone-project.md) · [Plan](../main-plan.md) ·
[Acceptance](../acceptance.md)

**Date:** 2026-10-11. **Status:** complete; E05–E09 pass with the limits below.
Nothing was pushed. `/ramify`, its worktrees and the candidate worktree
`/home/app/ramify-plan32-candidate` were only read.

## Identities

| Item | Identity |
| --- | --- |
| Starting point | `ab0cfae62454946994fc27e871d93c8c0a3e8077` on `main` in `/home/app/plan32-workspace/ramify-agent` (iteration 1 receipt) |
| Skill and ignore commit | `3d845213446b4e179fc0608e8042af7eeefd215f` build(agent): carry the module-architect skill and complete ignore rules |
| Instructions and documents commit | `fbbcf694a8cd1a8585d5f4b3af6b8c0934ceefa4` docs(agent): state instructions and commands for the standalone repository |
| Verified checkout | Fresh clone of `fbbcf694` at `/home/app/plan32-workspace/worktrees/e05-fresh`; no parent repository, no `package.json`, `module.ramify` or `node_modules` above it, and no companion checkout |
| Tools | Node v22.23.3, npm 10.9.9, git 2.39.5 |
| Provider pins | `ramify.ts` 0.4.2 (`sha512-AQ/OX/4U4LRRzO11r8M7umPG0EhEZ8MMNGR0df32G17Fbj+FHQb/nNECjIT5tmTrMy95juiTe+Em10Nr8OFlgg==`) and `ramify-audit` 0.7.2 (`sha512-pHIKSEIeYOD1Lwz045wx2x1cu1pl6YwCTY9sZWV9tGSt2H8sOJ/HV+ezYmcUakh1POi+4FvPxyb09fuGbNnrug==`), both resolved from `https://npm.braimax.com/`; unchanged |

This receipt is a later documentation-only commit. Between `ab0cfae6` and
`fbbcf694` no file changed under `src/`, `subs/` or `scripts/`, nor `package.json`,
`package-lock.json`, `.npmrc`, `tsconfig.json`, `vitest.config.ts`,
`vitest.stress.config.ts`, `cucumber.json`, `module.ramify`,
`ramify-audit.json` or `ramify-agent.json`.

## Changes

- **Ignore rules.** `.gitignore` now covers dependencies (`node_modules` at any
  depth, including symlinks), `dist/`, `**/src/tmp/`, `.history/`,
  `.playwright-mcp/`, `.claude/settings.local.json` and the toolkit's
  generated-view family copied exactly, with its comment: `.ramify/`,
  `.ramify.tmp-*/`, `.ramify.old-*/`, `.ramify-architect/`,
  `.ramify-architect.tmp-*/`, `.ramify-architect.old-*/` and the four marker
  forms. In real agent checkouts under `/ramify`, the parent rules that matched
  agent paths were `node_modules`, `.ramify/` and `.ramify-architect/`; `dist/`
  and `**/src/tmp/` were already local, and run records under
  `plans/<plan>/.harness/` are ignored by the `.gitignore` the harness writes
  there. Toolkit-only rules (`site/`, `.reference-work/`, `.cucumber-viz/`,
  `cucumber-viz.config.local.json`, `*.viz.feature.meta/`,
  `.devcontainer/.env`) were not carried.
- **Skill snapshot.** The `skills/module-architect` symlink is replaced by real
  files; see [Skill provenance](#skill-provenance).
- **Instructions.** [AGENTS.md](../../../../AGENTS.md) no longer relies on the
  toolkit's `CLAUDE.md`: it carries the writing conventions, the generated-view
  rule and a Development section with `npm ci` preparation, worktrees under
  `../worktrees/<name>`, and the provider workflow (implement, qualify and
  release the provider, then bump the exact pin and qualify this project;
  packed artifacts only in a disposable worktree with provider commit, tarball
  hash and consumer base recorded). [CLAUDE.md](../../../../CLAUDE.md) points
  to AGENTS.md only.
- **Commands.** README, `docs/testing.spec.md` and the active Plans 27, 29, 30
  and 31 run from the repository root, with
  `node_modules/.bin/ramify-audit audit --cwd . --full --nested --json` for
  qualification. The README's `trial` description now matches
  `scripts/live-trial.ts`, which copies the fixture rather than cloning the toolkit.
- **Links.** 35 relative links in active documents that left the root now
  point to the toolkit at `https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/...`
  (each target verified to exist at that commit). A new
  [Historical links](../../../README.md#historical-links) section states how
  historical documents' original relative links and commands resolve.

No runtime path needed a fix. `defaultSkillDirectory` resolves
`skills/module-architect` from `packages.ts`, and `ramifyExecutable` resolves
`node_modules/.bin/ramify` from `ramify-cli.ts`; both stay inside the root. A
scan of every tracked source, script, configuration and feature file found two
relative literals that leave the root. Both are deliberate test inputs:
`../../../../../../../etc/passwd` is an escaping symlink in
`subs/harness/src/tests/helpers/reviews.ts`, and
`../../../../../package.json` is a refused traversal in
`session-queries.test.ts`.

## Skill provenance

`skills/module-architect/` is a snapshot from
<https://github.com/danmaz74/ramify> at `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`
(the iteration 1 source commit), recorded in
[PROVENANCE.md](../../../../skills/module-architect/PROVENANCE.md) with the
upstream path and blob of each file.

| Carried | From | State |
| --- | --- | --- |
| `SKILL.md`, `report.md`, `references/{access,discovery,placement,refactoring}.md` | `.claude/skills/module-architect/` | byte-identical (`SKILL.md` blob `bbf76e01`) |
| `references/cognitive-decomposition.md` | same | one link: `../../../../docs/agents/module-architect.principles.md#contracts-follow-responsibility` became `../guidance/module-architect.principles.md#...` |
| `guidance/module-architect.principles.md`, `guidance/glossary.md` | `docs/agents/` | links to the importability principles and dependency glossary became pinned GitHub URLs |
| `LICENSE` | toolkit root `LICENSE` | MIT notice, byte-identical |

The only toolkit reference the skill required was the principles link; under
the old layout it resolved to `/ramify/docs/agents/` and in the extracted root
it would have escaped the repository. Because `SKILL.md` is unchanged, the
architect packages still record `skills/module-architect/SKILL.md` with the same
source text.

## Verification

All commands ran in the fresh clone. Logs are in
`/ramify/.plan32-migration/evidence/iteration2/`; the helper scripts are kept
there as `tool-*.txt`.

| Command | Outcome | Evidence |
| --- | --- | --- |
| `npm ci --userconfig /dev/null --cache <empty directory> --no-audit --no-fund` | exit 0; 503 packages; registry `https://npm.braimax.com/` and `legacy-peer-deps=true` from the project `.npmrc` only, so no user configuration, token or warm cache was used; `git status` clean afterwards | `e05-npm-ci.log`, `e05-pins.txt` |
| `node_modules/.bin/ramify --version` | `0.4.2`; the binary resolves to `node_modules/ramify.ts/dist/src/ramify`; the harness's `ramifyExecutable` resolves to the same file and `ramifyVersion()` answers `0.4.2` | `e05-pins.txt`, `e05-ramify-cli-resolution.txt` |
| Package versions | `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2 in manifest, lockfile and installed package | `e05-pins.txt` |
| Default package load (tsx, `loadPromptPackages` with and without the capability workflow, no model) | exit 0; `initial-architect/3` and `global-fork/4` embed `skills/module-architect/SKILL.md` (3,470 characters after adaptation); the skill directory is a real directory; 37 files read, 0 outside the clone; the reference closure from the adapted skill is 9 files, all present inside the clone; its only external links are the two pinned GitHub URLs | `e06-package-load.json` |
| `git check-ignore -v` on 43 representative paths | 21 generated, dependency, build, scratch and tool paths ignored by the expected rule; 21 near misses and authored files tracked (`.ramify-other`, `.ramify-architects`, `.ramify.tmp`, `.ramify-architect.tmp`, unsuffixed markers, `src/ramify`, `distribution`, carried skill files, `.claude/skills`, `.claude/settings.json`, `.agents/skills`, plans, `.npmrc`, lockfile); a run path under `plans/<plan>/.harness/` is ignored once the harness writes its state `.gitignore` (verified with the harness's own `stateGitignore`); 0 tracked files match an ignore rule; no credential-like file is tracked | `e07-check-ignore.tsv`, `e07-check-ignore-notes.txt` |
| Active-document links (87 Markdown files: instructions, README files, specifications, principles, glossaries, architecture, metrics, skills, Plans 27, 29, 30 main plan, 31 and 32) | every relative link resolves; one pre-existing absolute `/tmp/...` trial link remains | `e08-active-docs.txt`, `e08-active-links.txt` |
| `npm run test:quick --` 7 files: `plan23-task-prompts`, `analysis-submission`, `engineer-briefing`, `steps-authored`, `plan25-task-packets`, `ramify-cli`, `scripted-cli` | exit 0; 7 files, 165 tests passed, none skipped | `e09-focused-tests.log` |
| `npm run type-check` | exit 0 (all four compiler projects) | `e09-type-check.log` |
| `npm run check:self` | exit 0; execution completed, check passed, coverage partial; 13 owners, 778 source files, 15,827 accesses; 0 errors, 0 warnings, 355 analysis limits | `e09-check-self.log` |
| `npm run build:web` | exit 0; Vite's chunk-size warning only; output ignored | `e09-build-web.log` |
| `node_modules/.bin/vitest list --filesOnly --json` | 343 files: node 271, boundaries 53, web 19; discovery only, nothing executed | `e09-vitest-discovery.json` |

## Acceptance outcomes

| Case | Outcome |
| --- | --- |
| E05 | Pass. The fresh clone installs from its own manifest, lockfile and `.npmrc`. Ramify resolves to its installed package, and both provider versions equal the pins. |
| E06 | Pass. The skill is real files with upstream notice and provenance. The existing constructor loads it and its complete local reference closure from the clone, with no read outside it and no model call. |
| E07 | Pass. See the check-ignore table. |
| E08 | Pass. Active instructions, testing instructions and current plan commands use the standalone root, and active local links resolve. Historical evidence keeps its original commands, paths, hashes and links. |
| E09 | Pass. Focused tests, type checks, structural check and web build pass with the module tree, exposure rules, scripts and complete regression selection unchanged. |

## Failures and pre-existing conditions

No command failed, so no failure was induced by the migration.

Pre-existing conditions, recorded and not changed:

- `check:self` reports 355 analysis limits (`signature-inferred`,
  `shared-global` and others) with partial coverage. These are coverage notes,
  not findings. Plan 33 recorded 344 on its earlier source.
- The Vite build warns that some chunks exceed 500 kB.
- `docs/architecture/fresh-capability-architect.hypothesis.md` links an absolute
  `/tmp/ramify-capability-cooperation-20260927/...` trial document.
- Historical documents contain 298 unresolved relative links outside
  `docs/.superseded/`. 262 were already unresolved in the toolkit layout,
  including 81 in Plan 16, 80 in the status-badge postmortem directory and 17
  in Plan 35. The remaining 36, in analyses, completed plans, a review and spikes,
  resolved to toolkit files only under the old layout. They resolve by the
  rule in [Historical links](../../../README.md#historical-links)
  (`e08-link-comparison.txt`).

## Limits and decisions for the orchestrator

- `plans/31-operator-driver/plan.md` keeps its old containing-repository audit
  command (line 232). It is the harness input of Plan 31's pending run, which
  continues in the old repository. Editing this copy would make it differ from
  the plan that run captured. Decide whether to update it when Plan 31 is
  handed off.
- Historical analyses, results, receipts and completed plans keep their
  relative toolkit links instead of rewritten URLs. Rewriting them would change
  historical documents; if wanted, the rewrite helper can convert them
  mechanically to pinned URLs.
- `.devcontainer/.env` is not ignored yet; iteration 3 adds the devcontainer and
  should decide on host-specific configuration files.
- The `ramify-audit` repository link in AGENTS.md points to a repository that
  is private to unauthenticated readers.
- `npm.braimax.com` served both pinned releases and every other dependency
  without credentials. The user's `~/.npmrc` holds a token for that registry
  that this install did not need. Iteration 3 should still document it as
  optional host state, not image content.
- The skill snapshot is fixed at `1d8a43fc`. Later toolkit skill changes reach
  this project only by the update procedure in PROVENANCE.md.
- The fresh clone keeps its `node_modules` and `dist/`, and the empty-cache
  install left `/home/app/plan32-workspace/worktrees/.npm-cache-e05` (90 MB).
  Both are in the container's writable layer, as are the working repository
  and the clone. The committed repository is preserved in
  `/ramify/.plan32-migration/filtered/extracted-main.bundle`.
- The full configured audit was not run; iteration 4 owns it.
