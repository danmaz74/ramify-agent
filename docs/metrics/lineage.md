# Lineage measurements

**Status:** implemented by [Plan 9](../plans/09-session-model-and-transcripts/main-plan.md),
iteration 10; the local-fork group was added after the gpt-6.1-sol
postmortem of 11 October 2026. Not an empirical validation claim. **Policy identifier:** `lineage/2`.

This policy follows the [measurement principles](measurement-principles.md)
and uses the [metrics glossary](glossary.md). It compares segments by the
start their executor made: what a fork inherits and costs against a fresh
start, how a continued session grows, what a repair costs, how often starts
degrade and sessions are replaced, and how many forks each context generation
and the local sessions serve. It is versioned apart from `kpi/1` and reads no
scope size.

## Versions

`lineage/2` adds the `fork.local` group and `forks-served.local`. Every
measurement of `lineage/1` keeps its definition, so a value of one ID is
comparable across the two versions. The identifier still changes, because it
names the set of measurements: a response kept under `lineage/1` lists no
local-fork group, and without a new identifier a reader could not tell a
policy that had no such group from a run that had no local fork, whose group
is `not-applicable`. The metrics response accepts both identifiers; a run is
measured under `lineage/2`.

## Inputs

| Input | Record |
| --- | --- |
| Requested start | `invocation-ended.degraded.requested` when present; otherwise `session-opened.fork` and `invocation-started.start`/`continues` |
| Actual start | The requested start, or the `degraded` relation of `invocation-ended`; unknown where the outcome records no start |
| Context generation | A fork's `fork.generation`; generation 1 with the initial architect, and each `global-context-rebuilt` generation |
| Fork source | A forked session's `session-opened.fork.from.session`, and the `role` of that session's own `session-opened` |
| Starting context size | The first `context` observation of the invocation's observation log |
| Usage | The input, cache-read, cache-write and output tokens of `outcome.json` |

A separate fresh fallback preserves its intended fork/continue request in the
existing degradation relation while its actual operation remains fresh. It has
no inherited fork generation. Historical rebuild/replacement records remain
inputs; Plan 24 creates no new replacement parent after context loss.

No executor ref is read. A running segment is in no measurement until it
ends, since its actual start is known only then.

## Groups

Each segment belongs to the group of its actual start, or of its requested
start where the actual one is unknown.

| Group | Segments |
| --- | --- |
| `fork.generation-<g>` | Forks of context generation `g` |
| `fork.local` | Forks whose source session is not the initial architect's or a global fork's: a scope review, design review, context selection or reconciliation forked from a local architect |
| `fresh-fork` | Global-fork segments whose start was fresh, including ordinary fallback and historical rebuild starts |
| `repair` | Continued segments whose reason is `repair` |
| `fresh-engineer` | Engineer segments whose start was fresh, reconstructions included |

Each group has one measurement per segment cost measure: `start-context`,
`input`, `cache-read`, `cache-write` and `output`, such as
`fork.generation-1.cache-read`. The value is the mean per segment, with the sum
as numerator and the segment count as denominator. A generation is listed
whether or not it served a fork, and so is `fork.local`.

## Measurements

| ID | Unit | Calculation |
| --- | --- | --- |
| `<group>.<measure>` | tokens per segment | Mean of the measure over the group |
| `continuation-growth` | tokens per continuation | Mean over continued segments of the starting context size less the previous segment's |
| `degraded-starts`, `degraded-starts.continue`, `degraded-starts.fork` | degraded starts per requested start | Degraded starts over requested continuations and forks whose actual start is known; the executor's reasons are the evidence |
| `replacements.reconstructed`, `replacements.context-rebuilt` | replacements per session | Sessions that replace another for the reason, over every session of the run |
| `forks-served.generation-<g>` | forks | Forks of generation `g` whose actual start was a fork |
| `forks-served.local` | forks | Local forks whose actual start was a fork; the evidence names each fork's source session |

## States

- A group with no segment is `not-applicable`.
- A segment whose starting context size or usage is missing, or whose actual
  start is unknown, makes its group's measurement `unavailable`, with the
  known subtotal, the coverage and each missing input's reason.
- A requested start whose actual start is unknown makes `degraded-starts` and
  `forks-served` `partial`, with the known count and coverage.
- Replacements are counted from the log, which records every session opened,
  so their zero is measured.

## Degraded starts

A fork or continuation the executor made fresh inherited nothing. It is
measured as a fresh start of its role, counted among the degraded starts, and
excluded from fork cost, continuation growth, repair cost and forks served.
A separate fresh fallback records no fork relation, so it names no source and
is in no local-fork measurement; `degraded-starts.fork` counts it.
The next continuation of its session grows from it.

The same rule reaches `kpi/1`. `session-weighted-total` sums each session's
scope once, at its largest, because a continued session holds its scope in
one model context. A degraded continuation loaded its scope into a new one,
so from there on its session is a second term of the sum. `session-count`
still counts harness sessions.

## Interpretation

The comparisons are descriptive. A fork and a fresh global fork differ in more
than their start: the fresh one is oriented from the records. A repair and a
fresh engineer differ in their work. The starting context size is an estimate
taken after the segment's first model call, so it includes that call's
exchange as well as what was inherited.
