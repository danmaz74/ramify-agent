import { expect, test } from 'vitest';
import { planningRecords } from '../committed.js';
import { CommittedRecordError, type ReplayedLine } from '../../../../../../src/jobs/committed-reader.js';

const registry = (revision: number, owner = 'root/first') => ({
  schema: 'ramify-agent.capability/2', capability: 'capability:render', revision,
  behavior: 'Render the page', owner, origin: 'entry', decision: null, consumers: [],
});
const line = (...bodies: unknown[]): ReplayedLine => ({ transaction: { records: bodies.map((body, index) => ({ path: `records/${index}.json`, body })) } });

test('projects accepted entries and the latest registry revision from the immutable committed line', () => {
  const entries = { schema: 'ramify-agent.entry-assignments/2', view: { status: 'placeholder' }, entries: [] };
  const lines = [line(entries, registry(2, 'root/latest')), line(registry(1))];
  const before = structuredClone(lines);
  expect(planningRecords(lines)).toEqual({ entries, hypotheses: [], registry: [registry(2, 'root/latest')] });
  expect(lines).toEqual(before);
});

test('ignores other owners’ bodies while refusing corrupt planning records with the committed path', () => {
  expect(planningRecords([line({ schema: 'ramify-agent.work-item/2', corrupt: true })])).toEqual({ entries: null, hypotheses: [], registry: [] });
  expect(() => planningRecords([line({ ...registry(1), revision: 0 })])).toThrow(CommittedRecordError);
  try { planningRecords([line({ ...registry(1), revision: 0 })]); }
  catch (error) { expect(error).toMatchObject({ path: 'records/0.json' }); }
});
