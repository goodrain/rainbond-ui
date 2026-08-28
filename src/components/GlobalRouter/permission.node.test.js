const assert = require('assert');

const { isSourceRoute } = require('./permission');

assert.strictEqual(
  isSourceRoute('/enterprise/eid/region/rainbond/platform-resources'),
  false,
  'platform resource routes should not require source-route permissions'
);
assert.strictEqual(
  isSourceRoute('/team/team/region/rainbond/resources'),
  false,
  'resource route names should not be treated as source path segments'
);

assert.strictEqual(isSourceRoute('/team/team/region/rainbond/source'), true);
assert.strictEqual(isSourceRoute('/team/team/region/rainbond/source/git'), true);
assert.strictEqual(isSourceRoute('/team/team/region/rainbond/source?type=git'), true);
assert.strictEqual(isSourceRoute('/team/team/region/rainbond/source-control'), false);
assert.strictEqual(isSourceRoute(), false);

console.log('global router permission tests passed');
