import { randomUUID } from 'node:crypto';
import { WebStandardStreamableHTTPServerTransport, type McpServer } from '@modelcontextprotocol/server';
import { createAssistanceMcpServer } from './mcp.js';
import type { AssistanceService } from './service.js';

/** Connections own transports, while the host retains the shared writer. */
export function assistanceHttpSessions(service: AssistanceService): { handle(request: Request): Promise<Response>; close(): Promise<void> } {
  const sessions = new Map<string, { transport: WebStandardStreamableHTTPServerTransport; server: McpServer }>();
  let closed = false;
  return {
    async handle(request) {
      if (closed) return new Response('Host stopping', { status: 503 });
      const id = request.headers.get('mcp-session-id');
      if (id !== null) {
        const connection = sessions.get(id);
        return connection === undefined ? new Response('Unknown MCP session', { status: 404 }) : connection.transport.handleRequest(request);
      }
      if (request.method !== 'POST') return new Response('Initialize an MCP session first', { status: 400 });
      const server = createAssistanceMcpServer(service);
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: randomUUID, maxRequestBodySize: 1_048_576,
        onsessioninitialized: sessionId => { sessions.set(sessionId, { server, transport }); },
        onsessionclosed: sessionId => { sessions.delete(sessionId); },
      });
      await server.connect(transport);
      try {
        const response = await transport.handleRequest(request);
        if (transport.sessionId === undefined) await server.close();
        return response;
      } catch (error) { if (transport.sessionId === undefined) await server.close(); throw error; }
    },
    async close() { closed = true; const connections = [...sessions.values()]; sessions.clear(); await Promise.allSettled(connections.map(connection => connection.server.close())); },
  };
}
