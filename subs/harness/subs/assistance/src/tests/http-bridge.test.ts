import { EventEmitter } from 'node:events';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { configureLongWaitHttpServer, longWaitHttpTimeoutMs, nodeFetchHandler } from '../http-bridge.js';

function fixture(body = 'one body') {
  const incoming = Object.assign(Readable.from([Buffer.from(body)]), {
    method: 'POST', url: '/observe?q=1', rawHeaders: ['Host', 'localhost', 'Content-Type', 'text/plain'], complete: true,
  }) as unknown as IncomingMessage;
  const outgoing = Object.assign(new EventEmitter(), {
    statusCode: 0, statusMessage: '', headersSent: false, writableFinished: false, destroyed: false,
    setHeader: vi.fn(), flushHeaders: vi.fn(function (this: { headersSent: boolean }) { this.headersSent = true; }),
    write: vi.fn((_chunk: Uint8Array) => true), end: vi.fn(function (this: EventEmitter & { writableFinished: boolean }) {
      this.writableFinished = true; this.emit('finish');
    }), destroy: vi.fn(),
  });
  return { incoming, outgoing, run: (handler: (request: Request) => Promise<Response>) => nodeFetchHandler(handler)(incoming, outgoing as unknown as ServerResponse) };
}

describe('Node Fetch bridge', () => {
  it('consumes the body once, forwards headers and ignores ordinary completed request close', async () => {
    const { incoming, outgoing, run } = fixture();
    let request!: Request;
    let bodyRead!: () => void;
    const bodyReady = new Promise<void>(resolve => { bodyRead = resolve; });
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    run(async value => { request = value; expect(await value.text()).toBe('one body'); bodyRead(); await held;
      return new Response('answer', { status: 201, headers: [['x-result', 'yes'], ['set-cookie', 'a=1'], ['set-cookie', 'b=2']] }); });
    await bodyReady;
    expect(request.bodyUsed).toBe(true);
    incoming.emit('close');
    expect(request.signal.aborted).toBe(false);
    release();
    await vi.waitFor(() => expect(outgoing.end).toHaveBeenCalledOnce());
    expect(outgoing.statusCode).toBe(201);
    expect(outgoing.setHeader).toHaveBeenCalledWith('x-result', 'yes');
    expect(outgoing.setHeader).toHaveBeenCalledWith('set-cookie', ['a=1', 'b=2']);
    expect(outgoing.flushHeaders).toHaveBeenCalledOnce();
    expect(outgoing.write.mock.calls[0]![0]).toEqual(new TextEncoder().encode('answer'));
    expect(request.signal.aborted).toBe(false);
  });

  it('flushes SSE headers and waits for drain before reading another chunk', async () => {
    const { incoming, outgoing, run } = fixture();
    incoming.method = 'GET';
    const read = vi.fn().mockResolvedValueOnce({ done: false, value: Buffer.from('first') })
      .mockResolvedValueOnce({ done: false, value: Buffer.from('second') }).mockResolvedValue({ done: true });
    const reader = { read, cancel: vi.fn(async () => undefined), releaseLock: vi.fn() };
    outgoing.write.mockReturnValueOnce(false);
    run(async () => ({ status: 200, statusText: 'OK', headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader } }) as unknown as Response);
    await vi.waitFor(() => expect(outgoing.write).toHaveBeenCalledOnce());
    expect(outgoing.flushHeaders.mock.invocationCallOrder[0]).toBeLessThan(outgoing.write.mock.invocationCallOrder[0]!);
    expect(read).toHaveBeenCalledOnce();
    outgoing.emit('drain');
    await vi.waitFor(() => expect(outgoing.end).toHaveBeenCalledOnce());
    expect(read).toHaveBeenCalledTimes(3);
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it.each(['request-aborted', 'incomplete-close', 'response-close'])('aborts and releases a blocked stream on %s', async event => {
    const { incoming, outgoing, run } = fixture();
    incoming.method = 'GET';
    let request!: Request;
    const reader = { read: vi.fn(async () => ({ done: false, value: Buffer.from('first') })),
      cancel: vi.fn(async () => undefined), releaseLock: vi.fn() };
    outgoing.write.mockReturnValue(false);
    run(async value => { request = value; return { status: 200, statusText: 'OK', headers: new Headers(),
      body: { getReader: () => reader } } as unknown as Response; });
    await vi.waitFor(() => expect(outgoing.write).toHaveBeenCalledOnce());
    if (event === 'request-aborted') incoming.emit('aborted');
    else if (event === 'incomplete-close') { incoming.complete = false; incoming.emit('close'); }
    else outgoing.emit('close');
    await vi.waitFor(() => expect(reader.releaseLock).toHaveBeenCalledOnce());
    expect(request.signal.aborted).toBe(true);
    expect(reader.cancel).toHaveBeenCalled();
    expect(reader.read).toHaveBeenCalledOnce();
  });

  it('sets socket and keepalive deadlines above the assessment and client wait margins', () => {
    const server = { requestTimeout: 1, headersTimeout: 1, keepAliveTimeout: 1, setTimeout: vi.fn() };
    configureLongWaitHttpServer(server as unknown as Server);
    expect(server.requestTimeout).toBe(0);
    expect(server.headersTimeout).toBe(60_000);
    expect(server.setTimeout).toHaveBeenCalledWith(longWaitHttpTimeoutMs);
    expect(server.keepAliveTimeout).toBeGreaterThan(930_000);
  });
});
