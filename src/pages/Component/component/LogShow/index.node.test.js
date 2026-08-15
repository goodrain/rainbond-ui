const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.ok(
  !/watchEventLog|AppPubSubSocket/.test(source),
  'component operation logs must not subscribe to the shared PubSub websocket'
);
assert.ok(
  /scheduleLogPoll[\s\S]*?setTimeout[\s\S]*?loadEventLog\(\)[\s\S]*?2000/.test(
    source
  ),
  'running operation logs should refresh through the existing HTTP loader'
);
assert.ok(
  /componentWillUnmount\(\)[\s\S]*?clearTimeout\(this\.pollTimer\)/.test(source),
  'closing the log modal must stop its HTTP polling timer'
);
assert.ok(
  /showSocket\s*&&\s*socketUrl[\s\S]*?this\.showSocket\(\)/.test(source),
  'dedicated websocket URLs used by unrelated workflows should remain supported'
);

console.log('operation log transport tests passed');
