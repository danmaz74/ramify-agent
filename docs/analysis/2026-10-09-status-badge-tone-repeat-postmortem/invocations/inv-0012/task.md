Briefing revision: 8110c81236d48e69f2fab1bc5751192cbf4fdca036de560b9efc8ab0024351c0; based on: 11947ffe90b4c9243f9e42f199f5212f65fa036c463f53f0c962dfd291dd689c (post-fork)

# Goal
Review 40155157c0af1fa686ec5b8579755c17a6364613

# Requirements
- {"schema":"ramify-agent.review-request/1","id":"rq-0003","key":{"iteration":"wi-001.i01","candidate":"40155157c0af1fa686ec5b8579755c17a6364613","kind":"design","policy":"review-policy/1"},"workItem":"wi-001","assignment":"work-items/wi-001/iterations/01/assignment.json","base":"564534ea8e482a1d65b77a247f80577ff5d540d8","gate":"ga-0002","tree":"36c77a3a474e60064bbb3efabdd5c0547a92133a","guidance":[{"ref":"README.md","hash":"b72856422e9dd390beb6eb5448ddfb30260ac90cbc8b91e014541c97821e2c95"},{"ref":"subs/workspace/README.md","hash":"f5cdda73289e0ff31f3b1d2d5942640a78a4224497474462fc26eef5d7546e56"},{"ref":"subs/workspace/subs/shared-ui/README.md","hash":"8cec99d7e15b169c49a10f3982e551a081e0da714105120442118184bf573435"}],"forkPoint":{"kind":"orientation","key":"b5ea509770b9b5415e8a883163d57a41adbfa7a85dda38349a7085b09f1f23b7"}}

Design review rq-0003 of iteration wi-001.i01 of work item wi-001.

The audited candidate is commit 40155157c0af1fa686ec5b8579755c17a6364613 (tree 36c77a3a474e60064bbb3efabdd5c0547a92133a); its gate ga-0002 passed. The diff is taken from 564534ea8e482a1d65b77a247f80577ff5d540d8.

The request's assignment path identifies a record in the harness run directory. Use the assignment intent below; that record is not a candidate file readable with snapshot tools.


## The iteration

Goal: Implement the registered toned-status-badge capability and bind both acceptance scenarios in shared-ui.
Approach: Update StatusBadgeProps with an optional exact tone union and make StatusBadge resolve an omitted tone to neutral before rendering data-tone alongside the unchanged data-status. Keep the primitive dependent only on its props and retain existing label/default-label behavior. Extend the existing static-markup Vitest suite to prove explicit tone propagation, neutral omission, and unchanged wording. Add shared-ui-local TypeScript/TSX Cucumber steps under src/tests/steps that bind the exact generated phrases, render the real StatusBadge with react-dom/server, keep state scenario-local, and use no fakes. Do not edit the generated feature file or require changes from feature callers.
Completion evidence: A focused diff shows the optional four-value tone contract, neutral default, and data-tone output without caller or semantic regressions; focused type checking/tests and the bound Cucumber scenarios pass, followed by the required project gate including type-check, Vitest, Cucumber, and structural audit.


## The guidance this design is judged against

Each file is part of the audited candidate. If this session has not read one of them yet, read it with `snapshot_read` before you judge.

- README.md (sha256 b72856422e9d)
- subs/workspace/README.md (sha256 f5cdda73289e)
- subs/workspace/subs/shared-ui/README.md (sha256 8cec99d7e15b)


## The changed paths

- M subs/workspace/subs/shared-ui/src/status-badge.tsx
- M subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
- M subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
- A subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx


Use the supplied changed-path list and complete patches delivered in this message. Fetch a relevant patch with snapshot_diff only when it is not supplied, and inspect the source required to judge it. List paths with snapshot_diff only if the supplied list is unavailable. The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden.

Harness pending-tag binding: sc-001 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature, exact candidate sha256 de0eb6508736e7c2c2cb91744467c7801cbf261cde45bb37bb7a71293860f197, accepted producer inv-0007, submission 92b9f97afe954f368d576461af3c32a9e479c41cdb82fc5955b2459797147ca4. This attribution supplies provenance; review the actual audited patch.

