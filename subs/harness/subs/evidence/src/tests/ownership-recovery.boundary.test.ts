// Reviewed installed-release witness; ordinary workflow claims remain scripted.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { RamifyCli } from '../ramify-cli.js';
import { temporaryDirectory } from './helpers/temporary.js';

test('released installed ownership adapter answers missing-export source while affected fails, and retains invalid acquisition diagnostics', async () => {
  const fixture = await temporaryDirectory();
  const cli = new RamifyCli({ timeoutMs: 120_000 });
  const consumer = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
  const declaration = 'ramify 1\nroot module recovery\nexpose-src companion from "api.ts" to descendants\n';
  try {
    await mkdir(resolve(fixture.path, 'src'));
    await writeFile(resolve(fixture.path, 'module.ramify'), declaration);
    await writeFile(resolve(fixture.path, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
      target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true,
    }, include: ['src/**/*.ts'] }));
    await writeFile(resolve(fixture.path, 'src/api.ts'), 'export const companion = 1;\n');
    const before = await cli.queryOwnershipResult(fixture.path, ['src/api.ts']);
    expect(before.status).toBe('answered');
    if (before.status !== 'answered') throw new Error(before.stdout + before.stderr);
    expect(before.answer.schemaVersion).toBe('ramify.ownership/1');
    expect(before.answer.ramifyVersion).toBe(consumer.dependencies['ramify.ts']);
    const affectedCommand = ['affected', '--batch', '--root', fixture.path, '--format', 'json', '--path', 'src/api.ts'];
    const baseline = await cli.run(affectedCommand, fixture.path);
    expect(baseline.code, baseline.stdout + baseline.stderr).toBe(0);
    expect(JSON.parse(baseline.stdout).selection.analysisCheck).toBe('passed');
    await writeFile(resolve(fixture.path, 'src/api.ts'), 'const companion = 1;\n');
    const invalidSource = await cli.queryOwnershipResult(fixture.path, ['src/api.ts']);
    expect(invalidSource.status).toBe('answered');
    if (invalidSource.status !== 'answered') throw new Error(invalidSource.stdout + invalidSource.stderr);
    expect(invalidSource.answer.paths).toEqual(before.answer.paths);
    const affected = await cli.run(affectedCommand, fixture.path);
    expect(affected.code).toBe(1);
    expect(affected.stdout).toContain('missing-export');
    await writeFile(resolve(fixture.path, 'module.ramify'), 'ramify 1\nthis is not a declaration\n');
    const invalidDeclaration = await cli.queryOwnershipResult(fixture.path, ['src/api.ts']);
    expect(invalidDeclaration).toMatchObject({ status: 'unavailable', failureStatus: 'invalid', exitCode: 1 });
    expect(invalidDeclaration.stdout).toContain('diagnostics');
    if (invalidDeclaration.status === 'unavailable') expect(invalidDeclaration.decoded?.diagnostics?.length).toBeGreaterThan(0);
    await writeFile(resolve(fixture.path, 'module.ramify'), declaration);
    await writeFile(resolve(fixture.path, 'src/api.ts'), 'export const companion = 1;\n');
    const restored = await cli.queryOwnershipResult(fixture.path, ['src/api.ts']);
    expect(restored.status).toBe('answered');
    const finalAnalysis = await cli.run(affectedCommand, fixture.path);
    expect(finalAnalysis.code, finalAnalysis.stdout + finalAnalysis.stderr).toBe(0);
    expect(JSON.parse(finalAnalysis.stdout).selection.analysisCheck).toBe('passed');
  } finally { await fixture.remove(); }
}, 180_000);
