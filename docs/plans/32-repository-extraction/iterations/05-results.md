# Iteration 5 results: publish the repository and cut over

[Iteration brief](05-publish-and-cut-over.md) · [Plan](../main-plan.md) ·
[Acceptance](../acceptance.md)

**Date:** 2026-10-11. **Status:** partially complete. E21 and E22 pass. E23 is
pending host execution: this execution container has no Docker and no access
to the host filesystem, so the host workspace, the transfer and the old
container's retirement are written below as an exact procedure. E24's handoff
is this document. The plan stays incomplete until E23 and the container
witnesses of iterations 3 and 4 run on the host.

Only `main` was pushed, to `https://github.com/danmaz74/ramify-agent.git`.
Nothing was pushed to the toolkit or ramify-audit remotes. `/ramify`'s checkout
and every existing worktree were only read. Evidence paths below are relative to
`/ramify/.plan32-migration/evidence/iteration5/` unless stated otherwise.

## Published repository (E21)

| Item | Identity |
| --- | --- |
| Remote | `https://github.com/danmaz74/ramify-agent.git`, public, default branch `main`; `git ls-remote` returned no refs before the push |
| Published `main` | `c180a3f31699ffb4a57edceec3b54477283a5509` (iteration 4 receipt), then this receipt; `git push -u origin main` only |
| Qualified implementation candidate | `a6d8e02b75268b25acfa034328fb68f14b1362bb`, tree `b3d25fdf11da053a5b137dddbcf7c12f99b50bd1` |
| Not pushed | `refs/notes/audit` and `refs/audited/*`, following the toolkit's convention that audit records stay local |

**Qualification records in the working repository.** The three refs from
`filtered/qualification-a6d8e02b-audit.bundle` (`refs/notes/audit` at
`7b5028bc`, `refs/audited/runs/2026-10-11T06-00-08Z-a6d8e02b7` and
`refs/audited/by-tree/b3d25fdf…`, both at `d661b7a0`) were fetched into
`/home/app/plan32-workspace/ramify-agent`. A read-only
`ramify-audit check-branch main --json` there (0.7.2) answers `auditStillApplies:
true`, `auditPassed: true`, composition `pass`, last audited commit `a6d8e02b`,
no impacting committed or dirty change; the four later receipt files are
ignored under `docs/**` (`e21-check-branch-working-repo.json`).

**Fresh clone.** `git clone https://github.com/danmaz74/ramify-agent.git` into
`/home/app/plan32-workspace/worktrees/e21-fresh-clone/` (`e21-fresh-clone.txt`):

