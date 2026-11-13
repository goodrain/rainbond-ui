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
  isKubernetesMutationTool,
  isSupportedAgentMutationTool,
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
  isKubernetesMutationTool,
  isSupportedAgentMutationTool,
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

  const componentTools = [
    'rainbond_build_component',
    'rainbond_manage_component_envs',
    'rainbond_manage_component_connection_envs',
    'rainbond_manage_component_dependency',
    'rainbond_manage_component_ports',
    'rainbond_manage_component_storage',
    'rainbond_manage_component_probe',
    'rainbond_manage_component_autoscaler',
    'rainbond_horizontal_scale_component',
    'rainbond_vertical_scale_component',
    'rainbond_change_component_image',
    'rainbond_update_component_build_source',
  ];
  for (const toolName of componentTools) {
    const context = {
      teamName: 'demo', regionName: 'test', appId: '8', componentAlias: 'api',
    };
    assert.strictEqual(
      resolvePreActionRoute({ toolName, context }),
      '',
      `${toolName} should not navigate while waiting for approval`
    );
    for (const isThirdParty of [false, true]) {
      const route = resolvePostActionRoute({
        toolName,
        context,
        appDetail: { is_third: isThirdParty },
        resultRef: {
          kind: 'service', team_name: 'demo', region_name: 'test',
          app_id: '9', service_alias: 'target', operation: 'replace_build_envs',
        },
      });
      const [pathname, query] = route.split('?');
      const params = new URLSearchParams(query);
      assert.strictEqual(pathname, '/team/demo/region/test/apps/9/overview');
      assert.strictEqual(params.get('componentID'), 'target');
      assert.strictEqual(params.get('tab'), 'overview', `${toolName} should open component home`);
      assert.strictEqual(params.has('subTab'), false);
      assert.ok(params.get('refresh'), 'component home should reload the latest state');
    }
  }

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

  assert.strictEqual(
    isKubernetesMutationTool('rainbond_kube_patch_resource'),
    true,
    'kubernetes tools should be identified by their rainbond_kube_ prefix'
  );
  assert.strictEqual(
    isSupportedAgentMutationTool('rainbond_kube_patch_resource'),
    false,
    'kubernetes approval tools should not be treated as navigable Rainbond mutations'
  );
  assert.strictEqual(
    resolvePreActionRoute({
      toolName: 'rainbond_kube_patch_resource',
      context: {
        teamName: 'demo',
        regionName: 'test',
        appId: '8',
        componentAlias: 'api',
      },
      targetRef: {
        cluster: 'rainbond',
        namespace: 'rbd-plugins',
        kind: 'Deployment',
        name: 'rainbond-agent-api',
      },
    }),
    '',
    'kubernetes approvals should not navigate before approval'
  );
  assert.strictEqual(
    resolvePostActionRoute({
      toolName: 'rainbond_kube_patch_resource',
      context: {
        teamName: 'demo',
        regionName: 'test',
        appId: '8',
        componentAlias: 'api',
      },
      result: {
        result_ref: {
          cluster: 'rainbond',
          namespace: 'rbd-plugins',
          kind: 'Deployment',
          name: 'rainbond-agent-api',
          operation: 'patch',
        },
      },
    }),
    '',
    'kubernetes approvals should not navigate after approval'
  );
  assert.strictEqual(
    shouldHandleApprovedMutationTrace({
      toolName: 'rainbond_kube_patch_resource',
      pendingMutationTool: 'rainbond_kube_patch_resource',
    }),
    false,
    'approved kubernetes traces should only render approval cards and skip navigation'
  );
}

if (typeof test === 'function') {
  test('component mutation routes include refresh keys for topology remounts', runTests);
} else {
  runTests();
  console.log('agent mutation route map tests passed');
}
