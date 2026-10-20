const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
const platformModalSource = fs.readFileSync(
  path.join(__dirname, 'components/PlatformInfoModal.js'),
  'utf8'
);
const trendSource = fs.readFileSync(
  path.join(__dirname, 'components/ResourceTrend.js'),
  'utf8'
);
const layoutSource = fs.readFileSync(
  path.join(__dirname, '../../layouts/EnterpriseLayout.js'),
  'utf8'
);

['renderPlatformHeader', 'renderModals'].forEach(method => {
  const start = jsSource.indexOf(`  ${method}() {`);
  const declarations = jsSource.slice(start, start + 180);
  assert.ok(
    /const enterprise = this\.props\.enterprise \|\| \{\};/.test(declarations) &&
      /const rainbondInfo = this\.props\.rainbondInfo \|\| \{\};/.test(declarations),
    `${method} should handle null platform metadata during the initial asynchronous load`
  );
});

const extensionSource = fs.readFileSync(
  path.join(__dirname, '../Extension/pluginCapacity/pluginTable.js'),
  'utf8'
);
Array.from(new Set(extensionSource.match(/enterpriseStyles\.authModal\w*/g))).forEach(reference => {
  const className = reference.split('.')[1];
  assert.ok(lessSource.includes(`.${className}`), `shared extension style ${className} should exist`);
});

assert.ok(
  /new window\.ResizeObserver\(this\.resize\)/.test(trendSource) &&
    /resizeObserver\.observe\(this\.container\)/.test(trendSource) &&
    /resizeObserver\.disconnect\(\)/.test(trendSource) &&
    /window\.addEventListener\('resize', this\.resize\)/.test(trendSource) &&
    /if \(!this\.mounted\) return/.test(trendSource),
  'trend should resize for container and window changes and release its observer on unmount'
);

assert.ok(
  /overview \? \{ check_status: 'no' \}/.test(layoutSource) &&
    /if \(overview\) \{[\s\S]{0,180}this\.loadOverviewPlugins\(res\.list\);[\s\S]{0,30}return;/.test(layoutSource) &&
    /this\.isOverviewRoute\(previousLocation\) && !this\.isOverviewRoute\(location\)/.test(layoutSource),
  'homepage shell should skip all-region status/plugin fan-out and restore full menus on other routes'
);

assert.ok(
  /type: 'platformOverview\/fetchShell'/.test(jsSource) &&
    /type: 'platformOverview\/fetchRuntime'/.test(jsSource) &&
    /type: 'platformOverview\/fetchCluster'/.test(jsSource) &&
    /type: 'platformOverview\/fetchMetrics'/.test(jsSource),
  'the page should use the four independent overview requests'
);

assert.ok(
  /upgradeStatus: 'idle'/.test(jsSource) &&
    /upgradeStatus: 'loading'/.test(jsSource) &&
    /upgradeStatus: 'success'/.test(jsSource) &&
    /upgradeStatus: 'error'/.test(jsSource) &&
    /upgradeStatus === 'success' \?/.test(jsSource),
  'upgrade status must distinguish unknown, loading, success and error before showing latest'
);

assert.ok(
    /licenseStatus: 'idle'/.test(jsSource) &&
    /licenseStatus: 'loading'/.test(jsSource) &&
    /licenseStatus: 'success'/.test(jsSource) &&
    /classifyLicenseRequestError\(error\)/.test(jsSource) &&
    /classification\.status/.test(jsSource) &&
    /type: 'region\/uploadEnterpriseLicense'/.test(jsSource),
  'license loading and update state should be explicit'
);

assert.ok(
  /type="password"/.test(platformModalSource) &&
    /onUpdateLicense\(authorizationCode/.test(platformModalSource) &&
    /requestStatus === 'error'/.test(platformModalSource) &&
    /requestStatus === 'empty'/.test(platformModalSource) &&
    /requestStatus === 'invalid'/.test(platformModalSource) &&
    !/authz_code|onManageLicense/.test(platformModalSource),
  'license updates should happen in the modal without exposing the existing code'
);

assert.ok(
  /SNAPSHOT_REFRESH_INTERVAL = 30000/.test(jsSource) &&
    /METRICS_REFRESH_INTERVAL = 60000/.test(jsSource) &&
    /visibilitychange/.test(jsSource) &&
    !/setInterval\([^,]+,\s*5000\)/.test(jsSource),
  'refresh must be visibility-aware and must not restore the five-second alarm poll'
);

assert.ok(
  /const alerts = \(nodes && nodes\.alerts\) \|\| \[\]/.test(jsSource) &&
    /alerts\.length \? \(/.test(jsSource),
  'cluster alerts should only render when accurate node or disk alerts exist'
);

assert.ok(
  /overviewData\.sectionEnvelope\(snapshot, 'gateway'\)/.test(jsSource) &&
    /if \(gatewaySection\.status === 'empty'\) return null/.test(jsSource) &&
    /gatewaySection\.status === 'loading' \?[\s\S]{0,100}<Skeleton/.test(jsSource),
  'gateway module should only hide for an explicit empty status and show loading otherwise'
);

assert.ok(
  /apps\/\$\{item\.application_id\}\/gateway/.test(jsSource) &&
    !/jumpGatewayIssue[\s\S]{0,500}advancedSettings/.test(jsSource),
  'gateway issues should navigate to the existing application gateway route'
);

assert.ok(
  /overviewData\.nodeAlertTranslation\(alert\)/.test(jsSource) &&
    !/<small>\{alert\.message\}<\/small>/.test(jsSource),
  'node and disk alerts should be localized from structured fields'
);

const overviewModuleSource = fs.readFileSync(
  path.join(__dirname, 'components/OverviewModule.js'),
  'utf8'
);
assert.ok(
  /\{error \? \(/.test(overviewModuleSource) && !/error && !children/.test(overviewModuleSource),
  'refresh errors should remain visible while stale module children are rendered'
);

assert.ok(
  /presentation\.preview/.test(jsSource) && /pluginModalRegion/.test(jsSource) &&
    /overviewData\.pluginPresentation\(plugins\)\.ordered/.test(jsSource) &&
    /\.fullPluginList\s*\{[^}]*overflow-y:\s*auto;/.test(lessSource),
  'all installed plugins remain available in a complete dialog without scrolling the preview'
);

assert.ok(
  !/#fff|#[0-9a-fA-F]{6}|font-size:\s*[0-9]+px/.test(lessSource) &&
    /AUXILIARY_FONT_SIZE = parseFloat\(theme\['rbd-auxiliary-size'\]\)/.test(trendSource),
  'new overview styling should use Rainbond and Ant Design theme variables'
);

const boxShadows = Array.from(lessSource.matchAll(/box-shadow:\s*([^;]+);/g)).map(
  match => match[1].trim()
);
assert.ok(
  boxShadows.length > 0 &&
    boxShadows.every(value => /^@rbd-(?:min-)?card-shadow(?:-hover)?$/.test(value)),
  'overview box shadows should exclusively use the existing Rainbond shadow variables'
);

assert.ok(
  /@media \(max-width: 850px\)/.test(lessSource) &&
    /@media \(max-width: 620px\)/.test(lessSource),
  'the overview should include tablet and mobile layouts'
);

assert.ok(
  !/grid-(?:column|row):[^;]*\//.test(lessSource) &&
    /\.resourceCard \{[\s\S]*?grid-column-start: 1;\s*grid-column-end: -1;/.test(lessSource),
  'grid spans should use explicit boundaries so Less cannot evaluate slash shorthand as division'
);

console.log('enterprise platform overview tests passed');
