const assert = require('assert');
const fs = require('fs');
const path = require('path');

const logShowSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const operationRecordSource = fs.readFileSync(
  path.join(__dirname, '..', 'Basic', 'operationRecord.js'),
  'utf8'
);
const buildHistorySource = fs.readFileSync(
  path.join(__dirname, '..', 'BuildHistory', 'index.js'),
  'utf8'
);
const appShareLoadingSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'Group', 'AppShareLoading.js'),
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
  /const eventSource = new EventSource\(url,[\s\S]*?this\.eventSource = eventSource/.test(
    logShowSource
  ),
  'event stream callbacks should capture the EventSource instance they belong to'
);
assert.ok(
  /eventSource\.onopen\s*=\s*\(\)\s*=>\s*\{\s*if \(this\.eventSource !== eventSource\) \{\s*return;\s*\}[\s\S]*?buildEventLogReplayBudget\(this\.state\.logs\)/.test(
    logShowSource
  ),
  'only the current EventSource should rebuild replay counts on connection and native reconnect'
);
assert.ok(
  /eventSource\.addEventListener\(\s*['"]replay-complete['"],\s*\(\)\s*=>\s*\{\s*if \(this\.eventSource !== eventSource\) \{\s*return;\s*\}[\s\S]*?this\.eventLogReplayBudget\s*=\s*null/.test(
    logShowSource
  ),
  'only the current EventSource replay-complete boundary should end overlap reconciliation'
);
assert.ok(
  /eventSource\.onmessage\s*=\s*event\s*=>\s*\{\s*if \(this\.eventSource !== eventSource\) \{\s*return;\s*\}/.test(
    logShowSource
  ),
  'queued messages from a replaced EventSource must not update logs or terminal state'
);
assert.ok(
  /shouldAppendEventStreamMessage\(message,\s*this\.eventLogReplayBudget\)[\s\S]*?this\.handleMessage\(message\)/.test(
    logShowSource
  ),
  'only replay messages unmatched by the HTTP history multiset should be rendered'
);
assert.ok(
  /const terminalState = getEventLogTerminalState\(message\)[\s\S]*?if \(terminalState\)[\s\S]*?this\.closeEventSource\(\)/.test(
    logShowSource
  ),
  'terminal state handling must remain independent from replay rendering suppression'
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
  /shouldAppendEventLog\(\s*data\.message,\s*this\.seenMessages,\s*deduplicateMessages\s*\)/.test(
    logShowSource
  ) &&
    !/deduplicateMessages/.test(operationRecordSource) &&
    !/deduplicateMessages/.test(buildHistorySource),
  'operation records and build history should preserve repeated ordinary log lines'
);
assert.ok(
  /<LogShow[\s\S]*?deduplicateMessages[\s\S]*?socketUrl=\{this\.socketUrl\}/.test(
    appShareLoadingSource
  ),
  'AppShareLoading should explicitly retain ordinary-message replay deduplication'
);
assert.ok(
  /dockerprogress\.get\(progress\.id\)/.test(logShowSource) &&
    /dockerprogress\.set\(progress\.id, progress\)/.test(logShowSource),
  'progress messages should continue to update by progress id'
);
assert.ok(
  /handleMessage = data => \{[\s\S]*?this\.setState\(\s*prevState => \{[\s\S]*?\.\.\.\(prevState\.logs \|\| \[\]\)[\s\S]*?new Map\(prevState\.dockerprogress\)/.test(
    logShowSource
  ) && !/const logs = this\.state\.logs/.test(logShowSource),
  'realtime log updates should copy state inside functional setState'
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
