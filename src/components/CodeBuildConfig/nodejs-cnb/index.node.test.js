const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /const \{ hasNodePackageManagerPrefix, isBuildEnvTruthy \} = require\('\.\.\/buildEnvHelpers'\);/,
  'NodeJSCNBConfig should import shared build env helpers'
);

assert.match(
  source,
  /getFieldDecorator\('BUILD_NO_CACHE',\s*\{\s*valuePropName:\s*'checked',\s*initialValue:\s*isBuildEnvTruthy\(envs\.BUILD_NO_CACHE\)/s,
  'NodeJSCNBConfig should normalize BUILD_NO_CACHE with isBuildEnvTruthy'
);

assert.match(
  source,
  /getFieldDecorator\('CNB_BUILD_SCRIPT',\s*\{\s*initialValue: buildScript,\s*rules: \[\{ validator: this\.validateNodeScriptName \}\]/s,
  'NodeJSCNBConfig should validate CNB_BUILD_SCRIPT as a script name'
);

assert.match(
  source,
  /getFieldDecorator\('CNB_START_SCRIPT',\s*\{\s*initialValue: startCommand,\s*rules: \[\{ validator: this\.validateNodeScriptName \}\]/s,
  'NodeJSCNBConfig should validate CNB_START_SCRIPT as a script name'
);
