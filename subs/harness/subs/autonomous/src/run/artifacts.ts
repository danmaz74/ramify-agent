import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileExclusive } from '../../../ledger/src/atomic.js';
export async function writeOnce(path: string, content: string | Uint8Array): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  if (await writeFileExclusive(path, content) === 'exists') {
    const existing = await readIfExists(path);
    if (existing === undefined || !existing.equals(Buffer.from(content))) throw new Error(`${path} already exists with different bytes`);
  }
}
export async function readIfExists(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}