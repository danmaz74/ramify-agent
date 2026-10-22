import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { deliveredSupportEntries, invocationScope } from '../../subs/kpi/src/measurement/inputs.js';
import type { DeliveredManifest } from '../../subs/task-execution/src/delivery/delivered-manifest.js';
import type { DeclaredScope } from '../../subs/kpi/src/capture.js';

const scope: DeclaredScope = { exactOwners: ['p/a'], subtrees: ['p/b'], apiViews: true,
  architectView: false, supportDocuments: ['old.md'], nestedProjects: ['nested'] };

test('execution translates ordered delivered facts without rewriting hashes, bytes or source lists', () => {
  const entries: DeliveredManifest['entries'] = [
    { key: 'one', kind: 'skill', source: 'same.md', revision: 'r1', hash: 'first', bytes: 7, delivery: 'inherited',
      sources: [{ path: 'expanded.md', hash: 'expanded', bytes: 11 }, { path: 'same.md', hash: 'first', bytes: 7 }] },
    { key: 'two', kind: 'brief', source: null, revision: null, hash: 'brief', bytes: 5, delivery: 'appended', sources: [] },
    { key: 'three', kind: 'skill', source: 'same.md', revision: 'r2', hash: 'conflict', bytes: 8, delivery: 'appended', sources: [] },
  ];
  const manifest: DeliveredManifest = { schema: 'ramify-agent.delivered-inputs/2', inheritedPoint: 'point', currentMessage: null, hash: 'manifest', entries };
  const translated = deliveredSupportEntries(manifest);
  expect(translated).toEqual([
    { kind: 'skill', source: 'same.md', hash: 'first', bytes: 7,
      sources: [{ path: 'expanded.md', hash: 'expanded', bytes: 11 }, { path: 'same.md', hash: 'first', bytes: 7 }] },
    { kind: 'brief', source: null, hash: 'brief', bytes: 5, sources: [] },
    { kind: 'skill', source: 'same.md', hash: 'conflict', bytes: 8, sources: [] },
  ]);
  expect(translated[0]!.sources).not.toBe(entries[0]!.sources);
});

test('invocation scope takes support bytes from delivered entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'measurement-inputs-'));
  try {
    const manifest: DeliveredManifest = { schema: 'ramify-agent.delivered-inputs/2', inheritedPoint: null,
      currentMessage: null, hash: 'manifest', entries: [
        { key: 'brief', kind: 'brief', source: null, revision: null, hash: 'brief', bytes: 13, delivery: 'appended', sources: [] },
      ] };
    expect(await invocationScope(root, scope, manifest)).toEqual({ ...scope,
      locations: [], supportDocuments: [], brief: 13 });
  } finally { await rm(root, { recursive: true, force: true }); }
});
