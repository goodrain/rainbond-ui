const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /const \{ isBuildEnvTruthy \} = require\('\.\.\/buildEnvHelpers'\);/,
  'NodeJSCNBConfig should import the shared build env truthy helper'
);

assert.match(
  source,
  /getFieldDecorator\('BUILD_NO_CACHE',\s*\{\s*valuePropName:\s*'checked',\s*initialValue:\s*isBuildEnvTruthy\(envs\.BUILD_NO_CACHE\)/s,
  'NodeJSCNBConfig should normalize BUILD_NO_CACHE with isBuildEnvTruthy'
);
