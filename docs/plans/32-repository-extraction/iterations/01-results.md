# Iteration 1 results: preserve work and extract history

[Iteration brief](01-preserve-and-extract.md) · [Plan](../main-plan.md) ·
[Acceptance](../acceptance.md)

**Date:** 2026-10-11. **Status:** complete; E01–E04 pass with the limits below.
Nothing was pushed. The user's checkout and every existing worktree kept their
files, index and HEAD.

## Identities

| Item | Identity |
| --- | --- |
| Source repository | `/ramify`, branch `ramify-agent` at `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`, equal to `origin/ramify-agent` and to `refs/heads/ramify-agent` on `https://github.com/danmaz74/ramify.git` |
| Extraction candidate | `/ramify` branch `plan32/extraction-candidate` at `c2c42fe4ca6ae26d1c002f39dbb275d123a5638c`, worktree `/home/app/ramify-plan32-candidate` |
| Candidate agent subtree | tree `368a662ad46ce51a9f35c893332030589d6c25fd` |
| Extracted root before this receipt | `65140383354c75392b7c9fa8758cbd7493f30ab5` on `main` in `/home/app/plan32-workspace/ramify-agent`, tree `368a662ad46ce51a9f35c893332030589d6c25fd` |
| Tools | git 2.39.5; Python 3.11.2; git-filter-repo from `newren/git-filter-repo` `main` at `d7b75aca907380f608892cc289e616f195427b99` (2026-07-09; `--version` prints `31ebad4c8fb3`; script sha256 `39d35fb2c35637a9d555353b6a8b53a223a227d3beb61a0ac7e1180bfa5572f1`), requires git ≥ 2.36 |

Candidate commits above `1d8a43fc`, with their extracted equivalents:

| Original | Extracted | Content |
| --- | --- | --- |
| `baf0a85c31d2ca66495674f143e5d3039142d336` | `ff43123942c0f5821f792471688dd892b07ec7b6` | Merge of `feat/plan34-breakpoints-implementation` at `b20776b8` (20-minute debugger wait default and Plan 34 state record) |
| `d11ae586298d606c5d77e41584a66d089d136201` | `c22c951716858f2e3c485aed014d76ec3e210a84` | All 164 untracked agent paths from `/ramify`: plans 15, 27, 28, 29, 32; untracked `docs/analysis` documents and their analysis data; `docs/spikes/pi-cache-reuse`; skills `ramify-agent-plan`, `ramify-agent-postmortem`; three `.agents/skills` links |
| `ca9a4e56fecadc8e82aa1ae47636a2984c013bae` | `db6e1be2ee04a1acf9dbab48e40b83ff432d8567` | Working-tree diffs of `AGENTS.md`, `docs/README.md`, the 2026-09-26 contract-engineer replay analysis, the Plan 17 main plan |
| `c2c42fe4ca6ae26d1c002f39dbb275d123a5638c` | `65140383354c75392b7c9fa8758cbd7493f30ab5` | Working-tree diffs of the Pi adapter: preservation accepts `openai-codex` models on `openai-codex-responses` |

Every diff applied without conflicts; each resulting file equals the `/ramify`
working file byte for byte. The 12 relative links the documentation diffs add
resolve, including those to `.claude/skills/ramify-agent-dogfooding` and
Plans 32–34. With dependencies installed by `npm ci` in the candidate's
`ramify-agent/` (outside `/ramify`), `tsc --noEmit` passes and four focused
Pi test files pass (91 tests).

## Carried content and exclusions

Nothing in the untracked agent set was excluded. A secret-pattern scan found
no tokens or keys. The analysis data directories are referenced by their
postmortem documents as reproducible artifacts, following the tracked
`2026-09-26-contract-engineer-replay/` precedent. `docs` is `owned-unwired`,
so the spike's `.ts` file is not analyzed.

Not carried:

