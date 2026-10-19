import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { ObservationLog } from '../observations.js';
import { SubmissionJudge, ToolInputJudge, type SubmissionError } from '../submissions.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

async function observations() {
  const directory = await mkdtemp(join(tmpdir(), 'ramify-submissions-'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  return ObservationLog.open(join(directory, 'observations.jsonl'));
}

const errors: SubmissionError[] = Array.from({ length: 25 }, (_, index) => ({
  path: `entries.${index}.name`, message: `Name ${index} is missing`, expected: 'nonempty string',
}));

test('submission corrections retain all diagnostics and accept after the former limit', async () => {
  const log = await observations();
  let accepted = 0;
  const judge = new SubmissionJudge({
    target: 'submit_result', bound: 3, observations: log,
    validate: input => input === 'correct' ? { ok: true as const, value: input } : { ok: false as const, errors },
    accept: async () => { accepted++; },
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const verdict = await judge.judge('wrong', `call-${attempt}`);
    expect(verdict).toMatchObject({ accepted: false });
    expect(verdict).not.toHaveProperty('final');
    if (verdict.accepted) throw new Error('Invalid input was accepted');
    const answer = JSON.parse(verdict.errors[0]!.split('\n\n')[0]!) as { errors: SubmissionError[] };
    expect(answer.errors).toEqual(errors);
    expect(answer).not.toHaveProperty('remainingAttempts');
  }
  expect(await judge.judge('correct', 'call-4')).toEqual({ accepted: true });
  expect(accepted).toBe(1);
  expect(judge.rejections).toBe(4);
  expect(log.observations.filter(item => item.type === 'rejection')).toHaveLength(4);
});

test('invalid harness tool inputs remain correctable after the former limit', async () => {
  const log = await observations();
  const judge = new ToolInputJudge({
    tool: 'shell', bound: 3, observations: log,
    validate: input => input === 'correct' ? { ok: true as const, value: input } : { ok: false as const, errors },
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const verdict = await judge.judge('wrong', `call-${attempt}`);
    if (verdict.ok) throw new Error('Invalid input was accepted');
    expect(JSON.parse(verdict.text.split('\n\n')[0]!)).toMatchObject({ errors });
  }
  expect(await judge.judge('correct', 'call-4')).toEqual({ ok: true, value: 'correct' });
  expect(judge.exhausted).toBe(false);
  expect(judge.rejections).toBe(4);
});
