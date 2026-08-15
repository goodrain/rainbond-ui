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

console.log('component log EventSource lifecycle assertions passed');
