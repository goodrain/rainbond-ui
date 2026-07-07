const assert = require('assert');
const { getErrorCodeMessage } = require('./errorMessage');

assert.strictEqual(
  getErrorCodeMessage(
    { code: 10412, msg_show: '仓库地址格式不正确' },
    { notExist: '当前集群不存在' }
  ),
  '仓库地址格式不正确',
  '10412 should prefer backend msg_show when the API returns a business error detail'
);

assert.strictEqual(
  getErrorCodeMessage(
    { code: 10412 },
    { notExist: '当前集群不存在' }
  ),
  '当前集群不存在',
  '10412 should keep the legacy fallback when backend does not return a detail message'
);

console.log('error message tests passed');