| Check | Result |
| --- | --- |
| HEAD | `c180a3f31699ffb4a57edceec3b54477283a5509` on `main`, tree equal to the working repository's |
| Candidate | `a6d8e02b^{tree}` = `b3d25fdf11da053a5b137dddbcf7c12f99b50bd1` |
| History | 831 commits, 79 merges, one root (`136d6298`); `git rev-list` identical to the working repository; authors 829 Dan `<daniele.mazzini@gmail.com>`, one Dan `<dan@learningtapestry.com>`, one Codex |
| License | `package.json` `GPL-3.0-only`, `"private": true`; root `LICENSE` is the GNU GPL v3 text; README's License section names GPL-3.0-only; `skills/module-architect/LICENSE` keeps the upstream MIT notice |
| Skill | `skills/module-architect` is a real directory with 11 files, including `PROVENANCE.md`; the only tracked symlinks are the three `.agents/skills/*` links, all resolving inside the clone |
| Plans | `docs/plans/15-prompt-workbench`, `27-projections-extraction`, `28-design-review-guidance-sessions`, `29-common-prompt-passages`, `32-repository-extraction` |
| `npm ci` | exit 0, 503 packages; `ramify --version` 0.4.2; installed `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2, equal to the pins (`e21-npm-ci.log`) |
| `npm run type-check` | exit 0, four compiler projects (`e21-type-check.log`) |
| `npm run check:self` | exit 0: 13 owners, 778 source files, 15,827 accesses; 0 errors, 0 warnings, 355 analysis limits, as in iterations 2–4 (`e21-check-self.log`) |
| Working tree after | clean (`e21-status-after.txt`) |

No full suite ran: the published content is the qualified candidate plus
documentation receipts.

## Toolkit cleanup (E22)

Isolated worktree `/home/app/ramify-remove-agent`, local branch
`chore/remove-ramify-agent` from `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`
(the tip of `ramify-agent`, equal to `origin/ramify-agent`). Not merged and not
pushed.

| Commit | Content |
| --- | --- |
| `74b445ba` chore: remove the ramify-agent subtree | `git rm -r ramify-agent`: 2,267 files |
| `9a77a2532fa3c17da5a1c7f5bb4436fbb3d72659` chore: drop the ramify-agent boundary, exclusions and instructions | 13 files, below |

The second commit removes what existed only for the agent tree:

- `module.ramify`: the `external "ramify-agent"` declaration and its mention in
  the comment above the external trees.
- `package.json`: `npm --prefix ramify-agent ci` from `worktree:prepare`.
- `tsconfig.json`: `ramify-agent` from `exclude`.
- `ramify-audit.json`: `ramify-agent/**` from `ignorePaths`.
- Tests and harness inputs that pin the root description's nested trees:
  `subs/analysis/src/tests/toolkit-boundaries.test.ts` (external list, the
  `ramify-agent/module.ramify` seed, the unread-description assertion),
  `subs/analysis/subs/descriptions/src/tests/descriptions.test.ts`,
  `src/tests/production-boundary.test.ts`,
  `scripts/reference-harness/self-cases.ts`.
- `scripts/validate-final-contracts.ts`: a named layer, "ramify-agent
  repository extraction", withdraws `external "ramify-agent"`; the archived
  Phase 1 layer that added it is unchanged.
- `CLAUDE.md`: the "ramify-agent is a separate project" section becomes
  "ramify-agent lives in its own repository", pointing to the new remote,
  stating that the toolkit has no dependency on it and that historical links
  into the removed tree resolve at `1d8a43fc`; the nested agent audit command
  and the agent dependencies of `worktree:prepare` are gone.
- `README.md`: the external-tree sentence; release step 3 now audits with the
  published `ramify-audit` that CLAUDE.md names, installed outside the
  repository, instead of `ramify-agent/node_modules/.bin/ramify-audit`.
- `docs/agents/README.md`: links to the new repository.
- `docs/development/cucumber-viz.md`: `worktree:prepare` prepares the example
  and the site only.

The toolkit `.devcontainer/` (Compose volumes, setup and post-start scripts,
`codex-mcp-setup.sh`), `.gitignore`, vitest configurations, the other compiler
configurations and the agent skills contain no agent reference and were not
changed. `/ramify`'s dirty `codex-mcp-setup.sh` was not touched.

### Focused checks before the audit

In the worktree, after `npm ci` at the root, `npm run worktree:prepare` and
`npm run build` (all exit 0):

| Command | Result |
| --- | --- |
| `vitest run` on the three affected test files | 3 files, 37 tests passed (`e22-focused-tests.log`) |
| `node --import tsx scripts/validate-final-contracts.ts` | exit 0: 15 owners, 617 files, 173 expanded statements, 8 package entries (`e22-validate-final-contracts.log`) |
| `vitest run -c scripts/reference-harness/vitest.config.ts scripts/reference-harness/final-contracts.test.ts` | 12 tests passed (`e22-final-contracts-test.log`) |
| `npm run type-check` | exit 0 (`e22-type-check.log`) |
| `npm run check:self` | passed: 15 owners, 600 source files, 8,936 accesses; 0 errors, 0 warnings, 41 analysis limits (`e22-check-self.log`) |

**Leftover-directory probe.** A checkout that moves to the cleanup commit keeps
its ignored and untracked files under `ramify-agent/` (dependencies, `dist/`,
harness run state). With a temporary `ramify-agent/node_modules`, `dist/` and
run-state file in the worktree, `check:self` still passed with one warning,
`ignored-but-walked ramify-agent/dist`; the probe files were then deleted and
the worktree was clean again (`e22-leftover-probe-check-self.log`). Remove the
leftover directory after landing the cleanup in a checkout.

### Release audit

The declared release audit, per the toolkit's CLAUDE.md at `1d8a43fc` (the
published `ramify-audit` 0.7.0 installed at `/home/app/tools/ramify-audit-0.7.0`;
its `ramify-audit.json` declares no other version), from the clean worktree
(`git status --porcelain` empty before and after):

```sh
/home/app/tools/ramify-audit-0.7.0/node_modules/.bin/ramify-audit audit --cwd . --full --json
```

Started 2026-10-11T06:10:05Z, exit 0 after 352 s; stderr empty, so the test command did
not wait for the machine test lock. A first launch, wrapped in a missing `/usr/bin/time`,
exited 127 before the audit started and is not a result.

| Item | Result |
| --- | --- |
| Candidate | `9a77a2532fa3c17da5a1c7f5bb4436fbb3d72659`, tree `821b3602fcb1a481d1547cd585a900ab034cdf99`, branch `chore/remove-ramify-agent` |
| Verdict | `pass`; composition `pass`, not scoped, chain depth 0, 0 outstanding failures |
| Mode | requested and executed `full`; 5 of 5 checks selected, none omitted; `ignorePaths` now `.devcontainer/**`, `docs/**`, `scripts/probes/**` |
| `patch-integrity` | pass, 0.007 s (`git diff --check` of the second commit) |
| `toolkit-build` | pass, 3.5 s |
| `toolkit-typecheck` | pass, 3.6 s |
| `toolkit-tests` | pass, 314.8 s: files 204 passed, 0 failed, 0 skipped; tests 2,838 passed, 0 failed, 0 skipped; failure ledger complete with no entries |
| `toolkit-structure` | pass, 12.9 s: 15 owners, 600 source files, 0 errors, 0 warnings |
| Records (local, in `/ramify/.git`, not pushed) | note on `9a77a253` in `refs/notes/audit`; report commit `80338ec9070f1bd76d3f73b0bc3c53baf535c933` under `refs/audited/runs/2026-10-11T06-15-56Z-9a77a2532` and `refs/audited/by-tree/821b3602…` |

Comparison: the nearest audited ancestor of `1d8a43fc` is `9bb5f032` ("adopt
published audit 0.7.0 for toolkit gates", 2026-10-06), a full pass in 345 s
with the same 204 files and 2,838 tests. Between it and `1d8a43fc` nothing
outside `ramify-agent/` and `docs/` changed. No test failed, so no rerun or flake record was needed.
Evidence: `e22-audit.json`, `e22-audit-summary.txt`, `e22-audit-start.txt`,
`e22-audit-exit.txt`, `e22-audit.stderr.log`.

### Remaining references

`rg -n -i 'ramify-agent' --hidden -g '!.git' -g '!node_modules'` in the cleanup
tree:

| Location | Hits | Classification |
| --- | --- | --- |
| `CLAUDE.md` | 4 | Fixed: the new pointer section and its history sentence |
| `docs/agents/README.md` | 2 | Fixed: links to the new repository |
| `scripts/validate-final-contracts.ts` | 4 | Acceptable: the archived Phase 1 layer that added the declaration and the new layer that withdraws it |
| `docs/architecture/optimization.md` | 1 | Historical measurement (batch analysis time of ramify-agent) |
| `docs/architecture/project-boundary.proposal.md` | 10 | Historical design record whose contracts were adopted in the specifications; its four relative links into the removed tree resolve at `1d8a43fc`, as CLAUDE.md states |
| `docs/plans/affected-rule-selection/` (8 files) | 31 | Historical: complete plan and results |
| `docs/plans/iteration-2c-module-measurements/` | 2 | Historical: implemented plan; two links resolve at `1d8a43fc` |
| `docs/plans/iteration-2d-view-orientation/` | 1 | Historical source-verification line (branch name) |
| `docs/plans/iteration-7-affected-modules/` (6 files) | 53 | Historical: plan, cases and results with measurements on the agent |
| `docs/plans/iteration-8-signature-companions/` (5 files) | 9 | Historical: implemented plan and results |
| `docs/plans/module-architect-skill/` | 2 | Historical references from a dormant plan (iterations 2–5 pending since 2026-09-18); two links resolve at `1d8a43fc` |
| `docs/plans/nested-tree-kinds/` (12 files) | 34 | Historical: complete plan, results and evidence |
| `docs/plans/project-boundary-ramify/` (58 files) | 100 | Historical: Phase 1 plan, contracts, results and evidence |
| `docs/plans/project-boundary-sequential/` | 16 | Historical draft master plan whose Phase 3 names the old `ramify-agent/` tree; not an active instruction |
| `docs/plans/shared-guidance-sync/` (3 files) | 10 | Draft for contract review naming ramify-agent as a separate owner repository; already consistent with the split |

No active setup, configuration, test, script or instruction outside these
rows names the agent.

## Re-inventory and transfer state (E23)

Raw inventory: `/ramify/.plan32-migration/archive/inventory/iteration5/`,
summary `e23-reinventory.txt`. Compared with iteration 1's after-inventory
(05:10:41Z):

- `/ramify` HEAD (`1d8a43fc` on `ramify-agent`), index hash and the
  fingerprints of all 175 dirty or untracked files are identical.
- The toolkit has 88 worktree entries. Each one's Git common directory is
  `/ramify/.git`, on the persistent bind mount. Two have working files on the mount:
  `/ramify` and `/ramify/.claude/worktrees/agent-a6cc06c6b996c0abf`. The other
  86 are in `/home/app` or `/tmp`, in the container's writable layer.
- New since iteration 1: this iteration's `/home/app/ramify-remove-agent` and the
  release audit's transient `/tmp/ramify-audit-worktree-*` worktree. No other
  worktree, HEAD, branch or status changed, and no ref changed except the new
  `chore/remove-ramify-agent` (plus the cleanup audit's local records).
- The seven dirty worktrees are those of iteration 1. Their files were
  re-hashed against `archive/worktrees/*.sha256`, with no changed file or link
  and equal status counts. Nothing new needed archiving
  (`archive/worktrees-iteration5/NOTHING-NEW.txt`).
- ramify-audit (`/home/app/ramify-audit`, writable layer) has identical refs
  (99), the same seven clean worktrees and no stash, so
  `archive/ramify-audit/ramify-audit-all.bundle` is still current. Its raw
  re-inventory is in `archive/ramify-audit/iteration5/`.
- The only Git repositories new since iteration 1 are Plan 32's own working
  repository, clones and witnesses under `/home/app/plan32-workspace/`.
- No ignored evidence outside Plan 32 changed. No harness, serve, Pi or Codex
  job is running.

Dirty worktrees, all archived in `archive/worktrees/`:

| Worktree | Branch | Entries |
| --- | --- | --- |
| `/ramify` | `ramify-agent` | 175 |
| `/home/app/ramify-plan23-14-observation-batch` | `feat/plan23-14-observation-batch` | 2 |
| `/home/app/ramify-plan23-final-gate-repair` | `plan/23-final-gate-repair` | 5 |
| `/home/app/ramify-plan34-breakpoints-implementation` | `feat/plan34-breakpoints-implementation` | 7 |
| `/home/app/ramify-plan34-execution-breakpoints` | `feat/plan34-execution-breakpoints` | 14 |
| `/home/app/ramify-plan35-debugger-ui` | `feat/plan35-debugger-ui` | 1 |
| `/tmp/plan21-iteration0-actual-agent` | detached `1c8764a8` | 8 |

State outside every persistent mount that the cutover must carry: `~/.pi`
(Pi login and sessions), `~/.npmrc` (registry token), `~/.codex` apart from
the mounted `auth.json` (2.1 GB of sessions, memories and logs), and
`/home/app/tools/ramify-audit-0.7.0`, the toolkit's declared audit CLI.
Credentials were not copied into the archive.

### Host cutover procedure

Run on the Docker host that runs the current container, as the user who owns
`<ramify>`, the host directory mounted at `/ramify`. `OLD` is the current
container. Order matters: preserve, then build the new workspace beside the old
one, verify it, and only then stop the old container. Nothing here deletes the
old checkout.

```sh
# 0. Identify the old container and the host path of /ramify.
OLD=<container id or name>                         # docker ps
docker inspect "$OLD" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
RAMIFY=<host source of /ramify>
W=~/ramify-workspace

# 1. Inside the old container, immediately before the transfer: confirm no live
#    job, refresh the inventory and archive anything dirty that is new.
docker exec -u app "$OLD" bash -lc '
  ps -eo pid,etime,cmd | grep -E "harness|serve|pi |codex exec|vitest" | grep -v grep
  M=/ramify/.plan32-migration
  bash $M/tools/inventory.sh $M/archive/inventory/cutover
  bash $M/tools/fingerprint.sh $M/archive/inventory/cutover/ramify-fingerprints.txt
  diff -r $M/archive/inventory/iteration5/worktrees $M/archive/inventory/cutover/worktrees'
#    For every worktree the diff names, or that is new and dirty:
#      docker exec -u app "$OLD" bash $M/tools/archive-dirty.sh <worktree> $M/archive/worktrees-cutover
#    If ramify-audit refs changed, rebundle:
#      git -C /home/app/ramify-audit bundle create $M/archive/ramify-audit/ramify-audit-all.bundle --all

# 2. Preserve the old container's writable layer as an image (rollback and
#    recovery of /home/app and /tmp; bind mounts are not included).
docker commit "$OLD" ramify-old-container:plan32

# 3. Host workspace and evidence.
mkdir -p "$W/worktrees" "$W/evidence" ~/.ssh ~/.claude ~/.codex ~/.pi && touch ~/.gitconfig
git clone https://github.com/danmaz74/ramify-agent.git "$W/ramify-agent"
git -C "$W/ramify-agent" fetch "$RAMIFY/.plan32-migration/filtered/extracted-main.bundle" \
  'refs/notes/audit:refs/notes/audit' 'refs/audited/*:refs/audited/*'    # local qualification records

# 4. Tool state out of the old container (host state is shared, so merge
#    rather than overwrite if the host already has these).
docker cp "$OLD:/home/app/.pi" /tmp/old-pi && cp -an /tmp/old-pi/. ~/.pi/ && rm -rf /tmp/old-pi
docker cp "$OLD:/home/app/.npmrc" ~/.npmrc.ramify-old          # registry token; see the workspace guide
docker cp "$OLD:/home/app/.codex" /tmp/old-codex && cp -an /tmp/old-codex/. ~/.codex/ && rm -rf /tmp/old-codex

# 5. ramify-audit with its full Git metadata and seven worktrees.
docker cp "$OLD:/home/app/ramify-audit" "$W/ramify-audit"
git -C "$W/ramify-audit" remote get-url origin    # https://github.com/danmaz74/ramify-audit
#    Fallback: git clone "$RAMIFY/.plan32-migration/archive/ramify-audit/ramify-audit-all.bundle" "$W/ramify-audit"
#    && git -C "$W/ramify-audit" remote set-url origin https://github.com/danmaz74/ramify-audit.git
#    && git -C "$W/ramify-audit" fetch "$RAMIFY/.plan32-migration/archive/ramify-audit/ramify-audit-all.bundle" 'refs/*:refs/*'

# 6. The toolkit: copy, not move, so the old container keeps its mount for
#    rollback. Stop the old container first for a consistent copy (step 9 can
#    restart it). The migration archive moves to the workspace evidence.
docker stop "$OLD"
rsync -aH --exclude /.plan32-migration "$RAMIFY/" "$W/ramify/"
rsync -aH "$RAMIFY/.plan32-migration/" "$W/evidence/plan32-migration/"
sed -i '\#^/\.plan32-migration/$#d' "$W/ramify/.git/info/exclude"

# 7. Linked worktrees. Copy the ones to keep out of the image; paths must be
#    repaired inside the new container, where they are /workspaces/... .
#    Keep: the seven dirty worktrees above, /home/app/ramify-plan31-operator
#    (Plan 31 run state), /home/app/ramify-remove-agent (until the cleanup
#    lands), /home/app/ramify-plan32-candidate (optional). Others are clean
#    and their branches are refs; recreate them on demand.
for p in /home/app/ramify-plan23-14-observation-batch /home/app/ramify-plan23-final-gate-repair \
         /home/app/ramify-plan34-breakpoints-implementation /home/app/ramify-plan34-execution-breakpoints \
         /home/app/ramify-plan35-debugger-ui /tmp/plan21-iteration0-actual-agent \
         /home/app/ramify-plan31-operator /home/app/ramify-remove-agent; do
  docker cp "$OLD:$p" "$W/worktrees/$(basename "$p")"     # docker cp works on a stopped container
done
#    ramify-audit's worktrees (/home/app/ramify-audit-{mode,nk,p3,pb,pb-it3,vpe}) are
#    clean: recreate on demand from their branches.

# 8. Create the new container (agent workspace guide), then inside it:
devcontainer up --workspace-folder "$W/ramify-agent"
devcontainer exec --workspace-folder "$W/ramify-agent" bash -lc '
  set -e
  cd /workspaces/ramify
  for d in /workspaces/worktrees/*/ /workspaces/ramify/.claude/worktrees/*/; do
    [ -f "$d/.git" ] || continue
    sed -i "s#^gitdir: .*/\.git/worktrees/#gitdir: /workspaces/ramify/.git/worktrees/#" "$d/.git"
    git worktree repair "$d"
  done
  git worktree prune --dry-run --verbose     # the remaining old /home/app and /tmp entries
  git worktree prune                         # only after reviewing the list above
  git -C /workspaces/ramify-audit worktree prune
  for d in /workspaces/worktrees/*/; do git -C "$d" status --short --branch | head -3; done
  bash /workspaces/ramify-agent/.devcontainer/status.sh'
#    Compare fingerprints with the archive: for each copied dirty worktree,
#    (cd /workspaces/worktrees/<name> && grep -v "^link:" <evidence>/plan32-migration/archive/worktrees/<slug>.sha256 | sha256sum -c --quiet)
#    and for the toolkit: bash <evidence>/plan32-migration/tools/fingerprint.sh with cd /workspaces/ramify,
#    diffed against archive/inventory/iteration5/ramify-fingerprints.txt (the index hash may differ after
#    the copy; status entries and file hashes must match).
#    Reinstall the toolkit audit CLI the toolkit's CLAUDE.md names:
#      npm install --prefix /home/app/tools/ramify-audit-0.7.0 ramify-audit@0.7.0 --registry https://npm.braimax.com/
#    Claude Code memory is keyed by path: copy ~/.claude/projects/-ramify to
#    ~/.claude/projects/-workspaces-ramify (and use -workspaces-ramify-agent for the agent).

# 9. Witnesses: run iteration 3's host-side witness procedure and iteration 4's
#    E17 section (03-results.md) in their separate witness project; copy their
#    logs to "$W/evidence/plan32-migration/evidence/host/".

# 10. Retire: only after steps 5–9 pass. Keep the old container stopped (do not
#     remove it), its image ramify-old-container:plan32, its volumes and "$RAMIFY".
```

Notes:

- Copying `/ramify` keeps every worktree's administrative files in
  `.git/worktrees/`; their recorded paths are the old `/home/app/...` and
  `/tmp/...` ones until step 8 repairs or prunes them. `git worktree prune`
  only removes administrative entries of worktrees whose directory is
  missing; branches and commits stay.
- The toolkit's ignored dependencies are in the old Compose volumes, not in
  `<ramify>`; agent setup prepares fresh volumes for `/workspaces/ramify`.
- `docker cp` keeps file modes but not ownership; inside the new container
  run `sudo chown -R app:app /workspaces/worktrees` if needed.

## Old-to-new mapping, archive and evidence

| What | Where (old container; after cutover under `ramify-workspace/evidence/plan32-migration/`) |
| --- | --- |
| Commit map (1,937 entries), ref map | `/ramify/.plan32-migration/filtered/maps/` |
| Extracted repository with its local qualification refs | `/ramify/.plan32-migration/filtered/extracted-main.bundle` (refreshed at the end of this iteration: `main` plus `refs/notes/audit` and `refs/audited/*`) |
| Qualification records alone | `filtered/qualification-a6d8e02b-audit.bundle` |
| Original toolkit repository (877 refs, notes, stashes) | `archive/ramify-all.bundle`, `archive/ramify-stash-reflog.bundle` |
| ramify-audit repository | `archive/ramify-audit/ramify-audit-all.bundle` |
| Dirty worktree files | `archive/worktrees/` (iteration 1; still current) |
| Ignored run and trial evidence | `archive/evidence/` |
| Inventories | `archive/inventory/{before,after,iteration5}/` |
| Toolkit cleanup branch | `archive/toolkit-cleanup.bundle` (thin: `1d8a43fc..chore/remove-ramify-agent`; its prerequisite is in `archive/ramify-all.bundle`); the branch and its audit records are also in `/ramify/.git` |
| Iteration evidence | `evidence/iteration{2,3,4,5}/` |

Restore commands are in [01-results.md](01-results.md#restore-commands).

## Pending branch dispositions

Unchanged from [iteration 1](01-results.md#pending-branch-dispositions)
(`archive/inventory/branch-dispositions.tsv`): no pending branch moved. The ten
"pending integration" agent branches continue in the old repository until each
is retired or integrated into the new one; translated copies are in
`filtered/all-refs.git`. Each needs your decision:

| Branch | Note |
| --- | --- |
| `feat/plan31-operator`, `ramify-agent-run/20261010T1200Z-wi01-s0` | Plan 31; worktree `/home/app/ramify-plan31-operator` with run state; transfer it (step 7) and continue in the new repository from the translated branch, or retire |
| `feat/plan34-execution-breakpoints` | superseded by the merged Plan 34; dirty iteration 4 results archived |
| `feat/plan6-i4`, `feat/plan6-role-prompts`, `fix/plan-evidence-external-links-20260925`, `feat/project-boundary-sequential`, `fix/reference-work-gate-selection`, `fix/scenario-step-extensions`, `refactor/contract-authority` | probably obsolete |

New: `chore/remove-ramify-agent` in the toolkit, local and unpushed, which you land.

## Landing the toolkit cleanup

1. Confirm that no live worktree still needs the agent tree in the toolkit:
   agent work now happens in the new repository, and the old agent branches
   are archived or pending as above.
2. In the toolkit checkout on `ramify-agent`, the nine modified tracked agent
   files and the untracked agent paths are already carried into the new
   repository (extracted commits `c22c9517`, `db6e1be2`, `65140383`) and
   archived. Discard or set the modified files aside, then
   `git merge --ff-only chore/remove-ramify-agent` (a fast-forward while
   `ramify-agent` is still at `1d8a43fc`; otherwise merge, and rerun the
   release audit on the result), push, and delete the leftover ignored
   `ramify-agent/` directory after archiving any run state still needed.
   Worktrees whose branches edit `ramify-agent/` conflict with the removal; finish
   or archive them first.
3. In a later agent commit, set `.devcontainer/companion-repos.json`'s `ramify`
   commit to the pushed cleanup commit. That file is outside the agent audit's
   `ignorePaths`, so that commit needs its own audit. Do it only after the
   push: a manifest commit must be retrievable from the remote.

## Setup, reconnect and daily workflow

Host setup and first creation follow the
[workspace guide](../../../development/workspace.md#before-the-first-creation):
`mkdir -p ~/ramify-workspace ~/.ssh ~/.claude ~/.codex ~/.pi`, `touch
~/.gitconfig`, clone this repository into `~/ramify-workspace/ramify-agent`,
then **Reopen in Container** or `devcontainer up --workspace-folder
~/ramify-workspace/ramify-agent`. With the cutover procedure above the
companions already exist and setup leaves them as they are.

Reconnect: open the same folder again; `post-start.sh` only checks state.
`bash .devcontainer/status.sh` reports each repository's branch, HEAD and dirty
state and the provider pins.

Daily work: open `development.code-workspace`; work in the repository the
change belongs to, from its own root, with its own commands and audit (agent:
`node_modules/.bin/ramify-audit audit --cwd . --full --nested --json`;
toolkit: the CLI its CLAUDE.md names). Worktrees go under
`/workspaces/worktrees/`. Provider changes are released and pinned, never
linked.

## Rollback

- Reopen the old environment: `docker start <OLD>` and reattach VS Code. Its
  `/ramify` bind mount is untouched because step 6 copies rather than moves;
  its writable layer (worktrees, ramify-audit, tool state) is in the stopped
  container and in `ramify-old-container:plan32`.
- New-repository work is unaffected: it is on GitHub and in
  `~/ramify-workspace/ramify-agent`, and nothing in the old environment writes
  there.
- From archives alone: restore the toolkit, ramify-audit and dirty files with
  the [restore commands](01-results.md#restore-commands), and the agent with
  `git clone extracted-main.bundle`.

## Acceptance reconciliation

| Case | Outcome | Evidence |
| --- | --- | --- |
| E01 | Pass (iteration 1); re-inventory in this iteration found no new dirty state | `archive/inventory/`, `e23-reinventory.txt` |
| E02 | Pass (iteration 1) | `archive/inventory/branch-dispositions.tsv` |
| E03 | Pass (iteration 1) | `filtered/maps/` |
| E04 | Pass (iteration 1); old records stay in the archive; new records stay local | `archive/ramify-all.bundle`, `filtered/qualification-a6d8e02b-audit.bundle` |
| E05 | Pass (iteration 2); repeated from the GitHub clone | `evidence/iteration2/e05-*`, `e21-npm-ci.log` |
| E06 | Pass (iteration 2) | `evidence/iteration2/e06-package-load.json` |
| E07 | Pass (iteration 2) | `evidence/iteration2/e07-*` |
| E08 | Pass (iteration 2) | `evidence/iteration2/e08-*` |
| E09 | Pass (iteration 2) | `evidence/iteration2/e09-*` |
| E10 | Partly executed (static); container parts pending host Docker | `evidence/iteration3/e10-*`; host procedure in 03-results |
| E11 | Executed (scripts), pass | `evidence/iteration3/e11-*` |
| E12 | Executed (scripts), pass | `evidence/iteration3/e12-*` |
| E13 | Executed (scripts); in-container startup pending host Docker | `evidence/iteration3/e13-*` |
| E14 | Partly executed; mounts, logins and reconnect pending host Docker | `evidence/iteration3/` |
| E15 | Authored and statically checked; pending host Docker | `evidence/iteration3/e10-static-checks.log` |
| E16 | Partly executed in this container; new image pending host Docker | `evidence/iteration3/e16-*` |
| E17 | Not executed; pending host Docker | procedure in 03-results, rehearsal `evidence/iteration4/e17-procedure-rehearsal.log` |
| E18 | Pass (iteration 4) | `evidence/iteration4/e18-*` |
| E19 | Pass (iteration 4): full nested audit of `a6d8e02b` | `evidence/iteration4/e19-*` |
| E20 | Pass except container identities and real reconnect, pending host Docker | `evidence/iteration4/e20-*` |
| E21 | Pass | `e21-*` |
| E22 | Pass: normal commits `74b445ba`, `9a77a253` on a local branch; the full release audit of `9a77a253` passes | `e22-*` |
| E23 | Pending host execution; re-inventory and procedure done | `e23-reinventory.txt`, procedure above |
| E24 | Handoff written (this document); complete when E23 and the host witnesses have run | this document |

Plan 32 is not complete: E23 and the host-Docker parts of E10, E13–E17 and
E20 remain. Publication and both qualifications are done.

## Decisions for you

- Land `chore/remove-ramify-agent` when convenient (see above); then update the
  agent's companion manifest.
- Run the host procedure and the iteration 3/4 witnesses, then retire the old
  container.
- Pending branches: retire or integrate each of the ten.
- The published README's License section says ramify-agent "is private and not
  published"; the repository is now public on GitHub (the package stays
  `private`, unpublished to npm). Changing the README needs an audit, because
  the README is outside `ignorePaths`.
- The toolkit's CLAUDE.md names the audit CLI at
  `/home/app/tools/ramify-audit-0.7.0`, in the container's writable layer.
  In the new container it must be reinstalled after each recreation, or moved
  under `/workspaces` with CLAUDE.md updated.
