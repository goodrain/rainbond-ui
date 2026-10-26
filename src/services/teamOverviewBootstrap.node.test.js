const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const parser = require('@babel/parser');

function load(request) {
  const source = fs.readFileSync(path.join(__dirname, 'team.js'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module' });
  const definition = ast.program.body.find(node => node.type === 'ExportNamedDeclaration' &&
    node.declaration && node.declaration.id && node.declaration.id.name === 'getTeamRegionOverview').declaration;
  const state = ast.program.body.find(node => node.type === 'VariableDeclaration' &&
    node.declarations.some(item => item.id.name === 'teamRegionOverviewRequests'));
  return new Function('request', 'apiconfig', `${source.slice(state.start, state.end)}
    ${source.slice(definition.start, definition.end)}
    return getTeamRegionOverview;`)(request, { baseUrl: '/api' });
}

test('layout-owned bootstrap bypasses only legacy in-flight dedup, without HTTP metadata leakage', async () => {
  const requests = [];
  const overview = load((url, options) => new Promise(resolve => requests.push({ url, options, resolve })));
  const payload = { team_name: 'team-a', region_name: 'region-a' };
  const errors = [];
  const first = overview(payload, error => errors.push(['first', error]));
  const duplicate = overview(payload, error => errors.push(['second', error]));
  assert.equal(requests.length, 1, 'unmarked old callers still share their pending request');
  const owned = overview(payload, error => errors.push(['owned', error]), { skipDedup: true });
  const forced = overview(payload, undefined, { skipDedup: true });
  assert.equal(requests.length, 3, 'every new owner generation gets its own transport');
  requests.forEach(({ url, options }) => {
    assert.equal(url, '/api/console/teams/team-a/overview');
    assert.deepEqual(options.params, { region_name: 'region-a' });
    assert.equal(options.data, undefined);
    assert.equal(options.headers, undefined);
    assert.equal(options.skipDedup, undefined);
  });
  const failure = new Error('unavailable');
  requests[0].options.handleError(failure);
  requests[1].options.handleError(failure);
  assert.deepEqual(errors.map(([label]) => label), ['first', 'second', 'owned']);
  requests.forEach(({ resolve }, index) => resolve({ bean: { index } }));
  const results = await Promise.all([first, duplicate, owned, forced]);
  assert.equal(results[0], results[1]);
  assert.equal(results[2].bean.index, 1);
  assert.equal(results[3].bean.index, 2);
  const fresh = overview(payload);
  assert.equal(requests.length, 4, 'unmarked completed requests do not become a cache');
  requests[3].resolve({ bean: {} });
  await fresh;
});
