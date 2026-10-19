import { expect, test } from 'vitest';
import { z } from 'zod';
import { observeValues, unionInventory } from './helpers/unions.js';

test('retained completion snapshots preserve owning union identities and inventory new snapshot-only values', () => {
 const fork = z.discriminatedUnion('kind', [z.object({ kind: z.literal('session') }), z.object({ kind: z.literal('none') })]);
 const request = z.object({ forkPoint: fork });
 const evidence = z.enum(['retained', 'unavailable']);
 const log = z.discriminatedUnion('type', [z.object({ type: z.literal('capability-verification-started'), data: z.object({ completion: request.extend({ evidence }) }) })]);
 const inventory = unionInventory({ 'run log': log, 'record review-request': request });
 expect(inventory.get(fork)?.name).toBe('record review-request.forkPoint.kind');
 expect(inventory.get(fork)?.values).toEqual(['session', 'none']);
 expect(inventory.get(evidence)?.name).toBe('run log[capability-verification-started].data.completion.evidence');
 const observed = new Map<unknown, Set<string>>();
 observeValues(log, { type: 'capability-verification-started', data: { completion: { forkPoint: { kind: 'session' }, evidence: 'retained' } } }, observed);
 expect([...observed.get(fork)!]).toEqual(['session']);
 expect([...observed.get(evidence)!]).toEqual(['retained']);
});
