import { describe, expect, it } from 'vitest';
import { createAssessmentEvidenceTool } from '../assistance/pi-evidence.js';

describe('bounded Pi assessment evidence', () => {
  it('lists exact owner refs, reads content in resumable chunks and refuses arbitrary paths', async () => {
    const reads: string[] = [];
    const tool = createAssessmentEvidenceTool({
      list: () => [{ ref: 'stage/audit', description: 'Exact provider result' }, { ref: 'baseline/plan', description: 'Captured plan' }],
      read: ref => { reads.push(ref); return ref === 'stage/audit' ? { checks: 'ABCDEFGHIJ' } : '# Plan'; },
    });
    const call = async (input: unknown) => tool.execute(input, new AbortController().signal);
    expect(tool.mutating).toBe(false);
    expect(JSON.parse((await call({ limit: 1 })).text)).toMatchObject({ kind: 'list', total: 2, entries: [{ ref: 'stage/audit' }], nextOffset: 1 });
    expect(JSON.parse((await call({ offset: 1, limit: 1 })).text)).toMatchObject({ entries: [{ ref: 'baseline/plan' }], nextOffset: null });
    const first = JSON.parse((await call({ ref: 'stage/audit', limit: 8 })).text) as { content: string; nextOffset: number };
    const second = JSON.parse((await call({ ref: 'stage/audit', offset: first.nextOffset, limit: 12000 })).text) as { content: string; nextOffset: null };
    expect(first.content + second.content).toBe(JSON.stringify({ checks: 'ABCDEFGHIJ' }));
    expect(second.nextOffset).toBeNull();
    expect((await call({ ref: '../secret' })).isError).toBe(true);
    expect((await call({ ref: 'stage/audit', offset: 1000 })).isError).toBe(true);
    expect(reads).toEqual(['stage/audit', 'stage/audit', 'stage/audit']);
  });

  it('caps requested chunks and rejects duplicate catalog authority', async () => {
    const tool = createAssessmentEvidenceTool({ list: () => [{ ref: 'audit', description: 'A' }, { ref: 'audit', description: 'B' }], read: () => 'data' });
    expect((await tool.execute({}, new AbortController().signal)).isError).toBe(true);
    expect((await tool.execute({ ref: 'audit', limit: 12001 }, new AbortController().signal)).isError).toBe(true);
  });
});
