const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  getComponentPollingDelay,
  ACTIVE_POLL_DELAY,
  STABLE_POLL_DELAY,
  MAX_FAILURE_POLL_DELAY
} = require('./componentPolling');

assert.strictEqual(ACTIVE_POLL_DELAY, 5000);
assert.strictEqual(STABLE_POLL_DELAY, 15000);
assert.strictEqual(MAX_FAILURE_POLL_DELAY, 60000);
assert.strictEqual(
  getComponentPollingDelay(),
  ACTIVE_POLL_DELAY,
  'polling should stay responsive until the first component status is known'
);

['starting', 'restoring', 'waiting', 'checking', 'stoping', 'stopping', 'upgrade', 'creating'].forEach(status => {
  assert.strictEqual(
    getComponentPollingDelay({ status }),
    ACTIVE_POLL_DELAY,
    `${status} should keep fast polling while state is changing`
  );
});

['running', 'closed', 'unusual', 'some_abnormal', 'undeploy', 'paused'].forEach(status => {
  assert.strictEqual(
    getComponentPollingDelay({ status }),
    STABLE_POLL_DELAY,
    `${status} should reduce polling after state stabilizes`
  );
});

assert.deepStrictEqual(
  [1, 2, 3, 4, 5].map(failureCount => getComponentPollingDelay({ failureCount })),
  [10000, 20000, 40000, 60000, 60000],
  'failures should exponentially back off with a one minute cap'
);

const componentDir = __dirname;
const mainSource = fs.readFileSync(path.join(componentDir, 'index.js'), 'utf8');
const overviewSource = fs.readFileSync(path.join(componentDir, 'overview.js'), 'utf8');
const databaseOverviewSource = fs.readFileSync(path.join(componentDir, 'databaseOverview.js'), 'utf8');
const serviceSource = fs.readFileSync(path.join(componentDir, '../../services/app.js'), 'utf8');

assert.match(mainSource, /addEventListener\(['"]visibilitychange['"],\s*this\.handleVisibilityChange\)/);
assert.match(mainSource, /removeEventListener\(['"]visibilitychange['"],\s*this\.handleVisibilityChange\)/);
assert.match(mainSource, /pollingEnabled=\{pollingEnabled\}/);
assert.match(mainSource, /getComponentPollingDelay\(\{/);
assert.match(overviewSource, /getComponentPollingDelay\(\{/);
assert.match(databaseOverviewSource, /getComponentPollingDelay\(\{/);

function exportedFunctionSource(name) {
  const pattern = new RegExp(`export (?:async )?function ${name}\\b`);
  const startMatch = pattern.exec(serviceSource);
  assert.ok(startMatch, `${name} should exist`);
  const remaining = serviceSource.slice(startMatch.index + startMatch[0].length);
  const nextExport = remaining.search(/\nexport (?:async )?function /);
  return serviceSource.slice(
    startMatch.index,
    nextExport === -1 ? serviceSource.length : startMatch.index + startMatch[0].length + nextExport
  );
}

assert.match(exportedFunctionSource('getComponentState'), /timeout:\s*10000/);
assert.match(exportedFunctionSource('getPods'), /timeout:\s*12000/);
assert.match(exportedFunctionSource('fetchOperationLog'), /timeout:\s*12000/);

console.log('component polling performance tests passed');
