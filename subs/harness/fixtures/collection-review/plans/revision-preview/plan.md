# Preview a proposed revision chain

A caller can review a stored record, but cannot check a proposed revision chain
before using it. Add a small preview operation that applies the existing review
rules to a supplied chain. A caller should also be able to edit a catalog
inspection's returned chain as a working copy without changing the catalog.

## Required behavior

- Add the tRPC mutation `reviews.preview`, taking `{ chain: RevisionChain }`
  and returning `{ status: ReviewStatus, findings: Finding[] }`. These are the
  existing shared vocabulary shapes. No record ID is needed and no record is
  read or written by the preview.
- Apply the existing missing-predecessor and duplicate-revision rules, with
  their existing finding codes, messages, revision IDs and ordering. A chain
  passes exactly when it has no findings. An empty chain passes.
- A predecessor absent from the supplied chain produces a `missing-predecessor`
  finding and a failed preview. It is never treated as an empty successful
  result. Resolve references only within the supplied chain.
- Use the existing revision-chain schema to reject absent or malformed `chain`
  input with tRPC `BAD_REQUEST`. Absence is distinct from an explicit empty
  array. This is argument validation, not a review finding.
- The Reviews adapter consumes new protocol-independent preview behavior owned
  by Review Validation. That behavior must reuse Catalog Core's existing
  `resolvePredecessors` through valid exposure and re-exposure declarations.
  Keep the helper in Catalog Core; do not copy its algorithm into Validation
  or put review rules into the protocol adapter. The internal preview API's
  name and shape are implementation choices.

## Non-functional requirement: independent inspection snapshots

Catalog Core's `inspect` must give each successful caller an independently
mutable report. Mutating a returned chain array or a revision object's fields,
or changing the report's predecessor or finding arrays, must not alter stored
records, another previously returned report, or a later inspection. This applies
to both `all` and `latest` scopes. Keep the public mutable shapes; freezing the
result or changing its types to readonly does not meet this requirement.

Verify this property directly at Catalog Core's API, where serialization cannot
hide shared references. For each scope, retain two reports, mutate the first's
array and revision fields, and verify the second, a fresh inspection and
`getRecord` still describe the original record. Also check the other mutable
arrays. The existing implementation shares its stored chain for `all` and
revision objects for both scopes, so the current behavior does not satisfy
this requirement.

## Compatibility and scope

- Preserve `validateRevisionChain(report)`: it continues to judge the supplied
  report's predecessor-resolution facts, including scoped inspections. Share
  the review rules with preview without silently recomputing those facts for
  existing callers.
- Preserve the existing resolver's ordering and repeated references, inspection
  values and observations, and the existing tRPC and MCP operations. Existing
  callers require no migration. Preview must not mutate its supplied chain.
- Keep raw catalog records private. Only the resolver and the type companions
  needed to use it become a production contract outside Catalog Core.
- Validation remains independent of protocols and the review runtime. This
  plan deliberately adds its dependency on Catalog Core's pure history helper;
  update the affected module descriptions and READMEs to describe that contract.
- This change adds one tRPC operation. A browser workflow, an MCP preview tool,
  persistence, new validation rules and new dependencies are outside its scope.

## Acceptance

Exercise preview through the assembled typed tRPC client and the real provider
implementations. Provider-only tests or a substituted resolver do not establish
the composed result.

```gherkin
Scenario: Preview an intact proposed chain
  Given a proposed chain containing revision "rev-1" with no predecessor
  And revision "rev-2" following "rev-1"
  When I preview the proposed chain through tRPC
  Then the preview status is "passed"
  And the preview has no findings

Scenario: Preview an explicitly empty chain
  Given an explicitly empty proposed chain
  When I preview the proposed chain through tRPC
  Then the preview status is "passed"
  And the preview has no findings

Scenario: A missing predecessor survives the provider boundary
  Given a proposed chain containing only revision "rev-2" following "rev-0"
  When I preview the proposed chain through tRPC
  Then the preview status is "failed"
  And its only finding has code "missing-predecessor" and revision ID "rev-2"
  And that finding says "Revision rev-2 follows rev-0, which is not a revision of the inspected chain."

Scenario: Preview retains the existing rules and their ordering
  Given a proposed chain containing revision "rev-1" with no predecessor
  And a second revision also named "rev-1" following "rev-0"
  When I preview the proposed chain through tRPC
  Then the preview status is "failed"
  And its finding codes in order are "missing-predecessor", "duplicate-revision"
  And both findings identify revision "rev-1"

Scenario: Missing input is not an empty chain
  Given an untyped preview request with no chain field
  When I submit that request through tRPC
  Then the request fails with code "BAD_REQUEST"

Scenario: Existing stored-record reviews keep their behavior
  Given the catalog's original "rec-valid" and "rec-broken" records
  When I review "rec-valid" through the existing tRPC operation with all revisions
  Then the review passes with no findings
  When I review "rec-broken" through the existing tRPC operation with all revisions
  Then the review fails with a "missing-predecessor" finding for "rev-2"
  When I review "rec-valid" through the existing tRPC operation with only its latest revision
  Then the review fails with a "missing-predecessor" finding for "rev-2"
```

Retain the existing project checks. Review the declarations and actual imports
to establish reuse, and the direct snapshot tests to establish isolation.

## Context and recommendations

Paths below are relative to the Collection Review project root and are navigation
pointers, not additional plan documents:

- `subs/workspace/subs/reviews/src/router.ts`: existing `reviews.run` adapter.
- `subs/workspace/subs/reviews/subs/validation/src/validate.ts`: existing rules.
- `subs/workspace/subs/catalog/subs/core/src/history.ts`: unexposed resolver.
- `subs/workspace/subs/catalog/subs/core/src/catalog.ts`: current inspection.
- `subs/workspace/subs/contracts/src/interfaces/vocabulary.ts`: shared schemas.
- `subs/workspace/subs/reviews/src/tests/router.test.ts`: assembled-client tests.

The intended dependency is Reviews adapter → Review Validation → Catalog Core.
Architects determine assignments, exposure changes and execution order.

The assembled test client is typed against the router, so a request without a
`chain` field cannot be written as an ordinary call. The test needs an untyped
or deliberately miscast request to send it.

Optional recommendation: the preview may build an inspection-report-shaped
value from the supplied chain and the resolver's result, so the existing rule
functions apply to it unchanged. This is a suggestion, not a requirement; an
engineer who finds a cleaner way to share the rules should take it and say so.
