import { Given, When, Then } from '@cucumber/cucumber';
import { scopeCollectionFixture } from '../helpers/kpi-scope-collection.js';

let fixture: ReturnType<typeof scopeCollectionFixture> | undefined;
function current() { if (!fixture) throw new Error('Scope collection fixture was not prepared'); return fixture; }
Given('delivered support with repeated source identities and overlapping module scopes', () => { fixture = scopeCollectionFixture(); });
When('execution translates its inputs and asks the KPI child for scope measurements', async () => { await current().collect(); });
Then('sources and scopes are counted once under the existing measurement policy', () => { current().identities(); });
Then('the resulting captured records match the baseline', () => { current().captured(); });
Then('incompatible view and measurement revisions retain an explicit limitation', () => { current().incompatible(); });
