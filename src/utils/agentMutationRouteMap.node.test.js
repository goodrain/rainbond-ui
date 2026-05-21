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
  resolvePreActionRoute,
  resolvePostActionRoute,
  shouldHandleApprovedMutationTrace,
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
  resolvePreActionRoute,
  resolvePostActionRoute,
  shouldHandleApprovedMutationTrace,
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

  const buildSourcePreRoute = resolvePreActionRoute({
    toolName: 'rainbond_manage_component_envs',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
    targetRef: {
      kind: 'service',
      team_name: 'demo',
      region_name: 'test',
      app_id: '8',
      service_alias: 'api',
      operation: 'replace_build_envs',
    },
  });

  assert.ok(
    buildSourcePreRoute.includes('type=components'),
    'replace_build_envs route should open the component slide panel'
  );
  assert.ok(
    buildSourcePreRoute.includes('componentID=api'),
    'replace_build_envs route should target the component'
  );
  assert.ok(
    buildSourcePreRoute.includes('tab=advancedSettings'),
    'replace_build_envs route should open advanced settings'
  );
  assert.ok(
    buildSourcePreRoute.includes('subTab=resource'),
    'replace_build_envs route should open the build source sub tab'
  );

  const runtimeEnvPreRoute = resolvePreActionRoute({
    toolName: 'rainbond_manage_component_envs',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
    targetRef: {
      kind: 'service',
      team_name: 'demo',
      region_name: 'test',
      app_id: '8',
      service_alias: 'api',
      operation: 'upsert',
    },
  });

  assert.ok(
    runtimeEnvPreRoute.includes('tab=environmentConfiguration'),
    'runtime env route should still open the environment configuration tab'
  );

  const updateBuildSourceRoute = resolvePreActionRoute({
    toolName: 'rainbond_update_component_build_source',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
  });

  assert.ok(
    updateBuildSourceRoute.includes('tab=advancedSettings'),
    'update_component_build_source route should open advanced settings'
  );
  assert.ok(
    updateBuildSourceRoute.includes('subTab=resource'),
    'update_component_build_source route should open the build source sub tab'
  );

  const updateBuildSourcePostRoute = resolvePostActionRoute({
    toolName: 'rainbond_update_component_build_source',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
  });

  assert.ok(
    updateBuildSourcePostRoute.includes('tab=advancedSettings'),
    'update_component_build_source post route should open advanced settings after success'
  );
  assert.ok(
    updateBuildSourcePostRoute.includes('subTab=resource'),
    'update_component_build_source post route should open the build source sub tab after success'
  );
  assert.match(
    updateBuildSourcePostRoute,
    /[?&]refresh=\d+/,
    'update_component_build_source post route should include refresh after success'
  );

  const buildSourceEnvPostRoute = resolvePostActionRoute({
    toolName: 'rainbond_manage_component_envs',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
    resultRef: {
      kind: 'service',
      team_name: 'demo',
      region_name: 'test',
      app_id: '8',
      service_alias: 'api',
      operation: 'replace_build_envs',
    },
  });

  assert.ok(
    buildSourceEnvPostRoute.includes('tab=advancedSettings'),
    'replace_build_envs post route should open advanced settings after success'
  );
  assert.ok(
    buildSourceEnvPostRoute.includes('subTab=resource'),
    'replace_build_envs post route should open the build source sub tab after success'
  );
  assert.match(
    buildSourceEnvPostRoute,
    /[?&]refresh=\d+/,
    'replace_build_envs post route should include refresh after success'
  );

  const buildComponentPostRoute = resolvePostActionRoute({
    toolName: 'rainbond_build_component',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
  });

  assert.ok(
    buildComponentPostRoute.includes('componentID=api'),
    'build_component post route should target the component after success'
  );
  assert.ok(
    buildComponentPostRoute.includes('tab=overview'),
    'build_component post route should open the component overview after success'
  );
  assert.match(
    buildComponentPostRoute,
    /[?&]refresh=\d+/,
    'build_component post route should include refresh after success'
  );

  const operateAppPostRoute = resolvePostActionRoute({
    toolName: 'rainbond_operate_app',
    context: {
      teamName: 'demo',
      regionName: 'test',
      appId: '8',
      componentAlias: 'api',
    },
  });

  assert.match(
    operateAppPostRoute,
    /^\/team\/demo\/region\/test\/apps\/8\/overview\?/,
    'operate_app post route should refresh the app overview after success'
  );
  assert.match(
    operateAppPostRoute,
    /[?&]refresh=\d+/,
    'operate_app post route should include refresh after success'
  );

  assert.strictEqual(
    shouldHandleApprovedMutationTrace({
      toolName: 'rainbond_manage_component_autoscaler',
      pendingMutationTool: '',
    }),
    false,
    'autoscaler query traces without approval should not trigger navigation'
  );
  assert.strictEqual(
    shouldHandleApprovedMutationTrace({
      toolName: 'rainbond_manage_component_autoscaler',
      pendingMutationTool: 'rainbond_manage_component_autoscaler',
    }),
    true,
    'approved autoscaler mutation traces should trigger navigation'
  );
}

if (typeof test === 'function') {
  test('component mutation routes include refresh keys for topology remounts', runTests);
} else {
  runTests();
  console.log('agent mutation route map tests passed');
}
