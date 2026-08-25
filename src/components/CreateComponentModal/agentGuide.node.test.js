const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const globalHeaderSource = fs.readFileSync(
  path.join(__dirname, '../GlobalHeader/index.js'),
  'utf8'
);
const zhLocaleSource = fs.readFileSync(
  path.join(__dirname, '../../locales/zh-CN/component.js'),
  'utf8'
);
const enLocaleSource = fs.readFileSync(
  path.join(__dirname, '../../locales/en-US/component.js'),
  'utf8'
);

test('create-component guide uses the shared Agent request', () => {
  assert.match(source, /type: 'agent\/requestOpen'/);
  assert.match(source, /source: 'create_component'/);
  assert.match(source, /handleClose\(\);/);
  assert.doesNotMatch(source, /getAgentAccess|fetchAgentLlmConfig/);
});

test('guide is restricted to the modal main view and Agent availability', () => {
  assert.match(source, /currentView === 'main'/);
  assert.match(source, /isRainbondInfoAgentEnabled\(rainbondInfo\) && !agentVisible/);
});

test('guide is rendered as a distinct AI creation card', () => {
  assert.match(source, /agentGuideTitle/);
  assert.match(source, /agentGuideDescription/);
  assert.match(source, /agentGuideAction/);
  assert.match(source, /type="right"/);
});

test('guide reuses the same Agent entry icon as the global header', () => {
  assert.match(source, /import AgentEntryIcon from '..\/AgentEntryIcon'/);
  assert.match(source, /<AgentEntryIcon \/>/);
  assert.match(globalHeaderSource, /import AgentEntryIcon from '..\/AgentEntryIcon'/);
  assert.match(globalHeaderSource, /<AgentEntryIcon \/>/);
});

test('AI action uses deployment wording in both locales', () => {
  assert.match(zhLocaleSource, /agent_guide\.action': '通过 AI 部署'/);
  assert.match(enLocaleSource, /agent_guide\.action': 'Deploy with AI'/);
});
