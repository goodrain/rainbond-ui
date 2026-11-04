const assert = require('node:assert/strict');
const { isBundledDiskCleanup, bundledDiskCleanupRegions } = require('./enterpriseDiskCleanup');

const base = { name: 'rainbond-enterprise-base-ARM64', region_app_id: 'base-app', namespace: 'plugins', enable_status: 'true' };
const disk = { name: 'rainbond-disk', region_app_id: 'base-app', namespace: 'plugins', enable_status: 'true' };
assert.equal(isBundledDiskCleanup(disk, [base, disk]), true);
for (const changed of [{ region_app_id: 'standalone' }, { namespace: 'other' }, { enable_status: 'false' }, { region_app_id: '' }]) {
  assert.equal(isBundledDiskCleanup({ ...disk, ...changed }, [base]), false);
}
assert.equal(isBundledDiskCleanup(disk, [{ ...base, enable_status: 'false' }]), false);
assert.deepEqual(bundledDiskCleanupRegions({ integrated: [base, disk], oldBase: [base], standalone: [disk], empty: [] }), ['integrated']);
assert.deepEqual(bundledDiskCleanupRegions(undefined), []);
console.log('Bundled entry ownership, architecture variants and standalone preservation passed.');
