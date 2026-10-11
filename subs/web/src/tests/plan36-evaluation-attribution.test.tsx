import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { EvaluationFacts } from '../evaluation.js';
import { evaluation } from './helpers/sessions.js';

afterEach(cleanup);

test('transcript evaluation facts show recorded snapshot provenance without changing guarding evidence', () => {
  const path = 'subs/validation/module.ramify';
  render(<EvaluationFacts evaluation={evaluation('inv-0012', { outsideScope: [path], outsideScopeEvidence: [{
    path, attributable: false, observations: [{ number: 258, callId: null, observedBy: 'snapshot', attributable: false }],
    uncertainty: 'Mutation evidence is incomplete: a row cannot be read.',
  }] })} />);
  const facts = screen.getByLabelText('Evaluation of inv-0012');
  expect(facts.textContent).toContain('partial');
  expect(facts.textContent).toContain(`${path}: observed during inv-0012; not attributable to this invocation (snapshot observation 258)`);
  expect(facts.textContent).toContain('Mutation evidence is incomplete: a row cannot be read.');
  expect(facts.textContent).toContain('2 passed, 1 with findings, 0 not checked');
});

test('an older evaluation response presents attribution as unknown', () => {
  render(<EvaluationFacts evaluation={evaluation('inv-0012', { outsideScope: ['README.md'] })} />);
  expect(screen.getByLabelText('Evaluation of inv-0012').textContent).toContain('README.md: observed during inv-0012; attribution unknown');
});
