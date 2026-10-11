# Iteration 4 results: qualify the workspace and the extracted agent candidate

[Iteration brief](04-qualify-workspace.md) · [Plan](../main-plan.md) ·
[Acceptance](../acceptance.md)

**Date:** 2026-10-11. **Status:** complete (E17 pending host Docker). E18–E20 pass; the
exact clean candidate passes its full nested configured audit. E17, container
recreation, needs Docker, which this execution container lacks; its exact host
procedure is written, not executed. No fix was needed.
Nothing was pushed. `/ramify`, its worktrees and
`/home/app/ramify-plan32-candidate` were only read.

## Qualified candidate

This receipt is a documentation-only commit. It qualifies the implementation
candidate **`a6d8e02b75268b25acfa034328fb68f14b1362bb`** (tree
`b3d25fdf11da053a5b137dddbcf7c12f99b50bd1`) on `main` in
`/home/app/plan32-workspace/ramify-agent`, the iteration 3 receipt, which
includes the devcontainer and bootstrap files. Besides this file, the receipt
commit changes only the manifest status, the plan status line and the E17
host procedure added to [03-results.md](03-results.md#e17-recreation-persistence-iteration-4),
all under `docs/`, which `ramify-audit.json` lists in `ignorePaths`. No
runtime or configuration content changed after the audited commit, so no
requalification is needed.

## Migration receipt (E20)

| Item | Identity |
| --- | --- |
| Planned host path | `~/ramify-workspace/` on the Docker host, holding `ramify-agent/`, `ramify/`, `ramify-audit/`, `worktrees/`, `evidence/` ([workspace guide](../../../development/workspace.md)); not yet created, iteration 5 places it |
| Current in-container paths | Working repository `/home/app/plan32-workspace/ramify-agent`; qualification clone `/home/app/plan32-workspace/worktrees/qualify-a6d8e02b`; isolation and status witness `/home/app/plan32-workspace/witness-f`; migration archive and evidence `/ramify/.plan32-migration/` (iteration 1), this iteration's logs in `/ramify/.plan32-migration/evidence/iteration4/` |
| Mount layout | Host workspace parent bind-mounted at `/workspaces` (`../..:/workspaces:cached` from `.devcontainer/docker-compose.yml`), default folder `/workspaces/ramify-agent`; Compose-scoped named volumes at `/workspaces/ramify-agent/node_modules`, `/workspaces/ramify/node_modules`, `/workspaces/ramify/site/node_modules`, `/workspaces/ramify/examples/collection-review/node_modules`, `/workspaces/ramify-audit/node_modules`; host-state binds `~/.gitconfig`, `~/.ssh`, `~/.claude`, `~/.codex`, `~/.pi` to `/home/app/...` |
| Agent repository | `a6d8e02b75268b25acfa034328fb68f14b1362bb` (qualified); no remote yet; target `https://github.com/danmaz74/ramify-agent` (iteration 1) |
| Toolkit companion | `https://github.com/danmaz74/ramify.git` at `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5` (manifest default; witness-f checkout on `dev/workspace` at it) |
| Audit companion | `https://github.com/danmaz74/ramify-audit.git` at `43ca23e08a776df580655e945bbe4aff370e131a` (manifest default, 0.7.2 source; witness-f checkout on `dev/workspace` at it) |
| Provider pins | `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2, exact, from `https://npm.braimax.com/`; installed versions equal the pins in the qualification clone and witness-f |
| Lockfile | 595 packages; resolved origins `https://registry.npmjs.org` 478, `https://npm.braimax.com` 117; no `link`, non-HTTPS or local entry (`e18-lockfile.txt`) |
| Container image (pinned, not built here) | `node:22.23.3-bookworm`; Claude Code 2.1.289; Codex CLI 0.161.0; `@playwright/mcp` 0.0.83; Chromium from Debian bookworm, unpinned; `DISABLE_AUTOUPDATER=1`; user `app` 1000:1000 |
| Execution tools here | Node v22.23.3, npm 10.9.9, git 2.39.5, ShellCheck 0.11.0 (`npx --yes shellcheck`), `yaml` 2.9.1 from the qualification clone's dependencies |
| Audit producer | `ramify-audit` 0.7.2, the agent's own installed pin (`node_modules/.bin/ramify-audit` in the qualification clone) |
| Audit evidence | Clone `qualify-a6d8e02b`: note `refs/notes/audit` (notes commit `7b5028bcc907a07a6a70c3d3975479c34426c5e9`) on `a6d8e02b`, report commit `d661b7a0638121157501f76e737b3e94c227b61f` under `refs/audited/runs/2026-10-11T06-00-08Z-a6d8e02b7` and `refs/audited/by-tree/b3d25fdf11da053a5b137dddbcf7c12f99b50bd1`. These are the new repository's first qualification records; no old ref was copied. The three refs are preserved in `/ramify/.plan32-migration/filtered/qualification-a6d8e02b-audit.bundle` (complete bundle, 53 MB, verified; the report commit's parent is `a6d8e02b`). Text copies: `e19-audit.json`, `e19-summary.json`, `e19-audit-note.txt`, `e19-refs.txt` |

