# Written by ramify-agent for plan projections-extraction, run 20261013T211437Z-569b39.
# The scenarios are the plan's requirements. Agents never edit this file;
# step definitions bind it from src/tests/steps/. @ramify-pending marks a
# scenario that nothing has bound or reported done yet.

Feature: extracted-query-consumer-composition
  Deliver the projections ownership change through the real harness HTTP and
  CLI composition: delegate query implementation to the new direct child,
  preserve all reading and repair-export behavior, retain harness protocol and
  write authority, migrate focused tests and declarations, remove old
  production projectors, and qualify the complete candidate with the required
  architectural comparison and gates. Begin at harness consumers; provider
  work is subordinate to this entry, not a separate frontier entry.

  @ramify-sc-001 @ramify-pending
  Scenario: Existing consumers use the extracted provider
    Given a project has recorded runs, sessions and consultations
    When HTTP answers run and session queries and the CLI inspects consultations
    Then those answers use the projections child's implementation
    And the existing schemas, values, text, ordering and exit statuses are preserved
    And the old harness production projection directory is absent

  @ramify-sc-002 @ramify-pending
  Scenario: Querying recorded evidence leaves the project unchanged
    Given a completed run with session transcripts and repair incidents
    And its project files, durable files and event sequence have been captured
    When its supported queries are repeated in process and through HTTP
    Then those files and the event sequence are unchanged
    And no query invokes an agent, audit or external exporter

  @ramify-sc-003 @ramify-pending
  Scenario: Paging and polling preserve their boundaries
    Given recorded execution data and sessions with transcript cursors
    When a client requests bounded pages and polls from its previous version
    Then ordering, byte limits, cursors and changed-session selection match the baseline
    And stale versions and invalid cursors retain their existing refusals
    And finished-session caching preserves the same answers

  @ramify-sc-005 @ramify-pending
  Scenario: Progress retains authority and provenance
    Given recorded architect judgments, failed and passing audits, and partial metric evidence
    And retained source-run references where the baseline supports imported history
    When the extracted readers answer progress, scenario and metric queries
    Then architect-reported status remains distinct from automated check outcomes
    And unavailable quantities, coverage and original source identities remain explicit
    And the query creates no new completion judgment

  @ramify-sc-006 @ramify-pending
  Scenario: Valid repair history is shared by reading and export
    Given a terminal run with valid repair history and a retained export payload
    When its repair history is queried and its incident is exported through the command
    Then both consumers use the same harness-owned history validation
    And the query performs no writes or export
    And the command preserves export identity, payload, retry behavior and exit status
    And the run's terminal state is preserved

  @ramify-sc-007 @ramify-pending
  Scenario Outline: Invalid repair history is refused before effects
    Given retained repair history with <inconsistency>
    When its repair history is queried and the repair export command is requested
    Then the query reports unreadable history with its evidence
    And the command refuses before record-copy recovery or external export
    And both refusals use the shared history validation
    Examples:
      | inconsistency                         |
      | a record and event identity mismatch  |
      | a gap in incident revisions           |
      | an invalid lifecycle transition       |
      | changed original incident evidence    |
      | export changing non-export evidence   |
      | conflicting invocation identity       |
      | continuation without verified handback|

  @ramify-sc-008 @ramify-pending
  Scenario: The child has a reading-only production surface
    Given the extracted module and its ordinary and testing API views
    When its real consumers and tests import the contracts they need
    Then each imported symbol and signature companion has explicit valid exposure
    And the child receives no writable run service or ledger interface
    And private projectors and Node implementation are unavailable to web production code
    And focused child tests and parent integration tests remain in configured discovery
