# I3 configured agent-tests failure repair

Assessment `as-0013` stopped during configured audit of
`40cf8909347d6e1acc5a42d223d96cd18cf666af`, before semantic review. Its artifact
SHA-256 is `0734fe23d90316a6bfcc2502ef49e8f2d8f03db7ec110825877150505e3252c2`;
the retained provider report commit is
`13f83242fbe603db0bc31e51ec63d65876382e53`, run ref
`refs/audited/runs/2026-10-20T05-08-51Z-40cf89093`.
[Extracted diagnostics](as-0013-agent-tests-failure.json) bind the artifact,
actual retained Vitest summary blob/SHA-256, counts and exact failure.

All 459 expected configured test files ran. The sole failure was ordinary
`CA26: failed combined gates retain their causes and permit correction past the
captured repair count` in
`subs/harness/src/tests/capability-acceptance.integration.test.ts`.
`helpers/acceptance-flow.ts:636` read missing `gates/ga-0007/attempt.json`
(Promise.all index 3, the fourth failed gate). The other five configured checks
passed; the retained Vitest summary has no load or unhandled errors. This is
independent of earlier reused audit-finding identities and is not evidence of
a Codex provider/control failure.

The ledger intentionally commits a log line before materializing its record
files. Its replay/events can therefore expose the fourth failed gate while
that gate's attempt file is still being written. The fixture waited for four
events, then read the live disk log and those files without a settled boundary.
Production ledger semantics are unchanged.

The fixture now waits for the subsequent actual capability-architect invocation
after four failed gates. That turn proves correction remains available beyond
the captured repair count; the scripted agent pauses there before proposing any
further gate. At this boundary all preceding gate writes/materialization have
completed, so the existing exact round/cause, no-handback and no-job-failure
assertions read stable records. The normal stop aborts the scripted wait after
those assertions; file-read errors still fail. Only this ordinary test helper changed. Production
recovery, provider control, gate/acceptance behavior and configured audit projects
are untouched.

Verification from the isolated project root:

- [Targeted CA26](verification/as-0013-ca26-targeted.log): passes.
- [Focused selection](verification/as-0013-agent-tests-focused.log): **212/212**,
  **15 files**, including all 15 capability-acceptance helper cases and the
  unchanged recovery/provider selection with **18 exact registered native cases**.
- [TypeScript](verification/as-0013-agent-tests-type-check.log): all four
  configurations pass.
- [Self-check](verification/as-0013-agent-tests-check-self.log): 0 errors,
  0 warnings, 781 existing analysis limits; partial coverage; 25 owners,
  1093 source files, 101 resources, 20035 accesses; exit 0.
- `git diff --check` passes; updated [source hashes](source-sha256.json) bind
  all 34 changed I3 source/test/registry/declaration/usage/skill files.

No direct full audit or broad live-model repeat was run. The coordinator must
rerun configured audit and still obtain semantic verification of `cf-0015`;
the halted assessment did not perform it. The protected specification after-blob
remains `d563faab5db2309f95878f632280d6f0d34e92b0`; exact `cf-0008` authority
stays held for final approval. No protected specification, principle, dependency,
global configuration or audit project changed.
