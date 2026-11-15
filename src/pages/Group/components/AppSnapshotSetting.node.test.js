const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
function editor(response, failure) {
  const source = fs.readFileSync(`${__dirname}/AppSnapshotSetting.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = ast.program.body.find(node => node.type === 'ClassDeclaration' && node.id.name === 'AppSnapshotSetting');
  const methods = component.body.body.filter(node => node.key && ['handleModeSubmit', 'closeSnapshotDraft', 'handleGiveup'].includes(node.key.name));
  const actions = [], successes = [], warnings = [], payloads = [];
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, {
    formatMessage: ({ id }) => id,
    createAppVersionSnapshot: async payload => { payloads.push(payload);if (failure) throw failure;return response; },
    notification: { success: value => successes.push(value), warning: value => warnings.push(value) },
    routerRedux: { replace: value => ({ type: 'navigate', value }) }
  });
  const target = new Target();
  target.props = { match: { params: { teamName: 'source', regionName: 'region', appID: '42', shareId: '7' } }, dispatch: action => actions.push(action) };
  target.state = {};target.setState = update => Object.assign(target.state, update);
  target.collectSubmissionData = () => ({ selectedShareServices: [{ service_id: 'component' }], plugin_list: [], share_k8s_resources: [] });
  return { target, actions, successes, warnings, payloads };
}
test('saving a snapshot closes only its configuration record and refreshes history without waiting for publish cleanup', async () => {
  const { target, actions, successes, warnings, payloads } = editor({ bean: { version_id: 9, created: true } });
  await target.handleModeSubmit({ version: '1.0.0', describe: 'Saved snapshot' });
  assert.equal(payloads[0].team_name, 'source');
  assert.equal(payloads[0].group_id, '42');
  assert.equal(actions[0].type, 'application/giveupShare');
  assert.equal(actions[0].payload.share_id, '7');
  assert.equal(actions[1].type, 'navigate');
  assert.equal(actions[1].value.pathname, '/team/source/region/region/apps/42/version');
  assert(actions[1].value.query.refresh);
  assert.equal(actions.some(action => action.type === 'application/deleteShareRecord'), false);
  assert.equal(successes.length, 1);assert.equal(warnings.length, 0);
});
test('failed or empty snapshot responses never report success, discard the draft, or navigate away', async () => {
  for (const [response, error] of [[undefined, undefined], [undefined, new Error('Snapshot failed')], [{ bean: {} }, undefined]]) {
    const { target, actions, successes, warnings } = editor(response, error);
    await target.handleModeSubmit({ version: '1.0.0' });
    assert.equal(actions.length, 0);assert.equal(successes.length, 0);assert.equal(warnings.length, 1);
    assert.equal(target.state.submitLoading, false);
  }
});
test('unchanged snapshots retain their existing history and cancelling never invokes publication cleanup', async () => {
  const { target, actions, successes, warnings } = editor({ bean: { version_id: 9, created: false } });
  await target.handleModeSubmit({ version: '1.0.0' });
  assert.equal(actions.length, 0);assert.equal(successes.length, 0);assert.equal(warnings.length, 1);
  target.handleGiveup();
  assert.equal(actions[0].type, 'application/giveupShare');
  assert.equal(actions[1].type, 'navigate');
});
