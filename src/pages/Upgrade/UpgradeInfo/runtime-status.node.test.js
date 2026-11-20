const assert = require('assert');
const { shouldPollUpgradeRecord, getRuntimePresentation } = require('./runtime-status');

[1, 6, 8, 9, 10].forEach(status => {
  assert.strictEqual(!!shouldPollUpgradeRecord({ status }), false, `status ${status} must not leave a polling loop`);
});
[2, 4].forEach(status => assert.strictEqual(shouldPollUpgradeRecord({ status }), true));
assert.strictEqual(shouldPollUpgradeRecord({ status: 3, runtime_state: { status: 'pending' } }), true);
assert.strictEqual(!!shouldPollUpgradeRecord({ status: 3, runtime_state: { status: 'ready' } }), false);
assert.strictEqual(!!shouldPollUpgradeRecord({ status: 3 }), false);
assert.strictEqual(getRuntimePresentation({ status: 3 }).status, 'unknown', 'legacy event success cannot prove readiness');

const record = {
  status: 3,
  service_record: [{ service_id: 'api', event_id: 'event' }, { service_id: 'optional', event_id: null }],
  runtime_state: {
    status: 'pending',
    components: [{ service_id: 'api', status: 'waiting' }, { service_id: 'optional', status: 'closed' }]
  }
};
assert.deepStrictEqual(getRuntimePresentation(record).components, [{ service_id: 'api', status: 'waiting' }]);
record.service_record[1].event_id = 'new-event';
assert.strictEqual(getRuntimePresentation(record).components.length, 2, 'a stopped operated component remains a blocker');
record.runtime_state.status = 'abnormal';
assert.strictEqual(getRuntimePresentation(record).type, 'error');
assert.strictEqual(!!shouldPollUpgradeRecord(record), false);
