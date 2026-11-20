const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../..');
const guideSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const sourceRoot = path.join(root, 'src');
const teamSource = fs.readFileSync(path.join(sourceRoot, 'pages/TeamDashboard/TeamBasicInfo/index.js'), 'utf8');
const modalSource = fs.readFileSync(path.join(sourceRoot, 'components/CreateComponentModal/index.js'), 'utf8');
const imageFormSource = fs.readFileSync(path.join(sourceRoot, 'components/ImageNameForm/index.js'), 'utf8');
const posthogSource = fs.readFileSync(path.join(sourceRoot, 'posthog.js'), 'utf8');
const marketModelSource = fs.readFileSync(path.join(sourceRoot, 'models/market.js'), 'utf8');
const marketFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__/market-app-list.response.json'), 'utf8'));
const marketAppsSource = fs.readFileSync(path.join(__dirname, 'marketApps.js'), 'utf8');
const marketHelpers = new Function(`${marketAppsSource.replace(/export /g, '')}\nreturn { getFeaturedMarketSearchName, resolveFeaturedMarketApp };`)();

test('first-deploy guide exposes the approved entry points and telemetry fields', () => {
  assert.match(guideSource, /captureFirstDeployGuide\('viewed'/);
  assert.match(guideSource, /captureFirstDeployGuide\('clicked'/);
  assert.match(guideSource, /guide_location/);
  assert.match(guideSource, /entry/);
  assert.match(guideSource, /market_available/);
  assert.match(guideSource, /example_image/);
  assert.match(guideSource, /source_code/);
  assert.match(guideSource, /featured_app/);
  assert.doesNotMatch(guideSource, /market_app_key/);
  assert.match(guideSource, /featuredMarketApps/);
});

test('featured market applications search by name and resolve only matching stable keys', () => {
  assert.match(guideSource, /7f0d0509699e4425964c71be4b0fa428/);
  assert.match(guideSource, /6953c50771ae4548b9fed312d220d720/);
  assert.match(guideSource, /d6c01070c6b049dbaf3de6757a1b63ef/);
  assert.match(guideSource, /featuredApps\.map/);
  assert.match(guideSource, /market_app: app/);
  assert.match(teamSource, /featuredMarketApps/);
  assert.match(teamSource, /query: searchName/);
  assert.match(teamSource, /pageSize: 10/);
  assert.match(teamSource, /arch:/);
  assert.strictEqual(marketHelpers.getFeaturedMarketSearchName({ searchNames: { default: 'Mysql' } }, 'amd64'), 'Mysql');
  assert.strictEqual(marketHelpers.getFeaturedMarketSearchName({ searchNames: { arm64: 'Redis单机版ARM', default: 'Redis' } }, 'arm64'), 'Redis单机版ARM');
  const redis = marketHelpers.resolveFeaturedMarketApp({
    key: 'redis',
    modelKeys: { amd64: '6953c50771ae4548b9fed312d220d720', arm64: 'd6c01070c6b049dbaf3de6757a1b63ef' }
  }, marketFixture.list, 'arm64');
  assert.equal(redis.marketApp.app_name, 'Redis单机版ARM');
  assert.equal(marketHelpers.resolveFeaturedMarketApp({
    key: 'mysql', modelKeys: { default: '7f0d0509699e4425964c71be4b0fa428' }
  }, marketFixture.list, 'arm64'), null);
  assert.equal(marketHelpers.resolveFeaturedMarketApp({
    key: 'mysql', modelKeys: { default: '7f0d0509699e4425964c71be4b0fa428' }
  }, marketFixture.list, ''), null);
  assert.match(modalSource, /initialMarketApp/);
  assert.match(modalSource, /case 'marketInstall'/);
});

test('team guide requires a successful unfiltered empty list and defers market loading', () => {
  assert.match(teamSource, /appListLoaded: false/);
  assert.match(teamSource, /appListLoaded: true/);
  assert.match(teamSource, /normalizeAppListQuery/);
  assert.match(teamSource, /shouldShowFirstDeployGuide/);
  assert.match(teamSource, /this\.loadMarketAvailability\(\)/);
  assert.match(teamSource, /marketResolved: true/);
  assert.match(teamSource, /<FirstDeployGuide/);
  assert.match(marketModelSource, /\*fetchMarkets\(\{ payload, callback, onError \}/);
  assert.match(marketModelSource, /catch \(error\)/);
});

test('the example image is prefilled only for the guide entry', () => {
  assert.match(modalSource, /case 'example-image'/);
  assert.match(modalSource, /setCurrentFormType\('docker'\)/);
  assert.match(modalSource, /registry\.cn-hangzhou\.aliyuncs\.com\/goodrain\/nginx:1\.26/);
  assert.match(modalSource, /initialView === 'example-image'/);
  assert.match(imageFormSource, /goodrain\/nginx:alpine/);
});

test('PostHog provides a dedicated guide capture helper after market resolution', () => {
  assert.match(posthogSource, /export function captureFirstDeployGuide/);
  assert.match(posthogSource, /first_deploy_guide_/);
  assert.match(guideSource, /componentDidUpdate/);
  assert.match(guideSource, /marketResolved/);
  const captureSource = posthogSource.slice(
    posthogSource.indexOf('export function captureFirstDeployGuide'),
    posthogSource.indexOf('export function captureErrorViewed')
  ).replace('export function', 'function');
  let captured;
  const captureFirstDeployGuide = new Function('capturePostHogEvent', 'getCurrentRouteProperties', 'buildContextProperties', `${captureSource}\nreturn captureFirstDeployGuide;`)(
    (event, properties) => { captured = { event, properties }; },
    properties => properties,
    () => ({})
  );
  captureFirstDeployGuide('clicked', { featured_app: 'redis' });
  assert.equal(captured.properties.featured_app, 'redis');
});
