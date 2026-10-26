const assert = require('node:assert/strict');
const test = require('node:test');
const data = require('./overviewData');

test('restart counts aggregate current Pods and do not change current health', () => {
  const component = { status: 'Running', run_pods: 3, all_pods: 3,
    pods: [{ restart_count: 3 }, { restart_count: 0 }, { restart_count: 2 }] };
  assert.deepEqual(data.componentRestarts(component), { count: 5, complete: true });
  assert.equal(data.componentVisualState(component).level, 'healthy');
  component.run_pods = 2;
  assert.equal(data.componentVisualState(component).level, 'warning');
});

test('missing Pod data is unknown instead of an invented zero', () => {
  for (const component of [null, {}, { pods: [] }, { pods: null }, { pods: [{}] }]) {
    assert.deepEqual(data.componentRestarts(component), { count: null, complete: false });
  }
  assert.deepEqual(data.componentRestarts({ pods: [{ restart_count: 0 }] }), { count: 0, complete: true });
});

test('partial restart data remains a known lower bound', () => {
  assert.deepEqual(data.componentRestarts({ pods: [{ restart_count: 3 }, {}, { restart_count: 1 }] }),
    { count: 4, complete: false });
  assert.deepEqual(data.componentRestarts({ pods: [{ restart_count: 0 }, {}] }), { count: 0, complete: false });
});

test('invalid restart counters cannot produce fabricated counts', () => {
  const invalid = [true, false, null, undefined, '', '3', -1, 1.5, NaN, Infinity];
  invalid.forEach(restart_count => assert.deepEqual(data.componentRestarts({ pods: [{ restart_count }] }),
    { count: null, complete: false }));
  assert.deepEqual(data.componentRestarts({ pods: [{ restart_count: Number.MAX_SAFE_INTEGER }, { restart_count: 1 }] }),
    { count: null, complete: false });
});

test('replaced Pods do not inherit a previous Pod counter', () => {
  assert.equal(data.componentRestarts({ pods: [{ pod_name: 'api-old', restart_count: 7 }] }).count, 7);
  assert.equal(data.componentRestarts({ pods: [{ pod_name: 'api-new', restart_count: 0 }] }).count, 0);
});

test('restart aggregation never mutates response data', () => {
  const component = Object.freeze({ pods: Object.freeze([Object.freeze({ restart_count: 2 }), Object.freeze({ restart_count: 1 })]) });
  assert.deepEqual(data.componentRestarts(component), { count: 3, complete: true });
});
