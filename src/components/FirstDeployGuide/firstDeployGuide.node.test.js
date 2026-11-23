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
const exampleImagePresetSource = fs.readFileSync(path.join(sourceRoot, 'components/CreateComponentModal/exampleImagePreset.js'), 'utf8');
const posthogSource = fs.readFileSync(path.join(sourceRoot, 'posthog.js'), 'utf8');
const marketModelSource = fs.readFileSync(path.join(sourceRoot, 'models/market.js'), 'utf8');
const marketFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__/market-app-list.response.json'), 'utf8'));
const marketAppsSource = fs.readFileSync(path.join(__dirname, 'marketApps.js'), 'utf8');
const teamLessSource = fs.readFileSync(path.join(sourceRoot, 'pages/TeamDashboard/TeamBasicInfo/index.less'), 'utf8');
const readGuideLocale = locale => {
  const localeSource = fs.readFileSync(path.join(sourceRoot, 'locales', locale, 'team.js'), 'utf8');
  const messages = {};
  localeSource.replace(/'(firstDeployGuide\.[^']+)':\s*'([^']*)'/g, (_, key, value) => {
    messages[key] = value;
    return _;
  });
  return messages;
};
const marketHelpers = new Function(`${marketAppsSource.replace(/export /g, '')}\nreturn { getFeaturedMarketSearchName, resolveFeaturedMarketApp };`)();
const exampleImagePreset = new Function(`${exampleImagePresetSource.replace(/export /g, '')}\nreturn { shouldUseExampleImagePreset };`)();

test('first-deploy guide exposes the approved entry points and telemetry fields', () => {
  assert.match(guideSource, /captureFirstDeployGuide\('viewed'/);
  assert.match(guideSource, /captureFirstDeployGuide\('clicked'/);
  assert.match(guideSource, /guide_location/);
  assert.match(guideSource, /entry/);
  assert.match(guideSource, /market_available/);
  assert.match(guideSource, /handleEntry\('example_image'\)/);
  assert.match(guideSource, /handleEntry\('market_featured'/);
  assert.match(guideSource, /featured_app/);
  assert.doesNotMatch(
    `${guideSource}\n${teamSource}`,
    /market_all|source_code|image: 'image'/,
    'entries that live in the create modal should not come back to the team page'
  );
  assert.doesNotMatch(guideSource, /market_app_key/);
  assert.match(guideSource, /featuredMarketApps/);
});

test('starter cards expose stable controls without announcing decorative icons', () => {
  assert.match(guideSource, /className=\{cardStyles\.starterCards\} data-testid="rbd-first-deploy-guide"/);
  assert.match(guideSource, /data-testid=\{`rbd-starter-card-\$\{key\}`\}/);
  assert.match(guideSource, /key: 'example',/);
  assert.match(guideSource, /actionTestId: 'rbd-starter-deploy-example'/);
  assert.match(guideSource, /actionTestId: `rbd-starter-install-\$\{app\.key\}`/);
  assert.match(guideSource, /data-testid=\{actionTestId\}/);
  const icons = guideSource.match(/<Icon [^>]*>/g) || [];
  assert.ok(icons.length > 0);
  icons.forEach(icon => assert.match(icon, /aria-hidden="true"/));
  assert.match(guideSource, /<img src=\{src\} alt="" onError=\{this\.handleError\} \/>/);
  assert.match(guideSource, /app\.marketApp\.logo \|\| app\.marketApp\.icon/);
});

test('only the example card is recommended and carries the primary action', () => {
  assert.equal((guideSource.match(/recommended: true/g) || []).length, 1);
  assert.match(guideSource, /key: 'example',\s*recommended: true/);
  assert.match(guideSource, /type=\{recommended \? 'primary' : 'default'\}/);
  assert.doesNotMatch(guideSource, /type="primary"/);
  assert.match(
    guideSource,
    /if \(!canCreate\) \{\s*return null;\s*\}/,
    'users without create permission should not get any starter card'
  );
});

test('starter cards live inside the normal application grid', () => {
  assert.match(teamSource, /<div className=\{styles\.appListHeaderTop\}>/);
  assert.doesNotMatch(
    teamSource,
    /showEmptyTeamGuide\s*(&&|\?)\s*[(<]|!showEmptyTeamGuide/,
    'the guide should no longer replace or hide parts of the team page'
  );
  assert.match(teamSource, /this\.renderCardView\(showEmptyTeamGuide\)/);
  assert.match(
    teamSource,
    /this\.renderCreateAppCard\(\)\s*\)\}[\s\S]{0,120}?\{showStarterCards && \(\s*<FirstDeployGuide[\s\S]*?cardStyles=\{styles\}/,
    'starter cards should follow the create-application card and reuse the grid card styles'
  );
  assert.match(teamSource, /Array\.from\(\{ length: 11 - starterCardCount \}\)/);
  assert.match(teamLessSource, /\.starterCards\s*\{\s*display:\s*contents;/);
  assert.match(teamLessSource, /\.starterCard\s*\{\s*border-style:\s*dashed;/);
  assert.match(teamLessSource, /&\.starterCardRecommended\s*\{\s*border-style:\s*solid;\s*border-color:\s*@primary-color;/);
  assert.ok(!fs.existsSync(path.join(__dirname, 'index.less')), 'the standalone guide panel styles should stay removed');
});

test('starter card copy stays in sync across locales and promises no duration', () => {
  const zh = readGuideLocale('zh-CN');
  const en = readGuideLocale('en-US');
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  const usedKeys = `${guideSource}\n${teamSource}`.match(/firstDeployGuide\.[A-Za-z.]+/g) || [];
  assert.deepEqual(Array.from(new Set(usedKeys)).sort(), Object.keys(zh).sort());
  assert.equal(zh['firstDeployGuide.example.action'], '一键部署');
  assert.equal(zh['firstDeployGuide.market.install'], '安装');
  Object.values(zh).concat(Object.values(en)).forEach(message => {
    assert.doesNotMatch(message, /分钟|秒|minute|second/i);
  });
});

test('featured market applications search by name and resolve only matching stable keys', () => {
  assert.match(guideSource, /7f0d0509699e4425964c71be4b0fa428/);
  assert.match(guideSource, /6953c50771ae4548b9fed312d220d720/);
  assert.match(guideSource, /d6c01070c6b049dbaf3de6757a1b63ef/);
  assert.match(guideSource, /orderedApps\.map/);
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
  assert.equal(exampleImagePreset.shouldUseExampleImagePreset('example-image', true), true);
  assert.equal(exampleImagePreset.shouldUseExampleImagePreset('example-image', false), false);
  assert.equal(exampleImagePreset.shouldUseExampleImagePreset('image', true), false);
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
