import { After, Given, When, Then } from '@cucumber/cucumber';
import { recordedProjectionAuthority } from '../helpers/projection-authority.js';

let fixture: Awaited<ReturnType<typeof recordedProjectionAuthority>> | undefined;
function current() { if (!fixture) throw new Error('Authority fixture not prepared'); return fixture; }
After(async () => { const value = fixture; fixture = undefined; await value?.close(); });
Given('recorded architect judgments, failed and passing audits, and partial metric evidence', async () => { fixture = await recordedProjectionAuthority(); });
Given('retained source-run references where the baseline supports imported history', () => { current().retainedSources(); });
When('the extracted readers answer progress, scenario and metric queries', async () => { await current().exercise(); });
Then('architect-reported status remains distinct from automated check outcomes', () => { current().authority(); });
Then('unavailable quantities, coverage and original source identities remain explicit', () => { current().provenance(); });
Then('the query creates no new completion judgment', async () => { await current().unchanged(); });
