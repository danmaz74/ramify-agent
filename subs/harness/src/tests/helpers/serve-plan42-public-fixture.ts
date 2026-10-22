import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../http/app.js';
import { plan, runToEnd, scenarios } from './composition.js';

/** A real accepted descriptive run served to the built web client for the Plan 42 browser witness. */
const run = await runToEnd(scenarios['name-rejection']);
const assetsDirectory = fileURLToPath(new URL('../../../../../dist/web', import.meta.url));
const app = createApp({ projectRoot: run.root, runs: run.service, assetsDirectory });
const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
  const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
});
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('The public fixture has no TCP port');
const origin = `http://127.0.0.1:${address.port}`;
const output = { origin, page: `${origin}/#/plans/${encodeURIComponent(plan)}/runs/${encodeURIComponent(run.runId)}`,
  planId: plan, runId: run.runId };
const outIndex = process.argv.indexOf('--out');
if (outIndex >= 0) await writeFile(process.argv[outIndex + 1]!, `${JSON.stringify(output)}\n`);
else process.stdout.write(`${JSON.stringify(output)}\n`);

let closing = false;
const close = () => {
  if (closing) return;
  closing = true;
  server.close(() => { void run.dispose().then(() => process.exit(0)); });
};
process.once('SIGINT', close);
process.once('SIGTERM', close);
