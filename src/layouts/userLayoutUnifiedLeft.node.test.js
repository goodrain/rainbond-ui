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
  2,
  'both original layout branches should render the open-source left-side content'
);
assert.ok(
  userLayout.includes('styles.saasRight') && userLayout.includes('styles.normalRight'),
  'SaaS and open-source right-side content should remain separate'
);
assert.ok(
  userLayout.includes('{isSaas ? (') &&
    userLayout.includes('<div className={styles.saasContainer}>') &&
    userLayout.includes('<div className={styles.normalContainer}>'),
  'the original SaaS/non-SaaS layout branch should remain intact'
);
assert.ok(
  loginPage.includes("import LoginSmsComponent") && loginPage.includes('{isSaas ? ('),
  'the right-side login form should preserve the original SaaS/non-SaaS switch'
);
console.log('unified login left-side layout tests passed');
