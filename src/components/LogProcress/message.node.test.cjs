const test = require('node:test');
const assert = require('node:assert/strict');

const { extractLogMessageText } = require('./message');

test('extractLogMessageText returns nested structured event logger message text', () => {
  const text = extractLogMessageText({
    message: '开始检查服务，类型: vm-run',
    step: 'service_check',
    level: 'info'
  });

  assert.equal(text, '开始检查服务，类型: vm-run');
});
