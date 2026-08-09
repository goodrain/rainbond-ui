const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  canReuseGroupDetail,
  canUpdateComponent,
  shouldLoadStorageUsage
} = require('../../components/SlidePanel/components/componentViewPerformance');

const uiRoot = path.resolve(__dirname, '..', '..');
const slidePanelSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'SlidePanel', 'index.js'),
  'utf8'
);
const componentMainSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'SlidePanel', 'components', 'components.js'),
  'utf8'
);
const overviewSource = fs.readFileSync(
  path.join(__dirname, 'overview.js'),
  'utf8'
);
const groupOverviewSource = fs.readFileSync(
  path.join(uiRoot, 'pages', 'Group', 'Overview.js'),
  'utf8'
);
const appHeaderSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'SlidePanel', 'components', 'app.js'),
  'utf8'
);

assert.strictEqual(
  canReuseGroupDetail({ ID: 5, group_name: 'demo' }, '5'),
  true,
  'application detail loaded by TeamLayout should be reusable in the component drawer'
);
assert.strictEqual(
  canReuseGroupDetail({ ID: 6, group_name: 'other' }, '5'),
  false,
  'a component drawer must not reuse detail from another application'
);
assert.strictEqual(
  canReuseGroupDetail({ group_id: '5', group_name: 'demo' }, 5),
  true,
  'group_id should match across numeric and string route representations'
);
assert.strictEqual(
  canReuseGroupDetail({ app_id: 5, group_name: 'demo' }, '5'),
  true,
  'legacy app_id detail responses should also be reusable'
);
assert.strictEqual(
  canReuseGroupDetail({}, '5'),
  false,
  'an empty Redux value must not suppress the application detail request'
);

assert.strictEqual(
  shouldLoadStorageUsage([{ name: 'rainbond-bill-ARM64' }]),
  true,
  'billing storage usage should support architecture-suffixed plugin ids'
);
assert.strictEqual(
  shouldLoadStorageUsage([{ name: 'rainbond-observability' }]),
  false,
  'storage usage should not be queried when billing is not installed'
);

assert.strictEqual(canUpdateComponent(true, { status: 'running' }), true);
assert.strictEqual(canUpdateComponent(true, { status: 'closed' }), false);
assert.strictEqual(canUpdateComponent(false, { status: 'running' }), false);

assert.ok(
  !/queryComponentDeatil|fetchPipePipeline|teamControl\/fetchPluginUrl/.test(
    slidePanelSource
  ),
  'SlidePanel should not duplicate component detail or official plugin requests owned by its children and TeamLayout'
);
assert.ok(
  /isVisible\s*&&\s*type\s*===\s*'components'/.test(slidePanelSource) &&
    /isVisible\s*&&\s*type\s*===\s*'gateway'/.test(slidePanelSource),
  'hidden drawers must unmount their request-owning children even if route state is briefly stale'
);

assert.ok(
  /cachedGroupDetail:\s*application\.groupDetail/.test(componentMainSource),
  'the component drawer should receive application detail already loaded by TeamLayout'
);
assert.ok(
  /canReuseGroupDetail\(cachedGroupDetail, requestedGroupId\)[\s\S]*?groupDetail:\s*cachedGroupDetail[\s\S]*?return;/.test(
    componentMainSource
  ),
  'matching Redux application detail should bypass a second groups/:id request'
);

const componentMountStart = componentMainSource.indexOf('componentDidMount()');
const componentUpdateStart = componentMainSource.indexOf(
  'componentDidUpdate(prevProps)',
  componentMountStart
);
const componentMountSource = componentMainSource.slice(
  componentMountStart,
  componentUpdateStart
);
assert.ok(
  !/setTimeout|this\.getStatus/.test(componentMountSource),
  'mounting the component drawer should not create a second status polling chain'
);
assert.ok(
  /statusPollingGeneration[\s\S]*?pollingGeneration !== this\.statusPollingGeneration/.test(
    componentMainSource
  ) &&
    /resetStatusPolling[\s\S]*?clearTimeout\(this\.timer\)/.test(
      componentMainSource
    ),
  'switching components should invalidate old status callbacks and clear the old timer'
);

const permissionsStart = componentMainSource.indexOf('checkPermissions()');
const operationsStart = componentMainSource.indexOf(
  'renderOperations(operations)',
  permissionsStart
);
const permissionsSource = componentMainSource.slice(
  permissionsStart,
  operationsStart
);
assert.ok(permissionsStart >= 0 && operationsStart > permissionsStart);
assert.ok(
  !/this\.setState\(/.test(permissionsSource),
  'permission rendering must stay pure and must not trigger another render'
);

assert.ok(
  /loadStorageUsageIfNeeded\(this\.props\.pluginsList\)/.test(
    overviewSource
  ),
  'component overview should only query storage usage when billing is installed'
);
assert.ok(
  /componentDidUpdate\(prevProps\)[\s\S]*?prevProps\.pluginsList\s*!==\s*this\.props\.pluginsList[\s\S]*?loadStorageUsageIfNeeded/.test(
    overviewSource
  ) &&
    /if\s*\(this\.storageUsageRequested\s*\|\|\s*!shouldLoadStorageUsage\(pluginsList\)\)/.test(
      overviewSource
    ),
  'a billing plugin that arrives asynchronously should trigger storage loading at most once'
);
assert.ok(
  /componentDidMount\(\)[\s\S]*?loadStorageUsageIfNeeded\(this\.props\.pluginsList\)/.test(
    appHeaderSource
  ) &&
    /componentDidUpdate\(prevProps\)[\s\S]*?prevProps\.pluginsList\s*!==\s*this\.props\.pluginsList[\s\S]*?loadStorageUsageIfNeeded/.test(
      appHeaderSource
    ) &&
    /if\s*\(this\.storageUsageRequested\s*\|\|\s*!shouldLoadStorageUsage\(pluginsList\)\)/.test(
      appHeaderSource
    ),
  'the application header should load billing storage at most once, including when plugins arrive asynchronously'
);

assert.ok(
  /const Com = map\[currentActiveTab\]/.test(componentMainSource) &&
    /\{Com \? \(\s*<Com/.test(componentMainSource),
  'component tabs should continue to mount only the active tab'
);

assert.ok(
  /tableDataLoading\s*&&\s*!isVisible\s*&&\s*<AppShape/.test(
    groupOverviewSource
  ),
  'the topology iframe should unmount while the component or gateway drawer is open'
);

console.log('component view performance tests passed');
