# Iteration 3 results: the persistent three-repository devcontainer

[Iteration brief](03-persistent-devcontainer.md) · [Plan](../main-plan.md) ·
[Acceptance](../acceptance.md)

**Date:** 2026-10-11. **Status:** complete (container witnesses pending host
Docker). The configuration, bootstrap and status scripts are committed. Every
script case was executed against disposable workspaces. Cases that need a
built and running container are authored and statically checked only: the
execution container has no Docker, Docker Compose, devcontainer CLI or `gh`.
The [host-side witness procedure](#host-side-container-witness-procedure)
below executes them. Nothing was pushed. `/ramify`, its worktrees and
`/home/app/ramify-plan32-candidate` were only read.

## Identities

| Item | Identity |
| --- | --- |
| Starting point | `fc2c8bf3346528262e729daecf8e06f670f06c04` on `main` in `/home/app/plan32-workspace/ramify-agent` (iteration 2 receipt) |
| Devcontainer commit | `078e477dbc6b1c67590623104b8fda240982d127` build(agent): add the persistent three-repository devcontainer |
| Status fix | `9ab60709a406ccacc161f531989c3755d0147a42` build(agent): report a companion remote that names another repository |
| Documentation | `3c6f8d77fa7f509e24bfb52e6cc699e8a334506d` docs(agent): describe the development workspace |
| Adaptation input | Toolkit `.devcontainer/` at `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`; the live `/ramify/.devcontainer` differs only in its dirty `codex-mcp-setup.sh` (`required = false`) and its ignored `.env` (`RESTART_POLICY=unless-stopped`) |
| Witness tools | Node v22.23.3, npm 10.9.9, git 2.39.5, ShellCheck 0.11.0 (`npx --yes shellcheck`), `yaml` 2.9.1 from the iteration 2 fresh clone's dependencies |

No file under `src/`, `subs/` or `scripts/`, and none of `package.json`,
`package-lock.json`, `.npmrc`, `tsconfig.json`, `vitest*.config.ts`,
`cucumber.json`, `module.ramify`, `ramify-audit.json` or `ramify-agent.json`
changed in this iteration. `.gitignore` gained `.devcontainer/.env`.

## Choices

### Files

| Path | Role |
| --- | --- |
| `.devcontainer/devcontainer.json` | Compose service `app`, `workspaceFolder` `/workspaces/ramify-agent`, `remoteUser` `app`, `shutdownAction` `none`, `postCreateCommand` setup, `postStartCommand` post-start, ports, host-state mounts, editor extensions and settings |
| `.devcontainer/docker-compose.yml` | Build context `..` (the agent repository) with `.devcontainer/Dockerfile`; `../..:/workspaces:cached`; five named volumes without fixed names; `init: true`; `restart: ${RESTART_POLICY:-no}`; Chromium's `shm_size` and seccomp; DNS and `host.docker.internal` carried from the toolkit |
| `.devcontainer/Dockerfile` | Image; copies nothing from the context |
| `.devcontainer/Dockerfile.dockerignore` | `*`: the builder receives no repository file (BuildKit reads `<Dockerfile>.dockerignore`) |
| `.devcontainer/companion-repos.json` | Exactly `ramify` and `ramify-audit`, each with an HTTPS `url` and full `commit`; setup rejects any other shape |
| `.devcontainer/lib.sh` | Paths derived from the script location, manifest reading, remote normalization, checkout-root and mount-point tests, volume ownership |
| `.devcontainer/setup.sh` | Creation setup; explicit rerun after lockfile changes |
| `.devcontainer/post-start.sh` | Start checks only |
| `.devcontainer/status.sh` | Read-only report |
| `.devcontainer/.env.example` | `RESTART_POLICY`, `RAMIFY_UID`, `RAMIFY_GID`; `.devcontainer/.env` is ignored |
| `development.code-workspace` | Folders `ramify-agent` (`.`), `ramify (toolkit companion)` (`../ramify`), `ramify-audit (audit companion)` (`../ramify-audit`) |
| `docs/development/workspace.md` | Workspace guide; AGENTS.md, README and the document index link it |

### Layout, volumes and ports

- Host layout `ramify-workspace/{ramify-agent,ramify,ramify-audit,worktrees,evidence}`,
  mounted at `/workspaces`. Setup creates `worktrees/` and `evidence/`.
- Named volumes: `agent_node_modules` → `/workspaces/ramify-agent/node_modules`,
  `ramify_node_modules` → `/workspaces/ramify/node_modules`,
  `ramify_site_node_modules` → `/workspaces/ramify/site/node_modules`,
  `ramify_example_node_modules` → `/workspaces/ramify/examples/collection-review/node_modules`,
  `ramify_audit_node_modules` → `/workspaces/ramify-audit/node_modules`.
  Compose prefixes them with the project name, by default
  `ramify-agent_devcontainer`; a second workspace on the same host (such as the
  witness below) sets `COMPOSE_PROJECT_NAME`. Setup and post-start give a
  root-owned volume to `app` (`sudo chown -R`) and never reinstall.
- Ports: agent server 4180 (`npm run serve`, the CLI default `defaultPort` in
  `src/cli.ts`) and web development 5181 (`npm run dev:web -- --port 5181
  --strictPort`; Vite's default 5173 belongs to cucumber-viz, so the flag is
  documented instead of changing `subs/web/vite.config.ts`). Neither collides
  with the toolkit (4080, 4300, 4301, 5180, 8787) or cucumber-viz (3000–3002,
  3100–3102, 5173–5174, 8080, 8090, 9000, 9222). `onAutoForward: ignore`,
  `otherPortsAttributes` ignore and `remote.autoForwardPorts: false`, as in the
  toolkit.
- Restart: default `no`; `RESTART_POLICY=unless-stopped` in the ignored
  `.devcontainer/.env` opts in, as on the toolkit's server today.

### Image and pinned tools

| Item | Pin | Source of the value |
| --- | --- | --- |
| Base image | `node:22.23.3-bookworm` | Node v22.23.3 in this container; tag present on Docker Hub (amd64 digest `sha256:c4d5523090a817b7aa86d2111241fdd4f66d1e27782b44160e6aa63b357ecb2d`, pushed 2026-10-06) |
| Claude Code | `@anthropic-ai/claude-code@2.1.289` | `claude --version` here |
| Codex CLI | `@openai/codex@0.161.0` | `codex --version` here |
| Playwright MCP | `@playwright/mcp@0.0.83`, installed globally with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` | The npx cache behind this container's `@playwright/mcp@latest` registration; the new image installs it instead of fetching `latest` at use |
| Pi | none globally | Pi is the agent's own dependency `@earendil-works/pi-coding-agent` 0.87.1 (`npx pi`) |
| Chromium | Debian bookworm package (154.0.8037.92 here) | apt, as in the toolkit; not version-pinned |

The image keeps the toolkit's apt packages (including `chromium`, `ripgrep`,
`jq`, `zsh`, `sudo`), user `app` at uid/gid 1000 (build arguments overridable
through `.env`), the readline and zsh defaults, and `CHROME_BIN`/`CHROMIUM_FLAGS`.
It sets `DISABLE_AUTOUPDATER=1` and exports the three CLI pins as environment
variables, which post-start compares with the installed versions. cucumber-viz,
PM2, the toolkit's devcontainer Git feature and the image-seeded Codex
configuration are not carried. Setup registers the Playwright MCP server with
Claude Code only when no `playwright` server is registered.

### Host state

| Host path | Container path | Notes |
| --- | --- | --- |
| `~/.gitconfig` | `/home/app/.gitconfig` | as in the toolkit |
| `~/.ssh` | `/home/app/.ssh` | as in the toolkit |
| `~/.claude` | `/home/app/.claude` | as in the toolkit; shared with other containers |
| `~/.codex` | `/home/app/.codex` | whole directory, so `memories/`, `memories_1.sqlite`, sessions and `config.toml` persist; the toolkit mounts only `auth.json` |
| `~/.pi` | `/home/app/.pi` | new; Pi keeps `agent/auth.json`, `models-store.json`, `settings.json` and `sessions/` there (`getAgentDir()`; this container's `~/.pi` is in its writable layer today) |

All are declared in `devcontainer.json` with `${localEnv:HOME}`; a missing
source fails creation. `~/.npmrc` is not mounted: the five lockfiles resolve
from `npm.braimax.com` (agent) and `registry.npmjs.org` (toolkit, site, example,
audit), and every witness install ran with `NPM_CONFIG_USERCONFIG=/dev/null`.
Publishing a provider release needs an in-container `npm login`, lost on
recreation. Claude Code's `~/.claude.json` stays in the container, as in the
toolkit.

### Bootstrap

- Fresh companions are cloned with `git clone --no-checkout` into
  `<workspace>/.setup-staging/<name>`, the manifest commit is fetched if the
  default refspec lacks it, local branch `dev/workspace` (no upstream) is
  created at it, and the `.git` directory is moved into the companion
  directory before the working tree is checked out. A companion therefore
  becomes a checkout only after its clone succeeded; an interrupted attempt
  leaves only the setup-owned staging clone, which the next run replaces.
- Docker creates the mount points of an absent companion's volumes on the
  host. A companion directory holding only those mount points and their
  parents counts as absent; its root-owned directories are given to `app`.
- An existing companion must satisfy `git rev-parse --show-toplevel` equal to
  its real path and have some remote whose URL normalizes (scheme, user, scp
  colon, `.git`, trailing slash, case) to the manifest URL. All paths are
  verified before any clone or install; refusals are listed together.
- Preparation: agent `npm ci`; toolkit `npm ci`, `npm --prefix
  examples/collection-review ci`, `npm --prefix site ci` (its root dependencies
  plus the components of its `worktree:prepare` at `1d8a43fc`, without that
  script's `npm --prefix ramify-agent ci`); audit `npm ci`, whose `prepare`
  runs its build. No test suite, `npm link`, `file:` dependency or workspace.

## Case outcomes

Witness workspaces are `/home/app/plan32-workspace/witness-{a,c,d,e}`, each with
a clone of the working repository as `ramify-agent/`. Before/after comparisons
use `tool-fingerprint.sh.txt`: HEAD, branch, remotes, all refs, index file
hash, index entries, staged and unstaged diffs, tracked file contents,
untracked (non-ignored) files with contents, and worktree count. Logs are in
`/ramify/.plan32-migration/evidence/iteration3/`.

| Case | Status | What was executed | Evidence |
| --- | --- | --- | --- |
| E10 | Partly executed; container parts authored and statically checked, not executed: requires Docker on the host | 40 static assertions pass on the committed files: JSONC/YAML parse, parent bind mount, workspace folder, build context `..` with an ignore-all context, no `COPY`/`ADD`, five volume targets equal to `lib.sh`, no fixed volume or project names, ports, mounts, manifest, editor folders, ignore rules. ShellCheck and `bash -n` clean. No secret pattern in the committed files. `npm run check:self` passes with the new files (13 owners, 0 errors, 0 warnings, 355 analysis limits, as in iteration 2) | `e10-static-checks.log`, `e10-check-self.log`, `tool-check-config.mjs.txt` |
| E11 | Executed (scripts) | **Fresh:** witness-a, both companions absent: clones at `1d8a43fc…` and `43ca23e0…` on `dev/workspace` (the private ramify-audit cloned through this container's HTTPS credential helper), creates `worktrees/` and `evidence/`, runs all five preparations, exit 0, 31 s with a warm npm cache. **Failed clone and retry:** witness-d starts in Docker's absent state (root-owned companion directories holding only mount points, with stale volume content); ramify-audit's host made unresolvable with `GIT_CONFIG_*` `insteadOf` (no test hook): ramify cloned, audit failed, exit 1, agent fingerprint identical. After authored edits in the new ramify checkout, the retry kept it untouched, cloned ramify-audit, took over the root-owned directories and volumes, prepared everything (exit 0; 55 s with an empty npm cache). **Failed install and retry:** witness-a, ramify-audit `package.json` given a dependency its lockfile lacks plus an authored untracked file: setup failed at `npm ci` naming the step, exit 1, all three fingerprints identical; after reverting the edit the retry passed and kept the authored file | `e11-a1-fresh-setup.log`, `e11-d-initial-state.txt`, `e11-d1-*`, `e11-d2-*`, `e11-a3-*`, `e11-a4-*` |
| E12 | Executed (scripts) | **Dirty and clean companions:** witness-a, ramify on `wip/witness-e12` with a local commit, a staged and an unstaged edit, an untracked directory, origin rewritten to `git@github.com:danmaz74/ramify.git` and an extra `upstream` (`https://github.com/DanMaz74/Ramify`); ramify-audit clean on `dev/workspace`. Rerun setup exit 0; both are reported as existing and left as they are; every fingerprint, including the raw index hash, identical. **Refusals:** witness-c, ramify a checkout whose only remote is ramify-audit's, ramify-audit a non-Git directory with an authored file: both refused in one run, exit 1, no install, no `worktrees/`/`evidence/` created, fingerprints and workspace listing identical | `e12-a2-*`, `e12-c-*` |
| E13 | Executed (scripts); in-container startup not executed: requires Docker on the host | **Changed default:** in the same witness-a rerun the manifest named `cc5082fa…` and `5e5228da…`; neither checkout moved, and status reports the default as informational. **Explicit setup prepares current lockfiles:** every rerun ran `npm ci` on the checked-out lockfiles. **Startup does not install or update:** `post-start.sh` run in witness-a here changed no fingerprint, no `.package-lock.json` inode or mtime in any `node_modules`, and no global package; it reported nine explicit problems (no workspace, `.codex`, `.pi` or volume mounts here; no global Playwright MCP) and exit 1; a deliberately wrong Codex pin is reported as a mismatch without an update. Static assertion: post-start contains no install, update, fetch, pull, checkout, reset or clean. **Status:** reports branch, HEAD, dirty counts, remotes and the pins separately; exit 1 with `MISSING`, `NOT A GIT CHECKOUT ROOT`, `NO REMOTE NAMES …` or an uninstalled provider | `e12-a2-rerun-setup.log`, `e13-post-start-*`, `e13-status-*` |
| E14 | Partly executed; mounts, first login and reconnect authored only: requires Docker on the host | The image copies no file (no `COPY`/`ADD`, ignore-all context); no credential pattern in the committed files; host state is bind-mounted only; the witness installs needed no npm credentials. Mount behavior, first logins and reconnect are in the host procedure | `e10-static-checks.log`, `e11-*` logs |
| E15 | Authored and statically checked, not executed: requires Docker on the host | `postCreateCommand`/`postStartCommand`, `shutdownAction: none`, `init: true`, `remoteUser: app`, the restart variable and the explicit-failure paths are asserted statically; post-start's failure reporting was executed outside a container (E13) | `e10-static-checks.log`, `e13-post-start-current-container.log` |
| E16 | Partly executed in the current container, not the new image | From witness-a's agent: `npm run serve -- --project <fixture copy> --agent fake` answered `/api/v1/project` and `/api/v1/plans` on 4180; `npm run dev:web -- --port 5181 --strictPort` served the client and proxied `/api/v1/project`; playwright-core 1.63.0 drove `/usr/bin/chromium` 154 to render the plan list from 5181. The exact started PIDs were stopped. `npm run type-check` passed in all three witness projects (agent 9 s, toolkit 4 s, audit 4 s). cucumber-viz is not in the image or any setup step. The new image's tools and Playwright MCP registration are in the host procedure | `e16-*` |

## Durations

| Step | Warm npm cache (witness-a) | Empty npm cache (witness-d retry) |
| --- | --- | --- |
| Whole fresh setup, both clones included | 31 s | — |
| ramify-audit clone | — | 2 s |
| Agent `npm ci` (503 packages) | 4 s | 7 s |
| Toolkit root `npm ci` (230) | 3 s | 3 s |
| Toolkit example `npm ci` (233) | 2 s | 2 s |
| Toolkit site `npm ci` (1,272) | 6 s | 35 s |
| Audit `npm ci` with build (98) | 4 s | 4 s |
| Whole retry setup (one clone) | — | 55 s |
| Rerun with existing checkouts | 20–21 s | — |

npm's own figures. The empty cache was a fresh directory; the registries were
reached over this host's network.

## Host-side container witness procedure

Run on the Docker host with Docker Engine and Compose v2 (BuildKit), and the
Dev Containers CLI (`npm install -g @devcontainers/cli`) or VS Code. It uses a
dedicated witness parent and Compose project name, so it never touches the
real workspace or the toolkit container. Record every command's output under
`$H/evidence/`. `<ramify>` is the host path of the toolkit checkout mounted at
`/ramify` today.

```sh
H=~/ramify-workspace-witness3
export COMPOSE_PROJECT_NAME=ramify-witness3
mkdir -p "$H" ~/.ssh ~/.claude ~/.codex ~/.pi && touch ~/.gitconfig
git clone <ramify>/.plan32-migration/filtered/extracted-main.bundle "$H/ramify-agent"
git -C "$H/ramify-agent" log -1 --format=%H           # record the candidate
dc() { devcontainer exec --workspace-folder "$H/ramify-agent" "$@"; }

# E10, E11, E15: creation runs setup, then post-start.
devcontainer up --workspace-folder "$H/ramify-agent" 2>&1 | tee "$H/evidence/up-1.log"
#   expect "transferring context" of a few bytes, "=== Setup complete", "post-start: ready"
C=$(docker ps -q --filter label=com.docker.compose.project=$COMPOSE_PROJECT_NAME)
docker inspect "$C" --format '{{json .Mounts}}' | jq .   # /workspaces bind = $H; five ramify-witness3_* volumes; five host-state binds
docker volume ls --filter label=com.docker.compose.project=$COMPOSE_PROJECT_NAME
ls -la "$H"; git -C "$H/ramify" branch -vv; git -C "$H/ramify-audit" branch -vv
dc bash -lc 'id; ps -o pid,comm -p 1; stat -c "%U %n" /workspaces/*/node_modules /workspaces/ramify/site/node_modules /workspaces/ramify/examples/collection-review/node_modules'
#   expect uid 1000 app, PID 1 docker-init (tini), every node_modules owned by app
dc bash -lc 'sh -c "sleep 1 & exec true"; sleep 3; ps -eo stat,pid,ppid,comm | awk "\$1 ~ /Z/"'   # expect no zombie (PID reaping)
docker inspect -f '{{.HostConfig.RestartPolicy.Name}} {{.HostConfig.Init}}' "$C"   # expect "no true"
dc bash -lc 'cd /workspaces/ramify-agent && for d in . ../ramify ../ramify-audit; do git -C $d rev-parse --show-toplevel; done'

# E13, E15: startup only checks.
dc bash -lc 'stat -c "%i %Y %n" /workspaces/*/node_modules/.package-lock.json; claude --version; codex --version'
docker restart "$C" && devcontainer up --workspace-folder "$H/ramify-agent" 2>&1 | tee "$H/evidence/up-2.log"
dc bash -lc 'stat -c "%i %Y %n" /workspaces/*/node_modules/.package-lock.json; claude --version; codex --version'   # identical
dc bash -lc 'sudo mv /usr/bin/rg /usr/bin/rg.hidden; bash .devcontainer/post-start.sh; echo exit=$?; sudo mv /usr/bin/rg.hidden /usr/bin/rg'   # expect NOT READY: ripgrep, exit=1
dc bash -lc 'bash .devcontainer/status.sh; echo exit=$?'

# E11–E13 inside the container: repeat the script cases with real volumes.
dc bash -lc 'bash .devcontainer/setup.sh; echo exit=$?'   # idempotent rerun; fingerprints as in this iteration's tool-fingerprint.sh

# E15: missing host state fails creation explicitly (uses a scratch HOME, not the real one).
mkdir -p /tmp/witness-home/.ssh /tmp/witness-home/.claude /tmp/witness-home/.codex && touch /tmp/witness-home/.gitconfig
HOME=/tmp/witness-home COMPOSE_PROJECT_NAME=ramify-witness3-missing devcontainer up --workspace-folder "$H/ramify-agent"; echo exit=$?
#   expect a bind-source error for /tmp/witness-home/.pi and no container
#   (the second project shares the witness parent; remove its container and volumes afterwards)

# E14: no credentials in the image; logins and reconnect through the mounts.
docker run --rm --entrypoint sh "$(docker inspect -f '{{.Image}}' "$C")" -c 'ls -la /home/app; find / -xdev \( -name auth.json -o -name .credentials.json -o -name .npmrc \) 2>/dev/null'
dc bash -lc 'ls ~/.claude ~/.codex ~/.pi/agent; codex login status; cd /workspaces/ramify-agent && npx pi --list-models | head'
docker compose -p "$COMPOSE_PROJECT_NAME" down   # keeps the volumes
devcontainer up --workspace-folder "$H/ramify-agent"
dc bash -lc 'codex login status; cd /workspaces/ramify-agent && npx pi --list-models | head; bash .devcontainer/status.sh'

# E16: development commands, ports, browser tooling, no cucumber-viz.
dc bash -lc 'command -v cucumber-viz || echo "cucumber-viz absent"; claude mcp get playwright; playwright-mcp --version'
dc bash -lc 'cd /workspaces/ramify-agent && cp -r subs/harness/fixtures/collection-review /tmp/fixture && (npm run serve -- --project /tmp/fixture --agent fake > /tmp/serve.log 2>&1 &) && (npm run dev:web -- --port 5181 --strictPort > /tmp/web.log 2>&1 &) && sleep 8 && curl -s localhost:4180/api/v1/project && curl -s localhost:5181/api/v1/project'
dc bash -lc 'cd /workspaces/ramify-agent && npm run type-check && cd ../ramify && npm run type-check && cd ../ramify-audit && npm run type-check'
```

### E17: recreation persistence (iteration 4)

Run in the same witness, with `H`, `COMPOSE_PROJECT_NAME` and `dc` as above,
before removing it. Every repository change is made inside the container, so
linked worktrees record their `/workspaces/...` common directories. The
fingerprint is iteration 3's `tool-fingerprint.sh.txt`.

```sh
cp <ramify>/.plan32-migration/evidence/iteration3/tool-fingerprint.sh.txt "$H/evidence/fingerprint.sh"
cat > "$H/evidence/e17-place.sh" <<'EOF'
set -euo pipefail
for r in ramify-agent ramify ramify-audit; do
  cd "/workspaces/$r"
  git switch -c "witness/e17-$r"
  echo "e17 committed $r" > E17-COMMITTED.txt
  git add E17-COMMITTED.txt && git commit -qm "witness: E17 local commit"
  echo "e17 staged" >> README.md && git add README.md                 # staged edit
  echo "e17 unstaged" >> E17-COMMITTED.txt                            # unstaged edit
  echo "e17 untracked $r" > E17-UNTRACKED.txt                         # untracked file
  git worktree add -q "/workspaces/worktrees/e17-$r" -b "witness/e17-wt-$r"
  echo "e17 worktree edit" >> "/workspaces/worktrees/e17-$r/README.md"
  echo "e17 worktree untracked" > "/workspaces/worktrees/e17-$r/E17-WT-UNTRACKED.txt"
done
date -u +%FT%TZ > /workspaces/evidence/e17-artifact.txt
EOF
cat > "$H/evidence/e17-fingerprint.sh" <<'EOF'
set -uo pipefail
bash /workspaces/evidence/fingerprint.sh /workspaces/ramify-agent /workspaces/ramify /workspaces/ramify-audit \
  /workspaces/worktrees/e17-ramify-agent /workspaces/worktrees/e17-ramify /workspaces/worktrees/e17-ramify-audit
for r in ramify-agent ramify ramify-audit; do
  echo "## $r worktrees"; git -C "/workspaces/$r" worktree list --porcelain
  echo "gitfile $(cat "/workspaces/worktrees/e17-$r/.git")"
  echo "remote branches containing witness/e17-$r: $(git -C "/workspaces/$r" branch -r --contains "witness/e17-$r" | wc -l)"
  echo "FETCH_HEAD mtime $(stat -c %Y "/workspaces/$r/.git/FETCH_HEAD" 2>/dev/null || echo none)"
done
sha256sum /workspaces/evidence/e17-artifact.txt
EOF
dc bash /workspaces/evidence/e17-place.sh
dc bash /workspaces/evidence/e17-fingerprint.sh > "$H/evidence/e17-before.txt"
docker ps -a --filter label=com.docker.compose.project=$COMPOSE_PROJECT_NAME --format '{{.ID}} {{.Image}} {{.CreatedAt}}' | tee "$H/evidence/e17-container-before.txt"

docker compose -p "$COMPOSE_PROJECT_NAME" down          # not -v: the dependency volumes stay
docker ps -a --filter label=com.docker.compose.project=$COMPOSE_PROJECT_NAME   # expect no container
devcontainer up --workspace-folder "$H/ramify-agent" 2>&1 | tee "$H/evidence/e17-up.log"
#   creation runs setup again: expect "ramify: existing checkout on witness/e17-ramify ...; left as it is"
#   and the same for ramify-audit, and no clone
docker ps -a --filter label=com.docker.compose.project=$COMPOSE_PROJECT_NAME --format '{{.ID}} {{.Image}} {{.CreatedAt}}' | tee "$H/evidence/e17-container-after.txt"   # a new container ID
dc bash /workspaces/evidence/e17-fingerprint.sh > "$H/evidence/e17-after.txt"
diff "$H/evidence/e17-before.txt" "$H/evidence/e17-after.txt" && echo IDENTICAL   # expect IDENTICAL

# Worktree Git operations reach the mounted common directories.
dc bash -lc 'set -e; for r in ramify-agent ramify ramify-audit; do
  git -C /workspaces/$r worktree list
  git -C /workspaces/worktrees/e17-$r status --short --branch
  git -C /workspaces/worktrees/e17-$r add README.md E17-WT-UNTRACKED.txt
  git -C /workspaces/worktrees/e17-$r commit -qm "witness: E17 commit after recreation"
  git -C /workspaces/$r log -1 --format="%H %s" witness/e17-wt-$r      # the new commit, seen from the main checkout
  git -C /workspaces/$r worktree prune --dry-run --verbose                # expect nothing to prune
done' 2>&1 | tee "$H/evidence/e17-worktree-ops.log"
```

E17 passes when the diff is empty (including each `FETCH_HEAD` mtime, so
nothing was fetched or recloned), the container ID changed, setup reported
both companions as existing checkouts left as they are, and each worktree
commit is visible from its main checkout. Copy `$H/evidence/e17-*` to the
migration evidence before removing the witness.

With VS Code, also: open `development.code-workspace` and confirm three Git
repositories in Source Control; forward 4180 and 5181 from the Ports panel and
load the client; close the window and confirm `docker ps` still lists the
container (`shutdownAction: none`). For the restart policy, set
`RESTART_POLICY=unless-stopped` in `$H/ramify-agent/.devcontainer/.env`,
recreate the container and confirm `docker inspect` reports `unless-stopped`;
restarting the Docker daemon is stronger evidence, a host reboot is not
required. Afterwards remove the witness:
`docker compose -p ramify-witness3 down -v`, the `-missing` project if one was
created, and `$H`.

## Limits and decisions for the orchestrator

- No container was built or started. E10, E15 and the container parts of E13,
  E14 and E16 remain unexecuted until the host procedure runs; iteration 4's
  recreation witnesses depend on the same host.
- Unverified assumptions the host run must confirm: Docker creates an absent
  companion's volume mount points on the host owned by root (setup handles
  this; the state was simulated with `sudo mkdir`); the VS Code Git credential
  helper is available to `postCreateCommand`, so the private ramify-audit
  clones during creation (otherwise setup fails clearly and is rerun from an
  editor terminal); the Dev Containers tooling derives the Compose project
  name from the folder unless `COMPOSE_PROJECT_NAME` is set.
