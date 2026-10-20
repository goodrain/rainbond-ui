const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.doesNotMatch(source, /renderHistoryPopover/, 'single-session UI must not render a history popover');
assert.doesNotMatch(source, /agent\/loadSessionList/, 'single-session UI must not load a session list');
assert.doesNotMatch(source, /agent\/switchSession/, 'single-session UI must not switch sessions');
assert.doesNotMatch(source, /agent\/removeSession/, 'single-session UI must not delete historical sessions');
assert.match(source, /handleClear/, 'single-session UI must keep the clear-current-conversation action');
assert.match(source, /trace\.sources/, 'trace rows must render web search sources');

console.log('single-session UI tests passed');
