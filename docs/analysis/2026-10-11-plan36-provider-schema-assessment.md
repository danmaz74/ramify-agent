# Plan 36 provider submission schema assessment

Date: 2026-10-11. Package examined: the installed exact dependency
`@earendil-works/pi-coding-agent@0.87.1` and its installed Pi AI/core packages.
This assesses the current adapter; it does not reproduce the historical paid run.

Pi's Responses serializer supports JSON Schema tool declarations. Its
`pi-ai/dist/api/openai-responses-shared.js`, `convertResponsesTools`, forwards
`getJsonSchemaToolParameters(tool, strict === true)`; the supported Codex
transport uses non-strict function declarations. A schema in the description
is still description text: the current adapter's native submission parameters
are a permissive object, not the complete typed action schema.

The constraint is execution admission. In the installed
`pi-agent-core/dist/agent-loop.js`, `prepareToolCall` invokes
`validateToolArguments` before the execution handler and before `beforeToolCall`.
The installed `pi-ai/dist/utils/validation.js` clones inputs, normalizes optional
nulls and coerces primitives against the executable parameter schema. A typed
string field receiving `1` reaches execution as `"1"`; a required field omitted
in `{}` is rejected before execution. Applied to final submissions, those
behaviors would change submitted values and keep malformed submissions outside
the harness's bounded rejection count.

The same loop's `declareToolChanges` derives the model's tool declarations from
the executable tools. Supplying typed model parameters and permissive executor
parameters through that interface would replace the declared tools, changing
the preserving transport's inherited native prefix. The existing adapter
therefore retains permissive native submission parameters and delivers the
complete schema in the declaration's description. Runtime validation remains
authoritative. Typed provider parameters require a supported admission interface
that preserves original arguments, bounded final rejection and immutable
already admitted declarations; the current adapter does not have one.

The guarded [Pi witness](../../subs/harness/subs/agent/subs/pi/src/tests/pi-agent.test.ts)
uses the installed validator to demonstrate typed coercion and rejection,
permissive preservation of both malformed inputs, and the actual scripted native
request's permissive parameters plus complete description schema. Existing
preserving-session tests retain exact inherited declarations and native prefixes.
The guarded [capability submission regression](../../subs/harness/src/tests/capability-submission.test.ts)
checks a failed preflight, a successful complete preflight, an empty final
submission and complete resubmission in one coordinator turn. The failed
preflight contributes no rejected final submission; the empty final contributes
exactly one. The submitted record contains the complete action. Preflight does
not reserve an action, and final validation still rejects a stale basis.

The [assignment declaration](../../subs/harness/src/work/assignment.ts) retains
its existing runtime shape and field errors while supplying an `allOf`/`anyOf`
relationship in generated JSON Schema: either the kind is breaking or the base
uses the single-module form. This relationship reaches both local and capability
submission declarations. It depends on scope form, including a `modules` array
of length one; breaking evidence, rationale and authorization still require
runtime validation.
