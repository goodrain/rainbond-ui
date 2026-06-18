const CONTAINER_STARTUP_FAILURE = '容器启动失败，请查看日志';
const CONTAINER_EXIT_FAILURE = '容器异常退出，请查看日志定位问题';
const PROGRAM_STARTUP_FAILURE = '程序启动失败，请查看日志';

function getOperationRecordMessage(message) {
  if (!message) {
    return '';
  }
  return String(message)
    .replace(CONTAINER_STARTUP_FAILURE, PROGRAM_STARTUP_FAILURE)
    .replace(CONTAINER_EXIT_FAILURE, PROGRAM_STARTUP_FAILURE);
}

function getOperationRecordTypeText(optType, defaultText) {
  if (optType === 'ContainerExitError' && defaultText === '异常退出') {
    return '组件异常退出';
  }
  return defaultText;
}

function getOperationLogTooltipTitle({ defaultTitle, detail }) {
  if (!detail) {
    return defaultTitle;
  }
  if (defaultTitle === '查看日志') {
    return '请查看日志';
  }
  return defaultTitle;
}

function getOperationLogTooltipVisible(finalStatus, showByDefault = false) {
  if (finalStatus === '' || showByDefault) {
    return true;
  }
  return undefined;
}

function shouldShowOperationLogTooltipByDefault({
  status,
  canShowLog,
  hasShownFailureTip
}) {
  return status === 'failure' && canShowLog && !hasShownFailureTip;
}

module.exports = {
  getOperationLogTooltipTitle,
  getOperationLogTooltipVisible,
  getOperationRecordMessage,
  getOperationRecordTypeText,
  shouldShowOperationLogTooltipByDefault
};
