# Find removable compatibility layers

You are analyzing the repository in your current working directory. Do not
modify anything: no edits, no writes, no git commands that change state. Read,
search and inspect only. Your whole answer is the report; print it as Markdown.

## Policy that now applies

Across the three repositories ramify (the toolkit, `ramify.ts`), ramify-audit
and ramify-agent, compatibility with earlier versions is no longer a default
obligation. The owner's rule:

- Run state of ramify-agent (task records, events, sessions, run evidence,
  anything under `plans/<id>/.harness/`) is disposable. A finished run stays
  finished; an unfinished run restarts on current code. Nothing may keep
  reading, converting or tolerating an older run-state form.
- Compatibility matters only for long-lived committed files such as
  `ramify-agent.json`, `ramify-audit.json`, `module.ramify`, test-boundary
  files, published audit evidence, and for a package surface that another of
  the three repositories imports.
- When a long-lived file must change shape, the preferred way is a separate
  run-once conversion script that is deleted afterwards, never code that reads
  two formats.

## What counts as a compatibility layer

Code, schema, prompt or documentation whose only purpose is to accept, read,
convert, alias, default or tolerate an older form that the current code no
longer produces. Typical shapes:

- readers that accept several schema versions (`/1` and `/2`, `version`
  switches, optional fields that only old records omit)
- "legacy", "deprecated", "compat", "fallback", "migrate", "adopt", "upgrade",
  "old", "previous" branches or identifiers
- aliases mapping old names to new ones: stored role values, CLI commands,
  flags, config keys, event kinds, record kinds, export names
- adapter commands that re-express an old operation in terms of a new one
- normalization steps that rewrite old content into the current shape
- policy or capability "adoption" paths that upgrade an existing run or file
- feature flags or markers that exist only to tell old from new
- tests, fixtures and documentation sentences that exist only to protect any
  of the above

Not a compatibility layer: the single current format, ordinary validation of
malformed input, retries, and genuine runtime variation (different agents,
providers or project layouts).

## Method

1. Orient with the repository's AGENTS.md, README and layout. Note which
   package surfaces other repositories import (ramify is imported by
   ramify-agent and ramify-audit; ramify-audit is run by ramify-agent).
2. Search broadly: the terms above, schema version strings, `readonly ... ?:`
   fields guarded by presence checks, `??` defaults that fill old records,
   `switch` on version or kind, `Deprecated` markers, `alias`.
3. For every candidate, verify it. Find who still produces the old form. Use
   `git log -S` or `git log --follow` to see when the new form arrived and
   whether the old producer was removed. A candidate whose old form is still
   produced by current code is not removable; say so and drop it or mark it.
4. Estimate the removal: files, approximate lines, tests and fixtures that go
   with it, and any consumer in the other two repositories that would need a
   pin bump or change.

## Report format

Start with a summary table, one row per finding, ordered by removable lines
descending:

| # | Location | What it tolerates | Old form still produced? | Class | Est. lines | Consumers affected |

Class is one of:

- A: internal or run state, remove outright
- B: long-lived committed file, remove with a run-once conversion script
- C: package or CLI surface another repository uses, remove after that
  consumer changes (name it)

Then one short section per finding: the exact paths with line numbers, the
evidence that the old form is no longer produced, what the removal consists of,
and what would break if the verification is wrong. Finish with a section
"Areas inspected with nothing to remove" so the owner knows what was covered.

Be precise and skeptical. A wrong "removable" costs more than a missed one.
Plain, short sentences. No praise, no hedging language, no recommendations
beyond the removal itself.
