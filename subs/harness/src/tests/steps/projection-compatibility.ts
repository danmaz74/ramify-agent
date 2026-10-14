import { After, Given, When, Then } from '@cucumber/cucumber';
import { recordedCompatibility } from '../helpers/projection-compatibility.js';
let fixture: Awaited<ReturnType<typeof recordedCompatibility>> | undefined;
function current() { if (!fixture) throw new Error('Compatibility fixture not prepared'); return fixture; }
After(async () => { const value = fixture; fixture = undefined; await value?.close(); });
Given('supported run and historical standalone-session records', async () => { fixture = await recordedCompatibility(); });
Given('records with unsupported versions or malformed required content', async () => { await current().refused(); });
When('the harness reopens and the extracted readers answer queries', async () => { await current().reopen(); });
Then('supported records yield the baseline answers', async () => { await current().supported(); });
Then('unsupported or unreadable records retain their errors and evidence', async () => { await current().refused(); });
Then('no record is rewritten to make a query succeed', async () => { await current().unchanged(); });
