const assert = require('assert');
const {
  getOperationLogTooltipTitle,
  getOperationLogTooltipVisible,
  getOperationRecordMessage
} = require('./operationRecordHelpers');

assert.strictEqual(
  getOperationRecordMessage('容器启动失败，请查看日志'),
  '程序启动失败，请查看日志',
  'should describe startup failures as program startup failures in operation records'
);

assert.strictEqual(
  getOperationRecordMessage('容器启动失败，请查看日志 (exit code: 1)'),
  '程序启动失败，请查看日志 (exit code: 1)',
  'should preserve extra runtime details after rewriting the startup failure message'
);

assert.strictEqual(
  getOperationRecordMessage('拉取镜像失败，请检查镜像是否存在'),
  '拉取镜像失败，请检查镜像是否存在',
  'should leave unrelated operation messages unchanged'
);

assert.strictEqual(
  getOperationLogTooltipTitle({
    defaultTitle: '查看日志',
    detail: '程序启动失败，请查看日志'
  }),
  '查看日志：程序启动失败，请查看日志',
  'should include the operation failure detail in the log icon tooltip'
);

assert.strictEqual(
  getOperationLogTooltipTitle({
    defaultTitle: '查看日志',
    detail: ''
  }),
  '查看日志',
  'should keep the default log icon tooltip when no detail is available'
);

assert.strictEqual(
  getOperationLogTooltipVisible(''),
  true,
  'should keep in-progress operation log tips visible'
);

assert.strictEqual(
  getOperationLogTooltipVisible('complete'),
  undefined,
  'should leave completed operation log tips uncontrolled so hover can show them'
);

console.log('operation record helper tests passed');
