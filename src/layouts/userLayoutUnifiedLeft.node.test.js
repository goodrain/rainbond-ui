const assert = require('assert');
const fs = require('fs');
const path = require('path');

const userLayout = fs.readFileSync(path.join(__dirname, 'UserLayout.js'), 'utf8');
const loginPage = fs.readFileSync(path.join(__dirname, '../pages/User/Login.js'), 'utf8');

assert.ok(
  !userLayout.includes('styles.saasLeft'),
  'SaaS should no longer render a separate left-side content block'
);
assert.strictEqual(
  (userLayout.match(/styles\.normalLeft}/g) || []).length,
  1,
  'both modes should share one open-source left-side content block'
);
assert.ok(
  userLayout.includes('styles.saasRight') && userLayout.includes('styles.normalRight'),
  'SaaS and open-source right-side content should remain separate'
);
assert.ok(
  loginPage.includes('<LoginComponent') &&
    loginPage.includes('onSmsSubmit={this.handleSmsSubmit}') &&
    loginPage.includes('enableSmsLogin={isSaas}'),
  'the unified login form should keep SMS login restricted to SaaS mode'
);

console.log('unified login left-side layout tests passed');
