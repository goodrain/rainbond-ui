const assert = require('assert');

const {
  buildFinalComponentOverviewNavigationPayload,
  buildComponentMutationTrackingPatchFromResult,
  shouldSkipComponentMutationPreNavigation,
  shouldFinalizeToComponentOverview,
} = require('./agentComponentMutationFinalizer');

function runTests() {
  assert.strictEqual(
    shouldSkipComponentMutationPreNavigation('rainbond_manage_component_envs'),
    true,
    'component mutations should skip approval-time navigation'
  );

  assert.strictEqual(
    shouldFinalizeToComponentOverview('rainbond_update_component_build_source'),
    true,
    'build source updates should finalize back to component overview'
  );

  const payload = buildFinalComponentOverviewNavigationPayload({
    lastComponentMutationTool: 'rainbond_update_component_build_source',
    lastComponentMutationTeamName: 'demo',
    lastComponentMutationRegionName: 'test',
    lastComponentMutationAppId: '8',
    lastComponentMutationAlias: 'api',
  });

  assert.ok(payload, 'build source updates should produce a final navigation payload');
  assert.match(
    payload.pendingMutationRoute,
    /^\/team\/demo\/region\/test\/apps\/8\/overview\?/,
    'final route should target the app overview page'
  );
  assert.ok(
    payload.pendingMutationRoute.includes('componentID=api'),
    'final route should target the changed component'
  );
  assert.ok(
    payload.pendingMutationRoute.includes('tab=overview'),
    'final route should open component overview'
  );

  const storagePatch = buildComponentMutationTrackingPatchFromResult(
    {
      lastComponentMutationTool: 'rainbond_manage_component_storage',
      lastComponentMutationTeamName: 'demo',
      lastComponentMutationRegionName: 'test',
      lastComponentMutationAppId: '8',
      lastComponentMutationAlias: '',
    },
    {
      toolName: 'rainbond_manage_component_storage',
      targetRef: {
        kind: 'service',
        service_id: 'svc-api',
        service_alias: 'api',
      },
    }
  );

  const storagePayload = buildFinalComponentOverviewNavigationPayload({
    lastComponentMutationTool: 'rainbond_manage_component_storage',
    lastComponentMutationTeamName: storagePatch.lastComponentMutationTeamName,
    lastComponentMutationRegionName: storagePatch.lastComponentMutationRegionName,
    lastComponentMutationAppId: storagePatch.lastComponentMutationAppId,
    lastComponentMutationAlias: storagePatch.lastComponentMutationAlias,
  });

  assert.ok(
    storagePayload,
    'storage result refs should repair missing aliases before final navigation'
  );
  assert.ok(
    storagePayload.pendingMutationRoute.includes('componentID=api'),
    'storage final route should target the repaired component alias'
  );
}

if (typeof test === 'function') {
  test('build source updates finalize back to component overview', runTests);
} else {
  runTests();
  console.log('agent component mutation finalizer tests passed');
}
