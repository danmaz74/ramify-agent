# Iteration 1: author and inspect common passages

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Inspect the exact implementation checkout and take its clean committed baseline
full audit using the plan's command. Preserve unrelated work. Owner: harness
prompt/package and pure task-input rendering; review child owns review message
composition. Read the main plan, candidate inventory, current prompt packages,
the relevant renderers and `docs/testing.spec.md`.

## Goal

Produce concrete common passages and complete prompt examples before changing
runtime dispatch. Decide wording by inspecting what an agent would receive.

## Deliverables

- Extract/consolidate the selected substantive passages through ordinary helpers
  and existing package fragments. Retain existing whole procedures. Define each
  selected passage's explicit identity, inputs, consumers and freshness boundary
  beside its producer. Do not introduce a global registry or a general template
  engine.
- Implement renderable direct prose for all nine environment fields' selected
  destinations. Use effective current values; keep useful provenance out of
  model-visible navigation when it points to harness-only files.
- Resolve overlapping ownership of plan/package/scenario text, module pointers,
  focused command and stable binding rules. Do not perform semantic extraction
  or global whitespace normalization on already rendered documents.
- Assemble synthetic complete prompt drafts directly from these helpers,
  without switching production callers or building a second delivery pipeline.
  Packet-level inheritance is verified after integration in iteration 2. Use
  `src/tmp/` for disposable output, and retain selected review examples under
  this plan's `examples/` when writing the receipt. No captured private project
  data or massive historical packet copies are needed.
- Include fresh and continued architect/engineer messages, a scope fork, a fresh
  code review, the current design path, and representative catalog, capability,
  contract, failure and NFR tasks. Show inherited context separately from the
  actual next message. No new model call or prompt-workbench dependency.

## Verification

Own C01–C06. Extend existing pure prompt tests with exact facts and semantic
distinctions that must survive rendering. Run focused checks from
the repository root, starting with:

```sh
npm run test:quick -- subs/harness/src/tests/plan23-task-prompts.test.ts subs/harness/src/tests/engineer-briefing.test.ts subs/harness/src/tests/scenario-briefings.test.ts
```

Include tests of any newly added helper in this invocation. Record which
examples were inspected against which existing role/task contracts; automated
fact-preservation tests do not substitute for that wording review.

## Exit and handoff

Common passages and unique task text are readable together; no required intent,
authority, exact command or evidence condition disappeared. Runtime wiring
remains for iteration 2. Commit the scoped change and write `01-results.md`
with checks, example links, source paths and any unresolved contract issue.
The receipt is authored during implementation, not prefilled by this plan.
