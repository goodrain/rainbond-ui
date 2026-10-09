const assert = require('assert');
const {
  getTeamRegions,
  normalizeList
} = require('./teamRegionHelpers');

const regions = [{ team_region_name: 'rainbond' }];

assert.deepStrictEqual(normalizeList(regions), regions);
assert.deepStrictEqual(normalizeList({ list: regions }), []);
assert.deepStrictEqual(normalizeList(null), []);
assert.deepStrictEqual(getTeamRegions({ region: regions }, {}), regions);
assert.deepStrictEqual(getTeamRegions({ region: {} }, { region: regions }), regions);
assert.deepStrictEqual(getTeamRegions({ region: {} }, { region: {} }), []);

console.log('select team region helper tests passed');