Harness pending-tag binding: sc-002 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature, exact candidate sha256 de0eb6508736e7c2c2cb91744467c7801cbf261cde45bb37bb7a71293860f197, accepted producer inv-0007, submission 92b9f97afe954f368d576461af3c32a9e479c41cdb82fc5955b2459797147ca4. This attribution supplies provenance; review the actual audited patch.


### Candidate Review Diff

Base: 564534ea8e482a1d65b77a247f80577ff5d540d8; candidate: 40155157c0af1fa686ec5b8579755c17a6364613.
Changed paths: 4; collected patch bytes: 5792.

Complete patches below are supplied as inspection evidence. Request surrounding source when needed.

```diff
diff --git a/subs/workspace/subs/shared-ui/src/status-badge.tsx b/subs/workspace/subs/shared-ui/src/status-badge.tsx
index 0b4af93..fb09686 100644
--- a/subs/workspace/subs/shared-ui/src/status-badge.tsx
+++ b/subs/workspace/subs/shared-ui/src/status-badge.tsx
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
+ * One status, shown as a badge. `data-status` carries the status itself and
+ * `data-tone` carries its presentation tone, so both the stylesheet and a
+ * test can read them without matching on the label a feature chose.
  */
-export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
+export function StatusBadge({ status, label, tone = 'neutral' }: StatusBadgeProps): ReactElement {
   return (
-    <span className="status-badge" data-status={status}>
+    <span className="status-badge" data-status={status} data-tone={tone}>
       {label ?? defaultLabels[status]}
     </span>
   );
diff --git a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
index f4bc815..7e8e16f 100644
--- a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
+++ b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
@@ -8,14 +8,14 @@ Feature: render-toned-status-badge
   critical tone exposed through `data-tone`, using neutral when tone is
   omitted.
 
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
diff --git a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
index 8309488..5a480dc 100644
--- a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
+++ b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
@@ -24,4 +24,18 @@ describe('StatusBadge', () => {
     expect(markup).toContain('No revisions');
     expect(markup).not.toContain('Failed');
   });
+
+  it('carries an explicit tone without changing its wording', () => {
+    const markup = renderToStaticMarkup(<StatusBadge status="passed" tone="warning" />);
+
+    expect(markup).toContain('data-tone="warning"');
+    expect(markup).toContain('Passed');
+  });
+
+  it('uses the neutral tone when tone is omitted', () => {
+    const markup = renderToStaticMarkup(<StatusBadge status="failed" />);
+
+    expect(markup).toContain('data-tone="neutral"');
+    expect(markup).toContain('Failed');
+  });
 });
diff --git a/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
new file mode 100644
index 0000000..39cc981
--- /dev/null
+++ b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
@@ -0,0 +1,65 @@
+import { Given, Then, When } from '@cucumber/cucumber';
+import type { ReactElement } from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+
+import { StatusBadge } from '../../status-badge.js';
+
+interface BadgeScenarioState {
+  badge?: ReactElement;
+  markup?: string;
+}
+
+const states = new WeakMap<object, BadgeScenarioState>();
+
+function stateFor(world: object): BadgeScenarioState {
+  let state = states.get(world);
+  if (!state) {
+    state = {};
+    states.set(world, state);
+  }
+  return state;
+}
+
+function requireMarkup(world: object): string {
+  const markup = stateFor(world).markup;
+  if (markup === undefined) {
+    throw new Error('The badge has not been rendered');
+  }
+  return markup;
+}
+
+Given(
+  'a badge for a passed review with the tone {string}',
+  function (this: object, tone: string) {
+    if (tone !== 'neutral' && tone !== 'positive' && tone !== 'warning' && tone !== 'critical') {
+      throw new Error(`Unsupported badge tone: ${tone}`);
+    }
+    stateFor(this).badge = <StatusBadge status="passed" tone={tone} />;
+  },
+);
+
+Given('a badge for a failed review with no tone', function (this: object) {
+  stateFor(this).badge = <StatusBadge status="failed" />;
+});
+
+When('the badge is rendered', function (this: object) {
+  const state = stateFor(this);
+  if (state.badge === undefined) {
+    throw new Error('No badge was configured');
+  }
+  state.markup = renderToStaticMarkup(state.badge);
+});
+
+Then('its markup carries the tone {string}', function (this: object, tone: string) {
+  const markup = requireMarkup(this);
+  if (!markup.includes(`data-tone="${tone}"`)) {
+    throw new Error(`Expected ${markup} to carry tone ${tone}`);
+  }
+});
+
+Then('it still reads {string}', function (this: object, label: string) {
+  const markup = requireMarkup(this);
+  if (!markup.includes(`>${label}<`)) {
+    throw new Error(`Expected ${markup} to read ${label}`);
+  }
+});

```

