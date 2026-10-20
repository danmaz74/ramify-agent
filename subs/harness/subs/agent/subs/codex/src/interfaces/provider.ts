/** Assistance-facing values; the Codex JSON-RPC protocol stays in this owner. */
export type CodexTurnStatus = 'inProgress' | 'completed' | 'interrupted' | 'failed';
export interface CodexMessage { readonly role: 'user' | 'assistant'; readonly text: string }
export interface CodexWorkItem {
  readonly id: string;
  readonly kind: string;
  readonly status?: string;
  readonly model?: string;
  readonly workerThreadIds?: readonly string[];
  readonly operation?: string;
  readonly activity?: string;
}
export interface CodexTurn {
  readonly id: string;
  readonly status: CodexTurnStatus;
  readonly error: string | null;
  readonly messages: readonly CodexMessage[];
  readonly work: readonly CodexWorkItem[];
}
export interface CodexThread {
  readonly id: string;
  readonly parentThreadId: string | null;
  readonly ephemeral: false;
  readonly cwd: string;
  readonly model: string | null;
  readonly cliVersion: string;
  readonly status: 'idle' | 'active' | 'notLoaded' | 'systemError';
  readonly turns: readonly CodexTurn[];
}
export interface CodexThreadSettings {
  readonly cwd: string;
  readonly model: string;
  /** Only MCP endpoint rebinding; never policy or instruction overrides. */
  readonly mcp?: readonly ({ readonly name: string; readonly enabled: false } | { readonly name: string; readonly url: string; readonly bearerTokenEnvVar: string; readonly required: true; readonly toolTimeoutSeconds: number })[];
}
export interface CodexThreadSession {
  readonly thread: CodexThread;
  readonly model: string;
  readonly instructionSources: readonly string[];
  /** Verified full-access policy of the loaded thread. */
  readonly approvalPolicy: string;
  readonly sandbox: string;
}
export interface CodexProcessIdentity {
  readonly providerPid: number;
  readonly providerIdentity: string;
  readonly supervisorPid: number;
  readonly supervisorIdentity: string;
}
export interface CodexReadiness {
  readonly process: CodexProcessIdentity;
  readonly userAgent: string;
  readonly codexHome: string;
  readonly platform: string;
}
export interface CodexEquipment {
  readonly models: readonly { readonly id: string; readonly nativeWorkers: 'disabled' | 'v1' | 'v2' | null }[];
  readonly features: readonly { readonly name: string; readonly enabled: boolean }[];
  readonly mcp: readonly { readonly name: string; readonly tools: readonly string[]; readonly error: string | null }[];
  readonly configuredModel: string | null;
  readonly approvalPolicy: string | null;
  readonly sandbox: string | null;
  /** Effective MCP metadata only. Credentials, headers and URLs are never projected. */
  readonly mcpConfiguration?: readonly { readonly name: string; readonly enabled: boolean; readonly transport: 'stdio' | 'http' | 'ambiguous' | 'other'; readonly required: boolean; readonly toolTimeoutSeconds: number | null; readonly bearerTokenEnvVar: string | null }[];
}
export interface CodexApprovalChoice {
  readonly id: string;
  readonly label: string;
  readonly effect: 'once' | 'session' | 'policy' | 'deny' | 'cancel';
  readonly commandPrefix?: readonly string[];
  readonly network?: { readonly host: string; readonly action: 'allow' | 'deny' };
}
export interface CodexRequestIdentity {
  /** Includes provider generation, typed RPC ID and the thread/turn binding. */
  readonly id: string;
  readonly generation: string;
  readonly threadId: string | null;
  readonly turnId: string | null;
  readonly itemId: string | null;
}
export type CodexPendingRequest = CodexRequestIdentity & (
  | { readonly kind: 'command-approval'; readonly reason: string | null; readonly command: string | null; readonly cwd: string | null; readonly choices: readonly CodexApprovalChoice[] }
  | { readonly kind: 'file-approval'; readonly reason: string | null; readonly writeRoot: string | null; readonly choices: readonly CodexApprovalChoice[] }
  | { readonly kind: 'user-input'; readonly blocking: boolean; readonly questions: readonly { readonly id: string; readonly header: string; readonly question: string; readonly secret: boolean; readonly allowOther: boolean; readonly options: readonly { readonly label: string; readonly description: string }[] | null }[] }
  | { readonly kind: 'mcp-elicitation'; readonly serverName: string; readonly message: string; readonly mode: 'form' | 'openai/form' | 'openaiForm'; readonly schema: Readonly<Record<string, unknown>> }
  | { readonly kind: 'unsupported'; readonly method: string; readonly reason: string }
);
export type CodexResponse =
  | { readonly kind: 'approval'; readonly choiceId: string }
  | { readonly kind: 'user-input'; readonly answers: Readonly<Record<string, readonly string[]>> }
  | { readonly kind: 'mcp-elicitation'; readonly action: 'accept' | 'decline' | 'cancel'; readonly content?: Readonly<Record<string, string | number | boolean | readonly string[]>> };
