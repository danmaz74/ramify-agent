import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import type { AcceptedScenarioForm } from '../form.js';
import { assignScenarioIds, lowestCommonAncestor, scenarioRecordSchema, scenarioSourceHash, type ScenarioIdContext } from '../records.js';

const form: AcceptedScenarioForm = {
  scenarios: [
    { key: 'send-email', entry: 'capability:send-customer-email', origin: { kind: 'plan', planScenario: 'plan-scenario:a-customer-receives-the-email', document: 'document:email-plan', lines: [4, 7] }, partOf: 'plan-scenario:a-sent-email-is-listed', name: 'A customer receives the email', source: ['Scenario: A customer receives the email', '  Given a customer'] },
    { key: 'history', entry: 'capability:email-history', origin: { kind: 'architect', refs: ['functional-requirement:record-email-history'] }, partOf: 'plan-scenario:a-sent-email-is-listed', name: 'Sent emails appear', source: ['Scenario: Sent emails appear', '  When the user opens the history'] },
    { key: 'audit', entry: 'capability:audit-trail', origin: { kind: 'architect', refs: [] }, partOf: null, name: 'Audited', source: ['Scenario: Audited', '  Then an audit line is written'] },
  ],
  integrations: [
    { planScenario: 'plan-scenario:a-sent-email-is-listed', document: 'document:email-plan', lines: [9, 13], subScenarios: ['send-email', 'history'], name: 'A sent email is listed', source: ['Scenario: A sent email is listed', '  Given a customer', '  When the user opens the history'] },
  ],
};

const context: ScenarioIdContext = {
  planId: 'send-customer-email',
  entries: [
    { capability: 'capability:send-customer-email', owner: 'shop/customers/mail' },
    { capability: 'capability:email-history', owner: 'shop/customers/history' },
    { capability: 'capability:audit-trail', owner: 'shop/audit-checks' },
  ],
  modules: [
    { module: 'shop', dir: '', testing: false },
    { module: 'shop/customers', dir: 'subs/customers', testing: false },
    { module: 'shop/customers/mail', dir: 'subs/customers/subs/mail', testing: false },
    { module: 'shop/customers/history', dir: 'subs/customers/subs/history', testing: false },
    { module: 'shop/audit-checks', dir: 'subs/audit-checks', testing: true },
  ],
};

