import { describe, expect, test } from 'vitest';
import { declaredRoots } from '../measurement/inputs.js';
import { architectIndex, moduleEntry } from './helpers/views.js';

// Pure recorded-call, timing and charge cases live in the KPI child;
// only execution's assignment-to-root translation belongs here.
describe('the roots a reader is judged against', () => {
  const index = { revision: 'r', input: 'i', symbols: new Map(),
    modules: architectIndex([moduleEntry('shop', '', null), moduleEntry('shop/orders', 'subs/orders', 'shop')]).modules };
  const scope = { exactOwners: ['shop/orders'], subtrees: [], apiViews: true, architectView: true, supportDocuments: [] };

  test('the selected modules\' directories, the global view and the named locations', () => {
    expect(declaredRoots(index, { ...scope, locations: [{ path: 'scripts/x.ts', bytes: 1 }] })).toEqual(['subs/orders', '.ramify-architect', 'scripts/x.ts']);
    expect(declaredRoots(index, { ...scope, exactOwners: [], subtrees: ['shop'], architectView: false })).toEqual(['.']);
  });

  test('without a declared scope, a view, or a placeable module, there is nothing to judge against', () => {
    expect(declaredRoots(index, undefined)).toEqual([]);
    expect(declaredRoots(null, scope)).toEqual([]);
    expect(declaredRoots(index, { ...scope, exactOwners: ['shop/nowhere'] })).toEqual([]);
  });
});
