import assert from 'node:assert/strict';
import { Given, When, Then, After } from '@cucumber/cucumber';
import { weightedQueryFixture, type WeightedCase } from '../helpers/kpi-weighted-queries.js';

let baseline = false;
let mode: WeightedCase | undefined;
let fixture: Awaited<ReturnType<typeof weightedQueryFixture>> | undefined;
function current() { assert.ok(fixture, 'The real public metrics query must run first'); return fixture; }
Given('a complete baseline measurement of 10000 bytes', () => { baseline = true; });
// The two frozen writer phrasings share one expression, not conflicting definitions.
Given(/^(?:one writer|a writer) with scope 1000 bytes and delivered weight 10 lines$/, () => { mode = 'complete'; });
Given('another writer with scope 3000 bytes and delivered weight 30 lines', () => { assert.equal(baseline, true); mode = 'complete'; });
Given('another writer with unknown source size and delivered weight 3 lines', () => { mode = 'missing'; });
Given('complete recorded invocation costs and no delivered line weight', () => { mode = 'zero'; });
When(/^the metrics query calculates the weighted scope measurements?$/, async () => { assert.ok(mode); fixture = await weightedQueryFixture(mode); await fixture.exercise(); });
When('the metrics query reads the run', async () => { assert.equal(mode, 'zero'); fixture = await weightedQueryFixture('zero'); await fixture.exercise(); });
Then('the weighted scope value is 2500 with numerator 100000 and denominator 40', () => { current().arithmetic(); });
Then('the scope size ratio is 0.25 and the reduction factor is 4', () => { current().ratios(); });
Then('policy versions and evidence identify both writer contributions', () => { current().evidence(); });
Then('its complete value is unavailable', () => { current().unavailable(); });
Then('its known subtotal is 10000 over known weight 10', () => { current().subtotal(); });
Then('coverage identifies one of two writers and the missing size reason', () => { current().missing(); });
Then('the unknown size is not represented as zero', () => { current().notZero(); });
Then('ratios requiring delivered line weight are not applicable', () => { current().zero(); });
Then('recorded session costs remain available under their existing policies', () => { current().costs(); });
Then('a failed history read instead retains an unavailable attribution reason', async () => { await current().failedHistory(); });
After(async () => { const closing = fixture; fixture = undefined; mode = undefined; baseline = false; if (closing) await closing.close(); });
