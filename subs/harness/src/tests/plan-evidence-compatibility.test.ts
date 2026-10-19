import { rm } from 'node:fs/promises';


import { afterEach, expect, it } from 'vitest';


import { defaultRunPolicy } from '../run/policy.js';
import { runRecordSchema } from '../../subs/autonomous/src/run/records.js';
import { constructedRecord } from './helpers/constructed.js';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });

it('refuses earlier run policy at the current decoder instead of adapting its records', () => {
  const current = defaultRunPolicy({ projectRoot: '/tmp/legacy-project' });
  expect(runRecordSchema.safeParse({ ...constructedRecord(), policy: { ...current, version: 'run-policy/3' } }).success).toBe(false);
});
