Briefing revision: 463877f209ea50f08eb0e066883ce092e86e3aa701188acc9773981494af30ee; based on: none (full)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Review e6356f5d329a6fac66cb412f8688128789b1ca08

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- {"schema":"ramify-agent.review-request/1","id":"rq-0001","key":{"iteration":"wi-001.i01","candidate":"e6356f5d329a6fac66cb412f8688128789b1ca08","kind":"code","policy":"review-policy/1"},"workItem":"wi-001","assignment":"work-items/wi-001/iterations/01/assignment.json","base":"9792902f430cb47eccd45e7956bd10029f9b7c2f","gate":"ga-0002","tree":"6074e7d43cb52ab75f2ceee049677c1a831e47f6","source":{"elements":["ctx-001","fr-001","fr-002","fr-003","fr-004","fr-005","nfr-001","nfr-002","nfr-003","nfr-004"],"deviations":[],"hash":"74601e3a9e759a431f721efb6b9e191b75e32271ce0e7ea75a76bd6f3f36a5ae"},"guidance":[],"forkPoint":{"kind":"none"}}

# Block brief:support:context:0
Current value; replaces any earlier value for this key.
Code review rq-0001 of iteration wi-001.i01 of work item wi-001.

The audited candidate is commit e6356f5d329a6fac66cb412f8688128789b1ca08 (tree 6074e7d43cb52ab75f2ceee049677c1a831e47f6); its gate ga-0002 passed. The diff is taken from 9792902f430cb47eccd45e7956bd10029f9b7c2f.

The request's assignment path identifies a record in the harness run directory. Use the assignment intent below; that record is not a candidate file readable with snapshot tools.


# Block brief:support:## The iteration:0
Current value; replaces any earlier value for this key.
## The iteration

