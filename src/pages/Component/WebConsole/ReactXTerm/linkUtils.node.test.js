const assert = require('assert');
const fs = require('fs');
const path = require('path');
const babel = require('@umijs/deps/compiled/babel/core');

const filename = path.join(__dirname, 'linkUtils.js');
const transformed = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename,
  babelrc: false,
  configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }]
  ]
}).code;
const moduleRef = { exports: {} };
new Function('module', 'exports', transformed)(moduleRef, moduleRef.exports);

const { normalizeTerminalLink, getSafeTerminalLink } = moduleRef.exports;

assert.strictEqual(
  normalizeTerminalLink('http://service.default.svc.cluster.local:8000;/'),
  'http://service.default.svc.cluster.local:8000/'
);
assert.strictEqual(
  normalizeTerminalLink('https://example.com:8443;/path?q=1'),
  'https://example.com:8443/path?q=1'
);
assert.strictEqual(
  normalizeTerminalLink('https://example.com/path;value'),
  'https://example.com/path;value',
  'valid semicolons outside the port boundary should remain unchanged'
);
assert.strictEqual(normalizeTerminalLink(null), '');
assert.strictEqual(
  getSafeTerminalLink('http://service:8000;/', 'https://console.example.com/'),
  'http://service:8000/'
);
assert.strictEqual(
  getSafeTerminalLink('javascript:alert(1)', 'https://console.example.com/'),
  '',
  'terminal links should only allow HTTP and HTTPS protocols'
);
assert.strictEqual(getSafeTerminalLink('http://[invalid', 'https://console.example.com/'), '');

const componentSource = fs.readFileSync(path.join(__dirname, 'react-xterm.js'), 'utf8');
assert.match(
  componentSource,
  /new WebLinksAddon\(openTerminalLink\)/,
  'the terminal should use the validated custom link handler'
);

console.log('web console link normalization tests passed');
