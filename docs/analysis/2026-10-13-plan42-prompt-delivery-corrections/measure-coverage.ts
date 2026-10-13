import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { describeCoverageLimits, type CoverageRecord } from '../../../subs/harness/subs/evidence/src/views.js';

// Run from the repository root with: node_modules/.bin/tsx docs/analysis/2026-10-13-plan42-prompt-delivery-corrections/measure-coverage.ts
// Original captures are read only. This is a reconstruction of future delivery,
// not a rewrite of historical manifests or evidence of provider cost/latency.
const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const inputDirectory = 'docs/analysis/2026-10-13-plan42-interim-postmortem/invocations';
const captures = [
  '20261012T214040Z-096401/inv-0010',
  '20261012T214040Z-096401/inv-0013',
  '20261012T235407Z-c5f035/inv-0010',
  '20261012T235407Z-c5f035/inv-0013',
  '20261013T025005Z-9fa497/inv-0010',
];
const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const utf8 = (value: string) => Buffer.byteLength(value, 'utf8');
const once = (original: string, old: string, replacement: string) => {
  const index = original.indexOf(old);
  if (index === -1 || original.indexOf(old, index + old.length) !== -1) throw new Error('Replacement must identify exactly one captured occurrence');
  return original.slice(0, index) + replacement + original.slice(index + old.length);
};
const measurements = [];
for (const id of captures) {
  const input = `${inputDirectory}/${id}/packet.json`;
  const bytes = await readFile(resolve(root, input));
  const capture = JSON.parse(bytes.toString('utf8'));
  const packet = capture.packet;
  const additions = packet.additions.filter((entry: { key: string }) => entry.key === 'environment:views');
  if (additions.length !== 1) throw new Error(`${id}: expected one views addition`);
  const originalAddition: string = additions[0].text;
  const body = JSON.parse(originalAddition.slice(originalAddition.indexOf('{')));
  const affected = body.views.flatMap((view: { coverage: string[]; revision: string; path: string; modules: string[] }, viewIndex: number) =>
    view.coverage.flatMap((line: string, lineIndex: number) => line.startsWith('In `ramify-agent/harness`:') ? [{ view, viewIndex, line, lineIndex }] : []));
  if (affected.length !== 1) throw new Error(`${id}: expected one exhaustive harness enumeration`);
  const { view, viewIndex, line: originalLine, lineIndex } = affected[0];
  const module = 'ramify-agent/harness';
  const records: CoverageRecord[] = [];
  const prefix = `In \`${module}\`: `;
  const enumeration: string = originalLine.slice(prefix.length, -1);
  // Match all entries and verify complete reconstruction: no dropped names,
  // unknown syntax, or guessed counts can silently change this comparison.
  for (const match of enumeration.matchAll(/`([^`]+)#([^`]+)` \(([^)]+)\)(?:, |$)/gu)) {
    const what = match[3]!;
    records.push({ module, file: match[1]!, name: match[2]!, what,
      limit: /^(signature|documentation|signature and documentation)$/u.test(what) ? 'cut' : 'details-unavailable' });
  }
  if (records.map(record => `\`${record.file}#${record.name}\` (${record.what})`).join(', ') !== enumeration) throw new Error(`${id}: incomplete enumeration parse`);
  // Original nonempty source-analysis statement selects formatter output without
  // reconstructing missing records belonging to other modules. Existing global
  // count/limit statements stay byte-identical; only the exhaustive local line
  // and the formatter's explicit missing-provenance statement are substituted.
  const statements = describeCoverageLimits([view.coverage[0]], records, [module]);
  const newLine = statements.find(statement => statement.startsWith(prefix));
  const unavailable = statements.find(statement => statement.startsWith('Architect coverage detail access unavailable:'));
  if (!newLine || !unavailable) throw new Error(`${id}: expected current summary and unavailable-detail statement`);
  const oldEncoded = JSON.stringify(originalLine);
  const replacementEncoded = `${JSON.stringify(newLine)},\n        ${JSON.stringify(unavailable)}`;
  const changedAddition = once(originalAddition, oldEncoded, replacementEncoded);
  const changedMessage = once(packet.message, originalAddition, changedAddition);
  const changedBody = JSON.parse(changedAddition.slice(changedAddition.indexOf('{')));
  const identity = { path: view.path, revision: view.revision, modules: view.modules };
  const countBytes = (before: string, after: string) => ({ before: utf8(before), after: utf8(after), reduction: utf8(before) - utf8(after), beforeSha256: sha256(before), afterSha256: sha256(after) });
  measurements.push({ id, input, inputSha256: sha256(bytes), inputBytes: bytes.length,
    viewIndex, lineIndex, retainedViewIdentity: identity,
    identityLimitation: 'Captured view identity is preserved exactly; architect input identity and historical generated JSONL record files are not retained. No current generated files are substituted as historical proof.',
    parsedLimitedRecords: records.length, namedRecords: Math.min(records.length, 12), omittedRecords: Math.max(0, records.length - 12),
    originalLineSha256: sha256(originalLine), replacementLines: [newLine, unavailable],
    localCoverageText: countBytes(originalLine, `${newLine}\n${unavailable}`),
    serializedView: countBytes(JSON.stringify(view), JSON.stringify(changedBody.views[viewIndex])),
    viewsAddition: countBytes(originalAddition, changedAddition),
    appendedMessage: countBytes(packet.message, changedMessage),
    detailAccess: { kind: 'unavailable', reason: 'Historical generated record-file provenance and bytes are not retained.' },
    preserved: ['Original packet files', 'Other views', 'Original global coverage and count statements', 'Ordinary/testing API-view identity', 'Inherited history outside the appended message'],
  });
}
const formatterPath = 'subs/harness/subs/evidence/src/views.ts';
const scriptPath = relative(root, fileURLToPath(import.meta.url));
const sum = (field: 'localCoverageText' | 'serializedView' | 'viewsAddition' | 'appendedMessage') => Object.fromEntries(['before', 'after', 'reduction'].map(key => [key, measurements.reduce((total, entry) => total + entry[field][key as 'before' | 'after' | 'reduction'], 0)]));
const result = { schema: 'ramify-agent.coverage-delivery-measurement/1',
  command: `node_modules/.bin/tsx ${scriptPath}`,
  formatter: { path: formatterPath, sha256: sha256(await readFile(resolve(root, formatterPath))), function: 'describeCoverageLimits' },
  script: { path: scriptPath, sha256: sha256(await readFile(resolve(root, scriptPath))) },
  method: 'Call the changed production formatter on every parsed record from the exact retained exhaustive module coverage line; replace that unique serialized line and append the formatter\'s explicit unavailable-detail statement in the unique original views addition and appended message.',
  limitations: [
    'Reconstructed delivery comparison, not a model invocation or regenerated immutable packet/manifest.',
    'Bytes are UTF-8 text bytes, not provider tokens, cost, latency, or cache savings.',
    'Historical architect JSONL record files and architect input identity are unavailable. Detail-access unavailability is explicitly delivered; historical accessible detail is not demonstrated.',
    'Only captured module-limited records are reconstructed. Other-module global statements are retained verbatim and are not re-derived from incomplete input.',
    'This comparison leaves inherited messages intact and measures only the appended captured message.',
  ],
  measurements,
  totals: { captures: measurements.length, localCoverageText: sum('localCoverageText'), serializedView: sum('serializedView'), viewsAddition: sum('viewsAddition'), appendedMessage: sum('appendedMessage') },
};
const output = resolve(root, 'docs/analysis/2026-10-13-plan42-prompt-delivery-corrections/coverage-byte-measurements.json');
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.totals, null, 2));