Goal: Implement optional neutral/positive/warning/critical tone on the shared status badge, expose data-tone beside data-status with a neutral default, and bind all three acceptance scenarios without changing existing status/label behavior or requiring caller changes.
Approach: Extend the existing StatusBadgeProps rather than introduce a domain contract. Keep tone independent of status and label, with the neutral default when omitted, and render data-tone on the existing badge span. Preserve Passed/Failed defaults, custom-label behavior including existing nullish fallback semantics, data-status and className. Keep the primitive prop-driven and browser-safe; do not add knowledge of reviews, records or protocols. Retain the existing unit tests and add real static-markup tests covering every supported tone and omission while checking status and label independence. Write module-local Cucumber steps binding sc-001, sc-002 and sc-003 using the real StatusBadge and static markup. Ensure attribute assertions inspect the same badge, and label assertions inspect rendered text rather than deriving outcomes from props. Keep per-scenario state isolated and coexist with the runner's registered World; do not replace it or import unexposed integration-test internals. Do not edit harness feature files or root configuration. Run focused unit tests and the supplied feature, with an explicit scenario tag selection if needed to exercise pending scenarios before harness binding, and record results. Root-wide checks are the gate's responsibility.
Completion evidence: Provide a focused passing run of existing and new StatusBadge unit tests and all three supplied Cucumber scenarios (including each of sc-003's four examples), using the real component without fakes. Identify the step bindings for each obligation. Show the additive optional four-value prop, neutral omission behavior, unchanged data-status and label rendering, and absence of required consumer edits; gate type-check, tests, scenarios and structure must remain compatible.


# Block brief:support:## What the plan asks of it:0
Current value; replaces any earlier value for this key.
## What the plan asks of it

The elements the assignment cites, whole, as its engineer received them.



# Block brief:support:## The changed paths:0
Current value; replaces any earlier value for this key.
## The changed paths

- M subs/workspace/subs/shared-ui/src/status-badge.tsx
- A subs/workspace/subs/shared-ui/src/tests/badge-markup.ts
- M subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
- M subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
- A subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx


Use the supplied changed-path list and complete patches delivered in this message. Fetch a relevant patch with snapshot_diff only when it is not supplied, and inspect the source required to judge it. List paths with snapshot_diff only if the supplied list is unavailable. The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden.


# Block brief:support:## Declared project checks:0
Current value; replaces any earlier value for this key.
## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `.`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `.`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `.`.
- fixture-structure (none): argv ["/workspaces/ramify-agent/node_modules/.bin/ramify","check","--batch","--format","json","--no-snapshot"]; cwd `.`.
- Configuration/support pointer: `ramify-audit.json`.
- Configuration/support pointer: `ramify-agent.json`.
- Configuration/support pointer: `package.json`.
- Configuration/support pointer: `cucumber.js`.

Read these project-relative references with snapshot_read/snapshot_list in the audited candidate. Commands describe the declared setup; this reader does not execute them.



# Block brief:support:## Candidate test pointers:0
Current value; replaces any earlier value for this key.
## Candidate test pointers

- `subs/workspace/subs/shared-ui/src/tests/`: inspect with snapshot_list; read named files with snapshot_read.

Harness pending-tag binding: sc-001 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature, exact candidate sha256 47784803965150ae562a83d99cf3de734582ef7bead45b446968ccec2be9d5b2, accepted producer inv-0007, submission 49f9f1d955138dc7ec5a0f04d2b4f49fe420b833106c48a09b0bf8e2c514a71c. This attribution supplies provenance; review the actual audited patch.

Harness pending-tag binding: sc-002 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature, exact candidate sha256 47784803965150ae562a83d99cf3de734582ef7bead45b446968ccec2be9d5b2, accepted producer inv-0007, submission 49f9f1d955138dc7ec5a0f04d2b4f49fe420b833106c48a09b0bf8e2c514a71c. This attribution supplies provenance; review the actual audited patch.

Harness pending-tag binding: sc-003 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature, exact candidate sha256 47784803965150ae562a83d99cf3de734582ef7bead45b446968ccec2be9d5b2, accepted producer inv-0007, submission 49f9f1d955138dc7ec5a0f04d2b4f49fe420b833106c48a09b0bf8e2c514a71c. This attribution supplies provenance; review the actual audited patch.


# Block brief:support:assignment-package
Current value; replaces any earlier value for this key.
# Plan context package

Catalog: 8b8dc5c51c661b4f4e9ef0bec962c0c61cb80a18ee3e55561754b62ca9617691
Elements: ctx-001, fr-001, fr-002, fr-003, fr-004, fr-005, nfr-001, nfr-002, nfr-003, nfr-004
Deviations: none

## Context

Context describes the situation the plan starts from and why the plan exists. It is not a requirement, and nothing assesses it.

### ctx-001: context from plans/status-badge-tone/plan.md

> The status badge says whether a review passed or failed, but a feature that wants to draw attention to a badge, or to play one down, has no way to say so. Give the badge a tone.

Conditions: none recorded.

Uncertainty: none recorded.

## Functional requirements

### fr-001: functional requirement from plans/status-badge-tone/plan.md

> `StatusBadge` takes an optional `tone`: `neutral`, `positive`, `warning` or `critical`.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-002: functional requirement from plans/status-badge-tone/plan.md

> The badge carries its tone as a `data-tone` attribute beside `data-status`, so the stylesheet and a test can read it without matching on the label.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-003: functional requirement from plans/status-badge-tone/plan.md

> A badge rendered without a tone reads as `neutral`.

Conditions:
- stated: The badge is rendered without a tone.

Uncertainty: none recorded.

### fr-004: functional requirement from plans/status-badge-tone/plan.md

> A badge given a tone carries that tone in its markup.

Conditions:
- stated: The badge is given a tone.

Uncertainty: none recorded.

### fr-005: functional requirement from plans/status-badge-tone/plan.md

> A badge given no tone carries `neutral`.

Conditions:
- stated: The badge is given no tone.

Uncertainty: none recorded.

## Non-functional requirements of the plan

### nfr-001: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge stays a presentation primitive of the shared UI: it learns nothing about records, reviews or protocols, and the tone arrives as a prop like everything else it renders.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-002: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> `status` and `label` keep their meaning. A tone never changes the word the badge shows.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-003: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> No feature view has to change. Existing callers keep rendering the badge as they do today.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-004: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge's existing tests still pass, and the tone has tests of its own.

Conditions: none recorded.

Uncertainty: none recorded.


# Block brief:support:candidate-diff
Current value; replaces any earlier value for this key.
### Candidate Review Diff

Base: 9792902f430cb47eccd45e7956bd10029f9b7c2f; candidate: e6356f5d329a6fac66cb412f8688128789b1ca08.
Changed paths: 5; collected patch bytes: 10443.

Complete patches below are supplied as inspection evidence. Request surrounding source when needed.

```diff
diff --git a/subs/workspace/subs/shared-ui/src/status-badge.tsx b/subs/workspace/subs/shared-ui/src/status-badge.tsx
index 0b4af93..42cf5be 100644
--- a/subs/workspace/subs/shared-ui/src/status-badge.tsx
+++ b/subs/workspace/subs/shared-ui/src/status-badge.tsx
@@ -5,7 +5,7 @@ import type { ReviewStatus } from '../../contracts/src/interfaces/vocabulary.js'
 /**
  * The one presentation primitive both feature views render.
  *
- * It is deliberately tiny: a status and an optional label. Everything it needs
+ * It is deliberately tiny: a status, an optional label and an optional tone. Everything it needs
  * arrives as props, so the badge knows nothing about records, reviews, or the
  * protocol that produced either. Its styling is the application stylesheet's
  * plain `.status-badge` rules rather than a stylesheet of its own, which keeps
@@ -16,6 +16,7 @@ import type { ReviewStatus } from '../../contracts/src/interfaces/vocabulary.js'
 export interface StatusBadgeProps {
   status: ReviewStatus;
   label?: string;
+  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
 }
 
 /** The word each status reads as when the caller supplies no label. */
@@ -25,13 +26,13 @@ const defaultLabels: Record<ReviewStatus, string> = {
 };
 
 /**
- * One status, shown as a badge. `data-status` carries the status itself, so
- * both the stylesheet and a test can read it without matching on the label a
- * feature chose.
+ * One status, shown as a badge. `data-status` and `data-tone` carry independent
+ * presentation values, so the stylesheet and a test can read them without
+ * matching on the label a feature chose.
  */
-export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
+export function StatusBadge({ status, label, tone = 'neutral' }: StatusBadgeProps): ReactElement {
   return (
-    <span className="status-badge" data-status={status}>
+    <span className="status-badge" data-status={status} data-tone={tone}>
       {label ?? defaultLabels[status]}
     </span>
   );
diff --git a/subs/workspace/subs/shared-ui/src/tests/badge-markup.ts b/subs/workspace/subs/shared-ui/src/tests/badge-markup.ts
new file mode 100644
index 0000000..6e2c9f7
--- /dev/null
+++ b/subs/workspace/subs/shared-ui/src/tests/badge-markup.ts
@@ -0,0 +1,22 @@
+import assert from 'node:assert/strict';
+
+/** Inspect the one rendered badge, never inferring attributes or text from props. */
+export function readBadgeMarkup(markup: string) {
+  const badge = /^<span\b([^>]*)>([^<]*)<\/span>$/.exec(markup);
+  assert.ok(badge, 'Expected a single badge span containing text');
+  const attributes = badge[1]!;
+  const attribute = (name: string) => {
+    const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes);
+    assert.ok(match, `Missing ${name} on the badge span`);
+    return match[1]!;
+  };
+  const entities: Record<string, string> = {
+    amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'",
+  };
+  return {
+    className: attribute('class'),
+    status: attribute('data-status'),
+    tone: attribute('data-tone'),
+    text: badge[2]!.replace(/&(amp|lt|gt|quot|#x27);/g, (_, entity: string) => entities[entity]!),
+  };
+}
diff --git a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
index e2d1c6a..62a4c70 100644
--- a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
+++ b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
@@ -8,20 +8,20 @@ Feature: render-status-badge-with-tone
   critical tone as data-tone beside data-status, defaulting to neutral without
   changing status or label meaning or requiring changes to existing callers.
 
-  @ramify-sc-001 @ramify-pending
+  @ramify-sc-001
   Scenario: A badge given a tone carries that tone in its markup
     Given a badge for a passed review with the tone "warning"
     When the badge is rendered
     Then its markup carries the tone "warning"
     And it still reads "Passed"
 
-  @ramify-sc-002 @ramify-pending
+  @ramify-sc-002
   Scenario: A badge given no tone carries neutral
     Given a badge for a failed review with no tone
     When the badge is rendered
     Then its markup carries the tone "neutral"
 
-  @ramify-sc-003 @ramify-pending
+  @ramify-sc-003
   Scenario Outline: Every supported tone is readable independently of the label
     Given a badge with status "failed", label "Needs attention" and tone "<tone>"
     When the badge is rendered
diff --git a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
index 8309488..f661530 100644
--- a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
+++ b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
@@ -2,6 +2,7 @@ import { renderToStaticMarkup } from 'react-dom/server';
 import { describe, expect, it } from 'vitest';
 
 import { StatusBadge } from '../status-badge.js';
+import { readBadgeMarkup } from './badge-markup.js';
 
 /**
  * The badge, checked as static markup.
@@ -24,4 +25,48 @@ describe('StatusBadge', () => {
     expect(markup).toContain('No revisions');
     expect(markup).not.toContain('Failed');
   });
+
+  it.each(['passed', 'failed'] as const)('defaults to neutral for an unchanged %s caller', (status) => {
+    const badge = readBadgeMarkup(renderToStaticMarkup(<StatusBadge status={status} />));
+    expect(badge).toEqual({
+      className: 'status-badge',
+      status,
+      tone: 'neutral',
+      text: status === 'passed' ? 'Passed' : 'Failed',
+    });
+  });
+
+  describe.each(['neutral', 'positive', 'warning', 'critical'] as const)('tone %s', (tone) => {
+    it.each(['passed', 'failed'] as const)('preserves %s and its default label', (status) => {
+      const badge = readBadgeMarkup(renderToStaticMarkup(<StatusBadge status={status} tone={tone} />));
+      expect(badge).toEqual({
+        className: 'status-badge', status, tone,
+        text: status === 'passed' ? 'Passed' : 'Failed',
+      });
+    });
+
+    it.each(['Needs attention', '', 'Check <this> & "that"'])(
+      'preserves the custom label %j independently of status', (label) => {
+        const badge = readBadgeMarkup(renderToStaticMarkup(
+          <StatusBadge status="failed" label={label} tone={tone} />,
+        ));
+        expect(badge).toEqual({ className: 'status-badge', status: 'failed', tone, text: label });
+      },
+    );
+  });
+
+  it('defaults an explicitly undefined tone to neutral', () => {
+    const badge = readBadgeMarkup(renderToStaticMarkup(
+      <StatusBadge status="failed" label="Custom" tone={undefined} />,
+    ));
+    expect(badge).toEqual({ className: 'status-badge', status: 'failed', tone: 'neutral', text: 'Custom' });
+  });
+
+  it('retains the nullish label fallback for JavaScript callers', () => {
+    // @ts-expect-error JavaScript callers can still pass null at runtime.
+    const markup = renderToStaticMarkup(<StatusBadge status="passed" label={null} tone="critical" />);
+    expect(readBadgeMarkup(markup)).toEqual({
+      className: 'status-badge', status: 'passed', tone: 'critical', text: 'Passed',
+    });
+  });
 });
diff --git a/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
new file mode 100644
index 0000000..20ca1b1
--- /dev/null
+++ b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
@@ -0,0 +1,73 @@
+import assert from 'node:assert/strict';
+import { Given, Then, When } from '@cucumber/cucumber';
+import { renderToStaticMarkup } from 'react-dom/server';
+
+import { StatusBadge } from '../../status-badge.js';
+import type { StatusBadgeProps } from '../../status-badge.js';
+import { readBadgeMarkup } from '../badge-markup.js';
+
+interface BadgeScenario {
+  props: StatusBadgeProps;
+  badge?: ReturnType<typeof readBadgeMarkup>;
+}
+
+// Each scenario has its own World; keep our state separate from the registered
+// World's fields and hooks, without replacing or importing its implementation.
+const scenarios = new WeakMap<object, BadgeScenario>();
+
+function scenario(world: object): BadgeScenario {
+  const state = scenarios.get(world);
+  assert.ok(state, 'A badge must be given before it is rendered');
+  return state;
+}
+
+function renderedBadge(world: object) {
+  const badge = scenario(world).badge;
+  assert.ok(badge, 'The badge must be rendered before inspecting it');
+  return badge;
+}
+
+function toneProp(tone: string) {
+  assert.ok(tone === 'neutral' || tone === 'positive' || tone === 'warning' || tone === 'critical');
+  return tone;
+}
+
+// sc-001
+Given('a badge for a passed review with the tone {string}', function (this: object, tone: string) {
+  scenarios.set(this, { props: { status: 'passed', tone: toneProp(tone) } });
+});
+
+// sc-002: deliberately omit the optional tone, just as existing callers do.
+Given('a badge for a failed review with no tone', function (this: object) {
+  scenarios.set(this, { props: { status: 'failed' } });
+});
+
+// sc-003, including all four example tones.
+Given('a badge with status {string}, label {string} and tone {string}',
+  function (this: object, status: string, label: string, tone: string) {
+    assert.ok(status === 'passed' || status === 'failed');
+    scenarios.set(this, { props: { status, label, tone: toneProp(tone) } });
+  },
+);
+
+When('the badge is rendered', function (this: object) {
+  const state = scenario(this);
+  state.badge = readBadgeMarkup(renderToStaticMarkup(<StatusBadge {...state.props} />));
+  assert.equal(state.badge.className, 'status-badge');
+});
+
+Then('its markup carries the tone {string}', function (this: object, tone: string) {
+  assert.equal(renderedBadge(this).tone, tone);
+});
+
+Then("the badge's data-tone attribute is {string}", function (this: object, tone: string) {
+  assert.equal(renderedBadge(this).tone, tone);
+});
+
+Then("the same badge's data-status attribute is {string}", function (this: object, status: string) {
+  assert.equal(renderedBadge(this).status, status);
+});
+
+Then('it still reads {string}', function (this: object, label: string) {
+  assert.equal(renderedBadge(this).text, label);
+});

```

# Block brief:support:starting-points
Current value; replaces any earlier value for this key.
## Recorded starting points

Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.
Paths are relative to the pinned candidate e6356f5d329a6fac66cb412f8688128789b1ca08 (tree 6074e7d43cb52ab75f2ceee049677c1a831e47f6); use snapshot tools.

- {"path":"subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"Existing props and rendering; preserve label fallback and single-span status markup.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"9792902f430cb47eccd45e7956bd10029f9b7c2f"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Existing Node static-rendering tests to retain and extend with tone-specific coverage.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"9792902f430cb47eccd45e7956bd10029f9b7c2f"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature","note":"Read-only acceptance steps and four-tone examples to bind from local src/tests/steps.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"9792902f430cb47eccd45e7956bd10029f9b7c2f"}]}
- {"path":"cucumber.js","note":"Existing TypeScript/TSX step globs, global support initialization and pending-tag exclusion; no configuration write needed.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"9792902f430cb47eccd45e7956bd10029f9b7c2f"}]}

# Block procedure:reviewer:code
Current value; replaces any earlier value for this key.
# Current procedure
Do this, in order:

1. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`.
2. Read the complete patches supplied in this message. Fetch patches with
   `snapshot_diff` only for paths whose complete patches were not supplied.
   Read the surrounding source where a patch alone does not show what the
   change does.
3. Ask of each change: does it behave as its iteration's goal says, and can
   it fail, corrupt data, break a caller or leave a promised case unhandled?
4. Submit.

## What a concern is

A concern is an actionable defect you can point to: a precise consequence,
the evidence in the candidate, how sure you are, a bounded remedy, its risk
and its ground: a test, the assignment's plan or a README that states the
behavior the change breaks, read with `snapshot_read`. The plan elements in
the message say what the iteration was asked; a concern about them is
grounded in a file the candidate holds, and a departure from a
recommendation is not a defect. Style,
naming and preferences are not concerns. Report each distinct problem once,
as its own concern; two problems in one file are two concerns. `suggests`
may name a CheckFinding the message below lists when you believe yours is
the same problem, and is otherwise null.

## Coverage

Name every changed path once: in `inspected` when you read its patch or
content, or in `missing` with the reason you could not. Both lists hold
changed paths only; a file the candidate did not change, read for context
or as a ground, is named in neither. The harness checks
`inspected` against the complete patches delivered in this message and the
reads its tools answered. A changed-path list, patch summary or omitted patch
is not inspection evidence. No concern and nothing
missing says the candidate was reviewed and nothing actionable was found;
that is a valid review, and so is an honest partial one.

# Block environment:projectRoot
Current value; replaces any earlier value for this key.
{
  "projectRoot": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review"
}

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-workspaces-ramify-agent/031cbbcd-d92e-477e-88f4-5998ad9469da/scratchpad/badge-run-61/collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/reviews/rq-0001/attempts/01/workspace"
}

# Block environment:candidate
Current value; replaces any earlier value for this key.
{
  "candidate": "e6356f5d329a6fac66cb412f8688128789b1ca08"
}

# Block environment:snapshot
Current value; replaces any earlier value for this key.
{
  "snapshot": "6074e7d43cb52ab75f2ceee049677c1a831e47f6"
}

# Block environment:limits
Current value; replaces any earlier value for this key.
{
  "limits": {
    "budgetReturnsPerIteration": 6,
    "commandTimeoutMs": 600000,
    "cycleReplansPerWorkItem": 1,
    "forkRetriesPerRequest": 2,
    "infrastructureRetriesPerGate": 2,
    "invocationAbsoluteMs": 599952,
    "invocationIdleMs": 300000,
    "laterRoundMinimumRisk": "medium",
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationsPerRun": 400,
    "maxIterationsPerCapabilityTask": 24,
    "maxIterationsPerWorkItem": 12,
    "maxPlacementRequests": 32,
    "maxPlanDeviations": 5,
    "maxWorkItems": 64,
    "nonfunctionalRoundsPerPlan": 3,
    "readinessRecoveries": 2,
    "reconciliationRoundsPerWorkItem": 3,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "runAbsoluteMs": 28800000,
    "sessionReconstructionsPerWork": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000
  }
}

# Block environment:availableTools
Current value; replaces any earlier value for this key.
{
  "availableTools": [
    "snapshot_list",
    "snapshot_read",
    "snapshot_search",
    "snapshot_diff",
    "submit_review"
  ]
}

# Block environment:views
Current value; replaces any earlier value for this key.
{
  "views": []
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/prompts/reviewer.system.md",
    "subs/harness/src/prompts/code-review.procedure.md"
  ]
}

# Block environment:cucumberConfiguration
Current value; replaces any earlier value for this key.
{
  "cucumberConfiguration": null
}

# Current task: code
This selection supersedes every prior task selection.
Active role: reviewer
Selected procedure: procedure:reviewer:code; SHA-256: 52b1322812d3428064537ef709a0f6f9018e500e206045ecdd693072f80bd0dd
Perform code for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_review`. Only an accepted submission completes this task.