describe('assigning scenario IDs', () => {
  const assigned = assignScenarioIds(form, context);

  test('entry scenarios in submission order, then integration scenarios', () => {
    expect(assigned.records.map((record) => [record.id, record.kind, record.entry])).toEqual([
      ['scenario:a-customer-receives-the-email', 'entry', 'capability:send-customer-email'],
      ['scenario:sent-emails-appear', 'entry', 'capability:email-history'],
      ['scenario:audited', 'entry', 'capability:audit-trail'],
      ['scenario:a-sent-email-is-listed', 'integration', null],
    ]);
    expect([...assigned.idsByKey]).toEqual([['send-email', 'scenario:a-customer-receives-the-email'], ['history', 'scenario:sent-emails-appear'], ['audit', 'scenario:audited']]);
    expect([...assigned.idsByPlanScenario]).toEqual([['plan-scenario:a-sent-email-is-listed', 'scenario:a-sent-email-is-listed']]);
    for (const record of assigned.records) expect(scenarioRecordSchema.parse(record)).toEqual(record);
  });

  test('current records serialize exactly and preserve accepted citations', () => {
    const current = assigned.records[0]!;
    const bytes = JSON.stringify(current);
    expect(scenarioRecordSchema.parse(JSON.parse(bytes))).toEqual(current);
    expect(JSON.stringify(scenarioRecordSchema.parse(current))).toBe(bytes);
    expect(current.citedElements).toEqual([]);
    const cited = { ...current, citedElements: ['functional-requirement:send-email', 'functional-requirement:show-email-history'] };
    expect(scenarioRecordSchema.parse(cited).citedElements).toEqual(cited.citedElements);
    expect(JSON.stringify(current)).toBe(bytes);
  });

  test('an entry scenario\'s owner is its entry\'s, and its file is in the owner\'s test area', () => {
    const [mail, history, audit] = assigned.records;
    expect(mail).toMatchObject({ owner: 'shop/customers/mail', file: 'subs/customers/subs/mail/src/tests/features/send-customer-email/capability%3Asend-customer-email.feature' });
    expect(history).toMatchObject({ owner: 'shop/customers/history', file: 'subs/customers/subs/history/src/tests/features/send-customer-email/capability%3Aemail-history.feature' });
    expect(audit).toMatchObject({ owner: 'shop/audit-checks', file: 'subs/audit-checks/src/features/send-customer-email/capability%3Aaudit-trail.feature' });
  });

  test('an integration scenario is owned by the lowest common ancestor of its sub-scenarios\' owners', () => {
    const integration = assigned.records[3]!;
    expect(integration).toMatchObject({
      owner: 'shop/customers',
      file: 'subs/customers/src/tests/features/send-customer-email/integration.feature',
      subScenarios: ['scenario:a-customer-receives-the-email', 'scenario:sent-emails-appear'],
      partOf: null,
      origin: { kind: 'plan', planScenario: 'plan-scenario:a-sent-email-is-listed', ref: { document: 'document:email-plan', lines: [9, 13] } },
    });
    expect(assigned.records[0]!.partOf).toBe('scenario:a-sent-email-is-listed');
    expect(assigned.records[1]!.partOf).toBe('scenario:a-sent-email-is-listed');
    expect(assigned.records[2]!.partOf).toBeNull();
  });

  test('origins, sources and their hashes', () => {
    expect(assigned.records[0]!.origin).toEqual({ kind: 'plan', planScenario: 'plan-scenario:a-customer-receives-the-email', ref: { document: 'document:email-plan', lines: [4, 7] } });
    expect(assigned.records[1]!.origin).toEqual({ kind: 'architect', refs: ['functional-requirement:record-email-history'] });
    const expected = createHash('sha256').update('Scenario: Audited\n  Then an audit line is written').digest('hex');
    expect(assigned.records[2]!.hash).toBe(`sha256:${expected}`);
    expect(scenarioSourceHash(assigned.records[2]!.source)).toBe(assigned.records[2]!.hash);
  });

  test('the root module\'s files sit in its own src/tests', () => {
    const rooted = assignScenarioIds({ scenarios: [form.scenarios[2]!], integrations: [] }, {
      ...context,
      entries: [{ capability: 'capability:audit-trail', owner: 'shop' }],
    });
    expect(rooted.records[0]!.file).toBe('src/tests/features/send-customer-email/capability%3Aaudit-trail.feature');
  });

  test('a module not given is a caller\'s error', () => {
    const modules = context.modules.filter((module) => module.module !== 'shop/customers');
    expect(() => assignScenarioIds(form, { ...context, modules })).toThrow('No module "shop/customers"');
  });
});

describe('the lowest common ancestor', () => {
  test('of siblings, of a module and its descendant, and of one module', () => {
    expect(lowestCommonAncestor(['app/a/x', 'app/a/y'])).toBe('app/a');
    expect(lowestCommonAncestor(['app/a', 'app/a/b/c'])).toBe('app/a');
    expect(lowestCommonAncestor(['app/b', 'app/a/x'])).toBe('app');
    expect(lowestCommonAncestor(['app/a'])).toBe('app/a');
  });

  test('compares whole names, not prefixes', () => {
    expect(lowestCommonAncestor(['app/orders', 'app/order'])).toBe('app');
  });

  test('of nothing, or of different roots, is an error', () => {
    expect(() => lowestCommonAncestor([])).toThrow();
    expect(() => lowestCommonAncestor(['a/x', 'b/x'])).toThrow('share no root');
  });
});
