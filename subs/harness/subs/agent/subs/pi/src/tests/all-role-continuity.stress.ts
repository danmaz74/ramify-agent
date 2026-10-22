import { afterEach, beforeAll, test } from 'vitest';
import { roleSchema } from '../../../../../../src/interfaces/protocol/runs.js';
import { checkRoleContinuity, continuityPaths } from './helpers/role-continuity.js';

const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const cases = roleSchema.options.flatMap(role => continuityPaths.map(path => ({ role, path })));

test.each(cases)('$role $path keeps the current task through native compaction', async ({ role, path }) => checkRoleContinuity(cleanups, role, path));
