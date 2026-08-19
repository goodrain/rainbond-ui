const assert = require('assert');
const fs = require('fs');
const path = require('path');

const logSource = fs.readFileSync(path.join(__dirname, 'log.js'), 'utf8');

const initializeBody = logSource.match(
  /initializeEventSources\(pods, lines\) \{([\s\S]*?)\n  \}/
);
assert.ok(initializeBody, 'should expose the component log stream initializer');
assert.ok(
  /this\.closeAllEventSources\(\);[\s\S]*?pods\.forEach/.test(
    initializeBody[1]
  ),
  'reinitializing component log streams should close all previous EventSources first'
);
assert.ok(
  /const eventSource = new EventSource\([\s\S]*?this\.eventSources\[podName\] = eventSource/.test(
    initializeBody[1]
  ),
  'each pod stream should keep a stable EventSource identity'
);
assert.ok(
  /eventSource\.onopen = \(\) => \{[\s\S]*?this\.eventSources\[podName\] !== eventSource[\s\S]*?buildRuntimeLogReplayBudget\([\s\S]*?podName,[\s\S]*?lines/.test(
    initializeBody[1]
  ),
  'opening or reconnecting a pod stream should rebuild its bounded replay budget'
);
assert.ok(
  /eventSource\.onmessage = event => \{[\s\S]*?this\.eventSources\[podName\] !== eventSource[\s\S]*?shouldAppendRuntimeLogMessage\([\s\S]*?return;[\s\S]*?rememberRuntimeLogMessage\([\s\S]*?this\.messageBuffer\.push/.test(
    initializeBody[1]
  ),
  'only current, non-replayed pod messages should be remembered and rendered'
);

const errorBody = logSource.match(
  /\.onerror = \(error\) => \{([\s\S]*?)\n        \};/
);
assert.ok(errorBody, 'component log EventSources should define an error handler');
assert.ok(
  !/closeEventSource|closeAllEventSources/.test(errorBody[1]),
  'EventSource errors should keep the connection available for native reconnection'
);

assert.ok(
  /onChangeCascader = value => \{[\s\S]*?if \(value && value\.length > 1\)[\s\S]*?this\.closeAllEventSources\(\);[\s\S]*?this\.fetchContainerLog\(\);/.test(
    logSource
  ),
  'selecting one container should close every all-container EventSource'
);
assert.ok(
  /if \(podsChanged\) \{[\s\S]*?this\.closeAllEventSources\(\);[\s\S]*?started && !pod_name && filter === ''[\s\S]*?this\.initializeEventSources\(instances, 100\);/.test(
    logSource
  ),
  'pod refreshes should not reopen all-container streams while stopped, filtered, or viewing one container'
);
assert.ok(
  /if \(value && value\.length > 1\)[\s\S]*?this\.closeTimer\(\);[\s\S]*?this\.closeAllEventSources\(\);/.test(
    logSource
  ) &&
    /closeTimer = \(\) => \{[\s\S]*?this\.timer = null;/.test(logSource),
  'switching containers should cancel and clear the previous HTTP refresh timer'
);
assert.ok(
  /fetchContainerLog = \(\) => \{[\s\S]*?const \{ pod_name, container_name \} = this\.state;[\s\S]*?this\.unmounted[\s\S]*?this\.state\.pod_name !== pod_name[\s\S]*?this\.state\.container_name !== container_name/.test(
    logSource
  ),
  'late container log responses should be ignored after switching selection or unmounting'
);

assert.ok(
  /componentWillUnmount\(\) \{[\s\S]*?this\.unmounted = true;[\s\S]*?this\.closeAllEventSources\(\);[\s\S]*?this\.closeTimer\(\);/.test(
    logSource
  ),
  'unmounting the component log page should clean up streams and its container timer'
);

assert.ok(
  /closeEventSource\(podsName\) \{[\s\S]*?eventSource\.onopen = null;[\s\S]*?eventSource\.onmessage = null;[\s\S]*?eventSource\.onerror = null;[\s\S]*?eventSource\.close\(\);[\s\S]*?delete this\.runtimeLogReplayBudgets\[podsName\]/.test(
    logSource
  ),
  'closing a pod stream should detach callbacks and discard only its replay budget'
);
assert.ok(
  /setLogs = logs => \{[\s\S]*?if \(!podName\) \{[\s\S]*?this\.recentRuntimeLogMessages = \[\];[\s\S]*?this\.runtimeLogReplayBudgets = \{\};/.test(
    logSource
  ),
  'filtering the combined view should reset replay history so clearing the filter can restore the server tail'
);

console.log('component log EventSource lifecycle assertions passed');