| Path | Reason |
| --- | --- |
| `/ramify/.claude/settings.local.json` | Toolkit-level local configuration, not agent content. |
| `/ramify/.devcontainer/codex-mcp-setup.sh` (modified) | Toolkit dirty work; recorded and archived with the `/ramify` dirty files. |
| Untracked Plan 35 directory and modified `docs/README.md` in `/home/app/ramify-plan34-breakpoints-implementation` | Stale duplicate. Five files equal the proposal commit `b4fe248a`. `main-plan.md` differs only in its source line (`b20776b8` on `feat/plan34-breakpoints-implementation` instead of `b6fe1e4b` on `ramify-agent`). The README edit re-adds the Plan 35 entry as proposed; the candidate already lists the implemented plan. Archived with that worktree's dirty files. |

## Preservation archive

All paths below are under the persistent bind mount, in
`/ramify/.plan32-migration/`. That directory is excluded only through
`/ramify/.git/info/exclude`. Ramify discovery walks hidden directories and
reports stray descriptions and package manifests. The archive therefore holds
only bundles, a bare repository, tarballs and text files: 230 files, none of
them a `module.ramify`, `package.json`, `tsconfig.json` or compiler source.
Total size is 11 GB.

| Path | Content |
| --- | --- |
| `archive/ramify-all.bundle` (204 MB) | `git bundle --all` of `/ramify`: all 877 refs, including `refs/notes/audit` (222 entries), both `refs/notes/audit-projects/*`, `refs/audited/*`, `refs/stash` and worktree HEADs |
| `archive/ramify-stash-reflog.bundle` (193 MB) | Reflog-only `stash@{0..5}` as `refs/archive/stash/0..5`, built in a scratch repository; no ref was created in `/ramify` |
| `archive/ramify-audit/` | `ramify-audit-all.bundle` (99 refs), remotes, refs, worktree list and per-worktree HEAD/status of `/home/app/ramify-audit` (`/ramify-audit` is a symlink to it) and its six linked worktrees. No dirty files and no stashes. |
| `archive/worktrees/` | For `/ramify` and each dirty linked worktree (plan34-execution-breakpoints, plan34-breakpoints-implementation, plan35-debugger-ui, plan23-final-gate-repair, plan23-14-observation-batch, `/tmp/plan21-iteration0-actual-agent`): tarball of existing modified/untracked paths, staged and unstaged binary patches, status, HEAD and a sha256 manifest |
| `archive/evidence/` (9.9 GB) | 25 gzip tarballs; `archive-evidence.log` names each base directory, its paths and size. Contents: ignored harness run state (`.harness`) from the Plan 31, Plan 34 real-project-option and real-target worktrees; `/home/app` evidence directories (trial, self-run, Plans 23/25/33, pi-cache, affected, project-boundary `ramify-pb1-evidence` and `ramify-audit-pb-evidence`, merge preservation, slow-tests); loose `/home/app` receipts and logs; `pb3-it*-scratch`; `/home/app/.codex/memories`; `/tmp/claude-1000` session scratchpads (including the Plan 31 observations); `/tmp/plan23-native-*` runs; loose `/tmp` logs and JSON |
| `archive/inventory/` | Before/after inventories: worktree list (85 before), per-worktree path/branch/HEAD/git dir/status, all refs, `/ramify` HEAD/index/dirty-file fingerprints, active jobs, stash reflog, other Git repositories under `/tmp` and `/home/app`, ignored evidence sizes, branch analysis and dispositions |
| `filtered/all-refs.git` | Disposable filtered mirror: 165 translated branches, including every pending agent branch, plus translated `refs/stash` and `refs/plan20/final-audit`; `refs/notes/*`, `refs/audited/*` and the untranslated `refs/codex/*` deleted |
| `filtered/maps/` | filter-repo `commit-map` (1,937 entries), `ref-map`, `changed-refs`, `first-changed-commits`, `suboptimal-issues`, log, pre/post-filter ref lists |
| `filtered/extracted-main.bundle` | The extracted repository's `main`, including this receipt |
| `evidence/` | Focused verification logs, authorship, sampled commit identities, remote checks, restore test, gzip integrity, unchanged check |
| `tools/` | `git-filter-repo` and the inventory, fingerprint, dirty-archive and evidence-archive scripts |

