# Plan 32 acceptance cases

[Main plan](main-plan.md). These cases establish migration correctness and a
usable persistent development workspace. They do not measure performance or
qualify an old audit against rewritten Git identities.

## Preservation and extraction — iteration 1

| ID | Case and expected evidence |
| --- | --- |
| E01 | An execution-time inventory names agent/toolkit/audit branches, commits, dirty/untracked state, active worktrees/jobs, durable evidence and Git common directories. Ref/object backups and separate working-tree/evidence copies can be restored outside the old container. The original checkout's files/index/HEAD remain unchanged. |
| E02 | A committed extraction candidate includes intended current plans and local skills. Every pending agent branch/worktree has an explicit continuation, migration or archive disposition; live work is preserved. No plan is lost merely because it is untracked in `/ramify`. |
| E03 | Filtering a disposable clone makes the selected candidate's agent subtree the new root with equal tracked contents. Relevant authorship/history and the old-to-new commit map are retained. The original toolkit repository history is unchanged. |
| E04 | Old audit notes/refs and run evidence remain retrievable with original repository, paths and hashes; new source identities do not inherit a qualification claim. Remote target, visibility and companion initial commit IDs are recorded rather than guessed. |

## Standalone agent — iteration 2

| ID | Case and expected evidence |
| --- | --- |
| E05 | A fresh extracted root installs from its own manifest, lockfile and registry config with no toolkit parent or sibling source. Ramify CLI resolves to its installed package and provider versions equal the pins. |
| E06 | `skills/module-architect` is carried as real files with upstream provenance/notices. An existing architect package constructor loads the default skill and its required local reference closure from the standalone checkout, without a model call or dependency on companion files. |
| E07 | `git check-ignore` recognizes dependencies, builds, scratch and every inherited generated-view/staging/marker family; near-miss ordinary names and authored skills/plans remain trackable. Ignore rules neither hide intended source nor commit credentials. |
| E08 | Active README, agent instructions, testing instructions and current plan commands use the standalone root. Required current local links resolve; toolkit references use explicit stable external links or carried guidance. Historical source/run hashes and evidence remain unchanged. |
| E09 | Focused affected tests, type checks, structural checks and web build execute with the existing module tree, exposure rules, supported scripts and complete regression selection preserved. Existing failures are recorded independently of migration-induced failures. |

## Container and bootstrap — iteration 3

| ID | Case and expected evidence |
| --- | --- |
| E10 | The documented host layout bind-mounts the dedicated parent to `/workspaces`; agent is the default folder and the editor workspace exposes all three independent Git repositories. Docker build context contains only the agent repo. Dependency volumes are scoped to this container instance. |
| E11 | With both companions absent, setup clones the declared remotes at the declared full commit IDs, creates editable development branches and performs project-declared preparation. A failed clone/install fails clearly and can be retried without removing authored work. |
| E12 | With dirty companions on other branches, repeated setup preserves HEAD, branch, index, tracked/untracked source and remotes. A non-Git directory or wrong remote at a companion path is refused without replacement. |
| E13 | A changed companion manifest default does not move an existing checkout. Explicit setup prepares current lockfiles; startup neither installs/reinstalls dependencies nor updates checkouts/CLIs. Status reports actual branch/commit/dirty state and installed runtime pins separately. |
| E14 | Source/worktrees/evidence and required authentication/CLI state have documented persistent mounts. The container image/repository contains no copied credentials; first authentication and reconnect work through the chosen supported mount/configuration. |
| E15 | Container creation performs setup, ordinary startup only checks required state, missing required state is an explicit failure, and closing the editor preserves the running container. Non-root ownership, PID reaping and the chosen restart policy are exercised. |
| E16 | Agent serve and web development commands work at their documented ports, browser tooling is available, all three projects can run their declared development commands, and cucumber-viz/toolkit startup is not an agent prerequisite. |

## Workspace qualification — iteration 4

| ID | Case and expected evidence |
| --- | --- |
| E17 | Recreate the test container after placing a local commit/branch, staged and unstaged edits, an untracked file and a real linked worktree in each of the three repositories, plus retained workspace evidence. Compare before/after identities/content in all three; worktree Git operations still reach their mounted common directories. Source is not recovered merely by recloning remotes. |
| E18 | Move/change or temporarily hide companion source in an isolated witness while retaining the agent's installed dependencies. Structural checks and default architect package loading still work; no runtime link, relative source import or compiler alias reaches companions. Packed-artifact experiments remain opt-in in disposable worktrees. |
| E19 | The exact clean extracted agent candidate passes its full nested configured audit. Container/bootstrap shell and configuration checks, focused affected tests and the real container witnesses have retained results. Skips/failures/unrun checks remain explicit. |
| E20 | A migration receipt names host path, mount layout, repository identities, container/tool versions, dependency pins, audit source/outcomes, case evidence and limits; status is usable after reconnect without an automatic checkout or update. |

## Publication and cutover — iteration 5

| ID | Case and expected evidence |
| --- | --- |
| E21 | The qualified agent candidate is published to the recorded new remote and retrievable by a fresh clone. Its history, license, local skill assets, plans and normal setup survive; remote identity and qualified commit match the receipt. |
| E22 | A normal toolkit cleanup commit removes the agent subtree and its preparation/boundary/exclusion/current-document references without rewriting history or touching unrelated dirty work. The resulting exact clean toolkit candidate passes its declared released audit. |
| E23 | Before retiring the old container, copied audit/toolkit repos and remaining linked worktrees operate from persistent storage; preserved local branches, dirty source and evidence remain reachable. Rebuilds do not leave a dependency on the old container's Git common directories. |
| E24 | The final handoff names published commits, candidate mapping, archive/evidence locations, pending branch dispositions, host setup/reconnect commands and rollback procedure. Returning to archived old checkouts does not delete new repository work. Every required case has evidence; partial publication or unrun qualification is not completion. |
