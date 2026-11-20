const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const documentTemplate = fs.readFileSync(path.join(__dirname, '../pages/document.ejs'), 'utf8');
const faviconScript = [...documentTemplate.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(script => script.includes('faviconurl'));
function boot(cachedFavicon) {
  const link = { href: '/static/dists/favicon.ico' }, appended = [];
  vm.runInNewContext(faviconScript, {
    window: { localStorage: { faviconurl: cachedFavicon } },
    document: { querySelector: () => link, createElement: () => ({}),
      getElementsByTagName: () => [{ appendChild: element => appended.push(element) }] }
  });
  return { link, appended };
}

test('a first visit retains the bundled icon instead of requesting /undefined', () => {
  const result = boot(undefined);
  assert.equal(result.link.href, '/static/dists/favicon.ico');
  assert.equal(result.appended.length, 0);
});
test('invalid cached branding values retain the bundled icon', () => {
  for (const value of ['', null, 'undefined', 'null']) {
    assert.equal(boot(value).link.href, '/static/dists/favicon.ico');
  }
});
test('configured favicon is still applied on a returning visit', () => {
  const result = boot('/media/platform-icon.ico');
  assert.equal(result.link.href, '/media/platform-icon.ico');
  assert.equal(result.link.rel, 'shortcut icon');
  assert.equal(result.appended.length, 1);
});
