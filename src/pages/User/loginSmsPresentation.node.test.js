const assert = require('assert');
const fs = require('fs');
const path = require('path');

const loginHeader = fs.readFileSync(path.join(__dirname, 'loginHeader.js'), 'utf8');
const loginComponent = fs.readFileSync(path.join(__dirname, 'loginComponent.js'), 'utf8');
const loginSmsComponent = fs.readFileSync(path.join(__dirname, 'loginSmsComponent.js'), 'utf8');
const userLayout = fs.readFileSync(path.join(__dirname, '../../layouts/UserLayout.js'), 'utf8');

assert.ok(
  loginHeader.includes('login.loginComponent.title') &&
    loginHeader.includes('login.loginComponent.subtitle'),
  'the shared login header should render the open-source title and welcome copy'
);
assert.ok(
  loginComponent.includes('<LoginHeader />') &&
    loginSmsComponent.includes('<LoginHeader />'),
  'account and SMS login should share the same header presentation'
);
assert.ok(
  loginSmsComponent.includes('login.loginSmsComponent.phone.label'),
  'SMS login should retain the visible phone-number field label'
);
assert.ok(
  !userLayout.includes('<h2>{loginTitle') &&
    !userLayout.includes('layout.userLayout.saas.welcomeText'),
  'the SaaS layout should not render a second heading above the SMS login form'
);

console.log('SMS login presentation tests passed');
