import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import type { SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import type { ScriptStep } from '../../subs/agent/src/scripted.js';
import { openUnchangedRuns as openRuns, assertUnchangedGit } from './helpers/unchanged-run.js';
import { scenariosCommit } from './helpers/scripted-git.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, entry, requestCompletion } from './helpers/analysis.js';
import { assign, completionProposed, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { installTestRunner, onlyRun, runEventsOnDisk, startRun } from './helpers/runs.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

const notes = 'collection-review/workspace/reviews';
const review = (action: 'continue' | 'handoff') => ({ action, reason: action === 'continue' ? 'The current approach remains useful.' : 'Reconsider the unfinished assignment.' });

test.each(['continue', 'handoff'] as const)('native-like compaction review %s preserves the task and architect decision', async action => {
  const fixture = await copyFixture(); cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  let localTurn = 0;
  let engineerTurn = 0;
  const { service, agent } = await openRuns(fixture.root, {
    inputs: treeInputs(),
    unchangedCheckpoints: [scenariosCommit('review-notes'), ...(action === 'continue' ? ['wi-001.i01'] : []), 'wi-001', 'final verification of plan "review-notes"'],
    script: (spec: SessionSpec): readonly ScriptStep[] => {
      if (spec.role === 'catalog-extractor') return [];
      if (spec.role === 'initial-architect') return submit(analysis([entry('review-note', notes)]));
      if (spec.submission.name === 'submit_compaction_review') return submit(review(action));
      if (spec.role === 'local-architect') return ++localTurn === 1
        ? submit(assign(notes, {}, outline())) : submit(requestCompletion());
      if (spec.role === 'engineer') {
        engineerTurn++;
        if (engineerTurn === 1) return [write('partial.txt', 'Retained draft\n'), { kind: 'compaction-checkpoint', reason: 'threshold' },
          ...(action === 'handoff' ? [write('after-handoff.txt', 'Must not run\n')] : []),
          ...submit(completionProposed('Finished after architect review.'))];
        return submit(completionProposed('Finished from retained work.'));
      }
      return [];
    },
  });
  cleanups.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes'));
  await service.settled('review-notes', receipt.jobId);
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(events.filter(event => event.type === 'compaction-review-started')).toHaveLength(1);
  expect(events.filter(event => event.type === 'compaction-reviewed').map(event => event.data.action)).toEqual([action]);
  expect(events.filter(event => event.type === 'invocation-ended' && event.data.ended === 'checkpoint-pending')).toHaveLength(action === 'handoff' ? 1 : 0);
  expect(existsSync(join(fixture.root, 'subs/workspace/subs/reviews/src/partial.txt'))).toBe(true);
  expect(existsSync(join(fixture.root, 'subs/workspace/subs/reviews/src/after-handoff.txt'))).toBe(false);
  expect(events.some(event => event.type === 'job-failed' && event.data.reason === 'agent-failed')).toBe(false);
  expect(onlyRun(service, 'review-notes')).toMatchObject({ state: 'completed', failure: null });
  expect(agent!.sessions.filter(session => session.spec.role === 'engineer')).toHaveLength(1);
}, 180_000);
