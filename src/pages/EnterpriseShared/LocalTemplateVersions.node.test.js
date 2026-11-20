const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const { localTemplateVersion } = require('../../utils/localTemplateVersions');
const row = version => ({ version, app_id: 'catalog', app_template: { apps: [], group_version: version } });
function view(versions = [row('2.0.0'), row('1.0.0')]) {
  const source = fs.readFileSync(`${__dirname}/LocalTemplateVersions.js`, 'utf8');
  const declaration = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'decorators-legacy'] })
    .program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['entries', 'selected', 'hasOlderPage', 'ensurePrevious', 'loadPrevious', 'componentDidUpdate'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(method => source.slice(method.start, method.end)).join('\n')} }; Target`, { localTemplateVersion });
  const target = new Target(), requests = [];
  target.alive = true;target.generation = 0;
  target.state = { selectedVersion: '', previous: null, previousLoading: false, previousLoaded: false, previousFailed: false };
  target.props = { versions, eid: 'enterprise', appId: 'catalog', page: 1, pageSize: 2, total: 3, dispatch: request => requests.push(request) };
  target.setState = (update, callback) => { Object.assign(target.state, update);if (callback) callback(); };
  return { target, requests };
}

test('previous-page comparison loads only the adjacent version when the selected version needs it', () => {
  const { target, requests } = view();
  target.ensurePrevious();assert.equal(requests.length, 0);
  target.state.selectedVersion = '1.0.0';target.ensurePrevious();target.ensurePrevious();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.page, 3);assert.equal(requests[0].payload.page_size, 1);
  requests[0].callback({ list: [row('0.9.0')] });
  assert.equal(target.state.previous.version, '0.9.0');assert.equal(target.state.previousLoaded, true);
  target.ensurePrevious();assert.equal(requests.length, 1);
});

test('failed or missing older version stays unavailable and can retry without a fetch loop', () => {
  const { target, requests } = view();
  target.state.selectedVersion = '1.0.0';target.ensurePrevious();requests[0].onError();target.ensurePrevious();
  assert.equal(target.state.previousFailed, true);assert.equal(requests.length, 1);
  target.loadPrevious();requests[1].callback({ list: [] });
  assert.equal(target.state.previousFailed, true);assert.equal(target.state.previous, null);
  target.loadPrevious();requests[2].callback({ list: [row('0.9.0')] });
  assert.equal(target.state.previousFailed, false);assert.equal(target.state.previous.version, '0.9.0');
});

test('older-version responses from a previous page cannot replace the current comparison', () => {
  const { target, requests } = view();
  target.state.selectedVersion = '1.0.0';target.ensurePrevious();
  const previous = target.props;
  target.props = { ...previous, versions: [row('0.9.0')], page: 2, total: 3 };
  target.componentDidUpdate(previous);
  requests[0].callback({ list: [row('wrong-page')] });
  assert.equal(target.state.previous, null);assert.equal(target.state.previousLoaded, false);
  assert.equal(requests.length, 1);
});
