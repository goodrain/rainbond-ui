const assert = require('assert');
const fs = require('fs');
const path = require('path');
const data = require('./overviewData');

const valid = { valid: true, expire_at: 1893456000 };
['idle', 'loading', 'error', 'empty', 'invalid'].forEach(status => {
  const result = data.platformLicenseSummary(valid, status);
  assert.notStrictEqual(result.level, 'healthy', 'stale valid data must not override the current request status');
  assert.strictEqual(result.expireAt, null);
});
assert.deepStrictEqual(data.platformLicenseSummary(valid, 'success'), {
  level: 'healthy', labelId: 'header.licenseValid', expireAt: 1893456000
});
[undefined, null, 0, -1, '', NaN, Infinity, true, false].forEach(expire_at => {
  assert.strictEqual(data.platformLicenseSummary({ valid: true, expire_at }, 'success').expireAt, null, 'unknown expiry is not permanent');
});
assert.strictEqual(data.platformLicenseSummary(null, 'success').labelId, 'header.licenseUnknown');
assert.strictEqual(data.platformLicenseSummary({}, 'success').labelId, 'header.licenseUnknown');
assert.strictEqual(data.platformLicenseSummary({ valid: false, reason: '' }, 'success').labelId, 'header.licenseUnknown');
assert.strictEqual(data.platformLicenseSummary({ valid: false, reason: 'no_region' }, 'success').labelId, 'header.licenseUnknown');
assert.strictEqual(data.platformLicenseSummary({ valid: false, reason: 'license expired' }, 'success').labelId, 'header.licenseExpired');
assert.strictEqual(data.platformLicenseSummary({ valid: false, reason: 'license not yet valid' }, 'success').labelId, 'header.licensePending');

const runtime = clusters => ({ status: 'ok', global: { clusters } });
assert.strictEqual(data.platformClusterSummary(null).level, 'loading');
assert.strictEqual(data.platformClusterSummary({ status: 'unavailable' }).level, 'unknown');
assert.deepStrictEqual(data.platformClusterSummary(runtime({ total: 3, healthy: 1, warning: 1, unavailable: 1 })), {
  level: 'warning', labelId: 'header.clusterAttention', values: { count: 2 }
});
assert.strictEqual(data.platformClusterSummary(runtime({ total: 1, healthy: 1, warning: 0, unavailable: 0 })).level, 'healthy');
assert.strictEqual(data.platformClusterSummary(runtime({ total: 1, healthy: 1 })).level, 'unknown', 'missing status counts must not imply health');
assert.strictEqual(data.platformClusterSummary(runtime({ total: 1, healthy: true, warning: 0, unavailable: 0 })).level, 'unknown');
assert.strictEqual(data.platformClusterSummary(runtime({ total: 0 })).labelId, 'header.clusterEmpty');
assert.strictEqual(data.platformClusterSummary(runtime({ total: 1, disabled: 1 })).labelId, 'header.clusterDisabled');
assert.notStrictEqual(data.platformClusterSummary(runtime({ total: 2, healthy: 0, warning: 0, unavailable: 2 })).level, 'healthy');

const page = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const header = page.slice(page.indexOf('  renderPlatformHeader() {'), page.indexOf('  renderGlobalPosture() {'));
assert.ok(/platformFacts/.test(header) && /header\.platformVersion/.test(header) && /header\.licenseStatus/.test(header) && /header\.licenseExpires/.test(header));
assert.ok(!/dispatch|loadLicense|fetch/.test(header), 'header rendering must not add or block on data requests');
assert.ok(/enterprise_edition\.value === true/.test(header) && /enterprise_edition\.value === 'true'/.test(header), 'edition must come from explicit platform configuration');
assert.ok(!/header\.community|unlimited/.test(header), 'missing license data must not imply community edition or permanent authorization');
assert.ok(/platformModalVisible: true/.test(header), 'platform identity and license still open the existing modal');
const modal = fs.readFileSync(path.join(__dirname, 'components/PlatformInfoModal.js'), 'utf8');
assert.ok(!/: labels\.unlimited\s*: labels\.notApplicable/.test(modal), 'missing expiry must not be called unlimited in the detail modal either');
console.log('platform header summary, license availability and rendering checks passed');
