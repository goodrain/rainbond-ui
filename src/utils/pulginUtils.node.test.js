const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

function loadPulginUtils() {
  const filename = path.join(__dirname, 'pulginUtils.js');
  const source = fs
    .readFileSync(filename, 'utf8')
    .replace(
      "import { getPluginBaseId } from './pluginArchUtils';",
      "const { getPluginBaseId } = require('./pluginArchUtils');"
    )
    .replace('export default {', 'module.exports = {');
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(__dirname);
  mod._compile(source, filename);
  return mod.exports;
}

const pluginUtils = loadPulginUtils();

test('getCurrentViewPosition accepts full url, hash path, plain path, and explicit view', function () {
  assert.equal(
    pluginUtils.getCurrentViewPosition('http://localhost/#/enterprise/1/plugins/demo'),
    'Platform'
  );
  assert.equal(
    pluginUtils.getCurrentViewPosition('#/team/t1/region/r1/plugins/demo'),
    'Team'
  );
  assert.equal(
    pluginUtils.getCurrentViewPosition('/team/t1/region/r1/apps/1/plugins/demo'),
    'Application'
  );
  assert.equal(
    pluginUtils.getCurrentViewPosition('/team/t1/region/r1/apps/1/plugins/demo', 'Component'),
    'Component'
  );
});

test('legacy two-view plugin mapping remains compatible', function () {
  const plugin = {
    root: function RootPage() {},
    OtherPages: function OtherPage() {}
  };

  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/enterprise/1/plugins/demo',
      ['Platform', 'Application']
    ),
    plugin.root
  );
  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/team/t1/region/r1/apps/1/plugins/demo',
      ['Platform', 'Application']
    ),
    plugin.OtherPages
  );
});

test('viewPages selects the exact configured view before legacy fallback', function () {
  const plugin = {
    root: function RootPage() {},
    OtherPages: function OtherPage() {},
    viewPages: {
      Application: function ApplicationPage() {},
      Component: function ComponentPage() {}
    }
  };

  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/team/t1/region/r1/apps/1/plugins/demo',
      ['Application', 'Component']
    ),
    plugin.viewPages.Application
  );
  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/team/t1/region/r1/apps/1/plugins/demo',
      ['Application', 'Component'],
      'Component'
    ),
    plugin.viewPages.Component
  );
});

test('viewPages cannot render outside plugin_views', function () {
  const plugin = {
    root: function RootPage() {},
    OtherPages: function OtherPage() {},
    viewPages: {
      Platform: function PlatformPage() {}
    }
  };

  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/enterprise/1/plugins/demo',
      ['Application']
    ),
    null
  );
});

test('partial viewPages falls back to legacy slots for declared views', function () {
  const plugin = {
    root: function RootPage() {},
    OtherPages: function OtherPage() {},
    viewPages: {
      Component: function ComponentPage() {}
    }
  };

  assert.equal(
    pluginUtils.getPluginRenderComponent(
      plugin,
      '#/team/t1/region/r1/apps/1/plugins/demo',
      ['Application', 'Component']
    ),
    plugin.root
  );
});
