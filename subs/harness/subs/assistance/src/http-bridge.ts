import { once } from 'node:events';
import type { RequestListener, Server } from 'node:http';
import { Readable } from 'node:stream';

/** The assessment wait is 900 seconds; transport deadlines retain a minute of margin. */
export const longWaitHttpTimeoutMs = 960_000;

export function configureLongWaitHttpServer(server: Server): void {
  server.requestTimeout = 0;
  server.headersTimeout = 60_000;
  server.setTimeout(longWaitHttpTimeoutMs);
  server.keepAliveTimeout = longWaitHttpTimeoutMs;
}

/** Adapt one Node request to Fetch without owning the handler's service lifetime. */
export function nodeFetchHandler(handler: (request: Request) => Promise<Response>): RequestListener {
  return (incoming, outgoing) => {
    const controller = new AbortController();
    const abort = () => controller.abort(new Error('HTTP observer disconnected'));
    // IncomingMessage also closes normally after a complete request body. Only an
    // incomplete request, or closing an unfinished response, loses the observer.
    const requestClose = () => { if (!incoming.complete) abort(); };
    const responseClose = () => { if (!outgoing.writableFinished) abort(); };
    incoming.on('aborted', abort);
    incoming.on('close', requestClose);
    incoming.on('error', abort);
    outgoing.on('close', responseClose);
    outgoing.on('error', abort);

    void (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      const cancelBody = () => { void reader?.cancel(controller.signal.reason).catch(() => undefined); };
      controller.signal.addEventListener('abort', cancelBody, { once: true });
      try {
        const headers = new Headers();
        for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
          headers.append(incoming.rawHeaders[index]!, incoming.rawHeaders[index + 1]!);
        }
        const method = incoming.method ?? 'GET';
        const hasBody = method !== 'GET' && method !== 'HEAD';
        const request = new Request(new URL(incoming.url ?? '/', `http://${headers.get('host') ?? 'localhost'}`), {
          method, headers, signal: controller.signal,
          ...(hasBody ? { body: Readable.toWeb(incoming) as ReadableStream<Uint8Array>, duplex: 'half' } : {}),
        });
        const response = await handler(request);
        reader = response.body?.getReader();
        if (controller.signal.aborted) { await reader?.cancel(controller.signal.reason); return; }
        outgoing.statusCode = response.status;
        outgoing.statusMessage = response.statusText;
        for (const [name, value] of response.headers) {
          if (name !== 'set-cookie') outgoing.setHeader(name, value);
        }
        const cookies = response.headers.getSetCookie();
        if (cookies.length) outgoing.setHeader('set-cookie', cookies);
        // SSE headers must reach the client before the first event is produced.
        outgoing.flushHeaders();
        if (method === 'HEAD') { await reader?.cancel(); outgoing.end(); return; }
        while (reader) {
          const chunk = await reader.read();
          controller.signal.throwIfAborted();
          if (chunk.done) break;
          if (!outgoing.write(chunk.value)) await once(outgoing, 'drain', { signal: controller.signal });
        }
        outgoing.end();
      } catch (error) {
        await reader?.cancel(error).catch(() => undefined);
        if (outgoing.destroyed) return;
        if (outgoing.headersSent) outgoing.destroy();
        else { outgoing.statusCode = 500; outgoing.end('HTTP handler failed'); }
      } finally {
        controller.signal.removeEventListener('abort', cancelBody);
        reader?.releaseLock();
        incoming.off('aborted', abort);
        incoming.off('close', requestClose);
        incoming.off('error', abort);
        outgoing.off('close', responseClose);
        outgoing.off('error', abort);
      }
    })();
  };
}
