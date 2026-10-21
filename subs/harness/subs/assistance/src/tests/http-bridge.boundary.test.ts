import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer, request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { expect, test, vi } from 'vitest';
import { configureLongWaitHttpServer, nodeFetchHandler } from '../http-bridge.js';
import { createAssistanceMcpServer } from '../mcp.js';
import { AssistanceService } from '../service.js';

test('native HTTP streams headers and body before completion and propagates unfinished response disconnect', async () => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let observedRequest!: Request;
  let entered!: () => void;
  const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
  const server = createServer(nodeFetchHandler(async request => {
    observedRequest = request;
    expect(await request.text()).toBe('request bytes');
    entered();
    return new Response(new ReadableStream({ async start(controller) {
      controller.enqueue(Buffer.from('data: first\n\n'));
      await held;
      if (!request.signal.aborted) controller.close();
    } }), { headers: [['content-type', 'text/event-stream'], ['x-stream', 'present'], ['set-cookie', 'a=1'], ['set-cookie', 'b=2']] });
  }));
  configureLongWaitHttpServer(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address() as { port: number };
  try {
    const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
      const request = httpRequest({ hostname: '127.0.0.1', port: address.port, method: 'POST' }, resolve);
      request.on('error', reject); request.end('request bytes');
    });
    await enteredPromise;
    expect(response.headers['x-stream']).toBe('present');
    expect(response.headers['set-cookie']).toEqual(['a=1', 'b=2']);
    const [chunk] = await once(response, 'data');
    expect(chunk.toString()).toBe('data: first\n\n');
    expect(observedRequest.signal.aborted).toBe(false);
    response.destroy();
    await vi.waitFor(() => expect(observedRequest.signal.aborted).toBe(true));
  } finally { release(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('native HTTP waits for kernel response drain before reading the next body chunk', async () => {
  const order: string[] = [];
  // One chunk crosses Node's response high-water mark; two chunks demonstrate
  // that the next Fetch read follows the kernel stream's drain notification.
  const bytes = Buffer.alloc(65_537, 120);
  const response = new Response(new ReadableStream({ start(controller) {
    controller.enqueue(bytes); controller.enqueue(bytes); controller.close();
  } }));
  const reader = response.body!.getReader();
  const read = reader.read.bind(reader);
  vi.spyOn(reader, 'read').mockImplementation(() => { order.push('read'); return read(); });
  vi.spyOn(response.body!, 'getReader').mockReturnValue(reader);
  const bridge = nodeFetchHandler(async () => response);
  const server = createServer((incoming, outgoing) => {
    const write = outgoing.write.bind(outgoing);
    outgoing.write = ((chunk: Uint8Array) => {
      const ready = write(chunk); order.push(ready ? 'write-ready' : 'write-blocked'); return ready;
    }) as typeof outgoing.write;
    outgoing.on('drain', () => order.push('drain'));
    bridge(incoming, outgoing);
  });
  configureLongWaitHttpServer(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const result = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}`);
    expect(Buffer.from(await result.arrayBuffer())).toEqual(Buffer.concat([bytes, bytes]));
    expect(order).toEqual(['read', 'write-blocked', 'drain', 'read', 'write-blocked', 'drain', 'read']);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('native HTTP closes a failed response stream without an unhandled server error', async () => {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const server = createServer(nodeFetchHandler(async () => new Response(new ReadableStream({ start(controller) {
    stream = controller; controller.enqueue(Buffer.from('first bytes'));
  } }))));
  configureLongWaitHttpServer(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}`);
    const reader = response.body!.getReader();
    expect(Buffer.from((await reader.read()).value!).toString()).toBe('first bytes');
    stream.error(new Error('Response producer failed'));
    await expect(reader.read()).rejects.toThrow();
    reader.releaseLock();
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('official HTTP MCP reconnects after observation cancellation and preserves the active assessment', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ramify-http-wait-'));
  const baseline = 'a'.repeat(40), candidate = 'b'.repeat(40);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let assessmentSignal!: AbortSignal;
  let assessorEntered!: () => void;
  const assessorReady = new Promise<void>(resolve => { assessorEntered = resolve; });
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Native HTTP wait fixture\n');
  const service = await AssistanceService.open({ projectRoot: root,
    registrationProtection: async () => ({ baselineCommit: baseline,
      rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null }),
    resolveCommit: async (_root, revision) => revision === 'HEAD' ? baseline : revision,
    currentHead: async () => baseline, isCleanRepository: async () => true,
    assessor: async context => { assessmentSignal = context.signal; assessorEntered(); await held;
      return { gate: 'clear', summary: 'Scripted external assessment complete', repairs: [], decisions: [], gaps: [], evidence: [] }; },
  });
  const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();
  const mcpServers: Array<ReturnType<typeof createAssistanceMcpServer>> = [];
  const clients: Client[] = [];
  const listener = createServer(nodeFetchHandler(async request => {
    let transport = sessions.get(request.headers.get('mcp-session-id') ?? '');
    if (!transport) {
      transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: randomUUID,
        onsessioninitialized: session => { sessions.set(session, transport!); } });
      const server = createAssistanceMcpServer(service); mcpServers.push(server); await server.connect(transport);
    }
    return transport.handleRequest(request);
  }));
  configureLongWaitHttpServer(listener);
  listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  const url = new URL(`http://127.0.0.1:${(listener.address() as { port: number }).port}/mcp`);
  const connect = async () => {
    const client = new Client({ name: 'native-http-wait-witness', version: '1.0.0' }); clients.push(client);
    await client.connect(new StreamableHTTPClientTransport(url));
    return client;
  };
  const call = async (client: Client, name: string, args: Record<string, unknown>, signal?: AbortSignal) => {
    const result = await client.callTool({ name, arguments: args }, { timeout: 10_000, ...(signal ? { signal } : {}) });
    if (result.isError) throw new Error(result.content.map(item => item.type === 'text' ? item.text : '').join('\n'));
    return (result.structuredContent as { result: unknown }).result;
  };
  const observed: AbortSignal[] = [];
  const originalWait = service.assessmentWait.bind(service);
  vi.spyOn(service, 'assessmentWait').mockImplementation((...args) => { observed.push(args[4]!); return originalWait(...args); });
  try {
    const first = await connect();
    const job = await call(first, 'plan_start', { plan_id: 'sample', command_id: 'register' }) as { jobId: string };
    const assessment = await call(first, 'iteration_assess', { plan_id: 'sample', job_id: job.jobId, base: baseline, candidate,
      brief: 'Held scripted assessor', command_id: 'assess', kind: 'iteration' }) as { assessmentId: string };
    await assessorReady;
    const ids = { plan_id: 'sample', job_id: job.jobId, assessment_id: assessment.assessmentId };
    const disconnected = call(first, 'assessment_wait', { ...ids, timeout_ms: 900_000 }).catch(error => error);
    await vi.waitFor(() => expect(observed).toHaveLength(1));
    await first.close(); await disconnected;
    await vi.waitFor(() => expect(observed[0]!.aborted).toBe(true));
    expect(assessmentSignal.aborted).toBe(false);

    const second = await connect();
    expect(await call(second, 'assessment_status', ids)).toMatchObject({ status: 'running' });
    const cancellation = new AbortController();
    const cancelled = call(second, 'assessment_wait', { ...ids, timeout_ms: 900_000 }, cancellation.signal).catch(error => error);
    await vi.waitFor(() => expect(observed).toHaveLength(2));
    cancellation.abort(new Error('Cancel observation only')); await cancelled;
    await vi.waitFor(() => expect(observed[1]!.aborted).toBe(true));
    expect(assessmentSignal.aborted).toBe(false);
    await second.close();

    const third = await connect();
    const result = await call(third, 'assessment_wait', { ...ids, timeout_ms: 0 });
    expect(result).toMatchObject({ status: 'running', reason: 'timeout' });
    expect(assessmentSignal.aborted).toBe(false);
    release();
    expect(await call(third, 'assessment_wait', { ...ids, timeout_ms: 5_000 })).toMatchObject({ status: 'completed', reason: 'settled' });
  } finally {
    release();
    await Promise.allSettled(clients.map(client => client.close()));
    await Promise.allSettled(mcpServers.map(server => server.close()));
    listener.closeAllConnections(); await new Promise<void>(resolve => listener.close(() => resolve()));
    await service.close(); await rm(root, { recursive: true, force: true });
  }
}, 30_000);
