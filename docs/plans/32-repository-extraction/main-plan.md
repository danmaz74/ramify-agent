# Plan 32: independent repository and persistent development workspace

**Date:** 2026-10-10. **Status:** in implementation; iterations 1 and 2 complete;
iteration 3 complete with its container witnesses pending host Docker.
**Execution:** five serial iterations, each with its own implementation handoff.
**Source inspected:** `/ramify`, branch `ramify-agent`, commit
`0656317adb32b91f9069e104b482d011eddeabed`, with existing modified and
untracked files. Companion branches and worktrees are changing independently;
these observations are inputs to planning, not the extraction candidate.

## Outcome

ramify-agent has its own Git repository and a devcontainer in which its
developer can also edit independent Ramify and ramify-audit checkouts. Source,
Git metadata, local worktrees and retained evidence survive container recreation.
Each project keeps its own package, lockfile, commands and audit. The harness
continues to consume installed, exactly pinned provider releases.

The ordinary workflow is: clone ramify-agent into the documented workspace
directory, open its devcontainer, let setup prepare missing companion checkouts,
open the supplied three-folder editor workspace, and work in the appropriate
repository. Changing a companion checkout does not change the harness's runtime.

This plan implements the repository separation and workspace proposal requested
on 2026-10-10. It does not depend on completing Plans 30 or 31. Before extraction,
iteration 1 establishes which completed or pending work belongs in the candidate
and where remaining branches continue. Never cut over a running implementation
or discard its worktree to satisfy this plan.

[Acceptance](acceptance.md) · [Iteration manifest](iterations/manifest.json)

## Current evidence and gaps

| Observed input | Consequence for this plan |
| --- | --- |
| [Package](../../../package.json) pins `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2; [instructions](../../../AGENTS.md) forbid imports from toolkit source. | Preserve package boundaries and pins unless an independently justified provider update is needed. |
| [Agent ignore file](../../../.gitignore) only ignores build output and scratch. Parent ignore rules cover dependencies and generated views. | Make the extracted project's ignore rules complete without excluding current authored skills or plans. |
| `skills/module-architect` is a tracked symlink to the toolkit's `.claude/skills/module-architect`; [prompt loading](../../../subs/harness/src/prompts/packages.ts) reads it at runtime. | Carry a self-contained skill snapshot and its supporting guidance. A sibling checkout must not satisfy this runtime dependency accidentally. |
| [README](../../../README.md), [harness principles](../../harness.principles.md), [glossary](../../glossary.md) and current testing/plan commands refer to the containing repository. | Correct active instructions and links; preserve historical evidence with its original identities. |
| The current toolkit devcontainer bind-mounts `/ramify`; `/home/app/ramify-audit` is in the container writable layer. | Move companion source and Git metadata into persistent host storage before replacing the old container. |
| Existing audit refs include `refs/notes/audit` and a project-specific notes ref. | Archive them with the old repository. Filtering changes source identity; old evidence is not qualification of the new repository. |
| Plans 30/31 and other work are modified or untracked here; `feat/plan30-harness-steps` contains additional commits. | Refresh the inventory and assemble an explicit candidate, including this plan, instead of extracting only the current HEAD. |

Paths in the table are relative to this plan in the agent project. The toolkit's
root `package.json`, `module.ramify`, `ramify-audit.json`, `tsconfig.json`,
`.gitignore`, `.devcontainer/`, `CLAUDE.md`, `README.md` and development guides are
also migration inputs; their cleanup belongs to iteration 5 in the toolkit
repository. No toolkit model or importability change is proposed.

## Workspace contract

### Layout and storage

The documented host layout is a dedicated directory, not an arbitrary parent
containing unrelated projects:

```text
ramify-workspace/
  ramify-agent/                 # new repository, devcontainer owner
    .devcontainer/
    development.code-workspace
  ramify/                       # independent toolkit repository
  ramify-audit/                 # independent audit repository
  worktrees/                    # newly created local worktrees
  evidence/                     # retained migration/audit/run evidence
