const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseConsulting.js'), 'utf8');

test('enterprise overview consultation link uses the shared form with source and entry parameters', () => {
  assert.match(source, /https:\/\/rainbond\.feishu\.cn\/share\/base\/shrcn4dG9z5zvbZZWd1MFf6ILBg/);
  assert.match(source, /from=console/);
  assert.match(source, /entry=console_enterprise_overview/);
});
