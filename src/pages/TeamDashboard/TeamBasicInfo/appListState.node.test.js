const assert = require('assert/strict');
const path = require('path');
const test = require('node:test');

const appListState = require(path.join(__dirname, 'appListState.js'));

test('normalizes whitespace-only searches before requesting the application list', () => {
  assert.equal(appListState.normalizeAppListQuery('   '), '');
  assert.equal(appListState.normalizeAppListQuery('  api  '), 'api');
});

test('shows the first-deploy guide only after a successful unfiltered empty list', () => {
  assert.equal(appListState.shouldShowFirstDeployGuide({
    appListLoading: false,
    appListLoaded: true,
    isAppList: true,
    appListQuery: '',
    appListTotal: 0
  }), true);
  assert.equal(appListState.shouldShowFirstDeployGuide({
    appListLoading: false,
    appListLoaded: true,
    isAppList: true,
    appListQuery: 'missing-app',
    appListTotal: 0
  }), false);
  assert.equal(appListState.shouldShowFirstDeployGuide({
    appListLoading: false,
    appListLoaded: true,
    isAppList: true,
    appListQuery: '   ',
    appListTotal: 0
  }), false);
  assert.equal(appListState.shouldShowFirstDeployGuide({
    appListLoading: false,
    appListLoaded: false,
    isAppList: true,
    appListQuery: '',
    appListTotal: 0
  }), false);
});
