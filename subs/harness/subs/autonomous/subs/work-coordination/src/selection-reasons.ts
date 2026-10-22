

import { join } from 'node:path';

import { type ContextSelection } from './context-selection/contracts.js';

import { kept } from '../../../../task-execution/src/results.js';

export function withSelectionReasons(text: string, selected: ContextSelection['selected']): string {
  const reasons = new Map(selected.map(entry => [entry.id, entry]));
  const lines = text.replace(/\n$/u, '').split('\n');
  const out: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const heading = /^### (\S+): /u.exec(lines[index]!);
    const entry = heading === null ? undefined : reasons.get(heading[1]!);
    if (entry === undefined) { out.push(lines[index]!); index++; continue; }
    let end = index + 1;
    while (end < lines.length && !/^#{2,3} /u.test(lines[end]!)) end++;
    const segment = lines.slice(index, end);
    const conditionsAt = segment.findIndex(line => line.startsWith('Conditions:'));
    const uncertaintyAt = segment.findIndex(line => line.startsWith('Uncertainty:'));
    if (conditionsAt < 0 || uncertaintyAt < conditionsAt) { out.push(...segment); index = end; continue; }
    const trimmed = (block: readonly string[]) => {
      const kept = [...block];
      while (kept.length > 0 && kept.at(-1)!.trim() === '') kept.pop();
      return kept;
    };
    const planConditions = trimmed(segment.slice(conditionsAt, uncertaintyAt));
    const planUncertainty = trimmed(segment.slice(uncertaintyAt));
    const conditions = [
      ...(planConditions[0] === 'Conditions: none recorded.' ? [] : planConditions.slice(1)),
      ...entry.conditions.map(condition => `- selection: ${condition.replace(/\n/gu, '\n  ')}`),
    ];
    const uncertainty = [
      ...(planUncertainty[0] === 'Uncertainty: none recorded.' ? [] : [planUncertainty.join('\n').slice('Uncertainty: '.length)]),
      ...(entry.uncertainty.trim() === '' ? [] : [`${entry.uncertainty.trim()} (the selection's reading)`]),
    ];
    out.push(...trimmed(segment.slice(0, conditionsAt)), '', `Why it is in view: ${entry.reason}`);
    if (conditions.length > 0) out.push('', 'Conditions:', ...conditions);
    if (uncertainty.length > 0) out.push('', `Uncertainty: ${uncertainty.join('\n')}`);
    if (end < lines.length) out.push('');
    index = end;
  }
  return `${out.join('\n')}\n`;
}
