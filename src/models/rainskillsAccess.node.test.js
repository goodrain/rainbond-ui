const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modelSource = fs.readFileSync(path.join(__dirname, 'rainskillsAccess.js'), 'utf8');
const serviceSource = fs.readFileSync(
  path.join(__dirname, '../services/rainskillsAccess.js'),
  'utf8'
);

test('RainSkills access uses its own DVA effect and console endpoint', () => {
  assert.match(modelSource, /namespace: 'rainskillsAccess'/);
  assert.match(modelSource, /yield call\(getRainskillsAccess\)/);
  assert.match(serviceSource, /\/console\/rainskills\/access/);
  assert.doesNotMatch(serviceSource, /\/console\/agent\/access/);
});

test('RainSkills access reports request failures to authorization pages', () => {
  assert.match(modelSource, /catch \(error\)/);
  assert.match(modelSource, /callback\(null, error\)/);
});
