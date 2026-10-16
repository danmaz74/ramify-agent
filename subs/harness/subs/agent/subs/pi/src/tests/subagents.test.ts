import { afterEach, describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nativeCall, nativeText, preservingPi, until } from './helpers/session.js';
import { piBuiltinDeclarations } from '../session-operations.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const delegate = (...tasks: string[]) => nativeCall('subagent', { tasks: tasks.map(task => ({ task })) }, 'delegate');
const report = (summary: string) => nativeCall('report_subagent', { summary }, 'report');
const submit = nativeCall('submit_map', { summary: 'Integrated.' }, 'submit');
const toolNames = (request: Record<string, unknown>) => (request['tools'] as { name: string }[]).map(tool => tool.name);

describe('experimental Pi subagents', () => {
  test('enables the same durable declaration for architects and engineers, excluding other roles', () => {
    const declaration = piBuiltinDeclarations([], '.', 'engineer');
    expect(declaration.map(tool => tool.name)).toEqual(['subagent']);
    for (const role of ['initial-architect', 'global-fork', 'local-architect', 'capability-architect', 'contract-engineer', 'nonfunctional-repair-engineer']) {
      expect(piBuiltinDeclarations([], '.', role)).toEqual(declaration);
    }
    for (const role of ['reviewer', 'context-selector', 'subagent', 'beads-administrator']) expect(piBuiltinDeclarations([], '.', role)).toEqual([]);
  });

  test('Responses coordinators and workers receive context notices and preserve history after delegation', async () => {
    const f = await preservingPi(cleanups, [[delegate('Inspect a.ts.')],
      [nativeCall('read', { path: 'a.ts' })], [report('Read a.ts.')], [submit]], {
      role: 'engineer', builtins: ['read'], files: { 'a.ts': 'export const a = 1;' },
      model: 'openai/gpt-5.6-sol:high', nativeOptions: { provider: 'openai', contextWindow: 100000 },
    });
    expect((await (await f.operations.continue(f.input())).settled()).outcome?.kind).toBe('submitted');
    expect(f.native.wireRequests).toHaveLength(4);
    for (const request of f.native.wireRequests) {
      expect(request['reasoning']).toMatchObject({ effort: 'high' });
      expect(request).not.toHaveProperty('max_output_tokens');
      const input = request['input'] as Array<{ role?: string; content?: unknown }>;
      expect(input[0]).toMatchObject({ role: 'developer' });
      expect(input.at(-1)).toMatchObject({ role: 'developer', content: expect.stringMatching(/^You have (?:\d+|unknown) tokens left in this context window\.$/) });
    }
    expect(toolNames(f.native.wireRequests[0]!)).toContain('subagent');
    expect(toolNames(f.native.wireRequests[1]!)).not.toContain('subagent');
    const first = f.native.wireRequests[0]!['input'] as unknown[];
    expect((f.native.wireRequests[3]!['input'] as unknown[]).slice(0, first.length)).toEqual(first);
    expect(JSON.stringify(f.native.wireRequests[3])).toContain('Read a.ts.');
    f.native.verify();
  });

  test('architect exploration is isolated, read-only, and cannot submit for the coordinator', async () => {
    const f = await preservingPi(cleanups, [[delegate('Inspect a.ts and cite evidence.')],
      [nativeCall('read', { path: 'a.ts' })], [report('a.ts defines the input.')], [submit]],
    { role: 'local-architect', builtins: ['read', 'write'], files: { 'a.ts': 'export const input = 1;' } });
    const receipt = await (await f.operations.continue(f.input())).settled();
    expect(receipt.outcome?.kind).toBe('submitted');
    expect(f.judged).toEqual([{ summary: 'Integrated.' }]);
    expect(toolNames(f.native.requests[1]!)).toEqual(['read', 'report_subagent']);
    expect(JSON.stringify(f.native.requests[1])).toContain('Inspect a.ts and cite evidence.');
    expect(JSON.stringify(f.native.requests[1])).toContain('Exact role instructions.');
    expect(f.native.requests[1]!['prompt_cache_key']).not.toEqual(f.native.requests[0]!['prompt_cache_key']);
    expect(f.native.requests[1]!['model']).toEqual(f.native.requests[0]!['model']);
    expect(f.native.requests[1]!['reasoning']).toEqual(f.native.requests[0]!['reasoning']);
    expect(JSON.stringify(f.native.requests.at(-1))).toContain('a.ts defines the input.');
    const childMessages = f.events.filter(event => event.type === 'message' && event.role === 'assistant' && event.observation?.sourceId.includes(':subagent:'));
    expect(childMessages).toHaveLength(2);
    expect(childMessages.every(event => event.execution?.operationId === 'task')).toBe(true);
    const children = [...f.records.values()].filter(record => record.id.includes(':subagent:') && record.id.startsWith('operation:') && !record.id.endsWith(':create'));
    expect(children).toHaveLength(1);
    expect(children[0]!.body['receipt']).toMatchObject({ status: 'completed' });
    const count = f.native.dispatches();
    expect(await (await f.operations.retry({ runId: 'pi-test', operationId: 'task', bindings: f.bindings })).settled()).toEqual(receipt);
    expect(f.native.dispatches()).toBe(count);
    f.native.verify();
  });

  test('workers execute in parallel with distinct call identities and return all reports', async () => {
    let release!: () => void;
    const barrier = new Promise<void>(resolve => { release = resolve; });
    const calls: string[] = [];
    const f = await preservingPi(cleanups, [[delegate('Implement a.', 'Implement b.')],
      [nativeCall('shell', {}, 'same')], [nativeCall('shell', {}, 'same')],
      [report('Implemented a.')], [report('Implemented b.')], [submit]], {
      role: 'engineer', tools: [{ name: 'shell', description: 'Scripted worker operation.', inputSchema: { type: 'object' },
        async execute(_input, _signal, id) { calls.push(id!); if (calls.length === 2) release(); await barrier; return { text: 'Work completed.' }; },
      }],
    });
    const receipt = await (await f.operations.continue(f.input())).settled();
    expect(receipt.outcome?.kind).toBe('submitted');
    expect(calls).toHaveLength(2);
    expect(new Set(calls).size).toBe(2);
    expect(calls.every(id => id.includes(':subagent:'))).toBe(true);
    expect(toolNames(f.native.requests[1]!)).toEqual(['shell', 'report_subagent']);
    expect(JSON.stringify(f.native.requests.at(-1))).toContain('Implemented a.');
    expect(JSON.stringify(f.native.requests.at(-1))).toContain('Implemented b.');
    const starts = f.events.flatMap(event => event.type === 'tool-started' && event.tool === 'shell' ? [event.callId] : []);
    expect(starts.sort()).toEqual([...calls].sort());
    f.native.verify();
  });

  test('workers retain the parent guard and mutation hook, while denied writes change nothing', async () => {
    const f = await preservingPi(cleanups, [[delegate('Update allowed.ts only.')],
      [nativeCall('write', { path: 'denied.ts', content: 'bad' }, 'denied')],
      [nativeCall('write', { path: 'allowed.ts', content: 'good' }, 'allowed')],
      [report('Updated allowed.ts; denied.ts was refused.')], [submit]],
    { role: 'engineer', builtins: ['write'], files: { 'denied.ts': 'original' } });
    const guarded: string[] = []; const checked: string[] = [];
    const bindings = { ...f.bindings,
      guard: async (call: Parameters<NonNullable<typeof f.bindings.guard>>[0]) => {
        guarded.push(call.callId);
        return (call.input as { path: string }).path === 'denied.ts' ? { allow: false as const, text: 'Outside scope.' } : { allow: true as const };
      },
      afterMutation: async (call: Parameters<NonNullable<typeof f.bindings.afterMutation>>[0]) => { checked.push(call.callId); return { text: 'Mutation verified.' }; },
    };
    expect((await (await f.operations.continue(f.input(f.initial.point!, 'task', bindings))).settled()).outcome?.kind).toBe('submitted');
    expect(await readFile(join(f.workingDirectory, 'denied.ts'), 'utf8')).toBe('original');
    expect(await readFile(join(f.workingDirectory, 'allowed.ts'), 'utf8')).toBe('good');
    expect(guarded).toHaveLength(2); expect(checked).toEqual([guarded[1]]);
    expect(guarded.every(id => id.includes(':subagent:'))).toBe(true);
    expect(JSON.stringify(f.native.requests[3])).toContain('Mutation verified.');
    f.native.verify();
  });

  test('a worker ending without a report preserves the successful sibling result and reports incomplete work', async () => {
    const f = await preservingPi(cleanups, [[delegate('Explore a.', 'Explore b.')],
      [nativeText('No report submitted.')], [report('Evidence for b.')], [submit]], { role: 'initial-architect' });
    expect((await (await f.operations.continue(f.input())).settled()).outcome?.kind).toBe('submitted');
    const result = f.events.find(event => event.type === 'message' && event.role === 'tool-result' && event.tool === 'subagent');
    expect(result).toMatchObject({ isError: true });
    expect(JSON.stringify(result)).toContain('incomplete');
    expect(JSON.stringify(result)).toContain('Evidence for b.');
    expect(f.judged).toHaveLength(1);
    f.native.verify();
  });

  test('stopping a coordinator cancels workers and waits for their actual drainage', async () => {
    let started = false; let aborted = false; let release!: () => void;
    const barrier = new Promise<void>(resolve => { release = resolve; });
    const f = await preservingPi(cleanups, [[delegate('Run the held operation.')], [nativeCall('shell', {})]], {
      role: 'engineer', tools: [{ name: 'shell', description: 'Held scripted operation.', inputSchema: { type: 'object' },
        async execute(_input, signal) { started = true; signal.addEventListener('abort', () => { aborted = true; }, { once: true }); await barrier; return { text: 'Drained.' }; },
      }],
    });
    const handle = await f.operations.continue(f.input());
    await until(() => started);
    let settled = false;
    const stop = handle.stop().then(value => { settled = true; return value; });
    await until(() => aborted);
    expect(settled).toBe(false);
    release();
    expect((await stop).status).toBe('stopped');
    expect(f.judged).toEqual([]);
    expect(f.native.dispatches()).toBe(2);
    f.native.verify();
  });
});