- Decision: `~/.npmrc` is not mounted, because no install needs it. If
  provider releases should be published from inside the container with a
  persistent token, add a mount (it would then be required) or another
  documented mechanism. The current container's `~/.npmrc` token, and its
  `~/.pi` login, are in its writable layer: copy `~/.pi` to the host (or log in
  again) and recreate the token before the old container is retired.
- Decision: the whole host `~/.codex` is shared with the new container. Its
  `config.toml` is the host's, not the toolkit image's seeded file, and Codex
  sessions, logs and memories are shared with the host and any other container
  mounting it. The toolkit container still mounts only `auth.json`. Migrating
  the archived `~/.codex/memories` from iteration 1 into the host directory is
  left to iteration 5.
- The web development port is passed as a flag rather than set in
  `subs/web/vite.config.ts`. Setting `server.port: 5181` with `strictPort`
  there is a one-line alternative if `npm run dev:web` alone should use it.
- Chromium comes from Debian's package index at build time and is not pinned.
  `@playwright/mcp` 0.0.83 pins its own `playwright` range, not an exact build.
- Witness checkouts remain in the container's writable layer:
  `witness-a` (1.9 GB, dirty companions kept for inspection), `witness-c`,
  `witness-d` (1.8 GB) and `witness-e`. They are disposable. The repository is
  preserved in `/ramify/.plan32-migration/filtered/extracted-main.bundle`.
