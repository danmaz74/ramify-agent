# Provenance of the module-architect skill snapshot

This directory is a snapshot of the Ramify toolkit's module-architect skill
and the guidance it requires. Until Plan 32 it was a symbolic link into the
containing toolkit repository. The harness reads `SKILL.md` from here as the
default skill of its architect prompt packages
(`defaultSkillDirectory` in `subs/harness/src/prompts/packages.ts`), and a
role reads the references by their absolute paths in this directory.

- Upstream repository: <https://github.com/danmaz74/ramify>
- Upstream commit: `1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5`
  (branch `ramify-agent`, 2026-10-11)
- Upstream license: MIT, copyright (c) 2026 Ramify contributors. The complete
  notice is in [LICENSE](LICENSE), copied from the toolkit's root `LICENSE`.
  The rest of ramify-agent is GPL-3.0-only; these files keep their MIT notice.

## Files

| Snapshot path | Upstream path | Upstream blob | Changed |
| --- | --- | --- | --- |
| `SKILL.md` | `.claude/skills/module-architect/SKILL.md` | `bbf76e01cf3a` | no |
| `report.md` | `.claude/skills/module-architect/report.md` | `717cfdc4fd19` | no |
| `references/access.md` | `.claude/skills/module-architect/references/access.md` | `5969d00cb5a0` | no |
| `references/cognitive-decomposition.md` | `.claude/skills/module-architect/references/cognitive-decomposition.md` | `d944a74b5466` | link only |
| `references/discovery.md` | `.claude/skills/module-architect/references/discovery.md` | `5d057502a264` | no |
| `references/placement.md` | `.claude/skills/module-architect/references/placement.md` | `dca59b5f242b` | no |
| `references/refactoring.md` | `.claude/skills/module-architect/references/refactoring.md` | `51f5b112986b` | no |
| `guidance/module-architect.principles.md` | `docs/agents/module-architect.principles.md` | `f45abee0465d` | links only |
| `guidance/glossary.md` | `docs/agents/glossary.md` | `238a842f8891` | link only |
| `LICENSE` | `LICENSE` | `d3da3232b645` | no |

Unchanged files are byte-identical to their upstream blobs. The only edits
are link targets, so that every required reference stays inside this
repository:

- `references/cognitive-decomposition.md` links the Contracts Follow
  Responsibility principle at `../guidance/module-architect.principles.md`
  instead of the toolkit's `docs/agents/`.
- The two guidance files link the toolkit's importability principles and
  dependency glossary as absolute GitHub URLs pinned to the upstream commit.
  No skill workflow or reference links either document.

Skill behavior is unchanged. The harness's read-only adaptation of `SKILL.md`
remains in `packages.ts`.

## Updating

Take a newer upstream version deliberately: copy the files from a named
toolkit commit, reapply the link edits above, update this table and the
commit, and run the prompt-package tests. Never link the directory back to a
toolkit checkout.
