import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

/*
 * Browser witness for accepted Plan 42 identities. The fixture runs real
 * ordinary acceptance with scripted external answers, then serves its
 * committed public queries and the built web client. No model is called.
 */
const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assets = resolve(project, 'dist/web/index.html');
if (!existsSync(assets)) throw new Error('Build the web client first with npm run build:web');
const out = join(tmpdir(), `plan42-public-${process.pid}.json`);
await rm(out, { force: true });
const fixture = spawn(resolve(project, 'node_modules/.bin/tsx'),
  ['subs/harness/src/tests/helpers/serve-plan42-public-fixture.ts', '--out', out],
  { cwd: project, stdio: ['ignore', 'ignore', 'inherit'] });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const served = await (async () => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (fixture.exitCode !== null) throw new Error(`The public fixture exited with ${fixture.exitCode}`);
      if (existsSync(out)) {
        try { return JSON.parse(await readFile(out, 'utf8')) as { origin: string; page: string; runId: string }; }
        catch { /* The fixture is still writing. */ }
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error('The public fixture did not become ready');
  })();
  browser = await chromium.launch({ executablePath: process.env['CHROMIUM_PATH'] ?? '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(served.page, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Plan and entries' }).click();
  await page.getByText('functional-requirement:retain-reviewer-notes', { exact: true }).first().waitFor();
  const plan = await page.locator('.run-page').innerText();
  assert.match(plan, /functional-requirement:retain-reviewer-notes/);
  assert.match(plan, /capability:reviewer-notes/);
  await page.getByRole('tab', { name: 'Work items' }).click();
  await page.getByRole('button', { name: 'work-item:reviewer-notes' }).click();
  await page.getByLabel('Accepted work item references').waitFor();
  const work = await page.getByLabel('Accepted work item references').innerText();
  assert.match(work, /functional-requirement:retain-reviewer-notes/);
  assert.match(work, /Retain reviewer notes\./);
  assert.match(work, /document:[a-z0-9-]+/);
  await page.getByRole('tab', { name: 'Overview' }).click();
  await page.getByLabel('CheckFinding finding:reviewer-notes-1').waitFor();
  const checks = await page.locator('.run-page').innerText();
  assert.match(checks, /finding:reviewer-notes-1/);
  assert.match(checks, /plan-deviation:move-reviewer-notes/);
  const finding = page.getByLabel('CheckFinding finding:reviewer-notes-1');
  await finding.getByRole('group', { name: 'Decision requested' }).waitFor();
  const accept = finding.locator('input[type="radio"][value="accept"]');
  await accept.check();
  assert.equal(await accept.isChecked(), true);
  await finding.getByLabel('Your name').fill('Browser reviewer');
  assert.equal(await finding.getByRole('button', { name: 'Answer' }).isEnabled(), true);
  assert.deepEqual(errors, []);
  process.stdout.write(`Plan 42 public browser witness passed for ${served.runId}\n`);
} finally {
  await browser?.close();
  fixture.kill('SIGTERM');
  await new Promise<void>(resolve => {
    if (fixture.exitCode !== null) { resolve(); return; }
    fixture.once('exit', () => resolve());
  });
  await rm(out, { force: true });
}
