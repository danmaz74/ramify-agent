export interface CoordinateOptions {
  readonly action: 'start' | 'status' | 'watch' | 'send' | 'respond' | 'interrupt' | 'stop' | 'resume';
  readonly projectRoot: string; readonly id?: string; readonly planId?: string; readonly jobId?: string;
  readonly commandId?: string; readonly model?: string; readonly workerModel?: string; readonly assessmentModel?: string;
  readonly replaceMcp: readonly string[]; readonly skill?: string; readonly messageFile?: string; readonly responseFile?: string;
  readonly requestId?: string; readonly turnId?: string; readonly codexExecutable?: string;
  readonly after: number; readonly timeoutMs: number; readonly json: boolean;
}
/** This parser has no process or runtime side effects. */
export function parseCoordinateOptions(argv: readonly string[]): CoordinateOptions {
  const action = argv[0];
  if (!['start', 'status', 'watch', 'send', 'respond', 'interrupt', 'stop', 'resume'].includes(action ?? '')) throw new Error('coordinate requires start, status, watch, send, respond, interrupt, stop or resume');
  const flags = new Map<string, string>(); const replaceMcp: string[] = []; let json = false;
  const accepted = ['project', 'id', 'plan', 'job', 'command-id', 'model', 'worker-model', 'assessment-model', 'replace-mcp', 'skill', 'message-file', 'response-file', 'request', 'turn', 'codex-executable', 'after', 'timeout-ms'];
  for (let index = 1; index < argv.length; index++) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(argv[index]!);
    if (match?.[1] === 'json' && match[2] === undefined) { json = true; continue; }
    if (match === null || !accepted.includes(match[1]!)) throw new Error(`Unknown coordinate option ${argv[index]}`);
    const value = match[2] ?? argv[++index];
    if (value === undefined || value === '' || value.startsWith('--')) throw new Error(`--${match[1]} needs a value`);
    if (match[1] === 'replace-mcp') replaceMcp.push(value);
    else { if (flags.has(match[1]!)) throw new Error(`Duplicate --${match[1]}`); flags.set(match[1]!, value); }
  }
  const required = (name: string) => { const value = flags.get(name); if (value === undefined) throw new Error(`coordinate ${action} requires --${name}`); return value; };
  const projectRoot = required('project');
  if (action === 'start') required('plan');
  if (!['start', 'status'].includes(action!)) required('id');
  if (action === 'send') { required('message-file'); required('command-id'); }
  if (action === 'respond') { required('request'); required('response-file'); required('command-id'); }
  const after = Number(flags.get('after') ?? '0'); const timeoutMs = Number(flags.get('timeout-ms') ?? '180000');
  if (!Number.isSafeInteger(after) || after < 0 || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1_200_000) throw new Error('Invalid coordinate cursor or timeout (maximum 1200000 ms)');
  const allowed = new Set(['project', 'id', 'timeout-ms', ...(action === 'start' ? ['plan', 'job', 'command-id', 'model', 'worker-model', 'assessment-model', 'replace-mcp', 'skill', 'message-file', 'codex-executable'] : action === 'send' ? ['command-id', 'message-file'] : action === 'respond' ? ['command-id', 'request', 'response-file'] : action === 'interrupt' ? ['command-id', 'turn'] : action === 'stop' ? ['command-id'] : action === 'watch' ? ['after'] : [])]);
  for (const key of flags.keys()) if (!allowed.has(key)) throw new Error(`--${key} does not apply to coordinate ${action}`);
  if (replaceMcp.length > 0 && action !== 'start') throw new Error('--replace-mcp applies to start');
  return { action: action as CoordinateOptions['action'], projectRoot, id: flags.get('id'), planId: flags.get('plan'), jobId: flags.get('job'), commandId: flags.get('command-id'), model: flags.get('model'), workerModel: flags.get('worker-model'), assessmentModel: flags.get('assessment-model'), replaceMcp, skill: flags.get('skill'), messageFile: flags.get('message-file'), responseFile: flags.get('response-file'), requestId: flags.get('request'), turnId: flags.get('turn'), codexExecutable: flags.get('codex-executable'), after, timeoutMs, json };
}
