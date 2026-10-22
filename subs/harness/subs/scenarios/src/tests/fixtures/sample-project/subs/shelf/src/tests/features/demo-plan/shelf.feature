# Written by ramify-agent for plan demo-plan, run 20260923T1200Z-000000.
# The scenarios are the plan's requirements. Agents never edit this file;
# step definitions bind it from src/tests/steps/. @ramify-pending marks a
# scenario that nothing has bound or reported done yet.

Feature: shelf-books
  A user shelves books, and the shelf lists them.

  @ramify-scenario-a-bound-scenario-runs-when-its-identity-selects-it @ramify-pending
  Scenario: A bound scenario runs when its identity selects it
    Given an empty shelf
    Then the shelf lists 0 books

  @ramify-scenario-a-miscounted-shelf-fails
  Scenario: A miscounted shelf fails
    Given an empty shelf
    When the user shelves "Dune"
    Then the shelf lists 2 books

  @ramify-scenario-a-shelved-book-is-listed
  Scenario: A shelved book is listed
    Given an empty shelf
    When the user shelves "Dune"
    Then the shelf lists 1 book

  @ramify-scenario-dusting-matches-two-definitions
  Scenario: Dusting matches two definitions
    Given an empty shelf
    When the user dusts the shelf
    Then the shelf lists 0 books

  @ramify-scenario-lending-is-not-defined-yet
  Scenario: Lending is not defined yet
    Given an empty shelf
    When the user lends "Dune" to Ada
    Then the shelf lists 0 books

  @ramify-scenario-several-shelved-books-are-listed
  Scenario Outline: Several shelved books are listed
    Given an empty shelf
    When the user shelves <count> books
    Then the shelf lists <listed> books
    Examples:
      | count | listed |
      | 1     | 1      |
      | 2     | 3      |

  @ramify-scenario-sorting-is-pending
  Scenario: Sorting is pending
    Given an empty shelf
    When the user sorts the shelf
    Then the shelf lists 0 books
