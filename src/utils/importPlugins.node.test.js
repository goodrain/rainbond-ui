const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const System = require('systemjs');

const source = fs.readFileSync(path.join(__dirname, 'importPlugins.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module' });
const names = ['getPluginAllFilePaths', 'importPluginModule', 'importAppPagePlugin'];
const functions = ast.program.body.map(item => item.declaration || item)
  .filter(item => item.type === 'FunctionDeclaration' && names.includes(item.id.name))
  .map(item => source.slice(item.start, item.end)).join('\n');

function harness() {
  const loader = new System.constructor();
  const transport = {};
  loader.config({ baseURL: 'https://host.invalid/' });
  loader.registry.set(loader.resolveSync('fixture-loader'), loader.newModule({ fetch: load => transport.fetch(load) }));
  loader.config({ meta: { '/console/*': { loader: 'fixture-loader' } } });
  class TeamPlugin { init(meta) { this.meta = meta; } }
  class EnterprisePlugin extends TeamPlugin {}
  const api = new Function('SystemJS', 'RainbondRootPagePlugin', 'RainbondEnterprisePagePlugin',
    `${functions}; return { importPluginModule, importAppPagePlugin };`)(loader, TeamPlugin, EnterprisePlugin);
  return { loader, transport, ...api };
}

function bundle(region) {
  return `define([], function () { return { plugin: { root: ${JSON.stringify(region)}, init: function (meta) { this.meta = meta; } } }; });`;
}

test('real SystemJS loads separate AMD roots from each region and preserves exported root/meta', async () => {
  const h = harness();
  const paths = [];
  h.transport.fetch = load => {
    paths.push(load.address);
    return Promise.resolve(bundle(load.address.includes('/region-a/') ? 'root-a' : 'root-b'));
  };
  const meta = { name: 'rainbond-ai-engine' };
  const a = await h.importAppPagePlugin(meta, 'region-a', 'team');
  const b = await h.importAppPagePlugin(meta, 'region-b', 'team');
  assert.equal(a.root, 'root-a');
  assert.equal(b.root, 'root-b');
  assert.equal(a.meta, meta);
  assert.equal(b.meta, meta);
  assert.notEqual(a, b);
  assert.deepEqual(paths, [
    'file:///console/regions/region-a/static/plugins/rainbond-ai-engine',
    'file:///console/regions/region-b/static/plugins/rainbond-ai-engine'
  ]);
});

test('authorization failures remain rejected and a later explicit retry refetches the failed AMD module', async () => {
  const h = harness();
  let reads = 0;
  h.transport.fetch = () => ++reads === 1 ? Promise.reject(new Error('403 Forbidden')) : Promise.resolve(bundle('root-retry'));
  const meta = { name: 'rainbond-ai-engine' };
  await assert.rejects(h.importAppPagePlugin(meta, 'region-a', 'team'), /403 Forbidden/);
  const retried = await h.importAppPagePlugin(meta, 'region-a', 'team');
  assert.equal(reads, 2);
  assert.equal(retried.root, 'root-retry');
  await h.importAppPagePlugin(meta, 'region-a', 'team');
  assert.equal(reads, 2, 'successful modules retain the normal SystemJS cache');
});
