# The development workspace

ramify-agent's devcontainer is the ramify-agent checkout's environment. Beside
it, the container holds editable checkouts of two independent companions, the
[Ramify toolkit](https://github.com/danmaz74/ramify) and
[ramify-audit](https://github.com/danmaz74/ramify-audit). Source, Git metadata,
worktrees and evidence live on the Docker host and survive container
recreation. The harness still runs on its exactly pinned, installed
`ramify.ts` and `ramify-audit` releases; a companion checkout never replaces
them. Plan 32 defines the contract
([workspace contract](../plans/32-repository-extraction/main-plan.md#workspace-contract)).

## Host layout

Use a dedicated directory, not a parent shared with unrelated projects:

```text
ramify-workspace/          # mounted at /workspaces
  ramify-agent/            # this repository; owns .devcontainer/
  ramify/                  # toolkit checkout, created by setup if absent
  ramify-audit/            # audit checkout, created by setup if absent
  worktrees/               # linked worktrees of any of the three
  evidence/                # retained run, audit and migration evidence
```

The parent has no package manifest and no Git repository. The image is built
from this repository alone and copies none of its files.

## Before the first creation

On the Docker host, as the user who will own the files:

```sh
mkdir -p ~/ramify-workspace ~/.ssh ~/.claude ~/.codex ~/.pi
touch ~/.gitconfig
git clone https://github.com/danmaz74/ramify-agent.git ~/ramify-workspace/ramify-agent
```

Every bind-mount source must exist, or the container is not created. The
container user `app` has uid/gid 1000. If the host user's IDs differ, copy
`.devcontainer/.env.example` to `.devcontainer/.env` (git-ignored) and set
`RAMIFY_UID` and `RAMIFY_GID`. On a host that should bring the container back
after a reboot, set `RESTART_POLICY=unless-stopped` there too.

## First creation

Open `ramify-workspace/ramify-agent` in VS Code and choose **Reopen in
Container**, or run `devcontainer up --workspace-folder ramify-workspace/ramify-agent`.
Creation runs `.devcontainer/setup.sh`:

1. It verifies each existing companion path. An existing companion must be the
   top level of a Git checkout with a remote naming the expected repository,
   in any HTTPS, SSH or scp-like spelling. A non-Git directory or another
   repository stops setup before anything changes.
2. It clones each missing companion at the commit in
   `.devcontainer/companion-repos.json` onto the local default branch: `main`
   for ramify-audit and `dev/workspace` for the toolkit.
3. It creates `worktrees/` and `evidence/`.
4. It prepares dependencies: `npm ci` here; `npm ci`, then `npm ci` in
   `examples/collection-review` and `site` in the toolkit; `npm ci` in
   ramify-audit, whose `prepare` script builds it. It runs no test suite.

`ramify-audit` is private. Its clone uses the editor's Git credential
forwarding; without it (for example under the bare `devcontainer` CLI) the
clone fails, and you rerun setup from an editor terminal. A failure names the
failed step and exits nonzero. Rerunning is safe: completed clones are kept, an
interrupted clone is started again from `.setup-staging/`, and existing
checkouts are never changed.

## Working on ramify-agent

The container opens the ramify-agent checkout, `/workspaces/ramify-agent`, and
that window is the default for daily work. Terminals, `docker exec` and the
agent CLIs start there, so Claude Code and Codex read this repository's
instructions and key their per-project state by that path. The shell
prompt reads `app@ramify-agent`, which tells this container apart from the
toolkit's on the same host.

To change a companion, open `development.code-workspace` (**File > Open
Workspace from File**). It shows the three repositories in one window, with
ramify-agent first; in that window, choose the repository each new terminal
starts in.

Keep `/workspaces/ramify-audit` on `main`, and merge completed audit work into
`main` by default. Use side worktrees for implementation branches. Setup
preserves an existing checkout's branch; changing this default does not switch
an existing checkout automatically.

## Starting and reconnecting

Each container start runs `.devcontainer/post-start.sh`. It only checks: the
workspace and host-state mounts, the dependency volumes and their ownership,
and the pinned tools (Node 22, Claude Code, Codex, Playwright MCP, Chromium,
Git, ripgrep, jq). It ends with the status report and exits 1 on any missing
state. It never installs or updates dependencies, CLIs or checkouts.

Closing the editor leaves the container running (`shutdownAction: none`).
tini is PID 1 and reaps exited processes. Development servers are never
started automatically; start them again after the container restarts.

## Status

```sh
bash .devcontainer/status.sh
```

It prints each repository's path, remotes, branch, HEAD and dirty state, the
companion manifest's default beside the actual HEAD, and the installed
`ramify.ts` and `ramify-audit` against this project's pins. It is read-only and
exits 1 when a repository is missing or invalid or a provider release differs
from its pin.

## Updating dependencies and companions

Rerun `bash .devcontainer/setup.sh` after any of the five lockfiles changes.
The manifest's commits are initial defaults only: changing them does not move
an existing checkout. Update a companion with ordinary Git in its own
checkout. To clone one again, move its directory away and rerun setup.

## Ordinary commands

Run each project's commands from its own root. Here:

```sh
npm run serve -- --project <served copy> [--agent pi --model <model>]   # port 4180
npm run dev:web -- --port 5181 --strictPort                              # port 5181, proxies /api to 4180
npm run type-check
npm run check:self
```

Vite's default port, 5173, belongs to a cucumber-viz devcontainer, so pass the
port. The toolkit's ports (4080, 4300, 4301, 5180, 8787) and cucumber-viz's
(3000–3002, 3100–3102, 5173–5174, 8080, 8090, 9000, 9222) stay free. No port is
forwarded automatically; forward 4180 or 5181 from the Ports panel.

The toolkit and ramify-audit document their own commands. cucumber-viz is not
installed here; the toolkit's planning workflow stays in its own container.

Create a worktree with `git worktree add ../worktrees/<name> -b <branch>` from
any of the three repositories and run that project's preparation in it. A
worktree's `node_modules` is in the host tree, not in a volume.

## Dependency volumes

Compose mounts a named volume at each checkout's `node_modules`, and at the
toolkit's `site/node_modules` and `examples/collection-review/node_modules`.
Volumes belong to the Compose project, so a rebuilt container keeps them and
another workspace on the same host has its own. Its name comes from the folder
name (`ramify-agent_devcontainer`); give a second workspace on the same host a
distinct `COMPOSE_PROJECT_NAME`. A new volume is owned by root; setup and
startup give it to `app` without reinstalling. Removing a volume only requires
rerunning setup.

Before a companion exists, Docker creates its directory and these mount points
on the host, owned by root. Setup treats a directory holding nothing else as
absent and takes it over for the clone.

## Credentials and tool state

Bind mounts from the Docker host's home directory; nothing is copied into the
image or the repository:

| Host path | Container path | Holds |
| --- | --- | --- |
| `~/.gitconfig` | `/home/app/.gitconfig` | Git identity |
| `~/.ssh` | `/home/app/.ssh` | SSH keys for Git |
| `~/.claude` | `/home/app/.claude` | Claude Code login, sessions, memory |
| `~/.codex` | `/home/app/.codex` | Codex login, configuration, sessions, memories |
| `~/.pi` | `/home/app/.pi` | Pi login (`agent/auth.json`), models, sessions |

The directories are shared with the host and with other containers that mount
them. Claude Code and Codex key per-project state by absolute path, and these
paths are `/workspaces/...`. Claude Code's `~/.claude.json` stays in the
container, so a recreated container asks its first-run questions again and
setup registers the Playwright MCP server again.

First logins, inside the container, when the host state has none yet:

- Claude Code: run `claude` and log in.
- Codex: run `codex` and log in; trust the `/workspaces` projects when asked.
- Pi: from this repository, run `npx pi`, type `/login` and choose the
  subscription (see the [README](../../README.md#commands)).

`~/.npmrc` is not mounted: every dependency installs from the registries the
projects name, without credentials. To publish a provider release from a companion checkout,
run `npm login --registry https://npm.braimax.com/` in the container; the token
stays in the container and is lost when it is recreated.

## Remote Docker hosts

Bind-mount sources, including `${localEnv:HOME}`, are paths on the machine
whose Docker engine creates the container. Connect the editor to that machine
(for example with Remote-SSH) and keep the workspace and the host-state
directories there; a local editor pointed at a remote engine through
`DOCKER_HOST` would name local paths that do not exist remotely. On Docker
Desktop, file ownership in bind mounts is mapped by the virtual machine, and
the uid settings may not apply.
