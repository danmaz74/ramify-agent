<!-- ramify-agent architect implementation guidance, version 2. -->
## Exposure, paths and module engineer verification

Use the installed pinned Ramify provider's supported declarations. For the
current `ramify.ts@0.4.2` contract, a declaration starts with `ramify 1` and its
`module` name. `expose-src helper, HelperType from "helper.ts" to parent`
selects named owned exports relative to `src/`; `expose-test makeFixture,
Fixture from "fixture.ts" to descendants` selects owned exports relative to
`src/tests/` and preserves testing-source restrictions. `expose-src *` applies
only to one explicitly named file under `src/interfaces/`. `expose-sub helper,
HelperType from child to parent` selects symbols received from the direct
child named `child`; `*` selects what that direct child exposes to the module.
Use `to descendants` when that is the intended audience, and preserve tag
restrictions. Expose the named signature types with the behavior they describe.

Exposure to descendants already includes the target descendants. For
Core/Catalog/Workspace/Validation, Core exposes its originals to its parent,
Catalog re-exposes what it received from direct child Core to its parent, and
Workspace exposes what it received from direct child Catalog to descendants,
including Validation beneath Reviews. No additional Reviews declaration is
needed merely to reach Validation. Read the affected declarations and current
consumer API evidence; pre-change unavailability and refreshed post-exposure
availability are different observations.

Name the actual project-relative consumer file and provider file before
suggesting an import. Resolve any proposed relative import from the consumer
file's directory and state its intended target; do not forward an unchecked
import from a provisional request. In the retained fixture, consumer
`subs/workspace/subs/reviews/subs/validation/src/preview.ts` reaches provider
`subs/workspace/subs/catalog/subs/core/src/history.ts` with
`../../../../catalog/subs/core/src/history.js`, not three `../` components.
Path resolution alone does not prove importability: the consumer's current
ordinary or testing API evidence and the provider check establish that rule.

When source or provider evidence contradicts a plan or assignment, explicitly
revise the authoritative design and subsequent assignment before handback.
A consultation supplies advisory evidence; its answer does not revise a
design. Keep the original need and guarantees and explain the reconciliation.
The responsible architect judges the design; prose keywords establish no
correctness verdict.

Ask module engineers for relevant focused checks supported by their active tools and
declared-check block. Whole-suite Vitest and Cucumber module engineer commands are
refused: name relevant Vitest test files and use the current prepared focused
Cucumber command when supplied. A guessed Cucumber path or profile does not
establish a verified selection. The gate owns
the complete committed audit and retains every configured project, nested
project and required check. Reconcile contradictory check instructions in the
assignment instead of asking a module engineer to bypass tool restrictions. If a
module engineer receives such a contradiction, it follows the active restrictions and
returns the conflict to its architect for a revised assignment.
