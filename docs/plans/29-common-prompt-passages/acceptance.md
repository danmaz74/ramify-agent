# Plan 29 acceptance cases

[Main plan](main-plan.md). These cases verify composition, delivery and existing
authority contracts. They are not a runtime completeness matrix or a semantic
prompt-quality score. Use small synthetic records and scripted boundaries.

## Authored composition — iteration 1

| ID | Case and expected evidence |
| --- | --- |
| C01 | Shared work-item context renders identically for the same selected package across architect/engineer/reviewer producers. Different package selection or meaning remains distinct even if some text matches. |
| C02 | Whole captured plan/requirements and quoted JSON/code remain intact; shared passages have stable boundaries independent of adjacent headings and blank lines. No empty plan wrapper or accidental substring deletion. |
| C03 | Module/navigation and check passages include useful roots, source-area views, known revision/coverage, configuration and runner support once. Inaccessible views/harness source paths are absent from snapshot-only instructions. |
| C04 | Engineering receives exact focused command/cwd/arguments/environment once; stable binding/reporting rules have one home. Current state/revision/fakes and assigned scenario text remain complete and distinct from architect judgment. |
| C05 | Assignment authors see applicable defaults and ceilings; writers see effective overrides, actual cwd and relevant current constraints. Runtime-only limits do not become a prose dump. Small changing facts remain task prose. |
| C06 | Retained example prompts cover local orientation → assignment → completion, selector fork/fresh fallback, engineer fresh/repair, scope-review fork, code/design fresh, and representative rare-role branches. Inspect full assembled context, not merely fragments; record manual contract review and remaining issues. |

## Integrated delivery — iteration 2

| ID | Case and expected evidence |
| --- | --- |
| D01 | New packets for every currently supported role/task pair and fallback renderers have no environment JSON blocks. Tool schemas and literal JSON in supplied documents remain valid. Existing required submission/authority checks still reject invalid inputs. |
| D02 | Unchanged substantial passage is supplied once and inherited on continuation. Changed content is appended. A → B → A supplies A again after B. Matching an older historical version is insufficient. |
| D03 | Fork uses its exact source point, unaffected by later parent or sibling updates. Scope-review fork reuses the parent's same current package; independent fresh code review receives its own package. |
| D04 | Withdrawal followed by reactivation sends the passage again; task-specific current facts replace prior ones even when the current task has no snapshot/worktree authority of the previous task. Selector retention keeps its existing behavior. |
| D05 | On a supported legacy point, new-format delivery withdraws effective old environment entries once and supplies current prose. Historical inputs/hashes are unchanged. Retry of an already admitted legacy operation replays its original JSON packet byte-for-byte. |
| D06 | Same task with lost reusable context receives a complete ordinary fresh brief and preserves current tool, validator, destination, cwd and authority. Package mismatch retains existing refusal; no forced role rewrite or bypass. |
| D07 | Shared passage provenance names the actual loaded sources; manifests distinguish inherited/appended bytes and point identity. Historical `/1` and `/2` readers remain valid. Active historical tool declarations do not expand current permissions. |
| D08 | Review intent, comparison base/commit/tree, complete/omitted patch status, pending binding provenance and concern grounding retain their meanings. No guidance-grounding exception is introduced by Plan 29. |
| D09 | NFR prose preserves prepared tree versus HEAD, named comparison boundaries, dirty-start limitations, read scope, complete selected requirements, evidence and uncertainty. Action gets required accepted evidence without a request to open inaccessible harness records; assessment/investigation/action authority remains distinct. |
| D10 | Rare branches preserve supplied inputs: initial/principles/catalog check, placement, capability qualification/handback/reconciliation, selector reselection, standalone, consultation and fresh fallback, legacy contract/revision, failure analyst, NFR investigation/action/repair. Source-absent cwd, no obligations, unavailable focused command and limited views remain explicit where existing contracts require them. |

## Qualification — iteration 3

| ID | Case and expected evidence |
| --- | --- |
| Q01 | Scripted workflows join orientation/selection/assignment/completion, engineering repair and three reviews. Assertions distinguish complete effective context from newly appended text. Existing audit/semantic authority separation passes. |
| Q02 | Type checks, Ramify self-check and exact final committed configured full nested audit finish with retained outcomes. Ordinary tests have no external process calls; no new live-provider or native-boundary claim is introduced. |
| Q03 | Current docs describe common passages, direct current facts, historical JSON readability and both rendering-path replacements. Results identify source commits, case evidence, inspected rendered examples and any limits; no byte count is labeled token/cache/cost savings. |

## Existing verification surfaces

Extend the tests that already own the behavior. Exact proposed locations below
are relative to `subs/harness/src/tests/`; recheck configured discovery if paths
move before implementation:

- `plan23-task-prompts.test.ts`, `plan25-task-packets.test.ts`: role/task bindings,
  prompt content, procedure selection and manifest/provenance checks.
- `plan25-blocks.test.ts`, `plan25-block-sessions.test.ts`: replacement,
  withdrawals, exact points and frozen retry behavior.
- `engineer-briefing.test.ts`, `scenario-briefings.test.ts`,
  `plan25-discovery-delivery.test.ts`: work-item/module/check/scenario composition.
- `review-diff-delivery.test.ts`, `review-questions.test.ts`, and the review
  child's `src/tests/review-diff-payload.test.ts`: candidate input and inspection
  contracts. Existing submission tests continue to own concern grounding.
- `plan25-nfr-context.test.ts`, `nonfunctional-submissions.test.ts`,
  `nonfunctional-repair.test.ts`: prepared source and role-specific NFR inputs.
- `plan25-combined-delivery.test.ts` and existing focused workflow fixtures:
  combined cases; do not launch a model or real Git from ordinary tests.

Use configured discovery and the actual changed owners to select any additional
focused files. This list is a starting point, not a replacement test-selection
rule. Do not add a test file merely to mirror a renderer's implementation.
