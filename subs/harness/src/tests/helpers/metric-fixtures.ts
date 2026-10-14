import type { Metric } from '../../interfaces/protocol/runs.js';
import type { ScopeSize } from '../../run/records.js';

/** Shared recorded values for calculation and focused projection witnesses. */
export function size(bytes: number | null, missing?: string): ScopeSize {
  const components: ScopeSize['components'] = [
    { component: 'owned-source', detail: 'x', bytes: missing === 'owned-source' ? null : (bytes ?? 0), state: missing === 'owned-source' ? 'unknown' : 'measured', ...(missing === 'owned-source' ? { reason: 'a module that does not exist yet' } : {}) },
    { component: 'api-views', detail: 'x', bytes: 0, state: 'measured' },
    { component: 'architect-view', detail: 'x', bytes: missing === 'architect-view' ? null : 0, state: missing === 'architect-view' ? 'unavailable' : 'measured', ...(missing === 'architect-view' ? { reason: 'not published' } : {}) },
    { component: 'support-documents', detail: 'x', bytes: 0, state: 'measured' },
  ];
  const known = components.filter(component => component.state === 'measured').reduce((total, component) => total + (component.bytes ?? 0), 0);
  return { policy: 'scope-size/2', snapshot: 'ms-0001', components, bytes: missing === undefined ? known : null, subtotal: known, coverage: missing === undefined ? 'complete' : 'partial' };
}

export const usage = { input: 100, output: 10, cacheRead: 1000, cacheWrite: 50, total: 1160 };

export function find(metrics: readonly Metric[], id: string): Metric {
  const metric = metrics.find(candidate => candidate.id === id);
  if (metric === undefined) throw new Error(`no metric ${id}`);
  return metric;
}
