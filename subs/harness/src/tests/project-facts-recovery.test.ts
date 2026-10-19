import { expect, test } from 'vitest';
import { RamifyCli } from '../../subs/evidence/src/ramify-cli.js';
import { OwnershipCancelledError, OwnershipUnavailableError, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
import { auditPreparationPathsOf, defaultWriteScopesOf } from '../../subs/autonomous/src/run/project-facts.js';

class FailedOwnership extends RamifyCli {
  calls = 0;
  constructor(private readonly failure: Error) { super({ executable: '/nonexistent/no-process' }); }
  override async queryOwnershipAnswer(): Promise<OwnershipAnswer> { this.calls += 1; throw this.failure; }
}
const raw = { exitCode: 2, stdout: 'failure bytes', stderr: '', report: null };
const failure = () => new OwnershipUnavailableError({ ...raw, status: 'unavailable', failureStatus: 'invalid', reason: 'invalid configuration', decoded: null });

test('read-only preparation retains captured configuration protection without a current query', async () => {
  const provider = new FailedOwnership(failure());
  expect(await auditPreparationPathsOf(provider, '/project', undefined, ['config/project.json', 'subs/tool/tsconfig.json'])).toEqual(['config/project.json', 'subs/tool/tsconfig.json']);
  expect(provider.calls).toBe(0);
});

test('read-only preparation names unavailable configuration authority rather than inventing it', async () => {
  const provider = new FailedOwnership(failure());
  const notes: string[] = [];
  expect(await auditPreparationPathsOf(provider, '/project', undefined, [], note => notes.push(note))).toEqual([]);
  expect(notes[0]).toContain('no assignment configuration authority is recorded');
});

test('cancellation and harness corruption do not become read-only unavailable fallbacks', async () => {
  const cancelled = new OwnershipCancelledError({ ...raw, exitCode: 130, status: 'cancelled' });
  for (const error of [cancelled, new Error('corrupt durable authority')]) {
    await expect(auditPreparationPathsOf(new FailedOwnership(error), '/project', undefined)).rejects.toBe(error);
    await expect(defaultWriteScopesOf(new FailedOwnership(error), '/project', null, [], [])).rejects.toBe(error);
  }
});
