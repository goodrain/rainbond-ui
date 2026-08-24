const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const slidePanelSource = fs.readFileSync(
  path.join(__dirname, '../../components/SlidePanel/components/components.js'),
  'utf8'
);
const sharedGuidePath = path.join(
  __dirname,
  '../../components/AgentAbnormalGuideModal/index.js'
);
const sharedGuideSource = fs.readFileSync(sharedGuidePath, 'utf8');
const zhLocaleSource = fs.readFileSync(
  path.join(__dirname, '../../locales/zh-CN/component.js'),
  'utf8'
);

test('abnormal component prompt has exactly the two required actions', () => {
  assert.match(source, /handleAgentTroubleshoot/);
  assert.match(source, /handleSuppressAgentGuide/);
  assert.match(source, /markComponentGuideHandled/);
  assert.match(source, /suppressAgentGuidesForLogin/);
  assert.match(sharedGuideSource, /closable=\{false\}/);
  assert.match(sharedGuideSource, /maskClosable=\{false\}/);
  assert.match(sharedGuideSource, /keyboard=\{false\}/);
});

test('the page delegates opening to shared Agent state without Agent API calls', () => {
  assert.match(source, /type: 'agent\/requestOpen'/);
  assert.match(source, /source: 'component_abnormal'/);
  assert.doesNotMatch(source, /getAgentAccess|fetchAgentLlmConfig/);
});

test('the application overview slide panel renders the same abnormal guide flow', () => {
  assert.match(slidePanelSource, /shouldShowComponentAbnormalGuide/);
  assert.match(slidePanelSource, /handleAgentTroubleshoot/);
  assert.match(slidePanelSource, /handleSuppressAgentGuide/);
  assert.match(slidePanelSource, /type: 'agent\/requestOpen'/);
  assert.match(slidePanelSource, /visible=\{showAbnormalAgentGuide\}/);
  assert.doesNotMatch(slidePanelSource, /getAgentAccess|fetchAgentLlmConfig/);
});

test('both component entries use a shared compact modal with useful body details', () => {
  assert.equal(fs.existsSync(sharedGuidePath), true);

  assert.match(source, /<AgentAbnormalGuideModal/);
  assert.match(slidePanelSource, /<AgentAbnormalGuideModal/);
  assert.match(sharedGuideSource, /title=\{/);
  assert.match(sharedGuideSource, /agentGuideBody/);
  assert.match(sharedGuideSource, /agentGuideDescription/);
  assert.match(sharedGuideSource, /agentGuideCapabilities/);
  assert.match(sharedGuideSource, /agentGuideCapabilityItem/);
  assert.match(sharedGuideSource, /<AgentEntryIcon \/>/);
  assert.match(sharedGuideSource, /footer=\{\[/);
  assert.doesNotMatch(sharedGuideSource, /agentGuideComponentRow/);
  assert.doesNotMatch(sharedGuideSource, /agentGuideAssist/);
  assert.doesNotMatch(sharedGuideSource, /agentGuideHero/);
  assert.match(sharedGuideSource, /onTroubleshoot/);
  assert.match(sharedGuideSource, /onSuppress/);
});

test('suppression copy describes the session-storage lifetime', () => {
  assert.match(zhLocaleSource, /本次会话不再弹出/);
  assert.doesNotMatch(zhLocaleSource, /本次登录不再弹出/);
});
