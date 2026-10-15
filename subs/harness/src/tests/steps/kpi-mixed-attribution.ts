import { Given, When, Then, After } from '@cucumber/cucumber';
import { mixedAttributionFixture } from '../helpers/kpi-mixed-attribution.js';

let fixture: ReturnType<typeof mixedAttributionFixture> | undefined;
function current() { if (!fixture) throw new Error('Mixed attribution fixture not prepared'); return fixture; }
Given('a commit containing setup and writer edits to the same source path', () => {
  fixture = mixedAttributionFixture();
});
Given('authenticated surviving setup line identities', () => { current().authenticate(); });
When('the delivered change is calculated from the base to the accepted final tree', async () => { await current().exercise(); });
Then('only the verified setup line identities are excluded from writer weight', () => { current().exact(); });
Then('reverted changes contribute no surviving weight', async () => { await current().reverts(); });
Then('uncertain overlapping contributions stay unattributed with their reasons', async () => { await current().uncertainty(); });
After(() => { fixture = undefined; });
