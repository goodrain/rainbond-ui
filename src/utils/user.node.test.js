const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const userSourcePath = path.join(__dirname, 'user.js');
const source = fs
  .readFileSync(userSourcePath, 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace(/export default userUtil;/, 'module.exports = userUtil;');
const sandbox = {
  module: { exports: {} },
  exports: {},
};

vm.runInNewContext(source, sandbox, { filename: userSourcePath });

const userUtil = sandbox.module.exports;

assert.strictEqual(
  userUtil.isCompanyAdmin({ is_enterprise_admin: true, roles: ['user'] }),
  true,
  'a later-created enterprise administrator should be recognized'
);
assert.strictEqual(
  userUtil.isCompanyAdmin({ is_enterprise_admin: true, roles: ['admin'] }),
  true,
  'the initial enterprise administrator should remain recognized'
);
assert.strictEqual(
  userUtil.isCompanyAdmin({ is_enterprise_admin: false, roles: ['user'] }),
  false,
  'an ordinary user should not be recognized as an enterprise administrator'
);
assert.strictEqual(
  userUtil.isCompanyAdmin(null),
  false,
  'missing user information should not be recognized as an enterprise administrator'
);
assert.strictEqual(
  userUtil.isCompanyAdmin({ roles: ['admin'] }),
  false,
  'a legacy admin role alone should not grant enterprise administrator access'
);

console.log('user administrator checks passed');
