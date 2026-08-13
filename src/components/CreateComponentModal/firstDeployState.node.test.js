const assert = require('assert');
const fs = require('fs');
const path = require('path');

const modalSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const teamSource = fs.readFileSync(
  path.join(__dirname, '../../pages/TeamDashboard/TeamBasicInfo/index.js'),
  'utf8'
);

assert.match(
  modalSource,
  /firstAppDeployed === false/,
  'the create modal should enable deployment examples only for an explicit platform false state'
);

assert.match(
  modalSource,
  /type: 'global\/fetchRainbondInfo'/,
  'the create modal should refresh platform state whenever it opens'
);

assert.match(
  modalSource,
  /callback: info => setFirstAppDeployed\(info\.first_app_deployed\)/,
  'the create modal should wait for the refreshed platform field before enabling examples'
);

assert.match(
  modalSource,
  /autoUseDemo=\{shouldUseDefaultDemo && !isComponentView\}/,
  'platform first-deploy examples should remain disabled when adding a component to an existing app'
);

assert.doesNotMatch(
  teamSource,
  /isFirstDeploy|defaultUseDemo/,
  'the team view should not infer platform first deployment from its own application count'
);

console.log('platform first deploy state tests passed');