export type CodexEvent =
  | { readonly kind: 'worker-thread'; readonly threadId: string; readonly parentThreadId: string; readonly model: string | null; readonly ephemeral: boolean }
  | { readonly kind: 'turn'; readonly threadId: string; readonly turn: CodexTurn }
  | { readonly kind: 'thread-status'; readonly threadId: string; readonly status: CodexThread['status'] }
  | { readonly kind: 'assistant-delta'; readonly threadId: string; readonly turnId: string; readonly text: string }
  | { readonly kind: 'work'; readonly threadId: string; readonly turnId: string; readonly item: CodexWorkItem }
  | { readonly kind: 'pending-request'; readonly request: CodexPendingRequest }
  | { readonly kind: 'request-resolved'; readonly id: string }
  | { readonly kind: 'provider-error'; readonly message: string; readonly threadId?: string; readonly turnId?: string; readonly willRetry?: boolean }
  | { readonly kind: 'provider-exit'; readonly code: number | null; readonly signal: string | null };
/** Local owned descendants only; external services retain their own ownership. */
export interface CodexSettlement {
  readonly confirmed: boolean;
  readonly descendants: 'settled' | 'unknown';
  readonly supervisorExited: boolean;
  readonly reason: string | null;
}
export interface CodexInterrupt {
  readonly acknowledged: true;
  readonly threadId: string;
  readonly turnId: string;
  readonly descendants: 'not-established';
  readonly assessments: 'not-controlled';
}
export interface CodexProvider {
  readonly generation: string;
  initialize(): Promise<CodexReadiness>;
  inspectEquipment(cwd: string, threadId?: string): Promise<CodexEquipment>;
  startThread(settings: CodexThreadSettings): Promise<CodexThreadSession>;
  readThread(threadId: string): Promise<CodexThread>;
  resumeThread(threadId: string, settings: CodexThreadSettings): Promise<CodexThreadSession>;
  send(threadId: string, message: string): Promise<CodexTurn>;
  pendingRequests(): readonly CodexPendingRequest[];
  respond(requestId: string, response: CodexResponse): Promise<void>;
  interrupt(threadId: string, turnId: string): Promise<CodexInterrupt>;
  /** Synchronous consumers must be quick; returned promises are never awaited. */
  observe(listener: (event: CodexEvent) => void): () => void;
  stop(): Promise<CodexSettlement>;
}
export interface CodexProviderOptions {
  readonly cwd: string;
  readonly executable?: string;
  /** Launch-time TOML overrides; full access is enforced afterward. Never written to shared configuration. */
  readonly configOverrides?: readonly string[];
  /** Explicit complete environment when provided; otherwise inherited unchanged. */
  readonly env?: Readonly<NodeJS.ProcessEnv>;
  readonly requestTimeoutMs?: number;
  readonly settlementTimeoutMs?: number;
}
export class CodexProviderError extends Error {
  constructor(readonly kind: 'protocol' | 'rpc' | 'unavailable' | 'busy' | 'uncertain' | 'stale-response', message: string, readonly method?: string, readonly rpcCode?: number) {
    super(message);
    this.name = 'CodexProviderError';
  }
}
