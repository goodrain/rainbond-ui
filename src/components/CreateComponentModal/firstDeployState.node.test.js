const assert = require('assert');
const fs = require('fs');
const path = require('path');

const modalSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const imageFormSource = fs.readFileSync(
  path.join(__dirname, '../ImageNameForm/index.js'),
  'utf8'
);
const codeFormSource = fs.readFileSync(
  path.join(__dirname, '../CodeCustomForm/index.js'),
  'utf8'
);
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

assert.match(
  imageFormSource,
  /const isDemoLocked = autoUseDemo && showImageDemo;/,
  'the image form should lock demo content only during the platform first-deploy flow'
);

assert.match(
  imageFormSource,
  /<Switch checked=\{showImageDemo\} onChange=\{this\.handleToggleImageDemo\} \/>/,
  'the image form should provide a switch for opting out of the locked demo'
);

assert.match(
  codeFormSource,
  /const isDemoLocked = autoUseDemo && showDemoSelect;/,
  'the source form should lock demo content only during the platform first-deploy flow'
);

assert.match(
  codeFormSource,
  /<Switch checked=\{showDemoSelect\} onChange=\{this\.handleToggleDemoSelect\} \/>/,
  'the source form should provide a switch for opting out of the locked demo'
);

assert.match(
  codeFormSource,
  /!group_id && !isDemoLocked/,
  'the source form should hide custom advanced settings while the first-deploy demo is locked'
);

assert.doesNotMatch(
  `${imageFormSource}\n${codeFormSource}`,
  /autoUseDemo && !form\.isFieldsTouched\(\)/,
  'the platform first-deploy demo should take precedence even if the async platform state arrives after the form is touched'
);

console.log('platform first deploy state tests passed');
