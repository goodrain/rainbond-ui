const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const helpers = import(`data:text/javascript;base64,${fs.readFileSync(path.join(__dirname, 'buildSourceDirectory.js')).toString('base64')}`);

test('existing Git directory survives editing for HTTPS and both SSH formats', async () => {
  const { splitBuildSourceUrl, joinBuildSourceUrl } = await helpers;
  for (const url of ['https://example.com/team/repo.git', 'git@example.com:team/repo.git', 'ssh://git@example.com/team/repo.git']) {
    const parsed = splitBuildSourceUrl(`${url}?dir=services/api`);
    assert.deepEqual(parsed, { url, directory: 'services/api' });
    assert.equal(joinBuildSourceUrl(parsed.url, parsed.directory), `${url}?dir=services/api`);
    assert.equal(joinBuildSourceUrl('https://example.com/new.git', parsed.directory), 'https://example.com/new.git?dir=services/api');
  }
});

test('explicit clearing removes the old directory instead of restoring it', async () => {
  const { joinBuildSourceUrl } = await helpers;
  for (const root of ['', ' ', '.', './']) {
    assert.equal(joinBuildSourceUrl('git@example.com:repo.git?dir=old', root), 'git@example.com:repo.git');
  }
  assert.equal(joinBuildSourceUrl('git@example.com:repo.git?dir=old', './services/api/'), 'git@example.com:repo.git?dir=services/api');
});

test('accepts relative nested and Unicode directories and rejects traversal and protocol delimiters', async () => {
  const { isValidBuildDirectory, normalizeBuildDirectory } = await helpers;
  for (const dir of ['', '.', './services/api/', '中文/子 目录']) assert.equal(isValidBuildDirectory(dir), true, dir);
  for (const dir of ['/root', '../a', 'a/../b', 'C:/foo', 'a\\b', 'a?x', 'a#x', 'a&x', 'a\nx']) assert.equal(isValidBuildDirectory(dir), false, dir);
  assert.equal(normalizeBuildDirectory(' ./services/api/ '), 'services/api');
});

test('does not append directory to unsupported query or fragment URLs', async () => {
  const { canUseBuildDirectory, joinBuildSourceUrl } = await helpers;
  for (const url of ['https://example.com/r.git?other=value', 'https://example.com/r.git#fragment']) {
    assert.equal(canUseBuildDirectory(url, 'api'), false);
    assert.equal(canUseBuildDirectory(url, ''), true);
    assert.equal(joinBuildSourceUrl(url, ''), url);
  }
});
