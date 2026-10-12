const assert = require('assert');
const { normalizeRegionOptions } = require('./regionOptions');

const source = [
  { region_name: 'rainbond', region_alias: 'Default' },
  {},
  null,
  { region_name: '  edge  ', region_alias: '' },
  { region_name: 'rainbond', region_alias: 'Duplicate' }
];

assert.deepStrictEqual(normalizeRegionOptions(source), [
  { region_name: 'rainbond', region_alias: 'Default' },
  { region_name: 'edge', region_alias: 'edge' }
]);
assert.deepStrictEqual(normalizeRegionOptions({ list: source }), []);
assert.deepStrictEqual(normalizeRegionOptions(null), []);

console.log('create team region option tests passed');
