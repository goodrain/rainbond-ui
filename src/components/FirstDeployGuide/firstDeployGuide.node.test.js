const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../..');
const guideSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const sourceRoot = path.join(root, 'src');
const teamSource = fs.readFileSync(path.join(sourceRoot, 'pages/TeamDashboard/TeamBasicInfo/index.js'), 'utf8');
const groupSource = fs.readFileSync(path.join(sourceRoot, 'pages/Group/Group.js'), 'utf8');
const modalSource = fs.readFileSync(path.join(sourceRoot, 'components/CreateComponentModal/index.js'), 'utf8');
const imageFormSource = fs.readFileSync(path.join(sourceRoot, 'components/ImageNameForm/index.js'), 'utf8');
const posthogSource = fs.readFileSync(path.join(sourceRoot, 'posthog.js'), 'utf8');

test('first-deploy guide exposes the approved entry points and telemetry fields', () => {
  assert.match(guideSource, /captureFirstDeployGuide\('viewed'/);
  assert.match(guideSource, /captureFirstDeployGuide\('clicked'/);
  assert.match(guideSource, /guide_location/);
  assert.match(guideSource, /entry/);
  assert.match(guideSource, /market_available/);
  assert.match(guideSource, /example_image/);
  assert.match(guideSource, /source_code/);
});

test('team and empty-application pages render the guide only after their empty data loads', () => {
  assert.match(teamSource, /appListTotal === 0/);
  assert.match(teamSource, /<FirstDeployGuide/);
  assert.match(teamSource, /market\/fetchMarkets/);
  assert.match(groupSource, /topologyLoaded/);
  assert.match(groupSource, /jsonDataLength === 0/);
  assert.match(groupSource, /<FirstDeployGuide/);
  assert.match(groupSource, /market\/fetchMarkets/);
});

test('the example image and direct creation routes preserve a confirmed user action', () => {
  assert.match(modalSource, /case 'example-image'/);
  assert.match(modalSource, /setCurrentFormType\('docker'\)/);
  assert.match(imageFormSource, /goodrain\/nginx:1\.26/);
  assert.match(groupSource, /image\/custom\?group_id=/);
  assert.match(groupSource, /market\?group_id=/);
});

test('PostHog provides a dedicated guide capture helper', () => {
  assert.match(posthogSource, /export function captureFirstDeployGuide/);
  assert.match(posthogSource, /first_deploy_guide_/);
});
