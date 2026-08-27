const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getK8sResources, hasK8sResources } = require('./k8sResourceGuard');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const zhLocale = fs.readFileSync(path.join(__dirname, '../../locales/zh-CN/app.js'), 'utf8');
const enLocale = fs.readFileSync(path.join(__dirname, '../../locales/en-US/app.js'), 'utf8');
const groupPageSource = fs.readFileSync(path.join(__dirname, '../../pages/Group/Group.js'), 'utf8');
const slidePanelSource = fs.readFileSync(path.join(__dirname, '../SlidePanel/components/app.js'), 'utf8');

test('K8s resource guard normalizes absent data and detects returned resources', () => {
  const resources = [
    { resource_id: 'resource-1', name: 'apecloud-mysql', delete_status: 'ACTIVE' }
  ];

  assert.deepEqual(getK8sResources(), [], 'missing response data should be treated as no K8s resources');
  assert.deepEqual(getK8sResources({ k8s_resources: {} }), [], 'a malformed resource field should be ignored');
  assert.deepEqual(getK8sResources({ k8s_resources: resources }), resources, 'returned K8s resources should be retained');
  assert.equal(hasK8sResources({ k8s_resources: [] }), false, 'an empty K8s resource list should not block deletion');
  assert.equal(hasK8sResources({ k8s_resources: resources }), true, 'any returned K8s resource should block deletion');
});

test('application deletion is blocked until K8s resources are manually removed', () => {
  assert.match(
    source,
    /const k8sResources = getK8sResources\(infoList\);\s*const hasK8sResourceList = hasK8sResources\(infoList\);/,
    'the render guard should use the shared K8s resource helper'
  );
  assert.match(
    source,
    /handleDeleteResource\s*=\s*\(\)\s*=>\s*\{[\s\S]*?if \(hasK8sResources\(infoList\)\) \{[\s\S]*?this\.handleManageK8sResources\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?type:\s*'application\/deleteGroupAllResource'/,
    'the final confirmation must not dispatch application deletion when K8s resources are present'
  );
  assert.match(
    source,
    /handleManageK8sResources[\s\S]*?onCancel\(\);[\s\S]*?routerRedux\.push\(`\/team\/\$\{team_name\}\/region\/\$\{regionName\}\/apps\/\$\{group_id\}\/asset`\)/,
    'the guard should close the dialog and navigate to the app K8s resource page'
  );
  assert.match(
    source,
    /footer=\{hasK8sResourceList \? \[[\s\S]*?onClick=\{this\.handleManageK8sResources\}[\s\S]*?: !isflag \? \[[\s\S]*?onClick=\{onDelete\}[\s\S]*?: \[/,
    'the K8s-resource path must not advance to application deletion, while the empty path keeps both existing confirmations'
  );
});

test('application deletion dialog exposes K8s deletion status and failure detail', () => {
  assert.match(source, /item\.delete_status/, 'the resource list should expose delete status');
  assert.match(source, /item\.delete_error/, 'the resource list should expose deletion failure detail');
  assert.match(source, /status === 'ACTIVE'/, 'the normal resource status should be localized');
  assert.match(source, /appOverview\.app\.delete\.k8s\.blocked/, 'the dialog should explain why deletion is blocked');
  assert.match(source, /appOverview\.app\.delete\.k8s\.manage/, 'the dialog should use a dedicated navigation action');
  assert.match(zhLocale, /'appOverview\.app\.delete\.k8s\.blocked':/, 'Chinese copy should be available');
  assert.match(enLocale, /'appOverview\.app\.delete\.k8s\.blocked':/, 'English copy should be available');
  assert.match(zhLocale, /'addKubenetesResource\.table\.active':/, 'Chinese active status copy should be available');
  assert.match(enLocale, /'addKubenetesResource\.table\.active':/, 'English active status copy should be available');
});

test('application deletion waits for current resources before opening the dialog', () => {
  [
    ['Group page', groupPageSource],
    ['application slide panel', slidePanelSource]
  ].forEach(([name, pageSource]) => {
    assert.match(
      pageSource,
      /toDelete\s*=\s*\(\)\s*=>\s*\{\s*this\.handleGroupAllResource\(\);\s*\};/,
      `${name} should request the current resource list before stopping the normal application view`
    );
    assert.match(
      pageSource,
      /callback:\s*res\s*=>\s*\{\s*if \(res && res\.status_code === 200\) \{\s*this\.closeComponentTimer\(\);[\s\S]*?resourceList:\s*res\.bean \|\| \{\},[\s\S]*?toDelete:\s*true,[\s\S]*?toDeleteResource:\s*false/,
      `${name} should only stop the normal view and open deletion after a successful resource response`
    );
  });
});
