/** Exact native guardian witness: real host/service/provider, scripted Git and assessor. */
import { readFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { startCoordinatorHost } from '../coordinator-host.js';
import { coordinatorStartSchema } from '../coordinator-contracts.js';
const envelope = JSON.parse(await readFile(process.argv[2]!, 'utf8'));
await unlink(process.argv[2]!);
const options = coordinatorStartSchema.parse(envelope.options);
const baseline = 'a'.repeat(40);
const host = await startCoordinatorHost(options, {
  guardian: envelope.guardian,
  assistance: { registrationProtection: async () => ({ baselineCommit: baseline, rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null }), resolveCommit: async (_root, revision) => revision === 'HEAD' ? baseline : revision, currentHead: async () => baseline, isCleanRepository: async () => true },
  runtime: {
    assessor: async context => {
      // This writer belongs to assessment work, outside the Codex provider tree.
      const worker = spawn('python3', ['-c', `import os,time\npid=os.fork()\nif pid: os._exit(0)\nos.setsid()\nopen(${JSON.stringify(join(options.projectRoot, 'assessment-writer.pid'))},'w').write(str(os.getpid()))\nwhile True: time.sleep(0.02)`], { cwd: options.projectRoot, stdio: 'ignore' });
      worker.on('error', () => undefined);
      await new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }));
      throw new Error('Scripted assessor interrupted');
    },
    close: async () => undefined,
  },
});
process.once('SIGTERM', () => { void host.control({ action: 'stop', commandId: 'signal-stop' }); });
await host.ready; await host.closed;
