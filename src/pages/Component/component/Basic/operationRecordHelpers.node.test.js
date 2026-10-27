const assert = require('assert');
const {
  getOperationLogTooltipTitle,
  getOperationLogTooltipVisible,
  getOperationRecordMessage,
  getOperationRecordStatusClass,
  getOperationRecordTypeText,
  isOperationLogRunning,
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
  getOperationRecordStatusClass('checking'),
  'logfored',
  'should render checking health-check events with the in-progress operation style'
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

// Multiple running records must never create multiple default tooltips.
const records = [
  { eventID: 'latest', finalStatus: 'running', isLatestRecord: true },
  { eventID: 'older', finalStatus: '', isLatestRecord: false },
  { eventID: 'finished', finalStatus: 'complete', isLatestRecord: false }
];
const visibleEvents = (activeEventID, showByDefault = false) => records
  .filter(record => getOperationLogTooltipVisible({ ...record, activeEventID, showByDefault }))
  .map(record => record.eventID);
assert.deepStrictEqual(visibleEvents(null), ['latest']);
assert.deepStrictEqual(visibleEvents('older'), ['older']);
assert.deepStrictEqual(visibleEvents('finished'), ['finished']);
assert.deepStrictEqual(visibleEvents(null, true), ['latest']);
assert.strictEqual(getOperationLogTooltipVisible({
  eventID: 'latest', activeEventID: null, isLatestRecord: true, finalStatus: 'complete'
}), false);
assert.strictEqual(getOperationLogTooltipVisible({
  eventID: 'latest', activeEventID: null, isLatestRecord: true,
  finalStatus: 'complete', showByDefault: true
}), true);
assert.strictEqual(isOperationLogRunning('running'), true);
assert.strictEqual(isOperationLogRunning('empty'), false);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'failure',
    canShowLog: true,
    isLatestRecord: true
  }),
  true,
  'should show the latest failed log icon tip by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'failure',
    canShowLog: true,
    isLatestRecord: false
  }),
  false,
  'should not show historical failed log icon tips by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'success',
    canShowLog: true,
    isLatestRecord: true
  }),
  false,
  'should not show successful log icon tips by default'
);

assert.strictEqual(
  shouldShowOperationLogTooltipByDefault({
    status: 'checking',
    canShowLog: true,
    hasShownFailureTip: false,
    isLatestRecord: true
  }),
  false,
  'should not treat checking health-check events as failed log tips'
);

console.log('operation record helper tests passed');
