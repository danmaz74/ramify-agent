

import { join } from 'node:path';

import { findModule, type ArchitectIndex } from '../../../../evidence/src/views.js';

import type { ViewIdentity } from '../../../../../src/interfaces/protocol/evidence.js';
import { roleDisplayName } from '../../../../../src/interfaces/protocol/runs.js';

import { kept, type InvocationResult } from '../../../../task-execution/src/results.js';

import { type PlacementEvidence } from './architecture/submission.js';

import { committedRecords } from '../../../src/run/committed-records.js';

import { type ArchitectRef } from '../../../../task-execution/src/records.js';

export function declarationsBetween(index: ArchitectIndex | null, consumer: string, provider: string): string[] {
  if (index === null) return [];
  const ancestors = (module: string): string[] => {
    const parts = module.split('/');
    return parts.map((_, position) => parts.slice(0, position + 1).join('/'));
  };
  const common = ancestors(consumer).filter(candidate => ancestors(provider).includes(candidate)).at(-1);
  if (common === undefined) return [];
  const onPath = new Set([...ancestors(consumer), ...ancestors(provider)].filter(module => module === common || module.startsWith(`${common}/`)));
  const declarations: string[] = [];
  for (const module of onPath) {
    const entry = findModule(index, module);
    if (entry === undefined) continue;
    declarations.push(entry.dir === '' ? 'module.ramify' : `${entry.dir}/module.ramify`);
  }
  return [...new Set(declarations)].sort();
}
export function placementEvidenceOf(records: ReturnType<typeof committedRecords>, index: ArchitectIndex | null): PlacementEvidence {
  return {
    index,
    registry: new Map(records.registry.map(entry => [entry.capability, entry])),
    hypotheses: new Map(records.hypotheses.map(hypothesis => [hypothesis.id, hypothesis])),
    decisions: records.decisions,
    workItems: new Set(records.workItems.map(item => item.id)),
  };
}
export function sameView(left: ViewIdentity, right: ViewIdentity): boolean {
  if (left.status !== 'materialized' || right.status !== 'materialized') return left.status === right.status;
  return left.revision === right.revision && left.input === right.input;
}
export function identityOf(view: ViewIdentity): string {
  return view.status === 'materialized' ? `${view.revision} (${view.input})` : 'unmaterialized';
}
export function directoryOf(index: ArchitectIndex | null, module: string): string {
  return index?.modules.get(module)?.dir ?? '';
}
export function rootModuleOf(index: ArchitectIndex | null): string | undefined {
  if (index === null) return undefined;
  for (const entry of index.modules.values()) if (entry.parent === null) return entry.module;
  return undefined;
}
export function architectRefOf(result: InvocationResult<unknown>): ArchitectRef | null {
  return result.kept && result.ref !== '' && result.session !== '' ? { session: result.session, ref: result.ref } : null;
}
export function failedWithoutResult(role: string, iteration: string, result: InvocationResult<unknown>): string {
  const cause = [result.interruption ?? result.ended, result.error].filter(part => part !== undefined && part !== '').join(': ');
  return `the ${roleDisplayName(role).toLowerCase()} of ${iteration} ended without a result (${cause}; invocation ${result.id})`;
}
