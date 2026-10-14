# Written by ramify-agent for plan kpi-extraction, run 20261014T222715Z-84f064.
# The scenarios are the plan's requirements. Agents never edit this file;
# step definitions bind it from src/tests/steps/. @ramify-pending marks a
# scenario that nothing has bound or reported done yet.

Feature: provider-backed-root-qualification
  Complete root qualification handback against real setup-attribution behavior
  through selected harness contracts, preserving signature companions,
  invalid-evidence errors and protected trial destinations without browser
  exposure. Verify root consumers and participate in the final clean committed
  default audit and delivery report.

  @ramify-sc-010 @ramify-pending
  Scenario: Root qualification retains setup verification and destination protection
    Given existing root qualification consumers of setup attribution and trial reporting
    When they verify valid and invalid setup evidence and choose report destinations
    Then their results and errors match the baseline through selected contracts
    And in-project and symlink report destinations remain refused
    And no KPI implementation becomes a browser production API