Not archived, by design: every `node_modules`; the toolkit's regenerable
`.reference-work/` copies in toolkit worktrees (about 4.4 GB); `/ramify/.cucumber-viz`
and other `/ramify` ignored state, which is already on the persistent mount;
`/tmp/tsx-1000`; disposable test fixtures (`/tmp/ramify-agent-*` and similar);
the installed `/home/app/tools/ramify-audit-0.7.0`. Linked-worktree source is
recoverable from the bundle at the recorded HEADs plus its dirty-file archive.
Every detached worktree HEAD is reachable from a ref.

No harness, Vitest or tsx job was running. The recorded `background.pid`,
`plan34-background-resume-failure.pid` and `codex-plan23.pid` processes had
exited. No process was stopped.

### Restore commands

```sh
M=/ramify/.plan32-migration
git init --bare ramify.git && git -C ramify.git fetch $M/archive/ramify-all.bundle 'refs/*:refs/*'
git -C ramify.git fetch $M/archive/ramify-stash-reflog.bundle 'refs/archive/stash/*:refs/archive/stash/*'
git init --bare ramify-audit.git && git -C ramify-audit.git fetch $M/archive/ramify-audit/ramify-audit-all.bundle 'refs/*:refs/*'
# Dirty work: check out the HEAD in <name>.head.txt, then either extract the
# tarball over the checkout or apply the patches (staged first).
tar -xzf $M/archive/worktrees/<name>.tar.gz -C <checkout>
git -C <checkout> apply --index $M/archive/worktrees/<name>.staged.patch
git -C <checkout> apply $M/archive/worktrees/<name>.unstaged.patch
# Evidence: extract into the base directory named in archive-evidence.log.
tar -xzf $M/archive/evidence/<name>.tar.gz -C <base>
git clone $M/filtered/extracted-main.bundle ramify-agent
```

The restore test used these commands under a scratch directory, deleted
afterwards. All three bundles verify. The `/ramify` restore has 877 refs,
identical to the inventory, all three notes refs and 222 audit notes. 30
sampled blobs from `ramify-agent`, `refs/notes/audit` and the agent notes ref
re-hash equal. The stash bundle restores all six entries into an empty
repository with no connectivity problems. The ramify-audit restore has 99
identical refs. The `/ramify` dirty tarball, extracted outside `/ramify`,
matches all 175 entries of its manifest and the live fingerprints. Its
unstaged patch reverse-applies to the live checkout. 15 sampled Plan 31 run
state files equal the live files, and all 32 tarballs pass `gzip -t`.

## Extraction

`git clone --mirror --no-local /ramify` followed by
`git filter-repo --force --subdirectory-filter ramify-agent`. `--force` was
needed only because the mirror carried `refs/stash`; the clone was fresh.
`/home/app/plan32-workspace/ramify-agent` was initialized empty and fetched only
the translated `plan32/extraction-candidate` as `main`. It has one ref, no
remote and no notes.

- The extracted root tree equals `plan32/extraction-candidate:ramify-agent`
  (`368a662a…`).
- `main` has 822 commits, 79 merges and one root (`136d629`,
  2026-09-19). All 801 original candidate commits touching `ramify-agent/` map
  to commits in that history; the remaining 21 are retained merges.
- Authors and committers are preserved: 820 Dan `<daniele.mazzini@gmail.com>`,
  one Dan `<dan@learningtapestry.com>`, one Codex. These are the same author set
  as the original path history. 25 sampled commits have identical names,
  emails, dates and messages after normalizing hash references.
- filter-repo left seven message references to commits that no longer exist
  (`maps/suboptimal-issues`). It could not translate the 39
  `refs/codex/turn-diffs/*` refs, which point to whole-repository trees, so
  they were deleted from the filtered mirror and remain in the original bundle.