```

Mount the host parent at `/workspaces`; default to
`/workspaces/ramify-agent`. In Compose, whose file lives under
`ramify-agent/.devcontainer/`, the parent source mount is `../..:/workspaces`.
The Docker build context is the agent repository, never the workspace parent.
Add Compose-scoped named volumes for the three root `node_modules` directories
and the toolkit's `site/node_modules` and reference-example dependencies. Other
worktrees use their project's ordinary preparation; never share first-party
source or build output through a dependency link.

The `.code-workspace` file lists `.`, `../ramify`, and `../ramify-audit` with
clear folder names. The parent workspace has no package manifest or Git root.
An independent audit always selects one repository's candidate and configuration.
Source mounts on a remote Docker host refer to that host's filesystem.

The container uses the existing Node 22 toolchain, Git, ripgrep, shell tools and
Chromium support, with a non-root user and `init: true`. Preserve
`shutdownAction: none` and a documented opt-in restart policy for the server.
Configure agent server port 4180 and web development port 5181, checking
companion port collisions before finalizing the configuration. Start development
services explicitly; opening the editor does not start a harness run.

### Companion bootstrap

`.devcontainer/companion-repos.json` contains exactly two entries, `ramify` and
`ramify-audit`, each with its repository URL and a full reviewed commit ID.
Use `https://github.com/danmaz74/ramify.git` and
`https://github.com/danmaz74/ramify-audit.git`. Iteration 1 selects and records
the actual commits from the current provider work; installed dependency pins
do not select those source commits. No configurable repository registry is added.

`.devcontainer/setup.sh` prepares missing companions at those commits on a
local development branch, creates persistent worktree/evidence directories,
and runs each project's documented dependency preparation. The agent uses
`npm ci`; the toolkit also prepares its reference example and site; the audit
checkout uses its own committed lifecycle. Setup does not run a direct full
test suite or silently repair a failed install. It verifies existing checkout
roots and expected remote identity before preparing them; an invalid/non-Git
directory or wrong repository produces a clear error and is left untouched.

For an existing companion, setup leaves HEAD, branch, tracked files and untracked
authored files unchanged. It never fetches, pulls, checks out, resets or cleans
an existing checkout. Manifest commits are initial defaults, not enforced live
checkout positions. Re-running explicit setup may reinstall dependencies after
lockfile changes; `postStartCommand` does not perform that reinstall.

Creation performs setup through `postCreateCommand`. Startup only checks mounts,
necessary dependency-volume ownership and configured tool availability. A small
read-only status script prints each repository's path, remote, branch, HEAD and
dirty state plus the agent's installed provider versions. Missing tools or
repositories remain explicit failures; they are not reported as ready.

Persist required authentication and CLI state separately from the container's
writable layer, using the existing host-auth approach and documented local
mount configuration. Include the Pi state used by live harness work. Record
required mount paths and first-login steps without copying credentials into
the image or repository. Pin the installed development CLI versions at
implementation time; startup never updates them automatically. Retain browser
tool support. Keep cucumber-viz's toolkit workflow/configuration in Ramify;
it is not required by the new agent container.

### Runtime dependency and skill boundaries

The nearby provider repositories are editable source, not runtime substitutions.
Keep the agent's registry pins and lockfile, resolve Ramify from its own
`node_modules/.bin`, and use installed ramify-audit. Do not add npm workspaces,
automatic `npm link`, `file:` dependencies or compiler aliases to siblings.

For normal cross-project changes, implement and qualify the provider, release
it through its own workflow, then bump the consumer's exact pin and qualify
that consumer. A pre-release experiment may install packed artifacts in a
disposable consumer worktree, retaining provider commit, tarball hash and
consumer base. It is never the default setup or release qualification.

Replace `skills/module-architect` with real files containing the complete
required skill and referenced guidance. Preserve upstream notices and record
the originating toolkit commit. Make required local references stay inside the
agent repository, carrying the necessary referenced toolkit guidance as a
small documented snapshot. Adapt only paths and onboarding needed for the split;
do not redesign skill behavior. Tooling guidance and writing rules that govern
agent development must also be stated locally or linked as explicit external
references rather than inherited from the toolkit's parent directory.

## History and migration contract

Iteration 1 records the current branch/commit/dirty state, relevant local
branches and worktrees, active jobs, selected untracked content, provider
checkout candidates and evidence locations. Preserve original repositories
with all required refs/objects and separate copies of modified/untracked files
and durable ignored evidence. A Git bundle alone does not contain working-tree
changes or reflog-only objects. A copied worktree alone may still depend on a
Git common directory left in the old container.

Assemble a named committed extraction candidate in an isolated checkout without
stashing, resetting, blanket staging or changing the user's checkout. Include
intended plans/skills and resolve overlapping branch work explicitly. Record
other local agent branches as migrated, retained with an archive pointer, or
pending integration. Preserve live work until a deliberate handoff makes it
safe to change its environment; this plan does not resume old runs in the new
path or translate their recorded identities.

