import { expect, test } from 'vitest';
import { coordinationRecords } from '../work/committed.js';

test('a committed assignment without its captured boundary names the required write-scope form', () => {
  const path = 'work-items/item/iterations/01/assignment.json';
  const record = { schema: 'ramify-agent.iteration-assignment/2', scope: { resolved: {} } };
  expect(() => coordinationRecords([{ transaction: { records: [{ path, body: record }] } }]))
    .toThrow(`${path}: write scope expects ramify-agent.assignment-boundary/1 with nestedDeclarations`);
});
