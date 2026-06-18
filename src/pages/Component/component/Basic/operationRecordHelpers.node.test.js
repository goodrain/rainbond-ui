const assert = require('assert');
const {
  getOperationLogTooltipTitle,
  getOperationLogTooltipVisible,
  getOperationRecordMessage,
  getOperationRecordTypeText,
  shouldShowOperationLogTooltipByDefault
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
  getOperationRecordMessage('容器异常退出，请查看日志定位问题 (exit code: 127)'),
  '程序启动失败，请查看日志 (exit code: 127)',
  'should describe container exit errors as program startup failures in operation records'
);

assert.strictEqual(
  getOperationRecordMessage('拉取镜像失败，请检查镜像是否存在'),
  '拉取镜像失败，请检查镜像是否存在',
  'should leave unrelated operation messages unchanged'
);

assert.strictEqual(
  getOperationRecordTypeText('ContainerExitError', '异常退出'),
  '组件异常退出',
  'should show the full component exit label for container exit operation records'
);

assert.strictEqual(
  getOperationRecordTypeText('ContainerExitError', 'Container exit error'),
  'Container exit error',
  'should keep the English container exit label unchanged'
);

assert.strictEqual(
  getOperationLogTooltipTitle({
    defaultTitle: '查看日志',
    detail: '程序启动失败，请查看日志'
  }),
  '请查看日志',
  'should only prompt users to view logs in the log icon tooltip'
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

assert.strictEqual(
  getOperationLogTooltipVisible('complete', true),
  true,
  'should show selected completed operation log tips by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'failure',
    canShowLog: true,
    hasShownFailureTip: false
  }),
  true,
  'should show the first failed log icon tip by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'failure',
    canShowLog: true,
    hasShownFailureTip: true
  }),
  false,
  'should not show every failed log icon tip by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'success',
    canShowLog: true,
    hasShownFailureTip: false
  }),
  false,
  'should not show successful log icon tips by default'
);

console.log('operation record helper tests passed');
