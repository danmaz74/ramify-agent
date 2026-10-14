import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { deliveredSupportEntries, invocationScope } from '../measurement/inputs.js';
import type { DeliveredManifest } from '../prompts/delivered-manifest.js';
import type { LoadedPackage } from '../prompts/packages.js';
import type { DeclaredScope } from '../../subs/kpi/src/capture.js';

const scope: DeclaredScope = { exactOwners: ['p/a'], subtrees: ['p/b'], apiViews: true,
  architectView: false, supportDocuments: ['old.md'], nestedProjects: ['nested'] };
const loaded: LoadedPackage = { role: 'engineer', package: 'engineer', hash: 'package', files: [
  { path: 'unused.md', hash: 'unused', bytes: 999, kind: 'skill' },
], submissionKinds: [], system: '', procedure: '', skill: '', skillDirectory: '', extraSkill: '', submissionSchema: '' };

test('execution translates ordered delivered facts without rewriting hashes, bytes or source lists', () => {
  const entries: DeliveredManifest['entries'] = [
    { key: 'one', kind: 'skill', source: 'same.md', revision: 'r1', hash: 'first', bytes: 7, delivery: 'inherited',
      sources: [{ path: 'expanded.md', hash: 'expanded', bytes: 11 }, { path: 'same.md', hash: 'first', bytes: 7 }] },
    { key: 'two', kind: 'brief', source: null, revision: null, hash: 'brief', bytes: 5, delivery: 'appended', sources: [] },
    { key: 'three', kind: 'skill', source: 'same.md', revision: 'r2', hash: 'conflict', bytes: 8, delivery: 'appended', sources: [] },
  ];
  const manifest: DeliveredManifest = { schema: 'ramify-agent.delivered-inputs/1', inheritedPoint: 'point', currentMessage: null, hash: 'manifest', entries };
  const translated = deliveredSupportEntries(manifest);
  expect(translated).toEqual([
    { kind: 'skill', source: 'same.md', hash: 'first', bytes: 7,
      sources: [{ path: 'expanded.md', hash: 'expanded', bytes: 11 }, { path: 'same.md', hash: 'first', bytes: 7 }] },
    { kind: 'brief', source: null, hash: 'brief', bytes: 5, sources: [] },
    { kind: 'skill', source: 'same.md', hash: 'conflict', bytes: 8, sources: [] },
  ]);
  expect(translated[0]!.sources).not.toBe(entries[0]!.sources);
});

test('legacy package fallback preserves paths and UTF-8 brief bytes; delivery replaces inventory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'measurement-inputs-'));
  try {
    expect(await invocationScope(root, 'p', scope, loaded, 'é')).toEqual({ ...scope, locations: [],
      supportDocuments: ['plans/p/plan.md', 'unused.md'], brief: 2 });
    const manifest: DeliveredManifest = { schema: 'ramify-agent.delivered-inputs/1', inheritedPoint: null,
      currentMessage: null, hash: 'manifest', entries: [
        { key: 'brief', kind: 'brief', source: null, revision: null, hash: 'brief', bytes: 13, delivery: 'appended', sources: [] },
      ] };
    // Delivered byte facts win over both current text and available package inventory.
    expect(await invocationScope(root, 'p', scope, loaded, 'different', manifest)).toEqual({ ...scope,
      locations: [], supportDocuments: [], brief: 13 });
  } finally { await rm(root, { recursive: true, force: true }); }
});
