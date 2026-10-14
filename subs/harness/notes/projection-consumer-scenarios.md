# sc-001 / sc-002 consumer binding evidence

The retired production tree is preserved absent. No production implementation,
feature text, scenario state, declaration, discovery configuration or process
registration was changed for these bindings.

`src/tests/steps/projection-consumers.ts` is discovered by the existing global
Cucumber import patterns. Those patterns had no existing step files at binding
time. Only the eleven frozen expressions for sc-001/sc-002 are registered.
`src/tests/projection-consumers.test.ts` executes the same helper and oracle.

## Composition and fixture

`src/tests/helpers/projection-consumers.ts` uses real RunLog/commitRecord,
TranscriptWriter/ContentStore and document discovery during setup. It reuses
constructedRecord and repairExportFixture, rather than duplicating their schema
or authentication policy. The retained log includes an explicitly completed
run, a finished session with both blob and file transcript bodies, two ordered
cancelled consultations with exact accepted-but-undelivered answers, and an
authenticated refused repair incident plus its pending export payload.
Missing child invocation/transcript/usage evidence remains explicitly unavailable;
it is not manufactured or described as complete. This is retained reading evidence,
not a claim that a new execution passed a final gate.

RunService opens the retained evidence before capture. Real createApp constructs
real child RunQueries and SessionQueries through createQuerySource. In-process
queries use the same real entries, not fake answers. Consultation inspection uses
real runConsultationsCommand. FakeQueryEffects supplies only external agent,
audit, command/export, evidence CLI and Git-history seams. Dispatch/audit/command
attempts throw and are counted; the scripted unchanged Git range returns no
commits. No query-provider fake is injected. Export configuration is enabled,
not omitted to make exporter effects impossible.

Three rounds assert concrete terminal/session/repair values, contiguous event
ordering, transcript entries and exact body bytes, session list and polling
results, CLI consultation occurrence order, accepted/error/delivery values,
complete expected text (including retained missing-evidence diagnostics), JSON
indentation/newline, HTTP schemas and refusal codes, and exact CLI option refusal
stderr/exit status. Other supported run list/presentation reads additionally cross
check HTTP composition against the real in-process answer; these comparisons do
not replace the concrete oracles above. The reading inventory is nonempty and
includes run, events, repair presentation, sessions, transcript, blob/file bodies,
list, initial/cached polling, analysis, decisions, work items, capabilities,
scenarios, metrics and consultations. It is not an exhaustive query-boundary
qualification; scenarios sc-003 through sc-008 remain separate work.

After setup and service opening, capture covers **all** fixture project/durable
files: exact bytes, device/inode identity, size and mtime, plus the event-file
bytes and last service event sequence. Queries must preserve that capture and
zero external effect counters. Source-import/frozen-port and old-directory
assertions supplement, not replace, those observable assertions.

## Focused verification retained

From project root:

```
npm test -- subs/harness/src/tests/projection-consumers.test.ts subs/harness/src/tests/http-query-source.test.ts subs/harness/src/tests/consultation-inspection.test.ts subs/harness/src/tests/repair-export-command.test.ts
npm run type-check
npm run check:self
```

Current source results: 4 Vitest files / 25 cases passed; type-check exited 0;
structural check completed/passed with partial coverage, 0 errors, 0 warnings,
455 analysis limits. Full command output is retained at
`plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0114/shell/019.log`.
Earlier failing focused attempts and their diagnostics remain in shell logs
008–014; the external Git-process refusal in 014 was repaired by scripting the
reading history seam, not by adding a process exemption.

The exact prepared command was run, unchanged:

```
cd '/workspaces/worktrees/projections-extraction-successor-20261013' && '/workspaces/worktrees/projections-extraction-successor-20261013/node_modules/.bin/cucumber-js' '--config' 'subs/harness/src/tmp/ramify-focused/wi-001.i12/cucumber-focused-70cc3650eea5bc25.json' '--profile' 'ramify-focused'
```

The prepared profile actually includes all fourteen expanded feature cases,
not just the two assigned scenarios. Current result (shell/020.log): **2 passed,
12 undefined**, 24 steps passed / 64 undefined; exit 1. sc-001/sc-002 execute and
pass; sc-003–sc-008 (including seven sc-007 example rows) remain undefined.
This is not a successful whole selection, zero-case pass, or qualification of
those six other scenarios. No profile was guessed or narrowed to hide them.

The committed gate and its case results belong to the audit provider/harness;
no current committed gate verdict is asserted by these focused results. Bindings
propose sc-001/sc-002 with FakeQueryEffects so that the gate can select their
non-pending cases. Architectural comparison and final qualification remain open.
