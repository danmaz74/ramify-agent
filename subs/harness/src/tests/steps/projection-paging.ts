import { After, Given, When, Then } from '@cucumber/cucumber';
import { recordedProjectionPaging } from '../helpers/projection-paging.js';

type Fixture = Awaited<ReturnType<typeof recordedProjectionPaging>>;
let fixture: Fixture | undefined;
function current(): Fixture { if (!fixture) throw new Error('Paging fixture not prepared'); return fixture; }
After(async () => { const value = fixture; fixture = undefined; await value?.close(); });
Given('recorded execution data and sessions with transcript cursors', async () => { fixture = await recordedProjectionPaging(); });
When('a client requests bounded pages and polls from its previous version', async () => { await current().boundaries(); });
Then('ordering, byte limits, cursors and changed-session selection match the baseline', async () => { await current().boundaries(); });
Then('stale versions and invalid cursors retain their existing refusals', async () => { await current().refusals(); });
Then('finished-session caching preserves the same answers', async () => { await current().cache(); });
