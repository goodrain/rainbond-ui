const assert = require('assert');
const fs = require('fs');
const path = require('path');

const loginPage = fs.readFileSync(path.join(__dirname, 'Login.js'), 'utf8');
const loginComponent = fs.readFileSync(path.join(__dirname, 'loginComponent.js'), 'utf8');

assert.ok(
  !loginPage.includes("import LoginSmsComponent"),
  'the login page should not switch to a separate SMS page component'
);
assert.strictEqual(
  (loginPage.match(/<LoginComponent/g) || []).length,
  1,
  'the login page should render one shared login component'
);
assert.ok(
  loginPage.includes('enableSmsLogin={isSaas}'),
  'SaaS should enable SMS as a method inside the shared page'
);
assert.ok(
  loginComponent.includes('login.loginComponent.tab.account') &&
    loginComponent.includes('login.loginComponent.tab.mobile') &&
    loginComponent.includes("key='account'") &&
    loginComponent.includes("key='mobile'"),
  'the shared login component should expose account and mobile methods as tabs'
);
assert.ok(
  loginComponent.includes('onSmsSubmit'),
  'the shared component should preserve the SMS login submission path'
);

console.log('unified login page behavior tests passed');
