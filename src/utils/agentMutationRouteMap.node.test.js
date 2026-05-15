const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadRouteMapModule() {
  const filename = path.join(__dirname, 'agentMutationRouteMap.js');
  const source = fs
    .readFileSync(filename, 'utf8')
    .replace(/\bexport function /g, 'function ');
  const module = { exports: {} };
  vm.runInNewContext(
    `${source}
module.exports = {
  resolvePostActionRoute,
};`,
    {
      module,
      exports: module.exports,
      Date,
    },
    { filename }
  );
  return module.exports;
}

const {
  resolvePostActionRoute,
} = loadRouteMapModule();

function runTests() {
  const createdComponentRoute = resolvePostActionRoute({
    toolName: 'rainbond_create_component_from_image',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
    },
    result: {
      service_alias: 'api',
    },
  });

  assert.match(
    createdComponentRoute,
    /^\/team\/demo\/region\/test\/apps\/8\/overview\?/,
    'created component route should target the app overview page'
  );
  assert.ok(createdComponentRoute.includes('type=components'), 'route should open the component slide panel');
  assert.ok(createdComponentRoute.includes('componentID=api'), 'route should target the created component');
  assert.ok(createdComponentRoute.includes('tab=overview'), 'route should open the component overview tab');
  assert.match(
    createdComponentRoute,
    /[?&]refresh=\d+/,
    'route should include refresh to remount the topology iframe'
  );

  const deletedComponentRoute = resolvePostActionRoute({
    toolName: 'rainbond_delete_component',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
  });

  assert.match(
    deletedComponentRoute,
    /^\/team\/demo\/region\/test\/apps\/8\/overview\?/,
    'deleted component route should return to the app overview page'
  );
  assert.match(
    deletedComponentRoute,
    /[?&]refresh=\d+/,
    'deleted component route should include refresh to reload the topology iframe'
  );
}

if (typeof test === 'function') {
  test('component mutation routes include refresh keys for topology remounts', runTests);
} else {
  runTests();
  console.log('agent mutation route map tests passed');
}
