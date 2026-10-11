# Plan 39: run changed tests individually

**Status:** implementation and qualification complete, 2026-10-11; final
consumer integration pending parent review. **Tracking:** `ramify-agent-wy8`.
See the [release and consumer qualification receipt](qualification.md).
Execute the following steps sequentially across Ramify, ramify-audit and
ramify-agent, with one Sol subagent per step as requested.

## Outcome

Changing an ordinary test file with no exports runs that file instead of all
tests of its module and dependents. Start with Vitest-discovered test files.
The starting consumer pins were `ramify.ts` 0.4.2 and `ramify-audit` 0.7.2.
The released and qualified pins are `ramify.ts` 0.4.3 and `ramify-audit` 0.8.0.

ramify-audit continues to find changes with Git and decide test execution.
Ramify supplies structural facts and computes impact for the remaining paths.
Keep the existing meaning of `ramify affected`; add no test policy to Ramify.

## 1. Expose the required Ramify facts

Provide a public, machine-readable CLI query for a batch of file paths in one
revision: ownership/exclusion, export-analysis completeness, whether any
symbols are exported, known incoming dependencies including side-effect
imports, and relevant limitations. Reuse retained analysis; prefer extending
an existing suitable query over adding a separate analysis mechanism.

An empty export list is conclusive only when analysis is complete. Type
exports count as exports; `export {}` exports nothing. Missing files and
unavailable facts must be explicit. Ramify performs no Git comparison or
test-runner discovery. Qualify and release this provider change before the
auditor adopts it.

## 2. Select eligible tests in ramify-audit

Use the runner's configured discovery to identify tests, including custom
filenames. Perform discovery before selection and reuse its results for
verification. A file qualifies when Ramify reports complete analysis with no
exports or known incoming dependencies, and it has no known shared setup role.
Respect existing project boundaries, exclusions and ignored paths.

For an edited test, require eligibility at both the baseline and audited
revisions. Use baseline runner evidence and Ramify facts for removed paths;
the auditor owns obtaining those revisions. New tests need current facts only.
Unknown eligibility retains ordinary module selection, without itself forcing
a full audit. Changes to shared support and Cucumber steps retain their current
selection behavior.

Select qualified tests directly and pass the remaining changed paths to
`ramify affected`. Run the union of direct files, tests of selected modules
and outstanding baseline failures. Preserve required command/configuration
identities; execute each direct file wherever the configured commands select
it. Deduplicate overlap with module selection within each command. Do not
subtract modules from an already computed closure.

A deleted eligible test has no execution target; record its removal. Treat a
rename as removal of the old path and addition of the new path. Removing an
export does not qualify for narrower selection because the baseline exported
it. Existing configuration-triggered full audits and non-test checks remain
effective.

## 3. Make evidence describe the actual selection

Extend existing file targets and execution witnesses to include directly
selected changed tests. Expected-file verification must include them even
when no module is selected. A required file that never ran prevents a passing
audit. Preserve failure carry-forward and record deleted files as removed,
never passed. Retain each selection's reason and supporting revision facts.

Count changes handled by this rule, including removals, toward the existing
chain and distinct-path caps. Version the changed selection/evidence contracts
and require a compatible full baseline before composing partial results.
Update ramify-audit's `docs/partial-audit.spec.md` and README: their current
rules send all effective paths to Ramify and count only module selections.
Preserve the principles that partial audits are a best guess, structural facts
come from Ramify, and required selected tests must run.

## 4. Verify the composed behavior

Cover these cases with focused regressions and an installed-runner witness:

```gherkin
Scenario: A test-only edit runs one test file
  Given a compatible full audit baseline
  And a discovered test with complete empty exports and no incoming dependencies or shared setup role in both revisions
  And no outstanding failures
  When only that test changes and a partial audit runs
  Then only that test file runs under the commands that discover it
  And evidence records its direct selection and execution

Scenario: Application changes independently require module tests
  Given an eligible changed test and changed application source in the same module
  When a partial audit runs
  Then the application change selects its normal module and dependents
  And the directly selected test is not duplicated within a command

Scenario: Selected execution cannot be silently omitted
  Given a directly selected test file
  When the runner fails to execute that required file
  Then the audit cannot report a passing composed verdict
```

Also verify exports added/removed (including types), side-effect importers,
unknown facts, additions/deletions/renames, custom discovery and multiple
projects, outstanding failures, exclusions, caps and incompatible baselines.
Use each repository's required checks and native-test boundaries. Reuse
existing discovery and file-execution machinery; add no separate cache or
dependency engine.

## 5. Release and adopt

Qualify and release ramify-audit against the released Ramify contract. In
ramify-agent, bump the exact provider pins and lockfile, then run its required
checks and default committed audit to establish the new baseline. Demonstrate
a subsequent eligible test-only change selecting just that file. Follow each
repository's release workflow; never commit companion-checkout dependencies.
