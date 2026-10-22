# Records plan requirement revision: manual-run sessions need not be listed

The user directed this revision on 2026-10-22 after the review of candidate
`9016bb1d` raised two findings about the newly added listing of manual-run
sessions (links to run pages the service cannot serve; a crashed session shown
as live). Their exact words were:

> I don't care about listing manual sessions

This is requirement authority, not approval of any protected file. It applies
to plan `compatibility-layer-removal-records`, job `20261022T070359Z-22e31a`,
whose original baseline remains `91f6de7c`. The captured plan and all prior
assessment and durable execution evidence remain unchanged. Pin this document
in every subsequent iteration end and in the cumulative final assessment.

## Superseded captured requirements

- In **Sessions are read from the manual-run layout only**, the session
  browser, the HTTP session endpoints, the protocol session types and the web
  session pages are not required to list or serve sessions recorded as manual
  runs under `plans/sessions/.harness/jobs/`. They continue to serve the
  sessions of the implementation runs the service serves. The removal of the
  earlier `plans/.harness/sessions/<id>/` reader, its schemas, scanner, cache,
  endpoints, protocol variants, web branches and fixtures stands as captured.
- The scenario **The session browser lists manual-run sessions only** is
  replaced by:

  ```gherkin
  Scenario: The session browser does not read the earlier layout
    Given a project with an implementation run the server serves
    And a leftover directory under plans/.harness/sessions/ in the earlier layout
    When a client lists sessions through the HTTP session endpoint
    Then the served run's sessions are listed with their transcript pages
    And the leftover directory is neither listed nor reported
  ```

- Iteration 1's outcome and acceptance follow the replaced scenario. Nothing
  else in the captured plan changes: the other record kinds, iterations 2 and
  3, the constraints, the reserved-for-continuation list and the identifier
  evidence.

## Required implementation

- Remove the manual-session listing that candidate `9016bb1d` added: the
  `manual-sessions.ts` reader, its use in the session queries, and the web
  navigation to manual sessions. Do not repair findings `cf-0003` and
  `cf-0004`; they are moot once no manual-run session is listed.
- Keep the tests that witness that a directory in the earlier layout is
  neither listed nor reported, and that committed-run refusals, reopen parity
  and no-write behavior are retained. Rewrite the two-manual-session listing
  test to the replaced scenario above.
- `README.md` states that `plans/.harness/sessions/` is not read; the existing
  statement under "Manual runs" that a manual run need not appear in the web
  client stays as it is.
