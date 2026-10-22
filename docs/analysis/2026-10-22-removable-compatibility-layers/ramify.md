| # | Location | What it tolerates | Old form still produced? | Class | Est. lines | Consumers affected |
|---|---|---|---|---|---:|---|
| 1 | `subs/daemon/src/launcher.ts` and launcher tests | The retired `.lock.reclaim` startup guard | No production writer | A | 35 | No direct consumer changes |
| 2 | `.devcontainer/claude-mcp-setup.sh` | An earlier Claude user-level Chrome DevTools registration | No Claude registration writer here; Codex’s separate registration remains current | A | 25 | Developer setup only |
| 3 | `scripts/measurements/archive.mjs` and archive tests | Gzip evidence without indexed member metadata | No production writer in the measurement archive pipeline; 26 committed records remain | B | 25 | Local evidence verifiers; no cross-repository API |
| 4 | `subs/daemon/src/api-view-publisher.ts` | Architect views carrying older schema numbers | Current renderer produces only `/3` | A | 20 | Existing generated views; no consumer code changes |

Estimates include compatibility-specific tests and comments, not whole files. They exclude temporary conversion scripts and compressed evidence bytes.

Both sibling repositories pin `ramify.ts` **0.5.2**. Ramify-agent imports `ramify.ts/analysis`, `ramify.ts/cli` and `ramify.ts/module-tree`; ramify-audit invokes the CLI for affected-module evidence. None of these findings removes those surfaces. No Class C removal was verified.

## 1. Retired daemon reclamation guard

**Paths**

- `subs/daemon/src/launcher.ts:73–81`
- `subs/daemon/src/tests/launcher.test.ts:64–71`
- `subs/daemon/src/tests/launcher.test.ts:143–152`
- Obsolete guard-absence assertion: `subs/daemon/src/tests/launcher.test.ts:44`

**Evidence**

Commit `dba3d40c` replaced the old `reclaimLock` implementation with `coordinateStart`. Its diff removed the production writer of `${endpoint.lock}.reclaim` but retained a reader and cleanup branch explicitly described as handling older launchers.

The current coordination implementation writes `${endpoint.lock}.coord` tickets in `subs/daemon/src/start-coordination.ts:12–21`. Searches of current source and scripts found `.reclaim` creation only in tests.

**Removal**

Delete the `.reclaim` inspection, live-holder wait and dead-holder cleanup branch. Remove its two dedicated tests and obsolete absence assertions.

Keep current start-lock validation, atomic publication, dead-process reclamation and coordination tickets. In particular, empty-lock rejection is malformed-input validation, not an old-format reader.

**If verification is wrong**

A launcher still using `.reclaim` would no longer coordinate with this branch. Concurrent startup could then violate the old launcher’s ownership assumptions.

## 2. Completed Claude MCP conversion retained in startup setup

**Paths**

- Historical replacement explanation: `.devcontainer/claude-mcp-setup.sh:4–9`
- Old user-level registration conversion: `.devcontainer/claude-mcp-setup.sh:36–52`
- Old project-level key in the cleanup list: `.devcontainer/claude-mcp-setup.sh:24`

**Evidence**

The script installs Playwright at `.devcontainer/claude-mcp-setup.sh:72–80`. It never installs a Claude `chrome-devtools` registration.

`git log --follow` traces this script to `8a7fce38`, where it already contained the explicitly labelled “one-time migration.” Subsequent history changes the project-config lookup but introduces no old Claude registration producer.

Chrome DevTools remains configured for **Codex** in `.devcontainer/codex-config.toml:17–19`. That is a different agent’s current configuration, not a removable alias.

**Removal**

Delete the user-level Chrome DevTools conversion block and its historical explanation. Remove `chrome-devtools` from the project-level cleanup list.

Keep Playwright’s current configuration and idempotence checks. Keep Codex’s Chrome DevTools configuration.

**If verification is wrong**

A reused Claude home that never received the conversion retains its Chrome DevTools registration alongside Playwright. Fresh setup is unaffected.

## 3. Unindexed gzip measurement evidence

**Paths**

- Old reader: `scripts/measurements/archive.mjs:179–184`
- Reader selection and historical-format documentation: `scripts/measurements/archive.mjs:186–196`
- Compatibility-specific test portions: `scripts/measurements/archive-stream.test.mjs:60–70`
- Missing-member fallback assertion: `scripts/measurements/fast-evidence.test.mjs:724`
- Compatibility promise: `scripts/measurements/README.md:344–348`
- Committed data: `scripts/measurements/results/index.json` and its referenced archives

**Evidence**

Commit `ff9ffabd` replaced the single-member archive writer with bounded, indexed gzip members. The current writer records member offsets, lengths and hashes at `scripts/measurements/archive.mjs:101–126`.

Current production writes through that archive pipeline always include `gzipMembers`. The old-form producers found in current code are test controls.

