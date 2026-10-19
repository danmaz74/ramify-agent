import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { repairDeltaSchema } from '../repair/repair-preparation.js';
import { runLayout } from '../../../../src/run/records.js';
import { cleanups, scenario, content, legacy, renamed } from './helpers/automatic-project-repair.js';
import { onlyRun, runEventsOnDisk, runPath, staleCrashLock } from '../../../../../../src/tests/helpers/runs.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';

// These small restart witnesses alter actual optional session payload bytes.
// Ordinary repair workflow tests use the configured in-memory session adapter.
vi.unmock('../../../../../session-store/src/session-store.js');

afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});

test.each([
  ['admitted', 'missing', false], ['admitted', 'corrupt', false], ['running', 'missing', false], ['running', 'corrupt', false], ['running', 'missing', true],
] as const)('restart during %s repair uses the durable assignment with %s optional context (downtime source %s)', async (stage, contextLoss, downtimeEdit) => {
  const subject = await scenario({ freezeStage: stage, downtimeEdit });
  if (downtimeEdit) await subject.addDowntimeSource();
  const payloads = join(subject.root, 'plans', '.harness', 'session-operations', 'store', 'payloads');
  for (const id of await readdir(payloads)) {
    if (contextLoss === 'missing') await rm(join(payloads, id));
    else await writeFile(join(payloads, id), 'corrupt optional provider context');
  }
  await staleCrashLock(subject.root);
  const reopened = await subject.reopen();
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled('review-notes', subject.runId);
  expect(onlyRun(reopened.service, 'review-notes').state, JSON.stringify(onlyRun(reopened.service, 'review-notes').failure)).toBe('completed');
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  expect(events.filter(event => event.type === 'repair-assignment-recorded')).toHaveLength(1);
  const repairs = events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair);
  expect(repairs).toHaveLength(1);
  expect(await readFile(join(subject.root, legacy), 'utf8')).toBe(content);
  expect(await readFile(join(subject.root, renamed), 'utf8')).toBe(content);
  expect(events.filter(event => event.type === 'repair-incident-recorded').at(-1)?.data.stage).toBe('continued');
  if (downtimeEdit) {
    const original = JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, 'repairs/sources/apr-0001.json'), 'utf8')) as { before: { path: string }[] };
    expect(original.before.some(file => file.path === subject.externalPath)).toBe(false);
    const delta = repairDeltaSchema.parse(JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.repairDelta('apr-0001')), 'utf8')));
    expect(delta.before.some(file => file.path === subject.externalPath)).toBe(true);
    expect(delta.changes.some(change => change.path === subject.externalPath)).toBe(false);
    expect(await readFile(join(subject.root, subject.externalPath), 'utf8')).toBe('export const externalNote = true;\n');
  }
  subject.boundary.assertComplete();
}, 60_000);