- `/ramify` history is unchanged (see the unchanged check below).

## Pending-branch dispositions

`/ramify` has 179 local branches. 111 are fully reachable from the candidate
(`archive/inventory/branches-fully-reachable.txt`). Ten have unreachable commits
that touch nothing under `ramify-agent/`, so they stay with the toolkit:
`experiment/capability-plan-cooperation-20260927`,
`experiment/fresh-capability-architect-20260928`,
`feat/plan34-real-review-summary`, `fix/no-fixed-worker-heap`,
`fix/owned-tree-hard-exclusions`, `ramify-agent-run/20261010T191858Z-adf21a`,
`spike/fast-check-retained-session`, `test/plan17-explorer-partial` and
`validation/resident-{linux,macos}-20260911`. The remaining 58 are listed with
original and translated tips in `archive/inventory/branch-dispositions.tsv`.

| Disposition | Branches |
| --- | --- |
| Integrated, patch-equivalent (21) | `docs/plan16-retry7-run-analysis`, `feat/plan16-ca24-old-resume-test`, `feat/plan16-recovery-followup`, `feat/plan23-08-continuations`, `feat/plan23-10-corrections`, `feat/plan23-11-observations`, `feat/plan23-12-presentation`, `feat/plan23-13-trials`, `feat/plan23-14-{agent-regressions, ca19-auth, captured-commit, continuing-faults, detached-core, detached-store-read, final-receipt, joined-performance, qualification, recovery-regressions, transcript-burst}`, `feat/plan23-blob-object-facts`, `feat/plan23-git-line-facts` |
| Integrated, rebased (3) | `feat/plan23-09-forks` (`a7b73fc9` as `f53d2126`), `fix/plan16-ca20-durable-pgid-20260929` (`57ccf79e` as `001ffe28`), `spike/architect-module-cwd` (`3101ac30` as `ee1f8f10`; `76313568`'s change present) |
| Archived, run/trial evidence (24) | `ramify-agent-run/20260925T163917Z-f46ddf`, `…20260925T171229Z-f00d31`, `…20260926T052417Z-21d928`, `…20260928T153951Z-b43702`, `…20260928T183332Z-26f52b`, `…20260928T203027Z-04b0b1`, `…20260928T223727Z-edfc85`, `…20260929T011751Z-2f6360`, `…20260929T041024Z-f2a4ca`, `…20260929T060853Z-5a6de3`, `…20260929T074850Z-2ddc03`, `…20260929T115512Z-718992`, `ramify-agent-run/plan16-retry5`, `ramify-plan16-consumer-first-retry8`, `run/self-explaining-denials`, `trial/plan16-capability-live-20260928`, `trial/plan16-consumer-first-20260928`, `trial/plan16-consumer-first-retry-20260928`, `trial/plan16-consumer-first-retry6-20260929`, `trial/plan16-consumer-first-retry7-20260929`, `trial/self-explaining-denials-20260925`, `trial/self-explaining-denials-audited-20260925`, `trial/status-badge-repeat-20261009T180737Z`, `feat/plan34-real-project-option` (Plan 34 real-work target, cited by its 04 results) |
| Pending integration (10): continues in the old repository until handed off; translated copy in `filtered/all-refs.git` | `feat/plan31-operator` and `ramify-agent-run/20261010T1200Z-wi01-s0` (Plan 31, possibly live; worktree untouched); `feat/plan34-execution-breakpoints` (parallel Plan 34 implementation superseded by the merged `4d13c8df`; uncommitted iteration-4 results archived); `feat/plan6-i4`, `feat/plan6-role-prompts` (Plan 6, unmerged); `fix/plan-evidence-external-links-20260925` (September 25–26 trial fixes and analyses, including the run analysis cited by `docs/analysis/2026-09-26-todo.md`); `feat/project-boundary-sequential` (alternative Plan 20 draft); `fix/reference-work-gate-selection`, `fix/scenario-step-extensions` (their target code no longer exists); `refactor/contract-authority` (September 20 refactor) |

Every pending branch except Plan 31 is probably obsolete. Each needs an
explicit decision to retire it or to integrate it into the new repository.

## Remote and companions

| Item | Recorded value |
| --- | --- |
| New remote | `https://github.com/danmaz74/ramify-agent.git`: `git ls-remote` succeeds and returns no refs; unauthenticated GitHub API reports `visibility: public`, default branch `main`, created 2026-10-11 |
| Source visibility | `danmaz74/ramify` is public; `danmaz74/ramify-audit` returns 404 unauthenticated (private) |
| Intended branch | `main` (iteration 5 adds `origin`) |
| `ramify` companion | `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`, the pushed tip of `ramify-agent` on the remote. Iteration 5 may replace it with the toolkit cleanup commit once that is pushed. |
| `ramify-audit` companion | `43ca23e08a776df580655e945bbe4aff370e131a` (`feat/vitest-project-exclusions`, "Record published Vitest project exclusion release"), on the remote with `package.json` version 0.7.2, equal to the agent's exact pin. Remote `main` is 0.7.0 (`5e5228da`). The newer 0.7.3 tip (`4f3b73fc`, `feat/early-mode-report`) does not contain `43ca23e0` and does not match the pin. |

## Acceptance outcomes

| Case | Outcome | Evidence |
| --- | --- | --- |
| E01 | Pass | `archive/inventory/{before,after}/`, `archive/` bundles and tarballs, `evidence/restore-test.txt`, `evidence/gzip-integrity.txt`, `evidence/unchanged-check.txt` |
| E02 | Pass | Candidate commits above; `archive/inventory/branch-dispositions.tsv`; focused logs `evidence/candidate-focused-*.log` |
| E03 | Pass | Tree equality above; `filtered/maps/commit-map`; `evidence/authorship.txt`, `evidence/sample-commit-identity.txt`; unchanged `/ramify` history |
| E04 | Pass | Notes and audit refs remain only in `archive/ramify-all.bundle` (restored and verified); none in `filtered/all-refs.git` or the extracted repository; `evidence/remote-*.txt`; companion identities above |

Unchanged check: before and after, `/ramify` HEAD, the index sha256 and the
sha256 of all 175 dirty or untracked files are identical. Every per-worktree
HEAD, branch and status is identical. The only ref and worktree additions are
`refs/heads/plan32/extraction-candidate` and its worktree
`/home/app/ramify-plan32-candidate`. The only other change in `/ramify/.git`
is the `/.plan32-migration/` line in `info/exclude`.

## Limits and handoff to iteration 2

- `skills/module-architect` is still a symlink into the toolkit's
  `.claude/skills/module-architect`; in the extracted root it dangles until
  iteration 2 carries the skill.
- Several carried analyses link absolute evidence paths under `/home/app`
  (for example `/home/app/ramify-trial-evidence/...` in the repeat postmortem).
  Those paths are not persistent; their content is in `archive/evidence/`.
- Carried verbatim prompt captures under the `invocations/` directories of
  the Plan 25 and repeat status-badge postmortems contain trailing whitespace.
  `git diff --check` over commit `c22c9517` reports 33 lines. The files were kept byte-exact as evidence.
- The `/ramify` README edit appends Plan 29, Plan 27 and declared-task-block
  entries after the closing `.superseded/` paragraph. It was carried as written.
- Dependencies were installed in the candidate worktree for focused checks.
  The extracted root has not been installed or checked; iteration 2 owns that.
- The candidate worktree, the extracted checkout and every `/home/app` or `/tmp`
  worktree remain in the container's writable layer. The extracted repository is
  also preserved as `filtered/extracted-main.bundle`. The toolkit worktrees and
  ramify-audit worktrees in `/home/app` and `/tmp` are recoverable from the
  bundles and dirty-file archives, but are still live there.