# Current briefing update
support:design-guidance no longer applies to this task.

# Current procedure
Do this, in order:

1. Reuse earlier understanding of captured guidance with the same known identity.
   Refresh guidance whose identity changed or cannot be established. Only the
   listed guidance is the standard; a preference of your own is not. Every
   reported concern still requires current `snapshot_read` evidence for its ground.
2. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`. Read the complete patches supplied in this message.
   Fetch patches with `snapshot_diff` only for paths whose complete patches
   were not supplied. Read the surrounding source where a patch alone does
   not show the design.
3. Ask of each change: does it follow the guidance's principles and the
   module's stated responsibility, or does it duplicate, entangle or place
   something where the guidance says it does not belong?
4. Submit.

## What a concern is

A concern is a design problem the guidance lets you name: the rule or
responsibility it departs from, cited by the guidance file, the consequence,
the evidence in the candidate, how sure you are, a bounded remedy and its
risk. Its ground is that guidance file, read with `snapshot_read` in this
review even if an earlier conversation already showed it to you.
Correctness defects and scope gaps belong to other reviews. Report each
distinct problem once. `suggests` may name a CheckFinding the message below
lists when you believe yours is the same problem, and is otherwise null.

## Coverage

Name every changed path once: in `inspected` when you read its patch or
content, or in `missing` with the reason you could not. The harness checks
`inspected` against the complete patches delivered in this message and the
reads its tools answered. A changed-path list, patch summary or omitted patch
is not inspection evidence. No concern and nothing
missing says the candidate's design follows the listed guidance; that is a
valid review, and so is an honest partial one.

# Current environment
{
  "projectRoot": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
  "workingDirectory": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/reviews/rq-0003/attempts/01/workspace",
  "candidate": "40155157c0af1fa686ec5b8579755c17a6364613",
  "snapshot": "36c77a3a474e60064bbb3efabdd5c0547a92133a",
  "limits": {
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "infrastructureRetriesPerGate": 2,
    "forkRetriesPerRequest": 2,
    "budgetReturnsPerIteration": 6,
    "sessionReconstructionsPerWork": 2,
    "cycleReplansPerWorkItem": 1,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "readinessRecoveries": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000,
    "invocationIdleMs": 300000,
    "invocationAbsoluteMs": 599960,
    "maxIterationsPerWorkItem": 12,
    "maxIterationsPerCapabilityTask": 24,
    "maxWorkItems": 64,
    "maxPlacementRequests": 32,
    "maxInvocationsPerRun": 400,
    "runAbsoluteMs": 28800000,
    "reconciliationRoundsPerWorkItem": 3,
    "laterRoundMinimumRisk": "medium",
    "maxPlanDeviations": 5,
    "commandTimeoutMs": 600000,
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "nonfunctionalRoundsPerPlan": 3
  },
  "availableTools": [
    "snapshot_list",
    "snapshot_read",
    "snapshot_search",
    "snapshot_diff",
    "submit_review"
  ],
  "views": [],
  "supportPaths": [
    "subs/harness/src/prompts/reviewer.system.md",
    "subs/harness/src/prompts/design-review.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: design
Perform design for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_review`. Only an accepted submission completes this task.