**Status after reconnect.** From `witness-f/ramify-agent`,
`bash .devcontainer/status.sh` ran twice (exit 0 both times, identical output).
Fingerprints of all three repositories, the five `.package-lock.json` inodes
and mtimes, `FETCH_HEAD`/`ORIG_HEAD` and HEAD reflog lengths were identical
before and after: no checkout, fetch, update or install occurred
(`e20-status-runs.log`, `e20-status-before.txt`, `e20-status-after.txt`). A real
reconnect to a recreated container is part of the host procedure.

## Case outcomes

Evidence paths are relative to `/ramify/.plan32-migration/evidence/iteration4/`
unless stated otherwise.

| Case | Outcome | What was executed | Evidence |
| --- | --- | --- | --- |
| E17 | **Not executed: requires host Docker.** | This container has no Docker, Compose or devcontainer CLI. The exact host procedure is the new [E17 section](03-results.md#e17-recreation-persistence-iteration-4) of the iteration 3 host witness procedure: a local branch and commit, a staged and an unstaged edit, an untracked file and a linked worktree (with its own edit and untracked file) in each of the three repositories plus an evidence artifact; fingerprints; `docker compose down` without `-v`; `devcontainer up`; fingerprint comparison; worktree list, status and a commit in each worktree seen from the main checkout; setup's existing-checkout report and unchanged `FETCH_HEAD` times showing nothing was fetched or recloned. Only the procedure's scripts were rehearsed, outside any container, in witness-f with `/workspaces` replaced by its path: placement, two equal fingerprints and the worktree commits all ran (exit 0). This checks the commands, not persistence | `e17-procedure-rehearsal.log` |
| E18 | Pass | Fresh witness-f at the candidate, companions cloned by setup; companions moved to hidden sibling names with the agent's `node_modules` kept: `npm run check:self` passes, both installed CLIs answer, default architect packages load with no read outside the checkout; no runtime link, `file:`/workspace dependency, sibling path, tsconfig path or bundler alias; companions restored byte-identical | `e18-witness-f-setup.log`, `e18-before.txt`, `e18-isolation.log`, `e18-package-load.json`, `e18-static-scan.log`, `e18-lockfile.txt`, `e18-after.txt`, `e18-compare.txt` |
| E19 | Pass | `node_modules/.bin/ramify-audit audit --cwd . --full --nested --json` in a clean clone at `a6d8e02b`: exit 0, invocation verdict pass, 1 project (`.`) ran full, discovery complete with no skipped or unavailable nested project, 6/6 checks pass, 605 s; container/bootstrap static checks retained beside it | `e19-*`, `static-checks-qualified-head.log` |
| E20 | Pass, except the container identities and reconnect pending host Docker | Receipt above; status twice without changes | `e20-*` |

### E18: runtime isolation

Witness `/home/app/plan32-workspace/witness-f`: a fresh clone of the working
repository at `a6d8e02b` as `ramify-agent/`, then `bash .devcontainer/setup.sh`
(exit 0), which cloned `ramify` at `1d8a43fc` and `ramify-audit` at `43ca23e0`
on `dev/workspace` and ran all five preparations. The companions were then
renamed to `.hidden-ramify` and `.hidden-ramify-audit`; `../ramify` and
`../ramify-audit` did not exist. With them hidden, from `witness-f/ramify-agent`:

| Command | Outcome |
| --- | --- |
| `node_modules/.bin/ramify --version` | `0.4.2`, exit 0; the link resolves to `node_modules/ramify.ts/dist/src/ramify` inside the checkout |
| `node_modules/.bin/ramify-audit help` | usage text, exit 0; the link resolves to `node_modules/ramify-audit/dist/cli.js`. `check-branch --json` (read-only) answered for `main` at `a6d8e02b` with no audit record |
| Installed providers | `node_modules/ramify.ts` 0.4.2 and `node_modules/ramify-audit` 0.7.2 are real directories, not links |
| `npm run check:self` | exit 0, 34 s: execution completed, check passed, coverage partial; 13 owners, 778 source files, 15,827 accesses; 0 errors, 0 warnings, 355 analysis limits, the same as iterations 2 and 3 |
| Default package load (iteration 2's `tool-e06-load.mjs.txt`, `loadPromptPackages` with and without the capability workflow, no model) | exit 0; `initial-architect/3` carries `skills/module-architect/SKILL.md` from a real directory; 37 files read, 0 outside the checkout; reference closure 9 files, none missing or outside; only the two pinned GitHub links are external |

Static scan of the tracked files at `a6d8e02b` (`e18-static-scan.log`): 26
configuration files (manifest, lockfile, `.npmrc`, four tsconfigs, the Vite and
two Vitest configurations, `cucumber.json`, 13 `module.ramify` files, the audit
and agent configurations; test fixtures excluded) contain no `../ramify` or
`../ramify-audit`; no `file:`, `link:`, `workspace:` or `portal:` dependency;
no npm `workspaces`; no tsconfig `paths`, `baseUrl`, `references` or
`rootDirs`; the only Vite/Vitest `resolve` setting is React `dedupe`. None of
863 tracked TypeScript and JavaScript files imports a relative path outside the
root. The lockfile's 595 packages resolve only from the two HTTPS registries,
with no `link` entry, and the installed `node_modules` has no symlinked package.
Apart from the editor workspace's `../ramify` and `../ramify-audit` folders,
the only sibling paths in tracked non-document files are the four companion
dependency-volume targets in `docker-compose.yml`; both serve the editor and
container, and give the agent nothing to resolve. Setup and the other
devcontainer scripts contain no `npm pack`, `npm link` or `file:`; packed
provider artifacts remain an opt-in procedure in AGENTS.md for a disposable
worktree.

After the run the companions were moved back. Fingerprints of all three
repositories (HEAD, branch, remotes, refs, index file and entries, staged,
unstaged, tracked and untracked content, worktrees) and of both companions'
`node_modules` listings were identical before and after (`e18-compare.txt`).

### E19: full configured audit

Clean qualification clone: `git clone --no-local` of the working repository
into `/home/app/plan32-workspace/worktrees/qualify-a6d8e02b`, on `main` at
`a6d8e02b`, `npm ci` (503 packages); `git status --porcelain` empty before and
after the audit. From its root, the one full-suite invocation of this iteration:

```sh
node_modules/.bin/ramify-audit audit --cwd . --full --nested --json
```

Started 2026-10-11T05:50:03Z; exit 0 after 605 s. stderr is empty: the test
commands never waited for the machine test lock. The audit ran in its own
temporary worktree (`/tmp/ramify-audit-worktree-*`, removed afterwards).

| Item | Result |
| --- | --- |
| Invocation verdict | `pass`; composition `pass`, not scoped, chain depth 0, 0 outstanding failures |
| Mode | requested `full`, executed `full` |
| Projects | one, `.`: verdict pass, executed. `ramify-audit.json` is the repository's only tracked audit definition; `--nested` discovery `complete` with no skipped and no unavailable definition, so no regression project is excluded |
| Coverage | universe of 6 checks and 6 test units, all selected, none omitted; configuration blob `066e7592…` from `a6d8e02b`; ownership answer from Ramify 0.4.2 (13 modules, 19 exclusions); expected Vitest files 343, run 343, none missing |
| `patch-integrity` | pass, 0.004 s |
| `agent-typecheck` | pass, 9.8 s (four compiler projects) |
| `agent-tests` | pass, 553.8 s: files 342 passed, 0 failed, 1 skipped; tests 3,058 passed, 0 failed, 2 skipped; no load or unhandled errors |
| `agent-scenarios` | pass, 0.6 s: 0 scenarios, 0 steps |
| `agent-structure` | pass, 21.9 s: 13 owners, 778 source files, 15,827 accesses; 0 errors, 0 warnings, 355 analysis limits |
| `agent-web-build` | pass, 1.0 s; Vite's chunk-size warning only |
| Failure ledger | complete; no entries; both test commands ended `passed` with exit 0 and no carried files not run |

Explicit skips and unrun work, all pre-existing and unchanged by the migration:

- The skipped file is `subs/harness/src/tests/fixture-trials.test.ts` in the
  `boundaries` project, the opt-in live fixture trials that run only with
  `RAMIFY_AGENT_TRIAL` set; its two tests are the two skipped tests.
- `agent-scenarios` selects no scenario: `cucumber.json` reads
  `src/tests/features/`, `subs/*/src/tests/features/` and
  `subs/*/subs/*/src/tests/features/`, and no tracked `.feature` file is there
  (the seven tracked feature files are fixtures and golden inputs).
- `agent-structure` reports coverage `partial` through its 355 analysis limits,
  which are coverage notes, not findings.

Comparison with the toolkit era: the last agent audit in the archive,
`refs/notes/audit-projects/ramify-agent-f25e9a298228` on `5a3aa6c9` (an ancestor
of the source commit `1d8a43fc`, read-only in `/ramify`), was a full pass in
586 s with the same check outcomes and the same counts (342/1 files,
3,058/2 tests, 0 scenarios, 343 expected files). That record stays in the
archive and qualifies nothing here; the new record above is the extracted
candidate's own. No test failed, so no rerun or flake record was needed.

Focused affected tests ran in iteration 2 (`e09-focused-tests.log`, 7 files,
165 tests) and are included in this complete run.

### Container and bootstrap checks beside the audit

`ramify-audit.json` runs the project's checks (patch integrity, type checks,
the complete Vitest configuration, scenarios, the batch structural check and
the web build); it does not run ShellCheck or parse the devcontainer
configuration, and this iteration did not change its checks or project
selection. The devcontainer and bootstrap checks are a separate, documented manual
step, run against the same clean candidate with their logs retained.
`<evidence>` is `/ramify/.plan32-migration/evidence` until iteration 5 moves
it to the workspace's `evidence/`:

```sh
# from a clean agent checkout named ramify-agent, at the candidate commit
for f in .devcontainer/*.sh; do bash -n "$f"; done
(cd .devcontainer && npx --yes shellcheck -x *.sh)
cp <evidence>/iteration3/tool-check-config.mjs.txt /tmp/check-config.mjs
node /tmp/check-config.mjs . "$PWD/node_modules/yaml"                     # 40 assertions
```

The checker needs that directory name because it maps `lib.sh`'s absolute
paths to `/workspaces`.

Results at the qualified candidate (`static-checks-qualified-head.log`): `bash
-n` clean for `lib.sh`, `post-start.sh`, `setup.sh` and `status.sh`; ShellCheck
0.11.0 with `-x` reports nothing; the configuration check passes 40/40 on the
clean working repository at `a6d8e02b`, whose tree equals the qualification
clone's. In the clone itself it reports 39/40, failing only the volume
comparison, because the clone's directory name is `qualify-a6d8e02b` and the
tool's path mapping no longer reaches `/workspaces/ramify-agent`; the log shows
that `lib.sh` still lists the same five relative directories. The companion
manifest, `package.json`, `ramify-audit.json`, `ramify-agent.json` and
`cucumber.json` parse as JSON (the tsconfig files are JSONC and are parsed by
the audit's type check). A secret-pattern scan of `.devcontainer/` and
`development.code-workspace` matches only the Dockerfile's sudoers `NOPASSWD`
line. `.devcontainer/`, `development.code-workspace` and `.gitignore` are
unchanged since `9ab60709`, the commit iteration 3 checked.

Container behavior itself (E10, E15 and parts of E13, E14, E16 from
iteration 3, and E17 here) is retained as the host witness procedure, whose
logs go to `$H/evidence/` and then to the migration evidence.

## Limits and decisions for the orchestrator

- **E17 is unexecuted.** It needs a Docker host; run the
  [E17 section](03-results.md#e17-recreation-persistence-iteration-4) with
  the rest of the iteration 3 host procedure and copy its `e17-*` logs to the
  migration evidence. Until then the plan's "container recreation" exit
  criterion and the container-dependent parts of E20 (real reconnect, built
  image versions) are open, as are iteration 3's E10, E15 and the container
  parts of E13, E14 and E16.
- **Handoff to iteration 5:** publishable candidate `a6d8e02b` plus this
  receipt-only commit, which changes only `docs/` and so leaves the audit
  reusable under `ignorePaths`. Target remote
  `https://github.com/danmaz74/ramify-agent` (iteration 1), provider pins
  `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2, companion defaults `1d8a43fc` and
  `43ca23e0`. The qualification records are in the clone
  `qualify-a6d8e02b` and in `filtered/qualification-a6d8e02b-audit.bundle`,
  not in the working repository or `extracted-main.bundle`. Iteration 5 should
  fetch `refs/notes/audit` and `refs/audited/*` from either into the
  repository it publishes, where an audit of the receipt commit reuses it
  under `ignorePaths`, or rerun the audit there.
- **Decision: devcontainer checks as an audit check or script.** They are
  retained as a documented manual step with logs, not as a committed command,
  because the checker lives in the migration evidence and needs a transitive
  `yaml` package and an `npx` ShellCheck download. Committing a
  `check:devcontainer` script, or adding a check to `ramify-audit.json`, would
  change the candidate's configuration and require a new full qualification.
- The configuration checker assumes the checkout directory is named
  `ramify-agent`; run it from such a checkout or adapt its path mapping.
- The new record's agent-scenarios check runs 0 scenarios, as before the
  extraction. Whether that check should select any committed scenario is a
  project question, not a migration one.
- Witness `witness-f` (1.9 GB) now holds the E17 rehearsal state: branches
  `witness/e17-*`, edits, untracked files and a linked worktree per repository
  under `witness-f/worktrees/`. It and the qualification clone remain in the container's writable layer and are
  disposable. Witnesses `witness-a`, `c`, `d` and `e` from iteration 3 are untouched.