Filter only a disposable clone using
`git filter-repo --subdirectory-filter ramify-agent`. Preserve the resulting
commit map and verify that the extracted root tree equals the selected
candidate's `ramify-agent/` tree before standalone fixes. Preserve authorship
and relevant history. Do not copy old audit refs into the new qualification
namespace or relabel their source hashes. Retain old refs, evidence and source
identity in the archive and establish new audit evidence on extracted commits.

Proposed new remote: `danmaz74/ramify-agent`, retaining the source repository's
visibility unless a different choice is made at execution. Iteration 1 records
the remote's availability/visibility and intended branch before publication.
Keep the agent's GPL-3.0-only license and existing notices. Leave the original
Ramify Git history intact; remove the current agent tree with a normal commit
only after the replacement is qualified, published and retrievable.

## Iterations

| Iteration | Capability and owners | Cases | Exit |
| --- | --- | --- | --- |
| [1. Preserve and extract](iterations/01-preserve-and-extract.md) | Migration candidate, original-repository archive, disposable filtered repository | E01–E04 | Content/history mapping and preservation verified; no source checkout changed. |
| [2. Make the agent self-contained](iterations/02-standalone-project.md) | Agent root instructions/configuration, carried skill, active documentation | E05–E09 | A root checkout works without parent files or companion source. |
| [3. Persistent devcontainer](iterations/03-persistent-devcontainer.md) | Agent development environment, fixed companion bootstrap, editor workspace | E10–E16 | Repeatable setup and visible independent repositories. |
| [4. Qualify the workspace](iterations/04-qualify-workspace.md) | Persistence witnesses, runtime isolation, exact agent candidate audit | E17–E20 | Container recreation and configured full audit pass. |
| [5. Publish and cut over](iterations/05-publish-and-cut-over.md) | New remote and host workspace, toolkit removal/cleanup, migration handoff | E21–E24 | Published agent and cleaned toolkit qualified; source/evidence survive old-container retirement. |

Each iteration writes its results beside its brief, with exact source identities,
executed cases and retained evidence paths. Large logs, bundles, container
artifacts and credentials do not belong in the plan directory. Evidence outside
Git lives in the persistent `evidence/` directory with a linked receipt.

## Verification and completion

Use [acceptance.md](acceptance.md) as the finite completion boundary. Reuse
existing focused tests for affected prompt/configuration paths; native Git,
Docker/container and browser claims require their actual boundary witnesses.
Do not add an ordinary test that launches processes in violation of the agent's
[testing rules](../../testing.spec.md). Shell/static checks and retained manual
witnesses are sufficient where a new test would merely mirror configuration.

From a clean committed extracted agent root:

```sh
node_modules/.bin/ramify-audit audit --cwd . --full --nested --json
```

The audited candidate must include the new container and bootstrap files;
document how their shell/configuration checks are retained alongside the
configured project audit, without silently excluding regression projects.
Use the toolkit's declared released audit after its cleanup. Repeat qualification
only if runtime/configuration content changes after the prior qualified candidate.
Publication and archival results may be recorded separately without treating a
later receipt-only commit as a different implementation qualification claim.

Completion requires: a retrievable independent agent repository; ordinary setup
and architect prompt loading without a toolkit parent; a usable three-repository
container; retained dirty source, Git metadata, worktrees and evidence after
container recreation; exact committed qualification of agent and toolkit
candidates; preserved historical work; and a cutover handoff identifying all
remaining branches and the new daily workflow. Audit establishes configured
execution health; migration receipts establish preservation and persistence.

## Deferrals and execution-time inputs

No new module decomposition, harness orchestration, Plan 30/31 implementation,
package publication policy, cross-repository semantic coordinator, shared build
system, runtime linking, background auto-updater, benchmark or cost gate is
included. Other-host storage profiles and a shared environment repository can
be added later if an actual workflow needs them.

The architecture choice is concrete. The execution-time inputs are the captured
agent candidate and pending-branch treatment, companion commit IDs, available
new-remote identity/visibility, CLI versions, host workspace path and credential
mount locations. Record them in iteration 1 or 3 before dependent work; do not
replace them with guessed commits or infer that old run evidence remains valid.

## Primary references

- [Split a subfolder into a new repository](https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository).
- [Multiple folders in a devcontainer](https://code.visualstudio.com/remote/advancedcontainers/configure-separate-containers).
- [Dev Container lifecycle and metadata](https://github.com/devcontainers/spec/blob/main/docs/specs/devcontainerjson-reference.md).
- [VS Code multi-root workspaces](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces).
- [Docker persistent volumes](https://docs.docker.com/engine/storage/volumes/).
