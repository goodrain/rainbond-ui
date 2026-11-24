const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const parser = require('@babel/parser');

function loadEffect() {
  const source = fs.readFileSync(path.join(__dirname, 'teamControl.js'), 'utf8');
  const tree = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const model = tree.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = model.properties.find(node => node.key.name === 'effects').value;
  const effect = effects.properties.find(node => node.key.name === 'fetchPluginUrl');
  const body = source.slice(effect.body.start, effect.body.end);
  const params = effect.params.map(node => source.slice(node.start, node.end)).join(',');
  const service = () => {};
  return new Function('fetchPluginUrl', `return function* (${params}) ${body}`)(service);
}

function run({ guarded = true, active = true, changeOnPut = false } = {}) {
  const writes = [], callbacks = [], calls = [];
  const context = { active };
  const action = { payload: { enterprise_id: 'enterprise-a', region_name: 'region-a' },
    callback: value => callbacks.push(value),
    ...(guarded ? { shouldApply: () => context.active } : {}) };
  const iterator = loadEffect()(action, {
    call: (...args) => { calls.push(args); return { type: 'call' }; },
    put: value => { writes.push(value); if (changeOnPut) context.active = false; return { type: 'put' }; }
  });
  return { context, iterator, writes, callbacks, calls };
}

test('an inactive VM entry does not issue a plugin read', () => {
  const h = run({ active: false });
  assert.equal(h.iterator.next().done, true);
  assert.equal(h.calls.length, 0);
});

test('a late old-region plugin response cannot replace the current plugin list', () => {
  const h = run();
  h.iterator.next();
  h.context.active = false;
  assert.equal(h.iterator.next({ list: [{ name: 'rainbond-vm' }] }).done, true);
  assert.equal(h.writes.length, 0);
  assert.equal(h.callbacks.length, 0);
});

test('a navigation triggered during the store update suppresses the old callback', () => {
  const h = run({ changeOnPut: true });
  h.iterator.next();
  h.iterator.next({ list: [{ name: 'rainbond-vm' }] });
  h.iterator.next();
  assert.equal(h.writes.length, 1);
  assert.equal(h.callbacks.length, 0);
});

test('existing unguarded callers retain their store update and callback', () => {
  const h = run({ guarded: false });
  const response = { list: [{ name: 'rainbond-vm' }] };
  h.iterator.next();
  h.iterator.next(response);
  assert.equal(h.iterator.next().done, true);
  assert.equal(h.writes[0].type, 'savePluginList');
  assert.equal(h.writes[0].payload, response);
  assert.deepEqual(h.callbacks, [response]);
});
