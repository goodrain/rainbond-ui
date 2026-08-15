const assert = require('assert');
const fs = require('fs');
const path = require('path');

const logShowSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const operationRecordSource = fs.readFileSync(
  path.join(__dirname, '..', 'Basic', 'operationRecord.js'),
  'utf8'
);

assert.ok(
  /buildEventLogStreamUrl/.test(logShowSource) &&
    /getEventLogTerminalState/.test(logShowSource),
  'LogShow should build and classify the event stream with pure helpers'
);
assert.ok(
  /const \{ EventID \} = this\.props;[\s\S]*?buildEventLogStreamUrl\(EventID, regionName\)/.test(
    logShowSource
  ) &&
    !/buildEventLogStreamUrl\([\s\S]{0,120}serviceAlias/.test(logShowSource),
  'LogShow should reuse the generic SSE proxy without component route plumbing'
);
assert.ok(
  /new EventSource\(url,\s*\{\s*withCredentials:\s*true\s*\}\)/.test(
    logShowSource
  ),
  'running operation logs should open a credentialed EventSource'
);
assert.ok(
  /JSON\.parse\(event\.data\)/.test(logShowSource) &&
    /getEventLogTerminalState\(message\)/.test(logShowSource),
  'SSE data frames should be parsed and checked for terminal messages'
);
assert.ok(
  /closeEventSource\s*=/.test(logShowSource) &&
    /componentWillUnmount\(\)[\s\S]*?this\.closeEventSource\(\)/.test(
      logShowSource
    ) &&
    /if \(terminalState\)[\s\S]*?this\.closeEventSource\(\)/.test(
      logShowSource
    ),
  'terminal messages and component unmount should close the EventSource'
);
assert.ok(
  !logShowSource.includes(`watchEvent${'Log'}`),
  'LogShow must not use the removed shared PubSub subscription'
);
assert.ok(
  /socketUrl/.test(logShowSource) && /new LogSocket/.test(logShowSource),
  'the dedicated AppShareLoading LogSocket branch must remain available'
);
assert.ok(
  ![
    `scheduleLog${'Poll'}`,
    `poll${'Timer'}`,
    `2${'000'}`
  ].some(token => logShowSource.includes(token)),
  'operation logs must not fall back to two-second HTTP polling'
);
assert.ok(
  /showEventStream/.test(operationRecordSource) &&
    !/showSocket/.test(operationRecordSource),
  'OperationRecord should describe running logs as an event stream rather than a socket'
);

console.log('event log stream source assertions passed');
