# Written by ramify-agent for plan kpi-extraction, run 20261014T103040Z-9c4e05.
# The scenarios are the plan's requirements. Agents never edit this file;
# step definitions bind it from src/tests/steps/. @ramify-pending marks a
# scenario that nothing has bound or reported done yet.

Feature: composed-measurement-extraction
  Deliver the KPI extraction as actually composed run/step collection, HTTP
  metrics/session reads and root qualification contracts. Begin at the root
  consumer/composition boundary; delegate the substantial measurement
  extraction and execution adapters within harness, preserving the merged
  projections owner. Root work is limited to its actual qualification
  consumers, selected re-exposures and final composition evidence; split
  implementation into focused owner-scoped iterations rather than one broad
  source iteration.

  @ramify-sc-001 @ramify-pending
  Scenario: Execution and projections use one measurement provider
    Given an implementation base containing the merged projections extraction
    And a scripted run with invocation measurements and accepted changes
    When run collection and the projections child produce its metric answers
    Then measurement and attribution rules are implemented by the KPI child
    And execution commits returned measurements through the harness writer
    And the HTTP metrics and session answers match the baseline
    And cross-owner imports satisfy the declared ordinary API contracts

  @ramify-sc-002 @ramify-pending
  Scenario: Weighted scope measurements retain their arithmetic and evidence
    Given a complete baseline measurement of 10000 bytes
    And one writer with scope 1000 bytes and delivered weight 10 lines
    And another writer with scope 3000 bytes and delivered weight 30 lines
    When the metrics query calculates the weighted scope measurements
    Then the weighted scope value is 2500 with numerator 100000 and denominator 40
    And the scope size ratio is 0.25 and the reduction factor is 4
    And policy versions and evidence identify both writer contributions

  @ramify-sc-003 @ramify-pending
  Scenario: A missing writer scope stays unavailable with its known subtotal
    Given a writer with scope 1000 bytes and delivered weight 10 lines
    And another writer with unknown source size and delivered weight 3 lines
    When the metrics query calculates the weighted scope measurement
    Then its complete value is unavailable
    And its known subtotal is 10000 over known weight 10
    And coverage identifies one of two writers and the missing size reason
    And the unknown size is not represented as zero

  @ramify-sc-004 @ramify-pending
  Scenario: Zero delivered weight remains distinct from missing evidence
    Given complete recorded invocation costs and no delivered line weight
    When the metrics query reads the run
    Then ratios requiring delivered line weight are not applicable
    And recorded session costs remain available under their existing policies
    And a failed history read instead retains an unavailable attribution reason

  @ramify-sc-005 @ramify-pending
  Scenario: Mixed setup and writer changes keep exact attribution
    Given a commit containing setup and writer edits to the same source path
    And authenticated surviving setup line identities
    When the delivered change is calculated from the base to the accepted final tree
    Then only the verified setup line identities are excluded from writer weight
    And reverted changes contribute no surviving weight
    And uncertain overlapping contributions stay unattributed with their reasons

  @ramify-sc-006 @ramify-pending
  Scenario: Degraded starts preserve the history actually used
    Given a requested continuation that actually starts fresh
    And an observed local architect fork and a segment with unknown actual start
    When the metrics and session queries calculate lineage and scope aggregates
    Then the fresh fallback is counted as degraded and starts another model history
    And the local fork remains distinct from global generation forks
    And unknown start evidence retains its existing coverage qualifications

  @ramify-sc-007 @ramify-pending
  Scenario: Scope adapters preserve identities and revision limits
    Given delivered support with repeated source identities and overlapping module scopes
    When execution translates its inputs and asks the KPI child for scope measurements
    Then sources and scopes are counted once under the existing measurement policy
    And the resulting captured records match the baseline
    And incompatible view and measurement revisions retain an explicit limitation

  @ramify-sc-008 @ramify-pending
  Scenario: Recorded usage and search uncertainty survive composition
    Given invocation usage with separate input and cache categories and a missing charge rate
    And replayed search observations with unknown scope status and conflicting source identities
    When the session query supplies its invocation evaluation
    Then usage categories and known charge components match the baseline
    And the complete charge remains unavailable with its coverage
    And original searches are not counted twice
    And conflicting or unknown observations retain their coverage qualifications

  @ramify-sc-009 @ramify-pending
  Scenario: Reopening and repeated reads preserve records and responses
    Given a recorded run supported by the merged implementation base
    And captured durable file contents and baseline metric and session responses
    When the extracted application reopens the run and repeats those queries
    Then supported records produce compatible responses
    And durable files and the event sequence are unchanged by the queries
    And reading invokes no measurement collector or command executor

  @ramify-sc-010 @ramify-pending
  Scenario: Root qualification retains setup verification and destination protection
    Given existing root qualification consumers of setup attribution and trial reporting
    When they verify valid and invalid setup evidence and choose report destinations
    Then their results and errors match the baseline through selected contracts
    And in-project and symlink report destinations remain refused
    And no KPI implementation becomes a browser production API