The committed index has **66 records**, of which **26 lack `gzipMembers`**. Nine of those exceed the current 4 MiB raw-member bound. Therefore this is not an outright deletion: existing committed evidence still needs conversion.

**Removal**

Use a run-once conversion to give those 26 archives the current indexed representation. Preserve their exact decoded JSON bytes and raw hashes. Rechunk oversized members and update compressed hashes, byte counts and references that bind those compressed identities.

Then delete `legacyChunks`, require indexed metadata for gzip input, and remove the compatibility-specific assertions and documentation. Keep raw JSON input support: current measurement commands still write raw reports.

**If verification is wrong**

Historical evidence verification fails when a verifier encounters an unconverted archive. Changing compressed bytes without updating binding references also invalidates evidence identities.

## 4. Older architect-view schema acceptance

**Paths**

- Any-version schema pattern: `subs/daemon/src/api-view-publisher.ts:43–44`
- Any-version reader: `subs/daemon/src/api-view-publisher.ts:216–220`
- Replacement policy and call site: `subs/daemon/src/api-view-publisher.ts:383–405`
- Any-version replacement test: `subs/daemon/src/tests/architect-view-publisher.test.ts:359–371`
- Policy sentence: `subs/daemon/README.md:21`

**Evidence**

Commit `eb57fbf8` advanced architect output to `/2` and added `ANY_ARCHITECT_SCHEMA` specifically to replace views written by earlier versions. Commit `90cbdea6` advanced the output to `/3`.

The current renderer writes only `ramify.architect-view/3` at `subs/analysis/src/architect-render.ts:326`. The publisher already has the exact-current-schema predicate at `subs/daemon/src/api-view-publisher.ts:213–215`.

No current production renderer writes `/1` or `/2`.

**Removal**

Delete the any-version pattern and predicate. Use the existing exact-current-schema predicate when inspecting an existing target. Remove old/future-version replacement cases and the corresponding policy wording.

Keep current-schema replacement, symlink checks, ownership checks, transactional publication and crash recovery. These protect current output and are not compatibility layers.

**If verification is wrong**

A generated view left by another toolkit version blocks materialization until that generated directory is discarded. The removal does not change current catalog contents or consumer APIs.

## Areas inspected with nothing to remove

- **Package entries.** Inspected `package.json`, entry modules and package-entry validation. The root and `/analysis` exports were introduced together as public session entries. Their shared target does not establish a retired-name alias. The inventory entry still serves current production selection. Ramify-agent actively imports the CLI ownership decoder and module-tree canvas.

- **CLI.** Inspected argument parsing, dispatch, check/affected/ownership/materialize commands, formatting, codecs and schema fixtures. Current producers use Check `/4`, CLI errors `/2` and IPC `/3`. Old IPC peers are refused, not adapted. Batch fallback handles current daemon failure, not an earlier format.

- **Optional evidence fields.** Recovery, stages, timings and provenance remain absent in genuine current outcomes. Their presence checks are not evidence of old-record support.

- **Frozen schema tests.** The old Check `/3`, CLI `/1` and IPC `/2` fixtures are historical witnesses, but they also support current schema rejection and current carrier tests. No runtime dual-format reader was found behind them. They are not counted as removable wholesale.

- **`module.ramify`.** `subs/analysis/subs/descriptions/src/parse.ts:158–164` accepts only version 1. Removed test-profile syntax is rejected at `:271–272`. Exposure aliases are current language features, not compatibility aliases.

- **Catalogs and materialized API views.** Source catalog companion facts are required current fields. API views currently emit `ramify.api-view/1`. Truncation and unavailable-detail paths represent present analysis limits. Publisher stage/backup markers support current crash recovery.

- **Check and analysis journals.** The changed check produces the current document rather than replaying stored checks. The automatic full-analysis journal appends `ramify.automatic-full-analysis/1` events and does not load previous segments into runtime state. Its defaults select current locations and bounds.

- **Other scripts.** Measurement evidence composition checks exact historical/current identities; it does not normalize old payloads into current evidence. Final-contract validation reads archived review expectations without converting repository files. Older-schema expectations in some measurement assertions and the example hook are stale consumers, not compatibility readers.

- **Cucumber-viz config and constraints.** Inspected `cucumber-viz.config.ts`, `cucumber-viz.constraints.json`, the seal and launch/setup wiring. No dual-format handling exists in those files. The constraints file declares version 1.

  **Coverage limit:** this checkout contains cucumber-viz integration files, not its implementation. Docker wiring installs cucumber-viz **0.7.0** globally. Neither that global installation nor a local cucumber-viz package exists in this environment. Its config/constraints parsers and internal compatibility paths could not be verified. Roadmaps and plans were treated as context, not removal targets.

Inspection was read-only. No files were changed and no tests or materialization commands were run.
