import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ManualRun } from '../steps/manual.js';
import { manualGates } from '../steps/manual-hosts.js';
import { RunLog } from '../../../autonomous/src/run/log.js';
import { WriterOwnership } from '../../../task-execution/src/writer.js';
import type { ArchitectIndex } from '../../../evidence/src/views.js';
import { defaultRunPolicy } from '../../../../src/run/policy.js';
import { temporaryDirectory } from '../../../../src/tests/helpers/fixture.js';
import { mockGit } from '../../../../src/tests/helpers/mock-git.js';
import { FakeRamifyCli } from '../../../../src/tests/helpers/fake-ramify.js';
import { passingAudit } from '../../../../src/tests/helpers/direct-check-execution.js';
import { scriptedCandidates } from '../../../autonomous/subs/acceptance/src/tests/helpers/candidates.js';

test('manual invocation and gate adapters detach observations from the manual lifecycle', async () => {
  const fixture = await temporaryDirectory();
  try {
    const log = await RunLog.open(join(fixture.path, 'events.jsonl'), 'R');
    const policy = defaultRunPolicy({ projectRoot: fixture.path });
    const run = new ManualRun({ schema: 'ramify-agent.job/3', kind: 'manual', jobId: 'R', planId: 'P',
      projectRoot: fixture.path, createdAt: new Date().toISOString(), base: 'B', branch: null, origin: 'step-run', policy },
      fixture.path, log, new WriterOwnership({ settleMs: 1000 }));
    await run.execution.write({ type: 'invocation-started', data: { invocation: 'inv-0001', role: 'engineer', session: 'ses-0001', work: {}, start: 'opened' } },
      [{ path: 'observer.json', id: 'observer', revision: 1, body: { nested: { accepted: true } } }]);
    const index: ArchitectIndex = { revision: 'V', input: 'I', modules: new Map([['root', {
      module: 'root', dir: '', parent: null, children: ['child'], tags: [], areas: ['src'],
    }]]), symbols: new Map() };
    const gates = manualGates({ projectRoot: fixture.path, git: mockGit({}),
      ramify: new FakeRamifyCli(), candidates: scriptedCandidates(fixture.path, {}),
      configuredAudit: passingAudit(), refresh: async () => index, warn: () => undefined }, run);
    const received = await gates['host'].refreshIndex();
    expect(received).not.toBeNull();
    (received!.modules.get('root')!.children as string[]).push('unaccepted-child');
    expect(run.index!.modules.get('root')!.children).toEqual(['child']);
    const context = run.execution;
    for (const name of ['log', 'mutex', 'starting', 'live', 'writer']) expect(name in context).toBe(false);
    const before = JSON.stringify(run.log.ledger.replay());
    const version = run.log.version;
    Reflect.set(context.events()[0]!.data, 'role', 'unaccepted-role');
    const body = context.record('observer.json', 'first')!.body as { nested: { accepted: boolean } };
    body.nested.accepted = false;
    (context.index!.modules.get('root')!.children as string[]).push('unaccepted-context-child');
    Reflect.set(context.policy.limits, 'writerSettleMs', -1);
    expect(run.policy.limits.writerSettleMs).not.toBe(-1);
    expect(run.index!.modules.get('root')!.children).toEqual(['child']);
    expect(JSON.stringify(run.log.ledger.replay())).toBe(before);
    expect(run.log.version).toBe(version);
  } finally { await fixture.remove(); }
});
